(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

/* global AFRAME */

if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

require('./src/physics-collider.js');
require('./src/physics-collision-filter.js');
require('./src/physics-sleepy.js');
require('./src/body-merger.js');

},{"./src/body-merger.js":2,"./src/physics-collider.js":3,"./src/physics-collision-filter.js":4,"./src/physics-sleepy.js":5}],2:[function(require,module,exports){
'use strict';

/* global AFRAME, THREE, CANNON */
AFRAME.registerComponent('body-merger', {
  schema: { default: 'static-body' },
  init: function () {
    const doMerge = evt => {
      if (evt.target === this.el) {
        this.el.removeEventListener('body-loaded', doMerge);
        this.merge();
      }
    };
    if (this.el.body) {
      this.merge();
    } else {
      this.el.addEventListener('body-loaded', doMerge);
    }
  },
  merge: function () {
    const body = this.el.body;
    const tmpMat = new THREE.Matrix4();
    const tmpQuat = new THREE.Quaternion();
    const tmpPos = new THREE.Vector3();
    const tmpScale = new THREE.Vector3(1, 1, 1); // todo: apply worldScale
    const offset = new CANNON.Vec3();
    const orientation = new CANNON.Quaternion();
    for (let child of this.el.childNodes) {
      if (!child.body || !child.getAttribute(this.data)) {
        continue;
      }
      child.object3D.updateMatrix();
      while (child.body.shapes.length) {
        tmpPos.copy(child.body.shapeOffsets.pop());
        tmpQuat.copy(child.body.shapeOrientations.pop());
        tmpMat.compose(tmpPos, tmpQuat, tmpScale);
        tmpMat.multiply(child.object3D.matrix);
        tmpMat.decompose(tmpPos, tmpQuat, tmpScale);
        offset.copy(tmpPos);
        orientation.copy(tmpQuat);
        body.addShape(child.body.shapes.pop(), offset, orientation);
      }
      child.removeAttribute(this.data);
    }
  }
});

},{}],3:[function(require,module,exports){
'use strict';

/* global AFRAME */
AFRAME.registerComponent('physics-collider', {
  schema: {
    ignoreSleep: { default: true }
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
      this.el.addEventListener('body-loaded', this.updateBody.bind(this), { once: true });
    }
  },
  tick: function () {
    const uppperMask = 0xFFFF0000;
    const lowerMask = 0x0000FFFF;
    return function () {
      if (!this.el.body) return;
      const currentCollisions = this.currentCollisions;
      const thisBodyId = this.el.body.id;
      const worldCollisions = this.el.body.world.bodyOverlapKeeper.current;
      const worldBodyMap = this.el.body.world.idToBodyMap;
      const collisions = this.collisions;
      const newCollisions = this.newCollisions;
      const clearedCollisions = this.clearedCollisions;
      let i = 0;
      let upperId = (worldCollisions[i] & uppperMask) >> 16;
      let target;
      newCollisions.length = clearedCollisions.length = 0;
      currentCollisions.clear();
      while (i < worldCollisions.length && upperId < thisBodyId) {
        if (worldBodyMap[upperId]) {
          target = worldBodyMap[upperId].el;
          if ((worldCollisions[i] & lowerMask) === thisBodyId) {
            currentCollisions.add(target);
            if (!collisions.has(target)) {
              newCollisions.push(target);
            }
          }
        }
        upperId = (worldCollisions[++i] & uppperMask) >> 16;
      }
      while (i < worldCollisions.length && upperId === thisBodyId) {
        if (worldBodyMap[worldCollisions[i] & lowerMask]) {
          target = worldBodyMap[worldCollisions[i] & lowerMask].el;
          currentCollisions.add(target);
          if (!collisions.has(target)) {
            newCollisions.push(target);
          }
        }
        upperId = (worldCollisions[++i] & uppperMask) >> 16;
      }

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
    };
  }(),
  remove: function () {
    if (this.originalSleepConfig) {
      AFRAME.utils.extend(this.el.body, this.originalSleepConfig);
    }
  },
  updateBody: function (evt) {
    // ignore bubbled 'body-loaded' events
    if (evt !== undefined && evt.target !== this.el) {
      return;
    }
    if (this.data.ignoreSleep) {
      // ensure sleep doesn't disable collision detection
      this.el.body.allowSleep = false;
      /* naiveBroadphase ignores collisions between sleeping & static bodies */
      this.el.body.type = window.CANNON.Body.KINEMATIC;
      // Kinematics must have velocity >= their sleep limit to wake others
      this.el.body.sleepSpeedLimit = 0;
    } else if (this.originalSleepConfig === undefined) {
      this.originalSleepConfig = {
        allowSleep: this.el.body.allowSleep,
        sleepSpeedLimit: this.el.body.sleepSpeedLimit,
        type: this.el.body.type
      };
    } else {
      // restore original settings
      AFRAME.utils.extend(this.el.body, this.originalSleepConfig);
    }
  }
});

},{}],4:[function(require,module,exports){
'use strict';

/* global AFRAME */
AFRAME.registerComponent('collision-filter', {
  schema: {
    group: { default: 'default' },
    collidesWith: { default: ['default'] },
    collisionForces: { default: true }
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
  updateBody: function (evt) {
    // ignore bubbled 'body-loaded' events
    if (evt !== undefined && evt.target !== this.el) {
      return;
    }
    this.el.body.collisionFilterMask = this.system.getFilterCode(this.data.collidesWith);
    this.el.body.collisionFilterGroup = this.system.getFilterCode(this.data.group);
    this.el.body.collisionResponse = this.data.collisionForces;
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

},{}],5:[function(require,module,exports){
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
  updateBody: function (evt) {
    // ignore bubbled 'body-loaded' events
    if (evt !== undefined && evt.target !== this.el) {
      return;
    }
    if (this.data.allowSleep) {
      // only "local" driver compatable
      try {
        this.el.body.world.allowSleep = true;
      } catch (err) {
        console.error('Unable to activate sleep in physics.' + '`sleepy` requires "local" physics driver');
      }
    }
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
    let state = this.data.holdState;
    // api change in A-Frame v0.8.0
    if (evt.detail === state || evt.detail.state === state) {
      this.el.body.allowSleep = false;
    }
  },
  resumeState: function (evt) {
    let state = this.data.holdState;
    if (evt.detail === state || evt.detail.state === state) {
      this.el.body.allowSleep = this.data.allowSleep;
    }
  }

});

},{}]},{},[1]);
