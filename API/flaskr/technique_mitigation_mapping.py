from taxii2client.common import _to_json
import tqdm
from stix2 import TAXIICollectionSource, MemorySource, Filter, parse
from taxii2client.v20 import Collection
import pandas as pd
import json


def build_taxii_source(collection_name):
    '''
    Downloads latest Enterprise or Mobile ATT&CK content from MITRE TAXII Server.
    @param collection_name: There are two JSON Files (that contain the techniques, mitigations
                            etc) Enterprise or Mobile
    @return:                Returns an In-Memory Source Location to the downloaded JSON File
    '''

    collection_map = {
        "enterprise_attack": "95ecc380-afe9-11e4-9b6c-751b66dd541e",
        "mobile_attack": "2f669986-b40b-4423-b720-4396ca6a462b",
        "ics_attack": "02c3ef24-9cd4-48f3-a99f-b74ce24f1d34"
    }
    collection_url = "https://cti-taxii.mitre.org/stix/collections/" + collection_map[collection_name] + "/"
    collection = Collection(collection_url)
    taxii_ds = TAXIICollectionSource(collection)

    # Create an in-memory source (to prevent multiple web requests)
    return MemorySource(stix_data=taxii_ds.query())


def get_techniques(data_source, source_name, groups, malwareTool, tactics, platforms, include_sub_tech,includeNonMappedT):
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
        Filter("external_references.source_name", "in", source_name),
    ]

    """
    Mobile Technique data does not store Sub-Techniques at the moment.
    If the data is analysed you can see that some of the Mobile Attack Patterns do include a x_mitre_is_subtechnique attribute whilst others do not. As all instances of x_mitre_is_subtechnique in Mobile are false it is simply excluded from initial filtering
    """
    if source_name == "mitre-attack":
        filters.append(Filter("x_mitre_is_subtechnique", "in", [True, False] if include_sub_tech else [False]))

    #Required because of poor structuring in Taxii DB
    if source_name == "mitre-ics-attack":
        icsTactics = []
        for tactic in tactics:
            icsTactics.append(tactic+'-ics')
        tactics+=icsTactics
    print(tactics)
        
    
    filters.append(Filter("kill_chain_phases.phase_name", "in", [x.lower().replace(" ", "-") for x in tactics]))

    filters.append(
        Filter("x_mitre_platforms", "in", platforms))

    groupMalwareIds = []
    if groups != [""]:
        groupMalwareIds += fetch_groups(data_source, groups, ["intrusion-set"])
    if malwareTool != [""]:
        groupMalwareIds += fetch_groups(data_source, malwareTool, ["malware","tool"])
    ''' 
    We make sure that the user supplied information has fetched an associated group ID before filtering to avoid incorrect 
    execution later.
    '''
    '''
    Some Techniques are not associated with a Group or Malware hence we must either include these or do not include them.
    Would null work instead 
    '''
    filteredAttackPatterns = []
    allAttackPatterns = sorted(data_source.query(filters), key=lambda x: techName(x, source_name))
    print(len(allAttackPatterns))
    for attackPattern in allAttackPatterns:
        filters = [
            Filter("type", "=", "relationship"),
            Filter("target_ref", "=", attackPattern.id),
            Filter("relationship_type", "=", "uses"),
            Filter("source_ref", "in", groupMalwareIds),
        ]
        relationships = data_source.query(filters)
        if not relationships:
            if includeNonMappedT:
                filteredAttackPatterns.append(attackPattern)
        else:
            filteredAttackPatterns.append(attackPattern)

    return remove_deprecated(filteredAttackPatterns)


def techName(x, source_name):
    externalRef = x.external_references
    for source in externalRef:
        if source["source_name"] == source_name:
            return source["external_id"]
        else:
            return "T1"
            



def fetch_groups(data_source, user_input, threatType):
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
        Filter("type", "in", threatType),
        Filter("name", "in", user_input),
    ]
    results = data_source.query(filters)
    IDs = [malwareGroup.get("id") for malwareGroup in results]

    return IDs


def fetchRealWorld(data_source, attackPatternID):
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
    realWorldExamples = []

    filters = [
        Filter("relationship_type", "=", "uses"),
        Filter("target_ref", "=", attackPatternID),
    ]
    relationships = data_source.query(filters)

    for relationship in relationships:
        if relationship.source_ref.startswith("malware") or relationship.source_ref.startswith("tool"):
            evidence = []
            description = relationship.description
            if hasattr(relationship,"external_references"):
                for source in relationship.external_references:
                    if hasattr(source,"url"):
                        realWorldExamples.append([description,source.url])
            else:
                realWorldExamples.append([description,""])
            

            # if not evidence:
            #     realWorldExamples.append(["",description])
            # else:
            #     realWorldExamples.append([evidence,description])
    return realWorldExamples


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


def do_mapping(data_source, relationship_type, type_filter, source_name, groups, malwareTool, tactics, platforms, include_sub_tech,includeNonMappedT):
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
    
    filteredAttackPatterns = get_techniques(data_source, source_name, groups, malwareTool, tactics, platforms, include_sub_tech,includeNonMappedT)
    json_data = {}
    id = 1


    for attack_pattern in filteredAttackPatterns:

        technique = {}
        mitigations = []
        tactics = []
        foundDeprecatedMitigation = False
        
        for phase in attack_pattern.kill_chain_phases:
            tactics.append(phase.phase_name)
        
        technique["tid"] = grab_external_id(attack_pattern, source_name)
        technique["description"] = attack_pattern.description
        technique["technique_name"] = attack_pattern.name
        technique["tactic"] = tactics
        technique["score"] = 0
        technique["realWorld"] = fetchRealWorld(data_source,attack_pattern.id)

        relationships = filter_for_term_relationships(data_source, relationship_type, attack_pattern.id)

        if not relationships:
            if not foundDeprecatedMitigation:
                foundDeprecatedMitigation = True
                mitigations.append(fetch_alternate_detection(attack_pattern, detection_id))
                detection_id+=1

        for relationship in relationships:
            stix_results = filter_by_type_and_id(data_source, type_filter, relationship.source_ref, source_name)
            if stix_results:
                mitigations.append({
                                    "mid" : grab_external_id(stix_results[0], source_name), 
                                    "mitigation_name" : stix_results[0].name,
                                    "description" : escape_chars(stix_results[0].description),
                                    "application" : escape_chars(relationship.description),
                                    "notes": "",
                                    "confidenceScore": 0,
                                    "impactLevel": 0
                                    })
            else:
                if not foundDeprecatedMitigation:
                    foundDeprecatedMitigation = True
                    mitigations.append(fetch_alternate_detection(attack_pattern, detection_id))
                    detection_id +=1

        technique["mitigations"] = mitigations
        json_data["T%s" % id] = technique
        id+=1
    return json_data

def fetch_alternate_detection(attack_pattern, detection_id):
    return  {
            "mid" : "D%d" % detection_id, 
            "mitigation_name" : "This mitigation has been deprecated/revoked or the type of attack technique cannot be easily mitigated with preventive controls since it is based on the abuse of system features.",
            "description" : escape_chars("Detection Suggestions: %s" % attack_pattern.x_mitre_detection) if 'x_mitre_detection' in attack_pattern else "No alternate detection mechanism exists.",
            "application" : "N/A",
            "notes": "",
            "confidenceScore": 0,
            "impactLevel": 0
    }


def main(domain, groups, malwareTool, tactics, platforms, sub_techniques,includeNonMappedT):
    data_source = build_taxii_source(domain)

    
    source_map = {
        "enterprise_attack": "mitre-attack",
        "mobile_attack": "mitre-mobile-attack",
        "ics_attack": "mitre-ics-attack",
    }

    source_name = source_map[domain]
    technique_source = tactics

    data = do_mapping(data_source, "mitigates", "course-of-action", source_name, groups, malwareTool, tactics, platforms, sub_techniques,includeNonMappedT)
    return data