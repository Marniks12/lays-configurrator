// ======================
// AUTH GUARD
// ======================

const token = localStorage.getItem("token");

if (!token) {
  // alles verbergen
  document.body.innerHTML = `
    <div style="
      height:100vh;
      display:flex;
      flex-direction:column;
      justify-content:center;
      align-items:center;
      font-family:sans-serif;
    ">
      <h1>Please log in</h1>
      <p>You must be logged in to create a bag.</p>
    </div>
  `;
  throw new Error("Not logged in");
}



import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/* ======================
   CURRENT DESIGN STATE
====================== */
let currentBagColor = "#d9d9d9";
let currentPattern = "";
let currentChipsType = "";

/* ======================
   SCENE
====================== */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

/* ======================
   CAMERA
====================== */
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 0.9, 2.2);
camera.lookAt(0, 0.8, 0);


/* ======================
   RENDERER
====================== */
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
const viewer = document.querySelector(".viewer");
viewer.appendChild(renderer.domElement);


/* ======================
   LIGHTS
====================== */
scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(2, 4, 5);
scene.add(dirLight);

/* ======================
   CONTROLS
====================== */
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

/* ======================
   LOAD BAG
====================== */
let bag = null;
const loader = new GLTFLoader();

loader.load("/models/chips_arthur_de_klerck.glb", (gltf) => {
  bag = gltf.scene;
  scene.add(bag);
  bag.position.set(0, 0, 0);
bag.scale.set(1.1, 1.1, 1.1);


  bag.traverse((child) => {
    if (child.isMesh) {
      child.material.side = THREE.DoubleSide;
      child.material.metalness = 0.2;
      child.material.roughness = 0.6;
    }
  });
});

/* ======================
   PATTERN TEXTURE
====================== */
function createPatternTexture(type) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#bfbfbf";
  ctx.fillStyle = "#bfbfbf";
  ctx.lineWidth = 4;

  if (type === "spiral") {
    for (let x = 150; x < 1024; x += 300) {
      for (let y = 150; y < 1024; y += 300) {
        ctx.beginPath();
        let r = 5;
        for (let i = 0; i < 60; i++) {
          const a = i * 0.35;
          ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
          r += 2;
        }
        ctx.stroke();
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/* ======================
   APPLY DESIGN
====================== */
function applyDesign(type) {
  currentPattern = type;
  if (!bag) return;

  const designTexture = createPatternTexture(type);

  bag.traverse((child) => {
    if (!child.isMesh) return;
    child.material.emissive = new THREE.Color(0xffffff);
    child.material.emissiveMap = designTexture;
    child.material.emissiveIntensity = 0.35;
    child.material.needsUpdate = true;
  });
}

/* ======================
   UI EVENTS
====================== */
document.getElementById("designSelect").addEventListener("change", e => {
  if (e.target.value) applyDesign(e.target.value);
});

document.getElementById("chipsSelect").addEventListener("change", e => {
  currentChipsType = e.target.value;
});

document.getElementById("bagColor").addEventListener("input", e => {
  currentBagColor = e.target.value;
  if (!bag) return;

  bag.traverse((c) => {
    if (c.isMesh) c.material.color.set(currentBagColor);
  });
});

/* ======================
   RESIZE
====================== */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ======================
   RENDER LOOP
====================== */
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

/* ======================
   SCREENSHOT (SMALL)
====================== */
function makeSmallScreenshot() {
  const src = renderer.domElement;
  const canvas = document.createElement("canvas");
  const scale = 400 / src.width;

  canvas.width = 400;
  canvas.height = src.height * scale;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/jpeg", 0.7);
}

/* ======================
   SAVE DESIGN
====================== */
document.getElementById("saveDesign").addEventListener("click", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("You are not logged in");
    return;
  }

  // 👉 forceer 1 render vóór screenshot
  renderer.render(scene, camera);

  // 👉 kleine preview maken
  const previewImage = makeSmallScreenshot();

  try {
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

    if (!res.ok) throw new Error("Save failed");

    alert("Design saved!");
  } catch (err) {
    console.error(err);
    alert("Save failed");
  }
});
const loginBtn = document.getElementById("loginBtn");

loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("http://localhost:3000/api/v1/user/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) throw new Error("Login failed");

    const { token } = await res.json();
    localStorage.setItem("token", token);

    document.getElementById("loginStatus").innerText = "✅ Logged in";
  } catch (err) {
    document.getElementById("loginStatus").innerText = "❌ Login failed";
  }
});

