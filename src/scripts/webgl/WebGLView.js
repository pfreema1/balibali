import * as THREE from 'three';
import glslify from 'glslify';

import {
  EffectComposer,
  BrightnessContrastEffect,
  EffectPass,
  RenderPass,
  ShaderPass,
  BlendFunction
} from 'postprocessing';

import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';

function remap(t, old_min, old_max, new_min, new_max) {
  let old_range = old_max - old_min;
  let normalizedT = t - old_min;
  let normalizedVal = normalizedT / old_range;
  let new_range = new_max - new_min;
  let newVal = normalizedVal * new_range + new_min;
  return newVal;
}

export default class WebGLView {
  constructor(app) {
    this.app = app;

    this.initThree();
    this.initObject();
    this.initControls();
    this.initPostProcessing();
  }

  initThree() {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.01,
      100
    );
    this.camera.position.z = 2;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    this.clock = new THREE.Clock();
  }

  initControls() {
    this.trackball = new TrackballControls(
      this.camera,
      this.renderer.domElement
    );
    this.trackball.rotateSpeed = 2.0;
    this.trackball.enabled = true;
  }

  initObject() {
    const instances = 10000;
    let positions = [];
    positions.push(0.025, -0.025, 0);
    positions.push(-0.025, 0.025, 0);
    positions.push(0, 0, 0.025);

    let colors = [];

    let offsets = [];

    for (let i = 0; i < instances; i++) {
      offsets.push(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      );

      let random = Math.random();
      colors.push(Math.random(), Math.random(), Math.random());
    }

    let instancedGeometry = new THREE.InstancedBufferGeometry();
    instancedGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
    instancedGeometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(colors, 3)
    );
    instancedGeometry.setAttribute(
      'offset',
      new THREE.InstancedBufferAttribute(new Float32Array(offsets), 3)
    );

    this.instanceShaderMat = new THREE.RawShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 }
      },
      vertexShader: document.getElementById('vertexShader').textContent,
      fragmentShader: document.getElementById('fragmentShader').textContent,
      transparent: true,
      side: THREE.DoubleSide
    });

    let instancedMesh = new THREE.Mesh(
      instancedGeometry,
      this.instanceShaderMat
    );

    this.scene.add(instancedMesh);
    console.log(this.scene);
  }

  initPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.enabled = false;

    const renderPass = new RenderPass(this.scene, this.camera);
    renderPass.renderToScreen = false;

    const contrastEffect = new BrightnessContrastEffect({ contrast: 1 });
    const contrastPass = new EffectPass(this.camera, contrastEffect);
    contrastPass.renderToScreen = true;

    this.composer.addPass(renderPass);
    this.composer.addPass(contrastPass);

    // kickstart composer
    this.composer.render(1);
  }

  // ---------------------------------------------------------------------------------------------
  // PUBLIC
  // ---------------------------------------------------------------------------------------------

  update() {
    const delta = this.clock.getDelta();
    const time = performance.now() * 0.0005;

    this.instanceShaderMat.uniforms.uTime.value = time;

    if (this.trackball) this.trackball.update();
  }

  draw() {
    if (this.composer && this.composer.enabled) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }

  // ---------------------------------------------------------------------------------------------
  // EVENT HANDLERS
  // ---------------------------------------------------------------------------------------------

  resize() {
    if (!this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.fovHeight =
      2 *
      Math.tan((this.camera.fov * Math.PI) / 180 / 2) *
      this.camera.position.z;
    this.fovWidth = this.fovHeight * this.camera.aspect;

    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.composer.setSize(window.innerWidth, window.innerHeight);

    if (this.trackball) this.trackball.handleResize();
  }
}
