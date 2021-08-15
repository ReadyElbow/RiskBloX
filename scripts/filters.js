var high = []
var medium = []
var low = []

for (i=0; i <= 30; i=i+0.5){
            point = [i,(100/Math.sqrt(30))*Math.sqrt(i),(100/30)*i,(100/Math.pow(30,2))*(Math.pow(i,2))]
            high.push({ser1: i, ser2: (100/Math.sqrt(30))*Math.sqrt(i)})
            medium.push({ser1: i, ser2:(100/30)*i})
            low.push({ser1: i, ser2:(100/Math.pow(30,2))*(Math.pow(i,2))})
        }

var margin = {top: 10, right: 30, bottom: 30, left: 50},
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#toleranceGraph")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

// Initialise a X axis:
var x = d3.scaleLinear().range([0,width]);
var xAxis = d3.axisBottom().scale(x);
svg.append("g")
  .attr("transform", "translate(0," + height + ")")
  .attr("class","myXaxis")

svg.append("text")
.attr("class", "x label")
.attr("text-anchor", "end")
.attr("x", width)
.attr("y", height - 6)
.text("Sum (Impact * Confidence Level)");

svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", 6)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("Risk Score");

// Initialize an Y axis
var y = d3.scaleLinear().range([height, 0]);
var yAxis = d3.axisLeft().scale(y);
svg.append("g")
  .attr("class","myYaxis")
function update(data) {

    // Create the X axis:
    x.domain([0, d3.max(data, function(d) { return d.ser1 }) ]);
    svg.selectAll(".myXaxis").transition()
      .duration(3000)
      .call(xAxis);
  
    // create the Y axis
    y.domain([0, d3.max(data, function(d) { return d.ser2  }) ]);
    svg.selectAll(".myYaxis")
      .transition()
      .duration(3000)
      .call(yAxis);
  
    // Create a update selection: bind to the new data
    var u = svg.selectAll(".lineTest")
      .data([data], function(d){ return d.ser1 });
  
    // Updata the line
    u
      .enter()
      .append("path")
      .attr("class","lineTest")
      .merge(u)
      .transition()
      .duration(3000)
      .attr("d", d3.line()
        .x(function(d) { return x(d.ser1); })
        .y(function(d) { return y(d.ser2); }))
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2.5)
  }




function addPost(){
    
    let domain = document.getElementById('domainChoice').value;
    document.cookie = "domain=" + domain;

    var myHeaders = new Headers();
    myHeaders.append("Authorization", JSON.parse(localStorage.getItem("userAuth")).id_token);
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify({domain:domain});

    var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
    };

    fetch("https://mz2vaziwya.execute-api.eu-west-1.amazonaws.com/prod/fetchfilters", requestOptions)
    .then(response => response.json())
    .then(statusBody => {
        var data = JSON.parse(statusBody.body)
        parse("tacticsList", data.tactics);
        parse("groupsList", data.groups);
        var platforms = get_platforms(domain);
        parse("platformsList", platforms);
        parse("malwareList", data.malware);


        function parse(selectID, filterData){
            for (let i = 0; i < filterData.length; i++){
                var option = document.createElement("option");
                option.value = filterData[i];
                option.innerHTML = filterData[i];
                document.getElementById(selectID).appendChild(option);
            }
            $('#'+selectID).multiselect({
                includeSelectAllOption: true,
                enableFiltering: true,
                enableCaseInsensitiveFiltering: true,
                filterPlaceholder:'Search',
                maxHeight: 350,
                numberDisplayed: 1,
                widthSynchronizationMode: 'ifPopupIsSmaller'
            });
        }

        function get_platforms(domain){
            if (domain=="enterprise_attack"){
                platforms = ["Linux", "macOS", "Windows", "Azure AD", "Office 365", "SaaS", "IaaS", "Google Workspace", "PRE", "Network", "Containers"]
                return platforms
            }
            if (domain=="mobile_attack"){
                platforms = ["Android", "iOS"]
                return platforms
            }
            if (domain=="ics_attack"){
                platforms = ["Field Controller/RTU/PLC/IED", "Safety Instrumented System/Protection Relay",
                            "Control Server", "Input/Output Server", "Windows", "Human-Machine Interface",
                            "Engineering Workstation", "Data Historian"]
                return platforms
            }
        }
        document.getElementById("domainDiv").remove();
        document.getElementById('additionalFilters').removeAttribute('hidden');
        document.querySelector(".box");
        update(medium);
    })
    .catch(error => console.log('error', error));
        
            
}   


//Fetching TechniqueMitigation data
function redirect(){
  localStorage.setItem("tolerance", document.getElementById("tolerance").value);
  
  document.getElementById('loading').removeAttribute('hidden');
  let domain = getCookie("domain");
  let tactics = $('#tacticsList').val();
  let threatNames = $('#groupsList').val();
  let platforms = $('#platformsList').val();
  let malwareNames = $('#malwareList').val();
  let includeSub = document.getElementById('includeSubTech').checked;
  let includeNonMappedT = document.getElementById("includeNonMappedT").checked;


  document.cookie = "tactics=" + tactics;
  document.cookie = "groups=" + threatNames;
  document.cookie = "platforms=" + platforms;
  document.cookie = "malware=" + malwareNames;
  document.cookie = "subTechnique=" + includeSub;
  document.cookie = "currentTechnique=T1;"
  document.cookie = "furthestReachedT=T1;"

  fetchrelevantDB(domain).then((db) => {
    console.log(db);
    window.taxiiDB = JSON.parse(db);
    getMalwareThreatAttackPatterns(domain, platforms, tactics, includeSub,malwareNames, threatNames,includeNonMappedT).then(([attackPatterns,malwareGroupIDs]) => {
        getFilteredAttackPatterns(domain,malwareGroupIDs.malwareGroupIDs,attackPatterns.attackPatterns, includeNonMappedT).then((objects) => {
            //Completely Filtered Attack Patterns
            var filterAttacks = []
            for (let i = 0; i < objects.length; i++){
                filterAttacks = filterAttacks.concat(objects[i].filteredAttackPatterns);
            }
            filterAttacks.sort((a, b) => {
                aParse = numericAttackPattern(a, domain);
                bParse = numericAttackPattern(b, domain);
                return (aParse - bParse)
            });
            fetchTechniqueMitigationObj(domain, filterAttacks).then((objects) => {
                var completeTechniqueObject = []
                for (let i = 0; i < objects.length; i++){
                    completeTechniqueObject = completeTechniqueObject.concat(objects[i].filteredAttackPatterns);
                }
                for (let i = 0; i < completeTechniqueObject.length; i++){
                    localStorage.setItem("T" + (i+1),JSON.stringify(completeTechniqueObject[i]));
                }
                window.location.replace("technique-forms.html")
            })
        });

    });
});   
}

function numericAttackPattern(attackPatten, domain){
  source_map = {
      "enterprise_attack": "mitre-attack",
      "mobile_attack": "mitre-mobile-attack",
      "ics_attack": "mitre-ics-attack",
  }
  domainSource = source_map[domain];
  externalRef = attackPatten.external_references;
  for (let i = 0; i < externalRef.length; i++) {
      if (externalRef[i].source_name == domainSource){
          return parseFloat(externalRef[i].external_id.split("T")[1]);
      }
    }
  return 1
}

function fetchrelevantDB(domain) {
  var requestOptions = {
    method: 'GET',
    redirect: 'follow'
  };
  if (domain == "enterprise_attack"){
    url = "https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json"
  }
  else if (domain == "mobile_attack") {
    url = "https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/mobile-attack/mobile-attack.json"
  }
  else if (domain == "ics_attack"){
    url = "https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/ics-attack/ics-attack.json"
  }
  return fetch(url, requestOptions)
  .then((res) => res.json())
}

function getMalwareThreatAttackPatterns(domain, platforms, tactics, includeSub,malwareNames, threatNames){
    return Promise.all([getRelevantAttackPatterns(domain,platforms,tactics,includeSub), getMalwareThreatID(domain,malwareNames,threatNames)]);
}

function getRelevantAttackPatterns(domain,platforms,tactics,includeSub) {
    var myHeaders = new Headers();
    myHeaders.append("Authorization", JSON.parse(localStorage.getItem("userAuth")).id_token);
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify({domain:domain,platforms:platforms,tactics:tactics, includeSub:includeSub, taxiiDB:window.taxiiDB});

    var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
    };
  return fetch("https://mz2vaziwya.execute-api.eu-west-1.amazonaws.com/prod/data/fetchrelevantattackpatterns", requestOptions)
  .then((res) => res.json())
  };

function getMalwareThreatID(domain,malwareNames,threatNames) {
  var myHeaders = new Headers();
    myHeaders.append("Authorization", JSON.parse(localStorage.getItem("userAuth")).id_token);
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify({domain:domain,malwareNames:malwareNames,threatNames:threatNames, taxiiDB:window.taxiiDB});

    var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
    };
  return fetch("https://mz2vaziwya.execute-api.eu-west-1.amazonaws.com/prod/data/fetchmalwaregroupids", requestOptions)
  .then((res) => res.json())
  };


function filterAttackPatterns(domain,malwareThreatIDs,attackPatterns, includeNonMappedT) {
  var myHeaders = new Headers();
    myHeaders.append("Authorization", JSON.parse(localStorage.getItem("userAuth")).id_token);
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify({domain:domain,malwareThreatIDs:malwareThreatIDs,attackPatterns:attackPatterns,includeNonMappedT:includeNonMappedT, taxiiDB:window.taxiiDB});

    var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
    };
  return fetch("https://mz2vaziwya.execute-api.eu-west-1.amazonaws.com/prod/data/filterbymalwaregroupids", requestOptions)
  .then((res) => res.json())
}
function techniqueMitigationObjects(domain,attackPatterns) {
  var myHeaders = new Headers();
  myHeaders.append("Authorization", JSON.parse(localStorage.getItem("userAuth")).id_token);
  myHeaders.append("Content-Type", "application/json");

  var raw = JSON.stringify({domain:domain,attackPatterns:attackPatterns, taxiiDB:window.taxiiDB});

  var requestOptions = {
  method: 'POST',
  headers: myHeaders,
  body: raw,
  redirect: 'follow'
  };
  return fetch("https://mz2vaziwya.execute-api.eu-west-1.amazonaws.com/prod/data/createtechniquemitigationobjects", requestOptions)
  .then((res) => res.json())
}


function fetchTechniqueMitigationObj(domain,attackPatterns) {
  if (attackPatterns.length < 100){
      splitattackPatterns = chunkArray(attackPatterns,3);
      return Promise.all([
          techniqueMitigationObjects(domain,splitattackPatterns[0]),techniqueMitigationObjects(domain,splitattackPatterns[1]),techniqueMitigationObjects(domain,splitattackPatterns[2])]
          )
  }
  else if (attackPatterns.length < 200){
      splitattackPatterns = chunkArray(attackPatterns,5);
      return Promise.all([
          techniqueMitigationObjects(domain,splitattackPatterns[0]),techniqueMitigationObjects(domain,splitattackPatterns[1]),techniqueMitigationObjects(domain,splitattackPatterns[2]),
          techniqueMitigationObjects(domain,splitattackPatterns[3]),
          techniqueMitigationObjects(domain,splitattackPatterns[4])]
          )
  }
  else {
      splitattackPatterns = chunkArray(attackPatterns,7);
      return Promise.all([
          techniqueMitigationObjects(domain,splitattackPatterns[0]),techniqueMitigationObjects(domain,splitattackPatterns[1]),techniqueMitigationObjects(domain,splitattackPatterns[2]),
          techniqueMitigationObjects(domain,splitattackPatterns[3]),
          techniqueMitigationObjects(domain,splitattackPatterns[4]),
          techniqueMitigationObjects(domain,splitattackPatterns[5]),
          techniqueMitigationObjects(domain,splitattackPatterns[6])])
  }
}

function getFilteredAttackPatterns(domain,malwareThreatIDs,attackPatterns, includeNonMappedT) {
    if (attackPatterns.length < 100){
        splitattackPatterns = chunkArray(attackPatterns,2);
        return Promise.all([
            filterAttackPatterns(domain,malwareThreatIDs,splitattackPatterns[0], includeNonMappedT),filterAttackPatterns(domain,malwareThreatIDs,splitattackPatterns[1], includeNonMappedT)])
    }
    else if (attackPatterns.length < 200){
        splitattackPatterns = chunkArray(attackPatterns,5);
        return Promise.all([
            filterAttackPatterns(domain,malwareThreatIDs,splitattackPatterns[0], includeNonMappedT),filterAttackPatterns(domain,malwareThreatIDs,splitattackPatterns[1], includeNonMappedT),filterAttackPatterns(domain,malwareThreatIDs,splitattackPatterns[2], includeNonMappedT),
            filterAttackPatterns(domain,malwareThreatIDs,splitattackPatterns[3], includeNonMappedT),
            filterAttackPatterns(domain,malwareThreatIDs,splitattackPatterns[4], includeNonMappedT)])
    }
    else {
        splitattackPatterns = chunkArray(attackPatterns,7);
        return Promise.all([
            filterAttackPatterns(domain,malwareThreatIDs,splitattackPatterns[0], includeNonMappedT),filterAttackPatterns(domain,malwareThreatIDs,splitattackPatterns[1], includeNonMappedT),filterAttackPatterns(domain,malwareThreatIDs,splitattackPatterns[2], includeNonMappedT),
            filterAttackPatterns(domain,malwareThreatIDs,splitattackPatterns[3], includeNonMappedT),
            filterAttackPatterns(domain,malwareThreatIDs,splitattackPatterns[4], includeNonMappedT),
            filterAttackPatterns(domain,malwareThreatIDs,splitattackPatterns[5], includeNonMappedT),
            filterAttackPatterns(domain,malwareThreatIDs,splitattackPatterns[6], includeNonMappedT)])
    }
    
}

function chunkArray(arr,n){
  var chunkLength = Math.max(arr.length/n ,1);
  var chunks = [];
  for (var i = 0; i < n; i++) {
      if(chunkLength*(i+1)<=arr.length)chunks.push(arr.slice(chunkLength*i, chunkLength*(i+1)));
  }
  return chunks; 
}

function getCookie(name){
    var re = new RegExp(name += "=([^;]+)");
    var value = re.exec(document.cookie);
    return (value != null) ? unescape(value[1]) : null;
}

