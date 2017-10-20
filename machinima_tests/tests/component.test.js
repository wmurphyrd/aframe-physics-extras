/* global assert, process, setup, suite */

const machinima = require('aframe-machinima-testing')

suite('basic example scene', function () {
  setup(function (done) {
    this.timeout(0)
    machinima.setupScene('scene.html')
    this.scene = document.querySelector('a-scene')
    this.scene.addEventListener('loaded', e => {
      done()
    })
  })
  machinima.test(
    'basic component function',
    'base/recordings/physics-extras.json',
    function () {
      const rh = document.getElementById('redHigh').getAttribute('position')
      const gh = document.getElementById('greenHigh').getAttribute('position')
      const gl = document.getElementById('greenLow').getAttribute('position')
      const bhb = document.getElementById('blueHigh').body
      assert.isBelow(rh.x, 0, 'Red upper moved left')
      assert.isAbove(rh.x, -2, 'Red upper slept')
      assert.deepEqual(gh, {x: -1, y: 1.6, z: -1}, 'Green/red collisions filtered')
      assert.isAbove(gl.x, 5, 'Green doesnt sleep')
      assert.isAbove(bhb.angularVelocity.length(), 5, 'Blue rotation not dampened')
      assert.isBelow(bhb.velocity.length(), 1, 'Blue translation is dampened')
    }
  )
})
suite('static body scene', function () {
  setup(function (done) {
    machinima.setupScene('static.html')
    this.scene = document.querySelector('a-scene')
    this.scene.addEventListener('loaded', e => {
      done()
    })
  })
  machinima.test(
    'physics-collider detects collisions with static bodies',
    'base/recordings/physics-extras.json',
    function () {
      const rh = document.getElementById('redHigh').getAttribute('material')
      const rl = document.getElementById('redLow').getAttribute('material')
      const gh = document.getElementById('greenHigh').getAttribute('material')
      const gl = document.getElementById('greenLow').getAttribute('material')
      const bh = document.getElementById('blueHigh').getAttribute('material')
      const bl = document.getElementById('blueLow').getAttribute('material')
      assert.isTrue(rh.transparent, 'red high clicked')
      assert.isTrue(rl.transparent, 'red low clicked')
      assert.isTrue(gl.transparent, 'green low clicked')
      assert.isTrue(bh.transparent, 'blue high clicked')
      assert.isFalse(bl.transparent, 'blue low not clicked')
      assert.isFalse(gh.transparent, 'green high not clicked')
    }
  )
})
