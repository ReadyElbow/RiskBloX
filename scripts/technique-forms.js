window.scoreCap = parseInt(localStorage.getItem("scoreLimit"));
window.impactThreshold = parseInt(localStorage.getItem("impactThreshold"));

function getCookie(name) {
    let re = new RegExp((name += "=([^;]+)"));
    let value = re.exec(document.cookie);
    return value != null ? unescape(value[1]) : null;
}

function fetchTechnique() {
    let currentTechnique = getCookie("currentTechnique");

    let technique = JSON.parse(localStorage.getItem(currentTechnique));
    let mitigations = technique.mitigations;
    let tactic = technique.tactic;
    let techniqueName = technique.technique_name;
    let techniqueDescription = technique.description;
    let tid = technique.tid;
    let score = technique.score;

    let realWorld = technique.realWorld;

    let previousTechnique = increDecreString("decrement");

    if (localStorage.getItem(previousTechnique) == null) {
        backBtn = document.getElementById("back");
        backBtn.hidden = true;
    }
    //Technique Information
    let techniqueHeader = document.createElement("h1");
    techniqueLink = document.createElement("a");
    techniqueLink.setAttribute(
        "href",
        "https://attack.mitre.org/techniques/" + tid
    );
    techniqueLink.target = "_blank";
    techniqueLinkIcon = document.createElement("i");
    techniqueLinkIcon.className = "fas fa-question-circle";
    techniqueLink.appendChild(techniqueLinkIcon);

    techniqueHeader.innerHTML =
        "Technique: " + techniqueName + " (" + tid + ")";
    techniqueHeader.appendChild(techniqueLink);

    let techniqueScoreHeader = document.createElement("h2");
    techniqueScoreHeader = "Risk Score: ";
    let techniqueScore = document.createElement("h2");
    techniqueScore.id = "overallScore";
    techniqueScore.innerHTML = score;

    document
        .getElementById("technique-header")
        .append(techniqueHeader, techniqueScoreHeader, techniqueScore);

    let techniqueCardBody = document.createElement("card-body");

    let tacticsListinfo = document.createElement("h5");
    tacticsListinfo.className = "card-title";
    tacticsListinfo.innerHTML = "Found in the tactics: " + tactic;

    let description = document.createElement("p");
    description.className = "card-text";
    description.innerHTML = techniqueDescription;
    techniqueCardBody.append(tacticsListinfo, description);
    document.getElementById("technique-details").append(techniqueCardBody);

    realWorldList = document.getElementById("examples");
    if (realWorld.length > 0) {
        for (i = 0; i < realWorld.length; i++) {
            listItem = document.createElement("li");
            listItem.innerHTML = realWorld[i][0] + "; " + realWorld[i][1];
            realWorldList.appendChild(listItem);
        }
    } else {
        listItem = document.createElement("p");
        listItem.innerHTML = "No Real-World examples exist";
        realWorldList.appendChild(listItem);
    }

    displayMitigations(mitigations);
}

function displayMitigations(mitigations) {
    for (let i = 0; i < mitigations.length; i++) {
        let mitigationRow = document.createElement("tr");
        let mid = mitigations[i].mid;
        let mitigation_name = mitigations[i].mitigation_name;
        let description = linkifyHtml(
            mitigations[i].description.replace(/\\/g, "-"),
            {
                format: function (value, type) {
                    return "Link";
                },
            }
        ).replace(/\).Monitor/g, "");
        let application = linkifyHtml(
            mitigations[i].application.replace(/\\/g, "-"),
            {
                format: function (value, type) {
                    return "Link";
                },
            }
        ).replace(/\).Monitor/g, "");
        let notes = mitigations[i].notes;
        var confidenceScore = mitigations[i].confidenceScore;
        var impactLevel = mitigations[i].impactLevel;

        mitigationLink = document.createElement("a");
        mitigationLink.setAttribute(
            "href",
            "https://attack.mitre.org/mitigations/" + mid
        );
        mitigationLink.target = "_blank";
        mitigationLinkIcon = document.createElement("i");
        mitigationLinkIcon.className = "fas fa-question-circle";
        mitigationLink.appendChild(mitigationLinkIcon);

        let mitigationInformation = document.createElement("td");
        mitigationInformation.innerHTML =
            "Mitigation: " + mitigation_name + " (" + mid + ") ";
        if (mid.startsWith("M")) {
            mitigationInformation.appendChild(mitigationLink);
        }

        let descriptionStructure = mitigationDetail(description);

        let applicationStructure = mitigationDetail(application);

        let notesStructure = document.createElement("td");

        notesStructure.className = "notes";
        let userInput = document.createElement("textarea");
        userInput.className = "textarea";
        userInput.innerHTML = notes;

        //Checking to see if that mitigation alreay exists
        //We are only going to look to prefill when we have encountered a new Technique otherwise we will begin to overwrite previous work. Hence we check to see if we are at the furthest point of progression before adjusting user inputs
        if (getCookie("currentTechnique") == getCookie("furthestReachedT")) {
            previousMitigation = localStorage.getItem(mid);
            if (previousMitigation != null) {
                previousMitigation = JSON.parse(previousMitigation);
                userInput.innerHTML = previousMitigation.notes;
                impactLevel.checked = previousMitigation.impactLevel;
                confidenceScore = previousMitigation.confidenceScore;
            }
        }
        let impactStructure = document.createElement("td");
        var impact = document.createElement("select");
        impact.className = "form-select form-select-sm mb-3 impactLevel";
        impact.onchange = updateScore;

        for (let i = 0; i <= 10; i += 2) {
            let option = document.createElement("option");
            option.value = i;
            option.innerHTML = i;
            if (i == impactLevel) {
                option.selected = "selected";
            }
            impact.appendChild(option);
        }

        confidenceStructure = document.createElement("td");

        var confidence = document.createElement("select");
        confidence.className =
            "form-select form-select-sm mb-3 confidenceScore";
        confidence.onchange = updateScore;

        for (let i = 0; i <= 100; i += 10) {
            let option = document.createElement("option");
            option.value = i;
            option.innerHTML = i;
            if (i == confidenceScore) {
                option.selected = "selected";
            }
            confidence.appendChild(option);
        }

        impactStructure.append(impact);
        confidenceStructure.append(confidence);
        notesStructure.append(userInput);

        mitigationRow.append(
            mitigationInformation,
            descriptionStructure,
            applicationStructure,
            notesStructure,
            impactStructure,
            confidenceStructure
        );

        document.getElementById("mitigations").append(mitigationRow);
    }
}

function mitigationDetail(information) {
    let paragraph = document.createElement("td");
    paragraph.innerHTML = information;
    return paragraph;
}

function updateScore() {
    //var _ = require('lodash');
    //When a Mitigation Confidence Score is added call this and update the global Technique Score
    let confidenceList = Array.from(
        document.getElementsByClassName("confidenceScore")
    ).map((x) => parseInt(x.value));
    let impactList = Array.from(
        document.getElementsByClassName("impactLevel")
    ).map((x) => parseInt(x.value));

    //Fetching a list of mitigations that have an impact to the Threat (impactLevel > 0)
    //We reduce such that if an impact exists (>0) then we increase counter by 1 but if its ==0 then we ignore this
    let impactfulMitigations = impactList.reduce(
        (sum, current) => (current == 0 ? sum : sum + 1),
        0
    );
    let totalImpact = impactList.reduce((a, b) => a + b, 0);

    if (totalImpact == 0) {
        overallThreatScore = 0;
    } else if (totalImpact / impactfulMitigations >= impactThreshold) {
        overallThreatScore = equation(
            100,
            impactList,
            confidenceList,
            totalImpact
        );
    } else if (totalImpact / impactfulMitigations < impactThreshold) {
        overallThreatScore = equation(
            scoreCap,
            impactList,
            confidenceList,
            totalImpact
        );
    }

    document.getElementById("overallScore").innerHTML = overallThreatScore;
}

function equation(penalty, impactList, confidenceList, totalImpact) {
    tolerance = localStorage.getItem("tolerance");
    //Cubic Equation -> y = m * x^2
    if (tolerance == "Low") {
        gradient = penalty / Math.pow(totalImpact, 2);
        equationInput = _.zipWith(impactList, confidenceList, function (x, y) {
            if (y == 0) {
                return 0;
            } else {
                return x * (y / 100);
            }
        }).reduce((a, b) => a + b, 0);
        result = gradient * Math.pow(equationInput, 2);
    } else if (tolerance == "Medium") {
        //Linear Equation -> y = mx
        gradient = penalty / totalImpact;

        equationInput = _.zipWith(impactList, confidenceList, function (x, y) {
            if (y == 0) {
                return 0;
            } else {
                return x * (y / 100);
            }
        }).reduce((a, b) => a + b, 0);
        result = gradient * equationInput;
    } else if (tolerance == "High") {
        //Sqaure Root Function -> y = m * Sqrt(x)
        gradient = penalty / Math.sqrt(totalImpact);

        equationInput = _.zipWith(impactList, confidenceList, function (x, y) {
            if (y == 0) {
                return 0;
            } else {
                return x * (y / 100);
            }
        }).reduce((a, b) => a + b, 0);
        result = gradient * Math.sqrt(equationInput);
    }
    return Math.round(result);
}

//Create a slider inside the confidence score div. We can create an internal flex grid based on columns. As a Beta just simply check and then alert the user to say wait it does not add up. Then later add dynamic functionality.

function nextTechnique() {
    updateStorage();
    var nextTechnique = increDecreString("increment");

    if (localStorage.getItem(nextTechnique) == null) {
        window.location.replace("defensive-coverage.html");
    } else {
        //Have we progressed onto a Fresh technique?
        //We can modify this instead into a list and remove an integer when that is visited!
        if (getCookie("currentTechnique") == getCookie("furthestReachedT")) {
            document.cookie =
                "furthestReachedT=" + increDecreString("increment");
        }
        document.cookie = "currentTechnique=" + nextTechnique;
        window.location.reload();
    }
}

function updateStorage() {
    var currentTechnique = getCookie("currentTechnique");

    let confidenceScores = document.getElementsByClassName("confidenceScore");
    let impactLevel = document.getElementsByClassName("impactLevel");
    let notes = document.getElementsByClassName("textarea");
    let overallScore = document.getElementById("overallScore");
    techniqueStorage = JSON.parse(localStorage.getItem(currentTechnique));

    techniqueStorage.score = parseFloat(overallScore.innerHTML);
    for (let i = 0; i < techniqueStorage.mitigations.length; i++) {
        techniqueStorage.mitigations[i].notes = notes[i].value.replace(
            /[%&#]/g,
            ""
        );
        techniqueStorage.mitigations[i].impactLevel = parseInt(
            impactLevel[i].value
        );
        techniqueStorage.mitigations[i].confidenceScore = parseInt(
            confidenceScores[i].value
        );

        //Prefill later mitigations --saving functionality

        let saveMitigation = {};
        saveMitigation.notes = notes[i].value.replace(/[%&#]/g, "");
        saveMitigation.confidenceScore =
            techniqueStorage.mitigations[i].confidenceScore;
        saveMitigation.impactLevel = parseInt(impactLevel[i].value);
        localStorage.setItem(
            techniqueStorage.mitigations[i].mid,
            JSON.stringify(saveMitigation)
        );
    }
    localStorage.setItem(currentTechnique, JSON.stringify(techniqueStorage));
}

function previousTechnique() {
    updateStorage();
    let previousTechnique = increDecreString("decrement");
    document.cookie = "furthestReachedT=" + increDecreString("increment");
    document.cookie = "currentTechnique=" + previousTechnique;
    window.location.reload();
}

function increDecreString(type) {
    // Find the trailing number or it will match the empty string
    let str = getCookie("currentTechnique");
    let count = str.match(/\d*$/);

    // Take the substring up until where the integer was matched
    // Concatenate it to the matched count incremented by 1
    if (type == "increment") {
        return str.substr(0, count.index) + ++count[0];
    }
    if (type == "decrement") {
        return str.substr(0, count.index) + --count[0];
    }
}

function saveProgress() {
    updateStorage();
    let savedJSON = {};
    savedJSON["cookies"] = document.cookie;
    techniques = {};
    for (let [key, stringValue] of Object.entries(localStorage)) {
        if (key != "userAuth") {
            if (!["tolerance", "impactThreshold", "scoreLimit"].includes(key)) {
                techniques[key] = JSON.parse(stringValue);
            } else {
                techniques[key] = stringValue;
            }
        }
    }
    savedJSON["techniques"] = techniques;
    download = document.createElement("a");

    const str = JSON.stringify(savedJSON);
    const bytes = new TextEncoder().encode(str);
    const blob = new Blob([bytes], {
        type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    download.href = url;
    download.download = "RiskBloX-Save.json";
    download.click();
}
