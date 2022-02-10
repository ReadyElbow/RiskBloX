$(document).ready(function () {
    let currentRiskArea = Cookies.get("currentRiskArea");
    let riskAreaObject = JSON.parse(localStorage.getItem(currentRiskArea));
    let generalNotes = riskAreaObject.generalNotes;
    if (generalNotes != null || generalNotes != "") {
        $("#generalNotes").val(generalNotes);
    }
    $("#riskAreaTitle").text(riskAreaObject.name);
    $("#riskAreaDescription").text(riskAreaObject.description);

    var BISelectValues = ["Not Applicable"];
    var RASelectValues = ["Not Applicable"];

    let riskAreaNav = Cookies.get("lastRiskArea").match(/\d*$/);
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
            Cookies.set("currentRiskArea", $(this).attr("value"), {
                path: "/",
            });
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
function updateProject() {
    sessionStorage.setItem("updateProject", "true");
    window.location.href = "/project-information";
}
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
    let currentRiskArea = Cookies.get("currentRiskArea");
    var riskAreaObject = JSON.parse(localStorage.getItem(currentRiskArea));
    riskAreaObject.generalNotes = $("#generalNotes").val();
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
    if (Cookies.get("currentRiskArea") == Cookies.get("lastRiskArea")) {
        Cookies.set("currentRiskArea", "overview", { path: "/" });
        window.location.href = "/BIRA/report";
    } else {
        Cookies.set("currentRiskArea", increDecreString("increment"), {
            path: "/",
        });
        window.location.reload();
    }
}

function previousSecurityProperty() {
    saveInputs();
    if (Cookies.get("currentRiskArea") != "RA1") {
        Cookies.set("currentRiskArea", increDecreString("decrement"), {
            path: "/",
        });
        window.location.reload();
    } else {
        console.log("There is no previous Risk Area");
    }
}
function firstSecurityProperty() {
    saveInputs();
    Cookies.set("currentRiskArea", "RA1", {
        path: "/",
    });
    window.location.reload();
}

function increDecreString(type) {
    let str = Cookies.get("currentRiskArea");
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
        currentRiskArea: Cookies.get("currentRiskArea"),
        lastRiskArea: Cookies.get("lastRiskArea"),
    };
    for (let [key, stringValue] of Object.entries(localStorage)) {
        if (
            [
                "projectLogo",
                "projectTitle",
                "projectSensitivity",
                "logo360Defence",
                "projectVersion",
                "projectScope",
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
    let version = localStorage.getItem("projectVersion");
    let title = localStorage.getItem("projectTitle");
    if (version == "" && title == "") {
        download.download = "BIRA-Save.json";
    } else if (title == "" || version == "") {
        download.download = "BIRA-" + title + version + "-Save.json";
    } else {
        download.download = "BIRA-" + title + "-" + version + "-Save.json";
    }
    download.click();
}
