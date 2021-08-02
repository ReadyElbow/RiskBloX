function getCookie(name){
    var re = new RegExp(name += "=([^;]+)");
    var value = re.exec(document.cookie);
    return (value != null) ? unescape(value[1]) : null;
}

function restart(){
    localStorage.clear();
    window.location.replace("filters.html");
}

function loadSession(){
    //This needs fixing
    var requiredCookies = ['currentTechnique', 'subTechnique', 'platforms', 'groups', 'tactics', 'domain'];
    console.log(requiredCookies);
    requiredCookies.map(function(value){
        return getCookie(value);
    })

    if (requiredCookies.includes(null) == true){
        alert("A valid Session does not exist. Please select the Restart option.")
    }
    else{
        window.location.replace("technique-forms.html")
    }
}

function loadJSON(){
    localStorage.clear;
    userInput = document.getElementById("formFile").files[0];

    const reader = new FileReader();
    var userFile = "";

    reader.onload = function(event) {
        let userFile = JSON.parse(event.target.result);
        console.log(userFile);
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
