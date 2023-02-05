//==============================================================================
/**
@file       profilePI.js
@brief      Streamlabs Plugin
@copyright  (c) 2020, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

function ProfilePI(inContext, inLanguage) {
    // Inherit from PI
    PI.call(this, inContext, inLanguage);

    // Save a copy of a method
    var piSaveSettings = this.saveSettings;

    // Add profile select
    var profileSelect = "<div class='sdpi-item'> \
                            <div class='sdpi-item-label' id='profile-label'></div> \
                            <select class='sdpi-item-value select' id='profile-select'> \
                            </select> \
                        </div>";
    document.getElementById('placeholder').innerHTML = profileSelect;

    // Add event listener
    document.getElementById("profile-select").addEventListener("change", profileChanged);

    // Before overwriting parrent method, save a copy of it
    var piLocalize = this.localize;

    // Localize the UI
    this.localize = function (tr) {
        // Call PIs localize method
        piLocalize.call(this, tr);

        // Localize the scene select
        document.getElementById("profile-label").innerHTML = tr("Profile");
    };

    // Show all alert profiles
    this.loadProfiles = function () {
        // Remove previously shown profiles
        var options = document.getElementsByClassName('profiles');
        while (options.length > 0) {
            options[0].parentNode.removeChild(options[0]);
        }

		// Check if any account is configured
		if (!('account' in settings)) {
			log('No account configured');
			return;
		}

		// Check if the configured account is in the cache
		if (!(settings.account in cache)) {
			log('Account ' + settings.account + ' not found in cache');
			return;
		}

		// Find the configured account
		var account = cache[settings.account];

        getProfiles(account, function (success, result) {
			if (!success) {
                log(result);
                return;
            }

            // Define a profile map
            var profiles = {};

			if (result.profiles != undefined) {
                result.profiles.forEach(function (inProfile) {
                    // Store new account
                    profiles[inProfile.id] = inProfile.name;
                });
            }

            // Check if any profile is paired
            if (Object.keys(profiles).length > 0) {
                // Sort the profiles alphabatically
                var profileIDsSorted = Object.keys(profiles).sort(function(a, b) {
                    return profiles[a].localeCompare(profiles[b]);
                });

                // Add the profiles
                profileIDsSorted.forEach(function (inProfileID) {
                    var option = "<option value='" + inProfileID + "' class='profiles'>" + profiles[inProfileID] + "</option>";
                    document.getElementById("profile-select").insertAdjacentHTML('beforeend', option);
                });

                // If configured profile does not exist
                if (!(settings.profile in profiles)) {
                    // Define a default profile
                    if (result.active_profile in profiles) {
                        // Choose the currently active profile
                        settings.profile = result.active_profile;
                    }
                    else {
                        // Choose the first profile in the list
                        settings.profile = profileIDsSorted[0];
                    }
                    piSaveSettings();

                    // Select the currently configured profile
                    document.getElementById("profile-select").value = settings.profile;
                }
                // Select the currently configured profile
                document.getElementById("profile-select").value = settings.profile;
            }
        });

        // Show PI
        document.getElementById("pi").style.display = "block";
    }

    // Private function called for the get profiles request
	function getProfiles(account, callback) {
        var url = "https://streamlabs.com/api/v1.0/alert_profiles/get"
                + "?access_token=" + encodeURIComponent(account.token);
        var xhr = new XMLHttpRequest();
        xhr.responseType = 'json';
        xhr.open("GET", url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.timeout = 2500;
        xhr.onload = function () {
            if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
                var result = xhr.response;
                if (result != undefined && result != null) {
                    if ('profiles' in result) {
                        callback(true, result);
                    }
                    else {
                        callback(false, "Account request failed.");
                    }
                }
                else {
                    callback(false, "Account response is undefined or null.");
                }
            }
            else {
                callback(false, 'Could not connect to the account.');
            }
        };
        xhr.onerror = function () {
            callback(false, 'Unable to connect to the account.');
        };
        xhr.ontimeout = function () {
            callback(false, 'Connection to the account timed out.');
        };
        xhr.send();
    }

    // Profile select changed
    function profileChanged(inEvent) {
        settings.profile = inEvent.target.value;
        piSaveSettings();
    }
}
