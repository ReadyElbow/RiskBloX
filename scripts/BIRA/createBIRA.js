var overallNames = [];
function addTextAreaListener() {
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
}
$(document).on("click", "button", function () {
    var name = $(this).attr("class");
    if (name.startsWith("addRiskArea")) {
        var cloneWithoutValues = $("#areaTemplate").clone(true);
        cloneWithoutValues.find("#removeRiskAreabtn").attr({ hidden: false });
        cloneWithoutValues.find(".rowControls").remove();
        var totalTextAreas = cloneWithoutValues.find("textarea").length;

        //Removing inputted values of Description
        for (let textArea = 0; textArea < totalTextAreas; textArea++) {
            if (
                cloneWithoutValues
                    .find("textarea")
                    [textArea].className.startsWith("BIDescription")
            ) {
                cloneWithoutValues.find("textarea")[textArea].value = "";
            }
        }
        //Clear any user inputs except the Security Property Title, this includes Risk Area Title etc
        var length = cloneWithoutValues.find("input").length;
        for (let i = 0; i < length; i++) {
            if (
                !cloneWithoutValues
                    .find("input")
                    [i].className.match(".securityPropertyTitle")
            ) {
                cloneWithoutValues.find("input")[i].value = "";
            }
        }
        //Add the cloned Risk Area to the end with a removed template ID
        $("#templateGenerator").append(cloneWithoutValues.removeAttr("id"));
    } else if (name.startsWith("removeRiskArea")) {
        if ($(this).parents().eq(3).children("form").length > 1) {
            $(this).parents().eq(2).remove();
        } else {
            riskAreaError();
        }
    } else if (name.startsWith("addSecurityProperty")) {
        let cloneWithoutValues = $("#securityPropertyTemplate")
            .clone(true)
            .find("input")
            .val("")
            .end()
            .removeAttr("id");
        cloneWithoutValues
            .find("#removeSecurityPropertybtn")
            .attr({ hidden: false });
        let parentRiskArea = $(this).parents().eq(1);
        parentRiskArea.append(cloneWithoutValues);
    } else if (name.startsWith("removeSecurityProperty")) {
        if ($(this).parents().eq(1).children("div").length > 1) {
            $(this).parents().eq(0).remove();
        } else {
            securityPropertyError();
        }
    } else if (name.startsWith("addScoreArea")) {
        let tableRow = $(this).parents().eq(2).clone(true);
        tableRow.find("textarea").val("");
        $(this).parents().eq(3).append(tableRow);
    } else if (name.startsWith("removeScoreArea")) {
        if ($(this).parents().eq(3).children().length > 1) {
            $(this).parents().eq(2).remove();
        } else {
            scoreError();
        }
    }
    addTextAreaListener();
});

function riskAreaError() {
    let riskError = $(
        '<div class="alert alert-warning alert-dismissible fade show" role="alert">A Risk Area must exist at all times<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>'
    );
    $("#userErrorAlerts").append(riskError);
}
function securityPropertyError() {
    let securityError = $(
        '<div class="alert alert-warning alert-dismissible fade show" role="alert">A Security Property must exist in a Risk Area at all times<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>'
    );
    $("#userErrorAlerts").append(securityError);
}
function scoreError() {
    let securityError = $(
        '<div class="alert alert-warning alert-dismissible fade show" role="alert">At least one Score Row must be in a Score Table at all times<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>'
    );
    $("#userErrorAlerts").append(securityError);
}

function generate() {
    var biraJSONTemplate = {};
    var JSONInformation = $("#templateGenerator").children();
    let childrenLength = JSONInformation.length;
    var uniqueSecurityPropertyNames = [];
    var uniqueRAScoreNames = [];
    var uniqueBIScoreNames = [];
    for (var child = 0; child < childrenLength; child++) {
        var riskArea = {};
        let name = $(JSONInformation[child]) //Risk Area Name Overarching type
            .find("#riskAreaTitle")
            .val();
        let description = $(JSONInformation[child]) //Risk Area Name Overarching type
            .find("#riskAreaDescription")
            .val();
        riskArea.name = name.replace(/\s+$/, "");
        riskArea.description = description;
        riskArea.impactJustification = "";
        riskArea.appetiteJustification = "";

        var securityProperties = $(JSONInformation[child])
            .find(".securityAreas")
            .children();
        let securityPropertiesLength = securityProperties.length;
        var securityPropertiesJSON = {};
        //Iterating through Security Properties and creating the object of it
        for (
            var property = 0;
            property < securityPropertiesLength;
            property++
        ) {
            var title = $(securityProperties[property])
                .find(".securityPropertyTitle")
                .val()
                .replace(/\s+$/, "");
            securityPropertiesJSON[title] = {
                businessImpact: "",
                businessImpactJustification: "",
                riskAppetite: "",
                riskAppetiteJustification: "",
            };
            if (child == 0) {
                uniqueSecurityPropertyNames.push(title);
            }
        }
        var scoringDescription = {};
        scoreTables = $(JSONInformation[child]).find("table");

        scoringDescription.businessImpact = fetchTableRows(scoreTables[0]);
        scoringDescription.riskAppetite = fetchTableRows(scoreTables[1]);
        if (child == 0) {
            for (item in scoringDescription.businessImpact) {
                uniqueBIScoreNames.push(
                    scoringDescription.businessImpact[item].name
                );
            }
            for (item in scoringDescription.riskAppetite) {
                uniqueRAScoreNames.push(
                    scoringDescription.riskAppetite[item].name
                );
            }
        }
        //Add the security property to the JSON Risk Area through format of SA1 etc
        riskArea["securityProperties"] = securityPropertiesJSON;
        riskArea["scoringDescriptions"] = scoringDescription;

        biraJSONTemplate["RA" + (child + 1)] = riskArea;

        //classes are riskAreaTitle,
        //Iterate through the required classes such as the table values and append to an inner JSON
        //Then download this as a JSON file!
    }
    //Overall Information
    let overall = {};
    for (item in uniqueSecurityPropertyNames) {
        overall[uniqueSecurityPropertyNames[item]] = {
            RAOverwrite: "Not Applicable",
            BIOverwrite: "Not Applicable",
            RAJustification: "",
            BIJustification: "",
        };
    }
    overall.scoreNamesBI = uniqueBIScoreNames;
    overall.scoreNamesRA = uniqueRAScoreNames;
    overall.uniqueSecurityPropertyNames = uniqueSecurityPropertyNames;

    overall.agreedRiskAppetite = "";
    overall.justification = "";

    //Cookies
    cookies = { currentRiskArea: "RA1", lastRiskArea: "RA" + childrenLength };
    biraJSONTemplate.cookies = cookies;
    biraJSONTemplate.overall = overall;

    //360 Logo
    let logo360D = $("#360DLogo").val();
    biraJSONTemplate.logo360Defence = logo360D;
    localStorage.setItem("tempObject", JSON.stringify(biraJSONTemplate));

    $("#BIScoreColour").find("tbody").empty();
    $("#RAScoreColour").find("tbody").empty();
    if (!uniqueBIScoreNames.includes("Not Applicable")) {
        uniqueBIScoreNames.push("Not Applicable");
    }
    if (!uniqueRAScoreNames.includes("Not Applicable")) {
        uniqueRAScoreNames.push("Not Applicable");
    }
    let previousColours = JSON.parse(localStorage.getItem("colours"));
    for (score in uniqueBIScoreNames) {
        let tableRow = document.createElement("tr");
        let scoreName = document.createElement("td");
        let colourPicker = document.createElement("input");
        let colourPickerCell = document.createElement("td");
        scoreName.innerHTML = uniqueBIScoreNames[score];
        tableRow.appendChild(scoreName);
        colourPicker.className = "hexColour";
        if (
            previousColours != null &&
            previousColours["BI" + uniqueBIScoreNames[score]] != null
        ) {
            colourPicker.placeholder =
                previousColours["BI" + uniqueBIScoreNames[score]];
        } else {
            colourPicker.placeholder = "#ffffff";
        }
        colourPickerCell.appendChild(colourPicker);
        tableRow.appendChild(colourPickerCell);
        document.getElementById("BIScoreColourBody").appendChild(tableRow);
    }
    for (score in uniqueRAScoreNames) {
        let tableRow = document.createElement("tr");
        let scoreName = document.createElement("td");
        scoreName.innerHTML = uniqueRAScoreNames[score];
        let colourPicker = document.createElement("input");
        let colourPickerCell = document.createElement("td");
        tableRow.appendChild(scoreName);
        colourPicker.className = "hexColour";
        if (
            previousColours != null &&
            previousColours["RA" + uniqueRAScoreNames[score]] != null
        ) {
            colourPicker.placeholder =
                previousColours["RA" + uniqueRAScoreNames[score]];
        } else {
            colourPicker.placeholder = "#ffffff";
        }
        colourPickerCell.appendChild(colourPicker);
        tableRow.appendChild(colourPickerCell);
        document.getElementById("RAScoreColourBody").appendChild(tableRow);
    }
    var modal1 = new bootstrap.Modal(
        document.getElementById("BIScoreColoursModal"),
        {
            keyboard: false,
        }
    );
    modal1.show();
}
//Modal Listener, just read the html with the JScript plugin quickly :)
$("#secondModalClose").on("click", function () {
    biraTemplate = localStorage.getItem("tempObject");
    localStorage.removeItem("tempObject");
    biraJSONTemplate = JSON.parse(biraTemplate);
    var colours = {};
    $("#BIScoreColourBody > tr").each(function (index, tr) {
        //to fix the issue of not up to date textareas being fetched you need to add a classname to each cell
        //and search on that instead
        let name = $(tr).find("td:eq(0)").text();
        let colour = $(tr).find(".hexColour").val();
        let placeholder = $(tr).find(".hexColour").attr("placeholder");
        //Or if colour is in wrong fromat, length less than 7 and doesn't include a hashtag then error
        if (colour == "") {
            colour = placeholder;
        }
        colours["BI" + name] = colour;
    });
    $("#RAScoreColourBody > tr").each(function (index, tr) {
        //to fix the issue of not up to date textareas being fetched you need to add a classname to each cell
        //and search on that instead
        let name = $(tr).find("td:eq(0)").text();
        let colour = $(tr).find(".hexColour").val();
        let placeholder = $(tr).find(".hexColour").attr("placeholder");
        //Or if colour is in wrong fromat, length less than 7 and doesn't include a hashtag then error
        if (colour == "") {
            colour = placeholder;
        }
        colours["RA" + name] = colour;
    });
    biraJSONTemplate.colours = colours;

    const str = JSON.stringify(biraJSONTemplate);
    const bytes = new TextEncoder().encode(str);
    const blob = new Blob([bytes], {
        type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    var a = $("<a />");
    a.attr("download", "BIRA-Template.json");
    a.attr("href", url);
    a.attr("id", "JSONDownloader");
    $("body").append(a);
    a[0].click();
    $("body").find("#JSONDownloader").remove();
});

function fetchTableRows(tableDiv) {
    var scoringArray = [];
    $.each($(tableDiv).find(".scoringRow"), function () {
        let scoringRow = {};
        let scoreName = $(this).find(".scoreName").val();
        scoringRow.name = scoreName.replace(/\s+$/, "");
        scoringRow.otherNotation = $(this).find(".otherNotation").val();
        scoringRow.description = $(this).find(".scoringDescription").val();
        scoringArray.push(scoringRow);
    });
    return scoringArray;
}

//Issue with adding new elements on top of exisiting. SOmething going wrong where it might not be registring them for some reason......
//Duplicate Security Properties
//Unhide add button
//Remove IDs

$("#JSONLoad").click(function () {
    userInput = $("#formFile").prop("files")[0];
    const reader = new FileReader();
    reader.onload = function (inputFile) {
        var jsonTemplate = $.parseJSON(inputFile.target.result);
        var lastRiskArea = jsonTemplate.cookies.lastRiskArea.match(/\d*$/);
        const riskAreaTemplate = deleteNewRiskAreas();
        if (jsonTemplate.colours != null) {
            localStorage.setItem(
                "colours",
                JSON.stringify(jsonTemplate.colours)
            );
        }
        //Need to also wipe them of any data stored in them which requires rewriting function
        // Need to delete the template that is now actually on the website also to avoid clashes

        for (let areaCounter = 1; areaCounter <= lastRiskArea; areaCounter++) {
            let template = riskAreaTemplate.clone();
            if (areaCounter != 1) {
                $(template).removeAttr("id");
                //unhide add button in risk area title
                $(template).find("#removeRiskAreabtn").attr({ hidden: false });
            }
            createRiskArea(jsonTemplate["RA" + areaCounter], template);
        }
        addTextAreaListener();
    };
    reader.readAsText(userInput);
});

function createRiskArea(riskAreaJSON, template) {
    $(template).find("#riskAreaTitle").val(riskAreaJSON.name);
    $(template).find("#riskAreaDescription").val(riskAreaJSON.description);

    //Adding the Security Properties into a Risk Area
    for (let [key, value] of Object.entries(riskAreaJSON.securityProperties)) {
        //First Div Element of Security Property
        let securityPropertyTitle = $(template)
            .find("#securityPropertyTemplate")
            .eq(0)
            .clone();
        $(securityPropertyTitle).find(".securityPropertyTitle").val(key);
        if (Object.keys(riskAreaJSON.securityProperties).indexOf(key) != 0) {
            //removing the id value of any property that is beyond the first
            $(securityPropertyTitle).removeAttr("id");
            //Need to set the minus button to be unhidden as well
            $(securityPropertyTitle)
                .find("#removeSecurityPropertybtn")
                .attr({ hidden: false });
        }
        //Adding the row back to the template
        $(template).find(".securityAreas").append(securityPropertyTitle);
    }
    //Need to delete the first one as we cloned it twice
    $(template).find(".securityAreas div:first-child").remove();

    //Adding scores and descriptions
    for (let [key, value] of Object.entries(
        riskAreaJSON.scoringDescriptions.businessImpact
    )) {
        let tableRow = $(template)
            .find(".businessImpactScores")
            .find("tr")
            .eq(1)
            .clone();
        $(tableRow).find(".scoreName").val(value.name);
        $(tableRow).find(".otherNotation").val(value.otherNotation);
        $(tableRow).find(".scoringDescription").val(value.description);
        //Append the table row to the table now
        $(template)
            .find(".businessImpactScores")
            .find("tbody")
            .append(tableRow);
    }
    //Then delete the first row of tbody as it was used as a template
    $(template).find(".businessImpactScores").find("tr").eq(1).remove();

    for (let [key, value] of Object.entries(
        riskAreaJSON.scoringDescriptions.riskAppetite
    )) {
        let tableRow = $(template)
            .find(".riskAppetiteScores")
            .find("tr")
            .eq(1)
            .clone();
        $(tableRow).find(".scoreName").val(value.name);
        $(tableRow).find(".otherNotation").val(value.otherNotation);
        $(tableRow).find(".scoringDescription").val(value.description);
        //Append the table row to the table now
        $(template).find(".riskAppetiteScores").find("tbody").append(tableRow);
    }
    //Then delete the first row of tbody as it was used as a template
    $(template).find(".riskAppetiteScores").find("tr").eq(1).remove();

    //
    //At the end of the generation I need to check if it is NOT the first risk and then perform a wipe of any id atrrtibutes so I don't break above code!
    //

    $("#templateGenerator").append(template);
}

function deleteNewRiskAreas() {
    $("#templateGenerator").children().not("form:first").remove();
    //Wipe any data stored in the first one and remove unneeded tables/score rows aka bare minimum
    $(".securityAreas").children().not("div:first").remove();
    $.each($("#templateGenerator").find("tbody"), function () {
        $(this).children().not("tr:first").remove();
        $(this).children().find(".scoreName").empty();
    });
    let template = $("#areaTemplate").clone();
    $("#areaTemplate").remove();
    return template;
}
