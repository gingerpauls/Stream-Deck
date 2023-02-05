/**
 * Utils:
 * useful functionality internally used
 * that perform small and repetitive operations.
 */

/**
 * Search for 'hidden' class in element
 * return a boolean
 * @param {selector} selector - DOM element
 */
const isHidden = function(selector) {
    return selector.classList.contains('hidden');
};

/**
 * Hide element by adding 'hidden' class
 * @param {selector} selector - DOM element
 */
const hide = function(selector) {
    if (!isHidden(selector)) {
        selector.classList.add('hidden');
    }
};

/**
 * Show element by removing 'hidden' class
 * @param {selector} selector - DOM element
 */
const show = function(selector) {
    if (isHidden(selector)) {
        selector.classList.remove('hidden');
    }
};

/**
 * Disable element by adding 'disable' class
 * @param {selector} selector - DOM element
 */
const disable = function(selector) {
    selector.classList.add('-disable');
};

/**
 * Get HTML Template from template/ in root
 * @param {string} template - name of the template file
 * @param {function} callback - function to callback
 */
const getTemplate = function(template, callback) {
    var url = `../templates/${template}.html`;
    var req = new XMLHttpRequest();

    req.onerror = function (e) {
        console.log(`[Utils][getTemplate] Error while trying to read  ${url}`, e);
    };
    req.open('GET', url, true);
    req.responseType = 'document';

    req.onreadystatechange = function () {
        if (req.readyState === 4) {
            if (callback) callback(req.response.body.innerHTML);
        }
    };
    req.send(null);
};

/**
 * Return value of the option selected by the user
 * @param {selector} selector - DOM element
 */
const getOptionSelected = function(selector) {
    var value = null;

    for (var i = 0; i < selector.length; i++) {
        if (selector[i].checked) {
            value = selector[i].value;
            break;
        }
    }

    if (value == null) value = selector[0].value;

    return value;
}

/**
 * Remove all options found in the select list
 * @param {selector} selector - DOM element <select>
 */
const removeAllOptions = function(selector) {
    selector.options.length = 0;
}

/**
 * Create list of options in the select list
 * @param {Selection} selector - Select DOM element
 * @param {object} data - List of elements
 * @param {string} selectedElement - Selected element from received setting
 * @param {string} defaultOptionCopy - Localized string for first option
 * @param {string} valueKey - Key of the object for value
 * @param {string} innerHTMLKey - Key of the object for innerHTML
 */
const addOptions = function (selector, data, selectedElement, defaultOptionCopy, valueKey = null, innerHTMLKey = null) {
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.innerHTML = defaultOptionCopy;

    selector.appendChild(defaultOption);

    data.forEach((element) => {
        const value = valueKey ? element[valueKey] : element;
        const innerHTML = innerHTMLKey ? element[innerHTMLKey] : element;
        const newDataOption = document.createElement('option');

        newDataOption.value = value;
        newDataOption.innerHTML = innerHTML;

        /**
         * Check if some element has selected from received data
         * and set it as true
         */
        if (selectedElement != "" && selectedElement == value) {
            newDataOption.selected = true;
        }

        selector.appendChild(newDataOption);
    });
};

/**
 * Custom addOptions for meme list
 * to include the profile in the copy
 * @param {Selection} selector
 * @param {object} data
 * @param {string} selectedElement
 * @param {object} object with key related to copies
 */
const addOptionsOfMeme = function (selector, data, selectedElement, { defaultOptionCopy, value, copy, extraCopy }) {
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.innerHTML = defaultOptionCopy;

    selector.appendChild(defaultOption);

    data.forEach((element) => {
        const valueKey = element[value];
        const innerHTML = extraCopy ? `${element[extraCopy]} - ${element[copy]}` : element[copy];
        const newDataOption = document.createElement('option');

        if(valueKey != ''){
            newDataOption.value = valueKey;
            newDataOption.innerHTML = innerHTML;

            /**
             * Check if some element has selected from received data
             * and set it as true
             */
            if (selectedElement != '' && selectedElement == valueKey) {
                newDataOption.selected = true;
            }

            selector.appendChild(newDataOption);
        }
    });
};


/**
 * Change status passing a boolean
 * @param {boolean} status - Status: hide or show
 * @param {selector} selector - DOM Selector
 */
const changeStatus = function(status, selector) {
    status ? show(selector) : hide(selector);
}

/**
 * Remove white space at the start and
 * at the end of the string
 * @param {string} key
 */
const trimWhiteSpace = function(key) {
    return key.replace(/^\s+|\s+$/, '');
};


const isUndefined = function (value) {
    return typeof value === 'undefined';
};

const isCanvas = function(value) {
    return value instanceof HTMLCanvasElement;
};

/**
 * Get JSON file with translations
 * @param {string} language - Lang from setting received from SD
 * @param {function} callback
 */
const getTranslation = function(language, callback) {
    const url = `../${language}.json`;
    var req = new XMLHttpRequest();

    req.onerror = function (e) {
        console.log(`[Utils][getTranslation] Error while trying to read  ${url}`, e);
    };
    req.overrideMimeType('application/json');
    req.open('GET', url, true);
    req.onreadystatechange = function () {
        if (req.readyState === 4) {
            // && req.status == "200") {
            if (callback) callback(req.responseText);
        }
    };
    req.send(null);
};

const parseJson = function(jsonString) {
    if (typeof jsonString === 'object') return jsonString;
    try {
        var o = JSON.parse(jsonString);

        // Handle non-exception-throwing cases:
        // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
        // but... JSON.parse(null) returns null, and typeof null === "object",
        // so we must check for that, too. Thankfully, null is falsey, so this suffices:
        if (o && typeof o === 'object') {
            return o;
        }
    } catch (e) {}

    return false;
};

const parseJSONPromise = function(jsonString) {
    // fetch('/my-json-doc-as-string')
    // .then(parseJSONPromise)
    // .then(heresYourValidJSON)
    // .catch(error - or return default JSON)

    return new Promise((resolve, reject) => {
        try {
            resolve(JSON.parse(jsonString));
        } catch (e) {
            reject(e);
        }
    });
};

/**
 * Double-check Voicemod version
 * @param {string} appVersion
 */
const isVoicemodV2 = function (appVersion) {
    return appVersion.includes('NotDetected') || Number(appVersion[0]) >= 2;
}

/**
 * Get target value onchange
* @param {event} event
 */
const getTargetValue = function (event) {
    return event.target.value;
}