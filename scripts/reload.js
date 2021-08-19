function getCookie(name){
    var re = new RegExp(name += "=([^;]+)");
    var value = re.exec(document.cookie);
    return (value != null) ? unescape(value[1]) : null;
}

function restart(){
    var userAuth = localStorage.getItem("userAuth");
    localStorage.clear();
    localStorage.setItem("userAuth", userAuth);
    window.location.replace("filter.html");
}

function loadSession(){
    //This needs fixing
    var requiredCookies = ['currentTechnique', 'subTechnique', 'platforms', 'groups', 'tactics', 'domain'];
    requiredCookies.map(function(value){
        return getCookie(value);
    })

    if (requiredCookies.includes(null) == true){
        alert("A valid Session does not exist. Please select the Restart option.");
    }
    else{
        window.location.replace("technique-forms.html");
    }
}

function loadJSON(){
    userAuth = localStorage.getItem("userAuth");
    localStorage.clear;
    localStorage.setItem("userAuth",userAuth);
    userInput = document.getElementById("formFile").files[0];

    const reader = new FileReader();

    reader.onload = function(event) {
        let userFile = JSON.parse(event.target.result);
        cookies = userFile["cookies"].split(";");
        techniques = userFile["techniques"];
        for (let i = 0; i < cookies.length; i++){
            document.cookie = cookies[i];
        }
        for (let [key, stringValue] of Object.entries(techniques)){
            localStorage.setItem(key, JSON.stringify(stringValue));
        }
        window.location.replace("technique-forms.html");
    }
    reader.readAsText(userInput);
    
}

function searchLocalStorage(cookie){
    return document.getCookie(cookie);

}
