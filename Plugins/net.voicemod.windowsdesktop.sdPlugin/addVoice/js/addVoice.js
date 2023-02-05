/**
 * Checker AddVoice PI is loaded
 */
const isAddVoiceLoaded = true;

/** 
 * Constants
 */
const DEFAULT_SKIN_SELECTED = '0';
const DEFAULT_TUNE_SELECTED = '0';

/**
 * Global variables
 */
var list_of_voices = '';                // list of available voices
var voice_selected = '';                // selected voiceID
var voice_properties_selected = null;   // voice properties for the selected voice
var radiobutton_selected = '';          // selected option on group filter

/**
 * Returns selected skin from voice_properties_selected or default value
 * 
 * @returns {string}
 */
const currentVoiceSkinSelected = () => voice_properties_selected?.skin ?? DEFAULT_SKIN_SELECTED;

/**
 * Returns selected tune from voice_properties_selected or default value
 * 
 * @returns {string}
 */
 const currentVoiceTuneSelected = () => voice_properties_selected?.tune ?? DEFAULT_TUNE_SELECTED;

/**
 * Selectors
 */
const addVoiceSelectors = () => {
    return {
        voicesDropDown: document.querySelector('.voicesDropDown'),
        voiceSkinsContainer: document.querySelector('.voiceSkins'),
        voiceSkinsDropdown: document.querySelector('.voiceSkinsDropDown'),
        voiceTunesContainer: document.querySelector('.voiceTunes'),
        voiceTunesDropdown: document.querySelector('.voiceTunesDropDown'),
        radioButtons: document.querySelector('.radioButtonFilterGroup'),
        allRadioButtons: document.querySelectorAll('input[type="radio"]')
    };
}

/**
 * Get available skins from a voiceID
 * 
 * @param {string} voiceID 
 * @returns {array} list of available skins (or empty array)
 */
const voiceSkinsByVoiceID = (voiceID) => {
    const voice = list_of_voices?.allVoices?.find((voice) => voice.voiceID === voiceID);
    return voice?.voice_properties?.skin || [];
}

/**
 * Get available voice properties from a voiceID
 * 
 * @param {string} voiceID 
 * @returns {object} list of available skins (or empty array)
 */
 const voicePropertiesByVoiceID = (voiceID) => {
    const voice = list_of_voices?.allVoices?.find((voice) => voice.voiceID === voiceID);
    return {
        skins: voice?.voice_properties?.skin || [],
        tunes: voice?.voice_properties?.tune || []
    };
}

/**
 * Check if a voice has skins
 * 
 * @param {string} voiceID 
 * @returns {bool}
 */
const hasSkins = (voiceID) => voicePropertiesByVoiceID(voiceID).skins.length > 0;

/**
 * Check if a voice has tunes
 * 
 * @param {string} voiceID 
 * @returns {bool}
 */
 const hasTunes = (voiceID) => voicePropertiesByVoiceID(voiceID).tunes.length > 0;

/**
 * Create list of voice properties options in the select list
 * @param {Selection} selector - Select DOM element
 * @param {object} data - List of elements
 * @param {number} selectedPropertyIndex - Selected voice property index or null
 */
 const addVoicePropertyOptions = function (selector, data, selectedPropertyIndex) { 
    data.forEach(( value, index ) => {
        const newDataOption = document.createElement('option');

        newDataOption.value = index;
        newDataOption.innerHTML = value;
        
        if ( Number(selectedPropertyIndex) === index ) {
            newDataOption.selected = true;
        } else if (selectedPropertyIndex === undefined && index === 0 ) {
            newDataOption.selected = true;
        }

        selector.appendChild(newDataOption);
    });
};

function reloadListOfVoices(listOfVoices) {
    const { voicesDropDown } = addVoiceSelectors();
    const defaultOptionCopy = localize('soundboard-input-select-voice');

    removeAllOptions(voicesDropDown);
    
    addOptions(voicesDropDown, listOfVoices, voice_selected, defaultOptionCopy, 'voiceID', 'friendlyName');
}

function reloadVoiceProperties(voiceID) {
    const { voiceSkinsContainer, voiceSkinsDropdown, voiceTunesContainer, voiceTunesDropdown } = addVoiceSelectors();
    
    removeAllOptions(voiceSkinsDropdown);
    hide(voiceSkinsContainer);
    removeAllOptions(voiceTunesDropdown);
    hide(voiceTunesContainer);
    
    const { skins, tunes } = voicePropertiesByVoiceID(voiceID);

    if ( skins.length > 0 ) {
        show(voiceSkinsContainer);
        addVoicePropertyOptions( voiceSkinsDropdown, skins, currentVoiceSkinSelected());
    }
    if ( tunes.length > 0 ) {
        show(voiceTunesContainer);
        addVoicePropertyOptions( voiceTunesDropdown, tunes, currentVoiceTuneSelected());
    }
}

function setRadioButton(optionRadioButton) {
    const { allRadioButtons } = addVoiceSelectors();

    for (var i = 0; i < allRadioButtons.length; i++) {
        if (allRadioButtons[i].value == optionRadioButton) {
            allRadioButtons[i].checked = true;
            break;
        }
    }
}

function handlerRadioInputChange(selector) {
    for (var i = 0; i < selector.length; i++) {
        selector[i].addEventListener('change', function () {
            if (list_of_voices !== '') {
                reloadListOfVoices(list_of_voices[this.value]);
            }
        });
    }
}

function handleSelectedVoiceChange(voiceID) {
    reloadVoiceProperties(voiceID);
    
    const voiceSettings = {
        voiceID, 
        voiceProperties: null,
    }

    if ( hasSkins(voiceID) ) {
        voiceSettings.voiceProperties = { 
            ...voice_properties_selected,
            skin: currentVoiceSkinSelected() 
        }
    }

    if ( hasTunes(voiceID) ) {
        voiceSettings.voiceProperties = { 
            ...voice_properties_selected,
            tune: currentVoiceTuneSelected() 
        }
    }

    sendMessageToPlugin( 'setSettings', voiceSettings, 'addVoice' );    
}

function handleSelectedVoiceSkinChange(selectedSkinIndex) {
    const voiceSettings = {
        voiceID: voice_selected, 
        voiceProperties:{ 
            ...voice_properties_selected,
            skin: selectedSkinIndex 
        } 
    }

    sendMessageToPlugin( 'setSettings', voiceSettings, 'addVoice' ); 
}

function handleSelectedVoiceTuneChange(selectedTuneIndex) {
    const voiceSettings = {
        voiceID: voice_selected, 
        voiceProperties:{ 
            ...voice_properties_selected,
            tune: selectedTuneIndex 
        } 
    }

    sendMessageToPlugin( 'setSettings', voiceSettings, 'addVoice' ); 
}

function addVoicePIInit(payload)  {
    const { settings, voices, license } = payload;
    const { radioButtons, allRadioButtons } = addVoiceSelectors();

    handlerRadioInputChange(allRadioButtons);

    if (settings) {

        console.log(':::Settings', settings);

        if (settings.hasOwnProperty('radiobutton_selected')) {
            radiobutton_selected = settings.radiobutton_selected;
        }

        if (settings.hasOwnProperty('voice_selected')) {
            voice_selected = settings.voice_selected;
        }

        if (settings.hasOwnProperty('voice_properties_selected')) {
            voice_properties_selected = settings.voice_properties_selected;
        }
    }

    /**
     * Show dropdown options
     */
    if (voices && voices.actionObject) {
        
        list_of_voices = voices.actionObject;
        /**
         * Pro user case or NFUE case
         */
        const NFUECase = license === 'free' && list_of_voices.hasOwnProperty('customVoices');
        if (license === 'pro' || NFUECase) {
            if (radiobutton_selected == '') {
                radiobutton_selected = getOptionSelected(allRadioButtons);
            }

            setRadioButton(radiobutton_selected);

            reloadListOfVoices(list_of_voices[radiobutton_selected]);

            changeStatus(true, radioButtons);
        }
        /**
         * Free user case
         */
        else if (license === 'free') {
            reloadListOfVoices(list_of_voices.allVoices);

            // showHideFilterType("hide");
            changeStatus(false, radioButtons);
        }

        if (voice_selected) {
            reloadVoiceProperties(voice_selected); 
        }
    }
}