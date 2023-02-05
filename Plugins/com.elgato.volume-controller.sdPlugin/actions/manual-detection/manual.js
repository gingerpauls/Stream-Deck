/// <reference path="../../app.js" />

const manualAction = new Action(ACTION.manual);
manualAction.downContexts = new Set();

manualAction.onPropertyInspectorDidAppear(({ context }) => {
	piContext = context;
	piAction = ACTION.manual;

	const apps = audioRouter.getAppsArray();
	$SD.sendToPropertyInspector(context, ACTION.manual, {
		apps,
		connected: audioRouter.isConnected,
	});
});

manualAction.onWillAppear((jsn) => {
	const { context, payload, device } = jsn;
	const { settings, controller, coordinates } = payload;
	const deckDevice = deckDevices.get(device);

	if (!deckDevice) return;

	const { application } = settings ?? {};
	const { executableFile } = application ?? {};
	const app = audioRouter.getAppByExecutableFile(executableFile);

	deckDevice.setManualContext(context, coordinates, settings, controller);

	if (app && audioRouter.isConnected) {
		deckDevice.setManualImages(context, app);
	} else if (settings?.application?.iconDataUnavailable) {
		deckDevice.setManualImages(context, settings.application, false);
	} else {
		$SD.setImage(context);
		$SD.setTitle(context, '');
	}
});

manualAction.onWillDisappear(({ context, device }) => {
	const deckDevice = deckDevices.get(device);

	if (!deckDevice) return;

	manualAction.downContexts.delete(context);
	deckDevice.removeManualContext(context);
	DeckDevice.clearImageAndFeedback(context);
});

manualAction.onDialRotate(({ context, payload }) => {
	if (!audioRouter.isConnected) {
		$SD.logMessage('Audio Router is not running!');
		$SD.showAlert(context);
		return;
	}

	const { settings, ticks } = payload;
	const { application, volumeStep } = settings ?? {};
	const { executableFile } = application ?? {};
	const app = audioRouter.getAppByExecutableFile(executableFile);

	if (AppUtils.canActivelyAdjustVolume(app)) {

		const { volume, processID } = app;
		const newVolume = DeckDevice.getNewVolume(volume, ticks, volumeStep);

		audioRouter.requestAppSetVolume(processID, newVolume);
	} else {
		$SD.showAlert(context);
	}
});

manualAction.onTouchTap(({ payload, context }) => {
	if (!audioRouter.isConnected) {
		$SD.logMessage('Audio Router is not running!');
		$SD.showAlert(context);
		return;
	}

	const { settings } = payload;
	const { application } = settings ?? {};
	const { executableFile } = application ?? {};
	const app = audioRouter.getAppByExecutableFile(executableFile);

	if (AppUtils.canActivelyAdjustVolume(app)) {

		const { processID, mute } = app;
		audioRouter.requestAppMuteToggle(processID, mute);
	} else {
		$SD.showAlert(context);
	}
});

manualAction.onDialPress(({ payload, context }) => {
	if (payload?.pressed) return;
	if (!audioRouter.isConnected) {
		$SD.logMessage('Audio Router is not running!');
		$SD.showAlert(context);
		return;
	}

	const { settings } = payload;
	const { application } = settings ?? {};
	const { executableFile } = application ?? {};
	const app = audioRouter.getAppByExecutableFile(executableFile);

	if (AppUtils.canActivelyAdjustVolume(app)) {

		const { processID, mute } = app;
		audioRouter.requestAppMuteToggle(processID, mute);
	} else {
		$SD.showAlert(context);
	}
});

manualAction.onDidReceiveSettings(({ device, context, payload }) => {
	if (!audioRouter.isConnected) {
		$SD.logMessage('Audio Router is not running!');
		$SD.showAlert(context);
		return;
	}

	const { settings, coordinates } = payload;
	const { application, controller } = settings ?? {};
	const { executableFile } = application ?? {};
	const app = audioRouter.getAppByExecutableFile(executableFile);
	const deckDevice = deckDevices.get(device);

	if (!deckDevice) return;

	deckDevice.setManualContext(context, coordinates, settings, controller);

	if (app) {
		deckDevice.setManualImages(context, app, true);
	} else if (application) {
		deckDevice.setManualImages(context, application, false);
	}
});

manualAction.onKeyDown(({ context, payload }) => {
	manualAction.downContexts.add(context);
	changeVolume({ context, payload });
});

manualAction.onKeyUp(({context}) => {
	manualAction.downContexts.delete(context);
});

function changeVolume({ context, payload }) {
	if (!manualAction.downContexts.has(context)) return;
	const { settings } = payload;
	const { volumeChange, volumeStep, application, volume, type } = settings;
	const { executableFile } = application ?? {};
	const app = audioRouter.getAppByExecutableFile(executableFile);

	if (AppUtils.canActivelyAdjustVolume(app)) {

		let newVolume;

		switch (volumeChange) {
			case VOLUME_CHANGE.mute:
				audioRouter.requestAppMuteToggle(app.processID, app.mute);
				break;
			case VOLUME_CHANGE.adjust:
				if(!volumeStep || volumeStep == 0){
					$SD.showAlert(context);
					return;
				}
				newVolume = DeckDevice.getNewVolume(app.volume, 1, volumeStep); //TODO: We can probably rewrite this function to not use a multiplier (aka the 1 right there)
				audioRouter.requestAppSetVolume(app.processID, newVolume);
				break;
			case VOLUME_CHANGE.set:
				if(!volume){
					$SD.showAlert(context);
					return;
				}
				audioRouter.requestAppSetVolume(app.processID, Math.round(volume)/100);
				break;
			default:
				$SD.showAlert(context);
		}

		if (manualAction.downContexts.has(context)) {
			setTimeout(() => changeVolume({ context, payload }), 200);
		}
	} else {
		$SD.showAlert(context);
	}
}
