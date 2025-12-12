/**
 * src/shapes.js
 * Restored Clean implementation: Static Solid 3D Shapes vs Separate Flat Net Views.
 * Uses the ROBUST Pivot logic for Nets to ensure correctness.
 * NO Animation - just mode switching.
 */

let scene, camera, renderer, controls;
let currentMesh = null;
let container;
let currentMode = 'solid';

// Default parameters
const defaultParams = {
    cube: { s: 5 },
    box: { p: 6, l: 4, t: 3 },
    cylinder: { r: 3, t: 7 },
    pyramid: { s: 8, t: 10 },
    cone: { r: 5, t: 10 },
    prism: { a: 6, t_alas: 5, t_prisma: 10 }
};

// ===================== HELPERS =====================

function createMesh(geometry, color) {
    const material = new THREE.MeshStandardMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
        flatShading: true
    });
    const mesh = new THREE.Mesh(geometry, material);
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 }));
    mesh.add(line);
    return mesh;
}

function createFlatFace(geometry, color) {
    const material = new THREE.MeshStandardMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
    });
    const mesh = new THREE.Mesh(geometry, material);
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 }));
    mesh.add(line);
    return mesh;
}

function createPivot(x, y, z) {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, z);
    return pivot;
}

// ===================== SOLID SHAPES =====================

function createSolidCube(params) {
    const { s } = params;
    const geom = new THREE.BoxGeometry(s, s, s);
    const mesh = createMesh(geom, 0x4a90e2);
    mesh.position.y = s / 2;
    return mesh;
}

function createSolidBox(params) {
    const { p, l, t } = params;
    const geom = new THREE.BoxGeometry(p, t, l);
    const mesh = createMesh(geom, 0xe24a4a);
    mesh.position.y = t / 2;
    return mesh;
}

function createSolidCylinder(params) {
    const { r, t } = params;
    const geom = new THREE.CylinderGeometry(r, r, t, 32);
    const mesh = createMesh(geom, 0x4a90e2);
    mesh.position.y = t / 2;
    return mesh;
}

function createSolidPyramid(params) {
    const { s, t } = params;
    const radius = s / Math.sqrt(2);
    const geom = new THREE.ConeGeometry(radius, t, 4);
    geom.rotateY(Math.PI / 4);
    const mesh = createMesh(geom, 0xe2a04a);
    mesh.position.y = t / 2;
    return mesh;
}

function createSolidCone(params) {
    const { r, t } = params;
    const geom = new THREE.ConeGeometry(r, t, 32);
    const mesh = createMesh(geom, 0xe24a90);
    mesh.position.y = t / 2;
    return mesh;
}

function createSolidPrism(params) {
    const { a, t_alas, t_prisma } = params;
    const shape = new THREE.Shape();
    shape.moveTo(-a / 2, 0);
    shape.lineTo(a / 2, 0);
    shape.lineTo(0, t_alas);
    shape.closePath();

    // Extrude depth
    const extrudeSettings = { depth: t_prisma, bevelEnabled: false };
    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.translate(0, 0, -t_prisma / 2);
    // Lay it on the rectangular base so height is t_alas?
    // User liked the previous solid orientation.
    geom.rotateX(-Math.PI / 2);
    const mesh = createMesh(geom, 0x4ae290);
    return mesh;
}

// ===================== NET SHAPES (STATIC - NO ANIMATION) =====================

/**
 * Cube Net
 */
function createNetCube(params) {
    const { s } = params;
    const group = new THREE.Group();
    const color = 0x4a90e2;
    const geom = new THREE.PlaneGeometry(s, s);

    // Direct positioning is easiest for static nets
    function addFace(px, pz) {
        const mesh = createFlatFace(geom.clone(), color);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(px, 0.01, pz);
        group.add(mesh);
    }

    addFace(0, 0);       // Center
    addFace(0, -s);      // Top (Back)
    addFace(0, s);       // Bottom (Front)
    addFace(-s, 0);      // Left
    addFace(s, 0);       // Right
    addFace(s * 2, 0);   // Back-Back (Far Right)

    return group;
}

/**
 * Box Net
 */
function createNetBox(params) {
    const { p, l, t } = params;
    const group = new THREE.Group();
    const color = 0xe24a4a;

    // Center (Bottom): p x l
    const bottom = createFlatFace(new THREE.PlaneGeometry(p, l), color);
    bottom.rotation.x = -Math.PI / 2;
    bottom.position.y = 0.01;
    group.add(bottom);

    // Front (p x t)
    const front = createFlatFace(new THREE.PlaneGeometry(p, t), color);
    front.rotation.x = -Math.PI / 2;
    front.position.set(0, 0.01, l / 2 + t / 2);
    group.add(front);

    // Back (p x t)
    const back = createFlatFace(new THREE.PlaneGeometry(p, t), color);
    back.rotation.x = -Math.PI / 2;
    back.position.set(0, 0.01, -l / 2 - t / 2);
    group.add(back);

    // Top (p x l)
    const top = createFlatFace(new THREE.PlaneGeometry(p, l), color);
    top.rotation.x = -Math.PI / 2;
    top.position.set(0, 0.01, -l / 2 - t - l / 2);
    group.add(top);

    // Left (t x l) (Note: t is width in Net layout)
    const sideGeom = new THREE.PlaneGeometry(t, l);
    const left = createFlatFace(sideGeom, color);
    left.rotation.x = -Math.PI / 2;
    left.position.set(-p / 2 - t / 2, 0.01, 0);
    group.add(left);

    // Right (t x l)
    const right = createFlatFace(sideGeom.clone(), color);
    right.rotation.x = -Math.PI / 2;
    right.position.set(p / 2 + t / 2, 0.01, 0);
    group.add(right);

    return group;
}

/**
 * Cylinder Net
 */
function createNetCylinder(params) {
    const { r, t } = params;
    const group = new THREE.Group();
    const color = 0x4a90e2;
    const circ = 2 * Math.PI * r;

    // Mantle
    const mantle = createFlatFace(new THREE.PlaneGeometry(circ, t), color);
    mantle.rotation.x = -Math.PI / 2;
    mantle.position.y = 0.01;
    group.add(mantle);

    // Top Circle
    const capGeom = new THREE.CircleGeometry(r, 64);
    const top = createFlatFace(capGeom, color);
    top.rotation.x = -Math.PI / 2;
    top.position.set(0, 0.01, -t / 2 - r);
    group.add(top);

    // Bottom Circle
    const bot = createFlatFace(capGeom.clone(), color);
    bot.rotation.x = -Math.PI / 2;
    bot.position.set(0, 0.01, t / 2 + r);
    group.add(bot);

    return group;
}

/**
 * Pyramid Net
 */
function createNetPyramid(params) {
    const { s, t } = params;
    const group = new THREE.Group();
    const color = 0xe2a04a;
    const half = s / 2;
    const slant = Math.sqrt(t * t + half * half);

    // Base
    const base = createFlatFace(new THREE.PlaneGeometry(s, s), color);
    base.rotation.x = -Math.PI / 2;
    base.position.y = 0.01;
    group.add(base);

    // Triangle Geom
    const triShape = new THREE.Shape();
    triShape.moveTo(-half, 0);
    triShape.lineTo(half, 0);
    triShape.lineTo(0, slant);
    const triGeom = new THREE.ShapeGeometry(triShape);

    function attachTri(px, pz, roty) {
        const pivot = createPivot(px, 0.01, pz);
        const mesh = createFlatFace(triGeom.clone(), color);
        // Lay flat pointing outwards
        mesh.rotation.x = -Math.PI / 2;
        pivot.rotation.y = roty;
        pivot.add(mesh);
        group.add(pivot);
    }

    // North (Back) - Pointing -Z
    attachTri(0, -half, 0);

    // South (Front) - Pointing +Z (180 deg)
    attachTri(0, half, Math.PI);

    // East (Right) - Pointing +X (-90 deg)
    attachTri(half, 0, -Math.PI / 2);

    // West (Left) - Pointing -X (+90 deg)
    attachTri(-half, 0, Math.PI / 2);

    return group;
}

/**
 * Cone Net
 */
function createNetCone(params) {
    const { r, t } = params;
    const group = new THREE.Group();
    const color = 0xe24a90;
    const slant = Math.sqrt(r * r + t * t);
    const sectorAngle = (2 * Math.PI * r) / slant;

    // Sector
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    // Symmetric around Z- axis (North)? Or +Z?
    // Let's standardise sector center around -Z axis (angle PI/2 in 2D space? No, PI/2 is +Y).
    // In ShapeGeometry: X, Y.
    // +Y usually maps to -Z after RotX(-90).
    // So let's center sector around +Y axis in Shape space.
    const startA = Math.PI / 2 - sectorAngle / 2;
    const endA = Math.PI / 2 + sectorAngle / 2;
    shape.absarc(0, 0, slant, startA, endA, false);
    shape.lineTo(0, 0);

    const sector = createFlatFace(new THREE.ShapeGeometry(shape), color);
    sector.rotation.x = -Math.PI / 2;
    sector.position.y = 0.01;
    group.add(sector);

    // Circle
    // Top of arc is at Y=slant (in Shape) -> Z=-slant (in 3D, if centered).
    // Circle touches there.
    const circ = createFlatFace(new THREE.CircleGeometry(r, 64), color);
    circ.rotation.x = -Math.PI / 2;
    circ.position.set(0, 0.01, -slant - r);
    group.add(circ);

    return group;
}

/**
 * Prism Net
 */
function createNetPrism(params) {
    const { a, t_alas, t_prisma } = params;
    const group = new THREE.Group();
    const color = 0x4ae290;
    const halfBase = a / 2;
    const sideLen = Math.sqrt(halfBase * halfBase + t_alas * t_alas);

    // Main Panel: a x t_prisma
    const main = createFlatFace(new THREE.PlaneGeometry(a, t_prisma), color);
    main.rotation.x = -Math.PI / 2;
    main.position.y = 0.01;
    group.add(main);

    // Side Wings (sideLen x t_prisma)
    const sideGeom = new THREE.PlaneGeometry(sideLen, t_prisma);

    // Left Wing
    const left = createFlatFace(sideGeom, color);
    left.rotation.x = -Math.PI / 2;
    left.position.set(-a / 2 - sideLen / 2, 0.01, 0);
    group.add(left);

    // Right Wing
    const right = createFlatFace(sideGeom.clone(), color);
    right.rotation.x = -Math.PI / 2;
    right.position.set(a / 2 + sideLen / 2, 0.01, 0);
    group.add(right);

    // Triangles
    const triShape = new THREE.Shape();
    triShape.moveTo(-halfBase, 0);
    triShape.lineTo(halfBase, 0);
    triShape.lineTo(0, t_alas);
    const triGeom = new THREE.ShapeGeometry(triShape);

    function attachTri(pz, rotY) {
        const pivot = createPivot(0, 0.01, pz);
        const mesh = createFlatFace(triGeom.clone(), color);
        mesh.rotation.x = -Math.PI / 2; // Flat
        pivot.rotation.y = rotY;
        pivot.add(mesh);
        group.add(pivot);
    }

    // Back Triangle (Attached to Z- edge): Pointing -Z
    attachTri(-t_prisma / 2, 0);

    // Front Triangle (Attached to Z+ edge): Pointing +Z
    attachTri(t_prisma / 2, Math.PI);

    return group;
}

// ===================== SCENE =====================

function initScene() {
    container = document.getElementById('canvas-container');
    if (!container) return false;
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(25, 25, 25);
    camera.lookAt(0, 0, 0);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(10, 20, 10);
    scene.add(dir);
    scene.add(new THREE.GridHelper(50, 50, 0x888888, 0xe0e0e0));

    loadShape('cube', null, 'solid');
    animate();
    window.addEventListener('resize', onWindowResize);
    return true;
}

function onWindowResize() {
    if (camera) {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }
}

function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    renderer.render(scene, camera);
}

function loadShape(type, params, mode) {
    if (currentMesh) {
        scene.remove(currentMesh);
        currentMesh = null;
    }
    const p = params || defaultParams[type];
    currentMode = mode || currentMode || 'solid';

    const factory = currentMode === 'solid' ?
        { cube: createSolidCube, box: createSolidBox, cylinder: createSolidCylinder, pyramid: createSolidPyramid, cone: createSolidCone, prism: createSolidPrism } :
        { cube: createNetCube, box: createNetBox, cylinder: createNetCylinder, pyramid: createNetPyramid, cone: createNetCone, prism: createNetPrism };

    if (factory[type]) {
        currentMesh = factory[type](p);
        scene.add(currentMesh);
    }
}

// Deprecated updateFold but included stub
function updateFold(val) { }

// API
window.SceneManager = {
    initScene,
    loadShape,
    updateFold,
    resetCamera: () => { if (controls) controls.reset(); },
    showSolid: (t, p) => loadShape(t, p, 'solid'),
    showNet: (t, p) => loadShape(t, p, 'net')
};
