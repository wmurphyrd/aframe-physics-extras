/* global AFRAME */
AFRAME.registerComponent('collision-filter', {
  schema: {
    group: {default: 'default'},
    collidesWith: {default: ['default']},
    collisionForces: {default: true}
  },
  init: function () {
    this.updateBodyBound = this.updateBody.bind(this)
    this.system.registerMe(this)
    this.el.addEventListener('body-loaded', this.updateBodyBound)
  },
  update: function () {
    // register any new groups
    this.system.registerMe(this)
    if (this.el.body) {
      this.updateBody()
    }
  },
  remove: function () {
    this.el.removeEventListener('body-loaded', this.updateBodyBound)
  },
  updateBody: function (evt) {
    // ignore bubbled 'body-loaded' events
    if (evt !== undefined && evt.target !== this.el) { return }
    this.el.body.collisionFilterMask =
      this.system.getFilterCode(this.data.collidesWith)
    this.el.body.collisionFilterGroup =
      this.system.getFilterCode(this.data.group)
    this.el.body.collisionResponse = this.data.collisionForces
  }
})

AFRAME.registerSystem('collision-filter', {
  schema: {
    collisionGroups: {default: ['default']}
  },
  dependencies: ['physics'],
  init: function () {
    this.maxGroups = Math.log2(Number.MAX_SAFE_INTEGER)
  },
  registerMe: function (comp) {
    // add any unknown groups to the master list
    const newGroups = [comp.data.group, ...comp.data.collidesWith]
        .filter(group => this.data.collisionGroups.indexOf(group) === -1)
    this.data.collisionGroups.push(...newGroups)
    if (this.data.collisionGroups.length > this.maxGroups) {
      throw new Error('Too many collision groups')
    }
  },
  getFilterCode: function (elGroups) {
    let code = 0
    if (!Array.isArray(elGroups)) { elGroups = [elGroups] }
    // each group corresponds to a bit which is turned on when matched
    // floor negates any unmatched groups (2^-1 = 0.5)
    elGroups.forEach(group => {
      code += Math.floor(Math.pow(2, this.data.collisionGroups.indexOf(group)))
    })
    return code
  }
})
