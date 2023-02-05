//==============================================================================
/**
@file       playadPI.js
@brief      Twitch Plugin
@copyright  (c) 2020, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

function PlayAdPI(inContext, inLanguage) {
    // Inherit from PI
    PI.call(this, inContext, inLanguage);

    // Save a copy of a method
    var piSaveSettings = this.saveSettings;

    // Add duration select
    var duration = (settings.commercialLength != undefined ? settings.commercialLength : 30);
    var durationList = "<div class='sdpi-item'> \
            <div class='sdpi-item-label' id='duration-label'></div> \
            <select class='sdpi-item-value select' id='duration-select'> \
                    <option>30</option> \
                    <option>60</option> \
                    <option>90</option> \
                    <option>120</option> \
                    <option>150</option> \
                    <option>180</option> \
            </select> \
            <span id='seconds-label'></span> \
        </div>";
    document.getElementById('placeholder').innerHTML = durationList + PI.getWarning('account-warning');
    document.getElementById('duration-select').value = duration;

    // Add event listener
    document.getElementById('duration-select').addEventListener("change", durationChanged);   

    // Before overwriting parrent method, save a copy of it
    var piLocalize = this.localize;

    // Localize the UI
    this.localize = function (tr) {
        // Call PIs localize method
        piLocalize.call(this, tr);

        document.getElementById('duration-label').innerHTML = tr("Duration");
        document.getElementById('seconds-label').innerHTML = tr("Seconds");
    };

    // Duration select changed
    function durationChanged(inEvent) {
        settings.commercialLength = inEvent.target.value;
        piSaveSettings();
    }
}
