/* global AFRAME */
AFRAME.registerComponent('physics-collider', {
  schema: {
    collidedState: {default: 'collided'},
    ignoreSleep: {default: true},
    collisionPhysics: {default: false}
  },
  init: function () {
    this.collisions = []
  },
  update: function () {
    if (this.el.body) {
      this.updateBody()
    } else {
      this.el.addEventListener('body-loaded', this.updateBody.bind(this))
    }
  },
  updateBody: function () {
    if (this.originalType === undefined) {
      this.originalType = this.el.body.type
    }
    // ensure sleep doesn't disable collision detection
    this.el.body.allowSleep = false
    this.el.body.collisionResponse = this.data.collisionPhysics
    /* naiveBroadphase ignores collisions between static or kinematic bodies
    and sleeping bodies by default; disable this by assigning an
    invalid body type */
    this.el.body.type = this.data.ignoreSleep ? 0 : this.originalType
  },
  tick: function () {
    const collisions = []
    const colState = this.data.collidedState
    const el = this.el
    const body = el.body
    if (!body) return
    body.world.contacts.forEach((contact) => {
      if (contact.bi === body) {
        handleHit(contact.bj.el)
        collisions.push(contact.bj.el)
      } else if (contact.bj === body) {
        handleHit(contact.bi.el)
        collisions.push(contact.bi.el)
      }
    })
    // Update the state of the elements that are not intersected anymore.
    this.collisions.filter(function (el) {
      return collisions.indexOf(el) === -1
    }).forEach(el => {
      el.removeState(colState)
      this.el.emit('hitend', {el: el})
    })
    function handleHit (hitEl) {
      hitEl.addState(colState)
      el.emit('hit', {el: hitEl})
    }

    this.collisions = collisions
  }
})
