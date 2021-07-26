function getCookie(name){
    var re = new RegExp(name += "=([^;]+)");
    var value = re.exec(document.cookie);
    return (value != null) ? unescape(value[1]) : null;
}

function fetchTechniques(){
    console.log(getCookie('platforms').split(','));
    fetch('http://127.0.0.1:5000/stix_taxii/generate', {
        method:'POST',
        headers:{
            'Accept':'application/json, text/plain, */*',
            'Content-type':'application/json'
        },
        body:JSON.stringify({domain:getCookie('domain'),groups:getCookie('groups').split(','),platforms:getCookie('platforms').split(','),tactics:getCookie('tactics').split(','), include_sub_technique:getCookie('subTechnique')})
    })
    .then((res) => res.json())
    .then((data) => {
        document.write(data);
    })
}