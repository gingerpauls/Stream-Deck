/// <reference path="stream-deck-types.enum.js" />
const getCanvas = () => document.getElementById('canvas');
const getContext = () => document.getElementById('canvas').getContext('2d');
const loadImage = (url) => {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error(`load ${url} fail`));
		img.src = url;
	});
};

// Here, I created a function to draw image.
const layerImages = async (image1, image2) => {
	const ctx = getContext();
	const canvas = getCanvas();
	const img = await loadImage(image1.data.repeat(1)); // repeat creates a copy of the image string, not sure if this is necessary.
	const img2 = await loadImage(image2.data.repeat(1));
	const x1 = image1.x ? image1.x : 0;
	const y1 = image1.y ? image1.y : 0;
	const w1 = image1.w ? image1.w : canvas.width;
	const h1 = image1.h ? image1.h : canvas.height;
	const x2 = image2.x ? image2.x : 0;
	const y2 = image2.y ? image2.y : 0;
	const w2 = image2.w ? image2.w : canvas.width;
	const h2 = image2.h ? image2.h : canvas.height;

	ctx.drawImage(img, x1, y1, w1, h1);
	ctx.drawImage(img2, x2, y2, w2, h2);

	const data = canvas.toDataURL('image/png');

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	return data;
};

class AppUtils {
	static async fixData(image) {
		const ctx = getContext();
		const canvas = getCanvas();
		const img = await loadImage(image.repeat(1)); // repeat creates a copy of the image string, not sure if this is necessary.
		const x1 = image.x ? image.x : 0;
		const y1 = image.y ? image.y : 0;
		const w1 = image.w ? image.w : canvas.width;
		const h1 = image.h ? image.h : canvas.height;

		ctx.drawImage(img, x1, y1, w1, h1);
		const data = canvas.toDataURL('image/png');

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.filter = 'none';

		return data;
	}

	static async getUnavailableImage(image1) {
		const ctx = getContext();
		const canvas = getCanvas();
		const img = await loadImage(image1.repeat(1)); // repeat creates a copy of the image string, not sure if this is necessary.
		const x1 = image1.x ? image1.x : 0;
		const y1 = image1.y ? image1.y : 0;
		const w1 = image1.w ? image1.w : canvas.width;
		const h1 = image1.h ? image1.h : canvas.height;

		ctx.filter = 'grayscale(1)';
		// ctx.globalAlpha = 0.4
		ctx.drawImage(img, x1, y1, w1, h1);
		const data = canvas.toDataURL('image/png');

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.filter = 'none';

		return data;
	}

	static async addMuteSlash(appIconData, hasText, textOnly) {
		if (!appIconData) return null;

		if (textOnly) {
			const image1 = { data: appIconData };
			const image2 = { data: Images.slash, x: 22, y: 22, w: 100, h: 100 };

			return await layerImages(image1, image2);
		} else if (hasText) {
			const image1 = { data: appIconData };
			const image2 = { data: Images.slash, x: 24, y: 4, w: 96, h: 96 };

			return await layerImages(image1, image2);
		} else {
			const image1 = { data: appIconData };
			const image2 = { data: Images.slash };

			return await layerImages(image1, image2);
		}
	}

	static setDisplayNameFromExe(app) {
		app.originalExecutableFile = app.executableFile;
		app.displayName = app.displayName
			? app.displayName
			: AppUtils.getDisplayNameFromPath(app.executableFile);

		app.originalDisplayName = app.displayName;
	}

	static setShortName(app) {
		app.shortName =
			app.displayName.length > 15 ? `${app.displayName.slice(0, 15)}...` : app.displayName;
	}

	static getDisplayNameFromPath(path) {
		const lastSlashIndex = path.lastIndexOf('\\');
		const nameWithExtension = path.slice(lastSlashIndex + 1, path.length).toLowerCase();
		const name = nameWithExtension.slice(0, nameWithExtension.lastIndexOf('.'));

		return name
			.split(' ')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	static getKeyByMapValue(map, searchValue) {
		for (let [key, value] of map.entries()) {
			if (value == searchValue) return key;
		}
	}

	static generateUniqueID() {
		return Math.floor(Math.random() * 1000000000);
	}

	static getSliderSVG(isTop, inVolume) {
		const backgroundColor = '#000000';
		const volume = Math.abs(inVolume - 1); // not sure why this is needed for the slider values from Wave Link, but this works

		// const horizontal = `<g id="slider" transform="translate(144, 72) rotate(90) translate(-144, -72) ${isTop ? 'translate(72,72)' : 'translate(72,-72)'}">`;
		const vertical = `<g id="slider" transform="${isTop ? 'translate(0)' : 'translate(0,-144)'}">`;

		const faderWidth = 232;
		const radius = 8;
		const innerLow = 28; // note: element #bar needs a 1px offset to avoid a 'blip' when drawing the fill inside of the fader
		const thumbWidth = innerLow + radius * 2;
		const h = volume * (faderWidth + innerLow - radius * 2);

		const slider = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="144" height="144" viewBox="0 0 144 144">
                            <defs>
                                <path id="path-3" d="M14,0 C21.7319865,0 28,6.2680135 28,14 L28,230 C28,237.731986 21.7319865,244 14,244 C6.2680135,244 0,237.731986 0,230 L0,14 C0,6.2680135 6.2680135,0 14,0 Z M14,6 C11.790861,6 9.790861,6.8954305 8.34314575,8.34314575 C6.8954305,9.790861 6,11.790861 6,14 L6,230 C6,232.209139 6.8954305,234.209139 8.34314575,235.656854 C9.790861,237.104569 11.790861,238 14,238 C16.209139,238 18.209139,237.104569 19.6568542,235.656854 C21.1045695,234.209139 22,232.209139 22,230 L22,14 C22,11.790861 21.1045695,9.790861 19.6568542,8.34314575 C18.209139,6.8954305 16.209139,6 14,6 Z"/>            
                            </defs>
                            ${vertical}
                                    <polygon id="background" fill="${backgroundColor}" fill-rule="nonzero" points="-72 72 216 72 216 216 -72 216" transform="rotate(-90 72 144)"/>
                                    <g id="back" transform="translate(58 22)">
                                        <use xlink:href="#path-3" id="slider" fill="#FFF"/>
                                    </g>
                                    <rect id="bar" x="64" y="${
																			1 + innerLow + h
																		}" rx="${radius}" width="${radius * 2}" height="${
			faderWidth - h
		}" fill="#FFF"></rect>
                                    <g transform="translate(0 ${
																			-thumbWidth + volume * faderWidth
																		})">
                                        <circle id="cut" cx="72" cy="74" r="26" fill="${backgroundColor}" mask="url(#mask-2)"/>
                                        <path id="ring" fill="#FFF" d="M72,54 C83.045695,54 92,62.954305 92,74 C92,85.045695 83.045695,94 72,94 C60.954305,94 52,85.045695 52,74 C52,62.954305 60.954305,54 72,54 Z M72,60 C64.2680135,60 58,66.2680135 58,74 C58,81.7319865 64.2680135,88 72,88 C79.7319865,88 86,81.7319865 86,74 C86,66.2680135 79.7319865,60 72,60 Z"/>
                                    </g>
                                </g>
                            </svg>`;

		return `data:image/svg+xml;base64,${btoa(slider)}`;
	}

	static measureText(text, font) {
		const canvas =
			AppUtils.measureText.canvas ||
			(AppUtils.measureText.canvas = document.createElement('canvas'));
		const ctx = canvas.getContext('2d');
		ctx.font = font || 'bold 10pt system-ui';
		return ctx.measureText(text);
	}

	static getScaledFont(text, fontSize) {
		const font = this.getFont(fontSize);
		const width = AppUtils.measureText(text, font).width;

		if (width > 138 && fontSize > 6) {
			return this.getScaledFont(text, fontSize - 4);
		}

		return font;
	}

	static getFont(fontSize) {
		return `${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`;
	}

	static async getMuteImage(appIconData, appDisplayName) {
		return new Promise((resolve) => {
			if (appIconData) {
				const image = new Image();
				image.onload = () => {
					const font = AppUtils.getScaledFont(appDisplayName, 28);
					const canvas = document.getElementById('canvas');
					const x = canvas.width / 2;
					const ctx = canvas.getContext('2d');
					ctx.fillStyle = '#FFFFFF';
					ctx.drawImage(image, 32, 12, canvas.width - 64, canvas.height - 64);
					ctx.font = font;
					ctx.beginPath();
					ctx.moveTo(x, 0);
					ctx.lineTo(x, canvas.height);
					ctx.textAlign = 'center';
					ctx.fillText(appDisplayName, x, 128);
					const data = canvas.toDataURL('image/png');
					ctx.clearRect(0, 0, canvas.width, canvas.height);

					resolve(data);
				};
				image.src = appIconData;
			} else {
				const font = AppUtils.getScaledFont(appDisplayName, 36);
				const textHeight = AppUtils.measureText(appDisplayName, font).actualBoundingBoxAscent;
				const canvas = document.getElementById('canvas');
				const x = canvas.width / 2;
				const y = canvas.height / 2 + textHeight / 2;
				const ctx = canvas.getContext('2d');
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.fillStyle = '#FFFFFF';
				ctx.font = font;
				ctx.beginPath();
				ctx.moveTo(x, 0);
				ctx.lineTo(x, canvas.height);
				ctx.textAlign = 'center';
				ctx.fillText(appDisplayName, x, y);
				const data = canvas.toDataURL('image/png');
				ctx.clearRect(0, 0, canvas.width, canvas.height);

				resolve(data);
			}
		});
	}

	static getAppByExecutableFile(apps, executableFile) {
		return apps.find((app) => {
			return app.executableFile === executableFile;
		});
	}

	static async setNamesAndIdentifiers(apps, app) {
		AppUtils.setDisplayNameFromExe(app);

		const allInstances = apps.filter((instance) => {
			return instance.originalExecutableFile === app.originalExecutableFile;
		});

		// TODO clean up duplicate code here;
		if (allInstances.length > 1) {
			for (let i = 0; i < allInstances.length; i++) {
				if (i > 0) {
					allInstances[i].executableFile = `${i + 1}*${allInstances[i].originalExecutableFile}`;
				}

				allInstances[i].displayName = `${i + 1}-${allInstances[i].originalDisplayName}`;
				AppUtils.setShortName(allInstances[i]);

				if (allInstances[i].originalIconData) {
					allInstances[i].iconDataWithText = await AppUtils.getMuteImage(
						allInstances[i].originalIconData,
						allInstances[i].shortName
					);
					allInstances[i].iconDataWithTextUnavailable = await AppUtils.getUnavailableImage(
						allInstances[i].iconDataWithText
					);
					allInstances[i].mutedIconDataWithText = await AppUtils.addMuteSlash(
						allInstances[i].iconDataWithText,
						false,
						true
					);
					allInstances[i].mutedIconDataWithTextUnavailable = await AppUtils.addMuteSlash(
						allInstances[i].iconDataWithTextUnavailable,
						true
					);
				}
			}
		} else {
			app.executableFile = app.originalExecutableFile;
			app.displayName = app.originalDisplayName;
			AppUtils.setShortName(app);
			app.iconDataWithText = await AppUtils.getMuteImage(app.originalIconData, app.shortName);
			app.iconDataWithTextUnavailable = await AppUtils.getUnavailableImage(app.iconDataWithText);
			app.mutedIconDataWithText = await AppUtils.addMuteSlash(app.iconDataWithText, false, true);
			app.mutedIconDataWithTextUnavailable = await AppUtils.addMuteSlash(
				app.iconDataWithTextUnavailable,
				true
			);
		}
	}

	static isInactiveShort(app) {
		if (!app) return true;

		return app.activity >= APP_ACTIVITY.inactiveShort;
	}

	static isInactiveLong(app) {
		if (!app) return true;

		return app.activity >= APP_ACTIVITY.inactiveLong;
	}

	static canActivelyAdjustVolume(app) {
		if (!app) return false;
		else return AppUtils.isActive(app) || app.activity == APP_ACTIVITY.inactiveShort;
	}

	static isActive(app) {
		if (!app) return false;

		return app.activity < APP_ACTIVITY.inactiveLong;
	}

	static inactiveAppFilter(app) {
		return app.activity <= APP_ACTIVITY.inactiveShort;
	}
}
