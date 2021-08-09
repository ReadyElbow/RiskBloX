//Standard Post request using Fetch
function addPost(){
    
    let domain = document.getElementById('domainChoice').value;
    document.cookie = "domain=" + domain;

    fetch('http://'+apiHost+'/stix_taxii/tactic-groups', {
        method:'POST',
        headers:{
            'Accept':'application/json, text/plain, */*',
            'Content-type':'application/json'
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
        toleranceGraph();
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


function toleranceGraph(){
    // set the dimensions and margins of the graph
    var margin = {top: 10, right: 30, bottom: 30, left: 60},
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3.select("#my_dataviz")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

    //Read the data
    d3.csv("https://raw.githubusercontent.com/holtzy/data_to_viz/master/Example_dataset/5_OneCatSevNumOrdered.csv", function(data) {

    // group the data: I want to draw one line per group
    var sumstat = d3.nest() // nest function allows to group the calculation per level of a factor
    .key(function(d) { return d.name;})
    .entries(data);

    // Add X axis --> it is a date format
    var x = d3.scaleLinear()
    .domain(d3.extent(data, function(d) { return d.year; }))
    .range([ 0, width ]);
    svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).ticks(5));

    // Add Y axis
    var y = d3.scaleLinear()
    .domain([0, d3.max(data, function(d) { return +d.n; })])
    .range([ height, 0 ]);
    svg.append("g")
    .call(d3.axisLeft(y));

    // color palette
    var res = sumstat.map(function(d){ return d.key }) // list of group names
    var color = d3.scaleOrdinal()
    .domain(res)
    .range(['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33','#a65628','#f781bf','#999999'])

    // Draw the line
    svg.selectAll(".line")
    .data(sumstat)
    .enter()
    .append("path")
        .attr("fill", "none")
        .attr("stroke", function(d){ return color(d.key) })
        .attr("stroke-width", 1.5)
        .attr("d", function(d){
        return d3.line()
            .x(function(d) { return x(d.year); })
            .y(function(d) { return y(+d.n); })
            (d.values)
        })

    })
}