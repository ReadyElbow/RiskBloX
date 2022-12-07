function sessionLoad() {
  var requiredCookies = [
    "currentTechnique",
    "subTechnique",
    "platforms",
    "groups",
    "tactics",
    "domain",
  ];
  requiredCookies.map(function (value) {
    return Cookies.get(value);
  });

  if (requiredCookies.includes(null) == true) {
    alert("A valid Session does not exist. Please select the Restart option.");
  } else {
    sessionStorage.setItem("projectType", "RiskBloX");
    window.location.href = "/project-information";
  }
}

function newAssessment() {
  userAuth = localStorage.getItem("userAuth");
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem("userAuth", userAuth);
  sessionStorage.setItem("projectType", "RiskBloX");
  sessionStorage.setItem("RiskBloXType", "new");
  window.location.href = "/project-information";
}

function JSONLoad() {
  userAuth = localStorage.getItem("userAuth");
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem("userAuth", userAuth);
  userInput = document.getElementById("formFile").files[0];

  const reader = new FileReader();

  reader.onload = function (event) {
    let userFile = JSON.parse(event.target.result);
    cookies = userFile["cookies"].split(";");
    techniques = userFile["techniques"];
    for (let i = 0; i < cookies.length; i++) {
      let splitCookie = cookies[i].split(/=(.+)/);
      Cookies.set(splitCookie[0], splitCookie[1], {
        path: "/",
      });
    }
    for (let [key, stringValue] of Object.entries(techniques)) {
      localStorage.setItem(key, JSON.stringify(stringValue));
    }
    localStorage.setItem("projectLogo", userFile["projectLogo"]);
    localStorage.setItem("projectTitle", userFile["projectTitle"]);
    localStorage.setItem("projectSensitivity", userFile["projectSensitivity"]);
    localStorage.setItem("projectVersion", userFile["projectVersion"]);
    localStorage.setItem("projectScope", userFile["projectScope"]);
    localStorage.setItem("tolerance", userFile["tolerance"]);
    localStorage.setItem("impactThreshold", userFile["impactThreshold"]);
    localStorage.setItem("scoreLimit", userFile["scoreLimit"]);
    sessionStorage.setItem("projectType", "RiskBloX");
    sessionStorage.setItem("RiskBloXType", "mitigations");
    window.location.replace("/project-information");
  };
  reader.readAsText(userInput);
}
