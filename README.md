# StreamDeck OBS+

This plugin for the Elgato StreamDeck allows for better control of OBS when using Studio Mode.

The features are:
- A transition button button which can be assigned to perform any transition you have setup in OBS with a fixed time and without using hotkeys to accomplish this.

- A scene button with tally light for preview and program, that activated the scene in preview rather than in program as the in-built buttons do.

NOTE: This plugin requires [obs-websocket](https://github.com/Palakis/obs-websocket) to work.

KNOWN ISSUES:

1. Connection/reconnection isn't very intelligent at the moment this causes issues on Windows where it doesn't reconnect and on macOS that it disconnects randomly.

2. If you are not in studio mode the scene buttons don't work.

3. The Plugin Inspector (settings) are slow to load.
