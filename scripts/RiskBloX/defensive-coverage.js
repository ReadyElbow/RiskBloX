window.jsPDF = window.jspdf.jsPDF;
sessionStorage.setItem("RiskBloXType", "coverage");
function generateAttackLayerCall() {
  var toPost = {};
  var techniques = [];
  for (let [key, stringValue] of Object.entries(localStorage)) {
    if (key.match(/^T/)) {
      var storageTechnique = JSON.parse(stringValue);
      if (!storageTechnique["tid"].includes(".")) {
        var tid = storageTechnique.tid;
        let tactics = storageTechnique.tactic;
        let score = storageTechnique.score;
        let techniqueComment = storageTechnique.generalNotes;
        let mitigations = storageTechnique.mitigations;

        for (i in mitigations) {
          if (mitigations[i].notes != "") {
            techniqueComment += `\n${mitigations[i].mitigation_name} (${mitigations[i].mid}) Notes: ${mitigations[i].notes}\n\n`;
          }
        }

        let technique = {};
        technique["tid"] = tid;
        technique["tactics"] = tactics;
        technique["score"] = score;
        technique["comment"] = techniqueComment;
        techniques.push(technique);
      }
    }
  }
  toPost["domain"] = Cookies.get("domain");
  toPost["platforms"] = Cookies.get("platforms").split(",");
  toPost["techniques"] = techniques;

  apiGetLayer =
    "https://sdf10urdoe.execute-api.eu-west-1.amazonaws.com/RiskBloXProd/attacklayer?layer=" +
    btoa(pako.deflate(JSON.stringify(toPost)));

  var navigator = document.getElementById("navIframe");

  url = `https://mitre-attack.github.io/attack-navigator/#leave_site_dialog=false&header=false&legend=false&layerURL=${apiGetLayer}`;
  navigator.setAttribute("src", url);
}

function back() {
  window.location.href = "/RiskBloX/mitigations";
}

function updateProject() {
  sessionStorage.setItem("updateProject", "true");
  window.location.href = "/project-information";
}

function saveProgress() {
  let savedJSON = {};
  savedJSON["cookies"] = document.cookie;
  techniques = {};
  for (let [key, stringValue] of Object.entries(localStorage)) {
    if (
      [
        "projectLogo",
        "projectTitle",
        "filename",
        "projectSensitivity",
        "projectVersion",
        "projectScope",
        "tolerance",
        "impactThreshold",
        "scoreLimit",
        "RiskBloXType",
      ].includes(key)
    ) {
      savedJSON[key] = stringValue;
    } else if (key != "userAuth") {
      techniques[key] = JSON.parse(stringValue);
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
  let version = localStorage.getItem("projectVersion");
  let title = localStorage.getItem("filename");
  if (title == "") {
    title = localStorage.getItem("projectTitle");
  }
  if (version == "" && title == "") {
    download.download = "RiskBloX-Save.json";
  } else if (
    (title == "" || version == "") &&
    !(title == "" && version == "")
  ) {
    download.download =
      "RiskBloX-" +
      title.replace(/\s+/g, "-") +
      version.replace(/\s+/g, "-") +
      "-Save.json";
  } else {
    download.download =
      "RiskBloX-" +
      title.replace(/\s+/g, "-") +
      "-" +
      version.replace(/\s+/g, "-") +
      "-Save.json";
  }
  download.click();
}

function generateReport() {
  var doc = new jsPDF({
    orientation: "landscape",
    unit: "px",
    hotfixes: ["px_scaling"],
    compress: true,
  });
  currentTechnique = fetchIntegers(Cookies.get("currentTechnique"));
  var projectName = localStorage.getItem("projectTitle");
  doc.setFontSize(30);
  doc.text(
    projectName,
    doc.internal.pageSize.getWidth() / 2,
    doc.internal.pageSize.getHeight() / 2 - 75,
    "center"
  );
  doc.text(
    "RiskBloX Assessment",
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
  var projectScope = localStorage.getItem("projectScope");
  if (projectScope != "") {
    doc.setFontSize(15);
    doc.setTextColor("000000");
    let pageSize = doc.internal.pageSize;
    let pageWidth = pageSize.getWidth();
    let text = doc.splitTextToSize(projectScope, pageWidth - 300, {});
    if (projectLogo != "null") {
      doc.text(
        text,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() / 2 + 340,
        "center"
      );
    } else {
      doc.text(
        text,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() / 2 + 100,
        "center"
      );
    }
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

  for (let i = 1; i <= currentTechnique; i++) {
    let technique = JSON.parse(localStorage.getItem("T" + i));
    let description = technique.description;
    let generalNotes = technique.generalNotes;
    let techniqueName = technique.tid + ": " + technique.technique_name;
    let tactics = "Tactics: " + technique.tactic;
    let score = technique.score;
    let scoreString = "Score: " + technique.score;
    doc.addPage("landscape");
    if (score <= 20) {
      doc.setTextColor("#E50000");
    } else if (score <= 50) {
      doc.setTextColor("#FFA500");
    } else if (score <= 80) {
      doc.setTextColor("#E5E500");
    } else if (score <= 100) {
      doc.setTextColor("#008000");
    }
    doc.setFontSize(25);
    doc.text(techniqueName, 56, 80);
    doc.setFontSize(18);
    doc.text(scoreString, 1000, 80);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(tactics, 56, 120);

    let pageSize = doc.internal.pageSize;
    let pageWidth = pageSize.getWidth();
    let text = doc.splitTextToSize(description, pageWidth - 140, {});
    let lengthText = doc.getTextDimensions(text).h;
    let heightText = 160;
    let generalTextHeight = 0;
    doc.text(text, 56, heightText);
    if (generalNotes != "" && generalNotes != undefined) {
      var generalNotesSplit = doc.splitTextToSize(
        "Notes: " + generalNotes,
        pageWidth - 140,
        {}
      );
      generalTextHeight = doc.getTextDimensions(generalNotesSplit).h;
      doc.text(generalNotesSplit, 56, lengthText + heightText + 10);
    }

    doc.autoTable({
      startY: lengthText + heightText + generalTextHeight,
      columnStyles: {
        0: { cellWidth: 130 },
        1: { cellWidth: 240 },
        2: { cellWidth: 240 },
        3: { cellWidth: 175 },
        4: { cellWidth: 130 },
        5: { cellWidth: 130 },
      },
      styles: {
        minCellHeight: 80,
      },
      headStyles: { fillColor: "#0d6efd" },
      theme: "grid",
      showHead: "firstPage",
      rowPageBreak: "avoid",
      head: [
        [
          "Name",
          "Description",
          "Application",
          "Notes",
          "Positive Impact",
          "Implementation Confidence",
        ],
      ],
      body: bodyRows(technique.mitigations),
    });
  }

  let title = localStorage.getItem("filename");
  if (title == "") {
    title = localStorage.getItem("projectTitle");
  }
  if (version == "" && title == "") {
    doc.save("RiskBloX-Report.pdf");
  } else if (
    (title == "" || version == "") &&
    !(title == "" && version == "")
  ) {
    doc.save(
      "RiskBloX-" +
        title.replace(/\s+/g, "-") +
        version.replace(/\s+/g, "-") +
        "-Report.pdf"
    );
  } else {
    doc.save(
      "RiskBloX-" +
        title.replace(/\s+/g, "-") +
        "-" +
        version.replace(/\s+/g, "-") +
        "-Report.pdf"
    );
  }
}

function bodyRows(mitigations) {
  var body = [];
  for (var j = 0; j < mitigations.length; j++) {
    let mitigation = mitigations[j];
    let row = [];
    row.push(
      mitigation.mid + ": " + mitigation.mitigation_name,
      mitigation.description,
      mitigation.application,
      mitigation.notes,
      mitigation.impactLevel,
      mitigation.confidenceScore + "%"
    );
    body.push(row);
  }
  return body;
}

function fetchIntegers(value) {
  return value.match(/\d*$/);
}
