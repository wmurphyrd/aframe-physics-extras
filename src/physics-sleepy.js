// Make dynamic bodies idle when not grabbed
/* global AFRAME */
AFRAME.registerComponent('sleepy', {
  schema: {
    allowSleep: {default: true},
    speedLimit: {default: 0.25, type: 'number'},
    delay: {default: 0.25, type: 'number'},
    linearDamping: {default: 0.99, type: 'number'},
    angularDamping: {default: 0.99, type: 'number'},
    holdState: {default: 'grabbed'}
  },
  init: function () {
    this.updateBodyBound = this.updateBody.bind(this)
    this.holdStateBound = this.holdState.bind(this)
    this.resumeStateBound = this.resumeState.bind(this)

    this.el.addEventListener('body-loaded', this.updateBodyBound)
  },
  update: function () {
    if (this.el.body) {
      this.updateBody()
    }
  },
  remove: function () {
    this.el.removeEventListener('body-loaded', this.updateBodyBound)
    this.el.removeEventListener('stateadded', this.holdStateBound)
    this.el.removeEventListener('stateremoved', this.resumeStateBound)
  },
  updateBody: function (evt) {
    // ignore bubbled 'body-loaded' events
    if (evt !== undefined && evt.target !== this.el) { return }
    this.el.body.world.allowSleep = true
    this.el.body.allowSleep = this.data.allowSleep
    this.el.body.sleepSpeedLimit = this.data.speedLimit
    this.el.body.sleepTimeLimit = this.data.delay
    this.el.body.linearDamping = this.data.linearDamping
    this.el.body.angularDamping = this.data.angularDamping
    if (this.data.allowSleep) {
      this.el.addEventListener('stateadded', this.holdStateBound)
      this.el.addEventListener('stateremoved', this.resumeStateBound)
    } else {
      this.el.removeEventListener('stateadded', this.holdStateBound)
      this.el.removeEventListener('stateremoved', this.resumeStateBound)
    }
  },
  // disble the sleeping during interactions because sleep will break constraints
  holdState: function (evt) {
    if (evt.detail.state === this.data.holdState) {
      this.el.body.allowSleep = false
    }
  },
  resumeState: function (evt) {
    if (evt.detail.state === this.data.holdState) {
      this.el.body.allowSleep = this.data.allowSleep
    }
  }

})
