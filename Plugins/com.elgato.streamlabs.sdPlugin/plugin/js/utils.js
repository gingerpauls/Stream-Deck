//==============================================================================
/**
@file       utils.js
@brief      Streamlabs Plugin
@copyright  (c) 2020, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

// Register the plugin or PI
function registerPluginOrPI(inEvent, inUUID) {
	if (websocket) {
		var json = {
			"event": inEvent,
			"uuid": inUUID
		};

		websocket.send(JSON.stringify(json));
	}
}

function saveSettings(inAction, inUUID, inSettings) {
	if (websocket) {
		const json = {
			"action": inAction,
			"event": "setSettings",
			"context": inUUID,
			"payload": inSettings
		};
		websocket.send(JSON.stringify(json));
	}
}

// Save global settings
function saveGlobalSettings(inUUID) {
	if (websocket) {
		const json = {
			"event": "setGlobalSettings",
			"context": inUUID,
			"payload": globalSettings
		};
		websocket.send(JSON.stringify(json));
	}
}


// Request global settings for the plugin
function requestGlobalSettings(inUUID) {
	if (websocket) {
	var json = {
	    "event": "getGlobalSettings",
	    "context": inUUID
	};

	websocket.send(JSON.stringify(json));
	}
}

// Add a Streamlabs account to the configured accounts
function addAccount(inUUID) {
	if (websocket) {
		var json = {
			"event": "addAccount",
			"context": inUUID
		};
		websocket.send(JSON.stringify(json));
	}
}

// Log to the global log file
function log(inMessage) {
	// Log to the developer console
	var time = new Date();
	var timeString = time.toLocaleDateString() + " " + time.toLocaleTimeString();
	console.log(timeString + ": " + inMessage);
	
	try {
		// Log to the Stream Deck log file
		if (websocket) {
			var json = {
				"event": "logMessage",
				"payload": {
					"message": inMessage
				}
			};
			websocket.send(JSON.stringify(json));
		}
	}
	catch (e) {
    	console.log("Websocket not defined");
    }
}

// Show ok icon on the key
function showOk(inUUID) {
	if (websocket) {
		var json = {
			"event": "showOk",
			"context": inUUID
		};

		websocket.send(JSON.stringify(json));
	}
}

// Show alert icon on the key
function showAlert(inUUID) {
	if (websocket) {
		var json = {
			"event": "showAlert",
			"context": inUUID
		};

		websocket.send(JSON.stringify(json));
	}
}

// Load an image and assign it to the key
function loadAndSetImage (inUUID, inUrl) {
    loadImage(inUrl, function (image) {
		setImage(inUUID, image);
    });
};

// Load an image from its URL
function loadImage (inUrl, inCallback, inCanvas, inFillcolor) {
    const canvas = inCanvas && inCanvas instanceof HTMLCanvasElement
        ? inCanvas
        : document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = 'source-over';
    let image = new Image();

    image.onload = function () {
        canvas.width = this.naturalWidth; // or 'width' if you want a special/scaled size
        canvas.height = this.naturalHeight; // or 'height' if you want a special/scaled size
        if (inFillcolor) {
            ctx.fillStyle = inFillcolor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        if (!this) {
            console.warn(this, imgCache);
        }
		else {
            ctx.drawImage(this, 0, 0);
            ctx.save();
        }
        inCallback(canvas.toDataURL('image/png'));
        // or to get raw image data
        // inCallback && inCallback(canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, ''));
	};
	
    image.src = inUrl;
};

// Set the image of a key
function setImage(inUUID, inImage, inTarget, inState) {
	if (websocket) {
		var json = {
			"event": "setImage",
			"context": inUUID,
			"payload": {
				"image": inImage,
				"target": inTarget,
				"state": inState
			}
		};

		websocket.send(JSON.stringify(json));
	}
}

// Set the state of a key
function setState(inUUID, inState) {
	if (websocket) {
		var json = {
			"event": "setState",
			"context": inUUID,
			"payload": {
				"state": inState
			}
		};
		
		websocket.send(JSON.stringify(json));
	}
}

// Set data to PI
function sendToPropertyInspector(inAction, inContext, inData) {
	if (websocket) {
		var json = {
			"action": inAction,
			"event": "sendToPropertyInspector",
			"context": inContext,
			"payload": inData
		};

		websocket.send(JSON.stringify(json));
	}
}

// Set data to plugin
function sendToPlugin(inAction, inContext, inData) {
	if (websocket) {
		var json = {
			"action": inAction,
			"event": "sendToPlugin",
			"context": inContext,
			"payload": inData
		};

		websocket.send(JSON.stringify(json));
	}
}

// Load the localizations
function getLocalization(inLanguage, inCallback) {
    var url = "../" + inLanguage + ".json";
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onload = function () {
        if (xhr.readyState == XMLHttpRequest.DONE) {
            try {
                data = JSON.parse(xhr.responseText);
                var localization = data['Localization'];
                inCallback(true, localization);
            }
            catch(e) {
                inCallback(false, 'Localizations is not a valid json.');
            }
        }
        else {
            inCallback(false, 'Could not load the localizations.');
        }
    };
    xhr.onerror = function () {
        inCallback(false, 'An error occurred while loading the localizations.');
    };
    xhr.ontimeout = function () {
        inCallback(false, 'Localization timed out.');
    };
    xhr.send();
}