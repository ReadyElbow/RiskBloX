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

    //Technique Information
    var techniqueHeader = document.createElement("h2");
    techniqueHeader.innerHTML = techniqueName + " (" + tid +")";
    
    var tacticsListinfo = document.createElement("p");
    tacticsListinfo.innerHTML = "Tactics found in: " + tactic

    var description = document.createElement("p");
    description.innerHTML = techniqueDescription;

    document.getElementById("technique-score").innerHTML = score;
    document.getElementById("technique-details").append(techniqueHeader, tacticsListinfo, description);

    displayMitigations(mitigations);
}

function displayMitigations(mitigations) {
    for (let i =0; i < mitigations.length; i++) {
        let mid = mitigations[i].mid;
        let mitigation_name = mitigations[i].mitigation_name;
        let description = mitigations[i].description;
        let application = mitigations[i].application;
        let notes = mitigations[i].notes
        let confidenceScore = mitigations[i].confidenceScore
        let weighting = mitigations[i].weighting

        var mitigationInformation = document.createElement("h2");
        mitigationInformation = "Mitigation: " + mitigation_name +" (" + mid + ")";

        var mitigationStructure = document.createElement("div");
        mitigationStructure.className = "mitigation"

        var descriptionStructure = mitigationDetail("description", "Description", description);

        var applicationStructure = mitigationDetail("application", "Application", application);

        var notesStructure = document.createElement("div");
        notesStructure.className = "notes";
        let label = document.createElement("label");
        label.innerHTML = "Notes";
        let userInput = document.createElement("textarea");
        userInput.className = "textarea";
        userInput.cols = "50";
        userInput.rows = "15";
        userInput.innerHTML = notes;
        notesStructure.append(label, userInput);


        var confidenceStructure = document.createElement("div");
        var confidence = document.createElement("div");
        var weightingStructure = document.createElement("div");

        confidenceStructure.className = "confidenceStructure";
        confidenceLabel = document.createElement("label");
        confidenceLabel.innerHTML = "Confidence Score";
        confidenceForm = document.createElement("select");
        confidenceForm.className = "confidence-score";
        confidenceForm.onchange = updateScore;
        confidenceForm.size = "1";
        for (let i = 0; i <= 10; i+=2){
            var option = document.createElement("option");
            option.value = i;
            option.innerHTML = i;
            if (i==confidenceScore){
                option.selected = "selected";
            }
            confidenceForm.appendChild(option);
        }
        confidence.append(confidenceLabel,confidenceForm);
        
        weightingLabel = document.createElement("label");
        weightingLabel.innerHTML = "Weighting Percentage";weightingForm = document.createElement("select");
        weightingForm.className = "weighting";
        weightingForm.onchange = updateScore;
        weightingForm.size = "1";
        for (let i = 0; i <= 100; i+=10){
            var option = document.createElement("option");
            option.value = i;
            option.innerHTML = i;
            if (i == weighting){
                option.selected = "selected";
            }
            weightingForm.appendChild(option);
        }
        weightingStructure.append(weightingLabel, weightingForm);

        confidenceStructure.append(confidence, weightingStructure);
        

        mitigationStructure.append(descriptionStructure, applicationStructure, notesStructure, confidenceStructure);

        document.getElementById("mitigations").append(mitigationInformation, mitigationStructure);

    }
}

function mitigationDetail(classname, header, information){
    var Structure = document.createElement("div");
    Structure.className = classname;
    let heading = document.createElement("h1");
    heading.innerHTML = header;
    let paragraph = document.createElement("p");
    paragraph.innerHTML = information;
    Structure.append(heading,paragraph);
    return Structure
}

function updateScore(){
    //When a Mitigation Confidence Score is added call this and update the global Technique Score
    let scores = document.getElementsByClassName("confidence-score");
    let weightings = document.getElementsByClassName("weighting");
    let overallScore = 0;
    for (let i = 0; i < scores.length; i++) {
        let score = scores[i].value;
        let weighting = weightings[i].value;
        overallScore += (score*weighting);
    }
    document.getElementById("technique-score").innerHTML = (overallScore/100);
}


//Create a slider inside the confidence score div. We can create an internal flex grid based on columns. As a Beta just simply check and then alert the user to say wait it does not add up. Then later add dynamic functionality.

function nextTechnique(){
    var currentTechnique = getCookie("currentTechnique");
    updateStorage(currentTechnique);
    var nextTechnique = increDecreString(currentTechnique, "increment");

    if (localStorage.getItem(nextTechnique) == null){
        window.location.replace("navigatorView.html");
    }
    else{
        document.cookie = "currentTechnique=" + nextTechnique;
        window.location.reload();
    }

}

function updateStorage(currentTechnique){
    let confidenceScores = document.getElementsByClassName("confidence-score");
    let weightings = document.getElementsByClassName("weighting");
    let notes = document.getElementsByClassName("textarea");
    let overallScore = document.getElementById("technique-score");
    techniqueStorage = JSON.parse(localStorage.getItem(currentTechnique));

    techniqueStorage.score = parseFloat(overallScore.innerHTML);
    for (let i = 0; i < techniqueStorage.mitigations.length; i++) {
        techniqueStorage.mitigations[i].notes = notes[i].value;
        techniqueStorage.mitigations[i].weighting = parseInt(weightings[i].value);
        techniqueStorage.mitigations[i].confidenceScore = parseInt(confidenceScores[i].value);
    }
    localStorage.setItem(currentTechnique, JSON.stringify(techniqueStorage));
}

function previousTechnique(){
    
    var currentTechnique = getCookie("currentTechnique");
    updateStorage(currentTechnique);
    var previousTechnique = increDecreString(currentTechnique, "decrement");

    if (localStorage.getItem(previousTechnique) == null){
        console.log("Hello")
    }
    else{
        document.cookie = "currentTechnique=" + previousTechnique;
        window.location.reload();
    }
}


function increDecreString(str, type) {
    // Find the trailing number or it will match the empty string
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
