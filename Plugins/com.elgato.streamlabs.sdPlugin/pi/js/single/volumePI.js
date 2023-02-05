//==============================================================================
/**
@file       volumePI.js
@brief      Streamlabs Plugin
@copyright  (c) 2020, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

function VolumePI(inContext, inLanguage) {
    // Inherit from PI
    PI.call(this, inContext, inLanguage);

    // Save a copy of a method
    var piSaveSettings = this.saveSettings;

    // Add action select
    var actionSelect = "<div class='sdpi-item'> \
            <div class='sdpi-item-label' id='action-label'></div> \
            <select class='sdpi-item-value select' id='action-select'> \
                <option id='volume-up' value='volume-up'></option> \
                <option id='volume-down' value='volume-down'></option> \
            </select> \
        </div>";
    document.getElementById('placeholder').innerHTML = actionSelect;
    
    // Set selected option
    document.getElementById("action-select").value = (settings['volumeDown'] ? 'volume-down' : 'volume-up');

    // Add event listener
    document.getElementById("action-select").addEventListener("change", actionChanged);

    // Before overwriting parrent method, save a copy of it
    var piLocalize = this.localize;

    // Localize the UI
    this.localize = function (tr) {
        // Call PIs localize method
        piLocalize.call(this, tr);

        // Localize the scene select
        document.getElementById("action-label").innerHTML = tr("Action");
        document.getElementById("volume-up").innerHTML = tr("VolumeUp");
        document.getElementById("volume-down").innerHTML = tr("VolumeDown");
    };

    // Action select changed
    function actionChanged(inEvent) {
        if (inEvent.target.value == "volume-up") {
            settings.volumeDown = false;
        }
        else if (inEvent.target.value == "volume-down") {
            settings.volumeDown = true;
        }
        piSaveSettings();
    }
}
