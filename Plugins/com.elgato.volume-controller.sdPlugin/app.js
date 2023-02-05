/// <reference path="libs/js/stream-deck.js" />
/// <reference path="libs/js/action.js" />
/// <reference path="libs/js/utils.js" />
/// <reference path="shared/audio-router.js" />
/// <reference path="shared/app-activity.enum.js" />
/// <reference path="shared/images.js" />
/// <reference path="shared/stream-deck-types.enum.js" />
/// <reference path="shared/deck-device.js" />
/// <reference path="shared/app-utils.js" />
/// <reference path="shared/action.enum.js" />
/// <reference path="shared/controller.enum.js" />
/// <reference path="shared/volume-change.enum.js" />

/**
 * @type {Map<string, DeckDevice>}
 */
const deckDevices = new Map();
const audioRouter = new AudioRouter();
let globalSettings = null;

// This is used to send app events to the property inspector while it is open
let piContext = null;
let piAction = null;

//Stream Deck Events
$SD.onApplicationDidLaunch(audioRouterOpened);
$SD.onApplicationDidTerminate(audioRouterClosed);
$SD.onDeviceDidConnect(deviceDidConnect);
$SD.onDeviceDidDisconnect(deviceDidDisconnect);
$SD.onSystemDidWakeUp(refreshAll);
$SD.onDidReceiveGlobalSettings(setGlobalDeviceSettings);

// Audio Events
audioRouter.onApplicationAdded(applicationAdded);
audioRouter.onApplicationRemoved(applicationRemoved);
audioRouter.onApplicationImageChanged(applicationImageChanged);
audioRouter.onApplicationVolumeChanged(redrawVolume);
audioRouter.onApplicationMuteChanged(redrawMuteIcons);
audioRouter.onApplicationActivityChanged(applicationActivityChanged);
audioRouter.onDefaultDeviceChanged(defaultDeviceChanged);

function audioRouterOpened() {
	audioRouter.connect();
}

function audioRouterClosed() {
	const apps = audioRouter.getAppsArray();

	sendAppsToPropertyInspector(apps);

	redrawAllDecks(apps, false);

	audioRouter.disconnect();
}

function deviceDidConnect({ device, deviceInfo }) {
	const { type } = deviceInfo;

	const deckDevice = deckDevices.get(device);

	if (deckDevice) {
		deckDevice.connected = true;
	} else {
		deckDevices.set(device, new DeckDevice(device, type));
	}
}

function deviceDidDisconnect({ device }) {
	// we never delete devices because "DeckDevice" holds key contexts we need
	deckDevices.get(device).connected = false;
}

function applicationRemoved(app) {
	const apps = audioRouter.getAppsArray();

	sendAppsToPropertyInspector(apps);

	connectedDevices().forEach((deckDevice) => {
		const manualContexts = deckDevice.getManualContextsByExecutableFile(app.executableFile);
		manualContexts.forEach((manualContext) => {
			DeckDevice.setManualImages(manualContext, app, false);
		});
	});

	redrawAllDecks(apps);
}

function applicationAdded() {
	const apps = audioRouter.getAppsArray();

	sendAppsToPropertyInspector(apps);

	redrawAllDecks(apps);
}

function applicationImageChanged() {
	const apps = audioRouter.getAppsArray();

	sendAppsToPropertyInspector(apps);

	redrawAllDecks(apps);
}

function redrawAllDecks(apps, available = true) {
	connectedDevices().forEach((deckDevice) => {
		deckDevice.setAllImages(apps, available);
	});
}

function redrawVolume(app) {
	connectedDevices().forEach((deckDevice) => {
		deckDevice.updateAppVolume(app);
	});
}

function redrawMuteIcons(app) {
	connectedDevices().forEach((deckDevice) => {
		deckDevice.updateAppMute(app);
	});
}

function sendAppsToPropertyInspector(apps) {
	if (piAction && piContext && apps) {
		$SD.sendToPropertyInspector(piContext, piAction, {
			apps,
			connected: audioRouter.isConnected,
			globalSettings,
		});
	}
}

function applicationActivityChanged(app) {
	const apps = audioRouter.getAppsArray();

	sendAppsToPropertyInspector(apps);

	redrawAllDecks(apps);
}

function defaultDeviceChanged(app) {
	redrawVolume(app);
	redrawMuteIcons(app);
}

function refreshAll() {
	audioRouter.requestApplicationRefresh();
}

function setGlobalDeviceSettings(jsn) {
	const {
		payload: { settings },
	} = jsn;
	const devices = Object.keys(settings);
	let shouldRedraw = false;

	devices.forEach((device) => {
		const deckDevice = deckDevices.get(device);

		deckDevice.volumeStep = settings[device].volumeStep;

		shouldRedraw = shouldRedraw || !globalSettings || settings[device]?.showApps != globalSettings[device]?.showApps
	});

	globalSettings = settings;

	if(shouldRedraw){
		redrawAllDecks(audioRouter.getAppsArray());
	}
}

function connectedDevices() {
	return Array.from(deckDevices.values());
	// I thought we needed to only update connected devices, but I think we should update all... because you can see the actions in the SD app still
	// .filter((deckDevice) => {
	// 	return deckDevice.connected;
	// });
}
