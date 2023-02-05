// this is our global websocket, used to communicate from/to Stream Deck software
// and some info about our plugin, as sent by Stream Deck software
var websocket = null,
uuid = null,
actionInfo = {};

function connectElgatoStreamDeckSocket(inPort, inUUID, inRegisterEvent, inInfo, inActionInfo) {
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

        applySettings(actionInfo);
        //getSettings();
    }

    websocket.onmessage = function (evt) 
    {        
        var jsonObj = JSON.parse(evt.data);

        if (jsonObj.event == "didReceiveSettings")
        {
            console.log("didReceiveSettings event received");
            applySettings(jsonObj);
        }
        else if(jsonObj.event == "sendToPropertyInspector")
        {
            console.log("sendToPropertyInspector event received");
            var payload = jsonObj.payload;
            if (payload.hasOwnProperty("message"))
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

    };

}

function applySettings( jsonObj )
{
    var settings = jsonObj.payload.settings;
            
    if (settings.hasOwnProperty("RoutingInput"))
    {
        var select = document.getElementById("RoutingInput");
        select.value = settings.RoutingInput;
    }
    if (settings.hasOwnProperty("RoutingOutput"))
    {
        var select = document.getElementById("RoutingOutput");
        select.value = settings.RoutingOutput;
    }
    if (settings.hasOwnProperty("RoutingAction"))
    {
        var select = document.getElementById("RoutingAction");
        select.value = settings.RoutingAction;
    }
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

function setSettings()
{
    if (websocket)
    {
        var InputSelect = document.getElementById("RoutingInput");
        var OutputSelect = document.getElementById("RoutingOutput");
        var ActionSelect = document.getElementById("RoutingAction");

        const json = 
        {
            "event": "setSettings",
            "context": uuid,
            "payload":{
                "RoutingInput" : InputSelect.value,
                "RoutingOutput" : OutputSelect.value,
                "RoutingAction" : ActionSelect.value
            }
        };
        websocket.send(JSON.stringify(json));

    }
}

function updateMessage(messageToDisplay) {
    document.getElementById("connectivityMessage").innerHTML=(messageToDisplay);

}
function updateClassValue(newClass)
{
    document.getElementById("detailsTag").className = newClass;
}