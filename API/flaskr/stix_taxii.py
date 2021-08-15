import functools
from logging import error
from sys import platform
from . import technique_mitigation_mapping, attack_layer, filters
from flask import (
        Blueprint, flash, g, redirect, render_template,
        request, session, url_for
)
from taxii2client.common import _to_json

from stix2 import TAXIICollectionSource, MemorySource, Filter, parse, serialization
from taxii2client.v20 import Collection
import json

bp = Blueprint('stix_taxii', __name__, url_prefix='/stix_taxii')

@bp.route('/generate', methods=["POST"])
def generate():
    if request.method == 'POST':
        request_data = request.get_json()
        domain = request_data['domain']
        groups = request_data['groups']
        tactics = request_data['tactics']
        malware = request_data['malware']
        platforms = request_data['platforms']
        sub_techniques = request_data['include_sub_technique']
        includeNonMappedT = request_data['includeNonMappedT']

        enterprise_accepted_tactics = ["Reconnaissance", "Resource Development", "Initial Access", "Execution", "Persistence",
                            "Privilege Escalation", "Defense Evasion", "Credential Access", "Discovery",
                            "Lateral Movement", "Collection", "Command and Control", "Exfiltration", "Impact"]
        enterprise_accepted_platforms = ["Linux", "macOS", "Windows", "Azure AD", "Office 365", "SaaS", "IaaS",
                                "Google Workspace", "PRE", "Network", "Containers"]

        mobile_accepted_tactics = ["Execution", "Command and Control", "Exfiltration", "Persistence", "Credential Access", "Impact", "Privilege Escalation", "Defense Evasion", "Initial Access", "Remote Service Effects", "Discovery", "Lateral Movement", "Collection", "Network Effects"]

        mobile_accepted_platforms = ["Android","iOS"]

        ics_accepted_tactics = ['Privilege Escalation', 'Impact', 'Discovery', 'Inhibit Response Function', 'Evasion', 'Initial Access', 'Execution', 'Lateral Movement', 'Collection', 'Persistence', 'Command and Control', 'Impair Process Control']
        ics_accepted_platforms = ["Field Controller/RTU/PLC/IED", "Safety Instrumented System/Protection Relay",
                            "Control Server", "Input/Output Server", "Windows", "Human-Machine Interface",
                            "Engineering Workstation", "Data Historian"]

        error = None

        if not domain:
                error += 'A domain is required'
        if domain not in ['enterprise_attack', 'mobile_attack', 'ics_attack']:
            error += 'An incorrect Domain has been passed: %s' % domain

        if domain == "enterprise_attack":
            accepted_tactics = enterprise_accepted_tactics
            accepted_platforms = enterprise_accepted_platforms
        elif domain == "mobile_attack":
            accepted_tactics = mobile_accepted_tactics
            accepted_platforms = mobile_accepted_platforms
        elif domain == "ics_attack":
            accepted_tactics = ics_accepted_tactics
            accepted_platforms = ics_accepted_platforms


        if not all(map(lambda v: v in accepted_tactics, tactics)):
            error += 'An incorrect Tactic has been submitted: %s' % tactics
        
        if not all(map(lambda v: v in accepted_platforms, platforms)):
            error += 'An incorrect Platform has been submitted: %s' % platforms

        if groups == [""] and malware == [""]:
            error += "At least one Malware or Group option must be selected"

        if error is None:
                data = technique_mitigation_mapping.main(domain, groups, malware, tactics, platforms, sub_techniques,includeNonMappedT)
                
                return data

    return error

#One Lambda function, the result of which must be sorted client side
@bp.route('/fetchAttackPatterns',methods=["POST"])
def fetchAttackPatterns():
    if request.method == "POST":
        requestData = request.get_json()
        domain = requestData["domain"]
        includeSub = requestData["includeSub"]
        platforms = requestData["platforms"]
        tactics = requestData["tactics"]
        source_map = {
        "enterprise_attack": "mitre-attack",
        "mobile_attack": "mitre-mobile-attack",
        "ics_attack": "mitre-ics-attack",
        }

        source_name = source_map[domain]

        collection_map = {
            "enterprise_attack": "95ecc380-afe9-11e4-9b6c-751b66dd541e",
            "mobile_attack": "2f669986-b40b-4423-b720-4396ca6a462b",
            "ics_attack": "02c3ef24-9cd4-48f3-a99f-b74ce24f1d34"
        }
        collection_url = "https://cti-taxii.mitre.org/stix/collections/" + collection_map[domain] + "/"
        collection = Collection(collection_url)
        taxii_ds = TAXIICollectionSource(collection)

        if source_name == "mitre-ics-attack":
            icsTactics = []
            for tactic in tactics:
                icsTactics.append(tactic+'-ics')
            tactics+=icsTactics
        
        filters = [
            Filter("type", "=", "attack-pattern"),
            Filter("external_references.source_name", "in", source_name),
            Filter("kill_chain_phases.phase_name", "in", [x.lower().replace(" ", "-") for x in tactics]),
            Filter("x_mitre_platforms", "in", platforms),
        ]

        if source_name == "mitre-attack":
            filters.append(Filter("x_mitre_is_subtechnique", "in", [True, False] if includeSub else [False]))

        allRelevantAttacks = remove_deprecated(taxii_ds.query(filters))
        return {"attackPatterns":[serialization.serialize(attack) for attack in allRelevantAttacks]}
        #The user must then sort out this information so it is ordered and remove deprecated stix client side (fairly easy through map function, compare if one is deprecated drop, )


#One Lambda function to fetch relevant relationships, it accept all malware/GroupIDS as one list and all the attack patterns
@bp.route('/filterAttackPatterns',methods=["POST"])
def filterAttackPatterns():
    filteredAttackP = []
    def includedMalwareThreat(attackPatternnJ):
        attackPattern = json.loads(attackPatternnJ)
        #fetch an in memory source most likely
        filters = [
            Filter("type", "=", "relationship"),
            Filter("target_ref", "=", attackPattern["id"]),
            Filter("relationship_type", "=", "uses"),
            Filter("source_ref", "in", groupMalwareID),
        ]
        relationships = taxii_ds.query(filters)
        if not relationships:
            if includeNonMappedT:
                filteredAttackP.append(attackPattern)
        else:
            filteredAttackP.append(attackPattern)
    if request.method == "POST":
        requestData = request.get_json()
        allAttackPatterns = requestData["attackPatterns"]
        groupMalwareID = requestData["malwareThreatIDs"]
        includeNonMappedT = requestData["includeNonMappedT"]
        domain = requestData["domain"]

        collection_map = {
            "enterprise_attack": "95ecc380-afe9-11e4-9b6c-751b66dd541e",
            "mobile_attack": "2f669986-b40b-4423-b720-4396ca6a462b",
            "ics_attack": "02c3ef24-9cd4-48f3-a99f-b74ce24f1d34"
        }
        collection_url = "https://cti-taxii.mitre.org/stix/collections/" + collection_map[domain] + "/"
        collection = Collection(collection_url)
        taxiiOnline = TAXIICollectionSource(collection)
        taxii_ds = MemorySource(stix_data=taxiiOnline.query())
        #Lazy function so we force evaluation
        for attackPattern in allAttackPatterns:
            includedMalwareThreat(attackPattern)
        return {"filteredAttackPatterns":filteredAttackP}

    





#One lambda function - Fetch Malware Threat IDS
@bp.route('/fetchMalwareGroupIDS',methods=["POST"])
def fetchMalwareGroupIDS():
    if request.method == "POST":
        requestData = request.get_json()
        threatGroupIDS = fetchMalwareGroup(requestData["domain"],requestData["threatNames"], "intrusion-set")
        threatMalwareIDS = fetchMalwareGroup(requestData["domain"],requestData["malwareNames"], "malware")
        dataObject = {"malwareGroupIDs":threatMalwareIDS+threatGroupIDS}
        return dataObject


def fetchMalwareGroup(domain, names, threatType):
    collection_map = {
            "enterprise_attack": "95ecc380-afe9-11e4-9b6c-751b66dd541e",
            "mobile_attack": "2f669986-b40b-4423-b720-4396ca6a462b",
            "ics_attack": "02c3ef24-9cd4-48f3-a99f-b74ce24f1d34"
        }
    collection_url = "https://cti-taxii.mitre.org/stix/collections/" + collection_map[domain] + "/"
    collection = Collection(collection_url)
    taxii_ds = TAXIICollectionSource(collection)

    filters = [
        Filter("type", "in", threatType),
        Filter("name", "in", names),
    ]
    
    results = taxii_ds.query(filters)
    IDs = [malwareGroup.get("id") for malwareGroup in results]

    return IDs



#One Lambda function
@bp.route('/attack_layer',methods=["GET"])
def generate_attack_layer():
    """
    Accepting a list of JSON Objects
    """
    error = None
    if request.method == "GET":
        request_data = json.loads(request.args.get("layer"))
        scored_techniques = request_data['techniques'] #will contain tid, tactics, comment, score
        domain = request_data['domain'] #Must be a string
        platforms = request_data['platforms'] #must be a list of platforms
        """
        Error checking is required on the inputs
        """
        if error is None:
            json_layer = attack_layer.create_attack_layer(domain,platforms,scored_techniques)
            return json_layer
    return error


#Generating complete object for use, send an api request in JS that maps over the compelte list and sets to storage
@bp.route('/returnCompelteObject',methods=["POST"])
def returnCompelteObject():
    if request.method == "POST":
        request_data = request.get_json()
        attackPatterns = request_data["attackPatterns"]
        domain = request_data["domain"]
        
        collection_map = {
            "enterprise_attack": "95ecc380-afe9-11e4-9b6c-751b66dd541e",
            "mobile_attack": "2f669986-b40b-4423-b720-4396ca6a462b",
            "ics_attack": "02c3ef24-9cd4-48f3-a99f-b74ce24f1d34"
        }
        collection_url = "https://cti-taxii.mitre.org/stix/collections/" + collection_map[domain] + "/"
        collection = Collection(collection_url)
        taxiiOnline = TAXIICollectionSource(collection)
        data_source = MemorySource(stix_data=taxiiOnline.query())

        relationship_type = "mitigates"
        type_filter = "course-of-action"

        source_map = {
            "enterprise_attack": "mitre-attack",
            "mobile_attack": "mitre-mobile-attack",
            "ics_attack": "mitre-ics-attack",
        }
        source_name = source_map[domain]
        detection_id = 1
        json_data = []
        id = 1

        for attack_pattern in attackPatterns:
            technique = {}
            mitigations = []
            tactics = []
            foundDeprecatedMitigation = False
            
            for phase in attack_pattern["kill_chain_phases"]:
                tactics.append(phase["phase_name"])

            technique["tid"] = grab_external_id(attack_pattern, source_name)
            technique["description"] = attack_pattern["description"]
            technique["technique_name"] = attack_pattern["name"]
            technique["tactic"] = tactics
            technique["score"] = 0
            technique["realWorld"] = fetchRealWorld(data_source,attack_pattern["id"])

            relationships = filter_for_term_relationships(data_source, relationship_type, attack_pattern["id"])

            if not relationships:
                if not foundDeprecatedMitigation:
                    foundDeprecatedMitigation = True
                    mitigations.append(fetch_alternate_detection(attack_pattern, detection_id))
                    detection_id+=1
            for relationship in relationships:
                stix_results = filter_by_type_and_id(data_source, type_filter, relationship["source_ref"], source_name)
                #This is then fethcning the exact mitigation
                if stix_results:
                    mitigations.append({
                                        "mid" : grab_external_id(stix_results[0], source_name), 
                                        "mitigation_name" : stix_results[0]["name"],
                                        "description" : escape_chars(stix_results[0]["description"]),
                                        "application" : escape_chars(relationship["description"]),
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
            json_data.append(technique)
    return {"filteredAttackPatterns":json_data}

def fetch_alternate_detection(attack_pattern, detection_id):
    return  {
            "mid" : "D%d" % detection_id, 
            "mitigation_name" : "This mitigation has been deprecated/revoked or the type of attack technique cannot be easily mitigated with preventive controls since it is based on the abuse of system features.",
            "description" : escape_chars("Detection Suggestions: %s" % attack_pattern["x_mitre_detection"]) if 'x_mitre_detection' in attack_pattern else "No alternate detection mechanism exists.",
            "application" : "N/A",
            "notes": "",
            "confidenceScore": 0,
            "impactLevel": 0
    }


def grab_external_id(stix_object, source_name):
    """Grab external id from STIX2 object"""
    for external_reference in stix_object["external_references"]:
        if external_reference["source_name"] == source_name:
            return external_reference["external_id"]

def fetchRealWorld(data_source, attackPatternID):
    
    realWorldExamples = []

    filters = [
        Filter("relationship_type", "=", "uses"),
        Filter("target_ref", "=", attackPatternID),
    ]
    relationships = data_source.query(filters)

    for relationship in relationships:
        if relationship["source_ref"].startswith("malware") or relationship["source_ref"].startswith("tool"):
            evidence = []
            description = relationship["description"]
            if hasattr(relationship,"external_references"):
                for source in relationship["external_references"]:
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

#Separate LAMBDA
@bp.route('/tactic-groups', methods=["POST"])
def groupsTacticList():
    if request.method == 'POST':
        request_data = request.get_json()
        domain = request_data['domain']

        error = None

        if not domain:
                error = 'A domain is required'
        if domain not in ['enterprise_attack', 'mobile_attack', 'ics_attack']:
            error = 'An incorrect Domain has been passed'

        if error is None:
                data = filters.groupTacticNames(domain)
                return data

    return error