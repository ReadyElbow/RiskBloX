function getCookie(name){
    var re = new RegExp(name += "=([^;]+)");
    var value = re.exec(document.cookie);
    return (value != null) ? unescape(value[1]) : null;
}


function fetchTechnique(){
    var currentTechnique = getCookie("currentTechnique");

    var technique = JSON.parse(localStorage.getItem(currentTechnique));
    var mitigations = technique.mitigations;
    var tactic = technique.tactic;
    var techniqueName = technique.technique_name;
    var techniqueDescription = technique.description
    var tid = technique.tid;
    var score = technique.score;

    var previousTechnique = increDecreString("decrement");

    if (localStorage.getItem(previousTechnique) == null){
        backBtn = document.getElementById("back");
        backBtn.hidden = true;
    }
    //Technique Information
    var techniqueHeader = document.createElement("h1");
    techniqueLink = document.createElement('a');
    techniqueLink.setAttribute('href', "https://attack.mitre.org/techniques/" + tid);

    techniqueHeader.appendChild(techniqueLink);
    techniqueHeader.innerHTML = "Technique: " + techniqueName + " (" + tid +")";
    
    var techniqueScoreHeader = document.createElement("h2");
    techniqueScoreHeader = "Threat Score: "
    var techniqueScore = document.createElement("h2");
    techniqueScore.id = "overallScore"
    techniqueScore.innerHTML = score;
    
    document.getElementById("technique-header").append(techniqueHeader, techniqueScoreHeader, techniqueScore);


    var techniqueCardBody = document.createElement("card-body");

    var tacticsListinfo = document.createElement("h5");
    tacticsListinfo.className = "card-title";
    tacticsListinfo.innerHTML = "Found in the tactics: " + tactic;

    var description = document.createElement("p");
    description.className = "card-text";
    description.innerHTML = techniqueDescription;
    techniqueCardBody.append(tacticsListinfo, description);
    document.getElementById("technique-details").append(techniqueCardBody);

    displayMitigations(mitigations);
}

function displayMitigations(mitigations) {

    for (let i =0; i < mitigations.length; i++) {
        let mitigationRow = document.createElement("tr")
        let mid = mitigations[i].mid;
        let mitigation_name = mitigations[i].mitigation_name;
        let description = mitigations[i].description;
        let application = mitigations[i].application;
        let notes = mitigations[i].notes
        let confidenceScore = mitigations[i].confidenceScore
        let implemented = mitigations[i].implemented

        var mitigationInformation = document.createElement("td");
        mitigationInformation.innerHTML = "Mitigation: " + mitigation_name +" (" + mid + ")";

        var descriptionStructure = mitigationDetail(description);

        var applicationStructure = mitigationDetail(application);

        var notesStructure = document.createElement("td");
        
        notesStructure.className = "notes";
        let userInput = document.createElement("textarea");
        userInput.className = "textarea";
        userInput.cols = "30";
        userInput.rows = "8";
        userInput.innerHTML = notes;
        

        var scoreInputs = document.createElement("td");


        var implementedQuestion = document.createElement("div");
        var input = document.createElement("input");
        input.className = "form-check-input implemented";
        input.type = "checkbox";
        input.id = "flexSwitchCheckDefault";
        input.checked = implemented;
        input.onchange = updateScore;
        var label = document.createElement("label");
        label.className = "form-check-label";
        label.for = "flexSwitchCheckDefault";
        label.innerHTML = "Implemented"
        


        //Checking to see if that mitigation alreay exists
        //We are only going to look to prefill when we have encountered a new Technique otherwise we will begin to overwrite previous work. Hence we check to see if we are at the furthest point of progression before adjusting user inputs
        if (getCookie("currentTechnique") == getCookie("furthestReachedT")){
            previousMitigation = localStorage.getItem(mid)
            if (previousMitigation != null){
                previousMitigation = JSON.parse(previousMitigation);
                userInput.innerHTML =previousMitigation.notes;
                input.checked = previousMitigation.implemented;
                confidenceScore = previousMitigation.confidenceScore;

            }
        }

        var confidence = document.createElement("select");
        confidence.className = "form-select form-select-lg mb-3 confidenceScore"
        confidence.onchange = updateScore;

        for (let i = 0; i <= 10; i+=2){
            var option = document.createElement("option");
            option.value = i;
            option.innerHTML = i;
            if (i==confidenceScore){
                option.selected = "selected";
            }
            confidence.appendChild(option);
        }



        implementedQuestion.append(input, label);
        notesStructure.append(userInput);
        scoreInputs.append(confidence, implementedQuestion);
     
        mitigationRow.append(mitigationInformation, descriptionStructure, applicationStructure, notesStructure, scoreInputs);

        document.getElementById("mitigations").append(mitigationRow);
        

    }
}

function mitigationDetail(information){
    let paragraph = document.createElement("td");
    paragraph.innerHTML = information;
    return paragraph
}

function updateScore(){
    //When a Mitigation Confidence Score is added call this and update the global Technique Score
    let scoresList = document.getElementsByClassName("confidenceScore");
    let implementedList = document.getElementsByClassName("implemented");
    let calculatedScore = 0;
    let penalty = 0;
    let numberOfMitigations = scoresList.length;

    let implementedMitigations = 0;
    for (let i = 0; i < numberOfMitigations; i++) {
        let score = scoresList[i].value;
        let implemented = implementedList[i].checked;

        if (implemented == false) {
            penalty += 1;
        }
        else{
            implementedMitigations+=1;
            calculatedScore += parseInt(score);
        }
    }
    
    function round(value, decimals) {
        return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
      }

    overallScore = (calculatedScore/implementedMitigations) - penalty;
    document.getElementById("overallScore").innerHTML = calculatedScore > 0 ? round(overallScore, 1) : 0;
};



//Create a slider inside the confidence score div. We can create an internal flex grid based on columns. As a Beta just simply check and then alert the user to say wait it does not add up. Then later add dynamic functionality.

function nextTechnique(){
    updateStorage();
    var nextTechnique = increDecreString("increment");

    if (localStorage.getItem(nextTechnique) == null){
        window.location.replace("navigatorView.html");
    }
    else{
        //Have we progressed onto a Fresh technique?
        if (getCookie("currentTechnique") == getCookie("furthestReachedT")){
            document.cookie = "furthestReachedT=" + increDecreString("increment");
        }
        document.cookie = "currentTechnique=" + nextTechnique;
        window.location.reload();
    }
}

function updateStorage(){
    var currentTechnique = getCookie("currentTechnique");


    let confidenceScores = document.getElementsByClassName("confidenceScore");
    let implemented = document.getElementsByClassName("implemented");
    let notes = document.getElementsByClassName("textarea");
    let overallScore = document.getElementById("overallScore");
    techniqueStorage = JSON.parse(localStorage.getItem(currentTechnique));

    techniqueStorage.score = parseFloat(overallScore.innerHTML);
    for (let i = 0; i < techniqueStorage.mitigations.length; i++) {
        techniqueStorage.mitigations[i].notes = notes[i].value.replace(/[%&#]/g,"");
        techniqueStorage.mitigations[i].implemented = implemented[i].checked;
        techniqueStorage.mitigations[i].confidenceScore = parseInt(confidenceScores[i].value);

        //Prefill later mitigations --saving functionality
        
        let saveMitigation = {};
        saveMitigation.notes = notes[i].value.replace(/[%&#]/g,"");
        saveMitigation.confidenceScore = techniqueStorage.mitigations[i].confidenceScore = parseInt(confidenceScores[i].value);
        saveMitigation.implemented = implemented[i].checked;
        localStorage.setItem(techniqueStorage.mitigations[i].mid, JSON.stringify(saveMitigation));
    }
    localStorage.setItem(currentTechnique, JSON.stringify(techniqueStorage));
}

function previousTechnique(){
    updateStorage();
    var previousTechnique = increDecreString("decrement");
    document.cookie = "furthestReachedT=" + increDecreString("increment");
    document.cookie = "currentTechnique=" + previousTechnique;
    window.location.reload();
}

function increDecreString(type) {
    // Find the trailing number or it will match the empty string
    var str = getCookie("currentTechnique");
    var count = str.match(/\d*$/);

    // Take the substring up until where the integer was matched
    // Concatenate it to the matched count incremented by 1
    if (type == "increment"){
        return str.substr(0, count.index) + (++count[0]);
    }
    if (type == "decrement"){
        return str.substr(0, count.index) + (--count[0]);
    }
}


function saveProgress(){
    updateStorage();
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
