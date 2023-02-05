document.addEventListener('websocketCreate', function () {
    console.log("Websocket created!");
    showHideSettings(actionInfo.payload.settings);

    websocket.addEventListener('message', function (event) {
        console.log("Got message event!");

        // Received message from Stream Deck
        var jsonObj = JSON.parse(event.data);

        if (jsonObj.event === 'sendToPropertyInspector') {
            var payload = jsonObj.payload;
            showHideSettings(payload);
        }
        else if (jsonObj.event === 'didReceiveSettings') {
            var payload = jsonObj.payload;
            showHideSettings(payload.settings);
        }
    });
});

function showHideSettings(payload) {
    console.log("Show Hide Settings Called");
    setSingleImageMode("none");
    setFolderMode("none");
    setDiscoMode("none");
    setSaverStatusMessage(payload['saverEnabled']);
    if (payload['screenSaverMode'] == 0) {
        setSingleImageMode("");
    }
    else if (payload['screenSaverMode'] == 1) {
        setFolderMode("");
    }
    else if (payload['screenSaverMode'] == 2) {
        setDiscoMode("");
    }

    setShowMatrixSettings("none");
    if (payload['visualEffect'] == '4') {
        setShowMatrixSettings("");
    }
}

function setSingleImageMode(displayValue) {
    var dvSingleImageMode = document.getElementById('dvSingleImageMode');
    dvSingleImageMode.style.display = displayValue;
}

function setFolderMode(displayValue) {
    var dvFolderMode = document.getElementById('dvFolderMode');
    dvFolderMode.style.display = displayValue;
}

function setDiscoMode(displayValue) {
    var dvDiscoMode = document.getElementById('dvDiscoMode');
    dvDiscoMode.style.display = displayValue;
}

function setShowMatrixSettings(displayValue) {
    var dvMatrixChaos = document.getElementById('dvMatrixChaos');
    dvMatrixChaos.style.display = displayValue;
}

function setSaverStatusMessage(isEnabled) {
    var msgStatus1 = document.getElementById('msgStatus1');
    msgStatus1.innerText = "";
    if (!isEnabled) {
        msgStatus1.innerText = "Plugin is currently DISABLED! Enable by checking the 'CIRCUT BREAKER' checkbox at the very bottom";
    }
}