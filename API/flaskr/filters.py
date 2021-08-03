from taxii2client.common import _to_json
import tqdm
from stix2 import TAXIICollectionSource, MemorySource, Filter
from taxii2client.v20 import Collection
import json


def groupTacticNames(collection_name):
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


    filter_objs = {
          "groups": Filter("type", "=", "intrusion-set"),
          "tactics": Filter("type", "=", "x-mitre-tactic"),
          "malware": Filter("type", "=", "malware"),
    }

    jsonFilter = {}
    for key in filter_objs:
        names = []
        overallData = taxii_ds.query(filter_objs[key])
        for data in overallData:
            names.append(data['name'])
        jsonFilter[key] = names
    return jsonFilter
