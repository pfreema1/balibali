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
    this.camera.position.z = 4;

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
    var geometry = new THREE.RingBufferGeometry(0.4, 1, 35);

    let colors = [];

    for (var i = 0, l = geometry.attributes.position.count; i < l; i++) {
      let random = Math.random();
      colors.push(
        remap(random, 0, 1, 0.5, 1.0),
        remap(random, 0, 1, 0.5, 1.0),
        remap(random, 0, 1, 0.5, 1.0)
      );
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      vertexColors: THREE.VertexColors
    });

    //

    const instances = 1000;

    let instancePositions = [];
    let instanceQuaternions = [];
    let instanceScales = [];

    // blueprint
    // this.object3D = new THREE.Mesh(geometry, material);
    // this.scene.add(this.object3D);

    for (let i = 0; i < instances; i++) {
      var mesh = new THREE.Mesh(geometry, material);
      //   this.scene.add(mesh);

      let position = mesh.position;
      let quaternion = mesh.quaternion;
      let scale = mesh.scale;

      position.set(Math.random() * 4 - 2, i, Math.random() * 4 - 2);
      quaternion.set(1, 1, 1, 1);
      scale.set(1, 1, 1);

      instancePositions.push(position.x, position.y, position.z);
      instanceQuaternions.push(
        quaternion.x,
        quaternion.y,
        quaternion.z,
        quaternion.w
      );
      instanceScales.push(scale.x, scale.y, scale.z);
    }

    let instancedGeometry = new THREE.InstancedBufferGeometry();
    instancedGeometry.attributes.position = geometry.attributes.position;
    instancedGeometry.attributes.color = geometry.attributes.color;

    instancedGeometry.setAttribute(
      'instancePosition',
      new THREE.InstancedBufferAttribute(new Float32Array(instancePositions), 3)
    );
    instancedGeometry.setAttribute(
      'instanceQuaternion',
      new THREE.InstancedBufferAttribute(
        new Float32Array(instanceQuaternions),
        4
      )
    );
    instancedGeometry.setAttribute(
      'instanceScale',
      new THREE.InstancedBufferAttribute(new Float32Array(instanceScales), 3)
    );

    //

    this.instanceShaderMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 }
      },
      vertexShader: document.getElementById('vertexShader').textContent,
      fragmentShader: document.getElementById('fragmentShader').textContent,
      vertexColors: true
    });

    let instancedMesh = new THREE.Mesh(
      instancedGeometry,
      this.instanceShaderMat
    );
    instancedMesh.position.x = 0.1;
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
