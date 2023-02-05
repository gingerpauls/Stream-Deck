/**
 * Selectors
 */
const DOMSelector = () => {
    return {
        sdpiWrapper: document.querySelector('.sdpi-wrapper'),
        isHideOnV1: document.querySelectorAll('.isHideOnV1'),
        piContainer: document.querySelector('.pi-container'),
        voicemodNotInstalled: document.querySelector('.isVoicemodNotInstalled'),
        voicemodInstalled: document.querySelector('.isVoicemodInstalled'),
        offerStreamDeck: document.querySelector('.offerFromStreamDeck'),
        startButton: document.getElementById('startButton'),
        connectButton: document.getElementById('connectButton'),
        labelStatus: document.querySelector('.statusText'),
        getProLink: document.getElementById('get-pro-link'),
        radioButtonFilterGroup: document.querySelector('.radioButtonFilterGroup'),
        inputRadioAll: document.querySelectorAll('input[type="radio"]'),
        installV2: document.querySelector('.install-v-2'),
        voicemodUpdate: document.querySelector('.t-voicemodUpdate'),
    };
}

/**
 * Global variables
 */
var localizedStrings = {};
var pluginAction = null,
    uuid = '',
    context = '',
    appStatus = 'disconnected',
    voicemodVersion = '';

/**
 * Initialize functions
 */
function init() {

    const templates = new Promise((resolve) => {
        createTemplates(resolve);
    });

    templates.then(() => {
        localizationKeys();
    });

    onStreamDeckConnection();
};

/**
 * Localize copies on load page
 * English by default
 * @param {string} lang
 */
const localizationKeys = (lang = 'en') => {
    getTranslation(lang, (localizationObject) => {
        const localization = parseJson(localizationObject);
        localizedStrings = () => localization && localization.hasOwnProperty('Localization') ? localization['Localization'] : {};

        localizeUI();
    });
};


/**
 * Check connection with Stream Deck
 */
const onStreamDeckConnection = function() {
    if ($SD) {
        $SD.on('connected', function (settingsReceived) {
            uuid = settingsReceived.uuid;
            lang = settingsReceived.info.application.language;

            // Event to launch sendMessageToPlugin using every mouse button
            DOMSelector().getProLink.addEventListener('mousedown', function () {
                sendMessageToPlugin('showSDPrices');
            });

            localizationKeys(lang);

            if (settingsReceived.plugin) {
                pluginAction = settingsReceived.plugin.action;
                context = settingsReceived.plugin.context;

                sendMessageToPlugin('getData');
            }
        });

        /**
         * Send to Property Inspector
         */
        $SD.on('sendToPropertyInspector', (settingsReceived) => messageFromPlugin(settingsReceived));
    }
}

function downloadVM() {
    sendMessageToPlugin('downloadVoicemod');
}

function updateVoicemod() {
    sendMessageToPlugin('updateVoicemod');
}

function launchVoicemod() {
    sendMessageToPlugin('launchVoicemod');
}

function updateStatus() {
    console.log('updateStatus: ' + appStatus);

    const {
        voicemodNotInstalled,
        voicemodInstalled,
        labelStatus,
        isHideOnV1,
        piContainer,
    } = DOMSelector();

    if (appStatus == 'notInstalled') {
        //hide lists and selectors and show download button
        show(voicemodNotInstalled);
        hide(voicemodInstalled);

    } else {
        hide(startButton);

        if (appStatus != 'connected') {
            show(startButton);
            hide(piContainer);
        }

        //show lists and selectors and hide download button
        show(voicemodNotInstalled);
        hide(voicemodNotInstalled);

        if (appStatus == 'disconnected') {

            show(startButton);
            hide(connectButton);

            labelStatus.classList += ' -danger';
            labelStatus.innerHTML = localize('launch-voicemod');

        } else if (appStatus == 'connecting') {

            hide(startButton);
            hide(connectButton);

            labelStatus.innerHTML = localize('connecting-to-voicemod');

        } else if (appStatus == 'connected') {

            hide(startButton);
            hide(connectButton);

            if (labelStatus.classList.contains('-danger')) {
                labelStatus.classList.remove('-danger');
            }

            labelStatus.innerHTML = 'voicemod-is-running';

            /**
             * Show PI content once Voicemod is connected
             */
            piContainer ? show(piContainer) : null;

            /**
             * Double-check version and show content available on v2
             */
            if (isVoicemodV2(voicemodVersion)) {
                [...isHideOnV1].forEach((node) => {
                    show(node);
                });
            }

        } else if (appStatus == 'failautoconnect') {

            hide(startButton);
            show(connectButton);

            labelStatus.innerHTML = 'voicemod-fail-to-connect';
        }

        labelStatus.innerHTML = labelStatus.innerHTML.replace(labelStatus.innerText, localize(labelStatus.innerText));

    }
}

function messageFromPlugin(settingsReceived) {
    const { offerStreamDeck } = DOMSelector();
    const { payload } = settingsReceived;

    if (settingsReceived && payload && payload.command) {

        voicemodVersion = payload.voicemodVersion;

        if (hiddenOnV1.includes(pluginAction)) {
            hideFunctionality(voicemodVersion);
        }

        /**
         * Check App status
         */
        if (payload.appStatus) {
            appStatus = payload.appStatus;
            updateStatus();
        }

        if (payload.command == 'getData') {
            /**
             * Call method related to the action
             */
            // TODO: move type checker on helper
            // TODO: use regex to reduce name of the action
            const messagePlugins = {
                'net.voicemod.windowsdesktop.pushtomemesound': typeof isMemeLoaded !== 'undefined' ? updateMemePI(payload) : null,
                'net.voicemod.windowsdesktop.randomvoice': typeof isRandomVoiceLoaded !== 'undefined' ? updateAddRandomVoicePI(payload) : null,
                'net.voicemod.windowsdesktop.addvoice': typeof isAddVoiceLoaded !== 'undefined' ? addVoicePIInit(payload) : null,
            };

            messagePlugins[payload.action];
        }
    }

    /**
     * Show/Hide Offer section
     */
    const offerPayload = payload.settings.showOffer ? payload.settings.showOffer : payload.showOffer ? payload.showOffer : 0;
    const showOfferCase = isHidden(offerStreamDeck) && offerPayload == 1 && appStatus == 'connected';

    if (showOfferCase) {
        show(offerStreamDeck);
    } else {
        hide(offerStreamDeck);
    }
}

/**
 * Send information to SD using sendToPlugin API
 * based on setting received
 * @param {string} action - Action to send to plugin
 * @param {string} value - targe value
 * @param {string} origin - identifier of PI
 */
function sendMessageToPlugin(action, value = '', origin = '') {
    const payload = {};

    switch (action) {
        case 'setSettings':
            setSettingsAction(payload, action, value, origin);
            break;

        default:
            saveSettings(action, payload);
            break;
    }
}

setSettingsAction = (payload, action, value, origin) => {
    const {
        inputRadioAll,
        radioButtonFilterGroup
    } = DOMSelector();

    switch (origin) {
        case 'addVoice':
            const { voiceID, voiceProperties } = value;

            if (!isHidden(radioButtonFilterGroup)) {
                radiobutton_selected = payload.radiobutton_selected = getOptionSelected(inputRadioAll);
            }

            payload.radiobutton_selected = radiobutton_selected;
            voice_selected = payload.voice_selected = voiceID;
            voice_properties_selected = payload.voice_properties_selected = voiceProperties;            

            break;
        case 'random':
            listRandomVoices_selected = payload.listRandomVoices_selected = value;

            break;
        case 'meme':
            profile_selected = payload.profile_selected = value.profile_selected;
            meme_selected = payload.meme_selected = value.meme_selected;

            break;
        default:
            break;
    }

    saveSettings(action, payload);
}

function localize(s) {
    if (isUndefined(s)) {
        return '';
    }

    let key = String(trimWhiteSpace(s));

    if (localizedStrings().hasOwnProperty(key)) {
        key = localizedStrings()[key];
    }

    return key;
};

function localizeUI() {
    const { sdpiWrapper } = DOMSelector();
    const labels = [...sdpiWrapper.querySelectorAll('.sdpi-item-label, .label')];
    const notScript = [...sdpiWrapper.querySelectorAll('*:not(script)')];

    labels.forEach(label => {
        const labelText = label.innerText;
        label.innerHTML = label.innerHTML.replace(labelText, localize(label.dataset.localized));
    });

    notScript.forEach(e => {
        if (e.childNodes && e.childNodes.length > 0 && e.childNodes[0].nodeValue && typeof e.childNodes[0].nodeValue === 'string') {
            e.childNodes[0].nodeValue = localize(e.childNodes[0].nodeValue);
        }
    });
}

function saveSettings(inAction, inSettings) {
    if ($SD && $SD.connection) {
        inSettings.command = inAction;
        $SD.api.sendToPlugin(uuid, pluginAction, inSettings);
    }
}

/**
 * Add here all the functionality not available on Voicemod v1
 */
const hiddenOnV1 = [
    'net.voicemod.windowsdesktop.muteforme',
    'net.voicemod.windowsdesktop.importAll'
];

/**
 * Hide container of the functionality
 * that is not available without Voicemod V2
 * and show template with button to download new version of Voicemod
 * @param {string} voicemodVersion
 */
function hideFunctionality(voicemodVersion) {
    const { voicemodUpdate, voicemodInstalled } = DOMSelector();

    if (!isVoicemodV2(voicemodVersion)) {
        show(voicemodUpdate);
        hide(voicemodInstalled);
    } else {
        hide(voicemodUpdate);
        show(voicemodInstalled);
    }
}

/**
 * Add started HTML templates on load
 */
const createTemplates = (resolve) => {
    const templates = [{
            file: 'voicemod-not-installed',
            elementClass: '.t-voicemodNotInstalled',
        },
        {
            file: 'app-status',
            elementClass: '.t-app-status',
        },
        {
            file: 'update-voicemod',
            elementClass: '.t-voicemodUpdate',
        },
    ];

    const promises = [];

    templates.forEach((template) => {

        promises.push(
            new Promise((res) => {
                const { file, elementClass } = template;

                getTemplate(file, function (file) {
                    const element = document.querySelector(elementClass);

                    element ? element.innerHTML = file : null;

                    res();
                });
            })
        );

    });

    Promise.all(promises).then(() => {
        resolve();
    });
};

init();
