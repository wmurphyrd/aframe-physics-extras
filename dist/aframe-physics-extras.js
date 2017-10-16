(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

/* global AFRAME */

if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

require('./src/physics-collider.js');
require('./src/physics-collision-filter.js');
require('./src/physics-sleepy.js');

},{"./src/physics-collider.js":2,"./src/physics-collision-filter.js":3,"./src/physics-sleepy.js":4}],2:[function(require,module,exports){
'use strict';

/* global AFRAME */
AFRAME.registerComponent('physics-collider', {
  schema: {
    ignoreSleep: { default: true },
    collisionPhysics: { default: false }
  },
  init: function () {
    this.collisions = new Set();
    this.currentCollisions = new Set();
    this.newCollisions = [];
    this.clearedCollisions = [];
    this.collisionEventDetails = {
      els: this.newCollisions,
      clearedEls: this.clearedCollisions
    };
  },
  update: function () {
    if (this.el.body) {
      this.updateBody();
    } else {
      this.el.addEventListener('body-loaded', this.updateBody.bind(this));
    }
  },
  updateBody: function () {
    if (this.originalType === undefined) {
      this.originalType = this.el.body.type;
    }
    // ensure sleep doesn't disable collision detection
    this.el.body.allowSleep = false;
    this.el.body.collisionResponse = this.data.collisionPhysics;
    /* naiveBroadphase ignores collisions between static bodies */
    this.el.body.type = this.data.ignoreSleep ? window.CANNON.Body.KINEMATIC : this.originalType;
  },
  tick: function () {
    const body = this.el.body;
    const currentCollisions = this.currentCollisions;
    const collisions = this.collisions;
    const newCollisions = this.newCollisions;
    const clearedCollisions = this.clearedCollisions;
    let target;
    if (!body) return;
    newCollisions.length = clearedCollisions.length = 0;
    currentCollisions.clear();
    body.world.contacts.forEach(contact => {
      if (contact.bi === body) {
        target = contact.bj.el;
        currentCollisions.add(target);
        if (!collisions.has(target)) {
          newCollisions.push(target);
        }
      } else if (contact.bj === body) {
        target = contact.bi.el;
        currentCollisions.add(target);
        if (!collisions.has(target)) {
          newCollisions.push(target);
        }
      }
    });
    for (let col of collisions) {
      if (!currentCollisions.has(col)) {
        clearedCollisions.push(col);
        collisions.delete(col);
      }
    }
    for (let col of newCollisions) {
      collisions.add(col);
    }
    if (newCollisions.length || clearedCollisions.length) {
      this.el.emit('collisions', this.collisionEventDetails);
    }
  }
});

},{}],3:[function(require,module,exports){
'use strict';

/* global AFRAME */
AFRAME.registerComponent('collision-filter', {
  schema: {
    group: { default: 'default' },
    collidesWith: { default: ['default'] }
  },
  init: function () {
    this.updateBodyBound = this.updateBody.bind(this);
    this.system.registerMe(this);
    this.el.addEventListener('body-loaded', this.updateBodyBound);
  },
  update: function () {
    // register any new groups
    this.system.registerMe(this);
    if (this.el.body) {
      this.updateBody();
    }
  },
  remove: function () {
    this.el.removeEventListener('body-loaded', this.updateBodyBound);
  },
  updateBody: function () {
    this.el.body.collisionFilterMask = this.system.getFilterCode(this.data.collidesWith);
    this.el.body.collisionFilterGroup = this.system.getFilterCode(this.data.group);
  }
});

AFRAME.registerSystem('collision-filter', {
  schema: {
    collisionGroups: { default: ['default'] }
  },
  dependencies: ['physics'],
  init: function () {
    this.maxGroups = Math.log2(Number.MAX_SAFE_INTEGER);
  },
  registerMe: function (comp) {
    // add any unknown groups to the master list
    const newGroups = [comp.data.group, ...comp.data.collidesWith].filter(group => this.data.collisionGroups.indexOf(group) === -1);
    this.data.collisionGroups.push(...newGroups);
    if (this.data.collisionGroups.length > this.maxGroups) {
      throw new Error('Too many collision groups');
    }
  },
  getFilterCode: function (elGroups) {
    let code = 0;
    if (!Array.isArray(elGroups)) {
      elGroups = [elGroups];
    }
    // each group corresponds to a bit which is turned on when matched
    // floor negates any unmatched groups (2^-1 = 0.5)
    elGroups.forEach(group => {
      code += Math.floor(Math.pow(2, this.data.collisionGroups.indexOf(group)));
    });
    return code;
  }
});

},{}],4:[function(require,module,exports){
'use strict';

// Make dynamic bodies idle when not grabbed
/* global AFRAME */
AFRAME.registerComponent('sleepy', {
  schema: {
    allowSleep: { default: true },
    speedLimit: { default: 0.25, type: 'number' },
    delay: { default: 0.25, type: 'number' },
    linearDamping: { default: 0.99, type: 'number' },
    angularDamping: { default: 0.99, type: 'number' },
    holdState: { default: 'grabbed' }
  },
  init: function () {
    this.updateBodyBound = this.updateBody.bind(this);
    this.holdStateBound = this.holdState.bind(this);
    this.resumeStateBound = this.resumeState.bind(this);

    this.el.addEventListener('body-loaded', this.updateBodyBound);

    if (this.el.body) {
      this.initBody();
    }
  },
  update: function () {
    if (this.el.body) {
      this.updateBody();
    }
  },
  remove: function () {
    this.el.removeEventListener('body-loaded', this.updateBodyBound);
    this.el.removeEventListener('stateadded', this.holdStateBound);
    this.el.removeEventListener('stateremoved', this.resumeStateBound);
  },
  updateBody: function () {
    this.el.body.world.allowSleep = true;
    this.el.body.allowSleep = this.data.allowSleep;
    this.el.body.sleepSpeedLimit = this.data.speedLimit;
    this.el.body.sleepTimeLimit = this.data.delay;
    this.el.body.linearDamping = this.data.linearDamping;
    this.el.body.angularDamping = this.data.angularDamping;
    if (this.data.allowSleep) {
      this.el.addEventListener('stateadded', this.holdStateBound);
      this.el.addEventListener('stateremoved', this.resumeStateBound);
    } else {
      this.el.removeEventListener('stateadded', this.holdStateBound);
      this.el.removeEventListener('stateremoved', this.resumeStateBound);
    }
  },
  // disble the sleeping during interactions because sleep will break constraints
  holdState: function (evt) {
    if (evt.detail.state === this.data.holdState) {
      this.el.body.allowSleep = false;
    }
  },
  resumeState: function (evt) {
    if (evt.detail.state === this.data.holdState) {
      this.el.body.allowSleep = this.data.allowSleep;
    }
  }

});

},{}]},{},[1]);
