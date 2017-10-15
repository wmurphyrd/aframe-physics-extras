// Make dynamic bodies idle when not grabbed
/* global AFRAME */
AFRAME.registerComponent('sleepy', {
  schema: {
    speedLimit: {default: 0.25, type: 'number'},
    delay: {default: 0.25, type: 'number'},
    linearDamping: {default: 0.99, type: 'number'},
    angularDamping: {default: 0.99, type: 'number'},
    holdState: {default: 'grabbed'}
  },
  init: function () {
    this.initBodyBound = this.initBody.bind(this)
    this.holdStateBound = this.holdState.bind(this)
    this.resumeStateBound = this.resumeState.bind(this)

    this.el.addEventListener('body-loaded', this.initBodyBound)
    this.el.addEventListener('stateadded', this.holdStateBound)
    this.el.addEventListener('stateremoved', this.resumeStateBound)

    if (this.el.body) {
      this.initBody()
    }
  },
  update: function () {
    if (this.el.body) { this.updateBody() }
  },
  remove: function () {
    this.el.removeEventListener('body-loaded', this.initBodyBound)
    this.el.removeEventListener('stateadded', this.holdStateBound)
    this.el.removeEventListener('stateremoved', this.resumeStateBound)
  },
  initBody: function () {
    this.el.sceneEl.systems.physics.world.allowSleep = true
    this.updateBody()
    this.resumeState({detail: {state: this.data.holdState}})
  },
  updateBody: function () {
    this.el.body.sleepSpeedLimit = this.data.speedLimit
    this.el.body.sleepTimeLimit = this.data.delay
    this.el.body.linearDamping = this.data.linearDamping
    this.el.body.angularDamping = this.data.angularDamping
  },
  // disble the sleeping during interactions because sleep will break constraints
  holdState: function (evt) {
    if (evt.detail.state === this.data.holdState) {
      this.el.body.allowSleep = false
    }
  },
  resumeState: function (evt) {
    if (evt.detail.state === this.data.holdState) {
      this.el.body.allowSleep = true
    }
  }

})
