function generateAttackLayerCall(){
    toPost = {}
    techniques = new Array(localStorage.length);
    var positionCounter = 0;
    for (let [key, stringValue] of Object.entries(localStorage)) {
        value = JSON.parse(stringValue);
        let tid = value.tid;
        let tactics = value.tactic;
        let score = value.score;
        var techniqueComment = "";
        var mitigations = value.mitigations;

        for (let [key, mitigation] of Object.entries(mitigations)){
            if (mitigation.notes != ""){
                techniqueComment += mitigation.mitigation_name + "(" +mitigation.mid + ") Notes: " + mitigation.notes + "\n\n";
            }
            
        }

        var technique = {};
        technique["tid"] = tid;
        technique["tactics"] = tactics;
        technique["score"] = score;
        technique["comment"] = techniqueComment;
        techniques[positionCounter] = technique;
        positionCounter++;
    };
    toPost["domain"] = getCookie("domain");
    toPost["platforms"] = getCookie("platforms").split(',');
    toPost["techniques"] = techniques;

    apiGetLayer = 'http://127.0.0.1:5000/stix_taxii/attack_layer?layer=' + JSON.stringify(toPost)


    var navigator = document.createElement("iframe");
    navigator.id = "navigatorIframe";
    url = "https://mitre-attack.github.io/attack-navigator/";
    var domain = getCookie("domain");
    domainMap = {"enterprise_attack":"enterprise",
                 "mobile_attack": "mobile"};
    urlDomain = domainMap[domain] + "/";
    
    completeURL = url + urlDomain + "#leave_site_dialog=false&header=false&legend=false&layerURL=" + apiGetLayer;
    
    navigator.setAttribute("src", completeURL);
    navigator.width = "1500px";
    navigator.height = "900px";
    document.getElementById("parentIframe").appendChild(navigator);
}



function getCookie(name){
    var re = new RegExp(name += "=([^;]+)");
    var value = re.exec(document.cookie);
    return (value != null) ? unescape(value[1]) : null;
}

function back(){
    window.location.replace("technique-forms.html");
}

function saveProgress(){;
    var savedJSON = {};
    savedJSON['cookies'] = document.cookie;
    techniques = {}
    for (let [key, stringValue] of Object.entries(localStorage)){
        techniques[key] = JSON.parse(stringValue);
    }
    savedJSON['techniques'] = techniques;
    download = document.createElement('a');

    const str = JSON.stringify(savedJSON);
    const bytes = new TextEncoder().encode(str);
    const blob = new Blob([bytes], {
        type: "application/json;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    download.href = url;
    download.download = "MitreTxASave.json";
    download.click();
}

function generateDocumentation(){
    document.getElementById("parentIframe").contentWindow.print();
    // window.frames["navIframe"].focus();
    // window.frames["navIframe"].print();

    // html2canvas(document.getElementById("navigator"), {
    //     allowTaint: true,
    //     useCORS: true,
    //   })
    //   .then(function (canvas) {
    //     let image = canvas.toDataURL("image/png", 0.5);
    //   })
    //   .catch((e) => {
    //     // Handle errors
    //     console.log(e);
    //   });
    // const doc = new jsPDF();
    // doc.addImage(document.getElementById("navigator"));
    // doc.save("MitreTxA-Report.pdf");
    
    //Not implemented due to technical difficulties with iFrame
      
}