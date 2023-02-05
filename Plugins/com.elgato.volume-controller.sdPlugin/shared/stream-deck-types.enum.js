const SD_TYPES = Object.freeze({
	standard: 0,
	xl: 2,
	plus: 7,
	columnCount: (device) => {
		switch (device) {
			case SD_TYPES.standard:
				return 4;
			case SD_TYPES.xl:
				return 7;
			case SD_TYPES.plus:
				return 4;
			default:
				return 0;
		}
	},
	isSupportedDevice: (deviceType) => {
		const supportedDevices = [SD_TYPES.standard, SD_TYPES.xl, SD_TYPES.plus];

		return supportedDevices.includes(deviceType);
	},
	startColumnOffset: (device) => {
		switch (device) {
			case SD_TYPES.standard:
				return 1;
			case SD_TYPES.xl:
				return 1;
			default:
				return 0;
		}
	},
});
