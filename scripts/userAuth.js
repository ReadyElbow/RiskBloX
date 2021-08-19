if (localStorage.getItem("userAuth") == null){
    console.log("No Auth exists");
    window.location.replace("../html/sign-in.html");
}
else {
    //to include > <script src="https://cdnjs.cloudflare.com/ajax/libs/jsrsasign/8.0.20/jsrsasign-all-min.js"></script>
    var requestOptions = {
    method: 'GET',
    redirect: 'follow'
    };
    
    fetch("https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_wz6qqFen9/.well-known/jwks.json", requestOptions)
    .then(response => response.json())
    .then(result => {
        var kids = [];
        Object.entries(result.keys).forEach(([key, value]) => {
            kids.push(value.kid);
        })
        //When refreshed there is an issue that the names change! In the case of id_token it becomes IDToken
        let oldUserAuth = JSON.parse(localStorage.getItem("userAuth"));
        let idToken = oldUserAuth.id_token != undefined ? (oldUserAuth.id_token).split('.') : (oldUserAuth.IdToken).split('.');
        let idTokenHeader = JSON.parse(atob(idToken[0]));
        let idTokenBody = JSON.parse(atob(idToken[1]));

        if (kids.includes(idTokenHeader.kid)) {
            expireTime = idTokenBody.exp;
            currentEpochTime = new Date().getTime();
            if ((expireTime - (currentEpochTime + 300)) < 0){
                var myHeaders = new Headers();
                myHeaders.append("X-Amz-Target", "AWSCognitoIdentityProviderService.InitiateAuth");
                myHeaders.append("Content-Type", "application/x-amz-json-1.1");

                var raw = {
                    ClientId: "3kr61qq6dpfs0c87t322m3ojth",
                    AuthFlow: "REFRESH_TOKEN_AUTH",
                    AuthParameters: {
                        "REFRESH_TOKEN":oldUserAuth.refresh_token
                }}

                var requestOptions = {
                method: 'POST',
                headers: myHeaders,
                body: JSON.stringify(raw),
                redirect: 'follow'
                };

                fetch("https://cognito-idp.eu-west-1.amazonaws.com/", requestOptions)
                .then(response => response.json())
                .then(result => {
                    userAuth.id_token = result.AuthenticationResult.IdToken
                    userAuth.access_token = result.AuthenticationResult.AccessToken
                    userAuth["refresh_token"] = oldUserAuth.refresh_token;
                    localStorage.setItem("userAuth", JSON.stringify(userAuth));
                })
            }
        }
        else {
            localStorage.removeItem("userAuth");
            window.location.replace("../html/sign-in.html");
        }
    })
    //.catch(error => window.location.replace("../html/sign-in.html"))
}
