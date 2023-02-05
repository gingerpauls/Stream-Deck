/// <reference path="request-type.js" />
/// <reference path="application.js" />
/// <reference path="app-utils.js" />
/// <reference path="audio-event.enum.js" />
/// <reference path="../libs/js/events.js"/>
/// <reference path="images.js" />

const jsonrpc = '2.0';

class AudioRouter {
	requests = new Map(); // uniqueID -> { deviceId, requestType }
	applications = new Map();
	isPolling = false;
	wsUrl = 'ws://127.0.0.1:1844';
	ws = null;
	on = EventEmitter.on;
	emit = EventEmitter.emit;
	activelyUpdateVolumeTimer = null;

	connect(retry = 0) {
		this.applications.clear();

		if (retry > 2) {
			const message = 'Unable to connect to the Volume Controller server.';
			$SD.logMessage(message);
			console.error(message);
			return;
		}

		if (this.isConnected) {
			return;
		}

		this.ws = new WebSocket(this.wsUrl);
		this.ws.onopen = () => {
			this.requestApplicationRefresh();
		};
		this.ws.onmessage = this.routeMessage.bind(this);
		this.ws.onclose = console.log.bind(
			console,
			'%c Audio Router Connection Closed',
			'font-weight: bold; font-size: 14px'
		);
		this.ws.onerror = async () => {
			await Utils.delay(100);
			this.connect(++retry);
			console.error('%c Audio Router Error', 'font-weight: bold; font-size: 14px');
		};
	}

	disconnect() {
		this.ws.close();
		this.ws = null;
		this.applications.clear();
	}

	get isConnected() {
		if (!this.ws) {
			return false;
		}

		return this.ws.readyState === WebSocket.OPEN;
	}

	async routeMessage(message) {
		const data = JSON.parse(message.data);
		const { id, result, method, params } = data;
		const audioRequest = this.requests.get(id) ?? {};
		const { type } = audioRequest;

		switch (type) {
			case REQUEST_TYPE.getSystemDefaultDevice:
				const sys = this.applications.get('System');

				sys.mute = result.mute;
				sys.volume = Math.round(result.volume * 100) / 100;

				this.emit(AUDIO_EVENT.applicationImageChanged, sys);
				break;
			case REQUEST_TYPE.getApplicationInstanceCount:
				const { count } = result;
				this.refreshApplications(count);
				break;
			case REQUEST_TYPE.getApplicationInstance:
			case REQUEST_TYPE.getApplicationInstanceAtIndex:
				if (result?.processID) {
					this.applications.set(result.processID, result);
					await AppUtils.setNamesAndIdentifiers(
						this.getAppsArray(false),
						this.applications.get(result.processID)
					);
					this.sortApps();
					this.requestApplicationImageByProcessID(result.processID);
					this.emit(AUDIO_EVENT.applicationAdded, result);
				}

				break;
			case REQUEST_TYPE.getApplicationInstanceImage:
				const app = this.applications.get(result?.processID);
				if (app) {
					const { image } = result;
					const origIconData = image ? await AppUtils.fixData(`data:image/bmp;base64,${result.image}`) : null;
					if (origIconData) {
						app.originalIconData = origIconData;
						app.iconData = origIconData;
						app.iconDataWithText = await AppUtils.getMuteImage(origIconData, app.shortName);
						app.mutedIconData = await AppUtils.addMuteSlash(origIconData);
						app.mutedIconDataWithText = await AppUtils.addMuteSlash(app.iconDataWithText, true);
						app.iconDataUnavailable = await AppUtils.getUnavailableImage(origIconData);
						app.iconDataWithTextUnavailable = await AppUtils.getUnavailableImage(
							app.iconDataWithText
						);
						app.mutedIconDataUnavailable = await AppUtils.addMuteSlash(app.iconDataUnavailable);
						app.mutedIconDataWithTextUnavailable = await AppUtils.addMuteSlash(
							app.iconDataWithTextUnavailable,
							true
						);
					} else {
						app.originalIconData = Images.unmute;
						app.iconData = Images.unmute;
						app.iconDataWithText = await AppUtils.getMuteImage(origIconData, app.shortName);
						app.mutedIconData = Images.mute;
						app.mutedIconDataWithText = await AppUtils.addMuteSlash(
							app.iconDataWithText,
							false,
							true
						);
						app.iconDataWithTextUnavailable = await AppUtils.getUnavailableImage(
							app.iconDataWithText
						);
						app.iconDataUnavailable = await AppUtils.getUnavailableImage(Images.unmute);
						app.mutedIconDataUnavailable = await AppUtils.addMuteSlash(app.iconDataUnavailable);
						app.mutedIconDataWithTextUnavailable = await AppUtils.addMuteSlash(
							app.iconDataWithTextUnavailable,
							true
						);
					}

					this.applications.set(app.processID, app);
					this.emit(AUDIO_EVENT.applicationImageChanged, app);
				}
				break;
			default:
		}

		let app;

		// handle automatic messages from the server when apps are added or removed
		switch (method) {
			case 'appInstanceAddRemove':
				if (params.appAddedRemoved === 'Added') {
					this.requestApplicationByProcessID(params.processID);
				} else if (params.appAddedRemoved === 'Removed') {
					app = this.applications.get(params.processID);
					this.applications.delete(params.processID);
					await AppUtils.setNamesAndIdentifiers(
						this.getAppsArray(false),
						app
					);
					this.emit(AUDIO_EVENT.applicationRemoved, app);
				}
				break;
			case 'preferredSessionInstanceVolumeChanged':
				app = this.applications.get(params.processID);
				if (app) {
					app.volume = Math.round(params.volume * 100) / 100;
					this.emit(AUDIO_EVENT.applicationVolumeChanged, app);
				}
				break;
			case 'preferredSessionInstanceMuteChanged':
				app = this.applications.get(params.processID);
				if (app) {
					app.mute = params?.mute;
					this.emit(AUDIO_EVENT.applicationMuteChanged, app);
				}
				break;
			case 'currentSystemDefaultDeviceMuteChanged':
				app = this.applications.get('System');
				if (app) {
					app.mute = params?.mute;
					this.emit(AUDIO_EVENT.applicationMuteChanged, app);
				}
				break;
			case 'currentSystemDefaultDeviceVolumeChanged':
				app = this.applications.get('System');
				if (app) {
					app.volume = Math.round(params.volume * 100) / 100;
					this.emit(AUDIO_EVENT.applicationVolumeChanged, app);
				}
				break;
			case 'appInstanceActivityChanged':
				app = this.applications.get(params.processID);

				if (app && app.activity != params.activity) {
					app.activity = params.activity;

					this.emit(AUDIO_EVENT.applicationActivityChanged, app);
				}

				break;

			case 'systemDefaultDeviceChanged':
				app = this.applications.get('System');

				app.mute = params?.mute;
				app.volume = Math.round(params.volume * 100) / 100;

				this.emit(AUDIO_EVENT.defaultDeviceChanged, app);

				break;
			default:
				break;
		}

		this.requests.delete(id);
	}

	sortApps() {
		const sortedAppsArray = Array.from(this.applications.values()).sort((a, b) => {
			if (b.originalDisplayName === 'System') {
				return 1;
			}
			return a.originalDisplayName.localeCompare(b.originalDisplayName);
		});
		const newApps = new Map();

		sortedAppsArray.forEach((app) => {
			newApps.set(app.processID, app);
		});

		this.applications = newApps;
	}

	refreshApplications(count) {
		this.applications.clear();
		const system = {
			originalDisplayName: 'System',
			displayName: 'System',
			executableFile: 'System',
			originalExecutableFile: 'System',
			iconData: Images.unmute,
			iconDataUnavailable: Images.systemUnavailable,
			iconDataWithText: Images.system,
			iconDataWithTextUnavailable: Images.systemUnavailableWithText,
			mute: null,
			mutedIconData: Images.mute,
			mutedIconDataWithText: Images.systemMute,
			processID: 'System',
			shortName: 'System',
			volume: null,
			activity: APP_ACTIVITY.active,
		};

		// const muteUnavailable = await AppUtils.getUnavailableImage(Images.mute);
		// const unMuteUnavailable = await AppUtils.getUnavailableImage(Images.unmute);
		// const muteWithText = await AppUtils.getMuteImage(Images.mute, 'System');
		// const unMuteWithText = await AppUtils.getMuteImage(Images.unmute, 'System');
		// const muteUnavailableWithText = await AppUtils.getUnavailableImage(muteWithText);
		// const unmuteUnavailableWithText = await AppUtils.getUnavailableImage(unMuteWithText);

		// console.log({muteUnavailable, unMuteUnavailable, muteWithText, unMuteWithText, muteUnavailableWithText, unmuteUnavailableWithText });

		this.applications.set('System', system);
		this.requestSystemDefaultDevice();

		for (let i = 0; i < count; i++) {
			this.requestApplicationAtIndex(i);
		}
	}

	send(request) {
		if (!this.isConnected) {
			console.error('Not connected!');
			throw 'Not connected!';
		}

		this.ws.send(JSON.stringify(request));
	}

	requestTogglePolling() {
		const id = AppUtils.generateUniqueID();
		const method = REQUEST_TYPE.togglePolling;
		const request = new AudioRequest(method);
		this.isPolling = !this.isPolling;

		this.send({
			id,
			jsonrpc,
			method,
			params: { pollingEnabled: this.isPolling },
		});
	}

	requestSetPollingInterval(interval) {
		const id = AppUtils.generateUniqueID();
		const method = REQUEST_TYPE.setPollingInterval;
		const request = new AudioRequest(method);

		this.send({
			id,
			jsonrpc,
			method,
			params: {
				pollingInterval: interval,
			},
		});
	}

	requestDeviceCount() {
		const id = AppUtils.generateUniqueID();
		const method = REQUEST_TYPE.getDeviceCount;
		const request = new AudioRequest(method);

		this.requests.set(id, request);
		this.send({ id, jsonrpc, method });
	}

	requestSystemDefaultDevice() {
		const id = AppUtils.generateUniqueID();
		const method = REQUEST_TYPE.getSystemDefaultDevice;
		const request = new AudioRequest(method);

		this.requests.set(id, request);
		this.send({
			id,
			jsonrpc,
			method,
		});
	}

	requestDevice(deviceId) {
		const id = AppUtils.generateUniqueID();
		const method = REQUEST_TYPE.getDevice;
		const request = new AudioRequest(method);

		this.requests.set(id, request);
		this.send({
			id,
			jsonrpc,
			method,
			params: { deviceId },
		});
	}

	requestApplicationAtIndex(index) {
		const id = AppUtils.generateUniqueID();
		const method = REQUEST_TYPE.getApplicationInstanceAtIndex;
		const request = new AudioRequest(method);

		this.requests.set(id, request);
		this.send({
			id,
			jsonrpc,
			method,
			params: { index },
		});
	}

	requestApplicationByProcessID(processID) {
		const id = AppUtils.generateUniqueID();
		const method = REQUEST_TYPE.getApplicationInstance;
		const request = new AudioRequest(method);

		this.requests.set(id, request);
		this.send({
			id,
			jsonrpc,
			method,
			params: { processID },
		});
	}

	requestApplicationImageByProcessID(processID) {
		const id = AppUtils.generateUniqueID();
		const method = REQUEST_TYPE.getApplicationInstanceImage;
		const request = new AudioRequest(method);

		this.requests.set(id, request);
		this.send({
			id,
			jsonrpc,
			method,
			params: { processID, imageSize: 256 * 256 * 4 + 100 },
		});
	}

	requestApplicationRefresh() {
		if (!this.isConnected) return;
		const id = AppUtils.generateUniqueID();
		const method = REQUEST_TYPE.getApplicationInstanceCount;
		const request = new AudioRequest(method);

		this.requests.set(id, request);
		this.send({
			id,
			jsonrpc,
			method,
		});
	}

	requestAppSetVolume(processID, volume) {
		const isSystem = processID === 'System';
		const id = AppUtils.generateUniqueID();
		const method = isSystem
			? REQUEST_TYPE.setSystemDefaultDeviceVolume
			: REQUEST_TYPE.setApplicationInstanceVolume;

		this.applications.get(processID).volume = volume; // optimistically store new volume for multiple clicks
		this.emit(AUDIO_EVENT.applicationChanged, this.applications.get(processID));

		this.send({
			id,
			jsonrpc,
			method,
			params: { processID, volume },
		});
	}

	requestAppMuteToggle(processID, muteStatus) {
		const isSystem = processID === 'System';
		const id = AppUtils.generateUniqueID();
		const method = isSystem
			? REQUEST_TYPE.setSystemDefaultDeviceMute
			: REQUEST_TYPE.setApplicationInstanceMute;
		const request = new AudioRequest(method);
		const mute = !muteStatus;

		this.send({
			id,
			jsonrpc,
			method,
			params: {
				processID,
				mute,
			},
		});
	}

	getAppByExecutableFile(executableFile) {
		return AppUtils.getAppByExecutableFile(Array.from(this.applications.values()), executableFile);
	}

	getAppsArray(hideInactiveApps = false) {
		if (!hideInactiveApps) {
			return Array.from(this.applications.values());
		} else {
			return Array.from(this.applications.values()).filter(AppUtils.inactiveAppFilter);
		}
	}

	onApplicationAdded(fn) {
		if (!fn) {
			console.error('A callback function for onApplicationAdded event.');
		}

		this.on(AUDIO_EVENT.applicationAdded, (jsn) => fn(jsn));
	}

	onApplicationRemoved(fn) {
		if (!fn) {
			console.error('A callback function for onApplicationRemoved event.');
		}

		this.on(AUDIO_EVENT.applicationRemoved, (jsn) => fn(jsn));
	}

	onApplicationChanged(fn) {
		if (!fn) {
			console.error('A callback function for onApplicationChanged event.');
		}

		this.on(AUDIO_EVENT.applicationChanged, (app) => fn(app));
	}

	onApplicationsRefreshed(fn) {
		if (!fn) {
			console.error('A callback function for onApplicationsRefreshed event.');
		}

		this.on(AUDIO_EVENT.applicationsRefreshed, () => fn());
	}

	onApplicationVolumeChanged(fn) {
		if (!fn) {
			console.error('A callback function for onApplicationVolumeChanged event.');
		}

		this.on(AUDIO_EVENT.applicationVolumeChanged, (app) => fn(app));
	}

	onApplicationMuteChanged(fn) {
		if (!fn) {
			console.error('A callback function for onApplicationMuteChanged event.');
		}

		this.on(AUDIO_EVENT.applicationMuteChanged, (app) => fn(app));
	}

	onApplicationImageChanged(fn) {
		if (!fn) {
			console.error('A callback function for onApplicationImageChanged event.');
		}

		this.on(AUDIO_EVENT.applicationImageChanged, (app) => fn(app));
	}

	onApplicationActivityChanged(fn) {
		if (!fn) {
			console.error('A callback function for onApplicationImageChanged event.');
		}

		this.on(AUDIO_EVENT.applicationActivityChanged, (app) => fn(app));
	}

	onDefaultDeviceChanged(fn) {
		if (!fn) {
			console.error('A callback function for onDefaultDeviceChanges event.');
		}

		this.on(AUDIO_EVENT.defaultDeviceChanged, (app) => fn(app));
	}
}
