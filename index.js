/* global AFRAME */

if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.')
}

require('./src/physics-collider.js')
require('./src/physics-collision-filter.js')
require('./src/physics-sleepy.js')
require('./src/body-merger.js')
