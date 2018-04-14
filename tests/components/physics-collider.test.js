/* global assert, process, setup, suite, test */

const helpers = require('../helpers')
const entityFactory = helpers.entityFactory

suite('physics-collider', function () {
  setup(function (done) {
    var el = this.el = entityFactory()
    window.CANNON = {Body: {KINEMATIC: 4}}
    el.body = {el: el, id: 2}
    this.scene = el.sceneEl
    this.el.setAttribute('physics-collider', '')
    this.target1 = document.createElement('a-entity')
    this.scene.appendChild(this.target1)
    this.target1.body = {el: this.target1, id: 1}
    this.target2 = document.createElement('a-entity')
    this.scene.appendChild(this.target2)
    this.target2.body = {el: this.target2, id: 3}
    this.scene.addEventListener('loaded', () => {
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
      this.el.body.world = {
        bodyOverlapKeeper: {current: [
          (this.target1.body.id << 16) + this.el.body.id,
          (this.el.body.id << 16) + this.target2.body.id
        ]},
        idToBodyMap: [undefined, this.target1.body, this.el.body, this.target2.body]
      }
      this.comp.tick()
      assert.isTrue(
        hitSpy.calledWithMatch({detail: {els: [this.target1, this.target2]}}),
        'finds new collisions'
      )
      this.comp.tick()
      assert.strictEqual(this.comp.collisions.size, 2, 'ignores duplicates')
      this.el.body.world.bodyOverlapKeeper.current.pop()
      this.comp.tick()
      assert.isTrue(
        hitSpy.calledWithMatch({detail: {els: [], clearedEls: [this.target2]}}),
        'clears old collisions and ignores duplicates'
      )
      assert.strictEqual(this.comp.collisions.size, 1, 'keeps ongoing collisions')
      assert.isTrue(this.comp.collisions.has(this.target1), 'keeps ongoing collisions')
    })
    test('Handles bodies removed while collided', function () {
      this.el.body.world = {
        bodyOverlapKeeper: {current: [
          (this.target1.body.id << 16) + this.el.body.id,
          (this.el.body.id << 16) + this.target2.body.id
        ]},
        idToBodyMap: [undefined, this.target1.body, this.el.body, this.target2.body]
      }
      this.comp.tick()
      this.el.body.world.idToBodyMap[3] = undefined
      this.comp.tick()
      assert.isFalse(this.comp.collisions.has(this.target2), 'lower loop')
      this.el.body.world.idToBodyMap[1] = undefined
      this.comp.tick()
      assert.isFalse(this.comp.collisions.has(this.target1), 'upper loop')
    })
  })
})
