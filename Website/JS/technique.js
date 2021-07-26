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

    //Technique Information
    var techniqueHeader = document.createElement("h2");
    techniqueHeader.innerHTML = techniqueName + " (" + tid +")";
    
    var tacticsListinfo = document.createElement("p");
    tacticsListinfo.innerHTML = "Tactics found in: " + tactic

    var description = document.createElement("p");
    description.innerHTML = techniqueDescription;

    document.getElementById("technique-information").append(techniqueHeader, tacticsListinfo, description);

    displayMitigations(mitigations);

}

function displayMitigations(mitigations) {
    for (let i =0; i < mitigations.length; i++) {
        let mid = mitigations[i].mid;
        let mitigation_name = mitigations[i].mitigation_name;
        let description = mitigations[i].description;
        let application = mitigations[i].application;

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
        notesStructure.append(label, userInput);


        var confidenceStructure = document.createElement("div");
        confidenceStructure.className = "confidence";
        label = document.createElement("label");
        label.innerHTML = "Confidence Score";
        confidenceForm = document.createElement("select");
        confidenceForm.className = "confidence-score";
        confidenceForm.size = "1";
        
        for (let i = 0; i <= 10; i+=2){
            var option = document.createElement("option");
            option.value = i;
            option.innerHTML = i;
            confidenceForm.appendChild(option);
        }
        confidenceStructure.append(label,confidenceForm);
        

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

function nextTechnique(){
    var currentTechnique = getCookie("currentTechnique");
    var nextTechnique = increDecreString(currentTechnique, "increment");

    if (localStorage.getItem(nextTechnique) == null){
        console.log("Hello")
    }
    else{
        document.cookie = "currentTechnique=" + nextTechnique;
        window.location.reload();
    }
}

function previousTechnique(){
    var currentTechnique = getCookie("currentTechnique");
    var previousTechnique = increDecreString(currentTechnique, "decrement");

    if (localStorage.getItem(nextTechnique) == null){
        console.log("Hello")
    }
    else{
        document.cookie = "currentTechnique=" + nextTechnique;
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