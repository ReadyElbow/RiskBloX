
//Standard Post request using Fetch
function addPost(){
    
    let domain = document.getElementById('domain').value;

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
        let title = '<h2>Additional Filters</h2>'
        
        tactics = parse("Tactics", data.tactics)
        groups = parse("Groups", data.groups)
        platforms = get_platforms(domain)


        function parse(filter, filterData){
            output = ""
            output +=`<label>${filter} <select id=${filter} name=${filter} size="1"> <option value="All" selected>All</option>`;
            for (let i = 0; i < filterData.length; i++){
                console.log(filterData[i]);
                output += `<option value=${filterData[i]}>${filterData[i]}</option>`;
            }
            output += `</select></label>`
            return output
        }

        function get_platforms(domain){
            if (domain=="enterprise_attack"){
                platforms = ["Linux", "macOS", "Windows", "Azure AD", "Office 365", "SaaS", "IaaS", "Google Workspace", "PRE", "Network", "Containers"]
                return parse("Platforms",platforms)
            }
            if (domain=="mobile_attack"){
                platforms = ["Android", "iOS"]
                return parse("Platforms",platforms)
            }
        }

        let includeSub = `<label>Include SubTechniques? <select id=includeSub name=includeSub size="1"> <option value="True" selected>Yes</option><option value="False" selected>No</option></select>`;

        let allFilters = `<button id="submitFilters" onclick="redirect()">Submit</button>`

        document.getElementById('output').innerHTML = title;
        document.getElementById('tacticDiv').innerHTML = tactics;
        document.getElementById('groupDiv').innerHTML = groups;
        document.getElementById('platformDiv').innerHTML = platforms;
        document.getElementById('subTechniques').innerHTML = includeSub;
        document.getElementById('fullSubmit').innerHTML = allFilters;
        document.getElementById('submitDomain').remove()
        
    });
                
}   

function redirect(){
    let domain = document.getElementById('domain').value;
    let tactics = document.getElementById('Tactics').value;
    let groups = document.getElementById('Groups').value;
    let platforms = document.getElementById('Platforms').value;
    let includeSub = document.getElementById('includeSub').value;

    document.cookie = "domain=" + domain;
    document.cookie = "tactics=" + tactics;
    document.cookie = "groups=" + groups;
    document.cookie = "platforms=" + platforms;
    document.cookie = "subTechnique=" + includeSub;
    window.location.replace("technique-forms.html");
}

