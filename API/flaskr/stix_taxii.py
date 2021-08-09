import functools
from logging import error
from sys import platform
from . import technique_mitigation_mapping, attack_layer, filters
from flask import (
        Blueprint, flash, g, redirect, render_template,
        request, session, url_for
)
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
            print(accepted_tactics)
            print(tactics)
            error += 'An incorrect Tactic has been submitted: %s' % tactics
        
        if not all(map(lambda v: v in accepted_platforms, platforms)):
            error += 'An incorrect Platform has been submitted: %s' % platforms

        if groups == [""] and malware == [""]:
            error += "At least one Malware or Group option must be selected"

        if error is None:
                data = technique_mitigation_mapping.main(domain, groups, malware, tactics, platforms, sub_techniques,includeNonMappedT)
                
                return data

    return error

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