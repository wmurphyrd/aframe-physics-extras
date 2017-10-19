# A-Frame Physics Extras
[![npm Dowloads](https://img.shields.io/npm/dt/aframe-physics-extras.svg?style=flat-square)](https://www.npmjs.com/package/aframe-physics-extras)
[![npm Version](http://img.shields.io/npm/v/aframe-physics-extras.svg?style=flat-square)](https://www.npmjs.com/package/aframe-physics-extras)

Cannon API interface components the A-Frame Physics System.

![aframe-physics-extras in action](./readme_files/physics.gif)

* [physics-collider](#physics-collider)
* [collision-filter](#collision-filter)
* [sleepy](#sleepy)

## physics-collider

A collision detection component powered by the physics simulation with low
overhead and precise collision zones

### API

| Property | Description | Default Value |
| -------- | ----------- | ------------- |
| ignoreSleep | Wake sleeping bodies on collision?   | `true` |

`physics-collider` can also report collisions with static bodies when
`ignoreSleep` is `true`. This can be useful to create collision detection zones
for interactivity with things other than dynamic bodies.

### Events

| Type | Description | Detail object |
| --- | --- | --- |
| collisions | Emitted each tick if there are changes to the collision list | `els`: array of new collisions. `cleardEls`: array of collisions which have ended. |

## collision-filter

Control which physics bodies interact with each other or ignore each other.
This can improve physics system performance by skipping unnecessary
collision checks. It also controls which entities can be interacted with
via `physics-collider`

### API

| Property | Description | Default Value |
| -------- | ----------- | ------------- |
| group | Collision group this entity belongs to  | `'default'` |
| collidesWith | Array of collision groups this entity will interact with | `'default'` |
| collisionForces | Should other bodies react to collisions with this body? | `true` |

`collisionForces` controls whether collisions with this body generate any
forces. Setting this to `false` allows for collisions to be registered and
tracked without causing any corresponding movement. This is useful for
your controller entities with `physics-collider` because it is difficult
to pick things up if they are constantly bumped away when your hand gets close.
This can be toggles through events with a controller button press
if you want to be able to bump other
objects sometimes and reach inside to pick them up other times.
[There is an example of this on the examples page](#examples).

Turning off `collisionForces` can also be useful
for setting static bodies as collision zones to detect the presence
of other entities without disturbing them.

## sleepy

Make entities settle down and be still after physics collisions. Very useful
for zero-gravity user interfaces to keep entities from floating away. Also
can help performance as sleeping bodies are handled efficiently by the physics
simulation.

### API

| Property | Description | Default Value |
| -------- | ----------- | ------------- |
| allowSleep | Enable sleep for this body | `true` |
| speedLimit | Maximum velocity for sleep to initiate | `0.25` |
| delay | Time interval to check for sleep initiation (seconds) | `0.25` |
| linearDamping | Deceleration of liner forces on the entity (0 to 1) | `0.99` |
| angularDamping | Deceleration of angular forces on the entity (0 to 1) | `0.99` |
| holdState | Entity state in which sleep is suspended | `'grabbed'` |

Adding `sleepy` to any body will activate sleep for the entire physics system
and will affect other bodies because the cannon defaults for all bodies
are to allow sleep with a speed limit of 0.1 and delay of 1 second. You can
add `sleepy="allowSleep: false; linearDamping: 0.01; angularDamping: 0.01"`
to restore default behavior to an entity if needed.
Sleeping bodies will ignore static bodies
(hence why `physics-collider` has an `ignoreSleep` setting) until they
are woken by a dynamic or kinematic body. Sleep will break constraints,
so the `holdState` property allows you to suspend sleep during interactions
such as grabbing/carrying the entity.

## Examples

[View the examples page](http://wmurphyrd.github.io/aframe-physics-extras/examples/) to see `aframe-physics-extras` in action.

## Installation

### Browser

Install and use by directly including the [browser files](dist):

```html
<head>
  <title>My A-Frame Scene</title>
  <script src="https://aframe.io/releases/0.7.0/aframe.min.js"></script>
  <script src="https://rawgit.com/wmurphyrd/aframe-physics-extras/master/dist/aframe-physics-extras.min.js"></script>
</head>

<body>
  <a-scene>
    <a-entity foo="foo: bar"></a-entity>
  </a-scene>
</body>
```

### npm

Install via npm:

```bash
npm install
```

Then require and use.

```js
require('aframe');
require('aframe-physics-extras');
```
