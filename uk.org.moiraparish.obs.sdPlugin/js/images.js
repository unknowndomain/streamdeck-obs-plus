const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

const max_rect_width = 144
const rectangle_line_width = 10
const rectangle_height = max_rect_width - (rectangle_line_width*1.5)
const rectangle_width = max_rect_width  - (rectangle_line_width*1.5)
const rectangle_x = 0 + (rectangle_line_width/2)
const rectangle_y = 0 + (rectangle_line_width/2)
const src_rectangle_y = max_rect_width - (rectangle_line_width)
const primed_x = 100
const primed_y = 40
const primed_radius = 10

const red = '#ff0000'
const green = '#00ff00'
const blue = '#00007f'
const grey = '#3f3f3f'
const black = '#000000'


