
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
                numberDisplayed: 2,
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
        }
        document.getElementById('domainSubmit').remove();
        document.getElementById('additionalFilters').removeAttribute('hidden');
        document.querySelector(".box");
            
    });
        
                
}   

function redirect(){
    document.getElementById('loading').removeAttribute('hidden');
    let domain = document.getElementById('domainChoice').value;
    let tactics = $('#tacticsList').val();
    let groups = $('#groupsList').val();
    let platforms = $('#platformsList').val();
    let malware = $('#malwareList').val();
    let includeSub = document.getElementById('includeSubTech').checked;

    var dataReturned = false;

    document.cookie = "domain=" + domain;
    document.cookie = "tactics=" + tactics;
    document.cookie = "groups=" + groups;
    document.cookie = "platforms=" + platforms;
    document.cookie = "malware=" + malware;
    document.cookie = "subTechnique=" + includeSub;
    document.cookie = "currentTechnique=T1;"

    fetch('http://127.0.0.1:5000/stix_taxii/generate', {
        method:'POST',
        headers:{
            'Accept':'application/json, text/plain, */*',
            'Content-type':'application/json'
        },
        body:JSON.stringify({domain:domain,groups:groups,platforms:platforms,tactics:tactics,malware:malware, include_sub_technique:includeSub})
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

