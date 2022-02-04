$(document).ready(function () {
    let projectTitle = localStorage.getItem("projectTitle");
    let projectSensitivity = localStorage.getItem("projectSensitivity");
    let projectScope = localStorage.getItem("projectScope");
    let projectVersion = localStorage.getItem("projectVersion");
    if (projectTitle != null) {
        $("#projectTitle").val(projectTitle);
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
    localStorage.setItem("projectTitle", $("#projectTitle").val());
    localStorage.setItem("projectSensitivity", $("#projectSensitivity").val());
    localStorage.setItem("projectScope", $("#projectScope").val());
    localStorage.setItem("projectVersion", $("#projectVersion").val());
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
        } else {
            window.location.href = "/RiskBloX/mitigations";
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
