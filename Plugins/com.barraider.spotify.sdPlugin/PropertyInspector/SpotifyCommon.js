var authWindow = null;
var clientId = null;

document.addEventListener('websocketCreate', function () {
    console.log("Websocket created!");
    checkToken(actionInfo.payload.settings);

    websocket.addEventListener('message', function (event) {
        console.log("Got message event!");

        // Received message from Stream Deck
        var jsonObj = JSON.parse(event.data);

        if (jsonObj.event === 'sendToPropertyInspector') {
            var payload = jsonObj.payload;
            checkToken(payload);
        }
        else if (jsonObj.event === 'didReceiveSettings') {
            var payload = jsonObj.payload;
            checkToken(payload.settings);
        }
    });
});

function checkToken(payload) {
    console.log("Checking Token...");

    if (payload['clientId']) {
        console.log("Got new client id!");
        clientId = payload['clientId'];
        if (authWindow) {
            console.log("Enabling pairing");
            authWindow.enablePairing();
        }
        return;
    }

    var tokenExists = document.getElementById('tokenExists');
    tokenExists.value = payload['tokenExists'];

    if (payload['tokenExists']) {
        setSettingsWrapper("");
        var event = new Event('tokenExists');
        document.dispatchEvent(event);

        if (authWindow) {
            console.log("Loading Success View");
            authWindow.loadSuccessView();
        }
    }
    else {
        setSettingsWrapper("none");
        if (authWindow) {
            console.log("Setup handling missing token");
            authWindow.handleMissingToken();
        }
        else {
            if (!clientId) {
                getClientId();
            }
            console.log("Loading Setup Wizard");
            authWindow = window.open("Setup/index.html");
        }
    }
}

function setSettingsWrapper(displayValue) {
    var sdWrapper = document.getElementById('sdWrapper');
    sdWrapper.style.display = displayValue;
}

function resetPlugin() {
    var payload = {};
    payload.property_inspector = 'resetPlugin';
    sendPayloadToPlugin(payload);
}

function updateApprovalCode(val) {
    var approvalCode = val;

    var payload = {};
    payload.property_inspector = 'updateApproval';
    payload.approvalCode = approvalCode;
    payload.clientId = clientId;
    sendPayloadToPlugin(payload);
    console.log("Approving code");
}

function updateAPIKeys(clientId, secretId) {
    var payload = {};
    payload.property_inspector = 'updateAPI';
    payload.clientId = clientId;
    payload.secretId = secretId;
    console.log("Approving API", payload.clientId);
    sendPayloadToPlugin(payload);
}

function getClientId() {
    console.log("Getting client id");

    if (clientId) {
        console.log("Client id exists");
        if (authWindow) {
            console.log("Enabling pairing");
            authWindow.enablePairing();
        }
        return;
    }

    var payload = {};
    payload.property_inspector = 'getclientid';
    sendPayloadToPlugin(payload);
}

function openSpotifyAuth() {
    if (!clientId) {
        console.log('openSpotifyAuth with no clientId');
        getClientId();
        return;
    }

    if (websocket && (websocket.readyState === 1)) {
        const json = {
            'event': 'openUrl',
            'payload': {
                'url': 'https://accounts.spotify.com/authorize?client_id=' + clientId + '&response_type=code&redirect_uri=http://localhost:4202&scope=user-read-private%20user-read-email%20user-read-playback-state%20user-modify-playback-state%20playlist-read-private%20playlist-read-collaborative%20playlist-modify-public%20playlist-modify-private%20user-library-modify%20user-library-read'
            }
        };
        websocket.send(JSON.stringify(json));
    }
}

function openSpotifyHelp() {
    if (websocket && (websocket.readyState === 1)) {
        const json = {
            'event': 'openUrl',
            'payload': {
                'url': 'https://buz.bz/Spot'
            }
        };
        websocket.send(JSON.stringify(json));
    }
}

function openSpotifyDashboard() {
    if (websocket && (websocket.readyState === 1)) {
        const json = {
            'event': 'openUrl',
            'payload': {
                'url': 'https://developer.spotify.com/dashboard/applications'
            }
        };
        websocket.send(JSON.stringify(json));
    }
}

function openTwitter() {
    if (websocket && (websocket.readyState === 1)) {
        const json = {
            'event': 'openUrl',
            'payload': {
                'url': 'https://buz.bz/barT'
            }
        };
        websocket.send(JSON.stringify(json));
    }
}

function openAlbumArtTutorial() {
    if (websocket && (websocket.readyState === 1)) {
        const json = {
            'event': 'openUrl',
            'payload': {
                'url': 'https://buz.bz/mVaR'
            }
        };
        websocket.send(JSON.stringify(json));
    }
}