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
        '''
        This is directly for when forms are submitted
        domain = request.form['domain']
        groups = request.form['groups']
        tactics = request.form['tactics']
        platforms = request.form['platforms']
        sub_techniques = request.form['include_sub_technique']
        '''
        request_data = request.get_json()
        domain = request_data['domain']
        groups = request_data['groups']
        tactics = request_data['tactics']
        platforms = request_data['platforms']
        sub_techniques = eval(request_data['include_sub_technique'])
        accepted_tactics = ["Reconnaissance", "Resource Development", "Initial Access", "Execution", "Persistence",
                            "Privilege Escalation", "Defense Evasion", "Credential Access", "Discovery",
                            "Lateral Movement", "Collection", "Command and Control", "Exfiltration", "Impact"]
        accepted_platforms = ["Linux", "macOS", "Windows", "Azure AD", "Office 365", "SaaS", "IaaS",
                                "Google Workspace", "PRE", "Network", "Containers"]

        error = None

        if not domain:
                error = 'A domain is required'
        if domain not in ['enterprise_attack', 'mobile_attack']:
            error = 'An incorrect Domain has been passed: %s' % domain

        if tactics == ["All"]:
            tactics = accepted_tactics
        elif not all(map(lambda v: v in accepted_tactics, tactics)):
            error = 'An incorrect Tactic has been submitted: %s' % tactics
        
        if platforms == ["All"]:
            platforms = accepted_platforms
        elif not all(map(lambda v: v in accepted_platforms, platforms)):
            error = 'An incorrect Platform has been submitted: %s' % platforms

        if error is None:
                data = technique_mitigation_mapping.main(domain, groups, tactics, platforms, sub_techniques)
                
                return data

    return error

@bp.route('/attack_layer',methods=["POST"])
def generate_attack_layer():
    """
    Accepting a list of JSON Objects
    """
    error = None
    if request.method == "POST":
        request_data = request.get_json()
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
        if domain not in ['enterprise_attack', 'mobile_attack']:
            error = 'An incorrect Domain has been passed'

        if error is None:
                data = filters.groupTacticNames(domain)
                return data

    return error