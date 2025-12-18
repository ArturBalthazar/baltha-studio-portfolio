/**
 * MusecraftInteraction.ts
 * 
 * Handles interactive 3D editor demo for the Musecraft model.
 * Allows users to select and move mesh objects with a position gizmo,
 * giving hints of how the actual Musecraft 3D editor works.
 * 
 * Musecraft GLB Hierarchy:
 * - root (glb generated)
 *   - sandbox (mesh)
 *   - platform (mesh)
 *   - telescope (mesh)
 *   - rocket (mesh)
 *     - rocket_flames (transform node)
 */

import * as BABYLON from "babylonjs";

// ===== TYPES =====

interface MusecraftMeshes {
    sandbox: BABYLON.AbstractMesh | null;
    platform: BABYLON.AbstractMesh | null;
    telescope: BABYLON.AbstractMesh | null;
    rocket: BABYLON.AbstractMesh | null;
    rocketFlames: BABYLON.TransformNode | null;
}

interface MusecraftOriginalState {
    positions: Map<BABYLON.TransformNode, BABYLON.Vector3>;
    rotations: Map<BABYLON.TransformNode, BABYLON.Quaternion | null>;
}

interface MusecraftInteractionState {
    isInitialized: boolean;
    meshes: MusecraftMeshes;
    originalState: MusecraftOriginalState;
    selectedMesh: BABYLON.AbstractMesh | null;
    selectionOverlay: BABYLON.AbstractMesh | null;
    gizmoManager: BABYLON.GizmoManager | null;
    flameParticles: BABYLON.ParticleSystem | null;
    pointerObserver: BABYLON.Observer<BABYLON.PointerInfo> | null;
}

// ===== MODULE STATE =====

const state: MusecraftInteractionState = {
    isInitialized: false,
    meshes: {
        sandbox: null,
        platform: null,
        telescope: null,
        rocket: null,
        rocketFlames: null
    },
    originalState: {
        positions: new Map(),
        rotations: new Map()
    },
    selectedMesh: null,
    selectionOverlay: null,
    gizmoManager: null,
    flameParticles: null,
    pointerObserver: null
};

// Store references to scene and utility layer
let sceneRef: BABYLON.Scene | null = null;
let utilityLayerRef: BABYLON.UtilityLayerRenderer | null = null;

// Track if gizmo is being dragged (to disable model rotation)
let isGizmoDragging = false;

// Track pointer for click vs drag detection
let pointerDownPosition: { x: number; y: number } | null = null;
const DRAG_THRESHOLD = 10; // pixels - if mouse moves more than this, it's a drag, not a click

// ===== SELECTION OVERLAY MATERIAL =====

let overlayMaterial: BABYLON.StandardMaterial | null = null;

function getOrCreateOverlayMaterial(scene: BABYLON.Scene): BABYLON.StandardMaterial {
    // Check if material exists and is not disposed (getScene() returns null when disposed)
    if (overlayMaterial && overlayMaterial.getScene()) {
        return overlayMaterial;
    }

    overlayMaterial = new BABYLON.StandardMaterial("musecraftSelectionOverlay", scene);
    overlayMaterial.diffuseColor = new BABYLON.Color3(0.2, 1, 0.4); // Green
    overlayMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.5, 0.2); // Slight glow
    overlayMaterial.alpha = 0.3;
    overlayMaterial.backFaceCulling = false;
    overlayMaterial.zOffset = -1; // Render slightly in front to avoid z-fighting

    return overlayMaterial;
}

// ===== ROCKET FLAMES PARTICLE SYSTEM =====

// Store reference to emitter mesh for cleanup
let flameEmitterMesh: BABYLON.AbstractMesh | null = null;

function createRocketFlameParticles(
    scene: BABYLON.Scene,
    emitter: BABYLON.TransformNode
): BABYLON.ParticleSystem {
    const particles = new BABYLON.ParticleSystem("rocketFlames", 80, scene);

    // Use the same texture as atom flames
    particles.particleTexture = new BABYLON.Texture("/assets/textures/muzzle_06.png", scene);

    // Create an invisible sphere mesh as emitter (particle systems require AbstractMesh, not TransformNode)
    flameEmitterMesh = BABYLON.MeshBuilder.CreateSphere("rocketFlameEmitter", { diameter: 0.01 }, scene);
    flameEmitterMesh.parent = emitter;
    flameEmitterMesh.isVisible = false;
    particles.emitter = flameEmitterMesh;

    // Emit from a small area beneath the rocket
    const boxEmitter = new BABYLON.BoxParticleEmitter();
    boxEmitter.minEmitBox = new BABYLON.Vector3(-0.05, 0, -0.05);
    boxEmitter.maxEmitBox = new BABYLON.Vector3(0.05, 0, 0.05);
    particles.particleEmitterType = boxEmitter;

    // Direction: downward
    particles.direction1 = new BABYLON.Vector3(-0.1, -1, -0.1);
    particles.direction2 = new BABYLON.Vector3(0.1, -1, 0.1);

    // Emit power (velocity)
    particles.minEmitPower = 0.3;
    particles.maxEmitPower = 0.6;

    // Particle rate - simpler version with fewer particles
    particles.emitRate = 40;
    particles.updateSpeed = 0.02;

    // Size
    particles.minSize = 0.4;
    particles.maxSize = 0.8;

    // Scale over lifetime (grow slightly then shrink)
    particles.addSizeGradient(0, 0.8);
    particles.addSizeGradient(0.5, 1.2);
    particles.addSizeGradient(1, 0.3);

    // Lifetime
    particles.minLifeTime = 0.2;
    particles.maxLifeTime = 0.5;

    // Gravity - slight downward force
    particles.gravity = new BABYLON.Vector3(0, -10, 0);

    // Angular speed for rotation
    particles.minAngularSpeed = 0;
    particles.maxAngularSpeed = Math.PI;

    // Colors - flame colors
    particles.color1 = new BABYLON.Color4(1, 0.6, 0.2, 0.8); // Orange
    particles.color2 = new BABYLON.Color4(1, 0.3, 0.1, 0.6); // Deep orange
    particles.colorDead = new BABYLON.Color4(0.5, 0.1, 0.1, 0);

    // Blend mode for nice flame effect
    particles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;

    return particles;
}

// ===== MESH DISCOVERY =====

// Check if a node is mesh-like (duck-typing since instanceof can fail with multiple BABYLON imports)
function isMeshLike(node: any): node is BABYLON.AbstractMesh {
    return node && ('geometry' in node || ('getBoundingInfo' in node && 'material' in node));
}

// Helper to get a usable mesh from a node (for GLTF structures)
// In GLTF, named objects are often TransformNodes. We need to find a pickable mesh.
function getFirstMeshChild(node: BABYLON.Node): BABYLON.AbstractMesh | null {
    // First check if node itself is mesh-like using duck-typing
    if (isMeshLike(node)) {
        console.log("🔍 [getFirstMeshChild] Node is mesh-like:", node.name);
        return node;
    }

    // Also try instanceof as backup
    if (node instanceof BABYLON.AbstractMesh) {
        console.log("🔍 [getFirstMeshChild] Node is AbstractMesh:", node.name);
        return node;
    }

    // Try getChildMeshes() which specifically returns AbstractMesh instances
    if ('getChildMeshes' in node) {
        const childMeshes = (node as BABYLON.TransformNode).getChildMeshes(true);
        console.log(`🔍 [getFirstMeshChild] "${node.name}" has ${childMeshes.length} child meshes`);
        if (childMeshes.length > 0) {
            console.log("🔍 [getFirstMeshChild] Returning first child mesh:", childMeshes[0].name);
            return childMeshes[0];
        }
    }

    // Fallback: Look for child meshes via getChildren
    const children = node.getChildren();
    console.log(`🔍 [getFirstMeshChild] "${node.name}" getChildren returned ${children.length} items`);
    for (const child of children) {
        if (isMeshLike(child)) {
            console.log("🔍 [getFirstMeshChild] Found mesh-like child:", child.name);
            return child;
        }
        if (child instanceof BABYLON.AbstractMesh) {
            console.log("🔍 [getFirstMeshChild] Found AbstractMesh child:", child.name);
            return child;
        }
    }

    console.log("🔍 [getFirstMeshChild] No mesh found for node:", node.name);
    return null;
}

function findMusecraftMeshes(rootMesh: BABYLON.AbstractMesh): MusecraftMeshes {
    const meshes: MusecraftMeshes = {
        sandbox: null,
        platform: null,
        telescope: null,
        rocket: null,
        rocketFlames: null
    };

    // Search through all descendants
    const allNodes = rootMesh.getDescendants(false);

    // DEBUG: Log all nodes found in the GLB
    console.log("🔍 [Musecraft DEBUG] Root mesh:", rootMesh.name);
    console.log("🔍 [Musecraft DEBUG] Total descendants:", allNodes.length);
    console.log("🔍 [Musecraft DEBUG] All node names:");
    allNodes.forEach((node, index) => {
        const type = node instanceof BABYLON.AbstractMesh ? "MESH" : "NODE";
        console.log(`   ${index}: [${type}] "${node.name}"`);
    });

    for (const node of allNodes) {
        const nameLower = node.name.toLowerCase();

        // For GLTF files, named objects are often TransformNodes with primitive mesh children
        // We match exact names or names without _primitive suffix

        if (nameLower === "sandbox") {
            const mesh = getFirstMeshChild(node);
            if (mesh) {
                meshes.sandbox = mesh;
                console.log("🎨 [Musecraft] Found sandbox mesh:", mesh.name, "(from node:", node.name, ")");
            }
        }
        else if (nameLower === "platform") {
            const mesh = getFirstMeshChild(node);
            if (mesh) {
                meshes.platform = mesh;
                console.log("🎨 [Musecraft] Found platform mesh:", mesh.name, "(from node:", node.name, ")");
            }
        }
        else if (nameLower === "telescope") {
            const mesh = getFirstMeshChild(node);
            if (mesh) {
                meshes.telescope = mesh;
                console.log("🎨 [Musecraft] Found telescope mesh:", mesh.name, "(from node:", node.name, ")");
            }
        }
        else if (nameLower === "rocket_flames" || nameLower === "rocketflames") {
            // This is a transform node for flames - keep as TransformNode
            meshes.rocketFlames = node as BABYLON.TransformNode;
            console.log("🎨 [Musecraft] Found rocket_flames node:", node.name);
        }
        else if (nameLower === "rocket") {
            const mesh = getFirstMeshChild(node);
            if (mesh) {
                meshes.rocket = mesh;
                console.log("🎨 [Musecraft] Found rocket mesh:", mesh.name, "(from node:", node.name, ")");
            }
        }
    }

    return meshes;
}

// ===== STORE ORIGINAL STATE =====

function storeOriginalState(meshes: MusecraftMeshes): MusecraftOriginalState {
    const positions = new Map<BABYLON.TransformNode, BABYLON.Vector3>();
    const rotations = new Map<BABYLON.TransformNode, BABYLON.Quaternion | null>();

    const allMeshes = [meshes.sandbox, meshes.platform, meshes.telescope, meshes.rocket];

    for (const mesh of allMeshes) {
        if (mesh) {
            // Store mesh position
            positions.set(mesh, mesh.position.clone());
            rotations.set(mesh, mesh.rotationQuaternion ? mesh.rotationQuaternion.clone() : null);
            console.log(`🎨 [Musecraft] Storing ${mesh.name} position: (${mesh.position.x.toFixed(2)}, ${mesh.position.y.toFixed(2)}, ${mesh.position.z.toFixed(2)})`);

            // Also store parent position if parent exists (GLTF structure has TransformNode parents)
            if (mesh.parent && mesh.parent instanceof BABYLON.TransformNode) {
                const parent = mesh.parent as BABYLON.TransformNode;
                if (!positions.has(parent)) {
                    positions.set(parent, parent.position.clone());
                    rotations.set(parent, parent.rotationQuaternion ? parent.rotationQuaternion.clone() : null);
                    console.log(`🎨 [Musecraft] Storing parent ${parent.name} position: (${parent.position.x.toFixed(2)}, ${parent.position.y.toFixed(2)}, ${parent.position.z.toFixed(2)})`);
                }
            }
        }
    }

    // Also store rocket_flames position
    if (meshes.rocketFlames) {
        positions.set(meshes.rocketFlames, meshes.rocketFlames.position.clone());
        rotations.set(meshes.rocketFlames, meshes.rocketFlames.rotationQuaternion ? meshes.rocketFlames.rotationQuaternion.clone() : null);
    }

    return { positions, rotations };
}

// ===== SELECTION HANDLING =====

function clearSelection(scene: BABYLON.Scene): void {
    // Remove overlay mesh
    if (state.selectionOverlay) {
        state.selectionOverlay.dispose();
        state.selectionOverlay = null;
    }

    // Detach gizmo
    if (state.gizmoManager) {
        state.gizmoManager.attachToMesh(null);
    }

    state.selectedMesh = null;
}

function selectMesh(mesh: BABYLON.AbstractMesh, scene: BABYLON.Scene): void {
    // Don't re-select the same mesh
    if (state.selectedMesh === mesh) return;

    console.log("🎨 [Musecraft] Selecting mesh:", mesh.name);

    // Clear previous selection
    clearSelection(scene);

    state.selectedMesh = mesh;

    // Create overlay clone for selection highlight
    // Clone the mesh geometry for the overlay effect
    const overlayMesh = mesh.clone(mesh.name + "_overlay", null);
    if (overlayMesh) {
        // Make it a child of the selected mesh so it follows movement
        overlayMesh.parent = mesh;
        overlayMesh.position = BABYLON.Vector3.Zero();
        overlayMesh.scaling = new BABYLON.Vector3(1.01, 1.01, 1.01); // Slightly larger to avoid z-fighting
        overlayMesh.rotationQuaternion = null;
        overlayMesh.rotation = BABYLON.Vector3.Zero();

        // Apply overlay material
        overlayMesh.material = getOrCreateOverlayMaterial(scene);

        // Make sure it's not pickable (so clicks go through to the actual mesh)
        overlayMesh.isPickable = false;

        state.selectionOverlay = overlayMesh;
    }

    // Attach gizmo to this mesh
    if (state.gizmoManager) {
        state.gizmoManager.attachToMesh(mesh);
    }
}

// ===== GIZMO SETUP =====

function setupGizmoManager(scene: BABYLON.Scene): BABYLON.GizmoManager {
    // Create utility layer for gizmos (renders on top)
    utilityLayerRef = new BABYLON.UtilityLayerRenderer(scene);

    const gizmoManager = new BABYLON.GizmoManager(scene, 1, utilityLayerRef);

    // Enable only position gizmo
    gizmoManager.positionGizmoEnabled = true;
    gizmoManager.rotationGizmoEnabled = false;
    gizmoManager.scaleGizmoEnabled = false;
    gizmoManager.boundingBoxGizmoEnabled = false;

    // Don't auto-attach - we'll control attachment manually
    gizmoManager.attachableMeshes = null;
    gizmoManager.usePointerToAttachGizmos = false;

    // Customize gizmo appearance
    if (gizmoManager.gizmos.positionGizmo) {
        const posGizmo = gizmoManager.gizmos.positionGizmo;

        // Make gizmo axes more visible
        if (posGizmo.xGizmo) {
            posGizmo.xGizmo.scaleRatio = 1.2;
        }
        if (posGizmo.yGizmo) {
            posGizmo.yGizmo.scaleRatio = 1.2;
        }
        if (posGizmo.zGizmo) {
            posGizmo.zGizmo.scaleRatio = 1.2;
        }

        // Track gizmo drag start/end to disable model rotation while dragging
        const setupGizmoDragTracking = (gizmo: any) => {
            if (!gizmo?.dragBehavior) return;
            gizmo.dragBehavior.onDragStartObservable.add(() => {
                isGizmoDragging = true;
                console.log("🎯 [Musecraft] Gizmo drag STARTED");
            });
            gizmo.dragBehavior.onDragEndObservable.add(() => {
                isGizmoDragging = false;
                console.log("🎯 [Musecraft] Gizmo drag ENDED");
            });
        };

        if (posGizmo.xGizmo) setupGizmoDragTracking(posGizmo.xGizmo);
        if (posGizmo.yGizmo) setupGizmoDragTracking(posGizmo.yGizmo);
        if (posGizmo.zGizmo) setupGizmoDragTracking(posGizmo.zGizmo);
    }

    return gizmoManager;
}

// ===== POINTER HANDLING =====

function setupPointerObserver(scene: BABYLON.Scene): BABYLON.Observer<BABYLON.PointerInfo> {
    console.log("🔍 [Musecraft DEBUG] Setting up pointer observer...");

    const observer = scene.onPointerObservable.add((pointerInfo) => {
        const evt = pointerInfo.event as PointerEvent;

        // Track pointer down position
        if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
            if (evt.button === 0) { // Left click only
                pointerDownPosition = { x: evt.clientX, y: evt.clientY };
            }
            return;
        }

        // Handle pointer up - check if it was a click or a drag
        if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERUP) {
            if (evt.button !== 0) return; // Left click only

            // Check if this was a drag (moved too far)
            if (!pointerDownPosition) return;

            const dx = evt.clientX - pointerDownPosition.x;
            const dy = evt.clientY - pointerDownPosition.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            pointerDownPosition = null; // Reset for next click

            // If dragged more than threshold, this was a camera rotation, not a click
            if (distance > DRAG_THRESHOLD) {
                console.log("🔍 [Musecraft DEBUG] Pointer up after drag (distance:", distance.toFixed(1), ") - ignoring");
                return;
            }

            console.log("🔍 [Musecraft DEBUG] Click detected (distance:", distance.toFixed(1), ")");

            // Now handle the click - pick at this position
            const pickResult = scene.pick(evt.clientX, evt.clientY);

            if (!pickResult || !pickResult.hit) {
                console.log("🔍 [Musecraft DEBUG] No pick result or no hit - deselecting");
                clearSelection(scene);
                return;
            }

            const pickedMesh = pickResult.pickedMesh;
            console.log("🔍 [Musecraft DEBUG] Picked mesh:", pickedMesh?.name);

            if (!pickedMesh) return;

            // Check if clicked mesh is one of our selectable meshes
            const selectableMeshes = [
                state.meshes.sandbox,
                state.meshes.platform,
                state.meshes.telescope,
                state.meshes.rocket
            ];

            console.log("🔍 [Musecraft DEBUG] Selectable meshes:", selectableMeshes.map(m => m?.name || "null"));

            // Check if clicked mesh or any of its parents is selectable
            let targetMesh: BABYLON.AbstractMesh | null = pickedMesh;
            let foundSelectable = false;

            while (targetMesh) {
                if (selectableMeshes.includes(targetMesh)) {
                    foundSelectable = true;
                    break;
                }
                targetMesh = targetMesh.parent as BABYLON.AbstractMesh | null;
            }

            if (foundSelectable && targetMesh) {
                console.log("🔍 [Musecraft DEBUG] Found selectable mesh, selecting:", targetMesh.name);
                selectMesh(targetMesh, scene);
            } else {
                console.log("🔍 [Musecraft DEBUG] Clicked non-selectable mesh, deselecting");
                clearSelection(scene);
            }
        }
    });

    console.log("🔍 [Musecraft DEBUG] Pointer observer registered:", observer ? "SUCCESS" : "FAILED");
    return observer;
}

// ===== PUBLIC API =====

/**
 * Initialize the Musecraft interaction system.
 * Call this after the Musecraft model is loaded and visible.
 * 
 * @param rootMesh - The root mesh of the Musecraft GLB model
 * @param scene - The Babylon.js scene
 * @returns boolean indicating if initialization was successful
 */
export function initMusecraftInteraction(
    rootMesh: BABYLON.AbstractMesh,
    scene: BABYLON.Scene
): boolean {
    console.log("========================================");
    console.log("🎨 [Musecraft] initMusecraftInteraction CALLED");
    console.log("  rootMesh:", rootMesh?.name || "null");
    console.log("  scene:", scene ? "EXISTS" : "null");
    console.log("========================================");

    if (state.isInitialized) {
        console.log("🎨 [Musecraft] Already initialized, skipping");
        return true;
    }

    console.log("🎨 [Musecraft] Initializing interaction system...");
    sceneRef = scene;

    // Find all relevant meshes
    state.meshes = findMusecraftMeshes(rootMesh);

    // Validate we found the meshes
    const foundMeshes = Object.entries(state.meshes)
        .filter(([key, value]) => value !== null)
        .map(([key]) => key);

    console.log("🎨 [Musecraft] Found meshes:", foundMeshes.join(", "));

    if (foundMeshes.length === 0) {
        console.warn("⚠️ [Musecraft] No meshes found! Aborting initialization.");
        return false;
    }

    // Store original state for reset
    state.originalState = storeOriginalState(state.meshes);
    console.log("🎨 [Musecraft] Stored original positions for", state.originalState.positions.size, "nodes");

    // Make meshes pickable
    const selectableMeshes = [
        state.meshes.sandbox,
        state.meshes.platform,
        state.meshes.telescope,
        state.meshes.rocket
    ];

    for (const mesh of selectableMeshes) {
        if (mesh) {
            mesh.isPickable = true;
        }
    }

    // Setup gizmo manager
    state.gizmoManager = setupGizmoManager(scene);
    console.log("🎨 [Musecraft] Gizmo manager created");

    // Setup rocket flame particles
    if (state.meshes.rocketFlames) {
        state.flameParticles = createRocketFlameParticles(scene, state.meshes.rocketFlames);
        state.flameParticles.start();
        console.log("🔥 [Musecraft] Rocket flame particles started");
    }

    // Setup pointer observer for selection
    state.pointerObserver = setupPointerObserver(scene);
    console.log("🎨 [Musecraft] Pointer observer registered");

    // Select rocket by default so user sees what they can interact with
    if (state.meshes.rocket) {
        selectMesh(state.meshes.rocket, scene);
        console.log("🚀 [Musecraft] Rocket selected by default");
    }

    state.isInitialized = true;
    console.log("✅ [Musecraft] Interaction system initialized successfully!");

    return true;
}

/**
 * Reset all Musecraft meshes to their original positions.
 * Call this when the model scales down/becomes hidden.
 */
export function resetMusecraftInteraction(): void {
    if (!state.isInitialized) return;

    console.log("🎨 [Musecraft] Resetting to original state...");
    console.log("🎨 [Musecraft] Positions to reset:", state.originalState.positions.size);

    // Clear selection and detach gizmo FIRST
    if (sceneRef) {
        clearSelection(sceneRef);
    }

    // Also explicitly detach gizmo to make sure it's hidden
    if (state.gizmoManager) {
        state.gizmoManager.attachToMesh(null);
    }

    // Reset positions
    for (const [node, position] of state.originalState.positions) {
        console.log(`🎨 [Musecraft] Resetting ${node.name} position from (${node.position.x.toFixed(2)}, ${node.position.y.toFixed(2)}, ${node.position.z.toFixed(2)}) to (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`);
        node.position.copyFrom(position);
    }

    // Reset rotations
    for (const [node, rotation] of state.originalState.rotations) {
        if (rotation) {
            if (!node.rotationQuaternion) {
                node.rotationQuaternion = rotation.clone();
            } else {
                node.rotationQuaternion.copyFrom(rotation);
            }
        }
    }

    console.log("✅ [Musecraft] Reset complete");
}

/**
 * Dispose the Musecraft interaction system.
 * Call this for complete cleanup (e.g., when leaving the page).
 */
export function disposeMusecraftInteraction(): void {
    if (!state.isInitialized) return;

    console.log("🎨 [Musecraft] Disposing interaction system...");

    // Remove pointer observer
    if (state.pointerObserver && sceneRef) {
        sceneRef.onPointerObservable.remove(state.pointerObserver);
        state.pointerObserver = null;
    }

    // Dispose gizmo manager
    if (state.gizmoManager) {
        state.gizmoManager.dispose();
        state.gizmoManager = null;
    }

    // Dispose utility layer
    if (utilityLayerRef) {
        utilityLayerRef.dispose();
        utilityLayerRef = null;
    }

    // Stop and dispose flame particles
    if (state.flameParticles) {
        state.flameParticles.stop();
        state.flameParticles.dispose();
        state.flameParticles = null;
    }

    // Dispose flame emitter mesh
    if (flameEmitterMesh) {
        flameEmitterMesh.dispose();
        flameEmitterMesh = null;
    }

    // Dispose overlay material
    if (overlayMaterial) {
        overlayMaterial.dispose();
        overlayMaterial = null;
    }

    // Dispose selection overlay mesh
    if (state.selectionOverlay) {
        state.selectionOverlay.dispose();
        state.selectionOverlay = null;
    }

    // Clear state
    state.meshes = {
        sandbox: null,
        platform: null,
        telescope: null,
        rocket: null,
        rocketFlames: null
    };
    state.originalState = {
        positions: new Map(),
        rotations: new Map()
    };
    state.selectedMesh = null;
    state.isInitialized = false;
    sceneRef = null;

    console.log("✅ [Musecraft] Interaction system disposed");
}

/**
 * Start the rocket flame particles (if not already started).
 */
export function startRocketFlames(): void {
    if (state.flameParticles && !state.flameParticles.isStarted()) {
        state.flameParticles.start();
        console.log("🔥 [Musecraft] Rocket flames started");
    }
}

/**
 * Stop the rocket flame particles.
 */
export function stopRocketFlames(): void {
    if (state.flameParticles && state.flameParticles.isStarted()) {
        state.flameParticles.stop();
        console.log("🔥 [Musecraft] Rocket flames stopped");
    }
}

/**
 * Check if the interaction system is currently initialized.
 */
export function isMusecraftInteractionInitialized(): boolean {
    return state.isInitialized;
}

/**
 * Get the currently selected mesh (if any).
 */
export function getSelectedMusecraftMesh(): BABYLON.AbstractMesh | null {
    return state.selectedMesh;
}

/**
 * Check if a gizmo is currently being dragged.
 * Use this to disable model rotation while dragging transforms.
 */
export function isMusecraftGizmoDragging(): boolean {
    return isGizmoDragging;
}

/**
 * Select the rocket by default (call when returning to Musecraft).
 * This ensures the rocket is selected with overlay and gizmo visible.
 */
export function selectRocketByDefault(): void {
    if (!state.isInitialized || !sceneRef) return;

    if (state.meshes.rocket) {
        selectMesh(state.meshes.rocket, sceneRef);
        console.log("🚀 [Musecraft] Rocket re-selected by default");
    }
}
