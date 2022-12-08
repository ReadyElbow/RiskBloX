window.scoreCap = parseInt(localStorage.getItem("scoreLimit"));
window.impactThreshold = parseInt(localStorage.getItem("impactThreshold"));
sessionStorage.setItem("RiskBloXType", "mitigations");

function fetchTechnique() {
  let currentTechnique = Cookies.get("currentTechnique");

  let technique = JSON.parse(localStorage.getItem(currentTechnique));
  if (technique.mitigations.length == 0) {
    // No need to add this to because it will be unique to each technique
    var mitigations = [
      {
        application: technique.detection,
        description:
          "No mitigations are available for this technique. A detection mechanism is supplied.",
        mitigation_name: "Detection Mechanism",
        mid: "D1",
        impactLevel: 0,
        confidenceScore: 0,
        notes: "",
      },
    ];
    technique.mitigations = mitigations;
    localStorage.setItem("currentTechnique", JSON.stringify(technique));
  } else {
    var mitigations = technique.mitigations;
  }
  let tactic = technique.tactic;
  let techniqueName = technique.technique_name;
  let techniqueDescription = technique.description;
  let tid = technique.tid;
  let score = technique.score;
  let generalNotes = technique.generalNotes;
  if (generalNotes != null || generalNotes != "") {
    $("#generalNotes").val(generalNotes);
  }
  let articleExamples = technique.realWorld;

  let previousTechnique = increDecreString("decrement");

  if (localStorage.getItem(previousTechnique) == null) {
    backBtn = document.getElementById("back");
    backBtn.disabled = true;
    backBtn.hidden = true;
    firstBtn = document.getElementById("first");
    firstBtn.disabled = true;
    firstBtn.hidden = true;
  }
  $("#technique-header").append(
    $(
      `<h1>Technique: ${techniqueName} (${tid})<a href="https://attack.mitre.org/techniques/${tid.replace(
        ".",
        "/"
      )}" target="_blank"><i class="fas fa-question-circle"></i></a></h1>Risk Score: <h2 id="overallScore">${score}</h2>`
    )
  );
  $("#technique-details").append(
    $(
      `<card-body><h5 class="card-title">Found in the tactics: ${tactic}</h5><p class="card-text">${techniqueDescription}</p></card-body>`
    )
  );

  $("#progress").html(
    "Technique " +
      currentTechnique.replace(/T/g, "") +
      " out of " +
      Cookies.get("lastTechnique").replace(/T/g, "")
  );

  if (articleExamples.length > 0) {
    for (item in articleExamples) {
      $("#examples").append(
        $(
          `<li>${articleExamples[item].source_name} <a href="${articleExamples[item].url}" target="_blank">[Ref]</a> : ${articleExamples[item].description}</li>`
        )
      );
    }
  } else {
    $("#examples").append($(`<p>No Real-World examples exist</p>`));
  }

  displayMitigations(mitigations);
}

function displayMitigations(mitigations) {
  let currentTechnique = Cookies.get("currentTechnique");
  let furthestReachedTechnique = Cookies.get("furthestReachedT");
  for (let i = 0; i < mitigations.length; i++) {
    let mitigationRow = "<tr>";
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
    if (
      currentTechnique == furthestReachedTechnique &&
      localStorage.getItem(mitigations[i]) !== null
    ) {
      // If new technique, has there been a previously analysed mitigation?
      var notes = localStorage.getItem(mitigations[i]).notes;
      var confidenceScore = localStorage.getItem(
        mitigations[i]
      ).confidenceScore;
      var impactLevel = localStorage.getItem(mitigations[i]).impactLevel;
    } else {
      var notes = mitigations[i].notes;
      var confidenceScore = mitigations[i].confidenceScore;
      var impactLevel = mitigations[i].impactLevel;
    }
    if (mid.startsWith("M")) {
      mitigationRow += `<td class="mitigationName">Mitigation: ${mitigation_name} (${mid})<a href="https://attack.mitre.org/mitigations/${mid}" target="_blank"><i class="fas fa-question-circle"></i></a></td>`;
    } else {
      mitigationRow += `<td class="mitigationName">Mitigation: ${mitigation_name} (${mid})</td>`;
    }

    mitigationRow += `<td>${description}</td>`;
    mitigationRow += `<td>${application}</td>`;

    mitigationRow += `<td><textarea class="mitigationNotes notes form-control" height="100px" style="height: 131px; overflow-y: hidden;">${
      notes || ""
    }</textarea></td>`;
    mitigationRow += `<td><select class="form-select form-select-sm mb-3 impactLevel" onchange="updateScore()">`;
    for (let i = 0; i <= 10; i += 2) {
      if (i == impactLevel) {
        mitigationRow += `<option value=${i} selected>${i}</option>`;
      } else {
        mitigationRow += `<option value=${i}>${i}</option>`;
      }
    }
    mitigationRow += `</select></td>`;

    mitigationRow += `<td><select class="form-select form-select-sm mb-3 confidenceScore" onchange="updateScore()">`;
    for (let i = 0; i <= 100; i += 10) {
      if (i == confidenceScore) {
        mitigationRow += `<option value=${i} selected>${i}</option>`;
      } else {
        mitigationRow += `<option value=${i}>${i}</option>`;
      }
    }
    mitigationRow += `</select></td></tr>`;
    $("#mitigations tbody").append($(mitigationRow));
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
}

function loadFilledInMitigations() {
  $("#mitigations > tbody > tr").each(function () {
    // Match upon the ID value! If starts with M then load
    let mitigationID = $(this)
      .find(".mitigationName")
      .text()
      .match(/^.*\((.*)\)/)[1];
    if (mitigationID.startsWith("M")) {
      if (localStorage.getItem(mitigationID) != null) {
        let previousMitigation = JSON.parse(localStorage.getItem(mitigationID));
        $(this).find(".mitigationNotes").val(previousMitigation.notes);
        $(this)
          .find(".impactLevel > option")
          .each(function (index, object) {
            if ($(object).val() == previousMitigation.impactLevel) {
              $(object).prop("selected", true);
            } else {
              $(object).prop("selected", false);
            }
          });
        $(this)
          .find(".confidenceScore > option")
          .each(function (index, object) {
            if ($(object).val() == previousMitigation.confidenceScore) {
              $(object).prop("selected", true);
            } else {
              $(object).prop("selected", false);
            }
          });
      }
    }
  });
}

function updateScore() {
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
    overallThreatScore = equation(100, impactList, confidenceList, totalImpact);
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

function nextTechnique() {
  updateStorage();
  var nextTechnique = increDecreString("increment");

  if (localStorage.getItem(nextTechnique) == null) {
    window.location.href = "/RiskBloX/defensive-coverage";
  } else {
    //Have we progressed onto a Fresh technique?
    //We can modify this instead into a list and remove an integer when that is visited!
    if (Cookies.get("currentTechnique") == Cookies.get("furthestReachedT")) {
      Cookies.set("furthestReachedT", nextTechnique, {
        path: "/",
      });
    }
    Cookies.set("currentTechnique", nextTechnique, {
      path: "/",
    });
    window.location.reload();
  }
}

function updateProject() {
  updateStorage();
  sessionStorage.setItem("updateProject", "true");
  window.location.href = "/project-information";
}

function updateStorage() {
  var currentTechnique = Cookies.get("currentTechnique");
  let mitigationNames = document.getElementsByClassName("mitigationName");
  let confidenceScores = document.getElementsByClassName("confidenceScore");
  let impactLevel = document.getElementsByClassName("impactLevel");
  let notes = document.getElementsByClassName("mitigationNotes");
  let overallScore = document.getElementById("overallScore");
  techniqueStorage = JSON.parse(localStorage.getItem(currentTechnique));
  techniqueStorage.generalNotes = $("#generalNotes").val();
  techniqueStorage.score = parseFloat(overallScore.innerHTML);
  totalMitigations = techniqueStorage.mitigations.length;
  // No mitigations populated but detection exists
  if (totalMitigations == 0 && techniqueStorage.detection != "") {
    techniqueStorage.mitigations = [
      {
        application: techniqueStorage.detection,
        description:
          "No mitigations are available for this technique. A detection mechanism is supplied.",
        mitigation_name: "Detection Mechanism",
        mid: "D1",
        impactLevel: parseInt(impactLevel[0].value),
        confidenceScore: parseInt(confidenceScores[0].value),
        notes: notes[0].value.replace(/[%&#]/g, ""),
      },
    ];
  } else {
    for (let i = 0; i < totalMitigations; i++) {
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
      if (
        !mitigationNames[i].innerHTML.startsWith(
          "Mitigation: Detection Mechanism"
        )
      ) {
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
    }
  }
  localStorage.setItem(currentTechnique, JSON.stringify(techniqueStorage));
}

function previousTechnique() {
  updateStorage();
  let previousTechnique = increDecreString("decrement");
  Cookies.set("currentTechnique", previousTechnique, {
    path: "/",
  });
  window.location.reload();
}

function firstTechnique() {
  updateStorage();
  Cookies.set("currentTechnique", "T1", {
    path: "/",
  });
  window.location.reload();
}

function increDecreString(type) {
  // Find the trailing number or it will match the empty string
  let str = Cookies.get("currentTechnique");
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
