$("button").click(function () {
    var name = $(this).attr("id");
    if (name == "JSONLoad") {
        clearStorage();
        loadJSON();
    } else if (name == "prebuiltLoad") {
    } else if (name == "sessionLoad") {
        loadSession();
    }
});

function loadPreBuilt() {
    //userInput = $.getJSON("/prebuilt/....");
}

function clearStorage() {
    userAuth = localStorage.getItem("userAuth");
    localStorage.clear();
    localStorage.setItem("userAuth", userAuth);
}

function loadSession() {
    if (localStorage.length > 1) {
        window.location.href = "/BIRA/BIRAInput";
    } else {
        console.log("No session exists");
    }
}

function loadJSON() {
    userInput = $("#formFile").prop("files")[0];
    const reader = new FileReader();
    var riskArea = "";
    var dropdownNavigation = {};
    reader.onload = function (event) {
        try {
            var parsedJSON = $.parseJSON(event.target.result);
            for (const [key, value] of Object.entries(parsedJSON)) {
                if (key == "cookies") {
                    document.cookie =
                        "currentRiskArea=" + value.currentRiskArea;
                    riskArea = value.currentRiskArea;
                    document.cookie = "lastRiskArea=" + value.lastRiskArea;
                } else if (
                    [
                        "projectLogo",
                        "projectTitle",
                        "projectSensitivity",
                        "logo360Defence",
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
            let reportTitle = document.getElementById("projectName").value;
            if (reportTitle != null) {
                projectTitle();
            }
            let reportSensitivity =
                document.getElementById("projectSensitivity").value;
            if (reportSensitivity != null) {
                projectSensitivity();
            }
            projectLogo();
            if (riskArea == "overview") {
                window.location.href = "/BIRA/report";
            } else {
                window.location.href = "/BIRA/BIRAInput";
            }
        } catch (err) {
            console.log("This JSON file is not valid.");
        }
    };
    reader.readAsText(userInput);
}

function projectTitle() {
    let projectTitle = document.getElementById("projectName").value;
    localStorage.setItem("projectTitle", projectTitle);
}

function projectSensitivity() {
    let projectSensitivity =
        document.getElementById("projectSensitivity").value;
    localStorage.setItem("projectSensitivity", projectSensitivity);
}

function projectLogo() {
    inputLogo = document.getElementById("companyLogo");
    if (inputLogo.files.length == 0) {
        //If no logo has been uploaded then we need to make sure at least exists in Storage
        //regardless if it is a valid B64 or has value "null"
        if (localStorage.getItem("projectLogo") == null) {
            localStorage.setItem("projectLogo", "null");
        }
    } else {
        const reader = new FileReader();
        reader.onload = function (upload) {
            var img = new Image();
            img.onload = function () {
                let canvas = document.createElement("canvas");
                let canvasContext = canvas.getContext("2d");
                canvas.width = 300;
                canvas.height = canvas.width * (img.height / img.width);
                canvasContext.drawImage(img, 0, 0, canvas.width, canvas.height);
                localStorage.setItem(
                    "projectLogo",
                    canvas.toDataURL("image/png")
                );
            };
            img.src = upload.target.result;
        };
        reader.readAsDataURL(inputLogo.files[0]);
    }
}
