import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.8
renderer.physicallyCorrectLights = true;

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xD6D6D6);
renderer.setPixelRatio(window.devicePixelRatio);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const pmrem = new THREE.PMREMGenerator(renderer);
new RGBELoader()
  .setPath('public/hdr/')                   // carpeta donde pongas tu .hdr
  .load('abandoned_garage_1k.hdr', (hdr) => {
    const envMap = pmrem.fromEquirectangular(hdr).texture;
    scene.environment = envMap;       // clave para reflejos
    hdr.dispose();
    pmrem.dispose();
  });

// Camara

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(4, 5, 11);

// Controles

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 5;
controls.maxDistance = 20;
controls.minPolarAngle = 0.5;
controls.maxPolarAngle = 1.5;
controls.autoRotate = false;
controls.target = new THREE.Vector3(0, 1, 0);
controls.update();

// Suelo 

// 1) Carga la textura
const texLoader = new THREE.TextureLoader();
const woodMap = texLoader.load('laminate_floor_diff_2k.jpg', () => {
  // Ajustes recomendados al cargar
  woodMap.wrapS = THREE.RepeatWrapping;
  woodMap.wrapT = THREE.RepeatWrapping;

  // Que el color se interprete en sRGB (para que no se vea lavado)
  woodMap.colorSpace = THREE.SRGBColorSpace;

  // Más nitidez en ángulos
  woodMap.anisotropy = renderer.capabilities.getMaxAnisotropy();

  // Repetición según el tamaño del suelo (60x60):
  const TILE_SIZE = 2; // cada “tabla” ocupa 2 unidades
  woodMap.repeat.set(60 / TILE_SIZE, 60 / TILE_SIZE);
});

// 2) Geometría del suelo
const groundGeometry = new THREE.PlaneGeometry(60, 60, 30, 30);
groundGeometry.rotateX(-Math.PI / 2);

// 3) Material con la textura
const groundMaterial = new THREE.MeshStandardMaterial({
  map: woodMap,
  metalness: 0.3,
  roughness: 0.4,
  side: THREE.DoubleSide
});

// 4) Malla
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.castShadow = false;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

//const groundGeometry = new THREE.PlaneGeometry(60, 60, 30, 30);
//groundGeometry.rotateX(-Math.PI / 2);
//const groundMaterial = new THREE.MeshStandardMaterial({
  //color: 0xFFFFFF,
  //side: THREE.DoubleSide
//});
//const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
//groundMesh.castShadow = false;
//groundMesh.receiveShadow = true;
//scene.add(groundMesh);

// Luces

//const light = new THREE.AmbientLight(0xFFFFFF, 1);
//const light = new THREE.HemisphereLight(0xB1E1FF, 0xB97A20, 1);

//scene.add(light);

0xff7e79, 0.8

0x6eb6ff, 0.8

//const spotLight = new THREE.SpotLight(0xffffff, 20, 20, 0.02, 1000);
//spotLight.position.set(30, 200, 30);
//spotLight.castShadow = 
//spotLight.shadow.bias = -0.001;
//scene.add(spotLight);

const coldLight = new THREE.DirectionalLight(0xff7e79, 0.8); // rosado calido
coldLight.position.set(-4, 7, 3);
coldLight.castShadow = true;
scene.add(coldLight);

const warmBounce = new THREE.PointLight(0x6eb6ff, 0.6); // azul contraste
warmBounce.position.set(4, 2, -3);
scene.add(warmBounce);



// GLTF

const loader = new GLTFLoader().setPath('public/millennium_falcon/');
loader.load('Parque Ejemplo 1.gltf', (gltf) => {
  console.log('loading model');
  const mesh = gltf.scene;

  mesh.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;

      // === Mejoras de material para reflejos tipo Blender ===
    const mat = child.material;

    // Algunos GLTF traen múltiples materiales
    const mats = Array.isArray(mat) ? mat : [mat];

    for (const m of mats) {
      if (!(m.isMeshStandardMaterial || m.isMeshPhysicalMaterial)) continue;

      // Ajustes de brillo/plástico
      m.metalness = 0.08;           // plástico no metálico
      m.roughness = 0.3;          // bajito para más brillo
      m.envMapIntensity = 3;     // potencia reflejos del HDR
      if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;

      // Si tu export en Blender usaba Clearcoat:
      if (m.isMeshPhysicalMaterial) {
        m.clearcoat = 0;
        m.clearcoatRoughness = 0;
      }

      m.needsUpdate = true;
    }
  }
});

  mesh.position.set(0, 0, -1);
  scene.add(mesh);



  document.getElementById('progress-container').style.display = 'none';
}, (xhr) => {
  console.log(`loading ${xhr.loaded / xhr.total * 100}%`);
}, (error) => {
  console.error(error);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();