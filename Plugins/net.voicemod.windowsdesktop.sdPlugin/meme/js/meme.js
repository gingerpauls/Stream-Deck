/**
 * Checker Meme PI is loaded
 */
const isMemeLoaded = true;

var profile_selected = '';
var meme_selected = '';
var listOfMemes = '';
var profiles = '';

/**
 * Selectors
 */
const memeSelectors = () => {
    return {
        profileDropDown: document.querySelector('.profileDropDown'),
        memeDropDown: document.querySelector('.memeDropDown'),
    };
};

/**
 * Update PI view of Meme sound
 * @param {object} payload - Received setting from SD
 */
function updateMemePI(payload) {
    const { profileDropDown } = memeSelectors();
    const { settings, memes } = payload;

    handlerFilterProfileChange(profileDropDown);

    if (memes && memes.actionObject) {
        if (memes.actionObject.hasOwnProperty('listOfMemes')) {
            listOfMemes = memes.actionObject.listOfMemes;
        }
    }

    if (settings && settings.hasOwnProperty('meme_selected')) {
        meme_selected = settings.meme_selected;
    }

    if (settings && settings.hasOwnProperty('profile_selected')) {
        let profileActive = '';

        // Voicemod v2 has Profile property
        if (listOfMemes.hasOwnProperty('Profile')) {
            profileActive = meme_selected ? listOfMemes.filter(_ => _.FileName === meme_selected)[0].Profile : settings.profile_selected;
        } else {
            profileActive = localize('all-voices');
        }

        profile_selected = profileActive;
    }

    /**
     * Update Profiles and Meme lists
     * On Voicemod v1 payload received
     * doesn't have the property Profile
     */
    if (!isVoicemodV2(voicemodVersion)) {
        profiles = listOfMemes;
    } else {
        profiles = [...[localize('all-voices')], ...[...new Set(listOfMemes.map(meme => meme.Profile))]];
    }

    ReloadListOfMemesProfiles();
}

function ReloadListOfMemesProfiles() {
    const { profileDropDown } = memeSelectors();
    const defaultOptionProfileCopy = localize('soundboard-input-select-profile');
    const userSelection = profiles.indexOf(profile_selected);
    const memeFilterByProfile = profile_selected === localize('all-voices') ? listOfMemes : listOfMemes.filter(meme => meme.Profile === profiles[userSelection]);

    removeAllOptions(profileDropDown);

    addOptions(profileDropDown, profiles, profile_selected, defaultOptionProfileCopy);

    ReloadListOfMemes(memeFilterByProfile, profile_selected);
}

function ReloadListOfMemes(memeFilterByProfile, profile_selected) {
    const { memeDropDown } = memeSelectors();
    const defaultOptionMemeCopy = localize('soundboard-input-select-sound');
    // 'Profile' and 'All' are coming from payload, that change depending of Voicemod Version
    let profileKey = profile_selected === 'All' ? 'Profile' : null;
    profileKey = isVoicemodV2(voicemodVersion) ? profileKey : null;

    removeAllOptions(memeDropDown);

    addOptionsOfMeme(memeDropDown, memeFilterByProfile, meme_selected, {
        defaultOptionCopy: defaultOptionMemeCopy,
        value: 'FileName',
        copy: 'Name',
        extraCopy: profileKey
    });
}

function handlerFilterProfileChange(selector) {
    selector.addEventListener('change', function () {
        profile_selected = this.value;
        ReloadListOfMemesProfiles();
    });
}

function sendMemeOptions(event, option) {
    const selected = getTargetValue(event);

    let options = {};

    if (option === 'memeProfile') {
        options = {
            'profile_selected': selected,
            'meme_selected': ''
        }
    } else {
        options = {
            'profile_selected': profile_selected,
            'meme_selected': selected
        }
    }

    sendMessageToPlugin('setSettings',  options, 'meme');
}
