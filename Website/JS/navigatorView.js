function getCookie(name){
    var re = new RegExp(name += "=([^;]+)");
    var value = re.exec(document.cookie);
    return (value != null) ? unescape(value[1]) : null;
}

function createView(){
    navigator = document.createElement("iframe")
    url = "https://mitre-attack.github.io/attack-navigator/"

    var domain = getCookie("domain");

    domainMap = {"enterprise_attack":"enterprise",
                 "mobile_attack": "mobile"}

    urlDomain = domainMap[domain] + "/"
    
    layer = JSON.parse(localStorage.getItem("attackLayer"));

    completeURL = url + domain + "#layerURL=" + layer;
    console.log(completeURL);
    https://mitre-attack.github.io/attack-navigator/enterprise_attack#layerURL=[object

    navigator.src = completeURL;
    navigator.width = "1000";
    navigator.height = "500";

    document.getElementById("navigator").append(navigator);
    
}