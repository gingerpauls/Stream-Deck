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
    console.log('Show Hide Settings');
    console.log(payload);
    if (payload['tokenExists']) {       
        setSaveToFileSettings("none");
        if (payload['saveType'] == 1 || payload['saveType'] == 2) {
            setSaveToFileSettings("");
        }
    }
}

function setSaveToFileSettings(displayValue) {
    var dvSaveToFileSettings = document.getElementById('dvSaveToFileSettings');
    dvSaveToFileSettings.style.display = displayValue;
}
