# Effects Catalog

V2 currently exposes 37 first-class effects. Every listed effect renders on both Canvas and WebGL.

WebGL usually uses a much larger particle budget and shader-driven motion. Canvas uses fewer particles and cached procedural sprites. The semantic effect remains the same.

## Flagship and space

| Effect | Default palette | Character | Good for |
|---|---|---|---|
| glitter-shimmer | glitter | dense micro-glitter with irregular glints, rare sharp flares and depth | luxury, fashion, product hero, celebration |
| star-field | starlight | parallax star field with twinkle and optional nebula haze | space, technology, calm full-page backgrounds |
| galaxy | galaxy | tilted layered spiral galaxy with bulge, disk, arms and star-forming knots | hero sections, cinematic space |
| supernova | nova | repeating explosive shell, ejecta and remnant core | dramatic transitions, events |
| cosmic-dust | cosmic | slow orbiting galactic dust | subtle space atmosphere |
| warp-speed | starlight | accelerating radial streaks with long trails | sci-fi, launches, fast transitions |
| accretion-disk | accretion | hot inner disk with shear, tilt, beaming and trails | black-hole / astrophysics visuals |
| planetary-rings | rings | thin tilted orbit band with ringlets and gaps | planetary scenes |

## Energy and flow

| Effect | Default palette | Character |
|---|---|---|
| curl-flow | aurora | particles advected through a divergence-free curl field |
| plasma-storm | plasma | high-energy turbulent curl flow |
| ray-burst | aurora | spiral radial stream |
| bending-chaos | aurora | crossing bidirectional spiral flow |
| wave-particles | confetti | layered travelling-wave sheet |
| dancing-waves | cobalt-cyan | fountain-like rhythmic particle waves |
| quantum-field | quantum | particles snapping between nearby positions |
| heartbeat-pulse | love | repeated expanding pulse rings |
| spiral-drift | cosmic | smooth Fibonacci-like spiral motion |

## Nature and atmosphere

| Effect | Default palette | Character |
|---|---|---|
| cherry-blossom | sakura | drifting blossom-like particles |
| firefly-meadow | firefly | sparse drifting lights with asynchronous blinking |
| snow-storm | mono-white | directional snow with wind and sway |
| bubble-rise | aqua | rising particles with gentle wobble |
| falling-leaves | autumn | broad tumbling fall |
| underwater | aqua | slow dreamy underwater drift |
| sand-storm | desert | fast horizontal fine-particle flow |
| pollen-drift | pollen | warm floating motes with gentle wander |
| falling-ash | ash | descending ash with sway, flutter and warm remnants |
| dust-motes | dust-light | small floating motes through soft light |
| dandelion-seeds | dandelion | sparse large drifting seed-like particles |
| bioluminescent-ocean | cobalt-cyan | glowing crest-focused wave field |

## Fire, celebration and decorative

| Effect | Default palette | Character |
|---|---|---|
| ember-storm | ember | buoyant embers that flicker and cool |
| lava-eruption | magma | hot fountain particles under drag and gravity |
| emerald-shimmer | emerald-gold | warm shimmer flowing outward |
| confetti-drop | confetti | celebratory falling/tumbling particles |
| meteor-shower | starlight | diagonal streaks with trails |
| petal-burst | love | radial petal-like burst |
| rising-lanterns | lantern | sparse warm lights rising slowly |
| aurora-veil | borealis | layered curtain-like waves |

## Glitter Shimmer parameters

~~~js
params: {
  flareRate: 1,
  shimmer: 0.6,
  depth: 0.7,
  wave: 0,
}
~~~

| Parameter | Range | Default | Meaning |
|---|---:|---:|---|
| flareRate | 0.2..3 | 1 | relative frequency of sharp glints |
| shimmer | 0..1 | 0.6 | irregular micro-flicker strength |
| depth | 0..1 | 0.7 | near/far spread |
| wave | 0..1 | 0 | diagonal travelling shimmer band |

Example:

~~~js
new GlitterFX(hero, {
  effect: 'glitter-shimmer',
  quality: 'high',
  glow: 0.85,
  params: {
    flareRate: 1.5,
    shimmer: 0.8,
    depth: 0.9,
    wave: 0.25,
  },
});
~~~

## Galaxy parameters

~~~js
params: {
  arms: 2,
  twist: 2.3,
}
~~~

| Parameter | Range | Default | Meaning |
|---|---:|---:|---|
| arms | 1..8 integer | 2 | number of spiral arms |
| twist | 0.8..4 | 2.3 | arm winding strength |

Example:

~~~js
await fx.transitionTo(
  {
    effect: 'galaxy',
    params: { arms: 5, twist: 3.1 },
  },
  {
    type: 'morph',
    duration: 1600,
  },
);
~~~

## Legacy aliases

V2 accepts two renamed V1 ids:

| V1 id | V2 canonical id |
|---|---|
| galaxy-spiral | galaxy |
| ember-drift | ember-storm |

Prefer canonical V2 names in new code.

## Palettes

Built-in palette ids currently include:

- starlight
- aurora
- ember
- galaxy
- nova
- emerald-gold
- cobalt-cyan
- magma
- confetti
- mono-white
- sakura
- firefly
- cosmic
- plasma
- aqua
- autumn
- desert
- love
- borealis
- quantum
- glitter
- pollen
- ash
- dust-light
- dandelion
- lantern
- accretion
- rings
- frost

Use the exported palettes object when building a selector:

~~~js
import { palettes } from 'glitterfx';

const paletteIds = Object.keys(palettes);
~~~

## Choosing an effect

For a luxury/product hero, start with glitter-shimmer.

For technical/space branding, start with star-field, galaxy or warp-speed.

For ambient content backgrounds, start with dust-motes, pollen-drift, firefly-meadow or underwater and lower density/brightness.

For high-motion hero sections, use curl-flow, plasma-storm, supernova, accretion-disk or warp-speed.

For mobile-first pages with several effect regions, use Canvas and prefer lighter ambient effects.
