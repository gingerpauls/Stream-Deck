/**
 * Checker AddRandomVoice PI is loaded
 */
const isRandomVoiceLoaded = true;

/**
 * Selectors
 */
const randomVoiceSelectors = () => {
    return {
        randomDropDown: document.querySelector('.randomDropDown'),
        selectFilterPro: document.querySelector('.selectFilterGroup'),
        selectFilterFree: document.querySelector('.selectFilterFree'),
    };
};

/**
 * Update PI view of Add Random Voice
 * @param {object} payload - Received setting from SD
 */
function updateAddRandomVoicePI(payload) {
    const { selectFilterPro, selectFilterFree, randomDropDown } =  randomVoiceSelectors();
    const { settings, voices, license } = payload;

    if (settings) {

        if (settings.hasOwnProperty('listRandomVoices_selected')) {
            listRandomVoices_selected = settings.listRandomVoices_selected;
        }

        /**
         * Set selected as true in list of options
         * if received a value equal to listRandomVoices_selected
         */
        // TODO: same function in meme.js, move to helpers.js
        for (var i = 0; i < randomDropDown.length; i++) {
            if (randomDropDown[i].value == listRandomVoices_selected) {
                randomDropDown[i].selected = 'selected';
                break;
            }
        }

    }


    /**
     * Show dropdown options
     */    
        /**
         * Free user case
         */
    if (license === 'free') {
        changeStatus(false, selectFilterPro);
    }

    /**
     * Pro user case
     */
    if (license === 'pro') {
        changeStatus(true, selectFilterPro);
        changeStatus(false, selectFilterFree);
    }


}
