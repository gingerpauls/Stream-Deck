// This is a subset of the common.js used in other Elgato plugins. Expand/replace as needed

// don't change this to let or const, because we rely on var's hoisting
// eslint-disable-next-line no-use-before-define, no-var
var $localizedStrings = $localizedStrings || {};

/* eslint no-extend-native: ["error", { "exceptions": ["String"] }] */
String.prototype.lox = function () {
	var a = String(this);
	try {
		a = $localizedStrings[a] || a;
	} catch (b) { }
	return a;
};

String.prototype.sprintf = function (inArr) {
	let i = 0;
	const args = inArr && Array.isArray(inArr) ? inArr : arguments;
	return this.replace(/%s/g, function () {
		return args[i++];
	});
};

// eslint-disable-next-line no-unused-vars
const sprintf = (s, ...args) => {
	let i = 0;
	return s.replace(/%s/g, function () {
		return args[i++];
	});
};

const Utils_readJson = function (file, callback, async = true) {
	var req = new XMLHttpRequest();
	req.onerror = function (e) {
		// Utils.log(`[Utils][readJson] Error while trying to read  ${file}`, e);
	};
	req.overrideMimeType("application/json");
	req.open("GET", file, async);
	req.onreadystatechange = function () {
		if (req.readyState === 4) {
			// && req.status == "200") {
			if (callback) callback(req.responseText);
		}
	};
	req.send(null);
};
const Utils_parseJson = function (jsonString) {
	if (typeof jsonString === "object") return jsonString;
	try {
		const o = JSON.parseEx(jsonString);

		// Handle non-exception-throwing cases:
		// Neither JSON.parseEx(false) or JSON.parseEx(1234) throw errors, hence the type-checking,
		// but... JSON.parseEx(null) returns null, and typeof null === "object",
		// so we must check for that, too. Thankfully, null is falsey, so this suffices:
		if (o && typeof o === "object") {
			return o;
		}
	} catch (e) { }

	return false;
};

const loadLocalization = (lang, pathPrefix, cb) => {
	Utils_readJson(`${pathPrefix}${lang}.json`, function (jsn) {
		const manifest = Utils_parseJson(jsn);
		$localizedStrings = manifest && manifest.hasOwnProperty("Localization") ? manifest["Localization"] : {};
		if (cb && typeof cb === "function") cb();
	});
};

const relocalize = () => {
	const root = document.getRootNode();
	const descend = (node, localizedParent) => {
		const localize = (node.getAttribute && node.getAttribute("localize")) !== undefined;

		if (node.nodeType === node.TEXT_NODE && (localize || localizedParent)) {
			node.textContent = node.textContent.lox();
		} else if (node.placeholder && localize !== undefined) {
			node.placeholder = node.placeholder.lox();
		} else {
			node.childNodes.forEach(child => {
				descend(child, localize);
			});
		}
	};
	descend(root);
};
