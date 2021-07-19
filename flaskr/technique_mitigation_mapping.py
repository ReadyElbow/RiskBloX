import tqdm
from stix2 import TAXIICollectionSource, MemorySource, Filter
from taxii2client.v20 import Collection



def build_taxii_source(collection_name):
    '''
    Downloads latest Enterprise or Mobile ATT&CK content from MITRE TAXII Server.
    @param collection_name: There are two JSON Files (that contain the techniques, mitigations
                            etc) Enterprise or Mobile
    @return:                Returns an In-Memory Source Location to the downloaded JSON File
    '''

    collection_map = {
        "enterprise_attack": "95ecc380-afe9-11e4-9b6c-751b66dd541e",
        "mobile_attack": "2f669986-b40b-4423-b720-4396ca6a462b"
    }
    collection_url = "https://cti-taxii.mitre.org/stix/collections/" + collection_map[collection_name] + "/"
    collection = Collection(collection_url)
    taxii_ds = TAXIICollectionSource(collection)

    # Create an in-memory source (to prevent multiple web requests)
    return MemorySource(stix_data=taxii_ds.query())


def get_techniques(data_source, source_name, groups, tactics, platforms, include_sub_tech):
    '''
    Applies base filters needed to isolate all stored attack patterns in the
    JSON STIX Data. The user can apply additional filters to narrow down the
    returned Attack Patterns.
    @param data_source:         The In-Memory Stix Data returned by build_taxii_source
    @param source_name:         The attribute that distinguishs between Mobile and
                                Enterprise Attacks
    @param technique_source:    A CLI Parameter defining if the User would like to 
                                further filter the Attack Patterns by Threat Group,
                                Tactic or Platform
    @param include_sub_tech:    Optional Parameter passed in CLI to include
                                or not include Sub-Techniques
    @return:                    Returns a list of JSON Objects where each Object represents 
                                a single Attack Pattern. This is then used to find relationships
                                linking it to Mitigations
    '''
    """Filters data source by attack-pattern which extracts all ATT&CK Techniques"""
    filters = [
        Filter("type", "=", "attack-pattern"),
        Filter("external_references.source_name", "=", source_name),
        Filter("x_mitre_is_subtechnique", "in", [True, False] if include_sub_tech else [False]),
    ]


    if tactics:
        filters.append(Filter("kill_chain_phases.phase_name", "in", [x.lower().replace(" ", "-") for x in
                                                                        tactics]))

    if platforms:
        filters.append(
            Filter("x_mitre_platforms", "in", platforms))

    if groups:
        group_ids = fetch_groups(data_source, groups)
        ''' 
        We make sure that the user supplied information has fetched an associated group ID before filtering to avoid incorrect 
        execution later.
        '''
        if group_ids:
            filters.append(Filter("id", "in", group_ids))
    results = data_source.query(filters)
    return remove_deprecated(results)


def fetch_groups(data_source, user_input):
    '''
    A function used in get_techniques() to reduce the amount of redundant code.
    To map the Threat Group to Attack Patterns two queries must be made. One to
    return all the STIX Objects that are related to the supplied Group Name(s)
    which are then parsed to fetch the Group ID (intrusion-set--....). 
    A second is required to fetch all the relationships associated with that
    group which will map the Group ID to multiple attack pattern IDs.

    @param data_source: The In-Memory Stix Data returned by build_taxii_source
    @param user_input:  List of supplied Threat Groups given by the User
    @return:            Returns a list containing the Attack Pattern IDs based 
                        off the supplied Threat Group names
    '''
    filters = [
        Filter("type", "=", "intrusion-set"),
        Filter("name", "in", user_input),
    ]
    results = data_source.query(filters)
    groupIDs = [group.get("id") for group in results]
    filters_attack_ids = [
        Filter("source_ref", "in", groupIDs),
        Filter("relationship_type", "=", "uses"),
    ]
    return [attack.get("target_ref") for attack in data_source.query(filters_attack_ids)]


def filter_for_term_relationships(src, relationship_type, object_id, target=True):
    """Filters data source by type, relationship_type and source or target"""
    filters = [
        Filter("type", "=", "relationship"),
        Filter("relationship_type", "=", relationship_type),
    ]
    if target:
        filters.append(Filter("target_ref", "=", object_id))
    else:
        filters.append(Filter("source_ref", "=", object_id))

    results = src.query(filters)
    return remove_deprecated(results)


def filter_by_type_and_id(src, object_type, object_id, source_name):
    """Filters data source by id and type"""
    filters = [
        Filter("type", "=", object_type),
        Filter("id", "=", object_id),
        Filter("external_references.source_name", "=", source_name),
    ]
    results = src.query(filters)
    return remove_deprecated(results)


def grab_external_id(stix_object, source_name):
    """Grab external id from STIX2 object"""
    for external_reference in stix_object.get("external_references", []):
        if external_reference.get("source_name") == source_name:
            return external_reference["external_id"]


def remove_deprecated(stix_objects):
    '''
    Some Stix Objects have been revoked/deprecated yet still remain in the 
    STIX Json Object. These are removed using this function by searching
    for specific attributes.
    .get() is used because the property may not be present in the JSON data. 
    The default is False if the property is not set.

    @param stix_objects:    STIX Object
    @return:                Removes deprecated/revoked Stix Objects
    '''
    return list(
        filter(
            lambda x: x.get("x_mitre_deprecated", False) is False and x.get("revoked", False) is False,
            stix_objects
        )
    )


def escape_chars(a_string):
    """Some characters create problems when written to file"""
    return a_string.translate(str.maketrans({
        "\n": r"",
    }))


def do_mapping(data_source, relationship_type, type_filter, source_name, groups, tactics, platforms, include_sub_tech):
    '''
    Used to find the associated mitigations from the attack patterns generated by get_techniques()
    For each attack_pattern a search in the relationships is used to determine if any exist. If there
    are none it indicates that they may have been removed and instead a detection mechansism is fetched
    as an alternative through fetch_alternate_detection()

    Sometimes a relationship is found to a mitigation but this mitigation has been deprecated or revoked 
    so in this instance fetch_alternate_detection() is used again.

    @param data_source:         The In-Memory Stix Data returned by build_taxii_source
    @param relationship_type:   Static value defined as "mitigates" which is used to filter the relationships
    @param type_filter:         Static value defiend as "course-of-action"
    @param source_name:         Enterprise or Mobile Mitigations
    @param technique_source:    Enterprise or Mobile Attack Techniques
    @param include_sub_tech:    Boolean Value supplied as a parameter
    @return:
    '''

    detection_id = 1
    
    all_attack_patterns = get_techniques(data_source, source_name, groups, tactics, platforms, include_sub_tech)
    writable_results = []

    for attack_pattern in tqdm.tqdm(all_attack_patterns, desc="parsing data for techniques"):

        tactics = []
        for phase in attack_pattern.kill_chain_phases:
            tactics.append(phase.phase_name)
        
        relationships = filter_for_term_relationships(data_source, relationship_type, attack_pattern.id)

        if not relationships:
            writable_results.append(fetch_alternate_detection(attack_pattern,source_name, tactics, detection_id))
            detection_id+=1

        for relationship in relationships:
            stix_results = filter_by_type_and_id(data_source, type_filter, relationship.source_ref, source_name)
            if stix_results:
                row_data = [
                    grab_external_id(attack_pattern, source_name), 
                    attack_pattern.name,
                    tactics,
                    grab_external_id(stix_results[0], source_name), 
                    stix_results[0].name,
                    escape_chars(stix_results[0].description), 
                    escape_chars(relationship.description),
                ]

            else:
                row_data = fetch_alternate_detection(attack_pattern,source_name, tactics, detection_id)
                detection_id +=1
            writable_results.append(row_data)

    return writable_results

def fetch_alternate_detection(attack_pattern, source_name, tactics, detection_id):
    row_data = [
                    grab_external_id(attack_pattern, source_name), 
                    attack_pattern.name,
                    tactics,
                    "D%d" % detection_id, 
                    "This mitigation has been revoked or deprecated.",
                    escape_chars("Detection Suggestions: %s" % attack_pattern.x_mitre_detection),
                    "N/A",
                ]
    return row_data

def main(domain, groups, tactics, platforms, sub_techniques):
    data_source = build_taxii_source(domain)

    source_map = {
        "enterprise_attack": "mitre-attack",
        "mobile_attack": "mitre-mobile-attack",
    }

    source_name = source_map[domain]
    technique_source = tactics

    return do_mapping(data_source, "mitigates", "course-of-action", source_name, groups, tactics, platforms, sub_techniques)
    