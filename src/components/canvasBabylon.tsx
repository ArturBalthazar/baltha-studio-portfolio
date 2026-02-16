import React, { useEffect, useRef } from "react";
import * as BABYLON from "babylonjs";
import "@babylonjs/loaders";
import { useUI, S } from "../state";
import { getStateConfig } from "../states";


import {
  initMusecraftInteraction,
  resetMusecraftInteraction,
  stopRocketFlames,
  startRocketFlames,
  isMusecraftInteractionInitialized,
  isMusecraftGizmoDragging,
  selectRocketByDefault
} from "./MusecraftInteraction";
import { startModelAnimations, stopModelAnimations } from "./modelAnimationController";
import { getWorkplaceConfig } from "./workplaceConfig";
import { updateEngineVelocity, setGuidedAnimationActive } from "./EngineSoundManager";
import {
  AnimateShipAlongBezierOptions,
  SetShipAndFlamesVisibilityOptions,
  setShipAndFlamesVisibility,
  cancelBezierAnimation,
  animateShipAlongBezier
} from "./babylon/ShipBezierAnimation";
import {
  AtomIndicatorConfig,
  AtomIndicator,
  createAtomIndicator
} from "./babylon/AtomIndicator";
import {
  AnimateTransformOptions,
  animateTransform,
  AnimateCameraRadiusOptions,
  animateCameraRadius,
  AnimateFogOptions,
  animateFog
} from "./babylon/AnimationHelpers";
import {
  modelOriginalScales,
  modelOriginalRotations,
  modelScaleAnimations,
  applyLightmapsToModel,
  warmupModelForGPU,
  scaleModelMeshes
} from "./babylon/ModelLoadingUtils";
import {
  createStarsParticleSystem,
  createSmokeParticleSystem,
  createEngineFlameParticleSystem,
  createCurveParticleSystem
} from "./babylon/ParticleFactories";
import {
  registerPortalShaders,
  createPortalWarpEffect,
  createPortal
} from "./babylon/PortalSystem";

// Force register the GLB loader
import { GLTFFileLoader } from "@babylonjs/loaders";
// @ts-ignore - Type mismatch between babylon imports is non-breaking
BABYLON.SceneLoader.RegisterPlugin(new GLTFFileLoader());

// Continent rotations - these will be added to the base rotation
let planetRotations = [
  new BABYLON.Vector3(BABYLON.Tools.ToRadians(-25), BABYLON.Tools.ToRadians(80), BABYLON.Tools.ToRadians(-5)), // Africa
  new BABYLON.Vector3(BABYLON.Tools.ToRadians(-35), BABYLON.Tools.ToRadians(-65), BABYLON.Tools.ToRadians(30)), // North America
  new BABYLON.Vector3(BABYLON.Tools.ToRadians(-30), BABYLON.Tools.ToRadians(105), BABYLON.Tools.ToRadians(-45)), // Europe
  new BABYLON.Vector3(BABYLON.Tools.ToRadians(-5), BABYLON.Tools.ToRadians(1), BABYLON.Tools.ToRadians(0)), // South America
  new BABYLON.Vector3(BABYLON.Tools.ToRadians(-60), BABYLON.Tools.ToRadians(-130), BABYLON.Tools.ToRadians(-50)), // Oceania
  new BABYLON.Vector3(BABYLON.Tools.ToRadians(-5), BABYLON.Tools.ToRadians(-195), BABYLON.Tools.ToRadians(-3)) // Asia
];


// Animation helpers imported from ./babylon/AnimationHelpers


// Anchor data structure for guided mode ship positions
interface AnchorData {
  position: BABYLON.Vector3;
  rotation: BABYLON.Quaternion;
  forward: BABYLON.Vector3;
}


// AtomIndicator is now imported from ./babylon/AtomIndicator




// Model loading utilities imported from ./babylon/ModelLoadingUtils

// ShipBezierAnimation is now imported from ./babylon/ShipBezierAnimation

export function BabylonCanvas() {
  const s = useUI((st) => st.state);
  const selectedLogoModel = useUI((st) => st.selectedLogoModel);
  const selectedContinent = useUI((st) => st.selectedContinent);
  const config = getStateConfig(s);
  const ref = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const cameraRef = useRef<BABYLON.ArcRotateCamera | null>(null);
  const shipPivotRef = useRef<BABYLON.TransformNode | null>(null);
  const logoModelsRef = useRef<BABYLON.AbstractMesh[]>([]);
  const logosRootRef = useRef<BABYLON.TransformNode | null>(null);
  const planetMeshRef = useRef<BABYLON.AbstractMesh | null>(null);
  const planetMaterialRef = useRef<BABYLON.Material | null>(null);
  const rockRingRef = useRef<BABYLON.AbstractMesh | null>(null);
  const rockRingAnimationGroupsRef = useRef<BABYLON.AnimationGroup[]>([]);
  const rockRingAnimationStartedRef = useRef(false); // Track if rockring animation has started (only in state 4+)
  const particlesHaveStartedRef = useRef(false); // Track if particles have been started
  const spaceshipRef = useRef<BABYLON.AbstractMesh | null>(null);
  const spaceshipRootRef = useRef<BABYLON.TransformNode | null>(null);
  const flameParticleSystemRef = useRef<BABYLON.ParticleSystem | null>(null);
  const flameParticleSystem2Ref = useRef<BABYLON.ParticleSystem | null>(null);
  const root1Ref = useRef<BABYLON.TransformNode | null>(null);
  const starsParticleSystemRef = useRef<BABYLON.ParticleSystem | null>(null);
  const smokeParticleSystemRef = useRef<BABYLON.ParticleSystem | null>(null);
  const curveParticleSystemRef = useRef<BABYLON.ParticleSystem | null>(null);
  const starsEmitterRef = useRef<BABYLON.Mesh | null>(null);
  const smokeEmitterRef = useRef<BABYLON.Mesh | null>(null);
  const prevStateRef = useRef<number>(s);

  // Portal refs
  const portalsRef = useRef<BABYLON.Mesh[]>([]);
  const portalSwirlsRef = useRef<BABYLON.ParticleSystem[]>([]);
  const warpEffectRef = useRef<BABYLON.PostProcess | null>(null);
  const warpEffectAttachedRef = useRef(false);

  // Rotation tracking refs
  const baseRotationRef = useRef({ x: 0, y: 0 });
  const mouseRotationRef = useRef({ x: 0, y: 0 });
  const dragRotationRef = useRef(BABYLON.Quaternion.Identity());
  const isDraggingRef = useRef(false);
  const lastDragPosRef = useRef({ x: 0, y: 0 });
  // Drag velocity for momentum effect (stores angular velocity)
  const dragVelocityRef = useRef({ x: 0, y: 0 });
  const dragMomentumAnimRef = useRef<number | null>(null);

  // Spaceship control state refs
  const shipControlsRef = useRef({
    keys: {} as Record<string, boolean>,
    speed: 9,
    speedK: 2,
    v: 10,
    pitch: 0,
    yawTarget: 0,
    pitchVel: 0,
    observer: null as BABYLON.Nullable<BABYLON.Observer<BABYLON.Scene>>,
    // Velocity smoothing (inertia/momentum)
    velocity: new BABYLON.Vector3(0, 0, 0),
    acceleration: 30, // How fast to accelerate to target speed
    drag: 4 // How fast to decelerate when no input (higher = stops faster)
  });

  // Proximity-based speed reduction: ship slows down when near anchors
  // Multiplier smoothly transitions from 1.0 (full speed) to 0.5 (half speed) as ship approaches anchor center
  const proximitySpeedRef = useRef({
    currentMultiplier: 1.0, // Current interpolated multiplier
    targetMultiplier: 1.0,  // Target multiplier based on distance
    smoothSpeed: 3          // Interpolation speed (higher = faster transition)
  });

  // Store initial ship state for restoration
  const shipInitialStateRef = useRef<{
    position: BABYLON.Vector3 | null;
    rotation: BABYLON.Quaternion | null;
  }>({
    position: null,
    rotation: null
  });

  // Mobile control refs
  const isMobileRef = useRef(false);
  const controlSphereRef = useRef<BABYLON.Mesh | null>(null);
  const mobileControlRef = useRef({
    isDragging: false,
    isRightClick: false, // Right-click allows camera rotation without movement
    targetDirection: new BABYLON.Vector3(0, 0, 1), // Default forward
    hasDirection: false,
    cameraRotation: 0, // -1 for left, 0 for none, 1 for right
    pointerX: 0, // Track pointer X position
    pointerY: 0,  // Track pointer Y position
    previousYaw: 0, // Track previous yaw for turn rate calculation
    yawRate: 0 // Current turn rate (-1 to 1, negative = left, positive = right)
  });

  // GEELY Car refs (anchor_1, state 4)
  const carRootRef = useRef<BABYLON.AbstractMesh | null>(null);
  const carMeshesRef = useRef<BABYLON.AbstractMesh[]>([]);
  const carAnchorRef = useRef<BABYLON.AbstractMesh | null>(null);

  const selectedProjectIndex = useUI((st) => st.selectedProjectIndex);

  // Meetkai refs (anchor_1, state 4) - Multiple models with shared parent
  const meetkaiRootRef = useRef<BABYLON.TransformNode | null>(null);
  const meetkaiMeshesRef = useRef<BABYLON.AbstractMesh[]>([]);
  const meetkaiModelsRef = useRef<{
    roots: (BABYLON.AbstractMesh | null)[];
    meshes: BABYLON.AbstractMesh[][];
  }>({
    roots: [null, null, null, null],
    meshes: [[], [], [], []]
  });

  // MoreThanReal refs (anchor_2, state 5) - Multiple models with shared parent
  const moreThanRealRootRef = useRef<BABYLON.TransformNode | null>(null);
  const moreThanRealMeshesRef = useRef<BABYLON.AbstractMesh[]>([]);
  const moreThanRealModelsRef = useRef<{
    roots: (BABYLON.AbstractMesh | null)[];
    meshes: BABYLON.AbstractMesh[][];
  }>({
    roots: [null, null, null],
    meshes: [[], [], []]
  });
  // Legacy single-model refs still used by More Than Real loader
  const musecraftRootRef = useRef<BABYLON.AbstractMesh | null>(null);
  const musecraftMeshesRef = useRef<BABYLON.AbstractMesh[]>([]);
  const musecraftAnchorRef = useRef<BABYLON.AbstractMesh | null>(null);
  const musecraftAnimationGroupsRef = useRef<BABYLON.AnimationGroup[]>([]);



  // Dioramas refs (anchor_3, state 6) - Multiple models with shared parent
  const dioramasRootRef = useRef<BABYLON.TransformNode | null>(null); // Parent root for all dioramas
  const dioramasMeshesRef = useRef<BABYLON.AbstractMesh[]>([]); // All meshes from all diorama models
  const dioramasAnchorRef = useRef<BABYLON.AbstractMesh | null>(null);
  // Individual diorama model refs: [0]=sesc-museum, [1]=sesc-island, [2]=dioramas
  const dioramaModelsRef = useRef<{
    roots: (BABYLON.AbstractMesh | null)[];
    meshes: BABYLON.AbstractMesh[][];
  }>({
    roots: [null, null, null],
    meshes: [[], [], []]
  });


  // UFSC refs (anchor_4, state 7) - Multiple models with shared parent
  const ufscRootRef = useRef<BABYLON.TransformNode | null>(null);
  const ufscMeshesRef = useRef<BABYLON.AbstractMesh[]>([]);
  const petwheelsAnchorRef = useRef<BABYLON.AbstractMesh | null>(null);
  const ufscModelsRef = useRef<{
    roots: (BABYLON.AbstractMesh | null)[];
    meshes: BABYLON.AbstractMesh[][];
  }>({
    roots: [null, null, null],
    meshes: [[], [], []]
  });
  // Legacy single-model refs still used by loaders
  const petwheelsRootRef = useRef<BABYLON.AbstractMesh | null>(null);
  const petwheelsMeshesRef = useRef<BABYLON.AbstractMesh[]>([]);
  const petwheelsAnimationGroupsRef = useRef<BABYLON.AnimationGroup[]>([]);
  const personalAnimationGroupsRef = useRef<BABYLON.AnimationGroup[]>([]);

  // Personal Projects refs (anchor_5, state 8) - Multiple models with shared parent
  const personalRootRef = useRef<BABYLON.TransformNode | null>(null);
  const personalMeshesRef = useRef<BABYLON.AbstractMesh[]>([]);
  const personalAnchorRef = useRef<BABYLON.AbstractMesh | null>(null);
  const personalModelsRef = useRef<{
    roots: (BABYLON.AbstractMesh | null)[];
    meshes: BABYLON.AbstractMesh[][];
  }>({
    roots: [null, null],
    meshes: [[], []]
  });

  // Store animation groups per model ID for the animation controller
  // Maps model IDs (e.g., 'petwheels', 'sika', 'pistons') to their animation groups
  const modelAnimationGroupsRef = useRef<Map<string, BABYLON.AnimationGroup[]>>(new Map());

  // Atom indicators for each model anchor
  const atomIndicatorsRef = useRef<{
    atom1: AtomIndicator | null; // For Meetkai (anchor_1)
    atom2: AtomIndicator | null; // For More Than Real (anchor_2)
    atom3: AtomIndicator | null; // For Baltha Maker (anchor_3)
    atom4: AtomIndicator | null; // For UFSC (anchor_4)
    atom5: AtomIndicator | null; // For Personal Projects (anchor_5)
  }>({
    atom1: null,
    atom2: null,
    atom3: null,
    atom4: null,
    atom5: null
  });

  // Model visibility state (to track which models are currently shown/hidden)
  const modelVisibilityRef = useRef<{
    model1: boolean; // Meetkai
    model2: boolean; // More Than Real
    model3: boolean; // Baltha Maker
    model4: boolean; // UFSC
    model5: boolean; // Personal Projects
  }>({
    model1: false,
    model2: false,
    model3: false,
    model4: false,
    model5: false
  });



  // Track whether each model has finished loading (different from visibility)
  const modelLoadedRef = useRef<{
    model1: boolean; // Meetkai
    model2: boolean; // More Than Real
    model3: boolean; // Baltha Maker
    model4: boolean; // UFSC
    model5: boolean; // Personal Projects
  }>({
    model1: false,
    model2: false,
    model3: false,
    model4: false,
    model5: false
  });

  // Atom indicator configuration per model
  const atomConfigRef = useRef({
    // GEELY car - larger model
    model1: {
      idleRingRadius: 2,
      expandedRingRadii: [8, 9, 10] as [number, number, number],
      rotationSpeed: .3,
      proximityDistance: 22, // Distance to trigger model visibility
      flameScale: 3
    },
    // Musecraft
    model2: {
      idleRingRadius: 2,
      expandedRingRadii: [7, 8, 10] as [number, number, number],
      rotationSpeed: .3,
      proximityDistance: 22,
      flameScale: 3
    },
    // Dioramas
    model3: {
      idleRingRadius: 2,
      expandedRingRadii: [7.5, 8, 8.5] as [number, number, number],
      rotationSpeed: 0.3,
      proximityDistance: 22,
      flameScale: 3
    },
    // Petwheels
    model4: {
      idleRingRadius: 2,
      expandedRingRadii: [5, 6, 8] as [number, number, number],
      rotationSpeed: .3,
      proximityDistance: 17,
      flameScale: 3
    },
    // Personal Projects
    model5: {
      idleRingRadius: 2,
      expandedRingRadii: [6, 7, 9] as [number, number, number],
      rotationSpeed: 0.3,
      proximityDistance: 20,
      flameScale: 3
    }
  });

  // Guided mode arrival tracking for model rotation
  const guidedModeArrivedRef = useRef(false);
  const modelRotationRef = useRef({
    isDragging: false,
    lastX: 0,
    lastY: 0,
    baseRotationY: 0,
    // X-axis peek rotation (springs back to 0)
    peekRotationX: 0,
    // Accumulated Y rotation (persists during drag)
    accumulatedYRotation: 0,
    // Y rotation velocity for momentum effect
    velocityY: 0,
    // Store original quaternion for the model
    originalQuaternion: null as BABYLON.Quaternion | null
  });

  // Free mode model rotation state - tracks when user is rotating the model in free mode
  // When active, ship controls and camera rotation are disabled
  const freeModeDraggingModelRef = useRef(false);

  // Model zoom state - moves model along axis from anchor to ship pivot when scrolling
  // Toggle-based: zoom in moves to a % of distance, zoom out returns to default
  const modelZoomRef = useRef({
    // Whether each model is currently zoomed in (true) or at default position (false)
    isZoomedIn: {
      model1: false,
      model2: false,
      model3: false,
      model4: false
    } as Record<string, boolean>,
    // Original positions for each model (set when model loads or when entering guided mode)
    originalPositions: {
      model1: null as BABYLON.Vector3 | null,
      model2: null as BABYLON.Vector3 | null,
      model3: null as BABYLON.Vector3 | null,
      model4: null as BABYLON.Vector3 | null
    } as Record<string, BABYLON.Vector3 | null>,
    // Percentage of anchor-to-ship distance to move model when zoomed in (0.3 = 30% closer)
    zoomedInPercent: 0.4,
    // Animation duration in seconds
    animationDuration: 0.4,
    // Track if animation is in progress to prevent rapid toggling
    isAnimating: false
  });

  // Guided mode anchor data refs (position + rotation)
  // Anchors are stored as { desktop1-5, mobile1-5 }
  const anchorDataRef = useRef<Record<string, AnchorData>>({});

  // Distance-based fade for atoms and floating particles
  // When the ship is too far from center, these effects fade out smoothly
  const distanceFadeRef = useRef({
    currentRatio: 1, // Current fade ratio (0 = invisible, 1 = fully visible)
    fadeStartDistance: 90, // Distance at which fade starts
    fadeEndDistance: 140, // Distance at which fully invisible
    baseEmitRates: {
      curveParticles: 600, // Will be set correctly when particles are created
      atomFlames: 100 // Base emit rate for atom flames
    }
  });



  // GEELY Car customization configuration imported from shared file
  // See carConfig.ts



  // Initialize scene once
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    // Detect if mobile
    isMobileRef.current = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      ('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0);

    // Engine
    const engine = new BABYLON.Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true,
    });
    engineRef.current = engine;
    engine.renderEvenInBackground = true; // keep rendering while resizing

    // Scene
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
    sceneRef.current = scene;

    // Add fog
    scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
    scene.fogColor = new BABYLON.Color3(13 / 255, 13 / 255, 38 / 255);
    scene.fogStart = 0;
    scene.fogEnd = 30;

    // Create camera pivot - camera will target this
    const shipPivot = new BABYLON.TransformNode("shipPivot", scene);
    shipPivot.position = BABYLON.Vector3.Zero();
    shipPivotRef.current = shipPivot;

    // Camera (static) - always locked to shipPivot
    const camera = new BABYLON.ArcRotateCamera(
      "cam",
      -Math.PI * 1.5,
      Math.PI / 2,
      20,
      shipPivot.position,
      scene
    );
    camera.attachControl(canvas, true);
    cameraRef.current = camera;

    // Lock camera to always target shipPivot (follows it when it moves)
    camera.lockedTarget = shipPivot;

    camera.inputs.clear();
    camera.panningSensibility = 0;
    let camFov = 1;
    if (isMobileRef.current) {
      camFov = 1.15;
    } else {
      camFov = .85;
    }
    camera.fov = camFov;

    camera.minZ = .1;    // how close things can be before clipping
    camera.maxZ = 1000;   // how far things can be seen

    // Set initial camera limits
    const isMobile = window.innerWidth < 768;
    const initialCameraConfig = config.canvas.babylonCamera;
    if (initialCameraConfig) {
      const lowerLimit = isMobile ? initialCameraConfig.lowerRadiusLimit.mobile : initialCameraConfig.lowerRadiusLimit.desktop;
      const upperLimit = isMobile ? initialCameraConfig.upperRadiusLimit.mobile : initialCameraConfig.upperRadiusLimit.desktop;
      camera.lowerRadiusLimit = lowerLimit;
      camera.upperRadiusLimit = upperLimit;
    } else {
      camera.lowerRadiusLimit = 20;
      camera.upperRadiusLimit = 20;
    }

    // Lock vertical FOV so height framing never squishes
    camera.fovMode = BABYLON.Camera.FOVMODE_VERTICAL_FIXED;

    // Create large invisible control sphere for mobile drag detection
    // Low poly: 16 horizontal segments, 8 vertical segments
    const controlSphere = BABYLON.MeshBuilder.CreateSphere("controlSphere", {
      diameter: 20000, // Very large sphere
      segments: 8,    // Low poly count
      sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, scene);
    controlSphere.isVisible = false; // Invisible
    controlSphere.isPickable = true; // But pickable for raycasting
    controlSphereRef.current = controlSphere;

    // IBL
    const env = BABYLON.CubeTexture.CreateFromPrefilteredData(
      "/assets/textures/environment.env",
      scene
    );
    scene.environmentTexture = env;
    scene.environmentIntensity = .8;
    scene.imageProcessingConfiguration.exposure = 1.3;
    scene.imageProcessingConfiguration.contrast = 1.2;

    const glowLayer = new BABYLON.GlowLayer("glow", scene);
    glowLayer.intensity = .3;
    glowLayer.isEnabled = false;

    // Soft fill
    const hemi = new BABYLON.HemisphericLight(
      "hemi",
      new BABYLON.Vector3(3, 3, -3),
      scene
    );
    hemi.intensity = 1.0;

    // Create root hierarchy
    const root1 = new BABYLON.TransformNode("root1", scene);
    root1.position.set(0, 0, 18);
    root1.scaling.set(.15, .15, .15);
    root1Ref.current = root1;

    // Create logos root as child of root1
    const logosRoot = new BABYLON.TransformNode("logosRoot", scene);
    logosRoot.parent = root1;
    logosRoot.position.set(0, 0, 0);
    logosRoot.scaling.set(1, 1, 1);
    logosRootRef.current = logosRoot;

    // Load all logo models as children of logosRoot
    const modelFiles = ["logo.glb", "logo_chain.glb", "logo_cookie.glb", "logo_badge.glb"];
    const logoModels: BABYLON.AbstractMesh[] = [];

    // Loading tracking
    let loadedCount = 0;
    const totalAssets = 8; // 4 logos + planet + rockring + spaceship + anchors
    let rockringGPUReady = false; // Track rockring GPU warmup separately

    const updateProgress = () => {
      loadedCount++;
      const progress = Math.min((loadedCount / totalAssets) * 100, 100);
      useUI.getState().setLoadingProgress(progress);
      // Only finish loading when all assets AND rockring GPU warmup are complete
      if (loadedCount >= totalAssets && rockringGPUReady) {
        setTimeout(() => {
          useUI.getState().setIsLoading(false);
        }, 500);
      }
    };

    // Called when rockring GPU warmup is complete
    const markRockringGPUReady = () => {
      rockringGPUReady = true;
      // Check if all assets are loaded - if so, finish loading
      if (loadedCount >= totalAssets) {
        setTimeout(() => {
          useUI.getState().setIsLoading(false);
        }, 500);
      }
    };

    let loadedLogosCount = 0;

    modelFiles.forEach((filename, index) => {
      BABYLON.SceneLoader.ImportMesh(
        "",
        "/assets/models/",
        filename,
        scene,
        (meshes) => {
          if (meshes.length) {
            const root = meshes[0];
            root.position.set(0, 0, 0);
            root.parent = logosRoot;

            // Hide all models except the first one (default logo)
            root.setEnabled(index === 0);
            logoModels[index] = root;
            logoModelsRef.current = logoModels;
            loadedLogosCount++;
            updateProgress();
          }
        },
        undefined,
        (sceneOrMesh, message, exception) => {
          console.error(`${filename} load error:`, message, exception);
        }
      );
    });

    // Load planet.glb as child of root1
    BABYLON.SceneLoader.ImportMesh(
      "",
      "/assets/models/",
      "planet.glb",
      scene,
      (meshes) => {
        if (meshes.length) {
          const planet = meshes[0];
          planet.position.set(0, 0, 0);
          planet.parent = root1;

          planet.setEnabled(false); // Hidden by default, shown in state 2
          planetMeshRef.current = planet;

          // Find the planet mesh with material and set up transparency
          const planetMesh = meshes.find(m => m.name === "PlanetMesh" && m.material);
          if (planetMesh && planetMesh.material) {
            planetMaterialRef.current = planetMesh.material;
            // Setup material for transparency
            planetMesh.material.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
            planetMesh.material.needDepthPrePass = true;
            planetMesh.material.backFaceCulling = true;
            planetMesh.material.alpha = 1;
          }

          // Set initial rotation to the currently selected continent from state
          const currentContinent = useUI.getState().selectedContinent;
          if (planetRotations[currentContinent]) {
            const initialRotation = planetRotations[currentContinent].clone();
            initialRotation.y += Math.PI; // Add the base PI offset
            planet.rotation = initialRotation;
          }
          updateProgress();
        }
      },
      undefined,
      (sceneOrMesh, message, exception) => {
        console.error("planet.glb load error:", message, exception);
      }
    );

    // Load rockring.glb (NOT parented to root1, separate)
    BABYLON.SceneLoader.ImportMesh(
      "",
      "/assets/models/",
      "rockring2.glb",
      scene,
      (meshes, particleSystems, skeletons, animationGroups) => {
        if (meshes.length) {
          const rockRing = meshes[0];
          rockRing.position.set(0, 0, 0);

          // Store animation groups and stop them initially
          if (animationGroups && animationGroups.length > 0) {
            rockRingAnimationGroupsRef.current = animationGroups;
            animationGroups.forEach(group => group.stop());
          }

          // Setup materials for transparency
          meshes.forEach(mesh => {
            if (mesh.material) {
              mesh.material.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;
              mesh.material.needDepthPrePass = true;
              mesh.material.backFaceCulling = false;
            }
          });

          // Find the Curve mesh and create particle effect
          const curveMesh = meshes.find(m => m.name === "Curve");
          if (curveMesh) {
            // Get vertices from the curve mesh
            const positions = curveMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            if (positions) {
              const vertexCount = positions.length / 3;

              // Store vertices in world space
              const worldMatrix = curveMesh.getWorldMatrix();
              const vertices: BABYLON.Vector3[] = [];
              for (let i = 0; i < positions.length; i += 3) {
                const localPos = new BABYLON.Vector3(positions[i], positions[i + 1], positions[i + 2]);
                const worldPos = BABYLON.Vector3.TransformCoordinates(localPos, worldMatrix);
                vertices.push(worldPos);
              }

              // Create particle system for curve effect using factory
              const { emitter: curveEmitter, particles: curveParticles } = createCurveParticleSystem({
                scene,
                vertices,
                isMobile: isMobileRef.current
              });
              curveParticleSystemRef.current = curveParticles;
              // Store base emit rate for distance-based fading
              distanceFadeRef.current.baseEmitRates.curveParticles = curveParticles.emitRate;
            }

            // Hide the Curve mesh itself
            curveMesh.isVisible = false;
          }

          rockRingRef.current = rockRing;
          updateProgress();

          // ===== GPU WARMUP: Enable rockring with alpha 0 briefly to force shader compilation =====
          // This prevents GPU delays when rockring first appears

          // Gather all materials from rockRing and its children
          const materials: BABYLON.Material[] = [];
          rockRing.getChildMeshes().forEach(mesh => {
            if (mesh.material) {
              materials.push(mesh.material);
            }
          });
          if (rockRing.material) {
            materials.push(rockRing.material);
          }

          // Set all materials to alpha 0 for warmup (invisible but GPU compiles shaders)
          materials.forEach(mat => {
            mat.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
            mat.alpha = 0;
          });

          // Enable rockring (invisible due to alpha 0) to force GPU shader compilation
          rockRing.setEnabled(true);

          // Wait for a few render frames to ensure GPU compiles shaders
          let warmupFrames = 0;
          const warmupFrameCount = 10; // Render 10 frames for thorough warmup

          const warmupObserver = scene.onAfterRenderObservable.add(() => {
            warmupFrames++;
            if (warmupFrames >= warmupFrameCount) {
              scene.onAfterRenderObservable.remove(warmupObserver);

              // GPU warmup complete - show rockring normally (no fade animation)
              materials.forEach(mat => {
                mat.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;
                mat.alpha = 1;
              });

              // Rockring is now ready - set enabled based on current state config
              const currentState = useUI.getState().state;
              const currentConfig = getStateConfig(currentState);
              const shouldBeEnabled = currentConfig.canvas.babylonScene?.rockRingEnabled === true;
              rockRing.setEnabled(shouldBeEnabled);

              // Mark GPU warmup as complete (allows loading screen to finish)
              markRockringGPUReady();
            }
          });
        }
      },
      undefined,
      (sceneOrMesh, message, exception) => {
        console.error("rockring.glb load error:", message, exception);
      }
    );

    // Load anchors.glb for guided mode ship positions and rotations
    BABYLON.SceneLoader.ImportMesh(
      "",
      "/assets/models/",
      "anchors.glb",
      scene,
      (meshes) => {
        // Extract positions and rotations from anchor meshes (desktop1-5, mobile1-5)
        const anchorNames = ['desktop1', 'desktop2', 'desktop3', 'desktop4', 'desktop5', 'mobile1', 'mobile2', 'mobile3', 'mobile4', 'mobile5'];
        anchorNames.forEach(name => {
          const anchor = meshes.find(m => m.name === name);
          if (anchor) {
            // Get world position and flip Z coordinate
            const rawPosition = anchor.getAbsolutePosition();
            const position = new BABYLON.Vector3(
              -rawPosition.x,
              rawPosition.y,
              rawPosition.z // Flip Z sign
            );

            // Get rotation as quaternion directly - avoid Euler conversion to prevent gimbal lock
            // when X rotation is near or above 90°
            let originalRotation: BABYLON.Quaternion;
            if (anchor.rotationQuaternion) {
              originalRotation = anchor.rotationQuaternion.clone();
            } else {
              originalRotation = BABYLON.Quaternion.FromEulerAngles(
                anchor.rotation.x,
                anchor.rotation.y,
                anchor.rotation.z
              );
            }

            // Apply -90° X rotation adjustment in local space using quaternion multiplication
            // This avoids gimbal lock issues that occur when using Euler angle conversion
            const xAdjustment = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.X, -Math.PI / 2);
            const rotation = originalRotation.multiply(xAdjustment);

            // Calculate forward direction from corrected rotation (local Z forward in world space)
            const forward = new BABYLON.Vector3(0, 0, 1);
            forward.rotateByQuaternionToRef(rotation, forward);

            anchorDataRef.current[name] = { position, rotation, forward };

            // Hide the anchor mesh
            anchor.isVisible = false;
          }
        });

        // Hide the root mesh as well
        if (meshes[0]) {
          meshes[0].setEnabled(false);
        }

        updateProgress(); // Count anchors as a loaded asset
      },
      undefined,
      (sceneOrMesh, message, exception) => {
        console.error("anchors.glb load error:", message, exception);
      }
    );

    // Load spaceship2.glb
    BABYLON.SceneLoader.ImportMesh(
      "",
      "/assets/models/",
      "spaceship2.glb",
      scene,
      (meshes) => {
        if (meshes.length) {
          const spaceship = meshes[0];

          // Get shiproot transform node from the loaded model
          const shipRoot = scene.getTransformNodeByName("shiproot");
          if (!shipRoot) {
            console.error("❌ shiproot not found in spaceship.glb! Make sure it's exported from Blender.");
            return;
          }

          // Set position and scaling on shiproot
          // Initially place ship behind camera, will animate to correct position when entering state 3
          shipRoot.position.set(0, -4, 20);
          const s = shipRoot.scaling;
          shipRoot.scaling.set(Math.abs(s.x) * 1.1, Math.abs(s.y) * 1.1, Math.abs(s.z) * -1.1);
          shipRoot.rotationQuaternion = shipRoot.rotationQuaternion || BABYLON.Quaternion.Identity();



          shipRoot.setEnabled(false); // Hidden by default, shown in state 3
          spaceshipRef.current = spaceship; // Keep mesh reference for materials
          spaceshipRootRef.current = shipRoot; // This is what we control

          // Save the ORIGINAL ship state immediately for proper restoration
          // This must happen BEFORE any bezier animations can change it
          shipInitialStateRef.current.position = shipRoot.position.clone();
          shipInitialStateRef.current.rotation = BABYLON.Quaternion.Identity();

          updateProgress();

          // Create engine flame particle systems (two flames with offset)
          const emitter = scene.getTransformNodeByName("engineFlame");
          if (emitter) {
            emitter.rotation.y = BABYLON.Tools.ToRadians(90);
            emitter.rotation.x = BABYLON.Tools.ToRadians(152);
            emitter.rotation.z = BABYLON.Tools.ToRadians(25);

            // Adjustable Z offset for second flame (positive = farther back in local space)
            const FLAME_2_Z_OFFSET = 0.12;

            // ===== FIRST FLAME (original position) - using factory =====
            const flame = createEngineFlameParticleSystem({ scene, emitter });
            // DON'T start flames here - ship is hidden by default!
            // Flames will be started by setShipAndFlamesVisibility when ship becomes visible
            flameParticleSystemRef.current = flame;

          }
        }
      },
      undefined,
      (sceneOrMesh, message, exception) => {
        console.error("spaceship2.glb load error:", message, exception);
      }
    );

    // Create particle systems (stars and smoke) using factory functions
    const { emitter: starsEmitter, particles: stars } = createStarsParticleSystem({
      scene,
      spaceshipRootRef
    });
    starsEmitterRef.current = starsEmitter;
    stars.start();
    starsParticleSystemRef.current = stars;

    const { emitter: smokeEmitter, particles: smoke } = createSmokeParticleSystem({
      scene,
      isMobile: isMobileRef.current
    });
    smokeEmitterRef.current = smokeEmitter;
    smokeParticleSystemRef.current = smoke;

    // ========================
    // Portal System (imported from ./babylon/PortalSystem)
    // ========================
    registerPortalShaders();
    warpEffectRef.current = createPortalWarpEffect(camera);

    // Create 4 portals at positions from prototype
    const portal1 = createPortal({
      scene,
      camera,
      position: new BABYLON.Vector3(40, 4, -50),
      radius: 6,
      name: "portal_geelySeagull",
      title: "GEELY Car Visualizer",
      portalSwirlsRef
    });
    portalsRef.current.push(portal1);

    const portal2 = createPortal({
      scene,
      camera,
      position: new BABYLON.Vector3(50, -3, 20),
      radius: 6,
      name: "portal_atlasflow",
      title: "Atlasflow",
      portalSwirlsRef
    });
    portalsRef.current.push(portal2);

    const portal3 = createPortal({
      scene,
      camera,
      position: new BABYLON.Vector3(-50, -3, 20),
      radius: 6,
      name: "portal_babylonEditor",
      title: "Babylon.js Editor",
      portalSwirlsRef
    });
    portalsRef.current.push(portal3);

    const portal4 = createPortal({
      scene,
      camera,
      position: new BABYLON.Vector3(-40, -2, -50),
      radius: 6,
      name: "portal_fda",
      title: "FDA Training Platform",
      portalSwirlsRef
    });
    portalsRef.current.push(portal4);

    // ========================
    // End Portal System
    // ========================

    // === Size-agno stic: keep engine buffer matching CSS size exactly ===
    let lastW = 0, lastH = 0;
    const measureAndResize = () => {
      // Measure the container (parent), not just the canvas element
      const container = canvas.parentElement || canvas;
      const rect = container.getBoundingClientRect();
      const cssW = Math.max(0, Math.floor(rect.width));
      const cssH = Math.max(0, Math.floor(rect.height));

      if (cssW > 0 && cssH > 0 && (cssW !== lastW || cssH !== lastH)) {
        lastW = cssW;
        lastH = cssH;

        // Map GPU buffer to CSS pixels (DPR aware) without stretching
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        engine.setHardwareScalingLevel(1 / dpr);
        engine.setSize(Math.max(1, Math.round(cssW * dpr)), Math.max(1, Math.round(cssH * dpr)));
      }
      requestAnimationFrame(measureAndResize);
    };
    measureAndResize();

    const fpsCounter = document.getElementById('fpsCounter');

    engine.runRenderLoop(() => {
      scene.render();

      if (fpsCounter) {
        fpsCounter.textContent = `FPS: ${engine.getFps().toFixed(0)}`;
      }
    });

    // Load models for anchor_1 (state_4) asynchronously
    // Uses workplaceConfig to determine which models to load (now Musecraft/Personal Projects)
    const loadAnchor1ModelsAsync = async () => {

      // Wait a bit to ensure rockring and other assets are loaded
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get model paths from config
      const config = getWorkplaceConfig(S.state_4);
      if (!config) return;

      const modelFiles = config.projects.map(project => {
        // Extract directory path and filename from modelPath
        // e.g., "/assets/models/personal/musecraft/musecraft.gltf" -> { basePath: "/assets/models/personal/musecraft/", file: "musecraft.gltf", id: "musecraft" }
        const fullPath = project.modelPath;
        const lastSlash = fullPath.lastIndexOf('/');
        const basePath = fullPath.substring(0, lastSlash + 1);
        const file = fullPath.substring(lastSlash + 1);
        return { name: project.id, basePath, file };
      });

      try {
        // Find the anchor_1 mesh first
        const anchorMesh = scene.getMeshByName("anchor_1");

        if (!anchorMesh) {
          return;
        }

        carAnchorRef.current = anchorMesh;

        // Create a shared parent TransformNode for all models at this anchor
        const anchor1Root = new BABYLON.TransformNode("anchor1Root", scene);
        carRootRef.current = anchor1Root as any;
        meetkaiRootRef.current = anchor1Root;

        // Position at anchor
        const anchorPos = anchorMesh.getAbsolutePosition();
        anchor1Root.position.copyFrom(anchorPos);

        // Apply rotation from anchor
        anchor1Root.rotationQuaternion = BABYLON.Quaternion.Identity();
        const anchorWorldMatrix = anchorMesh.getWorldMatrix();
        anchorWorldMatrix.decompose(undefined, anchor1Root.rotationQuaternion, undefined);

        anchor1Root.scaling.set(1, 1, -1); // Flip Z to match scene orientation
        modelOriginalScales.set(anchor1Root as any, anchor1Root.scaling.clone());
        modelOriginalRotations.set(anchor1Root as any, anchor1Root.rotationQuaternion.clone());

        // Create atom indicator at anchor position
        const atomConfig = atomConfigRef.current.model1;
        const atom = createAtomIndicator({
          scene,
          position: anchorMesh.getAbsolutePosition(),
          idleRingRadius: atomConfig.idleRingRadius,
          expandedRingRadii: atomConfig.expandedRingRadii,
          rotationSpeed: atomConfig.rotationSpeed,
          flameScale: atomConfig.flameScale
        });
        atomIndicatorsRef.current.atom1 = atom;

        // Handle atom visibility based on current state
        const currentState = useUI.getState().state;
        if (currentState < S.state_4 || currentState > S.state_8) {
          atom.root.setEnabled(false);
        } else {
          atom.root.setEnabled(true);
        }

        // Ensure refs have enough slots for all projects
        meetkaiModelsRef.current.roots = new Array(modelFiles.length).fill(null);
        meetkaiModelsRef.current.meshes = modelFiles.map(() => []);

        // Load each model
        const allMeshes: BABYLON.AbstractMesh[] = [];

        for (let i = 0; i < modelFiles.length; i++) {
          const { name, basePath, file } = modelFiles[i];

          try {
            const container = await BABYLON.SceneLoader.LoadAssetContainerAsync(
              basePath,
              file,
              scene
            );
            container.addAllToScene();

            if (!container.meshes.length) {
              continue;
            }

            // Get the root mesh of this model
            const modelRoot = container.meshes[0];
            meetkaiModelsRef.current.roots[i] = modelRoot;

            // Reset model's local position/rotation since parent handles it
            modelRoot.position.set(0, 0, 0);
            if (!modelRoot.rotationQuaternion) {
              modelRoot.rotationQuaternion = BABYLON.Quaternion.Identity();
            }
            modelRoot.rotationQuaternion.copyFrom(BABYLON.Quaternion.Identity());
            modelRoot.scaling.set(1, 1, 1);

            // Store original scale for this child model so scaleModelMeshes uses correct target
            modelOriginalScales.set(modelRoot, modelRoot.scaling.clone());

            // Parent this model to the shared root
            modelRoot.parent = anchor1Root;

            // Setup ambient texture coordinates for materials (AO map UV2 fix)
            container.materials.forEach(mat => {
              const pbrMat = mat as BABYLON.PBRMaterial;
              if (pbrMat.ambientTexture) {
                pbrMat.ambientTexture.coordinatesIndex = 1;
              }
              // Also check for occlusionTexture (glTF-specific runtime property)
              const matAny = mat as any;
              if (matAny.occlusionTexture) {
                matAny.occlusionTexture.coordinatesIndex = 1;
              }
            });

            // Stop all animations initially and store them for later use
            container.animationGroups.forEach(group => {
              group.stop();
              group.reset();
            });

            // Store animation groups per model ID for animation controller
            if (container.animationGroups.length > 0) {
              modelAnimationGroupsRef.current.set(name, [...container.animationGroups]);
            }

            // Store meshes for this model
            const modelMeshes: BABYLON.AbstractMesh[] = [];
            container.meshes.forEach(mesh => {
              modelMeshes.push(mesh);
              allMeshes.push(mesh);
              // IMPORTANT: Hide immediately to prevent visibility flash
              mesh.setEnabled(false);
            });
            meetkaiModelsRef.current.meshes[i] = modelMeshes;

            // Apply lightmaps if lightmaps folder exists for this model
            await applyLightmapsToModel(basePath, modelMeshes, scene);

          } catch {
            // Silent catch - error loading individual model
          }
        }

        // Store all meshes combined
        carMeshesRef.current = allMeshes;

        // Warmup GPU for all models
        for (let i = 0; i < meetkaiModelsRef.current.roots.length; i++) {
          const root = meetkaiModelsRef.current.roots[i];
          const meshes = meetkaiModelsRef.current.meshes[i];
          if (root && meshes.length > 0) {
            await warmupModelForGPU(root, meshes, scene, 30);
          }
        }

        // Hide anchor mesh
        anchorMesh.isVisible = false;

        // Mark model as fully loaded
        modelLoadedRef.current.model1 = true;



      } catch {
        // Silent catch - error loading models
      }
    };

    // Load models for anchor_2 (state_5) asynchronously
    // Uses workplaceConfig to determine which models to load (now MeetKai)
    const loadAnchor2ModelsAsync = async () => {

      // Wait a bit to ensure anchors and other assets are loaded
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Get model paths from config
      const config = getWorkplaceConfig(S.state_5);
      if (!config) return;

      const modelFiles = config.projects.map(project => {
        const fullPath = project.modelPath;
        const lastSlash = fullPath.lastIndexOf('/');
        const basePath = fullPath.substring(0, lastSlash + 1);
        const file = fullPath.substring(lastSlash + 1);
        return { name: project.id, basePath, file };
      });

      try {
        // Find the anchor_2 mesh first
        const anchorMesh = scene.getMeshByName("anchor_2");

        if (!anchorMesh) {
          return;
        }

        musecraftAnchorRef.current = anchorMesh;

        // Create a shared parent TransformNode for all models at this anchor
        const anchor2Root = new BABYLON.TransformNode("anchor2Root", scene);
        musecraftRootRef.current = anchor2Root as any;
        moreThanRealRootRef.current = anchor2Root as any;

        // Position at anchor
        const anchorPos = anchorMesh.getAbsolutePosition();
        anchor2Root.position.copyFrom(anchorPos);

        // Apply rotation from anchor
        anchor2Root.rotationQuaternion = BABYLON.Quaternion.Identity();
        const anchorWorldMatrix = anchorMesh.getWorldMatrix();
        anchorWorldMatrix.decompose(undefined, anchor2Root.rotationQuaternion, undefined);

        anchor2Root.scaling.set(1, 1, -1); // Flip Z to match scene orientation
        modelOriginalScales.set(anchor2Root as any, anchor2Root.scaling.clone());
        modelOriginalRotations.set(anchor2Root as any, anchor2Root.rotationQuaternion.clone());

        // Create atom indicator at anchor position
        const atomConfig = atomConfigRef.current.model2;
        const atom = createAtomIndicator({
          scene,
          position: anchorMesh.getAbsolutePosition(),
          idleRingRadius: atomConfig.idleRingRadius,
          expandedRingRadii: atomConfig.expandedRingRadii,
          rotationSpeed: atomConfig.rotationSpeed,
          flameScale: atomConfig.flameScale
        });
        atomIndicatorsRef.current.atom2 = atom;

        // Handle atom visibility based on current state
        const currentState = useUI.getState().state;
        if (currentState < S.state_4 || currentState > S.state_8) {
          atom.root.setEnabled(false);
        } else {
          atom.root.setEnabled(true);
        }

        // Ensure refs have enough slots for all projects
        moreThanRealModelsRef.current.roots = new Array(modelFiles.length).fill(null);
        moreThanRealModelsRef.current.meshes = modelFiles.map(() => []);

        // Load each model
        const allMeshes: BABYLON.AbstractMesh[] = [];

        for (let i = 0; i < modelFiles.length; i++) {
          const { name, basePath, file } = modelFiles[i];

          try {
            const container = await BABYLON.SceneLoader.LoadAssetContainerAsync(
              basePath,
              file,
              scene
            );
            container.addAllToScene();

            if (!container.meshes.length) {
              continue;
            }

            // Get the root mesh of this model
            const modelRoot = container.meshes[0];
            moreThanRealModelsRef.current.roots[i] = modelRoot;

            // Reset model's local position/rotation since parent handles it
            modelRoot.position.set(0, 0, 0);
            if (!modelRoot.rotationQuaternion) {
              modelRoot.rotationQuaternion = BABYLON.Quaternion.Identity();
            }
            modelRoot.rotationQuaternion.copyFrom(BABYLON.Quaternion.Identity());
            modelRoot.scaling.set(1, 1, 1);

            // Store original scale for this child model so scaleModelMeshes uses correct target
            modelOriginalScales.set(modelRoot, modelRoot.scaling.clone());

            // Parent this model to the shared root
            modelRoot.parent = anchor2Root;

            // Setup ambient texture coordinates for materials (AO map UV2 fix)
            // Also fix transparent/glass materials to prevent z-sorting artifacts
            container.materials.forEach(mat => {
              const pbrMat = mat as BABYLON.PBRMaterial;
              if (pbrMat.ambientTexture) {
                pbrMat.ambientTexture.coordinatesIndex = 1;
              }
              // Also check for occlusionTexture (glTF-specific runtime property)
              const matAny = mat as any;
              if (matAny.occlusionTexture) {
                matAny.occlusionTexture.coordinatesIndex = 1;
              }
              // Fix for transparent materials (glass, etc.) - enable depth pre-pass to fix z-sorting artifacts
              if (pbrMat.alpha < 1 || pbrMat.transparencyMode === BABYLON.Material.MATERIAL_ALPHABLEND ||
                pbrMat.transparencyMode === BABYLON.Material.MATERIAL_ALPHATEST ||
                pbrMat.transparencyMode === BABYLON.Material.MATERIAL_ALPHATESTANDBLEND) {
                pbrMat.needDepthPrePass = true;
              }
            });
            // Also check mesh names for glass-related meshes and apply depth pre-pass fix
            container.meshes.forEach(mesh => {
              if (mesh.name.toLowerCase().includes('glass') && mesh.material) {
                mesh.material.needDepthPrePass = true;
              }
            });

            // Stop all animations initially and store them for later use
            container.animationGroups.forEach(group => {
              group.stop();
              group.reset();
            });

            // Store animation groups per model ID for animation controller
            if (container.animationGroups.length > 0) {
              modelAnimationGroupsRef.current.set(name, [...container.animationGroups]);
            }

            // Store meshes for this model
            const modelMeshes: BABYLON.AbstractMesh[] = [];
            container.meshes.forEach(mesh => {
              modelMeshes.push(mesh);
              allMeshes.push(mesh);
              mesh.setEnabled(false);
            });
            moreThanRealModelsRef.current.meshes[i] = modelMeshes;

            // Apply lightmaps if lightmaps folder exists for this model
            await applyLightmapsToModel(basePath, modelMeshes, scene);

          } catch {
            // Silent catch - error loading individual model
          }
        }

        // Store all meshes combined
        musecraftMeshesRef.current = allMeshes;

        // Warmup GPU for all models
        for (let i = 0; i < moreThanRealModelsRef.current.roots.length; i++) {
          const root = moreThanRealModelsRef.current.roots[i];
          const meshes = moreThanRealModelsRef.current.meshes[i];
          if (root && meshes.length > 0) {
            await warmupModelForGPU(root, meshes, scene, 30);
          }
        }

        // Hide anchor mesh
        anchorMesh.isVisible = false;

        // Mark model as fully loaded
        modelLoadedRef.current.model2 = true;



      } catch {
        // Silent catch - error loading models
      }
    };

    // Load models for anchor_3 (state_6) asynchronously
    // Uses workplaceConfig to determine which models to load (now More Than Real)
    const loadAnchor3ModelsAsync = async () => {

      // Wait a bit to ensure anchors and other assets are loaded
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Get model paths from config
      const config = getWorkplaceConfig(S.state_6);
      if (!config) return;

      const modelFiles = config.projects.map(project => {
        const fullPath = project.modelPath;
        const lastSlash = fullPath.lastIndexOf('/');
        const basePath = fullPath.substring(0, lastSlash + 1);
        const file = fullPath.substring(lastSlash + 1);
        return { name: project.id, basePath, file };
      });

      try {
        // Find the anchor_3 mesh first
        const anchorMesh = scene.getMeshByName("anchor_3");

        if (!anchorMesh) {
          return;
        }

        dioramasAnchorRef.current = anchorMesh;
        anchorMesh.isVisible = false;

        // Create parent root TransformNode for all models at this anchor
        const anchor3Root = new BABYLON.TransformNode("anchor3Root", scene);
        dioramasRootRef.current = anchor3Root;

        // Position and rotate the parent root at anchor location
        const anchorPos = anchorMesh.getAbsolutePosition();
        anchor3Root.position.copyFrom(anchorPos);

        // Apply rotation from anchor
        if (!anchor3Root.rotationQuaternion) {
          anchor3Root.rotationQuaternion = BABYLON.Quaternion.Identity();
        }
        const anchorWorldMatrix = anchorMesh.getWorldMatrix();
        anchorWorldMatrix.decompose(undefined, anchor3Root.rotationQuaternion, undefined);

        anchor3Root.scaling.set(1, 1, -1); // Flip Z to match scene orientation
        modelOriginalScales.set(anchor3Root as any, anchor3Root.scaling.clone()); // Store original scale
        modelOriginalRotations.set(anchor3Root as any, anchor3Root.rotationQuaternion.clone()); // Store original rotation

        // Create atom indicator at anchor position
        const atomConfig = atomConfigRef.current.model3;
        const atom = createAtomIndicator({
          scene,
          position: anchorMesh.getAbsolutePosition(),
          idleRingRadius: atomConfig.idleRingRadius,
          expandedRingRadii: atomConfig.expandedRingRadii,
          rotationSpeed: atomConfig.rotationSpeed,
          flameScale: atomConfig.flameScale
        });
        atomIndicatorsRef.current.atom3 = atom;

        // Handle atom visibility based on current state
        const currentState = useUI.getState().state;
        if (currentState < S.state_4 || currentState > S.state_8) {
          atom.root.setEnabled(false);
        } else {
          atom.root.setEnabled(true);
        }

        // Ensure refs have enough slots for all projects
        dioramaModelsRef.current.roots = new Array(modelFiles.length).fill(null);
        dioramaModelsRef.current.meshes = modelFiles.map(() => []);

        // Load each model
        const allMeshes: BABYLON.AbstractMesh[] = [];

        for (let i = 0; i < modelFiles.length; i++) {
          const { name, basePath, file } = modelFiles[i];

          try {
            const container = await BABYLON.SceneLoader.LoadAssetContainerAsync(
              basePath,
              file,
              scene
            );
            container.addAllToScene();

            if (!container.meshes.length) {
              continue;
            }

            // Get the root mesh of this model
            const modelRoot = container.meshes[0];
            dioramaModelsRef.current.roots[i] = modelRoot;

            // Reset model's local position/rotation since parent handles it
            modelRoot.position.set(0, 0, 0);
            if (!modelRoot.rotationQuaternion) {
              modelRoot.rotationQuaternion = BABYLON.Quaternion.Identity();
            }
            modelRoot.rotationQuaternion.copyFrom(BABYLON.Quaternion.Identity());
            modelRoot.scaling.set(1, 1, 1);

            // Store original scale for this child model so scaleModelMeshes uses correct target
            modelOriginalScales.set(modelRoot, modelRoot.scaling.clone());

            // Parent this model to the shared root
            modelRoot.parent = anchor3Root;

            // Setup ambient texture coordinates for materials (AO map UV2 fix)
            container.materials.forEach(mat => {
              const pbrMat = mat as BABYLON.PBRMaterial;
              if (pbrMat.ambientTexture) {
                pbrMat.ambientTexture.coordinatesIndex = 1;
              }
              // Also check for occlusionTexture (glTF-specific runtime property)
              const matAny = mat as any;
              if (matAny.occlusionTexture) {
                matAny.occlusionTexture.coordinatesIndex = 1;
              }
            });

            // Stop all animations
            container.animationGroups.forEach(group => {
              group.stop();
              group.reset();
            });

            // Store animation groups per model ID for animation controller
            if (container.animationGroups.length > 0) {
              modelAnimationGroupsRef.current.set(name, [...container.animationGroups]);
            }

            // Store meshes for this model
            const modelMeshes: BABYLON.AbstractMesh[] = [];
            container.meshes.forEach(mesh => {
              modelMeshes.push(mesh);
              allMeshes.push(mesh);
              // IMPORTANT: Hide immediately to prevent visibility flash before warmup
              mesh.setEnabled(false);
            });
            dioramaModelsRef.current.meshes[i] = modelMeshes;

            // Apply lightmaps if lightmaps folder exists for this model
            await applyLightmapsToModel(basePath, modelMeshes, scene);
          } catch {
            // Silent catch - error loading individual model
          }
        }

        // Store all meshes combined
        dioramasMeshesRef.current = allMeshes;

        // Warmup GPU for all models
        for (let i = 0; i < dioramaModelsRef.current.roots.length; i++) {
          const root = dioramaModelsRef.current.roots[i];
          const meshes = dioramaModelsRef.current.meshes[i];
          if (root && meshes.length > 0) {
            await warmupModelForGPU(root, meshes, scene, 30);
          }
        }

        // Initially hide all meshes - proximity detection will show them
        allMeshes.forEach(mesh => {
          mesh.setEnabled(false);
        });
        modelVisibilityRef.current.model3 = false;

        // Mark model as fully loaded
        modelLoadedRef.current.model3 = true;


      } catch {
        // Silent catch - error loading models
      }
    };

    // Load models for anchor_4 (state_7) asynchronously
    // Uses workplaceConfig to determine which models to load (now Baltha Maker)
    const loadAnchor4ModelsAsync = async () => {

      // Wait a bit to ensure anchors and other assets are loaded
      await new Promise(resolve => setTimeout(resolve, 3500));

      // Get model paths from config
      const config = getWorkplaceConfig(S.state_7);
      if (!config) return;

      const modelFiles = config.projects.map(project => {
        const fullPath = project.modelPath;
        const lastSlash = fullPath.lastIndexOf('/');
        const basePath = fullPath.substring(0, lastSlash + 1);
        const file = fullPath.substring(lastSlash + 1);
        return { name: project.id, basePath, file };
      });

      try {
        // Find the anchor_4 mesh first
        const anchorMesh = scene.getMeshByName("anchor_4");

        if (!anchorMesh) {
          return;
        }

        petwheelsAnchorRef.current = anchorMesh;

        // Create a shared parent TransformNode for all models at this anchor
        const anchor4Root = new BABYLON.TransformNode("anchor4Root", scene);
        petwheelsRootRef.current = anchor4Root as any;
        ufscRootRef.current = anchor4Root;

        // Position at anchor
        const anchorPos = anchorMesh.getAbsolutePosition();
        anchor4Root.position.copyFrom(anchorPos);

        // Apply rotation from anchor
        anchor4Root.rotationQuaternion = BABYLON.Quaternion.Identity();
        const anchorWorldMatrix = anchorMesh.getWorldMatrix();
        anchorWorldMatrix.decompose(undefined, anchor4Root.rotationQuaternion, undefined);

        anchor4Root.scaling.set(1, 1, -1);
        modelOriginalScales.set(anchor4Root as any, anchor4Root.scaling.clone());
        modelOriginalRotations.set(anchor4Root as any, anchor4Root.rotationQuaternion.clone());

        // Create atom indicator at anchor position
        const atomConfig = atomConfigRef.current.model4;
        const atom = createAtomIndicator({
          scene,
          position: anchorMesh.getAbsolutePosition(),
          idleRingRadius: atomConfig.idleRingRadius,
          expandedRingRadii: atomConfig.expandedRingRadii,
          rotationSpeed: atomConfig.rotationSpeed,
          flameScale: atomConfig.flameScale
        });
        atomIndicatorsRef.current.atom4 = atom;

        // Handle atom visibility based on current state
        const currentState = useUI.getState().state;
        if (currentState < S.state_4 || currentState > S.state_8) {
          atom.root.setEnabled(false);
        } else {
          atom.root.setEnabled(true);
        }

        // Ensure refs have enough slots for all projects
        ufscModelsRef.current.roots = new Array(modelFiles.length).fill(null);
        ufscModelsRef.current.meshes = modelFiles.map(() => []);

        // Load each model
        const allMeshes: BABYLON.AbstractMesh[] = [];

        for (let i = 0; i < modelFiles.length; i++) {
          const { name, basePath, file } = modelFiles[i];

          try {
            const container = await BABYLON.SceneLoader.LoadAssetContainerAsync(
              basePath,
              file,
              scene
            );
            container.addAllToScene();

            if (!container.meshes.length) {
              continue;
            }

            // Get the root mesh of this model
            const modelRoot = container.meshes[0];
            ufscModelsRef.current.roots[i] = modelRoot;

            // Reset model's local position/rotation since parent handles it
            modelRoot.position.set(0, 0, 0);
            if (!modelRoot.rotationQuaternion) {
              modelRoot.rotationQuaternion = BABYLON.Quaternion.Identity();
            }
            modelRoot.rotationQuaternion.copyFrom(BABYLON.Quaternion.Identity());
            modelRoot.scaling.set(1, 1, 1);

            // Store original scale for this child model so scaleModelMeshes uses correct target
            modelOriginalScales.set(modelRoot, modelRoot.scaling.clone());

            // Parent this model to the shared root
            modelRoot.parent = anchor4Root;

            // Setup ambient texture coordinates for materials (AO map UV2 fix)
            container.materials.forEach(mat => {
              const pbrMat = mat as BABYLON.PBRMaterial;
              if (pbrMat.ambientTexture) {
                pbrMat.ambientTexture.coordinatesIndex = 1;
              }
              // Also check for occlusionTexture (glTF-specific runtime property)
              const matAny = mat as any;
              if (matAny.occlusionTexture) {
                matAny.occlusionTexture.coordinatesIndex = 1;
              }
            });

            // Stop all animations initially and store them for later use
            container.animationGroups.forEach(group => {
              group.stop();
              group.reset();
            });

            // Store animation groups per model ID for animation controller
            if (container.animationGroups.length > 0) {
              modelAnimationGroupsRef.current.set(name, [...container.animationGroups]);
            }

            // Store meshes for this model
            const modelMeshes: BABYLON.AbstractMesh[] = [];
            container.meshes.forEach(mesh => {
              modelMeshes.push(mesh);
              allMeshes.push(mesh);
              mesh.setEnabled(false);
            });
            ufscModelsRef.current.meshes[i] = modelMeshes;

            // Apply lightmaps if lightmaps folder exists for this model
            await applyLightmapsToModel(basePath, modelMeshes, scene);

          } catch {
            // Silent catch - error loading individual model
          }
        }

        // Store all meshes combined
        petwheelsMeshesRef.current = allMeshes;
        ufscMeshesRef.current = allMeshes;

        // Warmup GPU for all models
        for (let i = 0; i < ufscModelsRef.current.roots.length; i++) {
          const root = ufscModelsRef.current.roots[i];
          const meshes = ufscModelsRef.current.meshes[i];
          if (root && meshes.length > 0) {
            await warmupModelForGPU(root, meshes, scene, 30);
          }
        }

        // Hide anchor
        anchorMesh.isVisible = false;

        // Mark model as fully loaded
        modelLoadedRef.current.model4 = true;



      } catch {
        // Silent catch - error loading models
      }
    };

    // Load models for anchor_5 (state_8) asynchronously
    // Uses workplaceConfig to determine which models to load (now UFSC)
    const loadAnchor5ModelsAsync = async () => {

      // Wait a bit to ensure anchors and other assets are loaded
      await new Promise(resolve => setTimeout(resolve, 4000));

      // Get model paths from config
      const config = getWorkplaceConfig(S.state_8);
      if (!config) return;

      const modelFiles = config.projects.map(project => {
        const fullPath = project.modelPath;
        const lastSlash = fullPath.lastIndexOf('/');
        const basePath = fullPath.substring(0, lastSlash + 1);
        const file = fullPath.substring(lastSlash + 1);
        return { name: project.id, basePath, file };
      });

      try {
        // Find the anchor_5 mesh first
        const anchorMesh = scene.getMeshByName("anchor_5");

        if (!anchorMesh) {
          return;
        }

        personalAnchorRef.current = anchorMesh;

        // Create a shared parent TransformNode for all models at this anchor
        const anchor5Root = new BABYLON.TransformNode("anchor5Root", scene);
        personalRootRef.current = anchor5Root;

        // Position at anchor
        const anchorPos = anchorMesh.getAbsolutePosition();
        anchor5Root.position.copyFrom(anchorPos);

        // Apply rotation from anchor
        anchor5Root.rotationQuaternion = BABYLON.Quaternion.Identity();
        const anchorWorldMatrix = anchorMesh.getWorldMatrix();
        anchorWorldMatrix.decompose(undefined, anchor5Root.rotationQuaternion, undefined);

        anchor5Root.scaling.set(1, 1, -1);
        modelOriginalScales.set(anchor5Root as any, anchor5Root.scaling.clone());
        modelOriginalRotations.set(anchor5Root as any, anchor5Root.rotationQuaternion.clone());

        // Create atom indicator at anchor position
        const atomConfig = atomConfigRef.current.model5;
        const atom = createAtomIndicator({
          scene,
          position: anchorMesh.getAbsolutePosition(),
          idleRingRadius: atomConfig.idleRingRadius,
          expandedRingRadii: atomConfig.expandedRingRadii,
          rotationSpeed: atomConfig.rotationSpeed,
          flameScale: atomConfig.flameScale
        });
        atomIndicatorsRef.current.atom5 = atom;

        // Handle atom visibility based on current state
        const currentState = useUI.getState().state;
        if (currentState < S.state_4 || currentState > S.state_8) {
          atom.root.setEnabled(false);
        } else {
          atom.root.setEnabled(true);
        }

        // Ensure refs have enough slots for all projects
        personalModelsRef.current.roots = new Array(modelFiles.length).fill(null);
        personalModelsRef.current.meshes = modelFiles.map(() => []);

        // Load each model
        const allMeshes: BABYLON.AbstractMesh[] = [];

        for (let i = 0; i < modelFiles.length; i++) {
          const { name, basePath, file } = modelFiles[i];

          try {
            const container = await BABYLON.SceneLoader.LoadAssetContainerAsync(
              basePath,
              file,
              scene
            );
            container.addAllToScene();

            if (!container.meshes.length) {
              continue;
            }

            // Get the root mesh of this model
            const modelRoot = container.meshes[0];
            personalModelsRef.current.roots[i] = modelRoot;

            // Reset model's local position/rotation since parent handles it
            modelRoot.position.set(0, 0, 0);
            if (!modelRoot.rotationQuaternion) {
              modelRoot.rotationQuaternion = BABYLON.Quaternion.Identity();
            }
            modelRoot.rotationQuaternion.copyFrom(BABYLON.Quaternion.Identity());
            modelRoot.scaling.set(1, 1, 1);

            // Store original scale for this child model so scaleModelMeshes uses correct target
            modelOriginalScales.set(modelRoot, modelRoot.scaling.clone());

            // Parent this model to the shared root
            modelRoot.parent = anchor5Root;

            // Setup ambient texture coordinates for materials (AO map UV2 fix)
            container.materials.forEach(mat => {
              const pbrMat = mat as BABYLON.PBRMaterial;
              if (pbrMat.ambientTexture) {
                pbrMat.ambientTexture.coordinatesIndex = 1;
              }
              // Also check for occlusionTexture (glTF-specific runtime property)
              const matAny = mat as any;
              if (matAny.occlusionTexture) {
                matAny.occlusionTexture.coordinatesIndex = 1;
              }
            });

            // Stop all animations
            container.animationGroups.forEach(group => {
              group.stop();
              group.reset();
            });

            // Store animation groups per model ID for animation controller
            if (container.animationGroups.length > 0) {
              modelAnimationGroupsRef.current.set(name, [...container.animationGroups]);
            }

            // Store meshes for this model
            const modelMeshes: BABYLON.AbstractMesh[] = [];
            container.meshes.forEach(mesh => {
              modelMeshes.push(mesh);
              allMeshes.push(mesh);
              mesh.setEnabled(false);
            });
            personalModelsRef.current.meshes[i] = modelMeshes;

            // Apply lightmaps if lightmaps folder exists for this model
            await applyLightmapsToModel(basePath, modelMeshes, scene);

          } catch {
            // Silent catch - error loading individual model
          }
        }

        // Store all meshes combined
        personalMeshesRef.current = allMeshes;

        // Warmup GPU for all models
        for (let i = 0; i < personalModelsRef.current.roots.length; i++) {
          const root = personalModelsRef.current.roots[i];
          const meshes = personalModelsRef.current.meshes[i];
          if (root && meshes.length > 0) {
            await warmupModelForGPU(root, meshes, scene, 30);
          }
        }

        // Hide anchor
        anchorMesh.isVisible = false;

        // Mark model as fully loaded
        modelLoadedRef.current.model5 = true;



      } catch {
        // Silent catch - error loading models
      }
    };

    // Start loading all models asynchronously (doesn't affect loading screen)
    // Each loader reads from workplaceConfig to get the correct model paths
    loadAnchor1ModelsAsync();
    loadAnchor2ModelsAsync();
    loadAnchor3ModelsAsync();
    loadAnchor4ModelsAsync();
    loadAnchor5ModelsAsync();

    // Distance-based visibility for unified Workplace panel
    // Show the panel when near any of the 5 project anchors (anchor_1 to anchor_5)
    const WORKPLACE_VISIBILITY_DISTANCE = 20; // Threshold distance to show panel

    scene.onBeforeRenderObservable.add(() => {
      // Early return if ship not loaded yet
      if (!spaceshipRootRef.current) {
        return;
      }

      const shipPosition = spaceshipRootRef.current.getAbsolutePosition();

      // Get all potential anchors with their corresponding states
      // Config order: Musecraft (state_4) → MeetKai (state_5) → More Than Real (state_6) → Baltha Maker (state_7) → UFSC (state_8)
      const anchorStateMap: { anchor: BABYLON.AbstractMesh | null; state: S }[] = [
        { anchor: carAnchorRef.current, state: S.state_4 },       // anchor_1 - Musecraft (Personal Project)
        { anchor: musecraftAnchorRef.current, state: S.state_5 }, // anchor_2 - MeetKai
        { anchor: dioramasAnchorRef.current, state: S.state_6 },  // anchor_3 - More Than Real
        { anchor: petwheelsAnchorRef.current, state: S.state_7 }, // anchor_4 - Baltha Maker
        { anchor: personalAnchorRef.current, state: S.state_8 },  // anchor_5 - UFSC
      ];

      // Find nearest anchor and its distance
      let nearestDistance = Infinity;
      let nearestState: S | null = null;

      for (const { anchor, state } of anchorStateMap) {
        if (anchor) {
          const distance = BABYLON.Vector3.Distance(shipPosition, anchor.getAbsolutePosition());
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestState = state;
          }
        }
      }

      // Determine if we should show the panel
      const shouldBeVisible = nearestDistance <= WORKPLACE_VISIBILITY_DISTANCE;
      const currentlyVisible = useUI.getState().workplacePanelVisible;
      const currentActiveState = useUI.getState().activeWorkplaceState;

      // Update panel visibility
      if (shouldBeVisible && !currentlyVisible) {
        useUI.getState().setWorkplacePanelVisible(true);
      } else if (!shouldBeVisible && currentlyVisible) {
        useUI.getState().setWorkplacePanelVisible(false);
      }

      // Update active workplace state (which anchor content to show)
      // Only update when near an anchor
      if (shouldBeVisible && nearestState !== null && nearestState !== currentActiveState) {
        useUI.getState().setActiveWorkplaceState(nearestState);
      } else if (!shouldBeVisible && currentActiveState !== null) {
        // Clear active state when not near any anchor
        useUI.getState().setActiveWorkplaceState(null);
      }

      // ===== DISTANCE-BASED FADE FOR ATOMS AND FLOATING PARTICLES =====
      // When ship is far from center, fade out atoms and curve particles smoothly
      const sceneCenter = BABYLON.Vector3.Zero();
      const distanceFromCenter = BABYLON.Vector3.Distance(shipPosition, sceneCenter);
      const fadeConfig = distanceFadeRef.current;

      // Calculate target fade ratio based on distance
      let targetRatio = 1;
      if (distanceFromCenter >= fadeConfig.fadeEndDistance) {
        targetRatio = 0;
      } else if (distanceFromCenter > fadeConfig.fadeStartDistance) {
        // Linear interpolation between start and end distances
        const fadeRange = fadeConfig.fadeEndDistance - fadeConfig.fadeStartDistance;
        const distanceIntoFade = distanceFromCenter - fadeConfig.fadeStartDistance;
        targetRatio = 1 - (distanceIntoFade / fadeRange);
      }

      // Smooth interpolation towards target ratio (prevents abrupt changes)
      const smoothSpeed = 3; // Higher = faster transition
      const dt = scene.getEngine().getDeltaTime() * 0.001;
      fadeConfig.currentRatio += (targetRatio - fadeConfig.currentRatio) * Math.min(1, dt * smoothSpeed);

      // Clamp to valid range
      fadeConfig.currentRatio = Math.max(0, Math.min(1, fadeConfig.currentRatio));

      // Apply fade to curve particles (floating particles in center)
      const curveParticles = curveParticleSystemRef.current;
      if (curveParticles && curveParticles.isStarted()) {
        const baseRate = fadeConfig.baseEmitRates.curveParticles;
        curveParticles.emitRate = baseRate * fadeConfig.currentRatio;
      }

      // Apply fade to all atom indicators (5 atoms for 5 anchors)
      const atoms = atomIndicatorsRef.current;
      const atomKeys = ['atom1', 'atom2', 'atom3', 'atom4', 'atom5'] as const;

      atomKeys.forEach(key => {
        const atom = atoms[key];
        if (!atom) return;

        // Fade flame particle emit rate
        if (atom.flame) {
          const baseFlameRate = fadeConfig.baseEmitRates.atomFlames;
          atom.flame.emitRate = baseFlameRate * fadeConfig.currentRatio;
        }

        // Scale the entire atom root to fade rings and all elements together
        // This provides a smooth fade effect for LinesMesh (rings) which don't support visibility well
        const scaleValue = Math.max(0.001, fadeConfig.currentRatio); // Prevent zero scale
        atom.root.scaling.setAll(scaleValue);
      });
    });


    // Also react to window resizes (DPR changes)
    const onWinResize = () => {
      lastW = 0; lastH = 0; // force next RAF to resync
    };
    window.addEventListener("resize", onWinResize);

    return () => {
      window.removeEventListener("resize", onWinResize);
      engine.stopRenderLoop();
      scene.dispose();
      engine.dispose();
    };
  }, []); // Initialize once only

  // Mouse tracking for subtle rotation
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) return; // Don't track mouse while dragging

      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      // Calculate offset from center, normalized to -1 to 1
      const offsetX = (e.clientX - centerX) / centerX;
      const offsetY = (e.clientY - centerY) / centerY;

      // Apply subtle rotation (max 0.1 radians = ~5.7 degrees)
      mouseRotationRef.current.x = offsetY * 0.25;
      mouseRotationRef.current.y = offsetX * -0.4;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Device orientation for mobile
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;
      if (isDraggingRef.current) return; // Don't track orientation while dragging

      // beta: front-to-back tilt (-180 to 180)
      // gamma: left-to-right tilt (-90 to 90)
      const beta = e.beta || 0;
      const gamma = e.gamma || 0;

      // Convert to radians and apply subtle rotation
      // mouseRotationRef.current.x = (beta / 180) * .6;
      mouseRotationRef.current.y = (gamma / 90) * .6;
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  // Advanced spaceship controls with animation blending (only in free mode)
  const navigationMode = useUI((st) => st.navigationMode);

  useEffect(() => {
    const scene = sceneRef.current;
    const canvas = ref.current;
    const spaceship = spaceshipRef.current;

    if (!scene || !canvas) return;

    const ShipControls = shipControlsRef.current;
    const flame = flameParticleSystemRef.current;

    // Only enable controls in states 4-7 with free mode
    const inFreeExploreState = s >= S.state_4 && s <= S.state_8;
    const shouldEnableControls = inFreeExploreState && navigationMode === 'free';

    // Get ship animation timing to delay controls until animation completes
    const sceneConfig = config.canvas.babylonScene;
    const shipConfig = sceneConfig?.shipAnimation;
    const shipAnimDuration = shipConfig?.duration ?? 0;
    const shipAnimDelay = shipConfig?.delay ?? 0;
    const totalShipAnimTime = (shipAnimDuration + shipAnimDelay) * 1000; // Convert to ms

    // Cleanup previous observer if exists
    if (ShipControls.observer) {
      scene.onBeforeRenderObservable.remove(ShipControls.observer);
      ShipControls.observer = null;
    }

    // Disable controls in guided mode but play idle animation
    if (!shouldEnableControls) {

      // Clear keys and reset velocity
      ShipControls.keys = {};
      ShipControls.pitch = 0;
      ShipControls.yawTarget = 0;
      ShipControls.pitchVel = 0;
      ShipControls.velocity.set(0, 0, 0); // Reset velocity when disabling controls

      // Reset engine sound velocity when switching away from free mode
      updateEngineVelocity(0);

      // Play idle animation in guided mode if spaceship is loaded
      if (spaceship) {
        const idleAnim = scene.getAnimationGroupByName("idle");
        if (idleAnim && !idleAnim.isPlaying) {
          // Stop all other animations
          scene.animationGroups.forEach(g => {
            if (g !== idleAnim && g.isPlaying) {
              g.stop();
            }
          });
          idleAnim.play(true);
        }
      }

      return;
    }

    // Enable controls in free mode (with delay if ship is animating)
    if (!spaceship) {
      return;
    }

    // Store handlers for cleanup
    let handleKeyDown: ((e: KeyboardEvent) => void) | null = null;
    let handleKeyUp: ((e: KeyboardEvent) => void) | null = null;
    let handlePointerDown: ((e: PointerEvent) => void) | null = null;
    let handlePointerMove: ((e: PointerEvent) => void) | null = null;
    let handlePointerUp: ((e: PointerEvent) => void) | null = null;
    let handleContextMenu: ((e: Event) => void) | null = null;

    // ========== REGISTER POINTER HANDLERS IMMEDIATELY ==========
    // This allows camera rotation/drag to work immediately when switching to free mode,
    // without waiting for the ship animation to complete.
    // The actual ship movement logic will still wait inside the setTimeout below.
    const MC = mobileControlRef.current;

    // Prevent context menu on right-click so we can use it for camera rotation
    handleContextMenu = (e: Event) => {
      e.preventDefault();
    };

    handlePointerDown = (e: PointerEvent) => {
      MC.isDragging = true;
      MC.isRightClick = e.button === 2; // Right-click = camera rotation only, no movement
      MC.yawRate = 0; // Reset turn rate when starting drag
      // Update pointer position immediately so edge detection works on first frame
      MC.pointerX = e.clientX;
      MC.pointerY = e.clientY;
    };

    handlePointerMove = (e: PointerEvent) => {
      if (!MC.isDragging) return;

      // Just update pointer position - raycasting happens in render loop
      MC.pointerX = e.clientX;
      MC.pointerY = e.clientY;
    };

    handlePointerUp = (e: PointerEvent) => {
      MC.isDragging = false;
      MC.isRightClick = false;
      MC.hasDirection = false;
      MC.cameraRotation = 0; // Stop camera rotation
      MC.yawRate = 0; // Reset turn rate
      MC.previousYaw = 0; // Reset previous yaw
      // Clear side trigger visual effect when drag ends
      useUI.getState().setSideTrigger(null);
    };

    // Register pointer event handlers IMMEDIATELY (no delay)
    canvas.addEventListener('contextmenu', handleContextMenu);
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerUp);

    // Delay enabling ship MOVEMENT controls until ship animation completes
    // (camera rotation via edge detection still works immediately via the handlers above)
    const controlsTimeoutId = setTimeout(() => {

      // Get shipRoot - this is required now
      let shipRoot = spaceshipRootRef.current;
      if (!shipRoot) {
        shipRoot = scene.getTransformNodeByName("shiproot");
        if (shipRoot) {
          spaceshipRootRef.current = shipRoot;
          shipRoot.rotationQuaternion = shipRoot.rotationQuaternion || BABYLON.Quaternion.Identity();
        } else {
          return;
        }
      }

      // Always use shipRoot as control target
      const controlTarget = shipRoot;

      // Ensure quaternion is initialized, but DON'T reset existing rotation
      if (!controlTarget.rotationQuaternion) {
        // Convert euler to quaternion if it exists
        controlTarget.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(
          controlTarget.rotation.x,
          controlTarget.rotation.y,
          controlTarget.rotation.z
        );
      }

      // Get camera reference
      const camera = cameraRef.current;

      // Initial ship state is saved when ship loads - don't overwrite it here
      // as the ship may have been rotated by bezier animation at this point

      // Initialize control angles from current ship rotation (only on first enable)
      if (ShipControls.pitch === 0 && ShipControls.yawTarget === 0) {
        const euler = controlTarget.rotationQuaternion.toEulerAngles();
        ShipControls.pitch = euler.x;
        ShipControls.yawTarget = euler.y;
      }

      // Setup camera following - parent pivot to shipRoot at rotation center
      const shipPivot = shipPivotRef.current;

      if (shipPivot && shipPivot.parent !== controlTarget) {
        shipPivot.setParent(controlTarget);
        // Different position for mobile vs desktop
        const pivotY = isMobileRef.current ? 1.17 : 0.9;
        shipPivot.position.set(0, pivotY, 0);
        shipPivot.rotationQuaternion = BABYLON.Quaternion.Identity();

        // Parent smoke emitter to shipPivot so it follows the ship (like prototype)
        const smokeEmitter = smokeEmitterRef.current;
        if (smokeEmitter && !smokeEmitter.parent) {
          smokeEmitter.parent = shipPivot;
        }

        // Camera targets the center pivot (ship rotates correctly around its center)
        if (camera) {
          camera.lockedTarget = shipPivot;
        }
      }

      // Helper: get animation groups
      const grab = () => ({
        fwd: scene.getAnimationGroupByName("forward"),
        brk: scene.getAnimationGroupByName("stop"),
        L: scene.getAnimationGroupByName("turnRight"),
        R: scene.getAnimationGroupByName("turnLeft"),
        I: scene.getAnimationGroupByName("idle")
      });

      // Check what animation groups exist in the scene

      const A = grab();

      // Setup animation groups if they exist
      if (A.fwd && A.brk && A.L && A.R && A.I) {
        Object.values(A).forEach(g => {
          if (g) {
            g.enableBlending = true;
            g.blendingSpeed = 0.06;
            g.loopAnimation = true;
            g.stop();
            g.reset();
          }
        });
        A.I.play(true); // Start with idle
      }


      // Keyboard listeners (commented out - using drag controls for both mobile and desktop)
      // handleKeyDown = (e: KeyboardEvent) => {
      //   ShipControls.keys[e.key.toLowerCase()] = true;
      // };

      // handleKeyUp = (e: KeyboardEvent) => {
      //   ShipControls.keys[e.key.toLowerCase()] = false;
      // };

      // window.addEventListener('keydown', handleKeyDown);
      // window.addEventListener('keyup', handleKeyUp);

      // canvas.tabIndex = 1;
      // canvas.focus();


      // Get MC reference for the render loop observer (handlers were registered immediately outside setTimeout)
      const MC = mobileControlRef.current;

      // Animation blending helper
      let lastPlayedAnim = "idle";
      const play = (target: BABYLON.AnimationGroup | undefined, step: number) => {
        if (!target) return;

        // Log when animation changes
        if (target.name !== lastPlayedAnim) {
          lastPlayedAnim = target.name;
        }

        Object.values(A).forEach(g => {
          if (!g) return;

          let w = (g as any).weight || 0;
          if (g === target) {
            if (!g.isPlaying) {
              g.play(true);
            }
            w += step * (1 - w);
          } else {
            w -= step * w;
            if (w < 0.01 && g.isPlaying) {
              g.stop();
            }
          }
          (g as any).weight = BABYLON.Scalar.Clamp(w, 0, 1);
        });
      };

      // Constants
      const PITCH_RATE = Math.PI / 1.5;
      const SMOOTH = 5;

      // Per-frame update
      let frameCount = 0;
      ShipControls.observer = scene.onBeforeRenderObservable.add(() => {
        const dt = scene.getEngine().getDeltaTime() * 0.001;
        const K = ShipControls.keys;

        // Skip ship controls if user is rotating model in free mode
        if (freeModeDraggingModelRef.current) {
          return;
        }

        // Drag control: Update direction and edge rotation every frame (works for both mobile and desktop)
        if (MC.isDragging) {
          // Check if pointer is near screen edges (10% threshold)
          const screenWidth = window.innerWidth;
          const edgeThreshold = isMobileRef.current ? screenWidth * 0.1 : screenWidth * 0.20;

          if (MC.pointerX < edgeThreshold) {
            MC.cameraRotation = -1; // Rotate left
            useUI.getState().setSideTrigger('left'); // Update side trigger visual
          } else if (MC.pointerX > screenWidth - edgeThreshold) {
            MC.cameraRotation = 1; // Rotate right
            useUI.getState().setSideTrigger('right'); // Update side trigger visual
          } else {
            MC.cameraRotation = 0; // No edge rotation
            useUI.getState().setSideTrigger(null); // Clear side trigger visual
          }

          // Only capture forward direction on left-click (not right-click)
          // Right-click allows camera rotation without moving the ship
          if (!MC.isRightClick) {
            // Raycast from current pointer position to control sphere
            const pickInfo = scene.pick(MC.pointerX, MC.pointerY, (mesh) => mesh === controlSphereRef.current);

            if (pickInfo && pickInfo.hit && pickInfo.pickedPoint) {
              // Get direction from ship to picked point on sphere
              const shipPos = controlTarget.getAbsolutePosition();
              const targetPoint = pickInfo.pickedPoint;
              const direction = targetPoint.subtract(shipPos).normalize();

              MC.targetDirection = direction;
              MC.hasDirection = true;
            }
          }
        }

        // Camera edge rotation (when dragging near screen edges)
        if (camera && MC.cameraRotation !== 0) {
          const rotationSpeed = 1.5; // Radians per second
          camera.alpha -= MC.cameraRotation * rotationSpeed * dt;
        }

        frameCount++;

        // Drag-based controls (unified for mobile and desktop)
        // ========== DRAG CONTROLS ==========
        // Rotation and movement are both based on drag direction
        {

          const BLEND_PER_SEC = 4;
          const wStep = BLEND_PER_SEC * dt;

          if (MC.isDragging && MC.hasDirection) {
            // Calculate rotation to face the drag direction
            const targetDir = MC.targetDirection.clone().normalize();

            // Invert Y and Z to fix direction (sphere interior pointing)
            targetDir.y *= -1;
            targetDir.z *= -1;

            // Add upward bias to create "camera from above" effect
            targetDir.y -= 0.2; // Force ship to point slightly upward
            targetDir.normalize();

            // Calculate yaw (rotation around Y axis) from X and Z components
            const yaw = Math.atan2(targetDir.x, targetDir.z);

            // Initialize previousYaw on first frame with direction
            if (MC.yawRate === 0 && MC.previousYaw === 0) {
              MC.previousYaw = yaw;
            }

            // Calculate yaw rate (how fast we're turning) for animation blending
            const yawDelta = yaw - MC.previousYaw;
            // Normalize angle difference to -PI to PI range
            const normalizedDelta = Math.atan2(Math.sin(yawDelta), Math.cos(yawDelta));
            // Calculate turn rate (positive = right, negative = left)
            const rawYawRate = normalizedDelta / dt;

            // Smooth the yaw rate with interpolation to avoid jitter
            const smoothFactor = Math.min(1, dt * 5);
            MC.yawRate += (rawYawRate - MC.yawRate) * smoothFactor;

            // Normalize yaw rate to -1 to 1 range (1 rad/s = significant turn)
            const normalizedYawRate = BABYLON.Scalar.Clamp(MC.yawRate / 1.5, -1, 1);

            // Store current yaw for next frame
            MC.previousYaw = yaw;

            // Calculate blend weights for animation
            const absTurnRate = Math.abs(normalizedYawRate);
            // When turning hard, favor turn animation
            // When going straight, favor forward animation
            const forwardWeight = 1 - absTurnRate; // 1 when straight, 0 when turning hard
            const turnWeight = absTurnRate; // 0 when straight, 1 when turning hard

            // Proportional animation blending based on turn rate
            if (A.fwd && A.L && A.R) {
              // Determine which turn animation to use
              const turnAnim = normalizedYawRate > 0 ? A.L : A.R; // Positive = right, negative = left

              // Apply blending using manual weight control
              Object.values(A).forEach(g => {
                if (!g) return;

                let w = (g as any).weight || 0;

                if (g === A.fwd) {
                  // Forward animation weight
                  w += wStep * (forwardWeight - w);
                  if (!g.isPlaying && forwardWeight > 0.1) {
                    g.play(true);
                  }
                } else if (g === turnAnim) {
                  // Active turn animation weight
                  w += wStep * (turnWeight - w);
                  if (!g.isPlaying && turnWeight > 0.1) {
                    g.play(true);
                  }
                } else {
                  // Fade out other animations
                  w -= wStep * w;
                  if (w < 0.01 && g.isPlaying) {
                    g.stop();
                  }
                }

                (g as any).weight = BABYLON.Scalar.Clamp(w, 0, 1);
              });
            }

            // Calculate pitch (rotation around X axis) from Y component
            const horizontalDist = Math.sqrt(targetDir.x * targetDir.x + targetDir.z * targetDir.z);
            const pitch = -Math.atan2(targetDir.y, horizontalDist);

            // Create rotation quaternion from yaw and pitch
            const qYaw = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, yaw);
            const qPitch = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.X, pitch);
            const targetRotation = qYaw.multiply(qPitch);

            // Smoothly interpolate to target rotation
            controlTarget.rotationQuaternion = BABYLON.Quaternion.Slerp(
              controlTarget.rotationQuaternion!,
              targetRotation,
              Math.min(1, dt * 8) // Smooth rotation speed
            );

            // Move in the ship's forward direction (after rotation)
            const forwardVector = new BABYLON.Vector3(0, 0, 1);
            const dir = BABYLON.Vector3.TransformNormal(
              forwardVector,
              controlTarget.getWorldMatrix()
            ).normalize();

            // Invert X axis (like desktop controls)
            dir.x *= -1;

            // ===== PROXIMITY-BASED SPEED REDUCTION =====
            // Calculate distance to nearest anchor - ship slows down when inside anchor zones
            const ANCHOR_SLOW_RADIUS = 18; // Same as WORKPLACE_VISIBILITY_DISTANCE
            const MIN_SPEED_MULT = 0.28; // Half speed at center

            // Get ship position for proximity check
            const shipPos = controlTarget.getAbsolutePosition();

            // Check distance to all anchors and find minimum
            const anchorRefs = [
              carAnchorRef.current,      // anchor_1 - Musecraft
              musecraftAnchorRef.current, // anchor_2 - MeetKai  
              dioramasAnchorRef.current,  // anchor_3 - More Than Real
              petwheelsAnchorRef.current, // anchor_4 - Baltha Maker
              personalAnchorRef.current   // anchor_5 - UFSC
            ];

            let minDistance = Infinity;
            for (const anchor of anchorRefs) {
              if (anchor) {
                const distance = BABYLON.Vector3.Distance(shipPos, anchor.getAbsolutePosition());
                if (distance < minDistance) {
                  minDistance = distance;
                }
              }
            }

            // Calculate target speed multiplier based on distance
            // At radius edge (20): multiplier = 1.0
            // At center (0): multiplier = 0.5
            // Formula: 0.5 + 0.5 * (distance / radius) when inside radius
            if (minDistance < ANCHOR_SLOW_RADIUS) {
              const distanceRatio = minDistance / ANCHOR_SLOW_RADIUS;
              proximitySpeedRef.current.targetMultiplier = MIN_SPEED_MULT + (1 - MIN_SPEED_MULT) * distanceRatio;
            } else {
              proximitySpeedRef.current.targetMultiplier = 1.0;
            }

            // Smoothly interpolate current multiplier towards target
            const speedInterp = Math.min(1, dt * proximitySpeedRef.current.smoothSpeed);
            proximitySpeedRef.current.currentMultiplier +=
              (proximitySpeedRef.current.targetMultiplier - proximitySpeedRef.current.currentMultiplier) * speedInterp;

            // Target velocity for mobile (with proximity speed reduction applied)
            const MOBILE_SPEED_MULT = 1.5;
            const shouldMove = MC.cameraRotation === 0;
            const targetVelocity = shouldMove
              ? dir.scale(ShipControls.speed * MOBILE_SPEED_MULT * proximitySpeedRef.current.currentMultiplier)
              : new BABYLON.Vector3(0, 0, 0);

            // Smooth velocity interpolation (acceleration or drag)
            const interpSpeed = shouldMove ? ShipControls.acceleration : ShipControls.drag;
            ShipControls.velocity.x += (targetVelocity.x - ShipControls.velocity.x) * Math.min(1, dt * interpSpeed);
            ShipControls.velocity.y += (targetVelocity.y - ShipControls.velocity.y) * Math.min(1, dt * interpSpeed);
            ShipControls.velocity.z += (targetVelocity.z - ShipControls.velocity.z) * Math.min(1, dt * interpSpeed);

            const movement = ShipControls.velocity.scale(dt);
            controlTarget.position.addInPlace(movement);

            // Report velocity to engine sound manager
            updateEngineVelocity(ShipControls.velocity.length());

          } else {
            // Idle when not dragging - apply drag to velocity
            ShipControls.velocity.x += (0 - ShipControls.velocity.x) * Math.min(1, dt * ShipControls.drag);
            ShipControls.velocity.y += (0 - ShipControls.velocity.y) * Math.min(1, dt * ShipControls.drag);
            ShipControls.velocity.z += (0 - ShipControls.velocity.z) * Math.min(1, dt * ShipControls.drag);

            // Continue applying velocity even when not dragging (coasting)
            const movement = ShipControls.velocity.scale(dt);
            controlTarget.position.addInPlace(movement);

            // Report velocity to engine sound manager (even when coasting)
            updateEngineVelocity(ShipControls.velocity.length());

            if (A.I) play(A.I, wStep);
            // Reset yaw tracking
            MC.yawRate = 0;
            MC.previousYaw = 0;
          }
        }
      });
    }, totalShipAnimTime); // Close setTimeout

    return () => {
      clearTimeout(controlsTimeoutId);

      // Clean up keyboard listeners if they were added (commented out - using drag controls)
      // if (handleKeyDown) window.removeEventListener('keydown', handleKeyDown);
      // if (handleKeyUp) window.removeEventListener('keyup', handleKeyUp);

      // Clean up pointer event listeners (drag control) if they were added
      if (canvas) {
        if (handleContextMenu) canvas.removeEventListener('contextmenu', handleContextMenu);
        if (handlePointerDown) canvas.removeEventListener('pointerdown', handlePointerDown);
        if (handlePointerMove) canvas.removeEventListener('pointermove', handlePointerMove);
        if (handlePointerUp) {
          canvas.removeEventListener('pointerup', handlePointerUp);
          canvas.removeEventListener('pointercancel', handlePointerUp);
        }
      }

      if (ShipControls.observer) {
        scene.onBeforeRenderObservable.remove(ShipControls.observer);
        ShipControls.observer = null;
      }

      // Stop animations if they exist
      if (scene && scene.getAnimationGroupByName) {
        const fwd = scene.getAnimationGroupByName("forward");
        const brk = scene.getAnimationGroupByName("stop");
        const L = scene.getAnimationGroupByName("turnRight");
        const R = scene.getAnimationGroupByName("turnLeft");
        const I = scene.getAnimationGroupByName("idle");
        [fwd, brk, L, R, I].forEach(g => g?.stop?.());
      }

    };
  }, [s, navigationMode]);

  // Drag rotation interaction
  useEffect(() => {
    const canvas = ref.current;
    const camera = cameraRef.current;
    if (!canvas) return;

    const handlePointerDown = (e: PointerEvent) => {
      // Only trigger on left-click to avoid conflicts with ship controls right-click
      if (e.button !== 0) return;
      isDraggingRef.current = true;
      lastDragPosRef.current = { x: e.clientX, y: e.clientY };
      // Cancel any running momentum animation when user starts dragging again
      if (dragMomentumAnimRef.current !== null) {
        cancelAnimationFrame(dragMomentumAnimRef.current);
        dragMomentumAnimRef.current = null;
      }
      // Reset velocity when starting new drag
      dragVelocityRef.current = { x: 0, y: 0 };
      canvas.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current || !camera) return;

      const deltaX = e.clientX - lastDragPosRef.current.x;
      const deltaY = e.clientY - lastDragPosRef.current.y;

      // Apply rotation in screen space using quaternions
      // Horizontal drag rotates around world Y axis
      // Vertical drag rotates around camera's right vector
      const sensitivity = 0.012;

      // Create rotation quaternions
      const yAxisRotation = BABYLON.Quaternion.RotationAxis(
        BABYLON.Vector3.Up(),
        -deltaX * sensitivity
      );

      // Get camera's right vector for vertical rotation
      const cameraRight = camera.getDirection(BABYLON.Axis.X);
      const xAxisRotation = BABYLON.Quaternion.RotationAxis(
        cameraRight,
        -deltaY * sensitivity
      );

      // Combine rotations: first apply the new rotation, then the existing one
      dragRotationRef.current = yAxisRotation.multiply(xAxisRotation).multiply(dragRotationRef.current);

      // Track velocity for momentum effect (exponential smoothing)
      const velocitySmoothing = 0.4; // Higher = more responsive, lower = smoother
      dragVelocityRef.current.x = dragVelocityRef.current.x * (1 - velocitySmoothing) + (-deltaX * sensitivity) * velocitySmoothing;
      dragVelocityRef.current.y = dragVelocityRef.current.y * (1 - velocitySmoothing) + (-deltaY * sensitivity) * velocitySmoothing;

      lastDragPosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: PointerEvent) => {
      isDraggingRef.current = false;
      canvas.releasePointerCapture(e.pointerId);

      // Start momentum animation if there's significant velocity
      const velocity = dragVelocityRef.current;
      const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
      const minSpeedThreshold = 0.001;

      if (speed > minSpeedThreshold && camera) {
        const friction = 0.965; // Decay rate per frame (lower = faster stop)
        const stopThreshold = 0.0001;

        const animateMomentum = () => {
          const vel = dragVelocityRef.current;
          const currentSpeed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);

          if (currentSpeed < stopThreshold || isDraggingRef.current) {
            // Stop animation when speed is negligible or user starts dragging again
            dragVelocityRef.current = { x: 0, y: 0 };
            dragMomentumAnimRef.current = null;
            return;
          }

          // Apply friction decay
          vel.x *= friction;
          vel.y *= friction;

          // Apply velocity to rotation
          const yAxisRotation = BABYLON.Quaternion.RotationAxis(
            BABYLON.Vector3.Up(),
            vel.x
          );

          // Get camera's right vector for vertical rotation
          const cam = cameraRef.current;
          if (cam) {
            const cameraRight = cam.getDirection(BABYLON.Axis.X);
            const xAxisRotation = BABYLON.Quaternion.RotationAxis(
              cameraRight,
              vel.y
            );
            dragRotationRef.current = yAxisRotation.multiply(xAxisRotation).multiply(dragRotationRef.current);
          } else {
            dragRotationRef.current = yAxisRotation.multiply(dragRotationRef.current);
          }

          dragMomentumAnimRef.current = requestAnimationFrame(animateMomentum);
        };

        dragMomentumAnimRef.current = requestAnimationFrame(animateMomentum);
      }
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerUp);
      // Clean up momentum animation on unmount
      if (dragMomentumAnimRef.current !== null) {
        cancelAnimationFrame(dragMomentumAnimRef.current);
        dragMomentumAnimRef.current = null;
      }
    };
  }, []);

  // Apply combined rotation every frame
  useEffect(() => {
    const scene = sceneRef.current;
    const root1 = root1Ref.current;
    if (!scene || !root1) return;

    const applyRotation = () => {
      // Combine base rotation, mouse rotation, and drag quaternion
      const baseMouseX = baseRotationRef.current.x + mouseRotationRef.current.x;
      const baseMouseY = baseRotationRef.current.y + mouseRotationRef.current.y;

      // Convert base+mouse Euler to quaternion
      const baseMouseQuat = BABYLON.Quaternion.RotationYawPitchRoll(
        baseMouseY,  // yaw (Y axis)
        baseMouseX,  // pitch (X axis)
        0            // roll (Z axis)
      );

      // Combine with drag quaternion
      const finalQuat = dragRotationRef.current.multiply(baseMouseQuat);

      // Convert back to Euler and apply
      const euler = finalQuat.toEulerAngles();
      root1.rotation.x = euler.x;
      root1.rotation.y = euler.y;
      root1.rotation.z = euler.z;
    };

    const observer = scene.onBeforeRenderObservable.add(applyRotation);

    return () => {
      scene.onBeforeRenderObservable.remove(observer);
    };
  }, []);

  // Update camera settings when state changes (animated)
  useEffect(() => {
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    if (!camera || !scene) return;

    const isMobile = window.innerWidth < 768; // md breakpoint
    const cameraConfig = config.canvas.babylonCamera;
    if (cameraConfig) {
      const lowerLimit = isMobile ? cameraConfig.lowerRadiusLimit.mobile : cameraConfig.lowerRadiusLimit.desktop;
      const upperLimit = isMobile ? cameraConfig.upperRadiusLimit.mobile : cameraConfig.upperRadiusLimit.desktop;

      // Get beta and alpha from config if available
      const targetBeta = cameraConfig.beta ? (isMobile ? cameraConfig.beta.mobile : cameraConfig.beta.desktop) : undefined;
      const targetAlpha = cameraConfig.alpha ? (isMobile ? cameraConfig.alpha.mobile : cameraConfig.alpha.desktop) : undefined;

      // Use config values for duration and delay, with fallbacks
      const duration = cameraConfig.animationDuration !== undefined ? cameraConfig.animationDuration : 0.4;
      const delay = cameraConfig.animationDelay !== undefined ? cameraConfig.animationDelay : 0;

      const easing = new BABYLON.CubicEase();
      if (s === S.state_4) {
        easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
      } else {
        easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
      }

      animateCameraRadius({
        camera,
        scene,
        duration,
        delay,
        lowerRadiusLimit: lowerLimit,
        upperRadiusLimit: upperLimit,
        beta: targetBeta,
        alpha: targetAlpha,
        easing
      });
    } else {
      // Fallback values
      console.warn('⚠️ [Camera Config] No camera config found, using fallback values');
      camera.lowerRadiusLimit = 20;
      camera.upperRadiusLimit = 20;
    }
  }, [s]); // Update only camera settings on state change

  // Switch between logo models when selection changes
  useEffect(() => {
    const logoModels = logoModelsRef.current;
    if (logoModels.length === 0) return;

    // Hide all models
    logoModels.forEach((model) => {
      if (model) {
        model.setEnabled(false);
      }
    });

    // Show only the selected model
    if (logoModels[selectedLogoModel]) {
      logoModels[selectedLogoModel].setEnabled(true);
    }
  }, [selectedLogoModel]);

  // Handle state transitions for positioning and visibility with fade animations
  useEffect(() => {
    const logosRoot = logosRootRef.current;
    const planet = planetMeshRef.current;
    const material = planetMaterialRef.current;
    const rockRing = rockRingRef.current;
    const rockRingAnimationGroups = rockRingAnimationGroupsRef.current;
    const root1 = root1Ref.current;
    const stars = starsParticleSystemRef.current;
    const smoke = smokeParticleSystemRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!logosRoot || !planet || !scene || !root1 || !camera) return;

    const sceneConfig = config.canvas.babylonScene;
    if (!sceneConfig) return;

    // Track state transitions
    const prevState = prevStateRef.current;
    const wasInExploreState = prevState >= S.state_4 && prevState <= S.state_8; // Was in states 4-7
    const isNowInExploreState = s >= S.state_4 && s <= S.state_8; // Is now in states 4-7
    const isLeavingExploreState = wasInExploreState && !isNowInExploreState; // Leaving 4-7 to any non-explore state
    const isComingFromExploreToState3 = wasInExploreState && s === S.state_3; // States 4-7 → State 3
    const isGoingToStateFinal = s === S.state_final; // Any state → State Final
    const isGoingToState4 = prevState === S.state_3 && s === S.state_4; // State 3 → State 4


    // Handle logo visibility based on config
    logosRoot.setEnabled(sceneConfig.logoEnabled);

    // Reset drag rotation to identity on state change with animation (quaternion slerp)
    const currentDragQuat = dragRotationRef.current.clone();
    const identityQuat = BABYLON.Quaternion.Identity();

    // Only animate if there's a meaningful rotation
    if (!currentDragQuat.equals(identityQuat)) {
      // Animate drag rotation back to identity using quaternion slerp
      const startTime = performance.now();
      const duration = 800; // ms

      const animateDragReset = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);

        // Spherical linear interpolation from current to identity
        dragRotationRef.current = BABYLON.Quaternion.Slerp(currentDragQuat, identityQuat, eased);

        if (progress < 1) {
          requestAnimationFrame(animateDragReset);
        } else {
          dragRotationRef.current = BABYLON.Quaternion.Identity();
        }
      };

      animateDragReset();
    }

    // Handle root1 transform (position and scale) with animation
    const isMobile = window.innerWidth < 768;
    const transform = isMobile ? sceneConfig.rootTransform.mobile : sceneConfig.rootTransform.desktop;

    const targetPosition = transform.position
      ? new BABYLON.Vector3(transform.position.x, transform.position.y, transform.position.z)
      : undefined;
    const targetScale = transform.scale
      ? new BABYLON.Vector3(transform.scale, transform.scale, transform.scale)
      : undefined;

    const easing = new BABYLON.CubicEase();
    easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);

    // Transform animation (no delay since state 2 was removed)
    const transformDelay = 0;

    animateTransform({
      target: root1,
      scene,
      duration: 1.0, // 1 second animation
      delay: transformDelay,
      position: targetPosition,
      scaling: targetScale,
      easing
    });

    // Handle particle systems - once started, they stay on forever
    if (stars && smoke) {
      // If particles should be enabled and haven't been started yet, start them
      if (sceneConfig.particlesEnabled && !particlesHaveStartedRef.current) {
        stars.emitRate = 100000;
        smoke.emitRate = 5000;
        particlesHaveStartedRef.current = true;
      }
      // Once started, never turn them off (like background music and rockring)
    }

    // Handle curve particles - controlled by state config
    const curveParticles = curveParticleSystemRef.current;
    if (curveParticles) {
      const shouldEnableCurveParticles = sceneConfig.curveParticlesEnabled || false;

      if (shouldEnableCurveParticles && !curveParticles.isStarted()) {
        curveParticles.start();
      } else if (!shouldEnableCurveParticles && curveParticles.isStarted()) {
        curveParticles.stop();
        curveParticles.reset(); // Immediately kill all active particles
      }
    }

    // Handle portal visibility
    const portals = portalsRef.current;
    if (portals && portals.length > 0) {
      const portalsEnabled = sceneConfig.portalsEnabled || false;
      /*       portals.forEach(portal => {
              portal.setEnabled(portalsEnabled);
            }); */
    }

    // Handle spaceship position animation
    // The current 'config' is already the destination state's blueprint
    const animShipRoot = spaceshipRootRef.current;
    const animShipPivot = shipPivotRef.current;
    const currentNavigationMode = useUI.getState().navigationMode;

    if (animShipRoot && prevState !== s) {
      const easing = new BABYLON.CubicEase();
      easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);

      // Get ship animation config from CURRENT state (destination state blueprint)
      const shipConfig = sceneConfig?.shipAnimation;

      // For states 4-7, ensure shipPivot is parented to shipRoot so camera follows
      const isEnteringExploreState = s >= S.state_4 && s <= S.state_8;
      if (isEnteringExploreState && animShipPivot && animShipPivot.parent !== animShipRoot) {
        animShipPivot.setParent(animShipRoot);
        const pivotY = isMobile ? 1.17 : 0.9;
        animShipPivot.position.set(0, pivotY, 0);
        animShipPivot.rotationQuaternion = BABYLON.Quaternion.Identity();

        if (camera) {
          camera.lockedTarget = animShipPivot;
        }
      }

      // Check if coming FROM guided state (4-7) TO any non-explore state while in guided mode
      // This includes state_0, state_3, and state_final
      const isLeavingGuidedExploreState = currentNavigationMode === 'guided' &&
        prevState >= S.state_4 && prevState <= S.state_8 &&
        (s <= S.state_3 || s === S.state_final);

      // In guided mode for states 4-7, use bezier curve animation with anchor data
      const isGuidedModeState = currentNavigationMode === 'guided' &&
        s >= S.state_4 && s <= S.state_8;

      if (isLeavingGuidedExploreState) {
        // Bezier animation from current position to destination state ship position
        const startPosition = animShipRoot.position.clone();

        // Calculate current forward direction from ship rotation
        let startForward = new BABYLON.Vector3(0, 0, 1);
        if (animShipRoot.rotationQuaternion) {
          startForward.rotateByQuaternionToRef(animShipRoot.rotationQuaternion, startForward);
        }

        const startRotation = animShipRoot.rotationQuaternion?.clone() || BABYLON.Quaternion.Identity();

        // Get target position from state config (with fallbacks)
        let targetPos = shipConfig?.position || { x: 0, y: -4, z: 20 }; // Default to behind camera
        if (isMobile && shipConfig?.mobile?.position) {
          targetPos = shipConfig.mobile.position;
        } else if (!isMobile && shipConfig?.desktop?.position) {
          targetPos = shipConfig.desktop.position;
        }

        const endPosition = new BABYLON.Vector3(targetPos.x, targetPos.y, targetPos.z);
        // End facing forward (identity rotation)
        const endRotation = BABYLON.Quaternion.Identity();
        const endForward = new BABYLON.Vector3(0, 0, 1);

        // Parent smoke emitter
        const smokeEmitter = smokeEmitterRef.current;
        if (smokeEmitter && animShipPivot && smokeEmitter.parent !== animShipPivot) {
          smokeEmitter.parent = animShipPivot;
        }

        // Camera radius for travel (use destination state's lower limit)
        const cameraConfig = config.canvas.babylonCamera;
        const stateRadius = isMobile
          ? cameraConfig?.lowerRadiusLimit?.mobile ?? 20
          : cameraConfig?.lowerRadiusLimit?.desktop ?? 20;

        // Use bezier with 2 second duration for leaving guided states
        // Skip arrival zoom and hide since destination states should show ship normally (or have it hidden via state config)
        animateShipAlongBezier({
          target: animShipRoot,
          scene,
          camera,
          canvas: ref.current,
          startPosition,
          startForward,
          endPosition,
          endForward,
          startRotation,
          endRotation,
          stateRadius,
          duration: 2.0, // Shorter duration for exit transitions
          skipArrivalZoom: true, // Don't zoom to 0
          skipArrivalHide: true, // Don't hide ship (state config handles visibility)
          flameParticles: flameParticleSystemRef.current
        });
      } else if (isGuidedModeState) {
        // Map states to anchor indices (state_4 = anchor1, state_5 = anchor2, state_6 = anchor3, state_7 = anchor4, state_8 = anchor5)
        const anchorIndex = s - S.state_4 + 1; // 1, 2, 3, 4, or 5
        const anchorKey = isMobile ? `mobile${anchorIndex}` : `desktop${anchorIndex}`;
        const anchorData = anchorDataRef.current[anchorKey];

        if (anchorData) {
          // Get current ship position and forward direction
          const startPosition = animShipRoot.position.clone();

          // Calculate current forward direction from ship rotation
          let startForward = new BABYLON.Vector3(0, 0, 1); // Default forward
          if (animShipRoot.rotationQuaternion) {
            startForward.rotateByQuaternionToRef(animShipRoot.rotationQuaternion, startForward);
          }

          // Get start rotation
          const startRotation = animShipRoot.rotationQuaternion?.clone() || BABYLON.Quaternion.Identity();

          // Parent smoke emitter to shipPivot so it follows during guided mode animation
          const smokeEmitter = smokeEmitterRef.current;
          if (smokeEmitter && animShipPivot && smokeEmitter.parent !== animShipPivot) {
            smokeEmitter.parent = animShipPivot;
          }

          // Get camera radius from state config for zoom-out during travel
          const cameraConfig = config.canvas.babylonCamera;
          const stateRadius = isMobile
            ? cameraConfig?.lowerRadiusLimit?.mobile ?? 24
            : cameraConfig?.lowerRadiusLimit?.desktop ?? 24;

          // Add delay when entering state 4 from any state EXCEPT states 5, 6, 7
          const isEnteringState4 = s === S.state_4;
          const isComingFromExploreStates = prevState === S.state_5 || prevState === S.state_6 || prevState === S.state_7;
          const animDelay = (isEnteringState4 && !isComingFromExploreStates) ? 1.2 : 0;

          // Mark as not arrived - ship is about to travel
          guidedModeArrivedRef.current = false;

          // Use bezier curve animation with camera following
          animateShipAlongBezier({
            target: animShipRoot,
            scene,
            camera,
            canvas: ref.current,
            startPosition,
            startForward,
            endPosition: anchorData.position,
            endForward: anchorData.forward,
            startRotation,
            endRotation: anchorData.rotation,
            stateRadius,
            delay: animDelay,
            flameParticles: flameParticleSystemRef.current,
            onComplete: () => {
              guidedModeArrivedRef.current = true;


            }
          });
        } else {
          console.warn(`⚠️ Anchor ${anchorKey} not found, falling back to linear animation`);
          // Fallback to linear animation if anchor data missing
          const fallbackPos = shipConfig?.position || { x: 0, y: -1, z: 0 };
          animateTransform({
            target: animShipRoot,
            scene,
            duration: GUIDED_SHIP_DURATION,
            delay: 0,
            position: new BABYLON.Vector3(fallbackPos.x, fallbackPos.y, fallbackPos.z),
            easing
          });
        }
      } else {
        // Free mode or other states - use config positions with linear animation
        // In free mode, model rotation is always allowed (no guided travel)
        if (currentNavigationMode === 'free') {
          guidedModeArrivedRef.current = true;
        }

        let targetPos: { x: number; y: number; z: number } | undefined;

        // Parent smoke emitter to shipPivot so it follows in free mode too
        if (isEnteringExploreState) {
          const smokeEmitter = smokeEmitterRef.current;
          if (smokeEmitter && animShipPivot && smokeEmitter.parent !== animShipPivot) {
            smokeEmitter.parent = animShipPivot;
          }
        }

        if (shipConfig) {
          if (isMobile && shipConfig.mobile?.position) {
            targetPos = shipConfig.mobile.position;
          } else if (!isMobile && shipConfig.desktop?.position) {
            targetPos = shipConfig.desktop.position;
          } else if (shipConfig.position) {
            targetPos = shipConfig.position;
          }
        }

        if (targetPos) {
          const duration = shipConfig?.duration ?? 1.0;
          const delay = shipConfig?.delay ?? 0;

          animateTransform({
            target: animShipRoot,
            scene,
            duration,
            delay,
            position: new BABYLON.Vector3(targetPos.x, targetPos.y, targetPos.z),
            easing
          });
        } else {
          // If no ship config, hide ship behind camera (for states without ship)
          animateTransform({
            target: animShipRoot,
            scene,
            duration: 0.5,
            delay: 0,
            position: new BABYLON.Vector3(0, -4, 20),
            easing
          });
        }
      }
    }



    // Handle fog animation
    // The current 'config' is already the destination state's blueprint
    if (prevState !== s) {
      const fogEasing = new BABYLON.CubicEase();
      fogEasing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);

      // Get fog animation config from CURRENT state (destination state blueprint)
      const fogConfig = sceneConfig?.fogAnimation;

      // If current state has fog config, animate to those settings
      if (fogConfig && (fogConfig.fogEnd !== undefined || fogConfig.fogStart !== undefined)) {
        const fogEnd = fogConfig.fogEnd;
        const fogStart = fogConfig.fogStart;
        const duration = fogConfig.duration ?? 0.6;
        const delay = fogConfig.delay ?? 0;

        animateFog({
          scene,
          duration,
          delay,
          fogEnd,
          fogStart,
          //easing: fogEasing
        });
      }
    }

    // Reset ship and camera when leaving explore states (4-7) to ANY non-explore state
    if (isLeavingExploreState) {
      // Reset guided mode arrived flag
      guidedModeArrivedRef.current = false;

      const shipToReset = spaceshipRef.current;
      const shipRootToReset = spaceshipRootRef.current;
      const pivotToReset = shipPivotRef.current;

      // Restore ship to original state (Identity rotation, proper position)
      const controlTarget = shipRootToReset || shipToReset;

      if (controlTarget) {
        // Always reset rotation to Identity - this is the correct "forward-facing" orientation
        controlTarget.rotationQuaternion = BABYLON.Quaternion.Identity();

        // Reset position to a known good state for state 3
        const initialPos = shipInitialStateRef.current.position;
        if (initialPos) {
          controlTarget.position.copyFrom(initialPos);
        } else {
          controlTarget.position.set(0, -.7, 0);
        }
      }

      // Reset camera to initial default rotation (same as scene initialization)
      if (camera) {
        camera.alpha = -Math.PI * 1.5;
        camera.beta = Math.PI / 2;
      }

      // Reset ship pivot
      if (pivotToReset && pivotToReset.parent) {
        pivotToReset.setParent(null);
        pivotToReset.position.set(0, 0, 0);
      }

      // Reset smoke emitter
      const smokeEmitter = smokeEmitterRef.current;
      if (smokeEmitter && smokeEmitter.parent) {
        smokeEmitter.parent = null;
        smokeEmitter.position.set(0, 0, 25);
      }

      // Keep camera locked to shipPivot (don't unlock)
      if (camera && !camera.lockedTarget) {
        camera.lockedTarget = pivotToReset;
      }

      // Reset control angles
      const ShipControls = shipControlsRef.current;
      ShipControls.pitch = 0;
      ShipControls.yawTarget = 0;
      ShipControls.pitchVel = 0;
    }

    // Handle spaceship visibility (no material treatment — keep original GLB materials)
    const spaceship = spaceshipRef.current;
    const shipRoot = spaceshipRootRef.current;
    const spaceshipContainer = shipRoot || spaceship; // Use shipRoot if available, otherwise spaceship

    if (spaceshipContainer) {
      const shouldBeVisible = sceneConfig.spaceshipEnabled;
      const isCurrentlyVisible = spaceshipContainer.isEnabled();

      // Show ship when transitioning to state with spaceship enabled
      if (shouldBeVisible && !isCurrentlyVisible) {
        setShipAndFlamesVisibility({
          container: spaceshipContainer,
          flameParticles: flameParticleSystemRef.current,
          visible: true,
          method: 'enabled',
          logContext: 'Spaceship Show'
        });
      }
      // Hide ship when transitioning away from state with spaceship
      else if (!shouldBeVisible && isCurrentlyVisible) {
        setShipAndFlamesVisibility({
          container: spaceshipContainer,
          flameParticles: flameParticleSystemRef.current,
          visible: false,
          method: 'enabled',
          logContext: 'Spaceship Hide'
        });
      }

      // SAFETY CHECK: Ensure flames are ALWAYS in sync with ship visibility
      // This catches edge cases where state transitions might leave flames out of sync
      else if (shouldBeVisible && isCurrentlyVisible) {
        const flames = flameParticleSystemRef.current;
        if (flames) {
          flames.start(); // Safe to call even if already started
        }
      }
    }

    // Handle camera controls - managed by navigation mode in a separate effect
    // (see useEffect below that watches navigationMode)

    // Handle rockring visibility based on rockRingEnabled config
    // Rockring is always shown as-is (no fade animation) when enabled
    const rockRingEnabled = config.canvas.babylonScene?.rockRingEnabled === true;
    if (rockRing) {
      rockRing.setEnabled(rockRingEnabled);

      // Start rockring GLB animation only in state 4+ (not state 3)
      // Once started, animation continues looping
      if (s >= S.state_4 && rockRingAnimationGroups.length > 0) {
        const animGroup = rockRingAnimationGroups[0];
        if (!rockRingAnimationStartedRef.current) {
          // First time entering state 4+ - start the animation
          rockRingAnimationStartedRef.current = true;
          animGroup.start(true, 1.7, 1, 2000);
        } else if (!animGroup.isPlaying) {
          // Animation was started before but stopped - resume it
          animGroup.start(true, 1.7, 1, 2000);
        }
      }
    }


    // Logos are always at normal size and position (state 2 with planet is removed)
    logosRoot.scaling.set(1, 1, 1);
    logosRoot.position.set(0, 0, 0);

    // Planet is always disabled (was only used in now-removed state 2)
    planet.setEnabled(false);

    // Update previous state reference for next transition
    prevStateRef.current = s;
  }, [s, config]);

  // Handle planet rotation when continent changes (animated)
  useEffect(() => {
    const planet = planetMeshRef.current;
    const scene = sceneRef.current;
    if (!planet || !scene) return;

    // Reset drag rotation when changing continents to avoid conflicts
    const currentDragQuat = dragRotationRef.current.clone();
    const identityQuat = BABYLON.Quaternion.Identity();

    // Check if there's any drag rotation to reset
    if (!currentDragQuat.equals(identityQuat)) {
      // On mobile, reset instantly to avoid visual glitch
      // On desktop, animate smoothly
      const isMobile = window.innerWidth < 768;

      if (isMobile) {
        // Instant reset on mobile
        dragRotationRef.current = BABYLON.Quaternion.Identity();
      } else {
        // Smooth reset on desktop
        const startTime = performance.now();
        const duration = 1500; // ms (faster than state change reset)

        const animateDragReset = () => {
          const elapsed = performance.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Ease out cubic
          const eased = 1 - Math.pow(1 - progress, 3);

          // Spherical linear interpolation from current to identity
          dragRotationRef.current = BABYLON.Quaternion.Slerp(currentDragQuat, identityQuat, eased);

          if (progress < 1) {
            requestAnimationFrame(animateDragReset);
          } else {
            dragRotationRef.current = BABYLON.Quaternion.Identity();
          }
        };

        animateDragReset();
      }
    }

    if (planetRotations[selectedContinent]) {
      const targetRotation = planetRotations[selectedContinent].clone();
      // Add the PI offset to Y rotation to match the base orientation
      targetRotation.y += Math.PI;

      // Use universal animation function
      const easing = new BABYLON.CubicEase();
      easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);

      animateTransform({
        target: planet,
        scene,
        duration: 1.2,
        rotation: targetRotation,
        easing
      });
    }
  }, [selectedContinent]);

  // Navigation mode effect - toggle camera controls based on mode in state 4
  useEffect(() => {
    const canvas = ref.current;
    const camera = cameraRef.current;
    if (!canvas || !camera) return;

    // Only enable controls in states 4-7
    const inExploreState = s >= S.state_4 && s <= S.state_8;
    const isGuidedMode = navigationMode === 'guided';

    if (inExploreState) {
      if (isGuidedMode) {
        // In guided mode: delay camera controls until camera animation completes
        const cameraConfig = config.canvas.babylonCamera;
        const animDuration = cameraConfig?.animationDuration ?? 0.4;
        const animDelay = cameraConfig?.animationDelay ?? 0;
        const totalAnimTime = (animDuration + animDelay) * 1000; // Convert to ms

        const timeoutId = setTimeout(() => {
          // Enable mouse wheel for zoom only (radius limits are animated elsewhere to control zooming)
          camera.inputs.clear();
          camera.inputs.addMouseWheel();
          camera.attachControl(canvas, true);
        }, totalAnimTime);

        return () => clearTimeout(timeoutId);
      } else {
        // In free mode: enable ALL controls IMMEDIATELY (no delay)
        // This allows camera rotation/drag to work right away when switching to free mode
        camera.inputs.clear();
        camera.inputs.addMouseWheel();
        camera.inputs.addPointers();
        camera.attachControl(canvas, true);
      }
    } else {
      camera.detachControl();
      camera.inputs.clear();
    }
  }, [s, navigationMode]);

  // Model rotation in explore states - rotate model on Y axis freely, X axis with spring-back
  // Works in both guided mode (click anywhere) and free mode (click on model only)
  useEffect(() => {
    const canvas = ref.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!canvas || !scene) return;

    const inExploreState = s >= S.state_4 && s <= S.state_8;
    const isGuidedMode = navigationMode === 'guided';

    // Only enable model rotation in guided mode during explore states
    // In free mode, model rotation is disabled to avoid interfering with ship controls
    if (!inExploreState || !isGuidedMode) {
      return;
    }

    // Get the current model based on state
    const getCurrentModel = () => {
      switch (s) {
        case S.state_4: return carRootRef.current;
        case S.state_5: return musecraftRootRef.current;
        case S.state_6: return dioramasRootRef.current;
        case S.state_7: return petwheelsRootRef.current;
        case S.state_8: return personalRootRef.current;
        default: return null;
      }
    };

    // Get all meshes for the current model (for picking)
    const getCurrentModelMeshes = (): BABYLON.AbstractMesh[] => {
      switch (s) {
        case S.state_4: return carMeshesRef.current;
        case S.state_5: return musecraftMeshesRef.current;
        case S.state_6: return dioramasMeshesRef.current;
        case S.state_7: return petwheelsMeshesRef.current;
        case S.state_8: return personalMeshesRef.current;
        default: return [];
      }
    };

    // Max peek angle in radians (~30 degrees)
    const maxPeekAngle = Math.PI / 12;
    // Resistance factor - higher = more resistance at extremes
    const resistanceFactor = 6;

    const handlePointerDown = (e: PointerEvent) => {
      // Only allow rotation if ship has arrived (guided mode check)
      if (isGuidedMode && !guidedModeArrivedRef.current) {
        return;
      }

      const model = getCurrentModel();
      if (!model) return;

      // In free mode, check if user clicked on the model
      if (!isGuidedMode) {
        const modelMeshes = getCurrentModelMeshes();
        if (modelMeshes.length === 0) return;

        // Create a picking predicate to only pick model meshes
        const pickPredicate = (mesh: BABYLON.AbstractMesh) => {
          return modelMeshes.includes(mesh);
        };

        const pickResult = scene.pick(e.clientX, e.clientY, pickPredicate);

        if (!pickResult || !pickResult.hit) {
          // User didn't click on the model, don't rotate
          return;
        }

        // Mark that we're rotating the model in free mode
        freeModeDraggingModelRef.current = true;

        // Disable camera controls in free mode during rotation
        if (camera) {
          camera.detachControl();
        }
      }

      modelRotationRef.current.isDragging = true;
      modelRotationRef.current.lastX = e.clientX;
      modelRotationRef.current.lastY = e.clientY;

      // Store original quaternion if not already stored
      if (!modelRotationRef.current.originalQuaternion && model.rotationQuaternion) {
        modelRotationRef.current.originalQuaternion = model.rotationQuaternion.clone();
      }

      canvas.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!modelRotationRef.current.isDragging) return;
      if (isGuidedMode && !guidedModeArrivedRef.current) return;

      const model = getCurrentModel();
      if (!model || !model.rotationQuaternion || !camera) return;

      const deltaX = e.clientX - modelRotationRef.current.lastX;
      const deltaY = e.clientY - modelRotationRef.current.lastY;

      // Reduce rotation speed to 0.1 of normal when gizmo is being dragged
      const gizmoReductionFactor = isMusecraftGizmoDragging() ? 0.1 : 1.0;
      const rotationSpeed = 0.005 * gizmoReductionFactor; // Radians per pixel

      // Y axis rotation - free rotation around world Y axis, accumulates
      const deltaYRotation = -deltaX * rotationSpeed;
      modelRotationRef.current.accumulatedYRotation += deltaYRotation;

      // Track velocity for momentum effect (exponential smoothing)
      const velocitySmoothing = 0.3; // Lower = smoother, higher = more responsive
      modelRotationRef.current.velocityY =
        modelRotationRef.current.velocityY * (1 - velocitySmoothing) +
        deltaYRotation * velocitySmoothing;

      // X axis rotation with resistance - use camera's right vector so it tilts toward/away from camera
      const currentPeek = modelRotationRef.current.peekRotationX;
      // Calculate resistance: 1 at center, approaches infinity at maxPeekAngle
      const normalizedPeek = Math.abs(currentPeek) / maxPeekAngle;
      const resistance = 1 + Math.pow(normalizedPeek, 2) * resistanceFactor;

      // Apply resistance to X rotation (negative deltaY because dragging down = look at top)
      const deltaXRotation = (-deltaY * rotationSpeed) / resistance;
      let newPeekX = currentPeek + deltaXRotation;

      // Soft clamp to max peek angle
      newPeekX = Math.max(-maxPeekAngle, Math.min(maxPeekAngle, newPeekX));
      modelRotationRef.current.peekRotationX = newPeekX;

      // Get camera right vector for tilt axis (perpendicular to view direction, horizontal)
      const cameraRight = camera.getDirection(BABYLON.Axis.X);
      // Project to horizontal plane to keep tilt axis horizontal
      cameraRight.y = 0;
      cameraRight.normalize();

      // Build the final rotation: original * Y rotation * X peek (around camera right)
      const originalQuat = modelRotationRef.current.originalQuaternion || BABYLON.Quaternion.Identity();
      const yRotation = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, modelRotationRef.current.accumulatedYRotation);
      const xPeekRotation = BABYLON.Quaternion.RotationAxis(cameraRight, newPeekX);

      // Apply: original orientation, then Y spin, then tilt toward camera
      model.rotationQuaternion = xPeekRotation.multiply(yRotation.multiply(originalQuat));

      modelRotationRef.current.lastX = e.clientX;
      modelRotationRef.current.lastY = e.clientY;
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (modelRotationRef.current.isDragging) {
        modelRotationRef.current.isDragging = false;
        // Reset velocity to prevent momentum drift after release
        modelRotationRef.current.velocityY = 0;
        canvas.releasePointerCapture(e.pointerId);

        // Re-enable camera and ship controls if we were in free mode
        if (!isGuidedMode && freeModeDraggingModelRef.current) {
          freeModeDraggingModelRef.current = false;

          // Re-enable camera controls
          if (camera) {
            camera.inputs.addMouseWheel();
            camera.inputs.addPointers();
            camera.attachControl(canvas, true);
          }
        }
      }
    };

    // Animation loop for X-axis spring-back AND Y-axis momentum
    let springAnimationFrame: number | null = null;
    const animateRotation = () => {
      // Skip updates while dragging (user is in control)
      if (modelRotationRef.current.isDragging) {
        springAnimationFrame = requestAnimationFrame(animateRotation);
        return;
      }

      let needsUpdate = false;

      // Y-axis momentum - apply friction to velocity and update rotation
      const currentVelocityY = modelRotationRef.current.velocityY;
      if (Math.abs(currentVelocityY) > 0.00001) {
        // Apply friction (0.95 = smooth decay, 0.9 = faster stop)
        const friction = 0.95;
        modelRotationRef.current.velocityY *= friction;

        // Apply velocity to accumulated rotation
        modelRotationRef.current.accumulatedYRotation += currentVelocityY;
        needsUpdate = true;
      } else {
        modelRotationRef.current.velocityY = 0;
      }

      // X-axis spring-back
      const currentPeek = modelRotationRef.current.peekRotationX;
      if (Math.abs(currentPeek) > 0.001) {
        // Spring constant - higher = faster return
        const springStrength = 0.02;
        const newPeek = currentPeek * (1 - springStrength);
        modelRotationRef.current.peekRotationX = newPeek;
        needsUpdate = true;
      } else if (currentPeek !== 0) {
        modelRotationRef.current.peekRotationX = 0;
        needsUpdate = true;
      }

      // Update model rotation if anything changed
      if (needsUpdate) {
        const model = getCurrentModel();
        if (model && model.rotationQuaternion && camera) {
          // Get camera right vector for tilt axis
          const cameraRight = camera.getDirection(BABYLON.Axis.X);
          cameraRight.y = 0;
          cameraRight.normalize();

          const originalQuat = modelRotationRef.current.originalQuaternion || BABYLON.Quaternion.Identity();
          const yRotation = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, modelRotationRef.current.accumulatedYRotation);
          const xPeekRotation = BABYLON.Quaternion.RotationAxis(cameraRight, modelRotationRef.current.peekRotationX);
          model.rotationQuaternion = xPeekRotation.multiply(yRotation.multiply(originalQuat));
        }
      }

      springAnimationFrame = requestAnimationFrame(animateRotation);
    };

    // Start rotation animation loop
    springAnimationFrame = requestAnimationFrame(animateRotation);

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerUp);
      if (springAnimationFrame) {
        cancelAnimationFrame(springAnimationFrame);
      }
      // Reset all rotation state when leaving to prevent jump on re-entry
      modelRotationRef.current.peekRotationX = 0;
      modelRotationRef.current.accumulatedYRotation = 0;
      modelRotationRef.current.velocityY = 0;
      modelRotationRef.current.originalQuaternion = null;

      // Ensure free mode dragging state is reset
      freeModeDraggingModelRef.current = false;
    };
  }, [s, navigationMode]);

  // Model zoom in guided mode - toggle between default and zoomed-in positions with smooth animation
  useEffect(() => {
    const canvas = ref.current;
    const scene = sceneRef.current;
    const shipPivot = shipPivotRef.current;
    if (!canvas || !scene || !shipPivot) return;

    const inExploreState = s >= S.state_4 && s <= S.state_8;
    const isGuidedMode = navigationMode === 'guided';

    // Only enable model zoom in guided mode during explore states
    if (!inExploreState || !isGuidedMode) {
      return;
    }

    // Get the current model and its key based on state
    const getCurrentModelInfo = (): { model: BABYLON.TransformNode | BABYLON.AbstractMesh | null; key: string } => {
      switch (s) {
        case S.state_4: return { model: carRootRef.current, key: 'model1' };
        case S.state_5: return { model: musecraftRootRef.current, key: 'model2' };
        case S.state_6: return { model: dioramasRootRef.current, key: 'model3' };
        case S.state_7: return { model: petwheelsRootRef.current, key: 'model4' };
        default: return { model: null, key: '' };
      }
    };

    // Get the current anchor mesh based on state
    const getCurrentAnchor = (): BABYLON.AbstractMesh | null => {
      switch (s) {
        case S.state_4: return carAnchorRef.current;
        case S.state_5: return musecraftAnchorRef.current;
        case S.state_6: return dioramasAnchorRef.current;
        case S.state_7: return petwheelsAnchorRef.current;
        default: return null;
      }
    };

    // Animate model position with easing
    const animateModelPosition = (
      model: BABYLON.TransformNode | BABYLON.AbstractMesh,
      startPos: BABYLON.Vector3,
      endPos: BABYLON.Vector3,
      duration: number,
      onComplete?: () => void
    ) => {
      const fps = 60;
      const totalFrames = fps * duration;

      const positionAnimation = new BABYLON.Animation(
        "modelZoomPosition",
        "position",
        fps,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      positionAnimation.setKeys([
        { frame: 0, value: startPos },
        { frame: totalFrames, value: endPos }
      ]);

      const easing = new BABYLON.CubicEase();
      easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
      positionAnimation.setEasingFunction(easing);

      model.animations = [positionAnimation];
      scene.beginAnimation(model, 0, totalFrames, false, 1, () => {
        model.position.copyFrom(endPos);
        if (onComplete) onComplete();
      });
    };

    const handleWheel = (e: WheelEvent) => {
      // Only zoom when ship has arrived
      if (!guidedModeArrivedRef.current) {
        return;
      }

      // Prevent toggling while animation is in progress
      if (modelZoomRef.current.isAnimating) {
        return;
      }

      const { model, key } = getCurrentModelInfo();
      const anchor = getCurrentAnchor();

      if (!model || !anchor) return;

      // Store original position if not already stored
      if (!modelZoomRef.current.originalPositions[key]) {
        modelZoomRef.current.originalPositions[key] = model.position.clone();
      }

      const originalPos = modelZoomRef.current.originalPositions[key]!;
      const isCurrentlyZoomedIn = modelZoomRef.current.isZoomedIn[key];

      // Get the ship pivot's world position (this is where the camera looks at)
      const shipPivotPos = shipPivot.getAbsolutePosition();

      // Calculate direction from model anchor to ship pivot
      const anchorPos = anchor.getAbsolutePosition();
      const directionToShip = shipPivotPos.subtract(anchorPos);
      directionToShip.normalize();

      // Determine target based on scroll direction
      // deltaY < 0 = scroll up = zoom in (move model closer)
      // deltaY > 0 = scroll down = zoom out (move model back)
      const scrollingIn = e.deltaY < 0;
      const wantsZoomedIn = scrollingIn;

      // Only animate if target state is different from current state
      if (wantsZoomedIn === isCurrentlyZoomedIn) {
        return;
      }

      modelZoomRef.current.isAnimating = true;

      const startPos = model.position.clone();
      let endPos: BABYLON.Vector3;

      if (wantsZoomedIn) {
        // Zooming in: move model closer to ship by a percentage of the total distance
        const anchorToShipDistance = BABYLON.Vector3.Distance(anchorPos, shipPivotPos);
        const zoomDistance = anchorToShipDistance * modelZoomRef.current.zoomedInPercent;
        const offsetVector = directionToShip.scale(zoomDistance);
        endPos = originalPos.add(offsetVector);
      } else {
        // Zooming out: return to original position
        endPos = originalPos.clone();
      }

      animateModelPosition(model, startPos, endPos, modelZoomRef.current.animationDuration, () => {
        modelZoomRef.current.isZoomedIn[key] = wantsZoomedIn;
        modelZoomRef.current.isAnimating = false;
      });
    };

    // ========== MOBILE PINCH-TO-ZOOM ==========
    // Track pinch gesture with two fingers
    let initialPinchDistance: number | null = null;
    const PINCH_THRESHOLD = 50; // Minimum distance change to trigger zoom toggle (in pixels)

    const getTouchDistance = (touch1: Touch, touch2: Touch): number => {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      // Only track when exactly 2 fingers are on screen
      if (e.touches.length === 2) {
        initialPinchDistance = getTouchDistance(e.touches[0], e.touches[1]);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Need exactly 2 fingers and a valid initial distance
      if (e.touches.length !== 2 || initialPinchDistance === null) return;

      // Only zoom when ship has arrived
      if (!guidedModeArrivedRef.current) return;

      // Prevent toggling while animation is in progress
      if (modelZoomRef.current.isAnimating) return;

      const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
      const distanceChange = currentDistance - initialPinchDistance;

      // Check if pinch gesture exceeds threshold
      if (Math.abs(distanceChange) >= PINCH_THRESHOLD) {
        const { model, key } = getCurrentModelInfo();
        const anchor = getCurrentAnchor();

        if (!model || !anchor) return;

        // Store original position if not already stored
        if (!modelZoomRef.current.originalPositions[key]) {
          modelZoomRef.current.originalPositions[key] = model.position.clone();
        }

        const originalPos = modelZoomRef.current.originalPositions[key]!;
        const isCurrentlyZoomedIn = modelZoomRef.current.isZoomedIn[key];

        // Pinch out (spreading fingers) = zoom in (move model closer)
        // Pinch in (contracting fingers) = zoom out (move model back)
        const wantsZoomedIn = distanceChange > 0;

        // Only animate if target state is different from current state
        if (wantsZoomedIn === isCurrentlyZoomedIn) {
          // Reset initial distance to allow continuous pinch detection
          initialPinchDistance = currentDistance;
          return;
        }

        modelZoomRef.current.isAnimating = true;

        // Get the ship pivot's world position
        const shipPivotPos = shipPivot.getAbsolutePosition();

        // Calculate direction from model anchor to ship pivot
        const anchorPos = anchor.getAbsolutePosition();
        const directionToShip = shipPivotPos.subtract(anchorPos);
        directionToShip.normalize();

        const startPos = model.position.clone();
        let endPos: BABYLON.Vector3;

        if (wantsZoomedIn) {
          // Zooming in: move model closer to ship
          const anchorToShipDistance = BABYLON.Vector3.Distance(anchorPos, shipPivotPos);
          const zoomDistance = anchorToShipDistance * modelZoomRef.current.zoomedInPercent;
          const offsetVector = directionToShip.scale(zoomDistance);
          endPos = originalPos.add(offsetVector);
        } else {
          // Zooming out: return to original position
          endPos = originalPos.clone();
        }

        animateModelPosition(model, startPos, endPos, modelZoomRef.current.animationDuration, () => {
          modelZoomRef.current.isZoomedIn[key] = wantsZoomedIn;
          modelZoomRef.current.isAnimating = false;
        });

        // Reset initial distance after triggering zoom
        initialPinchDistance = currentDistance;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // Reset when fingers are lifted (less than 2 remaining)
      if (e.touches.length < 2) {
        initialPinchDistance = null;
      }
    };

    // Add event listeners
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: true });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [s, navigationMode]);

  // Reset model zoom when state changes or when leaving guided mode
  useEffect(() => {
    const inExploreState = s >= S.state_4 && s <= S.state_8;
    const isGuidedMode = navigationMode === 'guided';

    // Reset zoom states when leaving explore states or guided mode
    if (!inExploreState || !isGuidedMode) {
      const keys = ['model1', 'model2', 'model3', 'model4'];
      keys.forEach(key => {
        const originalPos = modelZoomRef.current.originalPositions[key];
        if (originalPos) {
          // Get the corresponding model
          let model: BABYLON.TransformNode | BABYLON.AbstractMesh | null = null;
          switch (key) {
            case 'model1': model = carRootRef.current; break;
            case 'model2': model = musecraftRootRef.current; break;
            case 'model3': model = dioramasRootRef.current; break;
            case 'model4': model = petwheelsRootRef.current; break;
          }

          // Reset position if model exists
          if (model) {
            model.position.copyFrom(originalPos);
          }
        }

        // Reset zoom state
        modelZoomRef.current.isZoomedIn[key] = false;
      });
    }
  }, [s, navigationMode]);

  // Reset model zoom when arriving at a new state (during travel between states)
  useEffect(() => {
    // When state changes within explore states, reset the zoom for all models
    const keys = ['model1', 'model2', 'model3', 'model4'];
    keys.forEach(key => {
      const originalPos = modelZoomRef.current.originalPositions[key];

      // If we have an original position stored and the model is zoomed in,
      // reset the model's actual position before clearing the stored position
      if (originalPos && modelZoomRef.current.isZoomedIn[key]) {
        let model: BABYLON.TransformNode | BABYLON.AbstractMesh | null = null;
        switch (key) {
          case 'model1': model = carRootRef.current; break;
          case 'model2': model = musecraftRootRef.current; break;
          case 'model3': model = dioramasRootRef.current; break;
          case 'model4': model = petwheelsRootRef.current; break;
        }

        if (model) {
          model.position.copyFrom(originalPos);
        }
      }

      // Clear original positions so they get re-captured at the new location
      modelZoomRef.current.originalPositions[key] = null;
      modelZoomRef.current.isZoomedIn[key] = false;
    });
    modelZoomRef.current.isAnimating = false;

  }, [s]);

  // Handle navigation mode toggle - move ship to anchor when switching to guided mode in states 4-7
  const prevNavigationModeRef = useRef<'guided' | 'free'>(navigationMode);
  useEffect(() => {
    const prevMode = prevNavigationModeRef.current;
    const scene = sceneRef.current;
    const shipPivot = shipPivotRef.current;
    const shipRoot = spaceshipRootRef.current;
    const camera = cameraRef.current;

    const isMobile = window.innerWidth < 768;

    // Switching from FREE to GUIDED mode in states 4-8
    if (prevMode === 'free' && navigationMode === 'guided' &&
      s >= S.state_4 && s <= S.state_8 &&
      scene && shipPivot && shipRoot) {

      const anchorIndex = s - S.state_4 + 1; // 1, 2, 3, 4, or 5
      const anchorKey = isMobile ? `mobile${anchorIndex}` : `desktop${anchorIndex}`;
      const anchorData = anchorDataRef.current[anchorKey];

      // FIX: Ensure model animations are running (they might have stopped in free mode)

      // 1. Rockring (always active in states 4-7)
      const rockRingGroups = rockRingAnimationGroupsRef.current;
      if (rockRingGroups && rockRingGroups.length > 0) {
        const animGroup = rockRingGroups[0];
        if (!animGroup.isPlaying) {
          animGroup.start(true, 1.7, 1, 2000);
        }
      }

      // 2. Musecraft (State 5)
      const museGroups = musecraftAnimationGroupsRef.current;
      if (s === S.state_5 && modelVisibilityRef.current.model2 && museGroups.length > 0) {
        museGroups.forEach(group => {
          if (!group.isPlaying) {
            group.play(true);
          }
        });
      }

      // 3. Petwheels (State 7) - Restart if visible
      const petGroups = petwheelsAnimationGroupsRef.current;
      if (s === S.state_7 && modelVisibilityRef.current.model4 && petGroups.length > 0) {
        petGroups.forEach(group => {
          if (!group.isPlaying) {
            group.play(true);
          }
        });
      }

      if (anchorData) {
        // Get current ship position and forward direction
        const startPosition = shipRoot.position.clone();

        // Calculate current forward direction from ship rotation
        let startForward = new BABYLON.Vector3(0, 0, 1); // Default forward
        if (shipRoot.rotationQuaternion) {
          startForward.rotateByQuaternionToRef(shipRoot.rotationQuaternion, startForward);
        }

        // Get start rotation
        const startRotation = shipRoot.rotationQuaternion?.clone() || BABYLON.Quaternion.Identity();

        // Ensure shipPivot is parented to shipRoot for camera following
        if (shipPivot.parent !== shipRoot) {
          shipPivot.setParent(shipRoot);
          const pivotY = isMobile ? 1.17 : 0.9;
          shipPivot.position.set(0, pivotY, 0);
          shipPivot.rotationQuaternion = BABYLON.Quaternion.Identity();

          if (camera) {
            camera.lockedTarget = shipPivot;
          }
        }

        // Parent smoke emitter to shipPivot for guided mode too
        const smokeEmitter = smokeEmitterRef.current;
        if (smokeEmitter && smokeEmitter.parent !== shipPivot) {
          smokeEmitter.parent = shipPivot;
        }

        // Get camera radius from state config for zoom-out during travel
        const cameraConfig = config.canvas.babylonCamera;
        const stateRadius = isMobile
          ? cameraConfig?.lowerRadiusLimit?.mobile ?? 24
          : cameraConfig?.lowerRadiusLimit?.desktop ?? 24;

        // Mark as not arrived - ship is about to travel
        guidedModeArrivedRef.current = false;

        // Animate ship along bezier curve to anchor position
        animateShipAlongBezier({
          target: shipRoot,
          scene,
          camera,
          canvas: ref.current,
          startPosition,
          startForward,
          endPosition: anchorData.position,
          endForward: anchorData.forward,
          startRotation,
          endRotation: anchorData.rotation,
          stateRadius,
          flameParticles: flameParticleSystemRef.current,
          onComplete: () => {
            guidedModeArrivedRef.current = true;
          }
        });
      } else {
        console.warn(`⚠️ [Mode Toggle] Anchor ${anchorKey} not found`);
      }
    }

    // Switching from GUIDED to FREE mode in states 4-7
    if (prevMode === 'guided' && navigationMode === 'free' &&
      s >= S.state_4 && s <= S.state_8 &&
      scene && camera) {

      // CRITICAL: Cancel any running bezier animation first!
      // This prevents the guided mode camera zoom-in animation from continuing
      // and overriding the free mode camera radius
      cancelBezierAnimation(scene, shipRoot, camera);

      // In free mode, no travel animation so model rotation is always allowed
      guidedModeArrivedRef.current = true;

      // Restore ship and flames visibility (they may have been hidden after guided mode arrival)
      if (shipRoot) {
        setShipAndFlamesVisibility({
          shipMeshes: shipRoot.getChildMeshes(),
          flameParticles: flameParticleSystemRef.current,
          visible: true,
          method: 'visibility',
          logContext: 'Mode Toggle'
        });
      }

      // Animate camera radius limits back to state values for free exploration
      const cameraConfig = config.canvas.babylonCamera;
      const lowerLimit = isMobile
        ? cameraConfig?.lowerRadiusLimit?.mobile ?? 2
        : cameraConfig?.lowerRadiusLimit?.desktop ?? 5;
      const upperLimit = isMobile
        ? cameraConfig?.upperRadiusLimit?.mobile ?? 2
        : cameraConfig?.upperRadiusLimit?.desktop ?? 5;


      const radiusEasing = new BABYLON.CubicEase();
      radiusEasing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);

      animateCameraRadius({
        camera,
        scene,
        duration: 0.8,
        lowerRadiusLimit: lowerLimit,
        upperRadiusLimit: upperLimit,
        easing: radiusEasing
      });
    }

    // Update previous mode ref
    prevNavigationModeRef.current = navigationMode;
  }, [navigationMode, s]);

  // Proximity-based model visibility with atom indicators
  // Models are shown/hidden based on ship distance to their anchors
  // When hidden: atom indicator shows (flame + rotating rings)
  // When close: model fades in, atom expands and flame stops
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Only run proximity detection in explore states (4-7)
    const inExploreState = s >= S.state_4 && s <= S.state_8;
    if (!inExploreState) {
      // Hide all models, contract and hide all atoms when not in explore states
      const atoms = atomIndicatorsRef.current;
      const visibility = modelVisibilityRef.current;

      // Contract all atoms that are expanded and hide them
      // Use force=true and stop animations to ensure clean state when leaving explore states
      if (atoms.atom1) {
        atoms.atom1.stopAnimations();
        atoms.atom1.contract(0.3, true);
        atoms.atom1.root.setEnabled(false);
      }
      if (atoms.atom2) {
        atoms.atom2.stopAnimations();
        atoms.atom2.contract(0.3, true);
        atoms.atom2.root.setEnabled(false);
      }
      if (atoms.atom3) {
        atoms.atom3.stopAnimations();
        atoms.atom3.contract(0.3, true);
        atoms.atom3.root.setEnabled(false);
      }
      if (atoms.atom4) {
        atoms.atom4.stopAnimations();
        atoms.atom4.contract(0.3, true);
        atoms.atom4.root.setEnabled(false);
      }
      if (atoms.atom5) {
        atoms.atom5.stopAnimations();
        atoms.atom5.contract(0.3, true);
        atoms.atom5.root.setEnabled(false);
      }

      // Hide all models and stop any running scale animations
      // This ensures clean state when leaving explore states
      if (visibility.model1 && carMeshesRef.current.length > 0) {
        const anim = modelScaleAnimations.get(carRootRef.current!);
        if (anim) anim.stop();
        if (carRootRef.current) modelScaleAnimations.delete(carRootRef.current);
        carMeshesRef.current.forEach(mesh => mesh.setEnabled(false));
        visibility.model1 = false;
      }
      if (visibility.model2 && musecraftMeshesRef.current.length > 0) {
        const anim = modelScaleAnimations.get(musecraftRootRef.current!);
        if (anim) anim.stop();
        if (musecraftRootRef.current) modelScaleAnimations.delete(musecraftRootRef.current);
        musecraftMeshesRef.current.forEach(mesh => mesh.setEnabled(false));
        visibility.model2 = false;
      }
      if (visibility.model3 && dioramasMeshesRef.current.length > 0) {
        const anim = modelScaleAnimations.get(dioramasRootRef.current!);
        if (anim) anim.stop();
        if (dioramasRootRef.current) modelScaleAnimations.delete(dioramasRootRef.current);
        dioramasMeshesRef.current.forEach(mesh => mesh.setEnabled(false));
        visibility.model3 = false;
      }
      if (visibility.model4 && petwheelsMeshesRef.current.length > 0) {
        const anim = modelScaleAnimations.get(petwheelsRootRef.current!);
        if (anim) anim.stop();
        if (petwheelsRootRef.current) modelScaleAnimations.delete(petwheelsRootRef.current);
        petwheelsMeshesRef.current.forEach(mesh => mesh.setEnabled(false));
        visibility.model4 = false;
      }
      if (visibility.model5 && personalMeshesRef.current.length > 0) {
        const anim = modelScaleAnimations.get(personalRootRef.current!);
        if (anim) anim.stop();
        if (personalRootRef.current) modelScaleAnimations.delete(personalRootRef.current);
        personalMeshesRef.current.forEach(mesh => mesh.setEnabled(false));
        visibility.model5 = false;
        // Reset Musecraft interaction (gizmo, selection, flames) when leaving explore states
        resetMusecraftInteraction();
        stopRocketFlames();
      }



      return;
    }

    // In explore states - enable all atoms (they'll show contracted state by default)
    const atoms = atomIndicatorsRef.current;
    if (atoms.atom1) atoms.atom1.root.setEnabled(true);
    if (atoms.atom2) atoms.atom2.root.setEnabled(true);
    if (atoms.atom3) atoms.atom3.root.setEnabled(true);
    if (atoms.atom4) atoms.atom4.root.setEnabled(true);
    if (atoms.atom5) atoms.atom5.root.setEnabled(true);

    // Proximity check function for a single model
    // Uses force mode on atom expand/contract to handle mid-animation interruptions
    const checkModelProximity = (
      modelKey: 'model1' | 'model2' | 'model3' | 'model4' | 'model5',
      rootRef: React.MutableRefObject<BABYLON.TransformNode | BABYLON.AbstractMesh | null>,
      meshesRef: React.MutableRefObject<BABYLON.AbstractMesh[]>,
      anchorRef: React.MutableRefObject<BABYLON.AbstractMesh | null>,
      atomKey: 'atom1' | 'atom2' | 'atom3' | 'atom4' | 'atom5'
    ) => {
      const shipRoot = spaceshipRootRef.current;
      if (!shipRoot) return;

      const modelRoot = rootRef.current;
      const meshes = meshesRef.current;
      const anchor = anchorRef.current;
      const atom = atomIndicatorsRef.current[atomKey];
      const config = atomConfigRef.current[modelKey];
      const visibility = modelVisibilityRef.current;

      if (meshes.length === 0 || !anchor || !modelRoot) return;

      // Calculate distance from ship to anchor
      const shipPos = shipRoot.getAbsolutePosition();
      const anchorPos = anchor.getAbsolutePosition();
      const distance = BABYLON.Vector3.Distance(shipPos, anchorPos);

      const isCurrentlyVisible = visibility[modelKey];
      const shouldBeVisible = distance <= config.proximityDistance;

      // Transition to visible (SHOW model + EXPAND atom)
      if (shouldBeVisible && !isCurrentlyVisible) {
        visibility[modelKey] = true;

        // Expand atom with force=true to handle interruptions
        // This stops any running contract animation and starts expand from current state
        if (atom) {
          atom.expand(0.6, true);
        }



        // Reset parent root rotation to original anchor rotation when model becomes visible
        // This ensures consistent initial orientation
        if (rootRef.current && anchorRef.current && rootRef.current.rotationQuaternion) {
          const anchorWorldMatrix = anchorRef.current.getWorldMatrix();
          const originalRotation = BABYLON.Quaternion.Identity();
          anchorWorldMatrix.decompose(undefined, originalRotation, undefined);
          rootRef.current.rotationQuaternion.copyFrom(originalRotation);
        }

        // Reset model rotation state so model starts with clean rotation
        modelRotationRef.current.isDragging = false;
        modelRotationRef.current.accumulatedYRotation = 0;
        modelRotationRef.current.peekRotationX = 0;
        modelRotationRef.current.velocityY = 0;
        modelRotationRef.current.originalQuaternion = null;

        // Multi-model state handling - only show selected model, hide others
        // Maps modelKey to its corresponding multi-model ref
        const multiModelRefs: Record<string, React.MutableRefObject<{ roots: (BABYLON.AbstractMesh | null)[]; meshes: BABYLON.AbstractMesh[][] }>> = {
          'model1': meetkaiModelsRef,
          'model2': moreThanRealModelsRef,
          'model3': dioramaModelsRef,
          'model4': ufscModelsRef,
          'model5': personalModelsRef
        };

        const modelsRef = multiModelRefs[modelKey];
        if (modelsRef && modelsRef.current.roots.length > 0) {
          // Multi-model state - only show selected model
          const selectedIndex = useUI.getState().selectedProjectIndex;
          const models = modelsRef.current;

          for (let i = 0; i < models.roots.length; i++) {
            const modelRoot = models.roots[i];
            const modelMeshes = models.meshes[i];

            if (!modelRoot || modelMeshes.length === 0) continue;

            if (i === selectedIndex) {
              // Use scaleModelMeshes for the selected model
              scaleModelMeshes(modelRoot, modelMeshes, scene, true, 2, () => { });
            } else {
              // Keep other models hidden
              modelMeshes.forEach(m => m.setEnabled(false));
            }
          }
        } else {
          // Fallback for single-model states (scaleModelMeshes handles interruption)
          scaleModelMeshes(modelRoot, meshes, scene, true, 2, () => { });
        }

        // Start model animations using animation controller
        // Map modelKey to state to get project IDs - includes ALL 5 anchor states
        const stateToConfig: Record<string, number> = {
          'model1': S.state_4, // anchor_1 - Musecraft (Personal Projects)
          'model2': S.state_5, // anchor_2 - MeetKai
          'model3': S.state_6, // anchor_3 - More Than Real
          'model4': S.state_7, // anchor_4 - Baltha Maker
          'model5': S.state_8  // anchor_5 - UFSC
        };

        const stateNum = stateToConfig[modelKey];
        if (stateNum !== undefined) {
          const workplaceConfig = getWorkplaceConfig(stateNum);
          const selectedIndex = useUI.getState().selectedProjectIndex;
          const projectId = workplaceConfig?.projects[selectedIndex]?.id;

          if (projectId) {
            const animGroups = modelAnimationGroupsRef.current.get(projectId);
            if (animGroups && animGroups.length > 0) {
              startModelAnimations(projectId, animGroups, false);
            }
          }
        }

        // Initialize Musecraft interaction system (selection + gizmo) for model1 (Musecraft at state_4)
        if (modelKey === 'model1') {

          const root = meetkaiModelsRef.current.roots[0]; // Musecraft is first (and only) model at anchor_1
          if (root && sceneRef.current && !isMusecraftInteractionInitialized()) {
            // Small delay to ensure meshes are fully enabled after scale animation starts
            setTimeout(() => {
              if (meetkaiModelsRef.current.roots[0] && sceneRef.current) {
                initMusecraftInteraction(meetkaiModelsRef.current.roots[0] as BABYLON.AbstractMesh, sceneRef.current);
              }
            }, 100);
          } else if (isMusecraftInteractionInitialized()) {
            // Already initialized from previous visit - re-select rocket and start flames
            setTimeout(() => {
              selectRocketByDefault();
              startRocketFlames();
            }, 100);
          }
        }
      }
      // Transition to hidden (HIDE model + CONTRACT atom)
      else if (!shouldBeVisible && isCurrentlyVisible) {
        visibility[modelKey] = false;

        // Stop model animations using animation controller
        // Map modelKey to state - includes ALL 5 anchor states
        const stateToConfig: Record<string, number> = {
          'model1': S.state_4, // anchor_1 - Musecraft (Personal Projects)
          'model2': S.state_5, // anchor_2 - MeetKai
          'model3': S.state_6, // anchor_3 - More Than Real
          'model4': S.state_7, // anchor_4 - Baltha Maker
          'model5': S.state_8  // anchor_5 - UFSC
        };

        const stateNum = stateToConfig[modelKey];
        if (stateNum !== undefined) {
          const workplaceConfig = getWorkplaceConfig(stateNum);
          if (workplaceConfig) {
            // Stop all animations for all projects in this state
            workplaceConfig.projects.forEach(project => {
              stopModelAnimations(project.id);
            });
          }
        }

        // Reset Musecraft interaction when model1 becomes hidden (Musecraft at state_4)
        if (modelKey === 'model1') {
          resetMusecraftInteraction();
          stopRocketFlames();
        }

        // Contract atom with force=true to handle interruptions
        // This stops any running expand animation and starts contract from current state
        if (atom) {
          atom.contract(0.6, true);
        }

        // Scale out model (scaleModelMeshes handles interruption)
        scaleModelMeshes(modelRoot, meshes, scene, false, 2);
      }
    };

    // Create proximity check observer
    const proximityObserver = scene.onBeforeRenderObservable.add(() => {
      // Check each model's proximity
      checkModelProximity('model1', carRootRef, carMeshesRef, carAnchorRef, 'atom1');
      checkModelProximity('model2', musecraftRootRef, musecraftMeshesRef, musecraftAnchorRef, 'atom2');
      checkModelProximity('model3', dioramasRootRef, dioramasMeshesRef, dioramasAnchorRef, 'atom3');
      checkModelProximity('model4', petwheelsRootRef, petwheelsMeshesRef, petwheelsAnchorRef, 'atom4');
      checkModelProximity('model5', personalRootRef, personalMeshesRef, personalAnchorRef, 'atom5');
    });

    return () => {
      scene.onBeforeRenderObservable.remove(proximityObserver);
    };
  }, [s]);

  // Handle model switching for all workplace states
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Get the activeWorkplaceState to know which model set to switch
    const activeState = useUI.getState().activeWorkplaceState;
    if (activeState === null) return;

    // Map state to model ref and visibility key
    type ModelData = {
      modelsRef: React.MutableRefObject<{ roots: (BABYLON.AbstractMesh | null)[]; meshes: BABYLON.AbstractMesh[][] }>;
      visibilityKey: 'model1' | 'model2' | 'model3' | 'model4' | 'model5';
    };

    const stateToModelData: Partial<Record<S, ModelData>> = {
      // Note: Refs are named historically but now load from workplaceConfig dynamically
      // Config order: Musecraft → MeetKai → More Than Real → Baltha Maker → UFSC
      [S.state_4]: { modelsRef: meetkaiModelsRef, visibilityKey: 'model1' },      // anchor_1: Musecraft
      [S.state_5]: { modelsRef: moreThanRealModelsRef, visibilityKey: 'model2' }, // anchor_2: MeetKai
      [S.state_6]: { modelsRef: dioramaModelsRef, visibilityKey: 'model3' },      // anchor_3: More Than Real
      [S.state_7]: { modelsRef: ufscModelsRef, visibilityKey: 'model4' },         // anchor_4: Baltha Maker
      [S.state_8]: { modelsRef: personalModelsRef, visibilityKey: 'model5' },     // anchor_5: UFSC
    };

    // Map state to parent root ref for rotation reset
    const stateToParentRoot: Partial<Record<S, React.MutableRefObject<BABYLON.TransformNode | null>>> = {
      [S.state_4]: meetkaiRootRef,
      [S.state_5]: moreThanRealRootRef,
      [S.state_6]: dioramasRootRef,
      [S.state_7]: ufscRootRef,
      [S.state_8]: personalRootRef,
    };

    // Map state to anchor ref for rotation recomputation
    const stateToAnchorRef: Partial<Record<S, React.MutableRefObject<BABYLON.AbstractMesh | null>>> = {
      [S.state_4]: carAnchorRef,
      [S.state_5]: musecraftAnchorRef,
      [S.state_6]: dioramasAnchorRef,
      [S.state_7]: petwheelsAnchorRef,
      [S.state_8]: personalAnchorRef,
    };

    const modelData = stateToModelData[activeState];
    if (!modelData) return;

    const { modelsRef, visibilityKey } = modelData;
    const models = modelsRef.current;
    const isModelVisible = modelVisibilityRef.current[visibilityKey];

    // Only switch models if the state's model is currently visible
    if (!isModelVisible) return;

    // Reset parent root rotation to original by recomputing from anchor
    const parentRootRef = stateToParentRoot[activeState];
    const anchorRef = stateToAnchorRef[activeState];
    if (parentRootRef?.current && anchorRef?.current && parentRootRef.current.rotationQuaternion) {
      // Recompute original rotation from anchor
      const anchor = anchorRef.current;
      const anchorWorldMatrix = anchor.getWorldMatrix();
      const originalRotation = BABYLON.Quaternion.Identity();
      anchorWorldMatrix.decompose(undefined, originalRotation, undefined);
      parentRootRef.current.rotationQuaternion.copyFrom(originalRotation);
    }

    // Reset model rotation state so new model starts with clean rotation
    modelRotationRef.current.isDragging = false;
    modelRotationRef.current.accumulatedYRotation = 0;
    modelRotationRef.current.peekRotationX = 0;
    modelRotationRef.current.velocityY = 0;
    modelRotationRef.current.originalQuaternion = null;

    // Switch models within this state
    for (let i = 0; i < models.roots.length; i++) {
      const modelRoot = models.roots[i];
      const modelMeshes = models.meshes[i];

      if (!modelRoot || modelMeshes.length === 0) continue;

      if (i === selectedProjectIndex) {
        // Show selected model with scale-up animation
        modelRoot.scaling.set(0.001, 0.001, 0.001);
        modelMeshes.forEach(mesh => mesh.setEnabled(true));

        // Animate scale up quickly
        const fps = 60;
        const duration = 0.3;
        const totalFrames = fps * duration;

        const scaleAnim = new BABYLON.Animation(
          "modelScaleIn",
          "scaling",
          fps,
          BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
          BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        scaleAnim.setKeys([
          { frame: 0, value: new BABYLON.Vector3(0.001, 0.001, 0.001) },
          { frame: totalFrames, value: new BABYLON.Vector3(1, 1, 1) }
        ]);

        const easing = new BABYLON.QuadraticEase();
        easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
        scaleAnim.setEasingFunction(easing);

        modelRoot.animations = [scaleAnim];
        scene.beginAnimation(modelRoot, 0, totalFrames, false);

        // Start animations for the newly selected model
        const workplaceConfig = getWorkplaceConfig(activeState);
        const projectId = workplaceConfig?.projects[i]?.id;
        if (projectId) {
          const animGroups = modelAnimationGroupsRef.current.get(projectId);
          if (animGroups && animGroups.length > 0) {
            // isProjectSwitch = true tells sika to replay "Entrada" intro
            startModelAnimations(projectId, animGroups, true);
          }
        }

      } else {
        // Hide other models instantly
        modelMeshes.forEach(mesh => mesh.setEnabled(false));
        modelRoot.scaling.set(1, 1, 1);

        // Stop animations for hidden models
        const workplaceConfig = getWorkplaceConfig(activeState);
        const projectId = workplaceConfig?.projects[i]?.id;
        if (projectId) {
          stopModelAnimations(projectId);
        }
      }
    }
  }, [selectedProjectIndex]);

  return <canvas ref={ref} className="block w-full h-full" />;
}
