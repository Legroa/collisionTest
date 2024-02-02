

//IMPORT MODULES
import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import GUI, { Controller } from "lil-gui";
import { CSG } from "./THREE-CSGMesh/dist/client/CSGMesh.js";
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
//'./node_modules/three/examples/fonts/helvetiker_regular.typeface.json'

 // Create a scene
var scene = new THREE.Scene();

// Create a renderer
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create two long cylinders with random dimensions, positions, and rotations
var cylinder1 = createRandomCylinder();
var cylinder2 = createRandomCylinder();

// Add cylinders to the scene
scene.add(cylinder1);
scene.add(cylinder2);

// Create bounding box helpers for cylinders
var bbHelper1 = new THREE.BoxHelper(cylinder1, 0xff0000);
var bbHelper2 = new THREE.BoxHelper(cylinder2, 0x00ff00);

// Add bounding box helpers to the scene
scene.add(bbHelper1);
scene.add(bbHelper2);

// Function to create a random cylinder
function createRandomCylinder() {
    var radius = Math.random() * 5 + 1; // Random radius between 1 and 6
    var height = Math.random() * 20 + 10; // Random height between 10 and 30

    var geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
    var material = new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff });
    var cylinder = new THREE.Mesh(geometry, material);

    // Set random position and rotation
    cylinder.position.set(Math.random() * 50 - 25, Math.random() * 20 - 10, Math.random() * 50 - 25);
    cylinder.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);

    return cylinder;
}

// Function to check for intersection between cylinders
function checkIntersection(cylinder1, cylinder2) {
  var geometry1 = cylinder1.geometry;
  var geometry2 = cylinder2.geometry;

  // Get positions from buffer attributes
  var positions1 = geometry1.attributes.position;
  var positions2 = geometry2.attributes.position;

  // Get world matrices
  cylinder1.updateMatrixWorld();
  cylinder2.updateMatrixWorld();

  // Iterate over vertices of cylinder1 and check intersection with cylinder2
  for (var i = 0; i < positions1.count; i++) {
      var vertex = new THREE.Vector3();
      vertex.fromBufferAttribute(positions1, i);
      vertex.applyMatrix4(cylinder1.matrixWorld);

      // Check if vertex intersects with cylinder2
      if (geometry2.isPointInside(vertex)) {
          return true;
      }
  }

  return false;
}

// Check for intersection between the cylinders
var isIntersecting = checkIntersection(cylinder1, cylinder2);

if (isIntersecting) {
    console.log("Cylinders intersect!");
} else {
    console.log("Cylinders do not intersect.");
}

// Render the scene
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
