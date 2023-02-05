/// <reference path="../libs/js/stream-deck.js" />
/// <reference path="../shared/app-utils.js" />

class DeckDevice {
	id;
	type;
	startColumnOffset = 0;
	columnCount;
	currentOffset;
	nextKey;
	previousKey;
	autoColumns = [];
	/**
	 * @type {Map<string, ManualContext>}
	 */
	manualContexts = new Map(); // 2D array of contexts
	volumeStep = 5;
	// This is used to hide the "back to profile" icon if the user enters the profile directly.
	enableBackToProfile = false;
	connected = true;

	constructor(id, type) {
		this.id = id;
		this.type = type;
		this.columnCount = SD_TYPES.columnCount(type);
		this.startColumnOffset = SD_TYPES.startColumnOffset(type);
		this.currentOffset = 0;
		for (let i = 0; i < this.columnCount; i++) {
			this.autoColumns[i] = new Column();
		}
	}

	/**
	 *
	 * @param {ManualContext} manualContext
	 * @param {*} app
	 */
	static setManualImages(manualContext, app, available = true) {
		const { controller, context, settings } = manualContext;

		switch (controller) {
			case CONTROLLER.encoder:
				DeckDevice.setFeedbackImage(context, app, available);
				break;
			case CONTROLLER.keypad:
				const { volumeChange, volumeStep } = settings;
				if (volumeChange === VOLUME_CHANGE.adjust) {
					const intStep = parseInt(volumeStep);
					if (intStep > 0) {
						DeckDevice.setVolumeSliderImages(context, null, app, available);
					} else if (intStep < 0) {
						DeckDevice.setVolumeSliderImages(null, context, app, available);
					} else { // set something for 0 to let the user know the settings changed
						if (!available || AppUtils.isInactiveLong(app)) {
							$SD.setImage(context, app.iconDataUnavailable); //TODO this pattern has been duplicated in multiple places
						} else if (AppUtils.isInactiveShort(app)) {
							$SD.setImage(context, app.iconDataUnavailable);
						} else {
							$SD.setImage(context, app.iconData);
						}
						$SD.setTitle(context, '');
					}
				} else if (volumeChange === VOLUME_CHANGE.mute) {
					DeckDevice.setMuteKeyImage(context, app, available);
				} else if (volumeChange === VOLUME_CHANGE.set) {
					DeckDevice.setVolumeSetPercentImage(context, app, settings.volume, available);
				}
				break;
		}
	}

	static setVolumeSetPercentImage(context, app, volume, available = true) {
		if (!context) return;

		if (!available || AppUtils.isInactiveLong(app)) {
			$SD.setImage(context, app.iconDataUnavailable);
		} else if (AppUtils.isInactiveShort(app)) {
			$SD.setImage(context, app.iconDataUnavailable);
		} else {
			$SD.setImage(context, app.iconData);
		}

		$SD.setTitle(context, `${volume}%`);
	}

	static getNewVolume(volume, multiplier = 1, volumeStep = 5) {
		const adjustment = Math.round(multiplier) * Math.round(volumeStep);
		const changedVolume = parseFloat(volume) + adjustment / 100;
		// can't go over 100% or under 0% volume.
		// toFixed returns a string for some reason so we use math.round for 2 decimal places...
		// math.round is way faster than parseFloat -> toFixed -> parseFloat
		const newVolume = Math.round(Math.min(Math.max(changedVolume, 0.0), 1.0) * 100) / 100;

		return newVolume;
	}

	static setMuteKeyImage(context, app, available = true) {
		if (!context) return;

		$SD.setTitle(context, '');

		if (!app) {
			$SD.setImage(context, '');
			return;
		}

		if (!available || AppUtils.isInactiveLong(app)) {
			$SD.setImage(context, app.iconDataWithTextUnavailable);
		} else if (AppUtils.isInactiveShort(app)) {
			const image = app.mute
				? app.mutedIconDataWithTextUnavailable
				: app.iconDataWithTextUnavailable;
			$SD.setImage(context, image);
		} else {
			const image = app.mute ? app.mutedIconDataWithText : app.iconDataWithText;
			$SD.setImage(context, image);
		}
	}

	static setVolumeSliderImages(upContext, downContext, app, available = true) {
		if (!upContext && !downContext) return;

		const showIcon = available && AppUtils.canActivelyAdjustVolume(app);
		const upImage = showIcon ? AppUtils.getSliderSVG(true, app.volume) : Images.blank;
		const downImage = showIcon ? AppUtils.getSliderSVG(false, app.volume) : Images.blank;

		if (upContext) {
			$SD.setTitle(upContext, '');
			$SD.setImage(upContext, upImage);
		}

		if (downContext) {
			$SD.setTitle(downContext, '');
			$SD.setImage(downContext, downImage);
		}
	}

	static setFeedbackVolume(context, app, available = true) {
		if (!context) return;

		if (!available || AppUtils.isInactiveLong(app)) {
			$SD.setFeedback(context, {
				indicator: { value: 0, opacity: 1, enabled: true },
				value: '',
			});
		} else if (app.volume >= 0) {
			const displayVol = Math.round(app.volume * 100);

			$SD.setFeedback(context, {
				indicator: { value: displayVol, opacity: 1, enabled: true },
				value: `${displayVol}%`,
			});
		}
	}

	static setFeedbackMute(context, app, available = true) {
		if (!app || !context) return;

		if (!available || AppUtils.isInactiveLong(app)) {
			$SD.setImage(context, app.iconDataUnavailable);
			$SD.setFeedback(context, {
				icon: app.iconDataUnavailable,
			});
		} else if (AppUtils.isInactiveShort(app)) {
			const image = app.mute ? app.mutedIconDataUnavailable : app.iconDataUnavailable;

			$SD.setImage(context, image);
			$SD.setFeedback(context, {
				icon: image,
			});
		} else {
			const image = app.mute ? app.mutedIconData : app.iconData;

			$SD.setImage(context, image);
			$SD.setFeedback(context, {
				icon: image,
			});
		}
	}

	static setFeedbackImage(context, app, available = true) {
		if (!context) return;

		if (!app) {
			$SD.setImage(context);
			$SD.setFeedback(context, {
				title: '',
				icon: '',
				indicator: false,
				value: '',
			});

			return;
		}

		if (!available || AppUtils.isInactiveLong(app)) {
			$SD.setImage(context, app?.iconDataUnavailable);
			$SD.setFeedback(context, {
				title: app.displayName,
				icon: app.iconDataUnavailable,
				indicator: { value: 0, opacity: 1, enabled: true },
				value: '',
			});
		} else if (AppUtils.isInactiveShort(app)) {
			$SD.setImage(context, app?.iconDataUnavailable);
			$SD.setFeedback(context, {
				title: app.displayName,
				icon: app?.mute ? app?.mutedIconDataUnavailable : app?.iconDataUnavailable,
				indicator: { value: app.volume * 100, opacity: 1, enabled: true },
				value: Math.round(app.volume * 100).toString() + '%',
			});
		} else {
			$SD.setImage(context, app?.iconData);
			$SD.setFeedback(context, {
				title: app.displayName,
				icon: app?.mute ? app.mutedIconData : app.iconData,
				indicator: { value: app.volume * 100, opacity: 1, enabled: true },
				value: Math.round(app.volume * 100).toString() + '%',
			});
		}
	}

	static clearImageAndFeedback(context) {
		$SD.setTitle(context, '');
		$SD.setImage(context, Images.blank);
		$SD.setFeedback(context, {
			icon: Images.blank,
		});
	}

	get nextOffset() {
		return this.currentOffset + this.columnCount;
	}

	get previousOffset() {
		return this.currentOffset - this.columnCount;
	}

	openAutoProfile(context) {
		this.currentOffset = 0;

		switch (this.type) {
			case SD_TYPES.standard:
				$SD.switchToProfile(this.id, 'Volume Controller (Auto)');
				break;
			case SD_TYPES.xl:
				$SD.switchToProfile(this.id, 'Volume Controller XL (Auto)');
				break;
			case SD_TYPES.plus:
				$SD.switchToProfile(this.id, 'Volume Controller+ (Auto)');
				break;
			default:
				$SD.showAlert(context);
		}
	}

	setManualDialTitles(app) {
		const manualContexts = this.getManualContextsByExecutableFile(app.executableFile);

		manualContexts.forEach((manualContext) => {
			if (manualContext?.controller === CONTROLLER.encoder) {
				this.setDialTitle(manualContext.context, app);
			}
		});
	}

	setDialTitle(context, app) {
		$SD.setFeedback(context, {
			title: app?.displayName,
		});
	}

	setAllImages(apps, available = true) {
		if (!apps) return;

		const hideInactiveApps = globalSettings && globalSettings[this.id]?.showApps == 'active';
		const filteredApps = hideInactiveApps ? apps.filter(AppUtils.inactiveAppFilter) : apps;

		this.setAllAutoImages(available ? filteredApps : []);
		this.setAllManualImages(apps, available);
		this.setNextKeyImage(this.nextKey, available ? filteredApps.length : 0);
		this.setPreviousKeyImage(this.previousKey, available);

		if (!available) {
			this.currentOffset = 0;
		}
	}

	setAllManualImages(apps, available = true) {
		apps.forEach((app) => {
			this.setManualDialTitles(app);
			this.setManualMuteImages(app, available);
			this.setManualVolumeImages(app, available);
			this.setManualSetVolumeImages(app, available)
		});
	}

	setManualSetVolumeImages(app, available = true) {
		const { executableFile } = app;
		const manualContexts = this.getManualContextsByExecutableFile(executableFile);

		manualContexts
			.filter(
				({ settings, controller }) =>
					settings?.volumeChange === VOLUME_CHANGE.set && controller === CONTROLLER.keypad
			)
			.forEach(({ context, controller, settings }) => {
				DeckDevice.setVolumeSetPercentImage(context, app, settings?.volume, available);
			});
	}

	setAllAutoImages(apps) {
		this.autoColumns.forEach((column, columnIndex) => {
			const index = this.currentOffset + columnIndex;
			this.setColumnImages(column, apps[index]);
		});
		this.setNextKeyImage(this.nextKey, apps.length);
		this.setPreviousKeyImage(this.previousKey);
	}

	setColumnImages(column, app) {
		column.processID = app?.processID;
		DeckDevice.setMuteKeyImage(column.muteKey, app);
		DeckDevice.setVolumeSliderImages(column.volumeUpKey, column.volumeDownKey, app);
		DeckDevice.setFeedbackImage(column.volumeDial, app);
	}

	updateAppMute(app, available = true) {
		this.setAutoMute(app);
		this.setManualMuteImages(app, available);
	}

	updateAppVolume(app, available = true) {
		this.setAutoVolumes(app);
		this.setManualVolumeImages(app, available);
	}

	setAutoMute(app) {
		const autoColumns = this.getAutoColumnsByProcessID(app.processID);

		autoColumns.forEach((column) => {
			DeckDevice.setMuteKeyImage(column.muteKey, app);
			DeckDevice.setFeedbackMute(column.volumeDial, app);
		});
	}

	setNextKeyImage(context, numberOfApps) {
		if (!context) return;

		const shouldSetImage =
			numberOfApps > this.columnCount && numberOfApps - this.currentOffset - this.columnCount > 0;
		const image = shouldSetImage ? Images.right : Images.blank;

		$SD.setImage(context, image);
	}

	setPreviousKeyImage(context, available = true) {
		if (!context) return;

		const shouldSetImage = available ? this.currentOffset > 0 : false;
		const image = shouldSetImage ? Images.left : Images.blank;

		$SD.setImage(context, image);
	}

	getAppIndexFromColumn(columnIndex) {
		return this.currentOffset + columnIndex - this.startColumnOffset;
	}

	nextPage(apps) {
		const numberOfApps = apps.length;

		if (numberOfApps > this.nextOffset) {
			this.currentOffset = this.nextOffset;
			this.setAllAutoImages(apps);
		}
	}

	previousPage(apps) {
		if (this.currentOffset > 0) {
			this.currentOffset = this.previousOffset;
			this.setAllAutoImages(apps);
		}
	}

	getAutoColumnsByProcessID(processID) {
		return this.autoColumns.filter((column) => column?.processID === processID);
	}

	getManualContextsByExecutableFile(executableFile) {
		return Array.from(this.manualContexts.values()).filter(
			(context) => context?.settings?.application?.executableFile === executableFile
		);
	}

	setAutoVolumes(app) {
		if (!app) return;

		const autoColumns = this.getAutoColumnsByProcessID(app.processID);

		autoColumns.forEach((column) => {
			DeckDevice.setVolumeSliderImages(column.volumeUpKey, column.volumeDownKey, app);
			DeckDevice.setFeedbackVolume(column.volumeDial, app);
		});
	}

	clearAllImages() {
		this.autoColumns.forEach((column) => {
			if (column.muteKey) {
				$SD.setImage(column.muteKey);
			}
			if (column.volumeUpKey) $SD.setImage(column.volumeUpKey);
			if (column.volumeDownKey) $SD.setImage(column.volumeDownKey);
			if (column.volumeDial) {
				$SD.setImage(column.volumeDial);
				$SD.setFeedback(column.volumeDial, {
					title: '',
					icon: '',
					indicator: { value: 0, opacity: 0, enabled: true },
					value: '',
				});
			}
		});

		$SD.setImage(this.nextKey);
		$SD.setImage(this.previousKey);
	}

	setManualVolumeImages(app, available = true) {
		const { executableFile } = app;
		const manualContexts = this.getManualContextsByExecutableFile(executableFile);

		manualContexts
			.filter(
				({ settings, controller }) =>
					settings?.volumeChange === VOLUME_CHANGE.adjust || controller === CONTROLLER.encoder
			)
			.forEach(({ context, controller, settings }) => {
				switch (controller) {
					case CONTROLLER.encoder:
						DeckDevice.setFeedbackVolume(context, app, available);
						break;
					case CONTROLLER.keypad:
						if (settings.volumeChange === VOLUME_CHANGE.adjust) {
							const intStep = settings.volumeStep;
							if (intStep > 0) {
								DeckDevice.setVolumeSliderImages(context, null, app, available);
							} else if (intStep < 0) {
								DeckDevice.setVolumeSliderImages(null, context, app, available);
							}
						}
						break;
				}
			});
	}

	setManualMuteImages(app, available = true) {
		const manualContexts = this.getManualContextsByExecutableFile(app.executableFile);

		manualContexts
			.filter(
				({ settings, controller }) =>
					settings?.volumeChange === VOLUME_CHANGE.mute || controller === CONTROLLER.encoder
			)
			.forEach(({ context, controller }) => {
				switch (controller) {
					case CONTROLLER.encoder:
						DeckDevice.setFeedbackMute(context, app, available);
						break;
					case CONTROLLER.keypad:
						DeckDevice.setMuteKeyImage(context, app, available);
						break;
				}
			});
	}

	/**
	 *
	 * @param {string} context
	 * @param {*} app
	 */
	setManualImages(context, app, available = true) {
		const manualContext = this.manualContexts.get(context);
		DeckDevice.setManualImages(manualContext, app, available);
	}

	setManualContext(context, coordinates, settings, controller) {
		this.manualContexts.set(context, new ManualContext(context, coordinates, settings, controller));
	}

	removeManualContext(context) {
		this.manualContexts.delete(context);
	}
}

class Column {
	processID;
	muteKey;
	volumeUpKey;
	volumeDownKey;
	volumeDial;
}

class ManualContext {
	constructor(context, coordinates, settings, controller) {
		this.context = context;
		this.coordinates = coordinates;
		this.settings = settings;
		this.controller = controller;
	}

	controller;
	coordinates;
	context;
	settings;
}
