import argparse
from flaskr.stix_taxii import attack_layer
import json
import re


def create_attack_layer(filters, data):
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
    DOMAIN = filters[0].replace('_', '-')

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
            "platforms": filters[1].split(',')
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
    for index, row in data.iterrows():

        for tactic in row[1].split(","):
            escaped = row[2].translate(str.maketrans({"-":  r"\-",
                                          "]":  r"\]",
                                          "\\": r"\\",
                                          "^":  r"\^",
                                          "$":  r"\$",
                                          "*":  r"\*",
                                          ".":  r"\."}))
            technique = {
                "techniqueID": row[0],
                "tactic": tactic,
                "score": 0 if row[3] == '' else float(row[3]),
                "color": "",
                "comment": escaped if re.search('\w+',row[2]) else "",
                "enabled": True,
                "metadata": [],
                "showSubtechniques": False
            }

            layer_json["techniques"].append(technique)

    layer_json["gradient"] = {
        "colors": [
            "#ff6666",
            "##00ff00"
        ],
        "minValue": 0,
        "maxValue": max([technique["score"] for technique in layer_json["techniques"]])
    }


    json.dump(layer_json, open("attack_layer.json", 'w'), indent=8)

    print("The Attack Layer has been successfully generated. You can now import it "
          "into the Mitre ATT&CK Navigator. The Attack JSON Layer is called attack_layer.json")


def generate_Dataframe(input=None):
    '''
    Parsing of a filled out Technique Mitigation File to capture relevant data
    such as Notes and Scores
    @param input:   Input File Name if different from its default
    @return:        Return two Pandas Dataframes containing parsed data
    '''

    xlsx = pd.ExcelFile("technique_mitigations.xlsx" if not input else input)
    df = pd.read_excel(xlsx, "Sheet1", header=None,engine=None)

    filters = df.iloc[0, :].drop([0, 2, 4, 5, 6, 7, 8, 9, 10, 11]).reset_index(drop=True)
    data = df.iloc[2:, :].dropna(how="all").fillna(" ").drop(columns=[1, 3, 4, 5, 6, 7, 9, 10]).reset_index(drop=True)

    data.columns = df.iloc[1, :].drop([1, 3, 4, 5, 6, 7, 9, 10])
    updated_notes = (data.groupby('TID')['Notes'].apply('\n\n'.join).reset_index(drop=True))
    updated_notes = updated_notes.astype(str)

    data = data.drop_duplicates(subset='TID').reset_index(drop=True)
    data['Notes'] = updated_notes
    data.iloc[:, 3] = data.iloc[:, 3].apply(lambda x: x if isinstance(x,int) else 0)
    return filters, data


if __name__ == "__main__":
    filters, data = generate_Dataframe(args.input)
    main(filters, data)
