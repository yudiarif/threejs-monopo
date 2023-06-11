import * as THREE from "three";
import { DirectionalLight, PointLight } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
//import gsap from "gsap";
import "./style.css";

import vertexShaderBg from "./src/shaders/vertexBg.glsl";
import fragmentShaderBg from "./src/shaders/fragmentBg.glsl";
import vertexShaderFresnel from "./src/shaders/vertexFresnel.glsl";
import fragmentShaderFresnl from "./src/shaders/fragmentFresnel.glsl";
import { PerspectiveCameraForResizableWindow, handleCameraRotation, handleMouseMovement } from "./src/js/CameraWithMouseRotation.js";
import CameraOrientationState from "./src/js/CameraOrientationState.js";

import { DotScreenShader } from "./src/js/customShaders";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import GUI from "lil-gui";
import { gsap } from "gsap";
//const createInputEvents = require("simple-input-events");

const gui = new GUI();
////SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

////Geometry
const geometry = new THREE.SphereGeometry(1.5, 32, 32);
const material = new THREE.ShaderMaterial({
  vertexShader: vertexShaderBg,
  fragmentShader: fragmentShaderBg,
  side: THREE.DoubleSide,

  uniforms: { uTime: { value: 0 } },
});

const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

////Geometry Mini Sphere fresnel
const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
  format: THREE.RGBAFormat,
  generateMipmaps: true,
  minFilter: THREE.LinearMipMapLinearFilter,
  colorSpace: THREE.SRGBColorSpace,
});

const cubeCamera = new THREE.CubeCamera(0.1, 10, cubeRenderTarget);
const fresnelGeometry = new THREE.SphereGeometry(0.5, 64, 64);
const fresnelMaterial = new THREE.ShaderMaterial({
  vertexShader: vertexShaderFresnel,
  fragmentShader: fragmentShaderFresnl,
  side: THREE.DoubleSide,
  //wireframe: true,

  uniforms: { tCube: { value: 0 } },
});

const miniSphere = new THREE.Mesh(fresnelGeometry, fresnelMaterial);
scene.add(miniSphere);

///Size
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

///Light
const light = new THREE.PointLight(0xffff, 1, 100);
light.position.set(0, 10, 10); /// XYZ = X:0 Y:10 Z:10
scene.add(light);

const sunLight = new DirectionalLight(0xffff, 0.08);
sunLight.position.set(-100, 0, -100);
scene.add(sunLight);

const fillLight = new PointLight(0xffff, 2.7, 4, 3);
fillLight.position.set(30, 3, 1.8);
scene.add(fillLight);

////Camera
const camera = new THREE.PerspectiveCamera(70, sizes.width / sizes.height);
camera.position.x = 0;
camera.position.y = 0;
camera.position.z = 1.4;
scene.add(camera);

///Renderer
const canvas = document.querySelector(".webgl");
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(2);
renderer.render(scene, camera);
miniSphere.position.x = 0.38;
miniSphere.position.y = 0.22;
miniSphere.position.z = 0.7;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const effect1 = new ShaderPass(DotScreenShader);
effect1.uniforms["scale"].value = 4;
composer.addPass(effect1);

///Controls
const controls = new OrbitControls(camera, canvas, mesh);
controls.enableDamping = true;

//Create a variable to keep track of mouse position
const mouse = new THREE.Vector2();

//Set up the default cameraOrientationStateObject
let cameraOrientationState = new CameraOrientationState();

//A function to be called every time the mouse moves
function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = (event.clientY / window.innerHeight) * 2 - 1;

  handleMouseMovement(mouse.x, mouse.y, cameraOrientationState);
  console.log(mouse.x, mouse.y);
}

//Add listener to call onMouseMove every time the mouse moves in the browser window
document.addEventListener("mousemove", onMouseMove, false);

//A method to be run each time a frame is generated
function animate() {
  requestAnimationFrame(animate);

  handleCameraRotation(camera, cameraOrientationState);

  renderer.render(scene, camera);
}
animate();

///Resize for responsive
window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  //Update camera for adjust position camera when display shrink/expand
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  composer.setSize(sizes.width, sizes.height);
});

//RE-render responsive camera
const loop = () => {
  material.uniforms.uTime.value += 0.007; //uTime value for shaders
  fresnelMaterial.uniforms.tCube.value = cubeRenderTarget.texture;
  miniSphere.visible = false;
  cubeCamera.update(renderer, scene);
  miniSphere.visible = true;
  //controls.update();
  renderer.render(scene, camera);
  composer.render(scene, camera);

  window.requestAnimationFrame(loop);
};
loop();

// GUI
const cameraFolder = gui.addFolder("camera");
cameraFolder.add(camera.position, "z", 0, 10);
cameraFolder.add(camera.position, "x", -10, 10);
cameraFolder.add(camera.position, "y", -10, 10);
cameraFolder.open();

const ms = gui.addFolder("miniSphere");
ms.add(miniSphere.position, "x", -5, 5);
ms.add(miniSphere.position, "y", -5, 5);
ms.add(miniSphere.position, "z", -5, 5);
ms.open();
