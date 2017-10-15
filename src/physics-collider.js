/* global AFRAME */
AFRAME.registerComponent('physics-collider', {
  schema: {
    ignoreSleep: {default: true},
    collisionPhysics: {default: false}
  },
  init: function () {
    this.collisions = []
    this.newCollisions = new Set()
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
    const el = this.el
    const body = el.body
    const newCollisions = this.newCollisions
    const collisions = this.collisions
    if (!body) return
    newCollisions.clear()
    body.world.contacts.forEach((contact) => {
      if (contact.bi === body) {
        newCollisions.add(contact.bj.el)
      } else if (contact.bj === body) {
        newCollisions.add(contact.bi.el)
      }
    })
    // Update the state of the elements that are not intersected anymore.
    let lostCollisions = collisions.filter(el => {
      return !newCollisions.has(el)
    })
    collisions.length = 0
    collisions.push(...newCollisions)
    this.el.emit('collisions', {els: collisions, clearedEls: lostCollisions})
  }
})
