window.jsPDF = window.jspdf.jsPDF;

$("button").click(function () {
    var name = $(this).attr("id");
    if (name == "saveProgress") {
        saveInputs();
        generateJSONSave();
    } else if (name == "first") {
        saveInputs();
        firstRiskArea();
    } else if (name == "back") {
        saveInputs();
        previousRiskArea();
    } else if (name == "generate") {
        saveInputs();
        generateDocumentation();
    }
});

$(document).on('change','select',function(){
    var selected = $(this).find(":selected");
    $(this)[0].style.backgroundColor = $(selected)[0].style.backgroundColor;
});

function parseIntString(riskAreaString) {
    return riskAreaString.match(/\d*$/)[0];
}

$(document).ready(function () {
    var lastRiskArea = parseIntString(Cookies.get("lastRiskArea"));
    Cookies.set("currentRiskArea", "overview", {
        path: "/",
    });
    var overallInformation = JSON.parse(localStorage.getItem("overall"));
    var securityPropertyNames = overallInformation.uniqueSecurityPropertyNames;
    var BIToIntegerScore = {};
    var integerToBIScore = {};
    var RAToIntegerScore = {};
    var integerToRAScore = {};
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
    $("a").click(function () {
        if ($(this).hasClass("redirectRiskArea")) {
            saveInputs();
            Cookies.set("currentRiskArea", $(this).attr("value"), {
                path: "/",
            });
            window.location.href = "/BIRA/BIRAInput";
        }
    });

    //Defined required overall information - mappings for scores and an Overall Average calculator
    for (item in overallInformation.scoreNamesBI) {
        BIToIntegerScore[overallInformation.scoreNamesBI[item]] =
            parseInt(item) + 1;
        integerToBIScore[parseInt(item) + 1] =
            overallInformation.scoreNamesBI[item];
    }
    for (item in overallInformation.scoreNamesRA) {
        RAToIntegerScore[overallInformation.scoreNamesRA[item]] =
            parseInt(item) + 1;
        integerToRAScore[parseInt(item) + 1] =
            overallInformation.scoreNamesRA[item];
    }

    var overallScores = {};
    for (item in securityPropertyNames) {
        overallScores[securityPropertyNames[item]] = {
            RASumScore: 0,
            RASelected: 0,
            RAWorstScore: 0,
            BISumScore: 0,
            BISelected: 0,
            BIWorstScore: 0,
        };
    }

    //Fetch information needed for averages per Security Property in the JSON Object overallScores
    //by iterating over each risk area and finding what was selected
    for (let i = 1; i <= lastRiskArea; i++) {
        let riskArea = JSON.parse(localStorage.getItem("RA" + i));
        for (const [key, value] of Object.entries(
            riskArea.securityProperties
        )) {
            var regexBIParsedScore = value.businessImpact.replace(/\s+$/, "");
            if (regexBIParsedScore == "") {
                regexBIParsedScore = "Not Applicable";
            }
            var regexRAParsedScore = value.riskAppetite.replace(/\s+$/, "");
            if (regexRAParsedScore == "") {
                regexRAParsedScore = "Not Applicable";
            }
            if (regexBIParsedScore != "Not Applicable") {
                overallScores[key].BISelected += 1;
                overallScores[key].BISumScore +=
                    BIToIntegerScore[regexBIParsedScore];
                if (overallScores[key].BIWorstScore > 0) {
                    if (
                        BIToIntegerScore[regexBIParsedScore] <
                        overallScores[key].BIWorstScore
                    ) {
                        overallScores[key].BIWorstScore =
                            BIToIntegerScore[regexBIParsedScore];
                    }
                } else {
                    overallScores[key].BIWorstScore =
                        BIToIntegerScore[regexBIParsedScore];
                }
            }
            if (regexRAParsedScore != "Not Applicable") {
                overallScores[key].RASelected += 1;
                overallScores[key].RASumScore +=
                    RAToIntegerScore[regexRAParsedScore];
                if (overallScores[key].RAWorstScore > 0) {
                    if (
                        RAToIntegerScore[regexRAParsedScore] <
                        overallScores[key].RAWorstScore
                    ) {
                        overallScores[key].RAWorstScore =
                            RAToIntegerScore[regexRAParsedScore];
                    }
                } else {
                    overallScores[key].RAWorstScore =
                        RAToIntegerScore[regexRAParsedScore];
                }
            }
        }
    }
    for (let i = 0; i < securityPropertyNames.length; i++) {
        var name = securityPropertyNames[i]; //Security Property Name
        var worstRA = "";
        var worstBI = "";
        var averageRAValue = "";
        var averageBIValue = "";
        //We now work out the average for this, and input into two separate tables
        if (overallScores[name].BISelected > 0) {
            averageBIValue =
                integerToBIScore[
                    Math.round(
                        overallScores[name].BISumScore /
                            overallScores[name].BISelected
                    )
                ];
        } else {
            averageBIValue = "Not Applicable";
        }
        if (overallScores[name].RASelected > 0) {
            averageRAValue =
                integerToRAScore[
                    Math.round(
                        overallScores[name].RASumScore /
                            overallScores[name].RASelected
                    )
                ];
        } else {
            averageRAValue = "Not Applicable";
        }
        if (overallScores[name].BIWorstScore == 0) {
            worstBI = "Not Applicable";
        } else {
            worstBI = integerToBIScore[overallScores[name].BIWorstScore];
        }
        if (overallScores[name].RAWorstScore == 0) {
            worstRA = "Not Applicable";
        } else {
            worstRA = integerToRAScore[overallScores[name].RAWorstScore];
        }
        addToAverageTable(
            name,
            averageBIValue,
            averageRAValue,
            worstBI,
            worstRA,
            overallInformation.scoreNamesBI,
            overallInformation[name].BIOverwrite,
            overallInformation[name].BIJustification,
            overallInformation.scoreNamesRA,
            overallInformation[name].RAOverwrite,
            overallInformation[name].RAJustification
        );
    }
    let finalJustification = document.createElement("tr");
    finalJustification.append(
        createTableCell(
            createSelect(
                "RA",
                overallInformation.scoreNamesRA,
                overallInformation.agreedRiskAppetite
            )
        ),
        createTableCell(
            createTextArea(overallInformation.justification, "overall")
        )
    );

    document.getElementById("overallJustification").append(finalJustification);
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
//For each object in overallScores add to the two separate rows in the table

function updateProject() {
    sessionStorage.setItem("updateProject", "true");
    window.location.href = "/project-information";
}

function addToAverageTable(
    securityPropertyName,
    averageBIValue,
    averageRAValue,
    worstBI,
    worstRA,
    BIScoringValues,
    BIOverwrite,
    impactJustification,
    RAScoringValues,
    RAOverwrite,
    appetiteJustification
) {
    let tableRow = document.createElement("tr");
    tableRow.append(
        createTableCell(securityPropertyName),
        createTableCell(worstBI, fetchScoreColour("BI", worstBI)),
        createTableCell(averageBIValue, fetchScoreColour("BI", averageBIValue)),
        createTableCell(createSelect("BI", BIScoringValues, BIOverwrite)),
        createTableCell(createTextArea(impactJustification, "BI")),
        createTableCell(worstRA, fetchScoreColour("RA", worstRA)),
        createTableCell(averageRAValue, fetchScoreColour("RA", averageRAValue)),
        createTableCell(createSelect("RA", RAScoringValues, RAOverwrite)),
        createTableCell(createTextArea(appetiteJustification, "RA"))
    );

    document.getElementById("overwriteAverages").append(tableRow);
}

function createTableCell(value, colour = "#ffffff") {
    let cell = document.createElement("td");
    cell.append(value);
    cell.style.backgroundColor = colour;
    return cell;
}

function createTextArea(innerValue, area) {
    var textArea = document.createElement("textarea");
    if (area == "BI") {
        textArea.setAttribute("class", "BIJustification form-control");
    } else if (area == "RA") {
        textArea.setAttribute("class", "RAJustification form-control");
    } else if (area == "overall") {
        textArea.setAttribute(
            "class",
            "overallRiskAppetiteJustification form-control"
        );
    }

    textArea.setAttribute("height", "100px");
    textArea.innerHTML = innerValue;
    return textArea;
}

function createSelect(type, options, selected) {
    var selectList = document.createElement("select");
    selectList.setAttribute("class", "form-select form-select-sm mb-3");
    let optionNA = document.createElement("option");
    optionNA.value = "Not Applicable";
    optionNA.innerHTML = "Not Applicable";
    selectList.appendChild(optionNA);
    for (var i in options) {
        let option = document.createElement("option");
        option.value = options[i];
        option.innerHTML = options[i];
        option.style.background = fetchScoreColour(type, options[i]);
        if (options[i] == selected) {
            option.selected = "selected";
            selectList.setAttribute("style", `background-color: ${fetchScoreColour(type, options[i])}`);
        }
        selectList.appendChild(option);
    }
    return selectList;
}

function saveInputs() {
    var overall = JSON.parse(localStorage.getItem("overall"));
    $("#overwriteAverages > tr").each(function (index, tr) {
        let propertyOverall = {};
        let propertyName = $(tr).find("td:eq(0)").text();
        propertyOverall.BIOverwrite = $(tr)
            .find("td:eq(3)")
            .find("option:selected")
            .val();
        propertyOverall.BIJustification = $(tr).find(".BIJustification").val();
        propertyOverall.RAOverwrite = $(tr)
            .find("td:eq(7)")
            .find("option:selected")
            .val();
        propertyOverall.RAJustification = $(tr).find(".RAJustification").val();
        overall[propertyName] = propertyOverall;
    });
    $("#overallJustification > tr").each(function (index, tr) {
        overall.agreedRiskAppetite = $(tr)
            .find("td:eq(0)")
            .find("option:selected")
            .val();
        overall.justification = $(tr)
            .find(".overallRiskAppetiteJustification")
            .val();
    });
    localStorage.setItem("overall", JSON.stringify(overall));
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
                "filename",
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
    let title = localStorage.getItem("filename");
    if (title == ""){
        title = localStorage.getItem("projectTitle");
    }
    if (version == "" && title == "") {
        download.download = "BIRA-Save.json";
    } else if ((title == "" || version == "" ) && !( title == "" && version == "")) {
        download.download = "BIRA-" + title.replace(/\s+/g, "-") + version.replace(/\s+/g, "-") + "-Save.json";
    } else {
        download.download = "BIRA-" + title.replace(/\s+/g, "-") + "-" + version.replace(/\s+/g, "-") + "-Save.json";
    }
    download.click();
}

function previousRiskArea() {
    if (Cookies.get("currentRiskArea") != "RA1") {
        Cookies.set("currentRiskArea", Cookies.get("lastRiskArea"), {
            path: "/",
        });
        window.location.href = "/BIRA/BIRAInput";
    } else {
        console.log("There is no previous Risk Area");
    }
}

function firstRiskArea() {
    Cookies.set("currentRiskArea", "RA1", {
        path: "/",
    });
    window.location.href = "/BIRA/BIRAInput";
}

function generateDocumentation() {
    var doc = new jsPDF({
        orientation: "landscape",
        unit: "px",
        hotfixes: ["px_scaling"],
        compress: true,
    });
    var projectName = localStorage.getItem("projectTitle");
    doc.setFontSize(30);
    doc.text(
        projectName,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() / 2 - 75,
        "center"
    );
    doc.text(
        "BIRA Report",
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() / 2,
        "center"
    );

    let logo360Version = localStorage.getItem("logo360Defence");
    if (logo360Version == "2T" || logo360Version == null) {
        doc.setFontSize(20);
        doc.setTextColor("7030a0");
        doc.text("2T Security", 28, 35);
        doc.setTextColor(100);
    } else {
        var logo360 = new Image();
        var anjbLogo = new Image();
        if (logo360Version == null) {
            logo360.src = "/images/BIRA/360D-UK-Logo.png";
        } else {
            logo360.src = "/images/BIRA/360D-" + logo360Version + "-Logo.png";
        }
        anjbLogo.src = "/images/BIRA/ANJB-Logo.png";
        doc.addImage(logo360, 28, 35, 64, 64);
        doc.addImage(anjbLogo, 100, 27, 80, 80);
    }

    var projectLogo = localStorage.getItem("projectLogo");
    if (projectLogo != "null") {
        doc.addImage(
            projectLogo,
            doc.internal.pageSize.getWidth() / 2 - 150,
            doc.internal.pageSize.getHeight() / 2 + 50
        );
    }

    var version = localStorage.getItem("projectVersion");
    doc.setFontSize(12);
    if (version == "") {
        doc.text(new Date().toDateString(), 940, 45);
    } else {
        doc.text(version + " / " + new Date().toDateString(), 940, 45);
    }
    var sensitivityMarking = localStorage.getItem("projectSensitivity");
    if (sensitivityMarking != "") {
        doc.setFontSize(12);
        doc.text(
            "[" + sensitivityMarking + "]",
            doc.internal.pageSize.getWidth() / 2,
            18,
            "center"
        );
    }

    let projectScope = localStorage.getItem("projectScope");
    if (projectScope != "") {
        doc.addPage("landscape");
        doc.setFontSize(25);
        doc.text("Summary", 56, 80);
        doc.setFontSize(12);
        let pageSize = doc.internal.pageSize;
        let pageWidth = pageSize.getWidth();
        let text = doc.splitTextToSize(projectScope, pageWidth - 140, {});
        doc.text(text,56,140,"left");
    }

    doc.addPage("landscape");
    let agreedRiskAppetite = "";
    let agreedRiskAppetiteJustification = "Justification: ";
    $("#overallJustification > tr").each(function (index, tr) {
        agreedRiskAppetite = $(tr)
            .find("td:eq(0)")
            .find("option:selected")
            .val();
        agreedRiskAppetiteJustification += $(tr)
            .find(".overallRiskAppetiteJustification")
            .val();
    });
    doc.setFontSize(25);
    doc.text("Agreed Risk Appetite: " + agreedRiskAppetite, 56, 80);
    doc.setFontSize(11);
    let pageSize = doc.internal.pageSize;
    let pageWidth = pageSize.getWidth();
    let text = doc.splitTextToSize(
        agreedRiskAppetiteJustification,
        pageWidth - 140,
        {}
    );
    let lengthText = doc.getTextDimensions(text).h;
    let heightText = 140;
    doc.text(text, 56, heightText);
    doc.setFontSize(14);

    var headers = [
        "Security Property/Bad Outcome",
        "Impact Agreed",
        "Impact Justification",
        "Appetite Agreed",
        "Appetite Justification",
    ];
    var body = [];

    // $("#overwriteAveragesTable thead tr th").each(function () {
    //     headers.push($(this).text());
    // });
    $("#overwriteAverages > tr").each(function (index, tr) {
        let row = [];
        row.push($(tr).find("td:eq(0)").text());
        row.push($(tr).find("td:eq(3)").find("option:selected").val());
        row.push($(tr).find(".BIJustification").val());
        row.push($(tr).find("td:eq(7)").find("option:selected").val());
        row.push($(tr).find(".RAJustification").val());
        body.push(row);
    });
    doc.autoTable({
        didParseCell: function (data) {
            if (data.column.index == 1 && data.cell.section == "body") {
                data.cell.styles.fillColor = fetchScoreColour(
                    "BI",
                    data.cell.raw
                );
            } else if (data.column.index == 3 && data.cell.section == "body") {
                data.cell.styles.fillColor = fetchScoreColour(
                    "RA",
                    data.cell.raw
                );
            }
        },
        didDrawPage: function (data) {
            if (sensitivityMarking != "") {
                doc.setFontSize(12);
                doc.text(
                    "[" + sensitivityMarking + "]",
                    doc.internal.pageSize.getWidth() / 2,
                    18,
                    "center"
                );
            }
        },
        head: [headers],
        body: body,
        startY: lengthText + heightText,
        theme: "grid",
        showHead: "firstPage",
        headStyles: { fillColor: "#0d6efd" },
        rowPageBreak: "avoid",
        columnStyles: {
            0: {
                cellWidth: 200,
            },
            1: {
                cellWidth: 140,
            },
            2: {
                cellWidth: 280,
            },
            3: {
                cellWidth: 140,
            },
            4: {
                cellWidth: 280,
            },
        },
        styles: {
            minCellHeight: 80,
        },
    });

    let lastRiskArea = fetchIntegers(Cookies.get("lastRiskArea"));
    for (let i = 1; i <= lastRiskArea; i++) {
        var riskArea = JSON.parse(localStorage.getItem("RA" + i));
        doc.addPage();
        let pageSize = doc.internal.pageSize;
        let pageWidth = pageSize.getWidth();
        doc.setFontSize(25);
        let title = doc.splitTextToSize(
            "Risk Area: " + riskArea.name,
            pageWidth - 140,
            {}
        );
        var generalNotes = riskArea.generalNotes;
        doc.text(title, 56, 80);
        doc.setFontSize(11);
        let text = doc.splitTextToSize(
            riskArea.description,
            pageWidth - 140,
            {}
        );
        let lengthText = doc.getTextDimensions(text).h;
        if (doc.getTextDimensions(title).h > 30) {
            var heightSummary = doc.getTextDimensions(title).h + 120;
        } else {
            var heightSummary = 120;
        }

        doc.text(text, 56, heightSummary);
        if (generalNotes != "" && generalNotes != undefined) {
            var generalNotesSplit = doc.splitTextToSize(
                "Notes: " + generalNotes,
                pageWidth - 140,
                {}
            );
            var generalTextHeight = doc.getTextDimensions(generalNotesSplit).h;
            doc.text(generalNotesSplit, 56, lengthText + heightSummary + 10);
        } else {
            var generalTextHeight = 0;
        }

        doc.setFontSize(14);

        var headers = [
            [
                "Security Property/Bad Outcome",
                "Business Impact",
                "BI Justifications",
                "Risk Appetite",
                "RA Justifications",
            ],
        ];
        var body = [];
        for (const [name, value] of Object.entries(
            riskArea.securityProperties
        )) {
            body.push(fetchTable(value, name));
        }

        doc.autoTable({
            didParseCell: function (data) {
                if (data.column.index == 1 && data.cell.section == "body") {
                    data.cell.styles.fillColor = fetchScoreColour(
                        "BI",
                        data.cell.raw
                    );
                } else if (
                    data.column.index == 3 &&
                    data.cell.section == "body"
                ) {
                    data.cell.styles.fillColor = fetchScoreColour(
                        "RA",
                        data.cell.raw
                    );
                }
            },
            didDrawPage: function (data) {
                if (sensitivityMarking != "") {
                    doc.setFontSize(12);
                    doc.text(
                        "[" + sensitivityMarking + "]",
                        doc.internal.pageSize.getWidth() / 2,
                        18,
                        "center"
                    );
                }
            },
            startY: lengthText + heightSummary + generalTextHeight,
            columnStyles: {
                0: { cellWidth: 160 },
                1: { cellWidth: 160 },
                2: { cellWidth: 280 },
                3: { cellWidth: 160 },
                4: { cellWidth: 280 },
            },
            headStyles: { fillColor: "#0d6efd" },
            theme: "grid",
            showHead: "firstPage",
            rowPageBreak: "avoid",
            head: headers,
            body: body,
            styles: {
                minCellHeight: 80,
            },
        });
    }

    let title = localStorage.getItem("filename");
    if (title == ""){
        title = localStorage.getItem("projectTitle");
    }
    if (version == "" && title == "") {
        doc.save("BIRA-Report.pdf");
    } else if ((title == "" || version == "" ) && !( title == "" && version == "")) {
        doc.save("BIRA-" + title.replace(/\s+/g, "-") + version.replace(/\s+/g, "-") + "-Report.pdf");
    } else {
        doc.save("BIRA-" + title.replace(/\s+/g, "-") + "-" + version.replace(/\s+/g, "-") + "-Report.pdf");
    }
}

function fetchTable(object, name) {
    let row = [];
    row.push(
        name,
        valueCheck(object.businessImpact),
        object.businessImpactJustification,
        valueCheck(object.riskAppetite),
        object.riskAppetiteJustification
    );
    return row;
}

function valueCheck(value) {
    if (value == "") {
        return "Not Applicable";
    } else {
        return value;
    }
}

function fetchIntegers(value) {
    return value.match(/\d*$/);
}

function fetchScoreColour(scoreType, value) {
    var colours = JSON.parse(localStorage.getItem("colours"));
    try {
        if (scoreType == "BI") {
            return colours["BI" + value];
        } else if (scoreType == "RA") {
            return colours["RA" + value];
        }
      }
      catch(error) {
        return "#ffffff";
      }
}
