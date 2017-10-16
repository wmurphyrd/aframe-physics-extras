/* global assert, process, setup, suite */

const machinima = require('aframe-machinima-testing')

suite('machinima-testing example suite', function () {
  setup(function (done) {
    /* inject the scene html into the testing docoument */
    machinima.setupScene('scene.html')
    this.scene = document.querySelector('a-scene')
    this.scene.addEventListener('loaded', e => {
      done()
    })
  })
  // writing tests with the test wraper function:
  machinima.test(
    'aframe-physics-extras components', // test description
    'base/recordings/physics-extras.json', // path to recording file
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
