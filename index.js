/* global AFRAME */

if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.')
}

require('./src/aframe-physics-collider.js')
require('./src/aframe-physics-collision-filter.js')
require('./src/aframe-physics-sleepy.js')
