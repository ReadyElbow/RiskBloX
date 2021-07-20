import functools
from logging import error
from sys import platform
from . import technique_mitigation_mapping, attack_layer
from flask import (
        Blueprint, flash, g, redirect, render_template,
        request, session, url_for
)
import json

bp = Blueprint('stix_taxii', __name__, url_prefix='/stix_taxii')

@bp.route('/generate', methods=('POST'))
def generate():
    if request.method == 'POST':
            domain = request.form['domain']
            groups = request.form['groups']
            tactics = request.form['tactics']
            platforms = request.form['platforms']
            sub_techniques = request.form['include_sub_technique']

            accepted_tactics = ["Reconnaissance", "Resource Development", "Initial Access", "Execution", "Persistence",
                                "Privilege Escalation", "Defense Evasion", "Credential Access", "Discovery",
                                "Lateral Movement", "Collection", "Command and Control", "Exfiltration", "Impact"]
            accepted_platforms = ["Linux", "macOS", "Windows", "Azure AD", "Office 365", "SaaS", "IaaS",
                                    "Google Workspace", "PRE", "Network", "Containers"]

            error = None

            if not domain:
                    error = 'A domain is required'
            if domain not in ['enterprise', 'mobile']:
                error = 'An incorrect Domain has been passed'

            if not all(map(lambda v: v in accepted_tactics, tactics)):
                error = 'An incorrect Tactic has been submitted'
            if not all(map(lambda v: v in accepted_platforms, platforms)):
                error = 'An incorrect Platform has been submitted'

            if error is None:
                    data = technique_mitigation_mapping.main(domain, groups, tactics, platforms, sub_techniques)
                    
                    return data

    return error

@bp.route('/attack_layer',methods=('POST'))
def attack_layer():
    """
    Accepting a list of JSON Objects
    """
    if request.method == "POST":
        scored_techniques = request.form['techniques'] #will contain tid, tactics, comment, score
        domain = request.form['domain'] #Must be a string
        platforms = request.form['platforms'] #must be a list of platforms

        """
        Error checking is required on the inputs
        """
        if error is None:
            json_layer = attack_layer.create_attack_layer(domain,platforms,scored_techniques)
            return json_layer
    return error


