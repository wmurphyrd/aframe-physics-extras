/* global assert, process, setup, suite, test */

const helpers = require('../helpers')
const entityFactory = helpers.entityFactory

suite('sleepy', function () {
  setup(function (done) {
    var el = this.el = entityFactory()
    this.scene = el.sceneEl
    this.el.setAttribute('sleepy', '')
    this.scene.addEventListener('loaded', () => {
      this.comp = this.el.components['sleepy']
      done()
    })
  })
  suite('lifecyle', function () {
    test('component attaches and removes without errors', function (done) {
      this.el.removeAttribute('sleepy')
      process.nextTick(done)
    })
  })
  suite('applies settings', function () {
    test('initial settings applied to body loaded later', function () {
      this.el.body = {world: {}}
      this.el.emit('body-loaded')
      assert.isTrue(this.el.body.allowSleep)
      assert.isTrue(this.el.body.world.allowSleep)
      assert.strictEqual(this.el.body.sleepSpeedLimit, 0.25)
      assert.strictEqual(this.el.body.sleepTimeLimit, 0.25)
      assert.strictEqual(this.el.body.linearDamping, 0.99)
      assert.strictEqual(this.el.body.angularDamping, 0.99)
    })
    test('updates applied to existing body', function () {
      this.el.body = {world: {}}
      this.el.setAttribute('sleepy', {
        allowSleep: false,
        speedLimit: 1,
        delay: 1,
        linearDamping: 0,
        angularDamping: 0
      })
      assert.strictEqual(this.el.body.sleepSpeedLimit, 1)
      assert.strictEqual(this.el.body.sleepTimeLimit, 1)
      assert.strictEqual(this.el.body.linearDamping, 0)
      assert.strictEqual(this.el.body.angularDamping, 0)
      assert.isFalse(this.el.body.allowSleep)
    })
  })
  suite('hold state', function () {
    test('turns sleep on and off with grabbed state', function () {
      this.el.body = {world: {}}
      this.el.emit('body-loaded')
      assert.isTrue(this.el.body.allowSleep)
      this.el.emit('stateadded', {state: 'grabbed'})
      assert.isFalse(this.el.body.allowSleep)
      this.el.emit('stateremoved', {state: 'grabbed'})
      assert.isTrue(this.el.body.allowSleep)
    })
  })
})
