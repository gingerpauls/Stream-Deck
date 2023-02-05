/*!
    @file       pi.js
    @brief      Contains PI for base action
    @author     Valentin Reinbold
    @copyright  (c) 2021, Corsair Memory, Inc. All Rights Reserved.
*/

function PI(inContext, inLanguage) {
    // Init PI
    var instance = this;

    var appWarningMessage = document.getElementById('app-warning-message');
    var authWarningMessage = document.getElementById('auth-warning-message');
    var accessButton = document.getElementById('access-button');
    
    // Add event listener
    accessButton.addEventListener("click", () => {
        instance.sendToPlugin({ 'grantAccess': true });
    });

    // Private function to return the action identifier
    function getAction() {
        // Find out type of action
        if (instance instanceof MutePI)
            return "com.elgato.discord.mute";
        if (instance instanceof DeafenPI)
            return "com.elgato.discord.deafen";
        if (instance instanceof VoiceChannelPI)
            return "com.elgato.discord.channel.voice";
        if (instance instanceof TextChannelPI)
            return "com.elgato.discord.channel.text";
        if (instance instanceof PushToTalkPI)
            return "com.elgato.discord.pushto.talk";
        if (instance instanceof PushToMutePI)
            return "com.elgato.discord.pushto.mute";
    }

    // Public function called to initialize field
    this.initField = function(key) {
        // Init data
        updateField(key, settings[key]);
        // Add event listener
        document.getElementById(key).addEventListener("input", fieldChanged);
    }

    // Private function called to update field
    function updateField(key, value) {
        value = value || "";
        // Update field content
        document.getElementById(key).value = value;
    }

    // Field changed
    function fieldChanged(event) {
        var key = event.srcElement.id;
        var value = (event ? event.target.value : undefined);
        // Update data
        updateField(key, value);
        // Update settings
        settings[key] = value;
        instance.saveSettings();
    }

    // Public function called to load the fields
    this.load = function (data) {
        if (data.disabled) {
            // Show app warning message
            appWarningMessage.style.display = "block";
            authWarningMessage.style.display = "none";
        }
        else if (data.unauthorized) {
            // Show auth warning message
            appWarningMessage.style.display = "none";
            authWarningMessage.style.display = "block";
        }
        else {
            // Hide warning messages
            appWarningMessage.style.display = "none";
            authWarningMessage.style.display = "none";
        }
    }

    // Public function to send data to the plugin
    this.sendToPlugin = function (inData) {
        sendToPlugin(getAction(), inContext, inData);
    };

    // Public function to save the settings
    this.saveSettings = function () {
        saveSettings(inContext, settings);
    };

    /* --- Localization --- */

    this.localization = {};

    var finished = false;
    loadLocalization(inLanguage);
    loadLocalization("en");

    function loadLocalization(language) {
        getLocalization(language, function(inStatus, inLocalization) {
            if (inStatus) {
                instance.localization[language] = inLocalization['PI'];

                if (!finished) {
                    finished = true;
                }
                else {
                    instance.localize(function (key) {
                        // Actual localization
                        var value = instance.localization[inLanguage][key];
                        if (value != undefined && value != "") {
                            return value;
                        }
                        // Default localization
                        value = instance.localization["en"][key];
                        if (value != undefined && value != "") {
                            return value;
                        }
                        return key;
                    });
                }
            }
            else {
                console.log(inLocalization);
            }
        });
    }

    // Localize the UI
    this.localize = function (tr) {
        // Check if localizations were loaded
        if (instance.localization == null) {
            return;
        }

        // Localize the warning message select
        document.getElementById("app-warning").innerHTML = tr("AppWarning");
        document.getElementById("auth-warning").innerHTML = tr("AuthWarning");
        document.getElementById("access-label").innerHTML = tr("AccessLabel");
        document.getElementById("access-button").innerHTML = tr("AccessButton");
    };

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
}