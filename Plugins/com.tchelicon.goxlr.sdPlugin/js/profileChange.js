// this is our global websocket, used to communicate from/to Stream Deck software
// and some info about our plugin, as sent by Stream Deck software
var websocket = null,
uuid = null,
actionInfo = {};

function connectElgatoStreamDeckSocket(inPort, inUUID, inRegisterEvent, inInfo, inActionInfo) 
{
    uuid = inUUID;
    // please note: the incoming arguments are of type STRING, so
    // in case of the inActionInfo, we must parse it into JSON first
    actionInfo = JSON.parse(inActionInfo); // cache the info
    websocket = new WebSocket('ws://localhost:' + inPort);

    // if connection was established, the websocket sends
    // an 'onopen' event, where we need to register our PI
    websocket.onopen = function () {
        var json = {
            event:  inRegisterEvent,
            uuid:   inUUID
        };
        // register property inspector to Stream Deck
        websocket.send(JSON.stringify(json));
    }    
    
    websocket.onmessage = function (evt) 
    {        
        var jsonObj = JSON.parse(evt.data);

        if (jsonObj.event == "sendToPropertyInspector")
        {
            var payload = jsonObj.payload;

            if (Array.isArray(payload.Profiles))
            {
                var profilesList = payload.Profiles;
    
                var select = document.getElementById("profileList");
    
                select.options.length=0;
    
                for (var i = 0; i < profilesList.length; i++) 
                {
                    var option = document.createElement("option");
                    option.innerHTML = profilesList[i];
                    option.value = profilesList[i];
    
                    select.options.add(option);
                }
    
                getSettings();
            }
            else if (payload.hasOwnProperty("message"))
            {
                var connectionStatus = payload.connectionStatus;
                if (connectionStatus == 0)
                {
                    updateMessage(payload.message);
                    updateClassValue("message caution");
                }
                else if (connectionStatus == 1)
                {
                    location.reload();
                }
            }

        }

        if (jsonObj.event == "didReceiveSettings")
        {
            var settings = jsonObj.payload.settings;
            var select = document.getElementById("profileList");

            if (settings.hasOwnProperty("SelectedProfile"))
            {
                select.value = settings.SelectedProfile;
            }
            else
            {
                setSettings(select.value,  'SelectedProfile');
            }
        }            
    };
    
}

function getSettings()
{
    if (websocket)
    {
        const json = 
        {    
            "event": "getSettings",
            "context": uuid         
        };
        websocket.send(JSON.stringify(json));
    }
    
}

function setSettings(value, param)
{
    if (websocket)
    {
        const json = 
        {
            "event": "setSettings",
            "context": uuid,
            "payload":{
                [param] : value
            }
        };
        websocket.send(JSON.stringify(json));
    }
}

// our method to pass values to the plugin
function sendValueToPlugin(value, param) {
    if (websocket) {
        const json = {
                "action": actionInfo['action'],
                "event": "sendToPlugin",
                "context": uuid,
                "payload": {
                    [param] : value
                }
            };
            websocket.send(JSON.stringify(json));
    }
}

function updateMessage(messageToDisplay) 
{
    document.getElementById("connectivityMessage").innerHTML=(messageToDisplay);
}

function updateClassValue(newClass)
{
    document.getElementById("detailsTag").className = newClass;
}