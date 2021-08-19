function checkRedirect(path){
    if (localStorage.getItem("userAuth") == null){
    }
    else {
        window.location.replace(path);
    }
}