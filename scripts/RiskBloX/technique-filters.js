// Calculation Graph
var high = [];
var medium = [];
var low = [];
var URLs = { filterURL: "", techniqueURL: "" };

for (i = 0; i <= 30; i = i + 0.5) {
    high.push({ ser1: i, ser2: (100 / Math.sqrt(30)) * Math.sqrt(i) });
    medium.push({ ser1: i, ser2: (100 / 30) * i });
    low.push({ ser1: i, ser2: (100 / Math.pow(30, 2)) * Math.pow(i, 2) });
}

var margin = { top: 10, right: 30, bottom: 30, left: 50 },
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

var svg = d3
    .select("#toleranceGraph")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var x = d3.scaleLinear().range([0, width]);
var xAxis = d3.axisBottom().scale(x);
svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .attr("class", "Xaxis");

svg.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height - 6)
    .text("ƒ (Positive Impact, Confidence Level)");

svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", 6)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("Score");

var y = d3.scaleLinear().range([height, 0]);
var yAxis = d3.axisLeft().scale(y);
svg.append("g").attr("class", "Yaxis");

function updateGraph(data) {
    x.domain([
        0,
        d3.max(data, function (d) {
            return d.ser1;
        }),
    ]);
    svg.selectAll(".Xaxis").transition().duration(3000).call(xAxis);
    y.domain([
        0,
        d3.max(data, function (d) {
            return d.ser2;
        }),
    ]);
    svg.selectAll(".Yaxis").transition().duration(3000).call(yAxis);
    var u = svg.selectAll(".lineTest").data([data], function (d) {
        return d.ser1;
    });
    u.enter()
        .append("path")
        .attr("class", "lineTest")
        .merge(u)
        .transition()
        .duration(3000)
        .attr(
            "d",
            d3
                .line()
                .x(function (d) {
                    return x(d.ser1);
                })
                .y(function (d) {
                    return y(d.ser2);
                })
        )
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2.5);
}

function fetchFilters() {
    var domain = document.getElementById("domainChoice").value;
    Cookies.set("domain", domain, {
        path: "/",
    });
    if (domain == "enterprise_attack") {
        URLs.filterURL =
            "https://riskblox-mitre-attack-data.s3.eu-west-1.amazonaws.com/enterprise/filters_enterprise.json";
        URLs.techniqueURL =
            "https://riskblox-mitre-attack-data.s3.eu-west-1.amazonaws.com/enterprise/attack_patterns_with_mitigations_enterprise.json";
    } else if (domain == "mobile_attack") {
        URLs.filterURL =
            "https://riskblox-mitre-attack-data.s3.eu-west-1.amazonaws.com/mobile/filters_mobile.json";
        URLs.techniqueURL =
            "https://riskblox-mitre-attack-data.s3.eu-west-1.amazonaws.com/mobile/attack_patterns_with_mitigations_mobile.json";
    } else if (domain == "ics_attack") {
        URLs.filterURL =
            "https://riskblox-mitre-attack-data.s3.eu-west-1.amazonaws.com/ics/filters_ics.json";
        URLs.techniqueURL =
            "https://riskblox-mitre-attack-data.s3.eu-west-1.amazonaws.com/ics/attack_patterns_with_mitigations_ics.json";
    }

    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Access-Control-Allow-Origin", "*");

    var requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
    };

    fetch(URLs.filterURL, requestOptions)
        .then((response) => {
            if (!response.ok) {
                throw new Error("HTTP error " + response.status);
            }
            return response.json();
        })
        .then((json) => {
            addToFilterList("tacticsList", json.killChains, "t");
            addToFilterList("groupsList", json.threatGroups, "g");
            addToFilterList("platformsList", json.platforms, "p");

            function addToFilterList(selectID, filterData, filterType) {
                for (let i = 0; i < filterData.length; i++) {
                    let option = document.createElement("option");
                    if (filterType == "t") {
                        option.value = filterData[i]
                            .replace(new RegExp(" ", "g"), "-")
                            .toLowerCase();
                    } else {
                        option.value = filterData[i];
                    }
                    option.innerHTML = filterData[i].replace("-ics", "");
                    document.getElementById(selectID).appendChild(option);
                }
                $("#" + selectID).multiselect({
                    includeSelectAllOption: true,
                    enableFiltering: true,
                    enableCaseInsensitiveFiltering: true,
                    filterPlaceholder: "Search",
                    maxHeight: 350,
                    numberDisplayed: 1,
                    widthSynchronizationMode: "ifPopupIsSmaller",
                });
            }
            document.getElementById("domainDiv").remove();
            document
                .getElementById("additionalFilters")
                .removeAttribute("hidden");
            document.querySelector(".box");
            updateGraph(medium);
        })
        .catch((error) => console.log("error", error));
}

function redirect() {
    localStorage.setItem(
        "scoreLimit",
        document.getElementById("scoreLimit").value
    );
    localStorage.setItem(
        "tolerance",
        document.getElementById("tolerance").value
    );
    localStorage.setItem(
        "impactThreshold",
        document.getElementById("impactThreshold").value
    );
    $("#loading").attr("hidden", false);
    let tactics = $("#tacticsList").val();
    let threatNames = $("#groupsList").val();
    let platforms = $("#platformsList").val();
    let includeSub = document.getElementById("includeSubTech").checked;
    Cookies.set("tactics", tactics, {
        path: "/",
    });
    Cookies.set("groups", threatNames, {
        path: "/",
    });
    Cookies.set("platforms", platforms, {
        path: "/",
    });
    Cookies.set("subTechnique", includeSub, {
        path: "/",
    });
    Cookies.set("currentTechnique", "T1", {
        path: "/",
    });
    Cookies.set("furthestReachedT", "T1", {
        path: "/",
    });

    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Access-Control-Allow-Origin", "*");

    var requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
    };
    fetch(URLs.techniqueURL, requestOptions)
        .then((response) => {
            if (!response.ok) {
                throw new Error("HTTP error " + response.status);
            }
            return response.json();
        })
        .then((json) => {
            filterAttackPatterns(
                json,
                tactics,
                threatNames,
                platforms,
                includeSub
            );
        });
}

function filterAttackPatterns(
    json,
    tacticsValue,
    threatNamesValue,
    platformsValue,
    includeSub
) {
    tactics = tacticsValue == null ? [] : tacticsValue;
    threatNames = threatNamesValue == null ? [] : threatNamesValue;
    platforms = platformsValue == null ? [] : platformsValue;
    let includeTechniquesNoTG =
        document.getElementById("includeNonMappedT").checked;
    var cookieCounter = 1;
    for (index in json.attackMitigationObjects) {
        if (includeTechniquesNoTG == true) {
            threatNames.push("none_associated");
        }
        if (
            json.attackMitigationObjects[index].associatedThreatGroups.some(
                (r) => threatNames.includes(r)
            ) &&
            json.attackMitigationObjects[index].platforms.some((r) =>
                platforms.includes(r)
            ) &&
            json.attackMitigationObjects[index].tactic.some((r) =>
                tactics.includes(r)
            )
        ) {
            if (includeSub == true) {
                localStorage.setItem(
                    "T" + cookieCounter,
                    JSON.stringify(json.attackMitigationObjects[index])
                );
                cookieCounter++;
            } else {
                if (
                    json.attackMitigationObjects[index].sub_technique == false
                ) {
                    localStorage.setItem(
                        "T" + cookieCounter,
                        JSON.stringify(json.attackMitigationObjects[index])
                    );
                    cookieCounter++;
                }
            }
        }
    }
    if (cookieCounter == 1) {
        $("#loading").attr("hidden", true);
        $("#uponFiltering").append(
            $(`<div class="alert alert-warning alert-dismissible fade show" role="alert">The chosen filters found no matching ATT&CK Techniques.
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>`)
        );
    } else {
        Cookies.set("lastTechnique", "T" + (cookieCounter - 1), {
            path: "/",
        });
        window.location.href = "/RiskBloX/mitigations";
    }
}
