/**
 * Checker Import All PI is loaded
 */
const isImportAllLoaded = true;

/**
 * Selectors
 */
const importAllSelectors = () => {
    return {
        soundDropdown: document.querySelector('.soundDropdown'),
        isVoices: document.querySelector('#isVoices'),
        isSoundbar: document.querySelector('#isSoundbar'),
    };
}

function chooseCategory(categorySelected) {
    const { isVoices: voices, isSoundbar: soundbar } = importAllSelectors();

    /**
     * Hide all sections of the second filter
     */
    hide(voices);
    hide(soundbar);

    /**
     * Show second filter section based on user selection
     */
    show(eval(categorySelected));
}
