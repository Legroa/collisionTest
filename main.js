

//IMPORT MODULES
import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import GUI, { Controller } from "lil-gui";
import { CSG } from "./THREE-CSGMesh/dist/client/CSGMesh.js";
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { OBB } from 'three/addons/math/OBB.js';
import Stats from 'three/addons/libs/stats.module.js';
//'./node_modules/three/examples/fonts/helvetiker_regular.typeface.json'


//CONSTANT & VARIABLES
let width = window.innerWidth;
let height = window.innerHeight;

//-- GUI PARAMETERS
var gui;
var widthController;
var heightController;
var depthController;
const parameters = {
  Joint() {
    createJoint();
  },
  CollisionTest() {
    collisionTest();
  },
  Beam() {
    createBeam();
  },
  Bar() {
    createBar();
  },
  delete() {
    removeSelectedObject();
  },
  test() {
    hi();
  },
  width: 0,
  height: 0,
  depth: 0,
  additionalRadius: 1,
  additionalLength: 10,
};

function hi() {
  alert("Booom, das funktioniert schonmal!");
}


// Create cylinders and spheres for each vector using a for loop
var Tubes = [];
var Joint = [];
var spheres = [];
var additionalRadius = 1;
var additionalLength = 10;

//-- SCENE VARIABLES
var scene;
var camera;
var renderer;
var container;
var control;
var ambientLight;
var directionalLight;
var gumball;


//-- RAYCASTER VARIABLES
let group;
let selectedObject = null;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
var transformedObject = null;

//-- GEOMETRY PARAMETERS
//Create an empty array for storing all the cubes
let sceneObjects = [];

let tubeCounter = 1;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////77
// Function to create text geometry with predefined parameters
function createTextGeometry(text, font, parameters) {
  return new Promise((resolve, reject) => {
    const textGeometry = new TextGeometry(text, {
      font: font,
      ...parameters
    });
    // Compute bounding box
    textGeometry.computeBoundingBox();

    // Compute text width and height
    const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
    const textHeight = textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y;

    // Adjust position to center horizontally
    textGeometry.translate(-textWidth / 2, 0, 0);

    // Adjust position to center vertically
    textGeometry.translate(0, -textHeight / 2, 0);

    resolve(textGeometry);
  });
}

// Load the font
const fontPromise = new Promise((resolve, reject) => {
  const fontLoader = new FontLoader();
  fontLoader.load('./node_modules/three/examples/fonts/helvetiker_regular.typeface.json', resolve);
});

// Define parameters
const textParameters = {
  size: 5,
  height: 0,
  curveSegments: 12,
  bevelEnabled: false,
  bevelThickness: 0,
  bevelSize: 0,
  bevelOffset: 0,
  bevelSegments: 0
};

let showText = false;
var textgroup = [];
const Textmaterial = new THREE.MeshBasicMaterial({ color: 0x8A2BE2 });
const BeamTextmaterial = new THREE.MeshBasicMaterial({ color: 0xCC00CC });
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////77//////////////////

function main() {



  /////////////////////////////////////////////////////////////////////////////////
  //GUI
  gui = new GUI();
  gui.add(parameters, "test");
  gui.add({ ShowText: showText }, 'ShowText').onChange((value) => {
    showText = value;
    toggleTextGroupVisibility();
  });

  function toggleTextGroupVisibility() {
    textgroup.forEach((object) => {
      object.visible = showText;
    });
  }

  //Add Objects
  const addObjectFolder = gui.addFolder("Add Objects");
  addObjectFolder.add(parameters, "Joint");
  addObjectFolder.add(parameters, "CollisionTest");
  addObjectFolder.add(parameters, "Beam");
  addObjectFolder.add(parameters, "Bar");
  //Add Object Settings
  const selectedObjectFolder = gui.addFolder("Selected Object");
  widthController = selectedObjectFolder.add(parameters, "width");
  heightController = selectedObjectFolder.add(parameters, "height");
  depthController = selectedObjectFolder.add(parameters, "depth");
  selectedObjectFolder.add(parameters, "delete");

  const JointObjectFolder = gui.addFolder("Joint settings");
  const additionalRadiusController = JointObjectFolder.add(parameters, "additionalRadius").min(0).max(10).step(0.1).name("Additional Radius").onChange(updateJointMesh);
  const additionalLengthController = JointObjectFolder.add(parameters, "additionalLength").min(0).max(50).step(1).name("Additional Length").onChange(updateJointMesh);



  //CREATE SCENE AND CAMERA
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(15, width / height, 0.1, 2000);
  camera.position.set(200, 100, 170);

  //LIGHTINGS
  ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(2, 5, 5);
  directionalLight.target.position.set(-1, -1, 0);
  scene.add(directionalLight);
  scene.add(directionalLight.target);

  //GEOMETRY INITIATION
  // Initiate first cubes
  createGrid();

  //CREATE A RENDERER
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container = document.querySelector("#threejs-container");
  let canvas = renderer.domElement;
  container.append(renderer.domElement);

  //CREATE MOUSE CONTROL
  control = new OrbitControls(camera, renderer.domElement);

  //CREATE GUMBALL
  gumball = new TransformControls(camera, renderer.domElement);


  //enable and disable the camera controlls
  gumball.addEventListener('dragging-changed', function (event) {
    control.enabled = !event.value;
  });

  //change the mode of the gumball
  window.addEventListener('keydown', function (event) {
    switch (event.code) {
      case 'KeyG':
        gumball.setMode('translate')
        break
      case 'KeyR':
        gumball.setMode('rotate')
        break
    }
  })

  //lock X,Y or Z
  //gumball.showY = false;


  //RESPONSIVE WINDOW
  //distinguish between click and drag
  let drag = false;

  function onDrag() {
    canvas.addEventListener(
      'mousedown', () => drag = false);

    canvas.addEventListener(
      'mousemove', () => drag = true);

    if (drag == false) {
      onClick()
    }
  }

  window.addEventListener("resize", handleResize);
  document.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("click", onDrag);
  window.addEventListener("keydown", onKey);

  //RAYCASTER
  group = new THREE.Group();
  scene.add(group);
  const controls = control;
  controls.minDistance = 2;
  controls.maxDistance = 1000;

  //Transform selected Objects
  widthController.onChange(function (v) {
    transformedObject.scale.x = scaleFactor(
      parameters.width,
      transformedObject.geometry.parameters.width
    );
  });

  heightController.onChange(function (v) {
    transformedObject.scale.y = scaleFactor(
      parameters.height,
      transformedObject.geometry.parameters.height
    );
  });

  depthController.onChange(function (v) {
    transformedObject.scale.z = scaleFactor(
      parameters.depth,
      transformedObject.geometry.parameters.depth
    );
  });

  //EXECUTE THE UPDATE
  animate();
}

//-----------------------------------------------------------------------------------
//HELPER FUNCTIONS
//-----------------------------------------------------------------------------------
//GEOMETRY FUNCTIONS

// Create Grid
function createGrid() {
  scene.add(new THREE.GridHelper(100, 100, 0xd3d3d3, 0xd3d3d3));
  scene.add(new THREE.GridHelper(100, 10, 0x151515, 0x151515));
}






//BOARDS
// Create Boards
function collisionTest() {

  const position1 = new THREE.Vector3(5,5,5);
  const position2 = new THREE.Vector3(0,0,0);
  
  const size = new THREE.Vector3(1, 1, 1);
  const geometry = new THREE.CylinderGeometry(size.x, size.y, 10, 16);
  
  geometry.userData.obb = new OBB();
  geometry.userData.obb.halfSize.copy( size ).multiplyScalar( 0.5 );
  
  const object1 = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color: 0x00ff00 }));
  const object2 = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color: 0x00ff00 }));

  object2.position.copy(position2);
  object1.position.copy(position1);

  object1.rotation.x = Math.PI/4;
 
  object1.matrixAutoUpdate = true;
  object1.userData.obb = new OBB();
  object1.userData.obb.position = new THREE.Vector3();
 
  object1.userData.obb.halfSize.copy(size).multiplyScalar(0.5);


  object2.matrixAutoUpdate = true;
  object2.userData.obb = new OBB();
  object2.userData.obb.halfSize.copy(size).multiplyScalar(0.5);

  let hitbox1 = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { color: 0x000000, wireframe: true } ) );
  let hitbox2 = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { color: 0x000000, wireframe: true } ) );
  
  // hitbox1.position.copy(position1);
  // hitbox2.position.copy(position1);

  object1.add(hitbox1);
  object2.add(hitbox2);

  scene.add( object1 );
  scene.add( object2 );
  
  console.log(scene)
  
  // now perform intersection test
    object1.userData.obb.copy(object1.geometry.userData.obb)
    object2.userData.obb.copy(object2.geometry.userData.obb)
    object1.userData.obb.applyMatrix4(object1.matrixWorld)
    object2.userData.obb.applyMatrix4(object2.matrixWorld)   

  animate();
}



//update the Joint mesh
function updateJointMesh() {
  // Check if FinalTubexmesh exists before attempting to remove it

  for (var i = 0; i < tubeCounter; i++) {

    console.log(sceneObjects);
    var Geometry = scene.getObjectByName('JointTube' + tubeCounter);
    scene.remove(Geometry);
    tubeCounter--
    // createBeam();

  }
}


//Remove 3D Objects and clean the caches
function removeObject(sceneObject) {

  if (!(sceneObject instanceof THREE.Object3D)) return;

  //Remove the geometry to free GPU resources
  if (sceneObject.geometry) {
    gumball.detach();
    sceneObject.geometry.dispose();
  }


  //Remove the material to free GPU resources
  if (sceneObject.material) {
    if (sceneObject.material instanceof Array) {
      sceneObject.material.forEach((material) => material.dispose());
    } else {
      sceneObject.material.dispose();
    }
  }

  //Remove Gumblall


  //Remove object from scene
  sceneObject.removeFromParent();
}

function removeSelectedObject() {
  removeObject(transformedObject);
}

//RESPONSIVE
function handleResize() {
  width = window.innerWidth;
  height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  renderer.render(scene, camera);
}

//RAYCAST
function onPointerMove(event) {
  if (selectedObject) {
    if (selectedObject !== transformedObject) {
      selectedObject.material.color.set("#69f");
    }
    selectedObject = null;
  }

  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);

  const intersects = raycaster.intersectObject(group, true);

  if (intersects.length > 0) {
    const res = intersects.filter(function (res) {
      return res && res.object;
    })[0];

    if (res && res.object) {
      selectedObject = res.object;
      if (selectedObject !== transformedObject) {
        selectedObject.material.color.set("#f00");
      }
    }
  }
}

//CLICK
function onClick() {
  if (selectedObject) {
    transformedObject = selectedObject;
    transformedObject.material.color.set("#ff0");
    parameters.width = transformedObject.geometry.parameters.width;
    parameters.height = transformedObject.geometry.parameters.height;
    parameters.depth = transformedObject.geometry.parameters.depth;
    widthController.updateDisplay();
    heightController.updateDisplay();
    depthController.updateDisplay();
    //ENABLE GUMBALL
    gumball.attach(selectedObject);
    scene.add(gumball);
  } else if (transformedObject) {
    transformedObject.material.color.set("#69f");
    transformedObject = null;
    //Disable GUMBALL
    gumball.detach();
  }
}

function onKey() {
  if (event.key === "Escape" || event.keyCode === 27) {
    transformedObject.material.color.set("#69f");
    transformedObject = null;
    //Disable GUMBALL
    gumball.detach();
  }
  if (event.key === "Backspace" || event.keyCode === 8) {
    removeSelectedObject();
  }
}

function scaleFactor(newValue, oldValue) {
  return newValue / oldValue;
}

//ANIMATE AND RENDER
function animate() {
  requestAnimationFrame(animate);

  control.update();

  for (var i = 0; i < textgroup.length; i++) {
    if (textgroup[i] !== undefined) {
      textgroup[i].lookAt(camera.position);
      textgroup[i].visible = showText;
    }
  }


  renderer.render(scene, camera);
}
//-----------------------------------------------------------------------------------
// CLASS
//-----------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------
// EXECUTE MAIN
//-----------------------------------------------------------------------------------

main();