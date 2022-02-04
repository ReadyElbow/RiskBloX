$("button").click(function () {
    var name = $(this).attr("id");
    if (name == "JSONLoad") {
        clearStorage();
        uploadJSON();
    } else if (name == "prebuiltLoad") {
        clearStorage();
        loadPreBuilt();
    } else if (name == "sessionLoad") {
        loadSession();
    }
});
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
function loadPreBuilt() {
    let choice = $("#prebuilt").find("option:selected").val();
    $.getJSON("/public-templates/" + choice, function (parsedJSON) {
        loadJSON(parsedJSON);
    });
}
function clearStorage() {
    userAuth = localStorage.getItem("userAuth");
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("userAuth", userAuth);
}

function loadSession() {
    if (localStorage.length > 1) {
        if (Cookies.get("currentRiskArea") == "overview") {
            window.location.href = "/BIRA/report";
        } else {
            window.location.href = "/BIRA/BIRAInput";
        }
    } else {
        console.log("No session exists");
    }
}

function uploadJSON() {
    userInput = $("#formFile").prop("files")[0];
    const reader = new FileReader();
    reader.onload = function (event) {
        loadJSON($.parseJSON(event.target.result));
    };
    reader.readAsText(userInput);
}

function loadJSON(parsedJSON) {
    var riskArea = "";
    var dropdownNavigation = {};
    try {
        for (const [key, value] of Object.entries(parsedJSON)) {
            if (key == "cookies") {
                Cookies.set("currentRiskArea", value.currentRiskArea, {
                    path: "/",
                });
                Cookies.set("lastRiskArea", value.lastRiskArea, {
                    path: "/",
                });
                riskArea = value.currentRiskArea;
            } else if (
                [
                    "projectLogo",
                    "projectTitle",
                    "projectSensitivity",
                    "logo360Defence",
                    "projectVersion",
                    "projectScope",
                ].includes(key)
            ) {
                localStorage.setItem(key, value);
            } else {
                dropdownNavigation[key] = value.name;
                localStorage.setItem(key, JSON.stringify(value));
            }
        }
        sessionStorage.setItem(
            "navigation",
            JSON.stringify(dropdownNavigation)
        );
        sessionStorage.setItem("projectType", "BIRA");
        window.location.href = "/project-information";
    } catch (error) {
        console.log("This JSON file is not valid.");
    }
}
