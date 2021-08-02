
//Standard Post request using Fetch
function addPost(){
    
    let domain = document.getElementById('domainChoice').value;

    fetch('http://127.0.0.1:5000/stix_taxii/tactic-groups', {
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


        function parse(selectID, filterData){
            for (let i = 0; i < filterData.length; i++){
                var option = document.createElement("option");
                option.value = filterData[i];
                option.innerHTML = filterData[i];
                document.getElementById(selectID).appendChild(option);
            }
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
        }
        document.getElementById('domainSubmit').remove();
        document.getElementById('additionalFilters').removeAttribute('hidden');
        document.querySelector(".box");
            
    });
        
                
}   

function redirect(){
    let domain = document.getElementById('domainChoice').value;
    let tactics = document.getElementById('tacticsList').value;
    let groups = document.getElementById('groupsList').value;
    let platforms = document.getElementById('platformsList').value;
    let includeSub = document.getElementById('includeSubTech').checked;

    var dataReturned = false;

    document.cookie = "domain=" + domain;
    document.cookie = "tactics=" + tactics;
    document.cookie = "groups=" + groups;
    document.cookie = "platforms=" + platforms;
    document.cookie = "subTechnique=" + includeSub;

    fetch('http://127.0.0.1:5000/stix_taxii/generate', {
        method:'POST',
        headers:{
            'Accept':'application/json, text/plain, */*',
            'Content-type':'application/json'
        },
        body:JSON.stringify({domain:domain,groups:groups.split(','),platforms:platforms.split(','),tactics:tactics.split(','), include_sub_technique:includeSub})
    })
    .then((res) => res.json())
    .then((data) => {
        for (let key in data) {
            let value = data[key];
            localStorage.setItem(key, JSON.stringify(value));
        }
        document.cookie = "currentTechnique=T1;"
        window.location.replace("technique-forms.html");
        })
}

