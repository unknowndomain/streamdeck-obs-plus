const canvas = document.getElementById('canvas')

const ctx = canvas.getContext('2d')

	// Blue button
	ctx.fillStyle = '#00007f'
	ctx.fillRect(0, 0, 144, 144)
	const blueImg = canvas.toDataURL()

	// Black button
	ctx.fillStyle = '#000000'
	ctx.fillRect(0, 0, 144, 144)
	const blackImg = canvas.toDataURL()

	// Preview button
	ctx.fillStyle = '#00ff00'
	ctx.fillRect(0, 0, 144, 15)
	const previewImg = canvas.toDataURL()

	// Program button
	ctx.fillStyle = '#ff0000'
	ctx.fillRect(0, 0, 144, 15)
	const programImg = canvas.toDataURL()

	// Ready button
	ctx.fillStyle = '#3f3f3f'
	ctx.fillRect(0, 0, 144, 15)
	const readyImg = canvas.toDataURL()

	// Source Preview button
	ctx.fillStyle = '#00ff00'
	ctx.fillRect(0, 300, 144, 15)
	const srcpreviewImg = canvas.toDataURL()

	// Source Program button
	ctx.fillStyle = '#ff0000'
	ctx.fillRect(0, 300, 144, 15)
	const srcprogramImg = canvas.toDataURL()
