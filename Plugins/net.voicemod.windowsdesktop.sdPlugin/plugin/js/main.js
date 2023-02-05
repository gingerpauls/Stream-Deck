/* global debug, connectSocket, $SD */
/* eslint no-undef: "error",
  curly: 0,
  no-caller: 0
*/
var DestinationEnum = Object.freeze({
    HARDWARE_AND_SOFTWARE: 0,
    HARDWARE_ONLY: 1,
    SOFTWARE_ONLY: 2
});

var debug = debug || false,
    debugLog;
    debug = false;
if (debug) debugLog = console.log.bind(window.console);
else debugLog = function () {};


// Create a wrapper to allow passing JSON to the socket
WebSocket.prototype.sendJSON = function (jsn, log) {
    if (log) {
        console.log('SendJSON', this, jsn);
    }
    this.send(JSON.stringify(jsn));
};

/**
 * connectSocket
 * This is the first function StreamDeck Software calls, when
 * establishing the connection to the plugin or the Property Inspector
 * @param {string} inPort - The socket's port to communicate with StreamDeck software.
 * @param {string} inUUID - A unique identifier, which StreamDeck uses to communicate with the plugin
 * @param {string} inMessageType - Identifies, if the event is meant for the property inspector or the plugin.
 * @param {string} inApplicationInfo - Information about the host (StreamDeck) application
 * @param {string} inActionInfo - Context is an internal identifier used to communicate to the host application.
 **/
function connectElgatoStreamDeckSocket (
    inPort,
    inUUID,
    inMessageType,
    inApplicationInfo,
    inActionInfo
) {
    console.log('connectSocket......', arguments);
    StreamDeck.getInstance().connect(arguments);
}

/**
 * StreamDeck object containing all required code to establish
 * communication with SD-Software and the Property Inspector
 */
const StreamDeck = (function () {
    var instance;
    /*
      Populate and initialize internally used properties
    */

    function init () {
        // *** PRIVATE ***
        var inPort,
            inUUID,
            inMessageType,
            inApplicationInfo,
            inActionInfo,
            websocket = null;

        var events = ELGEvents.eventEmitter();
        var logger = SDDebug.logger();

        function showVars () {
            debugLog('---- showVars');
            debugLog('- port', inPort);
            debugLog('- uuid', inUUID);
            debugLog('- messagetype', inMessageType);
            debugLog('- info', inApplicationInfo);
            debugLog('- inActionInfo', inActionInfo);
            debugLog('----< showVars');
        }

        function connect (args) {
            inPort = args[0];
            inUUID = args[1];
            inMessageType = args[2];
            inApplicationInfo = parseJson(args[3]);
            inActionInfo =
                args[4] !== 'undefined' ? parseJson(args[4]) : args[4];

            /** Debug variables */
            if (debug) {
                showVars();
            }

            /** restrict the API to what's possible
             * within Plugin or Property Inspector
             * <unused for now>
             */
            // $SD.api = SDApi[inMessageType];

            if (websocket) {
                websocket.close();
                websocket = null;
            };

            websocket = new WebSocket(`ws://127.0.0.1:${inPort}`);

            websocket.onopen = function () {
                var json = {
                    event: inMessageType,
                    uuid: inUUID
                };

                // console.log('***************', inMessageType + "  websocket:onopen", inUUID, json);

                websocket.sendJSON(json);

                instance.emit('connected', {
                    connection: websocket,
                    port: inPort,
                    uuid: inUUID,
                    plugin: inActionInfo,
                    info: inApplicationInfo,
                    messageType: inMessageType
                });
            };

            websocket.onerror = function (evt) {
                console.warn('WEBOCKET ERROR', evt, evt.data);
            };

            websocket.onclose = function (evt) {
                // Websocket is closed
                var reason = WEBSOCKETERROR(evt);
                console.log(
                    '[STREAMDECK]***** WEBSOCKET CLOSED **** reason:',
                    reason
                );

            };

            websocket.onmessage = function (evt) {
                var jsonObj = parseJson(evt.data);
                var m = '';

                // console.log('[STREAMDECK] websocket.onmessage ... ', jsonObj);

                if (!jsonObj.hasOwnProperty('action')) {
                    m = jsonObj.event;
                    console.log('%c%s','color: white; background: red; font-size: 12px;', '[common.js]', m);
                } else {
                    switch (inMessageType) {
                    case 'registerPlugin':
                        m = jsonObj['action'] + '.' + jsonObj['event'];
                        break;
                    case 'registerPropertyInspector':
                        m = 'sendToPropertyInspector';

                        break;
                    default:
                        console.log('+++++++++  PROBLEM ++++++++');
                        console.log('UNREGISTERED MESSAGETYPE:', inMessageType);
                    }
                }

                if (m && m !== '')
                    events.emit(m, jsonObj);
            };

            instance.connection = websocket;
        }

        return {
            // *** PUBLIC ***
            uuid: inUUID,
            on: events.on,
            emit: events.emit,
            connection: websocket,
            connect: connect,
            api: null,
            logger: logger
        };
    }

    return {
        getInstance: function () {
            if (!instance) {
                instance = init();
                // console.log(">>>>>>> INSTANCE", instance);
            }
            return instance;
        }
    };
})();

/** ELGEvents
 * Publish/Subscribe pattern to quickly signal events to
 * the plugin, property inspector and data.
 */

const ELGEvents = {
    eventEmitter: function (name, fn) {
        const eventList = new Map();

        const on = (name, fn) => {
            if (!eventList.has(name)) eventList.set(name, ELGEvents.pubSub());

            return eventList.get(name).sub(fn);
        };

        const has = (name) =>
            eventList.has(name);

        const emit = (name, data) =>
            eventList.has(name) && eventList.get(name).pub(data);

        return Object.freeze({ on, has, emit, eventList });
    },

    pubSub: function pubSub () {
        const subscribers = new Set();

        const sub = fn => {
            subscribers.add(fn);
            return () => {
                subscribers.delete(fn);
            };
        };

        const pub = data => subscribers.forEach(fn => fn(data));
        return Object.freeze({ pub, sub });
    }
};

/** SDApi
 * This is the main API to communicate between plugin, property inspector and
 * application host.
 * Internal functions:
 * - setContext: sets the context of the current plugin
 * - exec: prepare the correct JSON structure and send
 *
 * Methods exposed in the $SD.api alias
 * Messages send from the plugin
 * -----------------------------
 * - showAlert
 * - showOK
 * - setSettings
 * - setTitle
 * - setImage
 * - sendToPropertyInspector
 *
 * Messages send from Property Inspector
 * -------------------------------------
 * - sendToPlugin
 *
 * Messages received in the plugin
 * -------------------------------
 * willAppear
 * willDisappear
 * keyDown
 * keyUp
 */

const SDApi = {
    send: function (context, fn, payload, debug) {
        /** Combine the passed JSON with the name of the event and it's context
         * If the payload contains 'event' or 'context' keys, it will overwrite existing 'event' or 'context'.
         * This function is non-mutating and thereby creates a new object containing
         * all keys of the original JSON objects.
         */
        // console.log("SEND...........", payload)
        const pl = Object.assign({}, { event: fn, context: context }, payload);

        /** Check, if we have a connection, and if, send the JSON payload */
        if (debug) {
            console.log('-----SDApi.send-----');
            console.log(pl);
            console.log(payload.payload);
            console.log(JSON.stringify(payload.payload));
            console.log('-------');
        }
        $SD.connection && $SD.connection.sendJSON(pl);

        /**
         * DEBUG-Utility to quickly show the current payload in the Property Inspector.
         */

        if (
            $SD.connection &&
            [
                'sendToPropertyInspector',
                'showOK',
                'showAlert',
                'setSettings'
            ].indexOf(fn) === -1
        ) {
            // console.log("send.sendToPropertyInspector", payload);
            // this.sendToPropertyInspector(context, typeof payload.payload==='object' ? JSON.stringify(payload.payload) : JSON.stringify({'payload':payload.payload}), pl['action']);
        }
    },

    /** Messages send from the plugin */
    showAlert: function (context) {
        this.send(context, 'showAlert', {});
    },

    showOk: function (context) {
        this.send(context, 'showOk', {});
    },

    setSettings: function (context, payload) {
        this.send(context, 'setSettings', {
            payload: payload
        });
    },

    setTitle: function (context, title, target) {
        this.send(context, 'setTitle', {
            payload: {
                title: '' + title || '',
                target: target || DestinationEnum.HARDWARE_AND_SOFTWARE
            }
        });
    },

    setImage: function (context, img, target) {
        this.send(context, 'setImage', {
            payload: {
                image: img || '',
                target: target || DestinationEnum.HARDWARE_AND_SOFTWARE
            }
        });
    },

    sendToPropertyInspector: function (context, payload, action) {
        this.send(context, 'sendToPropertyInspector', {
            action: action,
            payload: payload
        });
    },

    /** Messages send from Property Inspector */
    sendToPlugin: function (piUUID, action, payload) {
        this.send(
            piUUID,
            'sendToPlugin',
            {
                action: action,
                payload: payload || {}
            },
            false
        );
    },

    /** Messages received in the plugin: */

    /** COMMON */

    debugPrint: function (context, inString) {
        // console.log("------------ DEBUGPRINT");
        // console.log([].slice.apply(arguments).join());
        // console.log("------------ DEBUGPRINT");
        this.send(context, 'debugPrint', {
            payload: [].slice.apply(arguments).join('.') || ''
        });
    },

    dbgSend: function (fn, context) {
        /** lookup if an appropriate function exists */
        if ($SD.connection && this[fn] && typeof this[fn] === 'function') {
            /** verify if type of payload is an object/json */
            const payload = this[fn]();
            if (typeof payload === 'object') {
                Object.assign({ event: fn, context: context }, payload);
                $SD.connection && $SD.connection.sendJSON(payload);
            }
        }
        console.log(this, fn, typeof this[fn], this[fn]());
    }
};

/** SDDebug
 * Utility to log the JSON structure of an incoming object
 */

const SDDebug = {
    logger: function (name, fn) {
        const logEvent = jsn => {
            console.log('____SDDebug.logger.logEvent');
            console.log(jsn);
            debugLog('-->> Received Obj:', jsn);
            debugLog('jsonObj', jsn);
            debugLog('event', jsn['event']);
            debugLog('actionType', jsn['actionType']);
            debugLog('settings', jsn['settings']);
            debugLog('coordinates', jsn['coordinates']);
            debugLog('---');
        };

        const logSomething = jsn =>
            console.log('____SDDebug.logger.logSomething');

        return { logEvent, logSomething };
    }
};

/**
 * This is the instance of the StreamDeck object.
 * There's only one StreamDeck object, which carries
 * connection parameters and handles communication
 * to/from the software's PluginManager.
 */

window.$SD = StreamDeck.getInstance();
window.$SD.api = SDApi;

const webSocketErrorMessage = {
    '1000': 'Normal Closure. The purpose for which the connection was established has been fulfilled.',
    '1001': 'Going Away. An endpoint is "going away", such as a server going down or a browser having navigated away from a page.',
    '1002': 'Protocol error. An endpoint is terminating the connection due to a protocol error',
    '1003': "Unsupported Data. An endpoint received a type of data it doesn't support.",
    '1004': '--Reserved--. The specific meaning might be defined in the future.',
    '1005': 'No Status. No status code was actually present.',
    '1006': 'Abnormal Closure. The connection was closed abnormally, e.g., without sending or receiving a Close control frame',
    '1007': 'Invalid frame payload data. The connection was closed, because the received data was not consistent with the type of the message (e.g., non-UTF-8 [http://tools.ietf.org/html/rfc3629]).',
    '1008': 'Policy Violation. The connection was closed, because current message data "violates its policy". This reason is given either if there is no other suitable reason, or if there is a need to hide specific details about the policy.',
    '1009': 'Message Too Big. Connection closed because the message is too big for it to process.',
    '1010': "Mandatory Ext. Connection is terminated the connection because the server didn't negotiate one or more extensions in the WebSocket handshake. <br /> Mandatory extensions were: ",
    '1011': 'Internal Server Error. Connection closed because it encountered an unexpected condition that prevented it from fulfilling the request.',
    '1015': "TLS Handshake. The connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can't be verified).",
    'default': 'Unknown reason',
};

function WEBSOCKETERROR(evt) {
    // Websocket is closed
    const errorExist = webSocketErrorMessage.hasOwnProperty(evt.code);
    
    return errorExist ? `${webSocketErrorMessage[evt.code]} - ${evt.reason}` : webSocketErrorMessage.default;
}
