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
        setTimeElapsed("none");
        if (payload['showTimeElapsed'] || payload['showTimeRemaining']) {
            setTimeElapsed("");
        }

        setSongFileName("none");
        if (payload['showSongName']) {
            setSongFileName("");
        }
    }
}

function setSongFileName(displayValue) {
    var songFileName = document.getElementById('dvSongFileSettings');
    songFileName.style.display = displayValue;
}

function setTimeElapsed(displayValue) {
    var timeElapsed = document.getElementById('dvTimeElapsedFontSize');
    timeElapsed.style.display = displayValue;
}

function openDiscord() {
    if (websocket && (websocket.readyState === 1)) {
        const json = {
            'event': 'openUrl',
            'payload': {
                'url': 'https://buz.bz/d'
            }
        };
        websocket.send(JSON.stringify(json));
    }
}