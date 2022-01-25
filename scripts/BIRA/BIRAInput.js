function getCookie(name) {
    let re = new RegExp((name += "=([^;]+)"));
    let value = re.exec(document.cookie);
    return value != null ? unescape(value[1]) : null;
}

$(document).ready(function () {
    let currentRiskArea = getCookie("currentRiskArea");
    let riskAreaObject = JSON.parse(localStorage.getItem(currentRiskArea));

    $("#riskAreaTitle").text(riskAreaObject.name);
    $("#riskAreaDescription").text(riskAreaObject.description);

    var BISelectValues = ["Not Applicable"];
    var RASelectValues = ["Not Applicable"];

    let riskAreaNav = getCookie("lastRiskArea").match(/\d*$/);
    var navObject = JSON.parse(sessionStorage.getItem("navigation"));
    for (let i = 1; i <= riskAreaNav; i++) {
        $(".riskAreaNavigation").append(
            `<li><a class="dropdown-item redirectRiskArea" value="RA` +
                i +
                `">` +
                navObject["RA" + i] +
                `</a></li>`
        );
    }

    for (
        let i = 0;
        i < riskAreaObject.scoringDescriptions.businessImpact.length;
        i++
    ) {
        let name = riskAreaObject.scoringDescriptions.businessImpact[i].name;
        let otherNotation =
            riskAreaObject.scoringDescriptions.businessImpact[i].otherNotation;
        let description =
            riskAreaObject.scoringDescriptions.businessImpact[i].description;
        BISelectValues.push(name);
        $("#BIscoringDescriptions").append(
            `<tr><td>${name}</td><td>${otherNotation}</td><td>${description}</td></tr>`
        );
    }
    $("a").click(function () {
        if ($(this).hasClass("redirectRiskArea")) {
            saveInputs();
            document.cookie = "currentRiskArea=" + $(this).attr("value");
            window.location.reload();
        }
    });
    for (
        let i = 0;
        i < riskAreaObject.scoringDescriptions.riskAppetite.length;
        i++
    ) {
        let name = riskAreaObject.scoringDescriptions.riskAppetite[i].name;
        let otherNotation =
            riskAreaObject.scoringDescriptions.riskAppetite[i].otherNotation;
        let description =
            riskAreaObject.scoringDescriptions.riskAppetite[i].description;
        RASelectValues.push(name);
        $("#RAscoringDescriptions").append(
            `<tr><td>${name}</td><td>${otherNotation}</td><td>${description}</td></tr>`
        );
    }

    for (const [name, value] of Object.entries(
        riskAreaObject.securityProperties
    )) {
        let BISelected = value.businessImpact;
        let impactJustification = value.businessImpactJustification;
        let RASelected = value.riskAppetite;
        let appetiteJustification = value.riskAppetiteJustification;

        let tableRow = document.createElement("tr");
        tableRow.append(
            createTableCell(name),
            createTableCell(createSelect(BISelectValues, BISelected)),
            createTableCell(createTextArea(impactJustification, "BI")),
            createTableCell(createSelect(RASelectValues, RASelected)),
            createTableCell(createTextArea(appetiteJustification, "RA"))
        );
        document.getElementById("securityProperties").append(tableRow);
    }
    $("textarea")
        .each(function () {
            this.setAttribute(
                "style",
                "height:" + this.scrollHeight + "px;overflow-y:hidden;"
            );
        })
        .on("input", function () {
            this.style.height = "auto";
            this.style.height = this.scrollHeight + "px";
        });
});

$("button").click(function () {
    var name = $(this).attr("id");
    if (name == "saveProgress") {
        saveInputs();
        generateJSONSave();
    } else if (name == "first") {
        firstSecurityProperty();
    } else if (name == "back") {
        previousSecurityProperty();
    } else if (name == "next") {
        nextSecurityProperty();
    }
});

function createTableCell(value) {
    let cell = document.createElement("td");
    cell.append(value);
    return cell;
}

function createTextArea(innerValue, area) {
    var textArea = document.createElement("textarea");
    if (area == "BI") {
        textArea.setAttribute("class", "businessImpactJus form-control");
    } else if (area == "RA") {
        textArea.setAttribute("class", "riskAreaJus form-control");
    }

    textArea.setAttribute("height", "100px");
    textArea.innerHTML = innerValue;
    return textArea;
}

function createSelect(names, selected) {
    var selectList = document.createElement("select");
    selectList.setAttribute("class", "form-select form-select-sm mb-3");
    for (var i in names) {
        let option = document.createElement("option");
        option.value = names[i];
        option.innerHTML = names[i];
        if (names[i] == selected) {
            option.selected = "selected";
        }
        selectList.appendChild(option);
    }
    return selectList;
}

function saveInputs() {
    let currentRiskArea = getCookie("currentRiskArea");
    var riskAreaObject = JSON.parse(localStorage.getItem(currentRiskArea));

    $("#securityProperties > tr").each(function (index, tr) {
        //to fix the issue of not up to date textareas being fetched you need to add a classname to each cell
        //and search on that instead
        let updatedProperty = {};
        let name = $(tr).find("td:eq(0)").text();
        updatedProperty.businessImpact = $(tr)
            .find("td:eq(1)")
            .find("option:selected")
            .val();
        updatedProperty.businessImpactJustification = $(tr)
            .find(".businessImpactJus")
            .val();
        updatedProperty.riskAppetite = $(tr)
            .find("td:eq(3)")
            .find("option:selected")
            .val();
        updatedProperty.riskAppetiteJustification = $(tr)
            .find(".riskAreaJus")
            .val();
        riskAreaObject.securityProperties[name] = updatedProperty;
    });
    localStorage.setItem(currentRiskArea, JSON.stringify(riskAreaObject));
}
function nextSecurityProperty() {
    saveInputs();
    if (getCookie("currentRiskArea") == getCookie("lastRiskArea")) {
        document.cookie = "currentRiskArea=overview;";
        window.location.href = "/BIRA/report";
    } else {
        document.cookie = "currentRiskArea=" + increDecreString("increment");
        window.location.reload();
    }
}

function previousSecurityProperty() {
    saveInputs();
    if (getCookie("currentRiskArea") != "RA1") {
        document.cookie = "currentRiskArea=" + increDecreString("decrement");
        window.location.reload();
    } else {
        console.log("There is no previous Risk Area");
    }
}
function firstSecurityProperty() {
    saveInputs();
    document.cookie = "currentRiskArea=RA1";
    window.location.reload();
}

function increDecreString(type) {
    let str = getCookie("currentRiskArea");
    let count = str.match(/\d*$/);
    if (type == "increment") {
        return str.substr(0, count.index) + ++count[0];
    }
    if (type == "decrement") {
        return str.substr(0, count.index) + --count[0];
    }
}

function generateJSONSave() {
    let savedJSON = {};
    savedJSON.cookies = {
        currentRiskArea: getCookie("currentRiskArea"),
        lastRiskArea: getCookie("lastRiskArea"),
    };
    for (let [key, stringValue] of Object.entries(localStorage)) {
        if (
            [
                "projectLogo",
                "projectTitle",
                "projectSensitivity",
                "logo360Defence",
            ].includes(key)
        ) {
            savedJSON[key] = stringValue;
        } else if (key != "userAuth") {
            savedJSON[key] = JSON.parse(stringValue);
        }
    }
    download = document.createElement("a");
    const str = JSON.stringify(savedJSON);
    const bytes = new TextEncoder().encode(str);
    const blob = new Blob([bytes], {
        type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    download.href = url;
    download.download =
        "BIRA-" + localStorage.getItem("projectTitle") + "-Save.json";
    download.click();
}
