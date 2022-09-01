$(document).ready(function () {
    if (Boolean(sessionStorage.getItem("updateProject")) == true) {
        $("#projectStart").text("Continue Project");
    }
    let projectTitle = localStorage.getItem("projectTitle");
    let filename = localStorage.getItem("filename");
    let projectSensitivity = localStorage.getItem("projectSensitivity");
    let projectScope = localStorage.getItem("projectScope");
    let projectVersion = localStorage.getItem("projectVersion");
    if (projectTitle != null) {
        $("#projectTitle").val(projectTitle);
    }
    if (filename != null) {
        $("#filename").val(filename);
    }
    if (projectSensitivity != null) {
        $("#projectSensitivity").val(projectSensitivity);
    }
    if (projectScope != null) {
        $("#projectScope").val(projectScope);
    }
    if (projectVersion != null) {
        $("#projectVersion").val(projectVersion);
    }
});

function projectStart() {
    localStorage.setItem("projectTitle", $("#projectTitle").val().replace(/\s+$/, ""));
    localStorage.setItem("filename", $("#filename").val().replace(/\s+$/, ""));
    localStorage.setItem("projectSensitivity", $("#projectSensitivity").val().replace(/\s+$/, ""));
    localStorage.setItem("projectScope", $("#projectScope").val().replace(/\s+$/, ""));
    localStorage.setItem("projectVersion", $("#projectVersion").val().replace(/\s+$/, ""));
    projectLogo();
    if (sessionStorage.getItem("projectType") == "BIRA") {
        if (Cookies.get("currentRiskArea") == "overview") {
            window.location.href = "/BIRA/report";
        } else {
            window.location.href = "/BIRA/BIRAInput";
        }
    } else if (sessionStorage.getItem("projectType") == "RiskBloX") {
        let projectType = sessionStorage.getItem("RiskBloXType");
        if (projectType == "new") {
            window.location.href = "/RiskBloX/technique-filters";
        } else if (projectType == "mitigations") {
            window.location.href = "/RiskBloX/mitigations";
        } else if (projectType == "coverage") {
            window.location.href = "/RiskBloX/defensive-coverage";
        }
    }
}
function projectLogo() {
    inputLogo = document.getElementById("projectLogo");
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
