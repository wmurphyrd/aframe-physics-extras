/* global assert, process, setup, suite, test */

const helpers = require('../helpers')
const entityFactory = helpers.entityFactory

suite('physics-collider', function () {
  setup(function (done) {
    var el = this.el = entityFactory()
    el.body = {el: el}
    this.scene = el.sceneEl
    this.el.setAttribute('physics-collider', '')
    this.target1 = document.createElement('a-entity')
    this.scene.appendChild(this.target1)
    this.target2 = document.createElement('a-entity')
    this.scene.appendChild(this.target2)
    this.el.addEventListener('loaded', () => {
      this.comp = this.el.components['physics-collider']
      done()
    })
  })
  suite('lifecyle', function () {
    test('component attaches and removes without errors', function (done) {
      this.el.removeAttribute('physics-collider')
      process.nextTick(done)
    })
  })
  suite('collisions', function () {
    test('finds collided entities in contacts array', function () {
      const hitSpy = this.sinon.spy()
      this.el.addEventListener('collisions', hitSpy)
      this.el.body.world = {contacts: [
        {bi: this.el.body, bj: {el: this.target1}},
        {bi: {el: this.target2}, bj: this.el.body}
      ]}
      this.comp.tick()
      assert.isTrue(
        hitSpy.calledWithMatch({detail: {els: [this.target1, this.target2]}}),
        'finds new collisions'
      )
      this.comp.tick()
      assert.strictEqual(this.comp.collisions.size, 2, 'ignores duplicates')
      this.el.body.world.contacts = [{bi: this.el.body, bj: {el: this.target1}}]
      this.comp.tick()
      assert.isTrue(
        hitSpy.calledWithMatch({detail: {els: [], clearedEls: [this.target2]}}),
        'clears old collisions and ignores duplicates'
      )
      assert.strictEqual(this.comp.collisions.size, 1, 'keeps ongoing collisions')
      assert.isTrue(this.comp.collisions.has(this.target1), 'keeps ongoing collisions')
    })
  })
})
