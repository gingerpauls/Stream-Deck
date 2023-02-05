var pairingEnabled = false;
// Load the pairing view
function loadPairingView() {
    console.log("Pairing view loaded");
    // Time used to automatically pair bridges
    var autoPairingTimeout = 5;

    // Set the status bar
    setStatusBar('pairing');

    // Fill the title
    document.getElementById('title').innerHTML = localization['Pairing']['Title'];

    // Fill the content area
    var content = "<div class='leftAlign'><p class='leftAlign'>" + localization['Pairing']['Description'] + "</p> \
                   <p class='leftAlign'>" + localization['Pairing']['PleaseWait'] + "<img class='imageSmall' src='images/loading.gif'></p><hr/><br/></div> \
                   <div id = 'controls' ></div> ";
    document.getElementById('content').innerHTML = content;

    if (pairingEnabled) {
        enablePairing();
    }

    // Start the pairing
    autoPairing();
}

function enablePairing() {
    console.log("Pairing enabled");
    pairingEnabled = true;
    window.opener.openSpotifyAuth();

    var content = "<div class='leftAlign'><p class='leftAlign'>" + localization['Pairing']['Description'] + "</p> \
                   <p class='leftAlign'>" + localization['Pairing']['DescriptionPart2'] + "</p><hr/><br/></div> \
                  <div id = 'controls' ></div> ";
    document.getElementById('content').innerHTML = content;

    document.getElementById('app-over').className = "ellipseStart ellipseTopLeft";
    document.getElementById('br-over').className = "ellipseStart  ellipseBottomRight";

    autoPairing();
}

function autoPairing() {
    console.log('autoPairing called!');
    unloadControlsBinding();

    // Show manual user controls instead
    var controls = "<div id='loader'></div> \
                    <div class='button-transparent' id='close'>" + localization['Pairing']['Cancel'] + "</div>";
    document.getElementById('controls').innerHTML = controls;

    // Add event listener
    document.getElementById("close").addEventListener("click", closeWindow);
    document.addEventListener("escPressed", closeWindow);

    if (!timerPairingTimeout) {
        timerPairingTimeout = setTimeout(function () { console.log('Pairing timeout!'); loadFailedView(); }, 60000)
    }
}

// Close the window
function closeWindow() {
    window.close();
}

// Unload view
function unloadControlsBinding() {
    try {
        document.getElementById("submit").removeEventListener("click", submit);
        document.getElementById("close").removeEventListener("click", closeWindow);
        // Remove event listener
        document.removeEventListener("enterPressed", submit);
        document.removeEventListener("escPressed", closeWindow);
    }
    catch (error) { }
}