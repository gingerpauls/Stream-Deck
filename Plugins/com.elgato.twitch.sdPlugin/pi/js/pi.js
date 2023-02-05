//==============================================================================
/**
@file       pi.js
@brief      Twitch Plugin
@copyright  (c) 2020, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

function PI(inContext, inLanguage) {
    // Init PI
    var instance = this;

    // Public localizations for the UI
    this.localization = {};

    // Add event listener
    document.getElementById('account-select').addEventListener("change", accountChanged);

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
                log(inLocalization);
            }
        });
    }

    // Localize the UI
    this.localize = function(tr) {
        // Check if localizations were loaded
        if (instance.localization == null) {
            return;
        }

        // Localize the account select
        document.getElementById("account-label").innerHTML = tr("Account");
        document.getElementById("no-accounts").innerHTML = tr("NoAccounts");
        document.getElementById("add-account").innerHTML = tr("AddAccount");

        // Localize the warning messages
        var warning;
        warning = document.getElementById('live-warning');
        if (warning != undefined)
            warning.innerHTML = tr("LiveWarning");
        warning = document.getElementById('account-warning');
        if (warning != undefined)
            warning.innerHTML = tr("AccountWarning");
    }; 

    // Load the localizations
    getLocalization(inLanguage, function(inStatus, inLocalization) {
        if (inStatus) {
            // Save public localization
            instance.localization = inLocalization['PI'];

            // Localize the PI
            instance.localize();
        }
        else {
            log(inLocalization);
        }
    });

    // Show all paired accounts
    this.loadAccounts = function () {
        // Remove previously shown accounts
        var options = document.getElementsByClassName('accounts');
        while (options.length > 0) {
            options[0].parentNode.removeChild(options[0]);
        }
        
        // Check if any account is paired
        if (Object.keys(cache).length > 0) {
            // Hide the 'No Accounts' option
            document.getElementById("no-accounts").style.display = 'none';

            // Sort the accounts alphabatically
            var accountIDsSorted = Object.keys(cache).sort(function(a, b) {
                return cache[a].name.localeCompare(cache[b].name);
            });

            // Add the accounts
            accountIDsSorted.forEach(function (inAccountID) {
                // Add the group
                var option = "<option value='" + inAccountID + "' class='accounts'>" + cache[inAccountID].name + "</option>";
                document.getElementById("no-accounts").insertAdjacentHTML('beforebegin', option);
            });

            // Check if the account is already configured
            if (settings.accountId != undefined) {
                // If the account is not cached
                if (!(settings.accountId in cache)) {
                    // Choose the first account in the list
                    settings.accountId = accountIDsSorted[0];
                    instance.saveSettings();
                }
                // Select the currently configured account
                document.getElementById("account-select").value = settings.accountId;
            }
        }
        else {
            // Show the 'No Accounts' option
            document.getElementById("no-accounts").style.display = 'block';
        }

        // Show PI
        document.getElementById("pi").style.display = "block";
    }

    // Account select changed
    function accountChanged(inEvent) {
        if (inEvent.target.value == "add") {
            // If add new was selected, add an account
			addAccount(inContext);
        }
        else if (inEvent.target.value == "no-accounts") {
            // If no account was selected, cancel
            return;
        }
        else {
            settings.accountId = inEvent.target.value;
            instance.saveSettings();
            instance.loadAccounts();
        }
    }

    // Private function to return the action identifier
    function getAction() {
        // Find out type of action
        if (instance instanceof ChatMessagePI) {
            var action = "com.elgato.twitch.chatmessage";
        }
        else if (instance instanceof ClearPI) {
            var action = "com.elgato.twitch.clear";
        }
        else if (instance instanceof CreateClipPI) {
            var action = "com.elgato.twitch.createclip";
        }
        else if (instance instanceof MarkerPI) {
            var action = "com.elgato.twitch.marker";
        }
        else if (instance instanceof OpenLastClipPI) {
            var action = "com.elgato.twitch.openlastclip";
        }
        else if (instance instanceof PlayAdPI) {
            var action = "com.elgato.twitch.playad";
        }
        else if (instance instanceof StreamTitlePI) {
            var action = "com.elgato.twitch.streamtitle";
        }
        else if (instance instanceof ViewersPI) {
            var action = "com.elgato.twitch.viewers";
        }
        else if (instance instanceof EmoteChatPI) {
            var action = "com.elgato.twitch.emotechat";
        }
        else if (instance instanceof FollowersChatPI) {
            var action = "com.elgato.twitch.followerschat";
        }
        else if (instance instanceof SlowChatPI) {
            var action = "com.elgato.twitch.slowchat";
        }
        else if (instance instanceof SubChatPI) {
            var action = "com.elgato.twitch.subchat";
        }
        return action;
    }

    // Public function to save the settings
    this.saveSettings = function () {
        saveSettings(inContext, settings);
    }

    // Public function to send data to the plugin
    this.sendToPlugin = function (inData) {
        sendToPlugin(getAction(), inContext, inData);
    }
};

// Static fonction called to return a warning
PI.getWarning = function(id) {
    return "<div class='sdpi-item'> \
                <details class='message'> \
                    <summary id='" + id + "'></summary> \
                </details> \
            </div>";
}
