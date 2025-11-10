/**
 * src/shapes.js
 * Handles Three.js scene setup, rendering, and procedural shape creation.
 */

let scene, camera, renderer, controls;
let currentMesh = null;
let container;

// Default parameters for shapes
const defaultParams = {
    cube: { s: 5 },
    box: { p: 6, l: 4, t: 3 },
    cylinder: { r: 3, t: 7 }
};

/**
 * Initializes the Three.js scene, camera, renderer, and controls.
 */
function initScene() {
    try {
        // Get container
        container = document.getElementById('canvas-container');
        if (!container) {
            console.error('Container element not found');
            return false;
        }

        // Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0); // Light gray background

        // Camera
        camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.set(10, 10, 10);

        // Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.innerHTML = ''; // Clear container
        container.appendChild(renderer.domElement);

        // Controls
        if (typeof THREE.OrbitControls === 'function') {
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.screenSpacePanning = false;
            controls.minDistance = 5;
            controls.maxDistance = 50;
        } else {
            console.error('OrbitControls not found. Make sure it is properly loaded.');
        }

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 10);
        scene.add(directionalLight);

        // Add grid helper for better visualization
        const gridHelper = new THREE.GridHelper(20, 20);
        scene.add(gridHelper);

        // Add axes helper
        const axesHelper = new THREE.AxesHelper(5);
        scene.add(axesHelper);

        // Initial shape load (Kubus)
        loadShape('cube', defaultParams.cube);

        // Start animation loop
        animate();

        // Handle window resize
        window.addEventListener('resize', onWindowResize);

        console.log('Scene initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing scene:', error);
        return false;
    }

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    // Start animation loop
    animate();
}

/**
 * Handles window resize events to keep the canvas responsive.
 */
function onWindowResize() {
    if (camera && renderer && container) {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }
}

/**
 * Animation loop for rendering and updating controls.
 */
function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true
    if (renderer && scene && camera) renderer.render(scene, camera);
}

/**
 * Resets the camera position and controls state.
 */
function resetCamera() {
    if (controls) controls.reset();
}

/**
 * Creates a material for the shapes.
 * @returns {THREE.MeshStandardMaterial} The material.
 */
function createMaterial() {
    return new THREE.MeshStandardMaterial({
        color: 0x4a90e2, // Soft blue color
        transparent: true,
        opacity: 0.8,
        wireframe: false
    });
}

/**
 * Creates a Kubus (Cube) mesh.
 * @param {number} s - Side length.
 * @returns {THREE.Mesh} The cube mesh.
 */
function createCube(s) {
    const size = s;
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = createMaterial();
    return new THREE.Mesh(geometry, material);
}

/**
 * Creates a Balok (Box) mesh.
 * @param {number} p - Length (Panjang).
 * @param {number} l - Width (Lebar).
 * @param {number} t - Height (Tinggi).
 * @returns {THREE.Mesh} The box mesh.
 */
function createBox(p, l, t) {
    // Three.js BoxGeometry is (width, height, depth)
    // We map (p, l, t) to (p, t, l) for a common orientation (p along X, l along Z, t along Y)
    const geometry = new THREE.BoxGeometry(p, t, l);
    const material = createMaterial();
    return new THREE.Mesh(geometry, material);
}

/**
 * Creates a Tabung (Cylinder) mesh.
 * @param {number} r - Radius (Jari-jari).
 * @param {number} t - Height (Tinggi).
 * @returns {THREE.Mesh} The cylinder mesh.
 */
function createCylinder(r, t) {
    // CylinderGeometry(radiusTop, radiusBottom, height, radialSegments)
    const radialSegments = 24; // Optimized for performance
    const geometry = new THREE.CylinderGeometry(r, r, t, radialSegments);
    const material = createMaterial();
    return new THREE.Mesh(geometry, material);
}

/**
 * Loads and displays a new shape in the scene.
 * @param {string} type - 'cube', 'box', or 'cylinder'.
 * @param {object} params - Shape parameters.
 */
function loadShape(type, params) {
    // 1. Remove old mesh
    if (currentMesh) {
        scene.remove(currentMesh);
        currentMesh.geometry.dispose();
        currentMesh.material.dispose();
        currentMesh = null;
    }

    // 2. Create new mesh
    let newMesh;
    switch (type) {
        case 'cube':
            newMesh = createCube(params.s);
            break;
        case 'box':
            newMesh = createBox(params.p, params.l, params.t);
            break;
        case 'cylinder':
            newMesh = createCylinder(params.r, params.t);
            break;
        default:
            console.error('Unknown shape type:', type);
            return;
    }

    // 3. Add new mesh to scene
    currentMesh = newMesh;
    scene.add(currentMesh);
}

// Export functions to the global scope
window.SceneManager = {
    initScene,
    loadShape,
    resetCamera,
    defaultParams
};
