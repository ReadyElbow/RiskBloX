$("button").click(function () {
    var name = $(this).attr("id");
    if (name == "JSONLoad") {
        loadJSON();
    } else if (name == "prebuiltLoad") {
    } else if (name == "sessionLoad") {
        loadSession();
    }
});

function loadPreBuilt() {
    userInput = $.getJSON("/prebuilt/....");
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
    clearStorage();
    userInput = $("#formFile").prop("files")[0];

    const reader = new FileReader();
    var riskArea = "";
    reader.onload = function (event) {
        try {
            var parsedJSON = $.parseJSON(event.target.result);
            for (const [key, value] of Object.entries(parsedJSON)) {
                if (key == "cookies") {
                    riskArea = value.currentRiskArea;
                    document.cookie = "currentRiskArea=" + riskArea;
                    document.cookie = "lastRiskArea=" + value.lastRiskArea;
                } else {
                    localStorage.setItem(key, JSON.stringify(value));
                }
            }
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
