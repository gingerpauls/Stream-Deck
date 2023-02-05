// Load the API view
function loadAPIView() {
    console.log("API view loaded");

    // Set the status bar
    setStatusBar('api');

    // Fill the title
    document.getElementById('title').innerHTML = localization['API']['Title'];

    // Fill the content area
     var content = "<div class='leftAlign'><p class='leftAlign'>" + localization['API']['Description'] + " \
                   <span class='linkspan' onclick='window.opener.openSpotifyHelp()'>" + localization['API']['ClickHere'] + "</span></p> " +
                   //<p class='small leftAlign margin-top0'>" + localization['API']['QuickLink'] + "<span class='linkspan' onclick='window.opener.openSpotifyDashboard()'>" + localization['API']['Dashboard'] + "</span></p>\
                   "</div>\
        <div id = 'controls' class = 'leftAlign' ></div> ";
    document.getElementById('content').innerHTML = content;

    // Show manual user controls instead
    var controls = "<input type='textarea' class='textbox' value='' id='clientId' placeholder='" + localization['API']['ClientIdPlaceholder'] + "'><span id='clientId-error' class='error bold' style='display:none;'>*</span><br/>\
                    <input type='textarea' class='textbox' value='' id='secretId' placeholder='" + localization['API']['ClientSecretPlaceholder'] + "'><span id='secretId-error' class='error bold' style='display:none;'>*</span>&nbsp;&nbsp;<span title='" + localization['API']['SecretWarning'] + "'>🛈</span><br/>\
                    <p class='nextStep'>" + localization['API']['NextStep'] + "<p>\
                    <div class='button' id='submitAPI'> " + localization['API']['Submit'] + "</div > \
                    <div class='button-transparent' id='close'>" + localization['API']['Close'] + "</div>";
    document.getElementById('controls').innerHTML = controls;

    document.getElementById('app-over').className = "ellipseStart ellipseTopLeft";

    // Add event listener
    document.getElementById("submitAPI").addEventListener("click", submitAPI);
    document.addEventListener("enterPressed", submitAPI);

    document.getElementById("close").addEventListener("click", closeWindow);
    document.addEventListener("escPressed", closeWindow);
}

// Retry API by reloading the view
function submitAPI() {
    var clientId = document.getElementById('clientId').value;
    var secretId = document.getElementById('secretId').value;
    var validationFailed = false;

    if (!clientId || clientId.length === 0) {
        validationFailed = true;
        document.getElementById('clientId-error').style.display = '';
    }

    if (!secretId || secretId.length === 0) {
        validationFailed = true;
        document.getElementById('secretId-error').style.display = '';
    }

    if (validationFailed) {
        return;
    }

    window.opener.updateAPIKeys(clientId, secretId);
    window.opener.getClientId();
    unloadAPIView();
    loadPairingView();
}


// Close the window
function closeWindow() {
    window.close();
}

// Unload view
function unloadAPIView() {
    try {
        document.getElementById("submitAPI").removeEventListener("click", submitAPI);
        document.getElementById("close").removeEventListener("click", closeWindow);
        // Remove event listener
        document.removeEventListener("enterPressed", submit);
        document.removeEventListener("escPressed", closeWindow);
    }
    catch (error) { }
}