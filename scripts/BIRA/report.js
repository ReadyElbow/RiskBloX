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

function parseIntString(riskAreaString) {
    return riskAreaString.match(/\d*$/)[0];
}

function getCookie(name) {
    let re = new RegExp((name += "=([^;]+)"));
    let value = re.exec(document.cookie);
    return value != null ? unescape(value[1]) : null;
}

$(document).ready(function () {
    var lastRiskArea = parseIntString(getCookie("lastRiskArea"));
    document.cookie = "currentRiskArea=overview;";
    var overallInformation = JSON.parse(localStorage.getItem("overall"));
    var securityPropertyNames = overallInformation.uniqueSecurityPropertyNames;
    var BIToIntegerScore = {};
    var integerToBIScore = {};
    var RAToIntegerScore = {};
    var integerToRAScore = {};
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
    for (let i = 1; i <= lastRiskArea; i++) {
        let riskArea = JSON.parse(localStorage.getItem("RA" + i));
        for (const [key, value] of Object.entries(
            riskArea.securityProperties
        )) {
            if (value.businessImpact != "Not Applicable") {
                overallScores[key].BISelected += 1;
                overallScores[key].BISumScore +=
                    BIToIntegerScore[value.businessImpact];
                if (overallScores[key].BIWorstScore > 0) {
                    if (
                        BIToIntegerScore[value.businessImpact] <
                        overallScores[key].BIWorstScore
                    ) {
                        overallScores[key].BIWorstScore =
                            BIToIntegerScore[value.businessImpact];
                    }
                } else {
                    overallScores[key].BIWorstScore =
                        BIToIntegerScore[value.businessImpact];
                }
            }
            if (value.riskAppetite != "Not Applicable") {
                overallScores[key].RASelected += 1;
                overallScores[key].RASumScore +=
                    RAToIntegerScore[value.riskAppetite];
                if (overallScores[key].RAWorstScore > 0) {
                    if (
                        RAToIntegerScore[value.riskAppetite] <
                        overallScores[key].RAWorstScore
                    ) {
                        overallScores[key].RAWorstScore =
                            RAToIntegerScore[value.riskAppetite];
                    }
                } else {
                    overallScores[key].RAWorstScore =
                        RAToIntegerScore[value.riskAppetite];
                }
            }
        }
    }
    for (let i = 0; i < securityPropertyNames.length; i++) {
        var name = securityPropertyNames[i];
        var worstRA = "";
        var worstBI = "";
        var averageRAValue = "";
        var averageBIValue = "";
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
                overallInformation.scoreNamesRA,
                overallInformation.agreedRiskAppetite
            )
        ),
        createTableCell(
            createTextArea(overallInformation.justification, "overall")
        )
    );

    document.getElementById("overallJustification").append(finalJustification);
});

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
        createTableCell(worstBI),
        createTableCell(averageBIValue),
        createTableCell(createSelect(BIScoringValues, BIOverwrite)),
        createTableCell(createTextArea(impactJustification, "BI")),
        createTableCell(worstRA),
        createTableCell(averageRAValue),
        createTableCell(createSelect(RAScoringValues, RAOverwrite)),
        createTableCell(createTextArea(appetiteJustification, "RA"))
    );

    document.getElementById("overwriteAverages").append(tableRow);
}

function createTableCell(value) {
    let cell = document.createElement("td");
    cell.append(value);
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
    let option = document.createElement("option");
    option.value = "Not Applicable";
    option.innerHTML = "Not Applicable";
    selectList.appendChild(option);
    return selectList;
}

function saveInputs() {
    var overall = JSON.parse(localStorage.getItem("overall"));
    $("#overwriteAverages > tr").each(function (index, tr) {
        let propertyOverall = {};
        let propertyName = $(tr).find("td:eq(0)").text();
        propertyOverall.BIOverwrite = $(tr)
            .find("td:eq(2)")
            .find("option:selected")
            .val();
        propertyOverall.BIJustification = $(tr).find(".BIJustification").val();
        propertyOverall.RAOverwrite = $(tr)
            .find("td:eq(5)")
            .find("option:selected")
            .val();
        propertyOverall.RAJustification = $(tr).find(".RAJustification").val();
        console.log(propertyOverall);
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
        currentRiskArea: getCookie("currentRiskArea"),
        lastRiskArea: getCookie("lastRiskArea"),
    };
    for (let [key, stringValue] of Object.entries(localStorage)) {
        if (key != "userAuth") {
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
    download.download = "RiskBloX-BIRA-Save.json";
    download.click();
}

function previousRiskArea() {
    if (getCookie("currentRiskArea") != "RA1") {
        document.cookie = "currentRiskArea=" + getCookie("lastRiskArea");
        window.location.href = "/BIRA/BIRAInput";
    } else {
        console.log("There is no previous Risk Area");
    }
}

function firstRiskArea() {
    document.cookie = "currentRiskArea=RA1";
    window.location.href = "/BIRA/BIRAInput";
}

function generateDocumentation() {
    var doc = new jsPDF({
        orientation: "landscape",
    });
    var projectName = $("#projectName").val();
    doc.setFontSize(30);
    doc.text(
        "BIRA Report for " + projectName,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() / 2,
        "center"
    );
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
    doc.text("Agreed Risk Appetite: " + agreedRiskAppetite, 14, 20);
    doc.setFontSize(11);
    let pageSize = doc.internal.pageSize;
    let pageWidth = pageSize.getWidth();
    let text = doc.splitTextToSize(
        agreedRiskAppetiteJustification,
        pageWidth - 35,
        {}
    );
    let lengthText = doc.getTextDimensions(text).h;
    let heightText = 35;
    doc.text(text, 14, heightText);
    doc.setFontSize(14);

    var headers = [
        "Security Property/Bad Outcome",
        "Impact Agreed",
        "Impact Justififcation",
        "Appetite Agreed",
        "Appetite Justififcation",
    ];
    var body = [];
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
        head: [headers],
        body: body,
        startY: lengthText + heightText,
        theme: "grid",
        showHead: "firstPage",
        headStyles: { fillColor: "#0d6efd" },
        rowPageBreak: "avoid",
        columnStyles: {
            0: {
                cellWidth: 50,
            },
            1: {
                cellWidth: 35,
            },
            2: {
                cellWidth: 70,
            },
            3: {
                cellWidth: 35,
            },
            4: {
                cellWidth: 70,
            },
        },
        styles: {
            minCellHeight: 30,
        },
    });

    let lastRiskArea = fetchIntegers(getCookie("lastRiskArea"));
    for (let i = 1; i <= lastRiskArea; i++) {
        var riskArea = JSON.parse(localStorage.getItem("RA" + i));
        doc.addPage();
        doc.setFontSize(25);
        doc.text("Risk Area: " + riskArea.name, 14, 20);
        doc.setFontSize(11);
        let pageSize = doc.internal.pageSize;
        let pageWidth = pageSize.getWidth();
        let text = doc.splitTextToSize(
            riskArea.description,
            pageWidth - 35,
            {}
        );
        let lengthText = doc.getTextDimensions(text).h;
        let heightText = 35;
        doc.text(text, 14, heightText);
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
            startY: lengthText + heightText,
            columnStyles: {
                0: { cellWidth: 40 },
                1: { cellWidth: 40 },
                2: { cellWidth: 70 },
                3: { cellWidth: 40 },
                4: { cellWidth: 70 },
            },
            headStyles: { fillColor: "#0d6efd" },
            theme: "grid",
            showHead: "firstPage",
            rowPageBreak: "avoid",
            head: headers,
            body: body,
        });
    }
    doc.save("BIRA-Report.pdf");
}

function fetchTable(object, name) {
    let row = [];
    row.push(
        name,
        object.businessImpact,
        object.businessImpactJustification,
        object.riskAppetite,
        object.riskAppetiteJustification
    );
    return row;
}

function fetchIntegers(value) {
    return value.match(/\d*$/);
}
