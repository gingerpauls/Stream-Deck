# Stream Deck Plugin - Front-end

## Debug
Once added a new [DWORD](https://developer.elgato.com/documentation/stream-deck/sdk/create-your-own-plugin/#debugging-your-javascript-plugin) on your machine, you should be able to open http://localhost:23654/ on Chrome (or your favorite browser).

By clicking on a canvas box you'll see the related instance on the browser in the list of the **Inspectable pages**.
Once inside the instance, you can easily inspect the HTML and debug JS code with the dev tool.

## Deploy
To apply the changes you'll need to **rebuild** the solution on Visual Studio.
The **compiled** code is inside the folder
*C:\Users\USERNAME\AppData\Roaming\Elgato\StreamDeck\Plugins\net.voicemod.windowsdesktop.sdPlugin*
(remember to change you PC username in the path).


## Front-end Architecture
The main and common logic is inside the folder **plugin/**.
### JSON
* **manifest.json**: its the skeleton of the plugin, provides important information like:
    * name
    * description
    * version
    * author
    * list of actions with the action's name, default icons
* **langXX.json**: all localization files



### HTML
Each folder represent a Property Inspector (addVoice, meme, random).
Each PI has its own HTML, JS, and, when necessary, the CSS file.

On **templates/** you'll find all the HTML snippets that are present in more than one PI inside the application. This template are called on **plugin/plugin.js** on the **init()** function.

### CSS
The styles of the application are on **plugin/css**.
* **sdpi.css**: Stream Deck common style
* **voicemod.css**: custom style of Voicemod

### JavaScript
The main and common logic is inside the folder **plugin/**.
* **main.js**: it is in charge of the WebSockets connection with StreamDeck.
* **plugin.js**: this file contains the main logic of the plugin. It's in charge of the init of the app, launch the Action depending on the received setting, send message to and from the plugin, and localize the global text.
* **utils.js**: all the functionality that perform small and repetitive operations.

Each PI has its own JS in the related folder.
In once of each a variable is set to true in order to be sure that the related PI has been called, as StreamDeck creates a new and separate instance for each PI (you can easily double-check launching the localhost and check the sources inside the PI).