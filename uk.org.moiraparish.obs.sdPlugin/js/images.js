const canvas = document.getElementById('canvas')

const ctx = canvas.getContext('2d')

const rectangle_height = 15
const rectangle_width = 144
const rectangle_x = 0
const rectangle_y = 0
const src_rectangle_y = 129

// Blue button
ctx.fillStyle = '#00007f'
ctx.fillRect(rectangle_x, rectangle_y, rectangle_width, rectangle_width)
const blueImg = canvas.toDataURL()

// Black button
ctx.fillStyle = '#000000'
ctx.fillRect(rectangle_x, rectangle_y, rectangle_width, rectangle_height)
const blackImg = canvas.toDataURL()

// Preview button
ctx.fillStyle = '#00ff00'
ctx.fillRect(rectangle_x, rectangle_y, rectangle_width, rectangle_height)
const previewImg = canvas.toDataURL()

// Program button
ctx.fillStyle = '#ff0000'
ctx.fillRect(rectangle_x, rectangle_y, rectangle_width, rectangle_height)
const programImg = canvas.toDataURL()

// Ready button
ctx.fillStyle = '#3f3f3f'
ctx.fillRect(rectangle_x, rectangle_y, rectangle_width, rectangle_height)
const readyImg = canvas.toDataURL()

// Source Preview button
ctx.fillStyle = '#00ff00'
ctx.fillRect(rectangle_x, src_rectangle_y, rectangle_width, rectangle_height)
const srcpreviewImg = canvas.toDataURL()

// Source Program button
ctx.fillStyle = '#ff0000'
ctx.fillRect(rectangle_x, src_rectangle_y, rectangle_width, rectangle_height)
const srcprogramImg = canvas.toDataURL()

// Ready button
ctx.fillStyle = '#3f3f3f'
ctx.fillRect(rectangle_x, src_rectangle_y, rectangle_width, rectangle_height)
const srcreadyImg = canvas.toDataURL()

ctx.fillStyle = '#000000'
ctx.fillRect(rectangle_x, src_rectangle_y, rectangle_width, rectangle_height)
const srcblackImg = canvas.toDataURL()
