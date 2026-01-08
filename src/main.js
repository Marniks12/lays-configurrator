// ======================
// AUTH GUARD (CONFIGURATOR)
// ======================
const token = localStorage.getItem("token");

if (!token) {
  document.body.innerHTML = `
    <div style="
      height:100vh;
      display:flex;
      flex-direction:column;
      justify-content:center;
      align-items:center;
      font-family:Arial, sans-serif;
      background:#fff7cc;
      text-align:center;
    ">
      <h1>Not logged in</h1>
      <p>You must log in to create a bag.</p>
      <button
        style="
          margin-top:20px;
          padding:12px 20px;
          border:none;
          border-radius:20px;
          background:#d71920;
          color:white;
          font-weight:bold;
          cursor:pointer;
        "
        onclick="window.location.href='http://localhost:5173/'"
      >
        Go to login
      </button>
    </div>
  `;
  throw new Error("Not logged in");
}

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// ======================
// STATE
// ======================
let currentBagColor = "#d9d9d9";
let currentPattern = "";
let currentChipsType = "";

let bagText = "";
let bagFont = "bold 80px Arial";
let bagImage = null;

let bag = null;
let textPlane = null;
let imagePlane = null;

// ======================
// SCENE
// ======================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

// ======================
// CAMERA
// ======================
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 0.9, 2.2);
camera.lookAt(0, 0.8, 0);

// ======================
// RENDERER
// ======================
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

document.querySelector(".viewer").appendChild(renderer.domElement);

// ======================
// LIGHTS
// ======================
scene.add(new THREE.AmbientLight(0xffffff, 0.9));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(3, 5, 4);
scene.add(dirLight);

// ======================
// CONTROLS
// ======================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// ======================
// LOAD BAG
// ======================
const loader = new GLTFLoader();

loader.load("/models/chips_arthur_de_klerck.glb", (gltf) => {
  bag = gltf.scene;
  scene.add(bag);

  bag.scale.set(1.1, 1.1, 1.1);
  bag.position.set(0, 0, 0);

  bag.traverse((child) => {
    if (child.isMesh) {
      child.material.side = THREE.DoubleSide;
      child.material.metalness = 0.25;
      child.material.roughness = 0.55;
    }
  });
});

// ======================
// HELPER → FRONT MESH
// ======================
function getFrontMesh() {
  let target = null;

  bag.traverse((child) => {
    if (child.isMesh && !target) target = child;
  });

  return target;
}

// ======================
// TEXT ON BAG
// ======================
function applyText() {
  if (!bag || !bagText) return;

  const parent = getFrontMesh();
  if (!parent) return;

  if (textPlane) parent.remove(textPlane);

  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = bagFont;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(bagText, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
  });

  textPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 0.35),
    material
  );

  textPlane.position.set(0, 0.9, 0.14);
  textPlane.rotation.set(0.34, 0.47, 0.23);
  parent.add(textPlane);
}

// ======================
// IMAGE ON BAG
// ======================
function applyImage(img) {
  if (!bag || !img) return;

  const parent = getFrontMesh();
  if (!parent) return;

  if (imagePlane) parent.remove(imagePlane);

  const texture = new THREE.Texture(img);
  texture.needsUpdate = true;

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
  });

  imagePlane = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.35),
    material
  );

  imagePlane.position.set(0, -0.05, 0.01);
  parent.add(imagePlane);
}

// ======================
// UI EVENTS
// ======================
document.getElementById("bagColor").addEventListener("input", (e) => {
  currentBagColor = e.target.value;
  if (!bag) return;

  bag.traverse((c) => {
    if (c.isMesh) c.material.color.set(currentBagColor);
  });
});

document.getElementById("chipsSelect").addEventListener("change", (e) => {
  currentChipsType = e.target.value;
});

document.getElementById("designSelect").addEventListener("change", (e) => {
  currentPattern = e.target.value;
});

// 👉 tekst input
document.getElementById("bagText")?.addEventListener("input", (e) => {
  bagText = e.target.value;
  applyText();
});

// 👉 font select
document.getElementById("fontSelect")?.addEventListener("change", (e) => {
  bagFont = e.target.value;
  applyText();
});

// 👉 image upload
document.getElementById("imageUpload")?.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const img = new Image();
  img.onload = () => {
    bagImage = img;
    applyImage(img);
  };
  img.src = URL.createObjectURL(file);
});

// ======================
// RESIZE
// ======================
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ======================
// RENDER LOOP
// ======================
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// ======================
// SCREENSHOT
// ======================
function makeSmallScreenshot() {
  const src = renderer.domElement;
  const canvas = document.createElement("canvas");
  const scale = 400 / src.width;

  canvas.width = 400;
  canvas.height = src.height * scale;

  canvas.getContext("2d").drawImage(
    src,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return canvas.toDataURL("image/jpeg", 0.7);
}

// ======================
// SAVE DESIGN
// ======================
document.getElementById("saveDesign").addEventListener("click", async () => {
  renderer.render(scene, camera);

  const previewImage = makeSmallScreenshot();

  const res = await fetch("http://localhost:3000/api/v1/design", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({
      bagColor: currentBagColor,
      pattern: currentPattern,
      chipsType: currentChipsType,
      previewImage,
    }),
  });

  if (!res.ok) {
    alert("Save failed");
    return;
  }

  alert("Design saved!");
});
