var _currentPlugin
var obsScenes
var currentScene

function connectElgatoStreamDeckSocket(port, uuid, registerEvent, info, action) {
	data = JSON.parse(action)
	currentScene = data.payload.settings.scene
	_currentPlugin = {
		action: data.action,
		context: uuid
	}
	StreamDeck.debug = true
	StreamDeck._ws = new WebSocket("ws://localhost:" + port)
	StreamDeck._ws.onopen = () => {
		StreamDeck._openHandler(registerEvent, uuid)
	}
	StreamDeck._ws.onmessage = (e) => {
		var data = JSON.parse(e.data)
		switch(data.event) {
			case 'sendToPropertyInspector':
				if (data.payload.scenes) {
					obsScenes = data.payload.scenes
					updateSceneUI()
				}
				break
			default:
				console.log(data)
				break
		}
	}
}

function updateSceneUI() {
	document.getElementById('scenes').innerText = ''
	document.getElementById('scenes').onchange = updateSettings
	createScene('')
	obsScenes.forEach((scene) => {
		createScene(scene)
	})
	document.getElementById('scenes').value = currentScene
}

function createScene(scene) {
	var option = document.createElement('option')
	option.innerText = scene
	document.getElementById('scenes').appendChild(option)
}

function updateSettings() {
	StreamDeck.setSettings(_currentPlugin.context, {
		scene: document.getElementById('scenes').value
	})
	currentScene = document.getElementById('scenes').value
}
