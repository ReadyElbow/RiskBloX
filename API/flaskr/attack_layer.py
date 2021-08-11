from os import path
import json
import re
import secrets
import string


def create_attack_layer(domain, platforms, data):

    '''
    Takes the information stored in the Excel File to generate a compatible JSON Attack Layer.
    @param filters: A list of filters the user applied when searching for Techniques/Mitigations.
                    These are captured so they can be refelcted where possible in the Navigator.
    @param data:    The following rows containing parsed data
    @return:        Returns a JSON Attack Layer
    '''

    ATTACK_VERSION = "9"
    LAYER_VERSION = "4.2"
    NAV_VERSION = "4.3"
    NAME = "Technique Protection"
    DESCRIPTION = ""
    DOMAIN = domain.replace('_', '-')

    layer_json = {
        "name": NAME,
        "versions": {
            "attack": ATTACK_VERSION,
            "navigator": NAV_VERSION,
            "layer": LAYER_VERSION
        },
        "domain": DOMAIN,
        "description": DESCRIPTION,
        "filters": {
            "platforms": platforms
        },
        "sorting": 0,
        "layout": {
            "layout": "side",
            "aggregateFunction": "average",
            "showID": False,
            "showName": True,
            "showAggregateScores": False,
            "countUnscored": False
        },
        "hideDisabled": False,
        "techniques": [],
        "gradient": {},
        "legendItems": [],
        "metadata": [],
        "showTacticRowBackground": False,
        "tacticRowBackground": "#dddddd",
        "selectTechniquesAcrossTactics": True,
        "selectSubtechniquesWithParent": False
    }
    for row in data:
        for tactic in row["tactics"]:
            escaped = row["comment"].translate(str.maketrans({
                                        "-":  r"\-",
                                        "\\": r"\\",
                                        "&":  r"",
                                        "%":  ""}))
            technique = {
                "techniqueID": row["tid"],
                "tactic": tactic,
                "score": 0 if row["score"] == '' else float(row["score"]),
                "color": "",
                "comment": escaped if re.search('\w+',row["comment"]) else "",
                "enabled": True,
                "metadata": [],
                "showSubtechniques": False
            }

            layer_json["techniques"].append(technique)

    layer_json["gradient"] = {
        "colors": [
			"#ff6666",
			"#ffe766",
			"#8ec843"
		],
        "minValue": 0,
        "maxValue": 100
    }

    return  json.dumps(layer_json, indent=8)
