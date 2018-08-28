/* global AFRAME */
AFRAME.registerComponent('physics-collider', {
  schema: {
    ignoreSleep: {default: true}
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
      this.el.addEventListener(
        'body-loaded',
        this.updateBody.bind(this),
        { once: true }
      )
    }
  },
  tick: (function () {
    const uppperMask = 0xFFFF0000
    const lowerMask = 0x0000FFFF
    return function () {
      if (!(this.el.body && this.el.body.world)) return
      const currentCollisions = this.currentCollisions
      const thisBodyId = this.el.body.id
      const worldCollisions = this.el.body.world.bodyOverlapKeeper.current
      const worldBodyMap = this.el.body.world.idToBodyMap
      const collisions = this.collisions
      const newCollisions = this.newCollisions
      const clearedCollisions = this.clearedCollisions
      let i = 0
      let upperId = (worldCollisions[i] & uppperMask) >> 16
      let target
      newCollisions.length = clearedCollisions.length = 0
      currentCollisions.clear()
      while (i < worldCollisions.length && upperId < thisBodyId) {
        if (worldBodyMap[upperId]) {
          target = worldBodyMap[upperId].el
          if ((worldCollisions[i] & lowerMask) === thisBodyId) {
            currentCollisions.add(target)
            if (!collisions.has(target)) { newCollisions.push(target) }
          }
        }
        upperId = (worldCollisions[++i] & uppperMask) >> 16
      }
      while (i < worldCollisions.length && upperId === thisBodyId) {
        if (worldBodyMap[worldCollisions[i] & lowerMask]) {
          target = worldBodyMap[worldCollisions[i] & lowerMask].el
          currentCollisions.add(target)
          if (!collisions.has(target)) { newCollisions.push(target) }
        }
        upperId = (worldCollisions[++i] & uppperMask) >> 16
      }

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
  })(),
  remove: function () {
    if (this.originalSleepConfig) {
      AFRAME.utils.extend(this.el.body, this.originalSleepConfig)
    }
  },
  updateBody: function (evt) {
    // ignore bubbled 'body-loaded' events
    if (evt !== undefined && evt.target !== this.el) { return }
    if (this.data.ignoreSleep) {
      // ensure sleep doesn't disable collision detection
      this.el.body.allowSleep = false
      /* naiveBroadphase ignores collisions between sleeping & static bodies */
      this.el.body.type = window.CANNON.Body.KINEMATIC
      // Kinematics must have velocity >= their sleep limit to wake others
      this.el.body.sleepSpeedLimit = 0
    } else if (this.originalSleepConfig === undefined) {
      this.originalSleepConfig = {
        allowSleep: this.el.body.allowSleep,
        sleepSpeedLimit: this.el.body.sleepSpeedLimit,
        type: this.el.body.type
      }
    } else {
      // restore original settings
      AFRAME.utils.extend(this.el.body, this.originalSleepConfig)
    }
  }
})
