/* global assert, process, setup, suite, test */

const helpers = require('../helpers')
const entityFactory = helpers.entityFactory

suite('collision-filter', function () {
  setup(function (done) {
    var el = this.el = entityFactory()
    el.body = {el: el}
    this.scene = el.sceneEl
    this.el.setAttribute('collision-filter', '')
    this.target1 = document.createElement('a-entity')
    this.scene.appendChild(this.target1)
    this.target1.setAttribute('collision-filter', '')
    this.target2 = document.createElement('a-entity')
    this.scene.appendChild(this.target2)
    this.target2.setAttribute('collision-filter', '')
    this.scene.addEventListener('loaded', () => {
      this.comp = this.el.components['collision-filter']
      this.system = this.comp.system
      done()
    })
  })
  suite('lifecyle', function () {
    test('component attaches and removes without errors', function (done) {
      this.el.removeAttribute('collision-filter')
      process.nextTick(done)
    })
  })
  suite('filter codes', function () {
    test('returns unique bit code for each group', function () {
      assert.strictEqual(this.system.getFilterCode('default'), 1)
      this.el.setAttribute('collision-filter', {group: 'group1'})
      this.el.setAttribute('collision-filter', {
        group: 'group1',
        collidesWith: ['group2', 'group3']
      })
      assert.strictEqual(this.system.getFilterCode('group1'), 2)
      assert.strictEqual(this.system.getFilterCode('group2'), 4)
      assert.strictEqual(this.system.getFilterCode('group3'), 8)
    })
    test('adds filter codes', function () {
      this.el.setAttribute('collision-filter', {
        collidesWith: ['group1', 'group2']
      })
      assert.strictEqual(this.system.getFilterCode(['group1', 'group2']), 6)
      assert.strictEqual(this.system.getFilterCode(['default', 'group2']), 5)
    })
    test('sets filter masks on body', function () {
      this.el.setAttribute('collision-filter', {group: 'group1'})
      this.el.body = {}
      this.el.emit('body-loaded')
      assert.strictEqual(this.el.body.collisionFilterGroup, 2)
      this.el.setAttribute('collision-filter', {
        collidesWith: ['group2', 'group3']
      })
      assert.strictEqual(this.el.body.collisionFilterMask, 12)
    })
  })
  suite('settings', function () {
    test('collisionForces can be disabled', function () {
      assert.isTrue(this.el.body.collisionResponse)
      this.el.setAttribute('collision-filter', {collisionForces: false})
      assert.isFalse(this.el.body.collisionResponse)
    })
  })
})
