let _currentPlugin
let obsScenes
let currentScene

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
		StreamDeck.getGlobalSettings(_currentPlugin.context)
	}
	StreamDeck._ws.onmessage = (e) => {
		const data = JSON.parse(e.data)
		switch(data.event) {
			case 'sendToPropertyInspector':
				if (data.payload.scenes) {
					if (data.payload.settings) updateSettingsUI(data)
					obsScenes = data.payload.scenes
					updateSceneUI()
				}
				break
			case 'didReceiveGlobalSettings':
				updateSettingsUI(data)
				break
			default:
				// console.log(data)
				break
		}
	}
}

function updateSettingsUI(data) {
	if (data.payload.settings && Object.keys(data.payload.settings).length > 0) {
		document.getElementById('host').value = data.payload.settings.host
		document.getElementById('port').value = data.payload.settings.port
		document.getElementById('password').value = data.payload.settings.password ? 'password' : ''
	}
}

function updateGlobalSettings() {
	let settings = {
		host: document.getElementById('host').value,
		port: document.getElementById('port').value
	}
	if (document.getElementById('password').value != 'password') settings.password = document.getElementById('password').value
	StreamDeck.setGlobalSettings(_currentPlugin.context, settings)
	StreamDeck.sendToPlugin(_currentPlugin.context, _currentPlugin.action, {updateGlobalSettings: true})
}

function updateSceneUI() {
	document.getElementById('scenes').innerText = ''
	createScene('')
	obsScenes.forEach((scene) => {
		createScene(scene)
	})
	document.getElementById('scenes').value = currentScene
}

function createScene(scene) {
	const option = document.createElement('option')
	option.innerText = scene
	document.getElementById('scenes').appendChild(option)
}

function updateSettings() {
	StreamDeck.setSettings(_currentPlugin.context, {
		scene: document.getElementById('scenes').value
	})
	currentScene = document.getElementById('scenes').value
}

document.getElementById('host').onchange = updateGlobalSettings
document.getElementById('port').onchange = updateGlobalSettings
document.getElementById('password').onchange = updateGlobalSettings
document.getElementById('scenes').onchange = updateSettings
