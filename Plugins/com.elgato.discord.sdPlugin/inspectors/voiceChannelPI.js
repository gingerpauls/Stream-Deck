/*!
	@file       voiceChannelPI.js
	@brief      Contains PI for Voice Channel action
	@author     Valentin Reinbold
	@copyright  (c) 2021, Corsair Memory, Inc. All Rights Reserved.
*/

function VoiceChannelPI(inContext, inLanguage) {
    // Inherit from PI
    PI.call(this, inContext, inLanguage);

    // Save a copy of a method
    var piSaveSettings = this.saveSettings;

    // Add fields
    var fields =
    "<div class='sdpi-item'> \
        <div class='sdpi-item-label' id='server-label'></div> \
        <select class='sdpi-item-value select' id='server'> \
            <option disabled id='no-server' value='no-server'></option> \
        </select> \
    </div> \
    <div class='sdpi-item'> \
        <div class='sdpi-item-label' id='channel-label'></div> \
        <select class='sdpi-item-value select' id='channel'> \
            <option disabled id='no-channel' value='no-channel'></option> \
        </select> \
    </div>"
    
    document.getElementById('placeholder').innerHTML = fields;
    document.getElementById('server').addEventListener("input", () => {
        emptyField('channel');
        settings['channel'] = "";
    });
    this.initField('server');
    this.initField('channel');
    
    // Before overwriting parrent method, save a copy of it
    var piLoad = this.load;
    
    // Public function called to load the fields
    this.load = function (data) {
        // Call PI load method
        piLoad.call(this, data);

        // If action enabled
        if (!data.disabled && !data.unauthorized) {
            // Load all servers
            loadField('server', data.servers);

            // Load related channels
            loadField('channel', data.channels);
        }

        // Enable / Disable the fields
        document.getElementById('server').disabled = data.disabled || data.unauthorized;
        document.getElementById('channel').disabled = data.disabled || data.unauthorized;

        // Show PI
        document.getElementById('pi').style.display = "block";
    }
    
    // Private function called to empty the field options
    function emptyField(key) {
        var options = document.getElementsByClassName(key);
        while (options.length > 0) {
            options[0].parentNode.removeChild(options[0]);
        }
    }
    
    // Private function called to load the field options
    function loadField(key, list) {
        // Remove previously shown options
        emptyField(key);
        
        // If there is no element
        if (list == undefined || Object.keys(list).length == 0) {
            // Show & Select the 'Nothing' option
            document.getElementById('no-' + key).style.display = "block";
            document.getElementById(key).value = 'no-' + key;
            return;
        }
        
        // Hide the 'Nothing' option
        document.getElementById('no-' + key).style.display = "none";
        
        // Sort the elements alphabatically
        var IDsSorted = Object.keys(list).sort((a, b) => {
            return list[a].name.localeCompare(list[b].name);
        });
        
        // Add the options
        IDsSorted.forEach(id => {
            var option = "<option value='" + id + "' class='" + key + "'>" + list[id].name + "</option>";
            document.getElementById('no-' + key).insertAdjacentHTML("beforebegin", option);
        });
          
        // If no existing element configured
        if (settings[key] == undefined || !(settings[key] in list)) {
            // Choose the first option in the list
            settings[key] = IDsSorted[0];
            piSaveSettings();
        }
        
        // Select the currently configured element
        document.getElementById(key).value = settings[key];
    }
    
    /* --- Localization --- */
    
    // Before overwriting parrent method, save a copy of it
    var piLocalize = this.localize;
    
    // Localize the UI
    this.localize = function (tr) {
        // Call PIs localize method
        piLocalize.call(this, tr);
        
        // Call PIs localize method
        document.getElementById('server-label').innerHTML = tr("Server");
        document.getElementById('no-server').innerHTML = tr("NoServer");
        document.getElementById('channel-label').innerHTML = tr("VoiceChannel");
        document.getElementById('no-channel').innerHTML = tr("NoChannel");
    };
}