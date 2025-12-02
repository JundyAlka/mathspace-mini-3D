/**
 * src/shapes.js
 * Handles Three.js scene setup and "Hinged" shape creation for net animations.
 */

let scene, camera, renderer, controls;
let currentMesh = null;
let container;

// Default parameters (used for sizing the nets)
const defaultParams = {
    cube: { s: 5 },
    box: { p: 6, l: 4, t: 3 },
    cylinder: { r: 3, t: 7 },
    pyramid: { s: 8, t: 10 },
    cone: { r: 5, t: 10 },
    prism: { a: 6, t_alas: 5, t_prisma: 10 }
};

/**
 * Initializes the Three.js scene.
 */
function initScene() {
    try {
        container = document.getElementById('canvas-container');
        if (!container) return false;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);

        camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.set(0, 20, 20); // Higher angle to see the net better

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.shadowMap.enabled = true;
        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        if (typeof THREE.OrbitControls === 'function') {
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
        }

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        scene.add(dirLight);

        // Grid
        const gridHelper = new THREE.GridHelper(50, 50);
        gridHelper.position.y = -0.1;
        scene.add(gridHelper);

        // Initial load
        loadShape('cube');

        animate();
        window.addEventListener('resize', onWindowResize);
        return true;
    } catch (error) {
        console.error('Error initializing scene:', error);
        return false;
    }
}

function onWindowResize() {
    if (camera && renderer && container) {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }
}

function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    if (renderer && scene && camera) renderer.render(scene, camera);
}

function resetCamera() {
    if (controls) controls.reset();
    camera.position.set(0, 20, 20);
}

/**
 * Helper to create a flat face mesh.
 * Origin is at the center of the face.
 */
function createFaceGeometry(width, height) {
    return new THREE.BoxGeometry(width, 0.2, height); // Thin box as a face
}

function createMaterial(color = 0x4a90e2) {
    return new THREE.MeshStandardMaterial({
        color: color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
    });
}

/**
 * Creates a Pivot Group.
 * @param {number} x Position X
 * @param {number} y Position Y (usually 0)
 * @param {number} z Position Z
 * @param {string} axis 'x', 'y', or 'z'
 * @returns {THREE.Group}
 */
function createPivot(x, y, z) {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, z);
    return pivot;
}

// --- Shape Creation Functions ---

function createHingedCube(params) {
    const s = params.s;
    const root = new THREE.Group();
    const mat = createMaterial(0x4a90e2);
    const geom = createFaceGeometry(s, s);

    // 1. Center (Bottom)
    const center = new THREE.Mesh(geom, mat);
    root.add(center);

    // 2. North (Back) - Hinged at z = -s/2
    const northPivot = createPivot(0, 0, -s / 2);
    const north = new THREE.Mesh(geom, mat);
    north.position.set(0, 0, -s / 2); // Relative to pivot
    northPivot.add(north);
    center.add(northPivot);

    // 3. South (Front) - Hinged at z = s/2
    const southPivot = createPivot(0, 0, s / 2);
    const south = new THREE.Mesh(geom, mat);
    south.position.set(0, 0, s / 2);
    southPivot.add(south);
    center.add(southPivot);

    // 4. East (Right) - Hinged at x = s/2
    const eastPivot = createPivot(s / 2, 0, 0);
    const east = new THREE.Mesh(geom, mat);
    east.position.set(s / 2, 0, 0);
    eastPivot.add(east);
    center.add(eastPivot);

    // 5. West (Left) - Hinged at x = -s/2
    const westPivot = createPivot(-s / 2, 0, 0);
    const west = new THREE.Mesh(geom, mat);
    west.position.set(-s / 2, 0, 0);
    westPivot.add(west);
    center.add(westPivot);

    // 6. Top - Attached to North
    const topPivot = createPivot(0, 0, -s); // Edge of North (which is s long)
    // Wait, North is at (0,0,-s/2). Its far edge is at (0,0,-s) relative to pivot?
    // North mesh is centered at (0,0,-s/2). Size s.
    // Local Z extends from 0 to -s.
    // So edge is at -s.
    // Correct.
    const top = new THREE.Mesh(geom, mat);
    top.position.set(0, 0, -s / 2);
    topPivot.add(top);
    // Attach topPivot to North PIVOT? No, to North MESH?
    // If attached to North Mesh, it moves with it.
    // North Mesh is child of North Pivot.
    // So attach to North Mesh? No, attach to North Pivot?
    // If attached to North Pivot, it rotates with North Pivot.
    // But we want it to rotate relative to North Mesh.
    // So attach to North Pivot is fine, but position must be correct.
    // Position relative to North Pivot: (0, 0, -s).
    northPivot.add(topPivot);

    // Update Function
    root.userData.updateFold = (val) => {
        // val: 0 (closed) -> 1 (open)
        // We want 0 (closed) -> 90 deg rotation
        // Open (1) -> 0 deg rotation
        const angle = (1 - val) * (Math.PI / 2);

        northPivot.rotation.x = angle; // Rotates Up
        southPivot.rotation.x = -angle;
        eastPivot.rotation.z = -angle;
        westPivot.rotation.z = angle;
        topPivot.rotation.x = angle;
    };

    return root;
}

function createHingedBox(params) {
    const { p, l, t } = params; // p=x, l=z, t=y (height)

    const root = new THREE.Group();
    const mat = createMaterial(0xe24a4a);

    // Bottom (p x l)
    const bottomGeom = createFaceGeometry(p, l);
    const bottom = new THREE.Mesh(bottomGeom, mat);
    root.add(bottom);

    // North (Back) - attached to z = -l/2. Dims: p x t
    const backGeom = createFaceGeometry(p, t);
    const northPivot = createPivot(0, 0, -l / 2);
    const north = new THREE.Mesh(backGeom, mat);
    north.position.set(0, 0, -t / 2);
    northPivot.add(north);
    bottom.add(northPivot);

    // South (Front) - attached to z = l/2. Dims: p x t
    const southPivot = createPivot(0, 0, l / 2);
    const south = new THREE.Mesh(backGeom, mat);
    south.position.set(0, 0, t / 2);
    southPivot.add(south);
    bottom.add(southPivot);

    // East (Right) - attached to x = p/2. Dims: t x l (Depth is l, Height is t)
    // In flat net, it extends in X. Width is t. Height is l.
    const rightGeom = createFaceGeometry(t, l);
    const eastPivot = createPivot(p / 2, 0, 0);
    const east = new THREE.Mesh(rightGeom, mat);
    east.position.set(t / 2, 0, 0);
    eastPivot.add(east);
    bottom.add(eastPivot);

    // West (Left)
    const westPivot = createPivot(-p / 2, 0, 0);
    const west = new THREE.Mesh(rightGeom, mat);
    west.position.set(-t / 2, 0, 0);
    westPivot.add(west);
    bottom.add(westPivot);

    // Top - Attached to North. Dims: p x l
    const topGeom = createFaceGeometry(p, l);
    const topPivot = createPivot(0, 0, -t); // Edge of North (height t)
    const top = new THREE.Mesh(topGeom, mat);
    top.position.set(0, 0, -l / 2);
    topPivot.add(top);
    northPivot.add(topPivot);

    root.userData.updateFold = (val) => {
        const angle = (1 - val) * (Math.PI / 2);
        northPivot.rotation.x = angle;
        southPivot.rotation.x = -angle;
        eastPivot.rotation.z = -angle;
        westPivot.rotation.z = angle;
        topPivot.rotation.x = angle;
    };

    return root;
}

function createHingedPrism(params) {
    const { a, t_alas, t_prisma } = params;
    const sideLen = Math.sqrt((a / 2) ** 2 + t_alas ** 2);

    const root = new THREE.Group();
    const mat = createMaterial(0x4ae290);

    // Center Face (Bottom Rectangle): a x t_prisma
    const centerGeom = createFaceGeometry(a, t_prisma);
    const center = new THREE.Mesh(centerGeom, mat);
    root.add(center);

    // Left Wing (Side Rectangle)
    const sideGeom = createFaceGeometry(sideLen, t_prisma);
    const leftPivot = createPivot(-a / 2, 0, 0);
    const left = new THREE.Mesh(sideGeom, mat);
    left.position.set(-sideLen / 2, 0, 0);
    leftPivot.add(left);
    center.add(leftPivot);

    // Right Wing (Side Rectangle)
    const rightPivot = createPivot(a / 2, 0, 0);
    const right = new THREE.Mesh(sideGeom, mat);
    right.position.set(sideLen / 2, 0, 0);
    rightPivot.add(right);
    center.add(rightPivot);

    // Top Triangle
    const triShape = new THREE.Shape();
    triShape.moveTo(-a / 2, 0);
    triShape.lineTo(a / 2, 0);
    triShape.lineTo(0, t_alas);
    triShape.lineTo(-a / 2, 0);
    const triGeom = new THREE.ShapeGeometry(triShape);
    triGeom.rotateX(-Math.PI / 2);

    const topTriPivot = createPivot(0, 0, -t_prisma / 2);
    const topTri = new THREE.Mesh(triGeom, mat);
    topTri.position.set(0, 0, 0);
    topTriPivot.add(topTri);
    center.add(topTriPivot);

    // Bottom Triangle
    const botTriPivot = createPivot(0, 0, t_prisma / 2);
    const botTri = new THREE.Mesh(triGeom, mat);
    botTri.rotation.y = Math.PI;
    botTriPivot.add(botTri);
    center.add(botTriPivot);

    const wingAngle = Math.atan2(t_alas, a / 2);

    root.userData.updateFold = (val) => {
        const currentWingAngle = (1 - val) * wingAngle;
        leftPivot.rotation.z = currentWingAngle;
        rightPivot.rotation.z = -currentWingAngle;

        const triAngle = (1 - val) * (Math.PI / 2);
        topTriPivot.rotation.x = triAngle;
        botTriPivot.rotation.x = -triAngle;

        // Rotate entire root to stand upright when closed
        // When val=0 (closed), rotate 90 degrees around X to stand up
        // When val=1 (open), keep flat
        root.rotation.x = (1 - val) * (Math.PI / 2);
    };

    return root;
}

function createHingedPyramid(params) {
    const { s, t } = params;
    const root = new THREE.Group();
    const mat = createMaterial(0xe2a04a);

    // Base
    const baseGeom = createFaceGeometry(s, s);
    const base = new THREE.Mesh(baseGeom, mat);
    root.add(base);

    // Triangle Geometry
    const slantHeight = Math.sqrt(t ** 2 + (s / 2) ** 2);

    const triShape = new THREE.Shape();
    triShape.moveTo(-s / 2, 0);
    triShape.lineTo(s / 2, 0);
    triShape.lineTo(0, slantHeight);
    triShape.lineTo(-s / 2, 0);
    const triGeom = new THREE.ShapeGeometry(triShape);
    triGeom.rotateX(-Math.PI / 2); // Lie flat

    // 4 Sides
    const pivots = [];
    const positions = [
        { x: 0, z: -s / 2, rotY: 0 }, // North
        { x: 0, z: s / 2, rotY: Math.PI }, // South
        { x: s / 2, z: 0, rotY: -Math.PI / 2 }, // East
        { x: -s / 2, z: 0, rotY: Math.PI / 2 } // West
    ];

    positions.forEach(pos => {
        const pivot = createPivot(pos.x, 0, pos.z);
        pivot.rotation.y = pos.rotY;
        const tri = new THREE.Mesh(triGeom, mat);
        tri.position.set(0, 0, 0);
        pivot.add(tri);
        base.add(pivot);
        pivots.push(pivot);
    });

    const targetAngle = Math.atan2(t, s / 2);

    root.userData.updateFold = (val) => {
        const angle = (1 - val) * targetAngle;
        pivots.forEach(p => p.rotation.x = angle);
    };

    return root;
}

function createHingedCylinder(params) {
    const { r, t } = params;
    const segments = 32;
    const segmentWidth = (2 * Math.PI * r) / segments;

    const root = new THREE.Group();
    const mat = createMaterial(0x4a90e2);

    // Strip Container
    const stripContainer = new THREE.Group();
    stripContainer.position.set(-(Math.PI * r), 0, 0);
    root.add(stripContainer);

    const faceGeom = createFaceGeometry(segmentWidth, t);
    const circleGeom = new THREE.CircleGeometry(r, 32);
    circleGeom.rotateX(-Math.PI / 2);

    let currentParent = stripContainer;
    const stripPivots = [];

    for (let i = 0; i < segments; i++) {
        const segGroup = new THREE.Group();
        const mesh = new THREE.Mesh(faceGeom, mat);
        mesh.position.set(segmentWidth / 2, 0, 0);
        segGroup.add(mesh);

        currentParent.add(segGroup);

        // Attach circles to middle segment
        if (i === Math.floor(segments / 2)) {
            const tP = createPivot(segmentWidth / 2, 0, -t / 2);
            const tC = new THREE.Mesh(circleGeom, mat);
            tC.position.set(0, 0, -r);
            tP.add(tC);
            segGroup.add(tP);

            const bP = createPivot(segmentWidth / 2, 0, t / 2);
            const bC = new THREE.Mesh(circleGeom, mat);
            bC.position.set(0, 0, r);
            bP.add(bC);
            segGroup.add(bP);

            stripContainer.userData.topPivot = tP;
            stripContainer.userData.botPivot = bP;
        }

        if (i < segments - 1) {
            const nextPivot = createPivot(segmentWidth, 0, 0);
            segGroup.add(nextPivot);
            stripPivots.push(nextPivot);
            currentParent = nextPivot;
        }
    }

    root.userData.updateFold = (val) => {
        const anglePerSeg = (2 * Math.PI) / segments;
        const currentAngle = (1 - val) * anglePerSeg;

        stripPivots.forEach(p => p.rotation.z = currentAngle);

        const circleAngle = (1 - val) * (Math.PI / 2);
        if (stripContainer.userData.topPivot) {
            stripContainer.userData.topPivot.rotation.x = circleAngle;
            stripContainer.userData.botPivot.rotation.x = -circleAngle;
        }
    };

    return root;
}

function createHingedCone(params) {
    const { r, t } = params;
    const segments = 24; // Reduced for clearer animation
    const root = new THREE.Group();
    const mat = createMaterial(0xe24a90);

    // Calculate sector properties
    const slantHeight = Math.sqrt(t ** 2 + r ** 2);
    const circumference = 2 * Math.PI * r;
    const sectorAngle = circumference / slantHeight; // Total angle of the sector in radians
    const segmentAngle = sectorAngle / segments; // Angle per triangle segment

    // Triangle dimensions for each segment
    const segBase = (circumference / segments);

    // Create triangle geometry
    const triShape = new THREE.Shape();
    triShape.moveTo(-segBase / 2, 0);
    triShape.lineTo(segBase / 2, 0);
    triShape.lineTo(0, slantHeight);
    triShape.lineTo(-segBase / 2, 0);
    const triGeom = new THREE.ShapeGeometry(triShape);
    triGeom.rotateX(-Math.PI / 2); // Lie flat on XZ plane

    // Create chained segments
    const sectorContainer = new THREE.Group();
    root.add(sectorContainer);

    let currentParent = sectorContainer;
    const pivots = [];

    for (let i = 0; i < segments; i++) {
        const segGroup = new THREE.Group();
        const mesh = new THREE.Mesh(triGeom, mat);

        if (i === 0) {
            // First segment - anchor
            mesh.position.set(0, 0, slantHeight / 2);
            segGroup.add(mesh);
            currentParent.add(segGroup);
        } else {
            // Subsequent segments - hinged to previous
            mesh.position.set(0, 0, slantHeight / 2);
            segGroup.add(mesh);

            // Create pivot at the right edge of previous segment
            const pivot = createPivot(0, 0, 0);
            pivot.rotation.y = 0; // Will be animated
            pivot.add(segGroup);

            currentParent.add(pivot);
            pivots.push(pivot);
            currentParent = segGroup;
        }
    }

    // Base circle
    const circleGeom = new THREE.CircleGeometry(r, 32);
    circleGeom.rotateX(-Math.PI / 2);
    const baseCircle = new THREE.Mesh(circleGeom, mat);
    baseCircle.position.set(0, 0.05, 0);
    root.add(baseCircle);

    // Position the sector container to center it
    sectorContainer.position.set(0, 0, -slantHeight / 2);
    sectorContainer.rotation.y = -sectorAngle / 2; // Center the fan

    root.userData.updateFold = (val) => {
        // val: 0 (closed cone) -> 1 (open sector)

        // When closed (0): pivots rotate to form cone (segmentAngle between each)
        // When open (1): pivots are flat (0 rotation)

        const currentSegmentAngle = (1 - val) * segmentAngle;

        pivots.forEach((pivot, i) => {
            // Each pivot rotates around Y axis to close the fan
            pivot.rotation.y = currentSegmentAngle;
        });

        // Tilt the segments up to form the cone
        const tiltAngle = Math.atan2(r, t); // Angle from vertical
        const currentTilt = (1 - val) * tiltAngle;

        // Apply tilt to the entire sector container
        sectorContainer.rotation.x = currentTilt;
    };

    return root;
}

function loadShape(type, params) {
    if (currentMesh) {
        scene.remove(currentMesh);
        currentMesh = null;
    }

    const p = params || defaultParams[type];

    switch (type) {
        case 'cube': currentMesh = createHingedCube(p); break;
        case 'box': currentMesh = createHingedBox(p); break;
        case 'cylinder': currentMesh = createHingedCylinder(p); break;
        case 'pyramid': currentMesh = createHingedPyramid(p); break;
        case 'cone': currentMesh = createHingedCone(p); break;
        case 'prism': currentMesh = createHingedPrism(p); break;
    }

    if (currentMesh) {
        scene.add(currentMesh);
        if (currentMesh.userData.updateFold) {
            currentMesh.userData.updateFold(0); // Start closed
        }
    }
}

function updateFold(val) {
    if (currentMesh && currentMesh.userData.updateFold) {
        currentMesh.userData.updateFold(val);
    }
}

window.SceneManager = {
    initScene,
    loadShape,
    updateFold,
    resetCamera,
    defaultParams
};
