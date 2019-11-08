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
import { MeshDepthMaterial } from 'three';

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
    this.initObjects();
    this.initLights();
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
    this.camera.position.z = 30;

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

  initLights() {
    this.pointLight = new THREE.PointLight(0xff0000, 1, 100);
    this.pointLight.position.set(0, 0, 50);
    this.scene.add(this.pointLight);
  }

  initObjects() {
    this.particleCount = 100;
    this.particles = [];

    for (let i = 0; i < this.particleCount; i++) {
      let mesh = this.createMesh();
      this.randomizeTransform(mesh);
      this.scene.add(mesh);

      this.particles.push(mesh);
    }
  }

  randomizeTransform(mesh) {
    /*
		x range:  -30 to 30
		y range:  -15 to 15
		z range: 10 to -50
	*/
    mesh.position.x = remap(Math.random(), 0, 1, -30, 30);
    mesh.position.y = remap(Math.random(), 0, 1, -15, 15);
    mesh.position.z = remap(Math.random(), 0, 1, -20, 10);

    mesh.rotation.x = Math.random() * 2 * Math.PI;
    mesh.rotation.y = Math.random() * 2 * Math.PI;
    mesh.rotation.z = Math.random() * 2 * Math.PI;
  }

  updateParticles() {
    console.log('foo');
    for (let i = 0; i < this.particleCount; i++) {
      let particle = this.particles[i];

      particle.position.y += Math.random() * 0.03 + 0.01;
      particle.rotation.x += Math.random() * 0.01;
      particle.rotation.z += Math.random() * 0.01;
    }
  }

  createMesh() {
    let geo = new THREE.TetrahedronBufferGeometry(1, 0);
    // let mat = new THREE.MeshPhongMaterial();
    // mat.shininess = 100;
    let mat = new THREE.MeshPhysicalMaterial({
      roughness: 0.5,
      metalness: 0.3,
      reflectivity: 1,
      clearcoat: 1
    });
    return new THREE.Mesh(geo, mat);
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

    if (this.particleCount) {
      this.updateParticles();
    }

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
