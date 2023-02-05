//==============================================================================
/**
@file       playcreditsPI.js
@brief      Streamlabs Plugin
@copyright  (c) 2020, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

function PlayCreditsPI(inContext, inLanguage) {
    // Inherit from PI
    PI.call(this, inContext, inLanguage);

    // Add warning message
    var warningMessage = "<div class='sdpi-item'> \
            <details class='message'> \
                <summary id='live-warning'></summary> \
            </details> \
        </div>";
    document.getElementById('placeholder').innerHTML = warningMessage;

    // Before overwriting parrent method, save a copy of it
    var piLocalize = this.localize;

    // Localize the UI
    this.localize = function (tr) {
        // Call PIs localize method
        piLocalize.call(this, tr);

        document.getElementById('live-warning').innerHTML = tr("LiveWarning");
    };
}
