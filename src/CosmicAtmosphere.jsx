import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Deliberately monochrome. A sparse star field, a dusty galactic plane,
// and one subdued stellar concentration. No typography made from particles.
const vertex = `
  attribute float aSize;
  attribute float aLight;
  attribute float aPhase;
  attribute float aDepth;
  attribute float aSpark;
  attribute float aRibbon;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uPixelRatio;
  uniform float uParallax,uStarSize,uSpikeLength,uStarLight;
  varying float vLight;
  varying float vDiameter;
  varying float vSpark;
  varying float vPulse;
  varying float vQuad;
  void main() {
    vec2 shift = uMouse * (0.0072 + aDepth * 0.0468) * uParallax;
    // Only the galactic plane drifts right. The scattered background stars
    // receive no autonomous translation. Ribbon drift is deliberately languid.
    float flow = uTime * (0.0045 + aDepth * 0.0025);
    vec2 ribbonMotion = vec2(flow, 0.010 * sin(position.x * 5.0 + uTime * 0.12 + aPhase));
    vec2 pos = position.xy + shift + ribbonMotion * aRibbon;
    // Recycle only moving galactic particles beyond the visible viewport,
    // never wrap the entire starfield or the stationary background.
    if (aRibbon > 0.5) pos.x = mod(pos.x + 1.55, 3.1) - 1.55;
    gl_Position = vec4(pos, 0.0, 1.0);
    vDiameter = aSize * uPixelRatio * uStarSize;
    vSpark = aSpark;
    float pulse = pow(max(0.0, sin(uTime * (1.0 + aDepth * 1.3) + aPhase)), 220.0);
    vPulse = pulse * aSpark;
    // Allocate a larger point QUAD for sharp diffraction spikes, not a larger circular star.
    gl_PointSize = max(3.0, vDiameter + vPulse * uSpikeLength * 2.5 * uPixelRatio);
    vQuad = gl_PointSize;
    vLight = aLight * uStarLight;
  }
`;
const fragment = `
  precision highp float;
  varying float vLight;
  varying float vDiameter;
  varying float vSpark;
  varying float vPulse;
  varying float vQuad;
  float cubic(float x) {
    x = abs(x);
    if (x < 1.0) return (4.0-6.0*x*x+3.0*x*x*x)/6.0;
    float v = max(2.0-x,0.0);
    return v*v*v/6.0;
  }
  void main() {
    vec2 centered = (gl_PointCoord - .5) * vQuad;
    // Physical diameter remains unchanged while the GPU point quad grows for spikes.
    float star = max(0.0, 1.0 - smoothstep(0.12, max(0.39, vDiameter * .52), length(centered)));
    float spikeLength = .01 + 8.8 * vPulse;
    float spikeWidth = .14;
    // Four dagger-sharp arms; narrow orthogonal axis, rapidly tapering at their tips.
    float horizontal = exp(-pow(abs(centered.y) / spikeWidth, 1.3))
      * pow(max(0.0, 1.0 - abs(centered.x) / spikeLength), 2.3);
    float vertical = exp(-pow(abs(centered.x) / spikeWidth, 1.3))
      * pow(max(0.0, 1.0 - abs(centered.y) / spikeLength), 2.3);
    float cross = max(horizontal, vertical) * step(.52,vPulse) * 1.8;
    float alpha = clamp((star + cross) * vLight, 0.0, 1.0);
    if (alpha < .005) discard;
    vec3 tint = mix(vec3(.94,.96,1.),vec3(.97,.88,1.),vPulse*.13);
    gl_FragColor = vec4(tint, alpha);
  }
`;
const random = (a, b) => a + Math.random() * (b - a);
const gaussian = () => Math.sqrt(-2 * Math.log(Math.max(Math.random(), 1e-8))) * Math.cos(2 * Math.PI * Math.random());

function makeStars(aspect) {
  const count = aspect < 0.8 ? 6500 : 12500;
  const position = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const light = new Float32Array(count);
  const phase = new Float32Array(count);
  const depth = new Float32Array(count);
  const spark = new Float32Array(count);
  const ribbon = new Float32Array(count);

  // Long, gentle Milky Way axis. Broad enough to feel astronomical,
  // with dark lanes and nonuniform concentrations rather than a glowing stripe.
  const angle = -0.35;
  const axis = [Math.cos(angle), Math.sin(angle)];
  const across = [-axis[1], axis[0]];
  const cx = 0.05;
  const cy = -0.07;
  for (let i = 0; i < count; i++) {
    const r = Math.random();
    let x, y, intensity, diameter;
    if (r < 0.43) {
      // Distant sparse pinpricks across the entire void.
      x = random(-1.1, 1.1);
      y = random(-1.1, 1.1);
      intensity = random(0.54, 0.88);
      diameter = random(0.55, 1.55);
    } else if (r < 0.68) {
      // Silvery wisps: narrow wandering lanes, not extra stars.
      const along = random(-1.25, 1.25);
      const lane = Math.floor(random(0, 3));
      const offset = [-0.105, 0.012, 0.112][lane];
      const wave = 0.055 * Math.sin(along * 4.1 + lane * 1.7)
                 + 0.029 * Math.sin(along * 8.0 - lane);
      const cross = offset + wave*.55 + gaussian() * random(0.012, 0.028);
      x = cx + axis[0] * along + across[0] * cross;
      y = cy + axis[1] * along + across[1] * cross;
      intensity = random(0.64, 0.95);
      diameter = random(0.64, 1.55);
      ribbon[i] = 1;
    } else {
      // Dust in the broad galactic plane with intermittent filaments.
      const along = random(-1.7, 1.7);
      const filament = gaussian() * random(0.035, 0.17);
      const bend = 0.032 * Math.sin(along * 4.1) - 0.016 * Math.cos(along * 7.0);
      x = cx + axis[0] * along + across[0] * (filament + bend);
      y = cy + axis[1] * along + across[1] * (filament + bend);
      const center = Math.exp(-Math.pow((along - 0.16) / .52, 2));
      const dusty = 0.4 + 0.6 * Math.max(0, Math.sin(along * 11 + filament * 17));
      intensity = random(0.64, 0.95) * (.72 + .28 * dusty) + center * random(.05, .1);
      diameter = random(.48, 1.55) + center * random(0, .5);

      // The broad galactic dust belongs to the moving plane, too.
      // Previously ONLY the sparse narrow lanes moved: most of the Milky
      // Way stayed frozen, making the intended slow drift imperceptible.
      ribbon[i] = 1;
      // Irregular extinction lanes carved through the galactic plane.
      if (Math.abs(filament + .055 * Math.sin(along * 6.0)) < .043) {
        intensity *= .73;
      }
    }
    const k = i * 3;
    position[k] = x;
    position[k + 1] = y;
    position[k + 2] = 0;
    const rare = Math.random() < 0.035;
    size[i] = (rare ? diameter * 1.05 : diameter) * .62;
    light[i] = Math.min(1.0, Math.max(.49, rare ? intensity * 1.55 : intensity * 1.25));
    spark[i] = rare ? 1 : 0;
    phase[i] = random(0, Math.PI * 2);
    depth[i] = Math.random();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geometry.setAttribute('aLight', new THREE.BufferAttribute(light, 1));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  geometry.setAttribute('aDepth', new THREE.BufferAttribute(depth, 1));
  geometry.setAttribute('aSpark', new THREE.BufferAttribute(spark, 1));
  geometry.setAttribute('aRibbon', new THREE.BufferAttribute(ribbon, 1));
  return geometry;
}

export default function CosmicAtmosphere() {
  const root = useRef(null);
  useEffect(() => {
    const mount = root.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' });
    } catch (err) {
      console.warn('Cosmic atmosphere: WebGL unavailable', err);
      return;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%';
    mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.Camera();
    const uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2() },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 1.6) },
      uParallax:{value:3.2},uStarSize:{value:1},uSpikeLength:{value:9},uStarLight:{value:1.25}
    };
    const material = new THREE.ShaderMaterial({
      uniforms, vertexShader: vertex, fragmentShader: fragment,
      transparent: true, depthTest: false, depthWrite: false,
      blending: THREE.NormalBlending
    });
    let geometry;
    let stars;
    let frame = 0;
    let disposed = false;
    const startTime = performance.now();
    // User-selected ambient galactic drift continues at a low frame rate
    // even in reduced-motion mode; only optional star flicker is restrained.
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||false;
    let lastRender = -Infinity;
    const pointer = new THREE.Vector2();
    const tune=e=>{const p=e.detail||{};uniforms.uParallax.value=p.parallax??3.2;uniforms.uStarSize.value=p.starSize??1;uniforms.uSpikeLength.value=p.twinkleLength??9;uniforms.uStarLight.value=p.starLight??1.25;};
    window.addEventListener('venshalor-starfield-tune',tune);
    function resize() {
      if (disposed) return;
      const w = Math.max(1, mount.clientWidth);
      const h = Math.max(1, mount.clientHeight);
      renderer.setSize(w, h, false);
      uniforms.uPixelRatio.value = renderer.getPixelRatio();
      if (geometry) geometry.dispose();
      if (stars) scene.remove(stars);
      geometry = makeStars(w / h);
      stars = new THREE.Points(geometry, material);
      stars.frustumCulled = false;
      scene.add(stars);
      renderer.render(scene, camera);
    }
    function move(e) {
      const rect = mount.getBoundingClientRect();
      pointer.set(
        ((e.clientX - rect.left) / rect.width - .5) * 2,
        (0.5 - (e.clientY - rect.top) / rect.height) * 2
      );
    }
    function tick(now) {
      if (disposed) return;
      frame = requestAnimationFrame(tick);
      if (now - lastRender < (reduced?100:1000/45)) return;
      lastRender = now;
      uniforms.uTime.value = (now - startTime) / 1000;
      uniforms.uMouse.value.lerp(pointer, 0.025);
      renderer.render(scene, camera);
    }
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    window.addEventListener('pointermove', move, { passive: true });
    resize();
    frame = requestAnimationFrame(tick);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('pointermove', move);
      window.removeEventListener('venshalor-starfield-tune',tune);
      geometry?.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return <div ref={root} className="cosmic-atmosphere" aria-hidden="true" />;
}
