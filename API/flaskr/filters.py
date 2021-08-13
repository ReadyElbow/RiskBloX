from taxii2client.common import _to_json
from stix2 import TAXIICollectionSource, MemorySource, Filter
from taxii2client.v20 import Collection
import json
from multiprocessing import Process,Pipe

jsonFilter = {}

def groupTacticNames(collection_name):
    '''
    Downloads latest Enterprise or Mobile ATT&CK content from MITRE TAXII Server.
    @param collection_name: There are two JSON Files (that contain the techniques, mitigations
                            etc) Enterprise or Mobile
    @return:                Returns an In-Memory Source Location to the downloaded JSON File
    '''

    #https://attackcti.com/playground/ICS_ATTACK_Exploration.html
    collection_map = {
        "enterprise_attack": "95ecc380-afe9-11e4-9b6c-751b66dd541e",
        "mobile_attack": "2f669986-b40b-4423-b720-4396ca6a462b",
        "ics_attack": "02c3ef24-9cd4-48f3-a99f-b74ce24f1d34"
    }
    collection_url = "https://cti-taxii.mitre.org/stix/collections/" + collection_map[collection_name] + "/"
    collection = Collection(collection_url)
    taxii_ds = TAXIICollectionSource(collection)

    filter_objs = {
          "groups": Filter("type", "=", "intrusion-set"),
          "tactics": Filter("type", "=", "x-mitre-tactic"),
          "malware": Filter("type", "in", ["malware","tool"]),
    }

    processes=[]
    parentConnections = []

    for key in filter_objs:
        parent_conn, child_conn = Pipe()
        parentConnections.append(parent_conn)

        childProcess = Process(target=fetchFilterInformation, args=(key, filter_objs[key], taxii_ds, child_conn,))
        processes.append(childProcess)
        childProcess.start()
        
    for process in processes:
        process.join()

    for parentConnection in parentConnections:
        tupleFilter = parentConnection.recv()
        jsonFilter[tupleFilter[0]] = tupleFilter[1]

    return jsonFilter

def fetchFilterInformation(key, dbFilter, taxii_ds, child_conn):
    names = []
    overallData = taxii_ds.query(dbFilter)
    child_conn.send((key, list(map(lambda x: x['name'], overallData))))
    child_conn.close()