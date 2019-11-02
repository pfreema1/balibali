import * as THREE from 'three';
import glslify from 'glslify';

import {
	EffectComposer,
	BrightnessContrastEffect,
	EffectPass,
	RenderPass,
	ShaderPass,
	BlendFunction,
} from 'postprocessing';

import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';

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

		this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);
		this.camera.position.z = 300;

		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

		this.clock = new THREE.Clock();
	}

	initControls() {
		this.trackball = new TrackballControls(this.camera, this.renderer.domElement);
		this.trackball.rotateSpeed = 2.0;
		this.trackball.enabled = true;
	}

	initObject() {
		const geometry = new THREE.IcosahedronBufferGeometry(50, 1);

		const material = new THREE.ShaderMaterial({
			uniforms: {},
			vertexShader: glslify(require('../../shaders/default.vert')),
			fragmentShader: glslify(require('../../shaders/default.frag')),
			wireframe: true
		});

		const instances = 100;

		let instancePositions = [];
		let instanceQuaternions = [];
		let instanceScales = [];

		// blueprint
		this.object3D = new THREE.Mesh(geometry, material);
		this.scene.add(this.object3D);

		for (let i = 0; i < instances; i++) {
			let position = this.object3D.position;
			let quaternion = this.object3D.quaternion;
			let scale = this.object3D.scale;

			position.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
			quaternion.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
			scale.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);

			instancePositions.push(position.x, position.y, position.z);
			instanceQuaternions.push(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
			instanceScales.push(scale.x, scale.y, scale.z);
		}

		let instancedGeometry = new THREE.InstancedBufferGeometry();
		instancedGeometry.attributes.position = geometry.attributes.position;

		instancedGeometry.setAttribute('instancePosition', new THREE.InstancedBufferAttribute(new Float32Array(instancePositions), 3));
		instancedGeometry.setAttribute('instanceQuaternion', new THREE.InstancedBufferAttribute(new Float32Array(instanceQuaternions), 4));
		instancedGeometry.setAttribute('instanceScale', new THREE.InstancedBufferAttribute(new Float32Array(instanceScales), 3));

		let instanceMaterial = new THREE.ShaderMaterial({
			uniforms: {},
			vertexShader: glslify(require('../../shaders/default.vert')),
			fragmentShader: glslify(require('../../shaders/default.frag')),
			wireframe: true
		});

		let instancedMesh = new THREE.Mesh(instancedGeometry, instanceMaterial);
		this.scene.add(instancedMesh);

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

		this.fovHeight = 2 * Math.tan((this.camera.fov * Math.PI) / 180 / 2) * this.camera.position.z;
		this.fovWidth = this.fovHeight * this.camera.aspect;

		this.renderer.setSize(window.innerWidth, window.innerHeight);

		this.composer.setSize(window.innerWidth, window.innerHeight);

		if (this.trackball) this.trackball.handleResize();
	}
}
