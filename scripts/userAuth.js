if (localStorage.getItem("userAuth") == null){
    window.location.replace("../html/sign-in.html");
}
else {
    //to include > <script src="https://cdnjs.cloudflare.com/ajax/libs/jsrsasign/8.0.20/jsrsasign-all-min.js"></script>
    var requestOptions = {
    method: 'GET',
    redirect: 'follow'
    };
    
    fetch("https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_RGndlDTXp/.well-known/jwks.json", requestOptions)
    .then(response => response.json())
    .then(result => {
        var kids = [];
        Object.entries(result.keys).forEach(([key, value]) => {
            kids.push(value.kid);
            console.log(kids);
        })
        let userAuth = JSON.parse(localStorage.getItem("userAuth"));
        let idToken = (userAuth.id_token).split('.');
        let idTokenHeader = JSON.parse(atob(idToken[0]));
        let idTokenBody = JSON.parse(atob(idToken[1]));

        if (idTokenHeader.kid in kids) {
            expireTime = idTokenBody.exp;
            currentEpochTime = new Date().getTime();
            if ((expireTime - (currentEpochTime + 300)) < 0){
                var myHeaders = new Headers();
                myHeaders.append("X-Amz-Target", "AWSCognitoIdentityProviderService.InitiateAuth");
                myHeaders.append("Content-Type", "application/x-amz-json-1.1");

                var raw = {
                    ClientId: "1u6de2f6rfuri5c72tn6h2ogt1",
                    AuthFlow: "REFRESH_TOKEN_AUTH",
                    AuthParameters: {
                        "REFRESH_TOKEN":userAuth.refresh_token
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
                    userAuth = result.AuthenticationResult
                    userAuth["refresh_token"] = userAuth.refresh_token;
                    localStorage.setItem("userAuth", userAuth);
                })
            }
        }
        else {
            localStorage.removeItem("userAuth");
            window.location.replace("../html/sign-in.html");
        }
    })
    .catch(error => window.location.replace("../html/sign-in.html"))
}