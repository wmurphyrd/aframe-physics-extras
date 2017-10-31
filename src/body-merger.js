/* global AFRAME, THREE, CANNON */
AFRAME.registerComponent('body-merger', {
  schema: {default: 'static-body'},
  init: function () {
    const doMerge = evt => {
      if (evt.target === this.el) {
        this.el.removeEventListener('body-loaded', doMerge)
        this.merge()
      }
    }
    if (this.el.body) {
      this.merge()
    } else {
      this.el.addEventListener('body-loaded', doMerge)
    }
  },
  merge: function () {
    const body = this.el.body
    const tmpMat = new THREE.Matrix4()
    const tmpQuat = new THREE.Quaternion()
    const tmpPos = new THREE.Vector3()
    const tmpScale = new THREE.Vector3(1, 1, 1) // todo: apply worldScale
    const offset = new CANNON.Vec3()
    const orientation = new CANNON.Quaternion()
    for (let child of this.el.childNodes) {
      if (!child.body || !child.getAttribute(this.data)) { continue }
      child.object3D.updateMatrix()
      while (child.body.shapes.length) {
        tmpPos.copy(child.body.shapeOffsets.pop())
        tmpQuat.copy(child.body.shapeOrientations.pop())
        tmpMat.compose(tmpPos, tmpQuat, tmpScale)
        tmpMat.multiply(child.object3D.matrix)
        tmpMat.decompose(tmpPos, tmpQuat, tmpScale)
        offset.copy(tmpPos)
        orientation.copy(tmpQuat)
        body.addShape(child.body.shapes.pop(), offset, orientation)
      }
      child.removeAttribute(this.data)
    }
  }
})
