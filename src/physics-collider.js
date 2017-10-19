/* global AFRAME */
AFRAME.registerComponent('physics-collider', {
  schema: {
    ignoreSleep: {default: true},
    collisionPhysics: {default: false}
  },
  init: function () {
    this.collisions = new Set()
    this.currentCollisions = new Set()
    this.newCollisions = []
    this.clearedCollisions = []
    this.collisionEventDetails = {
      els: this.newCollisions,
      clearedEls: this.clearedCollisions
    }
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
    // https://github.com/donmccurdy/cannon.js/blob/022e8ba53fa83abf0ad8a0e4fd08623123838a17/src/world/World.js#L782
    this.el.body.sleepSpeedLimit = 0
    this.el.body.collisionResponse = this.data.collisionPhysics
    /* naiveBroadphase ignores collisions between sleeping & static bodies */
    this.el.body.type = this.data.ignoreSleep
    ? window.CANNON.Body.KINEMATIC
    : this.originalType
  },
  tick: function () {
    const body = this.el.body
    const currentCollisions = this.currentCollisions
    const collisions = this.collisions
    const newCollisions = this.newCollisions
    const clearedCollisions = this.clearedCollisions
    let target
    if (!body) return
    newCollisions.length = clearedCollisions.length = 0
    currentCollisions.clear()
    body.world.contacts.forEach((contact) => {
      if (contact.bi === body) {
        target = contact.bj.el
        currentCollisions.add(target)
        if (!collisions.has(target)) { newCollisions.push(target) }
      } else if (contact.bj === body) {
        target = contact.bi.el
        currentCollisions.add(target)
        if (!collisions.has(target)) { newCollisions.push(target) }
      }
    })
    for (let col of collisions) {
      if (!currentCollisions.has(col)) {
        clearedCollisions.push(col)
        collisions.delete(col)
      }
    }
    for (let col of newCollisions) {
      collisions.add(col)
    }
    if (newCollisions.length || clearedCollisions.length) {
      this.el.emit('collisions', this.collisionEventDetails)
    }
  }
})
