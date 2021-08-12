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

//Standard Post request using Fetch
function addPost(){
    
    let domain = document.getElementById('domainChoice').value;
    document.cookie = "domain=" + domain;

    fetch('https://mz2vaziwya.execute-api.eu-west-1.amazonaws.com/prod/fetchfilters', {
        method:'POST',
        headers:{
            'Accept':'application/json, text/plain, */*',
            'Content-type':'application/json',
            'Access-Control-Allow-Origin': true
        },
        body:JSON.stringify({domain:domain})
    })
    .then((res) => res.json())
    .then((data) => {
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
    });
        
                
}   

function redirect(){
    localStorage.setItem("tolerance", document.getElementById("tolerance").value);
    
    document.getElementById('loading').removeAttribute('hidden');
    let domain = getCookie("domain");
    let tactics = $('#tacticsList').val();
    let groups = $('#groupsList').val();
    let platforms = $('#platformsList').val();
    let malware = $('#malwareList').val();
    let includeSub = document.getElementById('includeSubTech').checked;
    let includeNonMappedT = document.getElementById("includeNonMappedT").checked;


    var dataReturned = false;

    document.cookie = "tactics=" + tactics;
    document.cookie = "groups=" + groups;
    document.cookie = "platforms=" + platforms;
    document.cookie = "malware=" + malware;
    document.cookie = "subTechnique=" + includeSub;
    document.cookie = "currentTechnique=T1;"
    document.cookie = "furthestReachedT=T1;"

    fetch('http://' + apiHost + '/stix_taxii/generate', {
        method:'POST',
        headers:{
            'Accept':'application/json, text/plain, */*',
            'Content-type':'application/json'
        },
        body:JSON.stringify({domain:domain,groups:groups,platforms:platforms,tactics:tactics,malware:malware, include_sub_technique:includeSub,includeNonMappedT:includeNonMappedT})
    })
    .then((res) => res.json())
    .then((data) => {
        console.log(data);
        for (let key in data) {
            let value = data[key];
            localStorage.setItem(key, JSON.stringify(value));
        }
        window.location.replace("technique-forms.html");
        })
}

function getCookie(name){
    var re = new RegExp(name += "=([^;]+)");
    var value = re.exec(document.cookie);
    return (value != null) ? unescape(value[1]) : null;
}

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