import React, { useEffect, useRef } from "react";
import * as BABYLON from "babylonjs";
import "@babylonjs/loaders";
import { useUI, S } from "../state";
import { getStateConfig } from "../states";

import { colorSettings, trimConfigs } from "./carConfig";
import {
  initMusecraftInteraction,
  resetMusecraftInteraction,
  stopRocketFlames,
  startRocketFlames,
  isMusecraftInteractionInitialized,
  isMusecraftGizmoDragging,
  selectRocketByDefault
} from "./MusecraftInteraction";

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

// Universal transform animation function
interface AnimateTransformOptions {
  target: BABYLON.TransformNode | BABYLON.AbstractMesh;
  scene: BABYLON.Scene;
  duration: number; // in seconds
  delay?: number; // delay before animation starts (in seconds)
  position?: BABYLON.Vector3;
  rotation?: BABYLON.Vector3;
  scaling?: BABYLON.Vector3;
  easing?: BABYLON.EasingFunction;
  onComplete?: () => void;
}

function animateTransform(options: AnimateTransformOptions): void {
  const { target, scene, duration, delay = 0, position, rotation, scaling, easing, onComplete } = options;

  const executeAnimation = () => {
    const fps = 60;
    const totalFrames = fps * duration;
    const animations: BABYLON.Animation[] = [];

    // Position animation
    if (position) {
      const currentPos = target.position.clone();
      const posAnim = new BABYLON.Animation(
        "positionAnim",
        "position",
        fps,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      );
      posAnim.setKeys([
        { frame: 0, value: currentPos },
        { frame: totalFrames, value: position }
      ]);
      if (easing) posAnim.setEasingFunction(easing);
      animations.push(posAnim);
    }

    // Rotation animation
    if (rotation) {
      const currentRot = target.rotation.clone();
      const rotAnim = new BABYLON.Animation(
        "rotationAnim",
        "rotation",
        fps,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      );
      rotAnim.setKeys([
        { frame: 0, value: currentRot },
        { frame: totalFrames, value: rotation }
      ]);
      if (easing) rotAnim.setEasingFunction(easing);
      animations.push(rotAnim);
    }

    // Scaling animation
    if (scaling) {
      const currentScale = target.scaling.clone();
      const scaleAnim = new BABYLON.Animation(
        "scalingAnim",
        "scaling",
        fps,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      );
      scaleAnim.setKeys([
        { frame: 0, value: currentScale },
        { frame: totalFrames, value: scaling }
      ]);
      if (easing) scaleAnim.setEasingFunction(easing);
      animations.push(scaleAnim);
    }

    // Apply animations
    if (animations.length > 0) {
      target.animations = animations;
      scene.beginAnimation(target, 0, totalFrames, false, 1, onComplete);
    } else if (onComplete) {
      onComplete();
    }
  };

  // Apply delay if specified
  if (delay > 0) {
    setTimeout(executeAnimation, delay * 1000);
  } else {
    executeAnimation();
  }
}

// Universal camera radius limits animation function
interface AnimateCameraRadiusOptions {
  camera: BABYLON.ArcRotateCamera;
  scene: BABYLON.Scene;
  duration: number; // in seconds
  delay?: number; // delay before animation starts (in seconds)
  lowerRadiusLimit?: number;
  upperRadiusLimit?: number;
  beta?: number;
  alpha?: number;
  easing?: BABYLON.EasingFunction;
  onComplete?: () => void;
}

// Helper function to normalize angle difference for shortest rotation path
function normalizeAngleDifference(current: number, target: number): number {
  // Calculate the difference
  let diff = target - current;

  // Normalize to [-π, π] range for shortest path
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;

  // Return the normalized target (current + shortest difference)
  return current + diff;
}

function animateCameraRadius(options: AnimateCameraRadiusOptions): void {
  const { camera, scene, duration, delay = 0, lowerRadiusLimit, upperRadiusLimit, beta, alpha, easing, onComplete } = options;

  const executeAnimation = () => {

    const fps = 60;
    const totalFrames = fps * duration;
    const animations: BABYLON.Animation[] = [];

    // Lower radius limit animation
    if (lowerRadiusLimit !== undefined) {
      const currentLower = camera.lowerRadiusLimit || 0;
      const lowerAnim = new BABYLON.Animation(
        "lowerRadiusAnim",
        "lowerRadiusLimit",
        fps,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      );
      lowerAnim.setKeys([
        { frame: 0, value: currentLower },
        { frame: totalFrames, value: lowerRadiusLimit }
      ]);
      if (easing) lowerAnim.setEasingFunction(easing);
      animations.push(lowerAnim);
    }

    // Upper radius limit animation
    if (upperRadiusLimit !== undefined) {
      const currentUpper = camera.upperRadiusLimit || 0;
      const upperAnim = new BABYLON.Animation(
        "upperRadiusAnim",
        "upperRadiusLimit",
        fps,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      );
      upperAnim.setKeys([
        { frame: 0, value: currentUpper },
        { frame: totalFrames, value: upperRadiusLimit }
      ]);
      if (easing) upperAnim.setEasingFunction(easing);
      animations.push(upperAnim);
    }

    // Beta animation (vertical rotation)
    if (beta !== undefined) {
      const currentBeta = camera.beta;
      const normalizedBeta = normalizeAngleDifference(currentBeta, beta);
      const betaAnim = new BABYLON.Animation(
        "betaAnim",
        "beta",
        fps,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      );
      betaAnim.setKeys([
        { frame: 0, value: currentBeta },
        { frame: totalFrames, value: normalizedBeta }
      ]);
      if (easing) betaAnim.setEasingFunction(easing);
      animations.push(betaAnim);
    }

    // Alpha animation (horizontal rotation)
    if (alpha !== undefined) {
      const currentAlpha = camera.alpha;
      const normalizedAlpha = normalizeAngleDifference(currentAlpha, alpha);
      const alphaAnim = new BABYLON.Animation(
        "alphaAnim",
        "alpha",
        fps,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      );
      alphaAnim.setKeys([
        { frame: 0, value: currentAlpha },
        { frame: totalFrames, value: normalizedAlpha }
      ]);
      if (easing) alphaAnim.setEasingFunction(easing);
      animations.push(alphaAnim);
    }

    // Apply animations
    if (animations.length > 0) {
      camera.animations = animations;
      scene.beginAnimation(camera, 0, totalFrames, false, 1, () => {
        if (onComplete) onComplete();
      });
    } else if (onComplete) {
      onComplete();
    }
  };

  // Apply delay if specified
  if (delay > 0) {
    setTimeout(executeAnimation, delay * 1000);
  } else {
    executeAnimation();
  }
}

// Universal fog animation function
interface AnimateFogOptions {
  scene: BABYLON.Scene;
  duration: number; // in seconds
  delay?: number; // delay before animation starts (in seconds)
  fogStart?: number;
  fogEnd?: number;
  easing?: BABYLON.EasingFunction;
  onComplete?: () => void;
}

function animateFog(options: AnimateFogOptions): void {
  const { scene, duration, delay = 0, fogStart, fogEnd, easing, onComplete } = options;

  const executeAnimation = () => {
    const fps = 60;
    const totalFrames = fps * duration;
    const animations: BABYLON.Animation[] = [];

    // Fog start animation
    if (fogStart !== undefined) {
      const currentFogStart = scene.fogStart;
      const fogStartAnim = new BABYLON.Animation(
        "fogStartAnim",
        "fogStart",
        fps,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      );
      fogStartAnim.setKeys([
        { frame: 0, value: currentFogStart },
        { frame: totalFrames, value: fogStart }
      ]);
      if (easing) fogStartAnim.setEasingFunction(easing);
      animations.push(fogStartAnim);
    }

    // Fog end animation
    if (fogEnd !== undefined) {
      const currentFogEnd = scene.fogEnd;
      const fogEndAnim = new BABYLON.Animation(
        "fogEndAnim",
        "fogEnd",
        fps,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      );
      fogEndAnim.setKeys([
        { frame: 0, value: currentFogEnd },
        { frame: totalFrames, value: fogEnd }
      ]);
      if (easing) fogEndAnim.setEasingFunction(easing);
      animations.push(fogEndAnim);
    }

    // Apply animations
    if (animations.length > 0) {
      scene.animations = animations;
      scene.getEngine().scenes.forEach(s => {
        if (s === scene) {
          scene.getEngine().runRenderLoop(() => { });
        }
      });
      scene.beginAnimation(scene, 0, totalFrames, false, 1, onComplete);
    } else if (onComplete) {
      onComplete();
    }
  };

  // Apply delay if specified
  if (delay > 0) {
    setTimeout(executeAnimation, delay * 1000);
  } else {
    executeAnimation();
  }
}

// Anchor data structure for guided mode ship positions
interface AnchorData {
  position: BABYLON.Vector3;
  rotation: BABYLON.Quaternion;
  forward: BABYLON.Vector3;
}

// Atom indicator configuration and structure
interface AtomIndicatorConfig {
  scene: BABYLON.Scene;
  position: BABYLON.Vector3;
  idleRingRadius: number; // Small radius when model is hidden
  expandedRingRadii: [number, number, number]; // Expanded radii for each ring when model visible
  rotationSpeed: number; // Base rotation speed multiplier
  flameScale?: number; // Scale of the flame particle effect (default 1.0)
}

interface AtomIndicator {
  root: BABYLON.TransformNode;
  rings: BABYLON.LinesMesh[];
  flame: BABYLON.ParticleSystem;
  ringAnimations: {
    axis: BABYLON.Vector3;
    speed: number;
  }[];
  config: AtomIndicatorConfig;
  // Methods - expand/contract now support force option to handle interruptions
  expand: (duration?: number, force?: boolean) => void;
  contract: (duration?: number, force?: boolean) => void;
  getIsExpanded: () => boolean;
  stopAnimations: () => void;
  dispose: () => void;
}

/**
 * Creates an atom indicator at the specified position.
 * The atom consists of a flame particle effect in the center and 3 rotating rings.
 */
function createAtomIndicator(config: AtomIndicatorConfig): AtomIndicator {
  const { scene, position, idleRingRadius, expandedRingRadii, rotationSpeed, flameScale = 1.0 } = config;

  // Create root transform node
  const root = new BABYLON.TransformNode("atomIndicator", scene);
  root.position.copyFrom(position);

  // Create a small invisible sphere to serve as emitter (particle systems need AbstractMesh, not TransformNode)
  const emitterSphere = BABYLON.MeshBuilder.CreateSphere("atomEmitter", { diameter: 0.01 }, scene);
  emitterSphere.parent = root;
  emitterSphere.isVisible = false;

  // Create flame particle system (smaller version of engine flame)
  const flame = new BABYLON.ParticleSystem("atomFlame", 150, scene);
  flame.particleTexture = new BABYLON.Texture("/assets/textures/muzzle_06.png", scene);
  flame.emitter = emitterSphere;
  flame.updateSpeed = 0.04;
  flame.minEmitPower = 0.01 * flameScale;
  flame.maxEmitPower = 0.03 * flameScale;
  flame.emitRate = 100;

  // Sphere emitter for centered particles
  const sphereEmitter = new BABYLON.SphereParticleEmitter(0.1 * flameScale);
  sphereEmitter.radiusRange = 1;
  flame.particleEmitterType = sphereEmitter;

  // Size
  flame.minSize = 0.15 * flameScale;
  flame.maxSize = 0.4 * flameScale;

  // Rotation
  flame.minInitialRotation = 0;
  flame.maxInitialRotation = Math.PI * 2;

  // Lifetime
  flame.minLifeTime = 0.15;
  flame.maxLifeTime = 0.35;

  flame.gravity = new BABYLON.Vector3(0, 0, 0);
  flame.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
  flame.color1 = new BABYLON.Color4(1, 0.6, 0.3, 0.5);
  flame.color2 = new BABYLON.Color4(1, 0.2, 0.6, 0.2);
  flame.colorDead = new BABYLON.Color4(0, 0, 0.5, 0.2);


  flame.start();

  // Create 3 rings with different orientations (line-based circles)
  const rings: BABYLON.LinesMesh[] = [];

  // Ring orientations (tilted at different angles like an atom)
  const ringOrientations = [
    { rotX: 0, rotY: 0, rotZ: 0 },
    { rotX: Math.PI / 3, rotY: Math.PI / 4, rotZ: 0 },
    { rotX: -Math.PI / 4, rotY: Math.PI / 3, rotZ: Math.PI / 6 }
  ];

  // Random rotation axes and speeds for each ring
  const ringAnimations: { axis: BABYLON.Vector3; speed: number }[] = [];

  for (let i = 0; i < 3; i++) {
    // Create circle points (64 segments for smoothness)
    const segments = 64;
    const radius = idleRingRadius * (1 + i * 0.15); // Slightly different sizes
    const points: BABYLON.Vector3[] = [];
    // Create vertex colors with alpha for transparency (performant - no extra material needed)
    const colors: BABYLON.Color4[] = [];
    const ringColor = new BABYLON.Color4(1, 1, 1, 0.4); // Semi-transparent gray

    for (let j = 0; j <= segments; j++) {
      const angle = (j / segments) * Math.PI * 2;
      points.push(new BABYLON.Vector3(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      ));
      colors.push(ringColor);
    }

    // Create line mesh for the ring with vertex colors (supports alpha)
    const ring = BABYLON.MeshBuilder.CreateLines(`atomRing${i}`, {
      points: points,
      colors: colors,
      useVertexAlpha: true,
      updatable: true
    }, scene);

    ring.parent = root;
    ring.isPickable = false; // Allow clicks to pass through to models behind

    // Apply initial orientation
    const orient = ringOrientations[i];
    ring.rotation.set(orient.rotX, orient.rotY, orient.rotZ);

    rings.push(ring);

    // Random rotation axis and speed
    ringAnimations.push({
      axis: new BABYLON.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize(),
      speed: (0.5 + Math.random() * 0.5) * rotationSpeed * (i % 2 === 0 ? 1 : -1)
    });
  }

  // Animation observer for continuous ring rotation
  const rotationObserver = scene.onBeforeRenderObservable.add(() => {
    const deltaTime = scene.getEngine().getDeltaTime() / 1000;
    rings.forEach((ring, i) => {
      const anim = ringAnimations[i];
      ring.rotate(anim.axis, anim.speed * deltaTime, BABYLON.Space.LOCAL);
    });
  });

  // State tracking
  let isExpanded = false;
  let runningAnimatables: BABYLON.Animatable[] = [];

  // Stop all running ring animations
  const stopAnimations = () => {
    runningAnimatables.forEach(anim => {
      if (anim) {
        anim.stop();
      }
    });
    runningAnimatables = [];
  };

  // Expand rings and stop flame
  // force: if true, will expand even if already expanded (handles interruption mid-animation)
  const expand = (duration = 2, force = false) => {
    // Skip if already expanded and not forcing
    if (isExpanded && !force) return;

    // Stop any running animations to prevent conflicts
    stopAnimations();
    isExpanded = true;

    const fps = 60;
    const totalFrames = fps * duration;

    // Stop flame particles
    flame.stop();

    // Animate each ring to its expanded size (starting from CURRENT scale, not assumed start)
    rings.forEach((ring, i) => {
      const targetDiameter = expandedRingRadii[i] / (idleRingRadius * (1 + i * 0.15));

      const scaleAnim = new BABYLON.Animation(
        `ringExpand${i}`,
        "scaling",
        fps,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      // Start from current scale (handles mid-animation interruption)
      scaleAnim.setKeys([
        { frame: 0, value: ring.scaling.clone() },
        { frame: totalFrames, value: new BABYLON.Vector3(targetDiameter, targetDiameter, targetDiameter) }
      ]);

      const easing = new BABYLON.CubicEase();
      easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
      scaleAnim.setEasingFunction(easing);

      ring.animations = [scaleAnim];
      const animatable = scene.beginAnimation(ring, 0, totalFrames, false);
      runningAnimatables.push(animatable);
    });
  };

  // Contract rings and start flame
  // force: if true, will contract even if already contracted (handles interruption mid-animation)
  const contract = (duration = 0.5, force = false) => {
    // Skip if already contracted and not forcing
    if (!isExpanded && !force) return;

    // Stop any running animations to prevent conflicts
    stopAnimations();
    isExpanded = false;

    const fps = 60;
    const totalFrames = fps * duration;

    // Start flame particles
    flame.start();

    // Animate each ring back to idle size (starting from CURRENT scale)
    rings.forEach((ring, i) => {
      const targetScale = 1; // Back to original scale

      const scaleAnim = new BABYLON.Animation(
        `ringContract${i}`,
        "scaling",
        fps,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      // Start from current scale (handles mid-animation interruption)
      scaleAnim.setKeys([
        { frame: 0, value: ring.scaling.clone() },
        { frame: totalFrames, value: new BABYLON.Vector3(targetScale, targetScale, targetScale) }
      ]);

      const easing = new BABYLON.CubicEase();
      easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
      scaleAnim.setEasingFunction(easing);

      ring.animations = [scaleAnim];
      const animatable = scene.beginAnimation(ring, 0, totalFrames, false);
      runningAnimatables.push(animatable);
    });
  };

  // Getter for current expanded state
  const getIsExpanded = () => isExpanded;

  // Dispose function
  const dispose = () => {
    stopAnimations();
    scene.onBeforeRenderObservable.remove(rotationObserver);
    flame.dispose();
    emitterSphere.dispose();
    rings.forEach(ring => ring.dispose());
    root.dispose();
  };

  return {
    root,
    rings,
    flame,
    ringAnimations,
    config,
    expand,
    contract,
    getIsExpanded,
    stopAnimations,
    dispose
  };
}

// ===== SPATIAL LOADING RING =====
// Displays a spinning progress ring at anchor positions when models are still loading

interface LoadingRingConfig {
  scene: BABYLON.Scene;
  position: BABYLON.Vector3;
  radius?: number;
  thickness?: number;
}

interface LoadingRing {
  root: BABYLON.TransformNode;
  dispose: () => void;
  hide: (duration?: number) => void;
}

/**
 * Creates a spatial loading ring at the specified position.
 * The ring spins continuously with a gradient arc, indicating loading progress.
 */
function createLoadingRing(config: LoadingRingConfig): LoadingRing {
  const { scene, position, radius = 3, thickness = 0.08 } = config;

  // Create root transform node
  const root = new BABYLON.TransformNode("loadingRingRoot", scene);
  root.position.copyFrom(position);

  // Create the arc points (3/4 of a circle)
  const segments = 48;
  const arcAngle = Math.PI * 1.5; // 270 degrees arc
  const points: BABYLON.Vector3[] = [];
  const colors: BABYLON.Color4[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = t * arcAngle - Math.PI / 2; // Start from top
    points.push(new BABYLON.Vector3(
      Math.cos(angle) * radius,
      0,
      Math.sin(angle) * radius
    ));

    // Gradient from transparent to bright (tail to head effect)
    const alpha = Math.pow(t, 0.5) * 0.9; // Ease-in for smoother tail
    // Color gradient: purple -> cyan -> white at the head
    const r = 0.6 + t * 0.4;
    const g = 0.4 + t * 0.6;
    const b = 0.9 + t * 0.1;
    colors.push(new BABYLON.Color4(r, g, b, alpha));
  }

  // Create the main arc line
  const arc = BABYLON.MeshBuilder.CreateLines("loadingArc", {
    points,
    colors,
    useVertexAlpha: true
  }, scene);
  arc.parent = root;

  // Create a second, slightly larger arc for glow effect
  const glowPoints: BABYLON.Vector3[] = [];
  const glowColors: BABYLON.Color4[] = [];
  const glowRadius = radius * 1.02;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = t * arcAngle - Math.PI / 2;
    glowPoints.push(new BABYLON.Vector3(
      Math.cos(angle) * glowRadius,
      0,
      Math.sin(angle) * glowRadius
    ));
    // Softer glow with lower alpha
    const alpha = Math.pow(t, 0.7) * 0.3;
    glowColors.push(new BABYLON.Color4(0.7, 0.5, 1, alpha));
  }

  const glowArc = BABYLON.MeshBuilder.CreateLines("loadingGlowArc", {
    points: glowPoints,
    colors: glowColors,
    useVertexAlpha: true
  }, scene);
  glowArc.parent = root;

  // Create particle effect at the head of the arc (brightest point)
  const headEmitter = BABYLON.MeshBuilder.CreateSphere("loadingHeadEmitter", { diameter: 0.01 }, scene);
  headEmitter.parent = root;
  headEmitter.isVisible = false;
  headEmitter.position.set(0, 0, radius); // Start at top of arc

  const headParticles = new BABYLON.ParticleSystem("loadingHeadParticles", 30, scene);
  headParticles.particleTexture = new BABYLON.Texture("/assets/textures/floating_light.png", scene);
  headParticles.emitter = headEmitter;
  headParticles.minEmitPower = 0.01;
  headParticles.maxEmitPower = 0.02;
  headParticles.emitRate = 15;
  headParticles.minSize = 0.1;
  headParticles.maxSize = 0.25;
  headParticles.minLifeTime = 0.2;
  headParticles.maxLifeTime = 0.5;
  headParticles.color1 = new BABYLON.Color4(1, 1, 1, 0.6);
  headParticles.color2 = new BABYLON.Color4(0.7, 0.5, 1, 0.3);
  headParticles.colorDead = new BABYLON.Color4(0.5, 0.3, 0.8, 0);
  headParticles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
  headParticles.gravity = BABYLON.Vector3.Zero();

  const sphereEmitter = new BABYLON.SphereParticleEmitter(0.1);
  sphereEmitter.radiusRange = 1;
  headParticles.particleEmitterType = sphereEmitter;

  headParticles.start();

  // Animation: continuous rotation
  const rotationSpeed = 2.5; // Radians per second
  let currentAngle = 0;

  const rotationObserver = scene.onBeforeRenderObservable.add(() => {
    const deltaTime = scene.getEngine().getDeltaTime() / 1000;
    currentAngle += rotationSpeed * deltaTime;
    root.rotation.y = currentAngle;

    // Update head emitter position (at the end of the arc, which rotates with root)
    // The arc ends at 270 degrees from top, so head is at bottom-left
    const headAngle = arcAngle - Math.PI / 2;
    headEmitter.position.set(
      Math.cos(headAngle) * radius,
      0,
      Math.sin(headAngle) * radius
    );
  });

  // Face the camera (billboard-like, but only on XZ plane)
  const billboardObserver = scene.onBeforeRenderObservable.add(() => {
    const camera = scene.activeCamera;
    if (!camera) return;

    // Make the ring face the camera on the Y axis
    const cameraPos = camera.position;
    const ringPos = root.getAbsolutePosition();
    const direction = cameraPos.subtract(ringPos);
    direction.y = 0; // Keep level
    direction.normalize();

    // Calculate angle to face camera
    // We offset by the current rotation so the spinning continues while facing camera
    // Actually, for a spinner, we don't want to face camera - we want to spin freely
    // So let's just have it spin on a slight tilt for visibility
  });

  // Tilt the ring slightly towards camera for better visibility
  root.rotation.x = Math.PI / 6; // 30 degree tilt

  // Hide animation function
  const hide = (duration = 0.5) => {
    const fps = 60;
    const totalFrames = fps * duration;

    // Fade out by scaling down
    const scaleAnim = new BABYLON.Animation(
      "loadingRingHide",
      "scaling",
      fps,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    scaleAnim.setKeys([
      { frame: 0, value: root.scaling.clone() },
      { frame: totalFrames, value: new BABYLON.Vector3(0.01, 0.01, 0.01) }
    ]);

    const easing = new BABYLON.CubicEase();
    easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEIN);
    scaleAnim.setEasingFunction(easing);

    root.animations = [scaleAnim];
    scene.beginAnimation(root, 0, totalFrames, false, 1, () => {
      root.setEnabled(false);
      headParticles.stop();
    });
  };

  // Dispose function
  const dispose = () => {
    scene.onBeforeRenderObservable.remove(rotationObserver);
    scene.onBeforeRenderObservable.remove(billboardObserver);
    headParticles.dispose();
    headEmitter.dispose();
    arc.dispose();
    glowArc.dispose();
    root.dispose();
  };

  return {
    root,
    dispose,
    hide
  };
}

// Store original scales for models (set when models are loaded)
const modelOriginalScales: Map<BABYLON.TransformNode | BABYLON.AbstractMesh, BABYLON.Vector3> = new Map();

// Store original rotations for models (set when models are loaded, used for reset)
const modelOriginalRotations: Map<BABYLON.AbstractMesh, BABYLON.Quaternion> = new Map();

/**
 * Warms up the GPU for a model by rendering it at tiny scale for several frames.
 * This pre-compiles shaders, uploads vertex/index buffers, and uploads textures to GPU VRAM.
 * Without warmup, the first time a heavy model appears it causes a lag spike.
 * @param rootMesh The root mesh of the model
 * @param meshes All meshes of the model
 * @param scene The Babylon scene
 * @param warmupFrames Number of frames to render for warmup (default 10)
 * @returns Promise that resolves when warmup is complete
 */
async function warmupModelForGPU(
  rootMesh: BABYLON.AbstractMesh | null,
  meshes: BABYLON.AbstractMesh[],
  scene: BABYLON.Scene,
  warmupFrames = 10
): Promise<void> {
  if (!rootMesh || meshes.length === 0) return;

  // Store original visibility state
  const originalEnabled = meshes.map(m => m.isEnabled());
  const originalVisibility = meshes.map(m => m.visibility);
  const originalScale = rootMesh.scaling.clone();

  // Set to tiny scale and low visibility - still renders through pipeline but nearly invisible
  rootMesh.scaling.set(0.001, 0.001, 0.001);
  meshes.forEach(mesh => {
    mesh.setEnabled(true);
    mesh.visibility = 0.01; // Very low but not zero - ensures it goes through render pipeline
  });

  // Wait for several render frames to ensure GPU processes everything
  for (let i = 0; i < warmupFrames; i++) {
    await new Promise<void>(resolve => {
      scene.onAfterRenderObservable.addOnce(() => resolve());
    });
  }

  // Restore original scale
  rootMesh.scaling.copyFrom(originalScale);

  // Restore original visibility states (usually hidden)
  meshes.forEach((mesh, i) => {
    mesh.visibility = originalVisibility[i];
    mesh.setEnabled(originalEnabled[i]);
  });

}

/**
 * Shows or hides model using scale animation (scale up from near-zero or scale down to near-zero)
 * Handles interruptions: stops any running animation and starts from current scale.
 */
// Track running scale animations per model root for interruption handling
const modelScaleAnimations: Map<BABYLON.TransformNode | BABYLON.AbstractMesh, BABYLON.Animatable> = new Map();

function scaleModelMeshes(
  rootMesh: BABYLON.TransformNode | BABYLON.AbstractMesh | null,
  meshes: BABYLON.AbstractMesh[],
  scene: BABYLON.Scene,
  scaleIn: boolean,
  duration = 1,
  onComplete?: () => void
) {
  if (!rootMesh || meshes.length === 0) {
    if (onComplete) onComplete();
    return;
  }

  // Stop any running scale animation for this model (handles interruption)
  const existingAnim = modelScaleAnimations.get(rootMesh);
  if (existingAnim) {
    existingAnim.stop();
    modelScaleAnimations.delete(rootMesh);
  }

  const fps = 60;
  const totalFrames = fps * duration;
  const nearZeroScale = 0.001;

  // Get the original full scale (stored when model was loaded)
  const fullScale = modelOriginalScales.get(rootMesh) || new BABYLON.Vector3(1, 1, -1);

  // When scaling out, make sure we have the correct full scale stored
  if (!scaleIn && !modelOriginalScales.has(rootMesh)) {
    modelOriginalScales.set(rootMesh, rootMesh.scaling.clone());
  }

  // Calculate end scale
  const endScale = scaleIn
    ? fullScale.clone()
    : new BABYLON.Vector3(
      nearZeroScale * Math.sign(fullScale.x),
      nearZeroScale * Math.sign(fullScale.y),
      nearZeroScale * Math.sign(fullScale.z)
    );

  // If scaling in and meshes are disabled, enable them first and set to near-zero
  if (scaleIn) {
    const currentScaleMag = rootMesh.scaling.length();
    // If model is currently at near-zero or disabled, start from near-zero
    if (currentScaleMag < 0.01 || !meshes.some(m => m.isEnabled())) {
      rootMesh.scaling.set(
        nearZeroScale * Math.sign(fullScale.x),
        nearZeroScale * Math.sign(fullScale.y),
        nearZeroScale * Math.sign(fullScale.z)
      );
    }
    meshes.forEach(mesh => mesh.setEnabled(true));
  }

  // Start from CURRENT scale (handles mid-animation interruption gracefully)
  const startScale = rootMesh.scaling.clone();

  const scaleAnim = new BABYLON.Animation(
    scaleIn ? "scaleInModel" : "scaleOutModel",
    "scaling",
    fps,
    BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );

  scaleAnim.setKeys([
    { frame: 0, value: startScale },
    { frame: totalFrames, value: endScale }
  ]);

  const easing = new BABYLON.QuadraticEase();
  easing.setEasingMode(scaleIn
    ? BABYLON.EasingFunction.EASINGMODE_EASEOUT
    : BABYLON.EasingFunction.EASINGMODE_EASEIN);
  scaleAnim.setEasingFunction(easing);

  rootMesh.animations = [scaleAnim];

  const animatable = scene.beginAnimation(rootMesh, 0, totalFrames, false, 1, () => {
    // Clean up tracking
    modelScaleAnimations.delete(rootMesh);

    // If scaling out, disable meshes after animation
    if (!scaleIn) {
      meshes.forEach(mesh => mesh.setEnabled(false));
      // Reset scale to full for next time
      rootMesh.scaling.copyFrom(fullScale);
    }
    if (onComplete) onComplete();
  });

  // Track this animation for potential interruption
  modelScaleAnimations.set(rootMesh, animatable);
}

// Guided mode bezier animation options
interface AnimateShipAlongBezierOptions {
  target: BABYLON.TransformNode;
  scene: BABYLON.Scene;
  camera: BABYLON.ArcRotateCamera | null;
  canvas: HTMLCanvasElement | null;
  startPosition: BABYLON.Vector3;
  startForward: BABYLON.Vector3;
  endPosition: BABYLON.Vector3;
  endForward: BABYLON.Vector3;
  startRotation: BABYLON.Quaternion;
  endRotation: BABYLON.Quaternion;
  duration?: number; // seconds, default 4.0
  delay?: number; // delay before starting animation (seconds)
  stateRadius?: number; // camera radius for zoomed-out view during travel
  skipArrivalZoom?: boolean; // if true, don't zoom to 0 at arrival (for state_3/final)
  skipArrivalHide?: boolean; // if true, don't hide ship at arrival (for state_3/final)
  flameParticles?: BABYLON.ParticleSystem | null; // flame particles to tie to ship visibility
  onComplete?: () => void;
}

// Duration for guided mode ship animations
const GUIDED_SHIP_DURATION = 4.0;

// Track current bezier animation to prevent stale callbacks from affecting visibility
let currentBezierAnimationId = 0;

// Track ship velocity during bezier animations for smooth speed transitions
// When a new animation starts mid-travel, we use this to continue from current speed instead of 0
let shipLastPosition: BABYLON.Vector3 | null = null;
let shipCurrentVelocity: BABYLON.Vector3 = new BABYLON.Vector3(0, 0, 0);
let shipCurrentSpeed: number = 0; // Magnitude of velocity
let bezierVelocityObserver: BABYLON.Observer<BABYLON.Scene> | null = null;

// Observer for drag deceleration after cancelling bezier animation
let dragDecelerationObserver: BABYLON.Observer<BABYLON.Scene> | null = null;

// Observer for path completion zoom triggers (zoom out at start, zoom in at end)
let bezierPathObserver: BABYLON.Observer<BABYLON.Scene> | null = null;

/**
 * Cancels any running bezier animation by invalidating its ID and cleaning up observers.
 * Call this when switching to free mode to immediately stop the guided mode animation.
 * Applies a smooth drag deceleration so the ship coasts to a stop instead of stopping abruptly.
 * @param scene - The Babylon scene (needed to stop animations)
 * @param target - The ship transform node (optional, to stop its animations)
 * @param camera - The camera (optional, to stop camera animations)
 */
function cancelBezierAnimation(
  scene: BABYLON.Scene | null,
  target?: BABYLON.TransformNode | null,
  camera?: BABYLON.ArcRotateCamera | null
): void {

  // Increment animation ID to invalidate any running animation's callbacks
  currentBezierAnimationId++;

  // Clean up velocity observer
  if (bezierVelocityObserver && scene) {
    scene.onBeforeRenderObservable.remove(bezierVelocityObserver);
    bezierVelocityObserver = null;
  }

  // Clean up any existing drag deceleration observer
  if (dragDecelerationObserver && scene) {
    scene.onBeforeRenderObservable.remove(dragDecelerationObserver);
    dragDecelerationObserver = null;
  }

  // Clean up path observer (prevents zoom in/out triggers from continuing)
  if (bezierPathObserver && scene) {
    scene.onBeforeRenderObservable.remove(bezierPathObserver);
    bezierPathObserver = null;
  }

  // Capture current velocity before stopping for drag effect
  const capturedVelocity = shipCurrentVelocity.clone();
  const capturedSpeed = shipCurrentSpeed;

  // Reset velocity tracking
  shipCurrentSpeed = 0;
  shipLastPosition = null;

  // Stop keyframe animations on the ship (frees it from the bezier path)
  if (target && scene) {
    scene.stopAnimation(target);

    // Apply drag deceleration if the ship was moving
    if (capturedSpeed > 0.5) {
      // Create a velocity vector for the drag physics
      let dragVelocity = capturedVelocity.clone();
      const dragFriction = 4.0; // How quickly to slow down (higher = faster stop)
      const minSpeed = 0.1; // Speed threshold to stop the drag effect

      dragDecelerationObserver = scene.onBeforeRenderObservable.add(() => {
        if (!target || !scene) {
          if (dragDecelerationObserver) {
            scene?.onBeforeRenderObservable.remove(dragDecelerationObserver);
            dragDecelerationObserver = null;
          }
          return;
        }

        const deltaTime = scene.getEngine().getDeltaTime() / 1000;

        // Apply drag friction (exponential decay)
        const dragMultiplier = Math.exp(-dragFriction * deltaTime);
        dragVelocity.scaleInPlace(dragMultiplier);

        // Move the ship by the velocity
        const displacement = dragVelocity.scale(deltaTime);
        target.position.addInPlace(displacement);

        // Check if we've slowed down enough to stop
        const currentDragSpeed = dragVelocity.length();
        if (currentDragSpeed < minSpeed) {
          if (dragDecelerationObserver) {
            scene.onBeforeRenderObservable.remove(dragDecelerationObserver);
            dragDecelerationObserver = null;
          }
        }
      });
    }
  }

  // Stop animations on the camera (this stops the bezier's camera zoom animations)
  if (camera && scene) {
    scene.stopAnimation(camera);
  }
}

/**
 * Sets the visibility of the ship and flame particles together.
 * This ensures they are always in sync - either both visible or both hidden.
 * NEVER toggle ship visibility without using this function!
 */
interface SetShipAndFlamesVisibilityOptions {
  shipMeshes?: BABYLON.AbstractMesh[];
  container?: BABYLON.TransformNode | BABYLON.AbstractMesh;
  flameParticles: BABYLON.ParticleSystem | null | undefined;
  visible: boolean;
  method?: 'visibility' | 'enabled';
  logContext?: string;
}

function setShipAndFlamesVisibility(options: SetShipAndFlamesVisibilityOptions): void {
  const { shipMeshes, container, flameParticles, visible, method = 'visibility', logContext = '' } = options;
  const ctx = logContext ? `[${logContext}] ` : '';

  // Handle ship visibility
  if (method === 'visibility' && shipMeshes) {
    shipMeshes.forEach(mesh => mesh.visibility = visible ? 1 : 0);
  } else if (method === 'enabled' && container) {
    container.setEnabled(visible);
    // Force world matrix update so flame emitter position is correct immediately
    if (visible && 'computeWorldMatrix' in container) {
      (container as BABYLON.TransformNode).computeWorldMatrix(true);
    }
  }

  // Handle flame particles - ALWAYS in sync with ship
  if (visible) {
    if (flameParticles) {
      const wasAlreadyStarted = flameParticles.isStarted();
      // Always call start() when making visible - it's safe to call even if already started
      flameParticles.start();
    } else {
    }
  } else {
    if (flameParticles && flameParticles.isStarted()) {
      flameParticles.stop();
    }
  }
}

/**
 * Animates the ship along a cubic bezier curve from current position/rotation to target.
 * The bezier curve is calculated at runtime based on start/end positions and forward directions.
 * Control points are placed along the forward directions to create a smooth flight path.
 */
function animateShipAlongBezier(options: AnimateShipAlongBezierOptions): void {
  // Increment animation ID - any previous animation's callbacks will now be stale
  currentBezierAnimationId++;
  const thisAnimationId = currentBezierAnimationId;

  // Clean up any existing drag deceleration observer from a previous cancellation
  // This prevents conflicts when switching back to guided mode
  if (dragDecelerationObserver && options.scene) {
    options.scene.onBeforeRenderObservable.remove(dragDecelerationObserver);
    dragDecelerationObserver = null;
  }

  // Clean up any existing path observer from a previous animation
  if (bezierPathObserver && options.scene) {
    options.scene.onBeforeRenderObservable.remove(bezierPathObserver);
    bezierPathObserver = null;
  }

  const {
    target,
    scene,
    camera,
    startPosition,
    startForward,
    endPosition,
    endForward,
    startRotation,
    endRotation,
    duration = GUIDED_SHIP_DURATION,
    delay = 0,
    flameParticles,
    onComplete
  } = options;

  // Function to execute the animation (may be delayed)
  const executeAnimation = () => {
    // Check if animation was superseded during delay
    if (thisAnimationId !== currentBezierAnimationId) {
      return;
    }

    // Make ship and flames visible before departing
    setShipAndFlamesVisibility({
      shipMeshes: target.getChildMeshes(),
      flameParticles,
      visible: true,
      method: 'visibility',
      logContext: 'Bezier Animation'
    });

    // Calculate the distance between start and end for control point scaling
    let effectiveStartPosition = startPosition.clone();
    let distance = BABYLON.Vector3.Distance(startPosition, endPosition);

    // If start and end positions are the same (or very close), the bezier curve would degenerate
    // and cause erratic ship movement. Offset the start position slightly backward along the
    // ship's forward direction to create a valid curve.
    const MIN_DISTANCE_THRESHOLD = 0.1;
    if (distance < MIN_DISTANCE_THRESHOLD) {
      const offsetDistance = 0.05; // Very small offset behind the ship
      effectiveStartPosition = startPosition.add(startForward.scale(offsetDistance));
      distance = BABYLON.Vector3.Distance(effectiveStartPosition, endPosition);
    }

    // Control point distance is proportional to the total distance
    // Using 1/3 of the distance creates a nice smooth curve
    const controlPointDistance = distance * .25;

    // Create cubic bezier control points:
    // P0 = start position (possibly offset if too close to end)
    // P1 = start position - startForward * controlPointDistance (ship continues in its facing direction)
    // P2 = end position + endForward * controlPointDistance (approaches target aligned with its facing direction)
    // P3 = end position

    const p0 = effectiveStartPosition.clone();
    const p1 = effectiveStartPosition.subtract(startForward.scale(controlPointDistance));
    const p2 = endPosition.add(endForward.scale(controlPointDistance));
    const p3 = endPosition.clone();

    // Create a Babylon Curve3 from the bezier points
    const bezierCurve = BABYLON.Curve3.CreateCubicBezier(p0, p1, p2, p3, 200);
    const curvePoints = bezierCurve.getPoints();

    // Animation parameters
    const fps = 60;
    const totalFrames = fps * duration;
    const numKeyframes = 120; // Number of keyframes for smooth animation

    // Calculate the expected "peak speed" along this path
    // For a cubic bezier with ease-in-out, the peak speed happens around the middle
    // We estimate this by calculating the path length divided by duration, scaled by ~2 for ease-in-out peak
    const pathLength = bezierCurve.length();
    const averageSpeed = pathLength / duration;
    const peakSpeed = averageSpeed * 2.0; // At the middle of ease-in-out, speed is roughly 2x average

    // Calculate initial speed ratio (0-1) based on current ship velocity
    // This tells us how "fast" we're already going compared to the new path's peak speed
    let initialSpeedRatio = 0;
    if (shipCurrentSpeed > 0.1 && peakSpeed > 0) {
      // Clamp to 0-1 range (we can't start faster than peak speed)
      initialSpeedRatio = Math.min(shipCurrentSpeed / peakSpeed, 1.0);
    }

    // Stop any previous velocity observer
    if (bezierVelocityObserver) {
      scene.onBeforeRenderObservable.remove(bezierVelocityObserver);
      bezierVelocityObserver = null;
    }

    // Set up velocity tracking for this animation
    shipLastPosition = target.position.clone();
    bezierVelocityObserver = scene.onBeforeRenderObservable.add(() => {
      if (thisAnimationId !== currentBezierAnimationId) {
        // This animation was superseded, clean up observer
        if (bezierVelocityObserver) {
          scene.onBeforeRenderObservable.remove(bezierVelocityObserver);
          bezierVelocityObserver = null;
        }
        return;
      }

      const currentPos = target.position.clone();
      if (shipLastPosition) {
        const deltaTime = scene.getEngine().getDeltaTime() / 1000;
        if (deltaTime > 0) {
          shipCurrentVelocity = currentPos.subtract(shipLastPosition).scale(1 / deltaTime);
          shipCurrentSpeed = shipCurrentVelocity.length();
        }
      }
      shipLastPosition = currentPos;
    });

    // Asymmetric ease: moderate start (or continue from current speed), very smooth arrival
    // When initialSpeedRatio > 0, we blend the ease-in with a linear continuation
    const smoothEase = (t: number): number => {
      if (t < 0.5) {
        // Blend between linear (maintaining speed) and quadratic ease-in (acceleration)
        // At initialSpeedRatio = 0: pure quadratic (slow start)
        // At initialSpeedRatio = 1: pure linear (maintain speed)
        const quadratic = 2 * t * t;
        const linear = t;
        // Use a smooth blend: start more linear, then transition to quadratic behavior
        // The blend factor decreases as t increases, so we smoothly transition to the normal ease
        const blendFactor = initialSpeedRatio * Math.max(0, 1 - t * 2);
        return quadratic + blendFactor * (linear - quadratic);
      } else {
        // Quintic ease-out: very smooth arrival (unchanged)
        return 1 - Math.pow(-2 * t + 2, 2) / 2;
      }
    };

    // Helper to interpolate position on the bezier curve at any parameter value
    const sampleCurveAt = (param: number): BABYLON.Vector3 => {
      const index = param * (curvePoints.length - 1);
      const lowIndex = Math.floor(index);
      const highIndex = Math.min(lowIndex + 1, curvePoints.length - 1);
      const blend = index - lowIndex;
      return BABYLON.Vector3.Lerp(curvePoints[lowIndex], curvePoints[highIndex], blend);
    };

    // Helper to get tangent at any parameter value
    const getTangentAt = (param: number): BABYLON.Vector3 => {
      const epsilon = 0.001;
      const p1 = sampleCurveAt(Math.max(0, param - epsilon));
      const p2 = sampleCurveAt(Math.min(1, param + epsilon));
      return p2.subtract(p1).normalize();
    };

    // Create position animation that follows the bezier curve
    const positionAnimation = new BABYLON.Animation(
      "shipBezierPosition",
      "position",
      fps,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    // Create keyframes with LINEAR frame timing but EASED curve sampling
    // This means: at 10% of animation time, we're at 3% of the curve (slow start)
    //             at 90% of animation time, we're at 97% of the curve (slow end)
    const positionKeys: { frame: number; value: BABYLON.Vector3 }[] = [];
    for (let i = 0; i <= numKeyframes; i++) {
      const t = i / numKeyframes; // Linear time progress (0 to 1)
      const frame = t * totalFrames; // Linear frame timing
      const curveParam = smoothEase(t); // Eased position along curve
      const position = sampleCurveAt(curveParam);
      positionKeys.push({ frame, value: position });
    }
    positionAnimation.setKeys(positionKeys);

    // Create rotation animation using spherical linear interpolation (SLERP)
    const rotationAnimation = new BABYLON.Animation(
      "shipBezierRotation",
      "rotationQuaternion",
      fps,
      BABYLON.Animation.ANIMATIONTYPE_QUATERNION,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    // Create keyframes for rotation with same eased curve sampling
    const rotationKeys: { frame: number; value: BABYLON.Quaternion }[] = [];

    for (let i = 0; i <= numKeyframes; i++) {
      const t = i / numKeyframes; // Linear time progress
      const frame = t * totalFrames; // Linear frame timing
      const curveParam = smoothEase(t); // Eased position along curve

      // Get tangent at this curve position for flight direction
      const tangent = curveParam >= 0.999 ? endForward.clone() : getTangentAt(curveParam);

      // Create a rotation that faces along the tangent
      const up = new BABYLON.Vector3(0, 1, 0);
      const right = BABYLON.Vector3.Cross(up, tangent).normalize();
      const correctedUp = BABYLON.Vector3.Cross(tangent, right).normalize();

      // Build rotation from tangent direction
      const tangentRotation = BABYLON.Quaternion.FromLookDirectionLH(tangent, correctedUp);

      // Blend between tangent-following and target rotation
      const blendFactor = Math.pow(curveParam, 1.5);
      const interpolatedRotation = BABYLON.Quaternion.Slerp(tangentRotation, endRotation, blendFactor);

      rotationKeys.push({ frame, value: interpolatedRotation });
    }
    rotationAnimation.setKeys(rotationKeys);

    // Easing for camera (defined here for use in camera animation below)
    const easing = new BABYLON.CubicEase();
    easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);

    // Ensure target has a rotation quaternion
    if (!target.rotationQuaternion) {
      target.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(
        target.rotation.x,
        target.rotation.y,
        target.rotation.z
      );
    }

    // Apply ship animations
    target.animations = [positionAnimation, rotationAnimation];

    // Start ship animation
    scene.beginAnimation(target, 0, totalFrames, false, 1, () => {

      // Clean up velocity observer and reset speed tracking when animation completes normally
      if (bezierVelocityObserver && thisAnimationId === currentBezierAnimationId) {
        scene.onBeforeRenderObservable.remove(bezierVelocityObserver);
        bezierVelocityObserver = null;
        shipCurrentSpeed = 0;
        shipLastPosition = null;
      }

      // Only hide ship if:
      // 1. This animation is still current (not superseded)
      // 2. skipArrivalHide is not set
      // 3. Navigation mode is still 'guided' (user didn't switch to free during animation)
      const currentNavMode = typeof useUI !== 'undefined' ? useUI.getState().navigationMode : 'guided';
      const shouldHide = thisAnimationId === currentBezierAnimationId &&
        !options.skipArrivalHide &&
        currentNavMode === 'guided';

      if (shouldHide) {
        // Hide ship and stop flames together
        setShipAndFlamesVisibility({
          shipMeshes: target.getChildMeshes(),
          flameParticles,
          visible: false,
          method: 'visibility',
          logContext: 'Bezier Animation'
        });
      }
      if (onComplete) onComplete();
    });

    // Animate camera alpha/beta to smoothly transition viewing angle
    if (camera) {
      const startAlpha = camera.alpha;
      const startBeta = camera.beta;

      // Extract camera angles from endRotation quaternion for proper alignment with all anchor rotations
      // This avoids issues with high X rotations by working directly with the quaternion
      const shipForward = new BABYLON.Vector3(0, 0, 1);
      const shipUp = new BABYLON.Vector3(0, 1, 0);
      shipForward.rotateByQuaternionToRef(endRotation, shipForward);
      shipUp.rotateByQuaternionToRef(endRotation, shipUp);

      // Calculate target alpha based on ship's forward direction (horizontal component)
      // Camera should be positioned "behind" the ship relative to its forward direction
      const endAlpha = Math.atan2(-shipForward.x, -shipForward.z) - Math.PI / 2;

      // Calculate target beta from ship's pitch (how much it's looking up/down)
      // pitchAngle: positive = ship nose up, negative = ship nose down
      const pitchAngle = Math.asin(Math.max(-1, Math.min(1, shipForward.y)));
      // Base beta is PI/2 (horizontal), adjust based on ship's pitch
      // When ship pitches down (negative pitch), camera should be more from above (lower beta)
      // When ship pitches up (positive pitch), camera should be more from below (higher beta)
      const baseBeta = Math.PI / 2; // Slightly above horizontal as default
      const endBeta = Math.max(0.3, Math.min(Math.PI - 0.3, baseBeta - pitchAngle));

      // Normalize alpha difference for shortest rotation path
      let alphaDiff = endAlpha - startAlpha;
      while (alphaDiff > Math.PI) alphaDiff -= 2 * Math.PI;
      while (alphaDiff < -Math.PI) alphaDiff += 2 * Math.PI;
      const normalizedEndAlpha = startAlpha + alphaDiff;

      // Create camera alpha animation
      const alphaAnimation = new BABYLON.Animation(
        "cameraAlpha",
        "alpha",
        fps,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      );
      alphaAnimation.setKeys([
        { frame: 0, value: startAlpha },
        { frame: totalFrames, value: normalizedEndAlpha }
      ]);
      alphaAnimation.setEasingFunction(easing);

      // Create camera beta animation
      const betaAnimation = new BABYLON.Animation(
        "cameraBeta",
        "beta",
        fps,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      );
      betaAnimation.setKeys([
        { frame: 0, value: startBeta },
        { frame: totalFrames, value: endBeta }
      ]);
      betaAnimation.setEasingFunction(easing);

      // Apply and start camera animations
      camera.animations = [alphaAnimation, betaAnimation];
      scene.beginAnimation(camera, 0, totalFrames, false, 1, () => {
      });

      // Camera radius animation - TIME-BASED triggers for reliable behavior
      // Zoom out immediately at start, zoom in near the end
      const stateRadius = options.stateRadius; // Zoom-out radius from state config
      const arrivalRadius = 0; // Close-up radius for arrival
      const radiusAnimDuration = duration * 0.25; // Duration of each zoom animation
      const radiusFps = 60;

      // ===== ZOOM OUT: Trigger immediately when animation starts =====
      {
        const currentRadius = camera.radius;
        const targetRadius = stateRadius ?? 24;

        // Allow the transition
        camera.lowerRadiusLimit = 0;
        camera.upperRadiusLimit = targetRadius;

        // Animate radius
        const zoomOutAnim = new BABYLON.Animation(
          "bezierZoomOut",
          "radius",
          radiusFps,
          BABYLON.Animation.ANIMATIONTYPE_FLOAT,
          BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        const zoomOutEasing = new BABYLON.CubicEase();
        zoomOutEasing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
        zoomOutAnim.setEasingFunction(zoomOutEasing);
        zoomOutAnim.setKeys([
          { frame: 0, value: currentRadius },
          { frame: radiusFps * radiusAnimDuration, value: targetRadius }
        ]);

        // Animate lowerRadiusLimit to lock zoom during travel
        const lowerLimitAnim = new BABYLON.Animation(
          "bezierLowerLimit",
          "lowerRadiusLimit",
          radiusFps,
          BABYLON.Animation.ANIMATIONTYPE_FLOAT,
          BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        lowerLimitAnim.setEasingFunction(zoomOutEasing);
        lowerLimitAnim.setKeys([
          { frame: 0, value: currentRadius },
          { frame: radiusFps * radiusAnimDuration, value: targetRadius }
        ]);

        // Animate upperRadiusLimit to lock zoom during travel
        const upperLimitAnim = new BABYLON.Animation(
          "bezierUpperLimit",
          "upperRadiusLimit",
          radiusFps,
          BABYLON.Animation.ANIMATIONTYPE_FLOAT,
          BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        upperLimitAnim.setEasingFunction(zoomOutEasing);
        upperLimitAnim.setKeys([
          { frame: 0, value: currentRadius },
          { frame: radiusFps * radiusAnimDuration, value: targetRadius }
        ]);

        scene.beginDirectAnimation(camera, [zoomOutAnim, lowerLimitAnim, upperLimitAnim], 0, radiusFps * radiusAnimDuration, false, 1, () => {
        });
      }

      // ===== ZOOM IN: Trigger near the end of the animation (time-based) =====
      if (!options.skipArrivalZoom) {
        // Calculate delay: total duration minus zoom animation duration
        // This ensures zoom-in starts so it completes roughly when ship arrives
        const zoomInDelay = Math.max(0, (duration - radiusAnimDuration) * 1000);

        setTimeout(() => {
          // Check if this animation is still valid (not superseded)
          if (thisAnimationId !== currentBezierAnimationId) {
            return;
          }

          const currentRadius = camera.radius;
          const currentLowerLimit = camera.lowerRadiusLimit ?? currentRadius;
          const currentUpperLimit = camera.upperRadiusLimit ?? currentRadius;

          // Allow zooming all the way in
          camera.lowerRadiusLimit = 0;
          camera.upperRadiusLimit = currentRadius; // Will be animated down

          // Animate radius
          const zoomInAnim = new BABYLON.Animation(
            "bezierZoomIn",
            "radius",
            radiusFps,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
          );
          const zoomInEasing = new BABYLON.CubicEase();
          zoomInEasing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
          zoomInAnim.setEasingFunction(zoomInEasing);
          zoomInAnim.setKeys([
            { frame: 0, value: currentRadius },
            { frame: radiusFps * radiusAnimDuration, value: arrivalRadius }
          ]);

          // Animate lowerRadiusLimit to lock zoom during arrival
          const lowerLimitAnim = new BABYLON.Animation(
            "bezierLowerLimitIn",
            "lowerRadiusLimit",
            radiusFps,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
          );
          lowerLimitAnim.setEasingFunction(zoomInEasing);
          lowerLimitAnim.setKeys([
            { frame: 0, value: currentLowerLimit },
            { frame: radiusFps * radiusAnimDuration, value: arrivalRadius }
          ]);

          // Animate upperRadiusLimit to lock zoom during arrival
          const upperLimitAnim = new BABYLON.Animation(
            "bezierUpperLimitIn",
            "upperRadiusLimit",
            radiusFps,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
          );
          upperLimitAnim.setEasingFunction(zoomInEasing);
          upperLimitAnim.setKeys([
            { frame: 0, value: currentUpperLimit },
            { frame: radiusFps * radiusAnimDuration, value: arrivalRadius }
          ]);

          scene.beginDirectAnimation(camera, [zoomInAnim, lowerLimitAnim, upperLimitAnim], 0, radiusFps * radiusAnimDuration, false, 1, () => {
          });
        }, zoomInDelay);
      }
    }
  }; // End of executeAnimation function

  // Apply delay if specified, otherwise execute immediately
  if (delay > 0) {
    setTimeout(executeAnimation, delay * 1000);
  } else {
    executeAnimation();
  }
}

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

  // Spaceship control state refs
  const shipControlsRef = useRef({
    keys: {} as Record<string, boolean>,
    speed: 6,
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
  const currentColorRef = useRef<string>("green");
  const currentTrimRef = useRef<string>("lightBlue");
  const interiorCameraRef = useRef<BABYLON.ArcRotateCamera | null>(null);
  const isInteriorView = useUI((st) => st.isInteriorView);
  const selectedDioramaModel = useUI((st) => st.selectedDioramaModel);

  // Musecraft refs (anchor_2, state 5)
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


  // Petwheels refs (anchor_4, state 7)
  const petwheelsRootRef = useRef<BABYLON.AbstractMesh | null>(null);
  const petwheelsMeshesRef = useRef<BABYLON.AbstractMesh[]>([]);
  const petwheelsAnchorRef = useRef<BABYLON.AbstractMesh | null>(null);
  const petwheelsAnimationGroupsRef = useRef<BABYLON.AnimationGroup[]>([]);

  // Atom indicators for each model anchor
  const atomIndicatorsRef = useRef<{
    atom1: AtomIndicator | null; // For GEELY car (anchor_1)
    atom2: AtomIndicator | null; // For Musecraft (anchor_2)
    atom3: AtomIndicator | null; // For Dioramas (anchor_3)
    atom4: AtomIndicator | null; // For Petwheels (anchor_4)
  }>({
    atom1: null,
    atom2: null,
    atom3: null,
    atom4: null
  });

  // Model visibility state (to track which models are currently shown/hidden)
  const modelVisibilityRef = useRef<{
    model1: boolean; // GEELY
    model2: boolean; // Musecraft
    model3: boolean; // Dioramas
    model4: boolean; // Petwheels
  }>({
    model1: false,
    model2: false,
    model3: false,
    model4: false
  });

  // Loading rings for each anchor (shown when ship arrives but model isn't loaded yet)
  const loadingRingsRef = useRef<{
    ring1: LoadingRing | null; // For GEELY car (anchor_1)
    ring2: LoadingRing | null; // For Musecraft (anchor_2)
    ring3: LoadingRing | null; // For Dioramas (anchor_3)
    ring4: LoadingRing | null; // For Petwheels (anchor_4)
  }>({
    ring1: null,
    ring2: null,
    ring3: null,
    ring4: null
  });

  // Track whether each model has finished loading (different from visibility)
  const modelLoadedRef = useRef<{
    model1: boolean; // GEELY
    model2: boolean; // Musecraft
    model3: boolean; // Dioramas
    model4: boolean; // Petwheels
  }>({
    model1: false,
    model2: false,
    model3: false,
    model4: false
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
    zoomedInPercent: 0.3,
    // Animation duration in seconds
    animationDuration: 0.5,
    // Track if animation is in progress to prevent rapid toggling
    isAnimating: false
  });

  // Guided mode anchor data refs (position + rotation)
  // Anchors are stored as { desktop1, desktop2, desktop3, desktop4, mobile1, mobile2, mobile3, mobile4 }
  const anchorDataRef = useRef<Record<string, AnchorData>>({});



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

    camera.minZ = 0.1;    // how close things can be before clipping
    camera.maxZ = 15000;   // how far things can be seen

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

              // Create particle system for curve effect
              const curveParticles = new BABYLON.ParticleSystem("curveParticles", 1000, scene);
              curveParticles.particleTexture = new BABYLON.Texture("/assets/textures/floating_light.png", scene);

              // Use a dummy emitter (won't be used since we have custom start position)
              const dummyEmitter = BABYLON.Mesh.CreateBox("curveEmitter", 0.01, scene);
              dummyEmitter.visibility = 0;
              dummyEmitter.position.set(0, 0, 0);
              curveParticles.emitter = dummyEmitter;

              // Custom spawn function to place particles at random vertices with offset
              curveParticles.startPositionFunction = (worldMatrix, position, particle) => {
                // Pick a random vertex
                const randomVertex = vertices[Math.floor(Math.random() * vertices.length)];

                // Add random offset for variation
                const offsetRange = 3.0; // Adjust this to control spread around vertices
                position.x = randomVertex.x + (Math.random() - 0.15) * offsetRange;
                position.y = randomVertex.y + (Math.random() - 0.15) * offsetRange;
                position.z = randomVertex.z + (Math.random() - 0.15) * offsetRange;
              };
              if (isMobileRef.current) {
                // Particle size - visible but not huge
                curveParticles.minSize = .15;
                curveParticles.maxSize = .75;
                curveParticles.emitRate = 200;
              } else {
                // Particle size - visible but not huge
                curveParticles.minSize = .6;
                curveParticles.maxSize = 1.8;
                curveParticles.emitRate = 600;
              }
              // Rotation randomness
              curveParticles.minInitialRotation = 0;
              curveParticles.maxInitialRotation = Math.PI * 2;

              curveParticles.minLifeTime = 2.5;
              curveParticles.maxLifeTime = 4.5;
              curveParticles.updateSpeed = 0.02;

              // Very slow gentle movement
              curveParticles.minEmitPower = 0.003;
              curveParticles.maxEmitPower = 0.015;

              curveParticles.addColorGradient(0.0, new BABYLON.Color4(0.8, 0.8, 1, 0));
              curveParticles.addColorGradient(0.1, new BABYLON.Color4(.6, 0.6, 0.9, 0.3));
              curveParticles.addColorGradient(0.5, new BABYLON.Color4(.8, 0.6, 0.8, 0.3));
              curveParticles.addColorGradient(0.8, new BABYLON.Color4(.9, 0.5, 0.4, 0.15));
              curveParticles.addColorGradient(1.0, new BABYLON.Color4(1, 0.7, 0.7, 0));

              curveParticles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
              curveParticles.gravity = new BABYLON.Vector3(0, .3, 0);

              // Don't start automatically - will be controlled by state config
              curveParticleSystemRef.current = curveParticles;
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
        // Extract positions and rotations from anchor meshes (desktop1-4, mobile1-4)
        const anchorNames = ['desktop1', 'desktop2', 'desktop3', 'desktop4', 'mobile1', 'mobile2', 'mobile3', 'mobile4'];
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

          // Setup materials for transparency
          meshes.forEach(mesh => {
            if (mesh.material) {
              mesh.material.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;
              mesh.material.needDepthPrePass = true;
              mesh.material.backFaceCulling = false;
            }
          });

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

            // ===== FIRST FLAME (original position) =====
            const flame = new BABYLON.ParticleSystem("engineFlamePS", 600, scene);
            flame.particleTexture = new BABYLON.Texture("/assets/textures/muzzle_06.png", scene);
            flame.emitter = emitter as any; // TransformNode is valid emitter
            flame.updateSpeed = .04;
            flame.minEmitPower = 0.02;
            flame.maxEmitPower = 0.05;
            flame.emitRate = 1000; // Start disabled, enable in free mode

            // Point spawn at nozzle (no direction - uses emitter transform + emitPower)
            flame.particleEmitterType = new BABYLON.PointParticleEmitter();

            // Size randomness
            flame.minSize = 0.2;
            flame.maxSize = 0.5;

            // Rotation randomness
            flame.minInitialRotation = Math.PI * 1;
            flame.maxInitialRotation = Math.PI * 3;

            // Lifetime
            flame.minLifeTime = 0.1;
            flame.maxLifeTime = 0.2;

            // Color & blend
            flame.gravity = new BABYLON.Vector3(0, 0, 0);
            flame.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
            flame.color1 = new BABYLON.Color4(1, 0.6, 0.3, 0.5);
            flame.color2 = new BABYLON.Color4(1, 0.2, 0.6, 0.2);
            flame.colorDead = new BABYLON.Color4(0, 0, 0.5, 0.2);

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

    // Create particle systems (stars and smoke)
    // Stars Particle System
    const starsEmitter = BABYLON.Mesh.CreateBox("starsEmitter", 0.01, scene);
    starsEmitter.visibility = 0;
    starsEmitter.position.set(0, 0, 0);
    starsEmitterRef.current = starsEmitter;

    const stars = new BABYLON.ParticleSystem("starsParticles", 3000, scene);
    stars.particleTexture = new BABYLON.Texture("/assets/textures/star_07.png", scene);
    stars.emitter = starsEmitter;

    // Custom spawn function for stars with forbidden radius that follows shipRoot
    const forbiddenRadius = 3000;
    const totalRadius = 3500;
    const forbiddenRadiusSq = forbiddenRadius * forbiddenRadius;

    // Debug counter for logging
    let starSpawnCounter = 0;

    // This function will be called every time a particle spawns
    // It needs to access the ship's CURRENT position at spawn time
    stars.startPositionFunction = (worldMatrix, position, particle) => {
      // Access shipRoot directly through the ref - gets current position at spawn time
      const shipRoot = spaceshipRootRef.current;
      if (!shipRoot) {
        // If ship not loaded yet, spawn at origin
        position.x = 0;
        position.y = 0;
        position.z = 0;
        return;
      }

      // Get live reference to ship position (same Vector3 object, updates as ship moves)
      const shipPos = shipRoot.position;

      starSpawnCounter++;

      let x, y, z;
      let relX, relY, relZ;

      // Rejection sampling - keep generating until outside forbidden radius around ship
      do {
        // Generate relative coordinates (before ship offset)
        relX = BABYLON.Scalar.RandomRange(-totalRadius, totalRadius);
        relY = BABYLON.Scalar.RandomRange(-totalRadius, totalRadius);
        relZ = BABYLON.Scalar.RandomRange(-totalRadius, totalRadius);
      } while (
        // Check distance in relative space (before ship offset applied)
        relX * relX + relY * relY + relZ * relZ < forbiddenRadiusSq
      );

      // Apply ship offset with X inverted, Y and Z normal
      x = relX - shipRoot.position.x;
      y = relY + shipRoot.position.y;
      z = relZ + shipRoot.position.z;

      // Set absolute world position
      position.x = starsEmitter.position.x + x;
      position.y = starsEmitter.position.y + y;
      position.z = starsEmitter.position.z + z;

    };


    // Color gradients for stars
    stars.addColorGradient(0.0, new BABYLON.Color4(0.8, 0.8, 1, 0));
    stars.addColorGradient(0.05, new BABYLON.Color4(0.8, 0.8, 1, 1));
    stars.addColorGradient(0.4, new BABYLON.Color4(0.9, 0.9, 0.7, 0.8));
    stars.addColorGradient(0.7, new BABYLON.Color4(1, 0.9, 0.7, 0.8));
    stars.addColorGradient(1.0, new BABYLON.Color4(1, 0.7, 0.7, 0));

    stars.minSize = 20;
    stars.maxSize = 50;
    stars.minLifeTime = 3;
    stars.maxLifeTime = 10;
    stars.emitRate = 0; // Start disabled

    stars.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
    stars.gravity = new BABYLON.Vector3(0, 0, 0);
    stars.direction1 = new BABYLON.Vector3(0, 0, 0);
    stars.direction2 = new BABYLON.Vector3(0, 0, 0);
    stars.minAngularSpeed = -0.5;
    stars.maxAngularSpeed = 0.5;
    stars.minEmitPower = 0.5;
    stars.maxEmitPower = 1.5;
    stars.updateSpeed = 0.01;

    stars.start();
    starsParticleSystemRef.current = stars;

    // Smoke Particle System
    const smokeEmitter = BABYLON.Mesh.CreateBox("smokeEmitter", 0.01, scene);
    smokeEmitter.visibility = 0;
    smokeEmitter.position.set(0, 0, 25);
    smokeEmitterRef.current = smokeEmitter;

    const smoke = new BABYLON.ParticleSystem("smokeParticles", 60, scene);
    smoke.particleTexture = new BABYLON.Texture("/assets/textures/smoke_15.png", scene);
    smoke.emitter = smokeEmitter;

    smoke.minEmitBox = new BABYLON.Vector3(-30, -5, 30);
    smoke.maxEmitBox = new BABYLON.Vector3(30, 2, -30);

    // Color gradients for smoke
    smoke.addColorGradient(0.0, new BABYLON.Color4(0.40, 0.40, 0.88, 0));
    smoke.addColorGradient(0.2, new BABYLON.Color4(0.35, 0.40, 0.88, 0.1));
    smoke.addColorGradient(0.8, new BABYLON.Color4(0.4, 0.25, 0.5, 0.08));
    smoke.addColorGradient(1.0, new BABYLON.Color4(0.3, 0.15, 0.4, 0));

    smoke.minSize = 9;
    smoke.maxSize = 18;
    smoke.minLifeTime = 4;
    smoke.maxLifeTime = 10;
    smoke.emitRate = 0; // Start disabled

    smoke.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
    smoke.gravity = new BABYLON.Vector3(0, 0, 0);
    smoke.direction1 = new BABYLON.Vector3(0, 0, 0);
    smoke.direction2 = new BABYLON.Vector3(0, 0, 0);
    smoke.minAngularSpeed = -0.5;
    smoke.maxAngularSpeed = 0.5;
    smoke.minEmitPower = 0.5;
    smoke.maxEmitPower = 1.5;
    smoke.updateSpeed = 0.01;

    if (isMobileRef.current) {
      smoke.stop();
    } else {
      smoke.start();
    }
    smokeParticleSystemRef.current = smoke;

    // ========================
    // Portal System
    // ========================

    // Portal Warp Post-Process Effect
    BABYLON.Effect.ShadersStore["portalWarpFragmentShader"] = `
        precision highp float;
        varying vec2 vUV;
        uniform sampler2D textureSampler;
        uniform float intensity;
        
        void main(void) {
            vec2 center = vec2(0.5, 0.5);
            vec2 toCenter = vUV - center;
            float dist = length(toCenter);
            
            float warpStrength = intensity * 0.1 * (1.0 - dist);
            vec2 offset = normalize(toCenter) * sin(dist * 20.0) * warpStrength;
            
            vec2 uv = vUV + offset;
            vec4 color = texture2D(textureSampler, uv);
            
            vec2 texel = vec2(1.0) / vec2(1920.0, 1080.0);
            vec4 blur = (
                texture2D(textureSampler, uv + vec2(texel.x, 0.0)) +
                texture2D(textureSampler, uv - vec2(texel.x, 0.0)) +
                texture2D(textureSampler, uv + vec2(0.0, texel.y)) +
                texture2D(textureSampler, uv - vec2(0.0, texel.y))
            ) * 0.25;

            gl_FragColor = mix(color, blur, 0.3);
        }
    `;

    const warpEffect = new BABYLON.PostProcess(
      "portalWarp",
      "portalWarp",
      ["intensity"],
      null,
      1.0,
      camera
    );
    warpEffect.onApply = function (effect) {
      effect.setFloat("intensity", (warpEffect as any)._intensity || 0);
    };
    (warpEffect as any)._intensity = 0;
    camera.detachPostProcess(warpEffect);
    warpEffectRef.current = warpEffect;

    // Portal Shader
    BABYLON.Effect.ShadersStore["portalVertexShader"] = `
        precision highp float;
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 worldViewProjection;
        varying vec2 vUV;
        void main(void) {
            vUV = uv;
            gl_Position = worldViewProjection * vec4(position, 1.0);
        }
    `;

    BABYLON.Effect.ShadersStore["portalFragmentShader"] = `
        precision highp float;
        varying vec2 vUV;
        uniform sampler2D textureSampler;
        uniform float time;
        uniform vec2 uvOffset;
        uniform float globalAlpha;

        void main(void) {
            vec2 center = vec2(0.5);
            vec2 toCenter = vUV - center;
            float dist = length(toCenter);

            vec2 uv = vUV;
            uv.x = vUV.x * 0.5 - uvOffset.x;

            float rippleFade = 1.0 - pow((dist - 0.5) * 2.0, 2.0);
            float ripple = sin(dist * 30.0 - time * 2.0) * 0.015 * rippleFade;
            uv -= normalize(toCenter) * ripple;

            vec4 color = texture2D(textureSampler, uv);
            float alpha = smoothstep(0.5, 0.1, dist);

            gl_FragColor = vec4(color.rgb, alpha * globalAlpha);
        }
    `;

    // Portal creation function
    function createPortal(
      portalPosition: BABYLON.Vector3,
      portalRadius: number,
      name: string,
      title: string
    ): BABYLON.Mesh {
      // Create portal mesh
      const portalMesh = BABYLON.MeshBuilder.CreateDisc(name, {
        radius: portalRadius,
        tessellation: 16
      }, scene);
      portalMesh.position = portalPosition.clone();
      portalMesh.rotation.x = Math.PI;
      portalMesh.rotation.y = Math.PI / 2;
      portalMesh.name = name;
      portalMesh.alwaysSelectAsActiveMesh = true;

      // Create shader material
      const shaderMat = new BABYLON.ShaderMaterial("portalShader_" + name, scene, {
        vertex: "portal",
        fragment: "portal"
      }, {
        attributes: ["position", "uv"],
        uniforms: ["worldViewProjection", "time", "globalAlpha", "uvOffset"]
      });

      shaderMat.backFaceCulling = false;
      shaderMat.alphaMode = BABYLON.Engine.ALPHA_COMBINE;
      shaderMat.needAlphaBlending = () => true;

      const portalTex = new BABYLON.Texture("/assets/textures/static_portal.jpg", scene);
      portalTex.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
      portalTex.uScale = 1;
      shaderMat.setTexture("textureSampler", portalTex);
      shaderMat.setFloat("globalAlpha", 1.0);
      shaderMat.setVector2("uvOffset", new BABYLON.Vector2(0, 0));

      portalMesh.material = shaderMat;

      // Particle swirl
      const swirl = new BABYLON.ParticleSystem("swirl_" + name, 30, scene);
      swirl.particleTexture = new BABYLON.Texture("/assets/textures/twirl_02.png", scene);
      swirl.emitter = portalMesh;
      swirl.minEmitBox = swirl.maxEmitBox = new BABYLON.Vector3(0, 0, 0);
      swirl.direction1 = swirl.direction2 = new BABYLON.Vector3(0, 0, 0);
      swirl.minEmitPower = swirl.maxEmitPower = 0;
      swirl.minSize = portalRadius * 2 * 0.3;
      swirl.maxSize = portalRadius * 2 * 1.2;
      swirl.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
      swirl.minAngularSpeed = 1;
      swirl.maxAngularSpeed = 3;
      swirl.addColorGradient(0.0, new BABYLON.Color4(0.2, 0.2, 0.7, 0));
      swirl.addColorGradient(0.2, new BABYLON.Color4(0.6 / 1.5, 0.62 / 1.5, 0.9 / 1.2, 0.4));
      swirl.addColorGradient(0.8, new BABYLON.Color4(0.78 / 1.5, 0.63 / 1.5, 0.82 / 1.2, 0.4));
      swirl.addColorGradient(1.0, new BABYLON.Color4(0.5, 0.2, 0.9, 0));
      swirl.minLifeTime = 4;
      swirl.maxLifeTime = 8;
      swirl.emitRate = 10;
      swirl.gravity = BABYLON.Vector3.Zero();
      swirl.updateSpeed = 0.01;
      swirl.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_ALL;
      swirl.disposeOnStop = false;
      swirl.start();

      portalSwirlsRef.current.push(swirl);

      // Runtime logic: face camera and animate shader
      scene.registerBeforeRender(() => {
        // Update shader time
        shaderMat.setFloat("time", performance.now() * 0.001);

        // Face the camera
        const toCam = camera.position.subtract(portalMesh.position).normalize();
        const lookQuat = BABYLON.Quaternion.FromLookDirectionLH(toCam, BABYLON.Axis.Y);
        const flipZ = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Z, Math.PI);
        const flipY = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, Math.PI);
        const targetRot = lookQuat.multiply(flipZ).multiply(flipY);
        if (!portalMesh.rotationQuaternion)
          portalMesh.rotationQuaternion = BABYLON.Quaternion.Identity();
        BABYLON.Quaternion.SlerpToRef(portalMesh.rotationQuaternion, targetRot, 0.01, portalMesh.rotationQuaternion);

        // Scroll UV based on portal orientation
        const forward = portalMesh.forward || portalMesh.getDirection(BABYLON.Axis.Z);
        const angle = Math.atan2(forward.x, forward.z);
        const scrollOffset = angle / (2 * Math.PI);
        shaderMat.setVector2("uvOffset", new BABYLON.Vector2(-scrollOffset, 0));
      });

      // Initially disabled
      portalMesh.setEnabled(false);

      return portalMesh;
    }

    // Create 4 portals at positions from prototype
    const portal1 = createPortal(
      new BABYLON.Vector3(40, 4, -50),
      6,
      "portal_geelySeagull",
      "GEELY Car Visualizer"
    );
    portalsRef.current.push(portal1);

    const portal2 = createPortal(
      new BABYLON.Vector3(50, -3, 20),
      6,
      "portal_atlasflow",
      "Atlasflow"
    );
    portalsRef.current.push(portal2);

    const portal3 = createPortal(
      new BABYLON.Vector3(-50, -3, 20),
      6,
      "portal_babylonEditor",
      "Babylon.js Editor"
    );
    portalsRef.current.push(portal3);

    const portal4 = createPortal(
      new BABYLON.Vector3(-40, -2, -50),
      6,
      "portal_fda",
      "FDA Training Platform"
    );
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

    // Load GEELY car asynchronously (doesn't block loading screen)
    const loadGEELYCarAsync = async () => {

      // Wait a bit to ensure rockring and other assets are loaded
      await new Promise(resolve => setTimeout(resolve, 2000));

      const gltfPath = "/assets/models/geely/";
      const carFile = "geelyEX2.gltf";

      try {
        // Load the car model as asset container
        const container = await BABYLON.SceneLoader.LoadAssetContainerAsync(gltfPath, carFile, scene);
        container.addAllToScene();

        if (!container.meshes.length) {
          return;
        }

        // Get the root mesh (first mesh in the container)
        const carRoot = container.meshes[0];
        carRootRef.current = carRoot as any; // Store as AbstractMesh

        // Setup ambient texture coordinates for ALL materials (including variants)
        container.materials.forEach(mat => {
          const pbrMat = mat as BABYLON.PBRMaterial;
          if (pbrMat.ambientTexture) {
            pbrMat.ambientTexture.coordinatesIndex = 1;
          }
        });

        // Stop all animations
        container.animationGroups.forEach(group => {
          group.stop();
          group.reset();
        });

        // Store all meshes (don't disable yet - set position first)
        const carMeshes: BABYLON.AbstractMesh[] = [];
        container.meshes.forEach(mesh => {
          carMeshes.push(mesh);
        });

        carMeshesRef.current = carMeshes;

        // Find the anchor_1 mesh from anchors.glb
        const anchorMesh = scene.getMeshByName("anchor_1");

        if (anchorMesh) {
          // Store anchor reference
          carAnchorRef.current = anchorMesh;

          // Position car root at anchor location
          const anchorPos = anchorMesh.getAbsolutePosition();
          carRoot.position.copyFrom(anchorPos);

          // Apply rotation from anchor
          // GLTF meshes use rotationQuaternion, so we must update that, not .rotation
          if (!carRoot.rotationQuaternion) {
            carRoot.rotationQuaternion = BABYLON.Quaternion.Identity();
          }

          // Get absolute rotation from anchor and apply to car
          const anchorWorldMatrix = anchorMesh.getWorldMatrix();
          anchorWorldMatrix.decompose(undefined, carRoot.rotationQuaternion, undefined);

          carRoot.scaling.set(1, 1, -1); // Flip Z to match scene orientation
          modelOriginalScales.set(carRoot, carRoot.scaling.clone()); // Store original scale
          modelOriginalRotations.set(carRoot, carRoot.rotationQuaternion.clone()); // Store original rotation

          // Create interior camera
          if (!interiorCameraRef.current) {
            const offset = new BABYLON.Vector3(0, 3.75, 0);
            const rotatedOffset = offset.applyRotationQuaternion(carRoot.rotationQuaternion!);
            const targetPos = anchorPos.add(rotatedOffset);

            const iCam = new BABYLON.ArcRotateCamera(
              "interiorCamera",
              0,            // alpha
              Math.PI / 2.3,  // beta
              0,            // radius
              targetPos,
              scene
            );
            if (isMobile) {
              iCam.fov = 1.8;
            } else {
              iCam.fov = 1.2;
            }
            iCam.minZ = 0.01;
            iCam.lowerRadiusLimit = 0;
            iCam.upperRadiusLimit = 0;
            iCam.panningSensibility = 0; // Disable panning

            // Sync rotation with car/anchor
            // We calculate heading from the anchor's forward vector to be robust against scaling/quaternions
            const anchorForward = anchorMesh.forward;
            const heading = Math.atan2(anchorForward.x, anchorForward.z);

            // ArcRotateCamera alpha 0 looks down -X axis (in Babylon left-handed)
            // We want to convert our heading (angle from +Z) to alpha
            // Formula: alpha = -heading - Math.PI/2
            iCam.alpha = -heading;

            interiorCameraRef.current = iCam;
          }

          // Hide the anchor mesh but keep it enabled for position tracking
          anchorMesh.isVisible = false;

        } else {
          // Fallback to manual position if anchor not found
          carRoot.position.set(131, -6.7, 50);
          carRoot.scaling.set(1, 1, -1);
          modelOriginalScales.set(carRoot, carRoot.scaling.clone()); // Store original scale
        }

        // Warmup GPU for this model, then hide
        // This pre-compiles shaders and uploads buffers to prevent lag on first appearance
        await warmupModelForGPU(carRoot, carMeshes, scene, 50);

        // Initially hide all meshes - proximity detection will show them
        carMeshes.forEach(mesh => {
          mesh.setEnabled(false);
        });
        modelVisibilityRef.current.model1 = false;

        // Create atom indicator at anchor position
        if (anchorMesh) {
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
          // Use current state from store (not captured 's') to avoid stale state during async loading
          const currentState = useUI.getState().state;
          if (currentState < S.state_4 || currentState > S.state_7) {
            // Not in explore states - hide atom
            atom.root.setEnabled(false);
          } else {
            // In explore states - ensure atom is explicitly enabled
            atom.root.setEnabled(true);
          }
        }

        // Apply initial customization (green body, lightBlue trim)
        setTimeout(() => {
          customizeCar({ color: "green", trim: "lightBlue" });
        }, 100);

        // Mark model as fully loaded
        modelLoadedRef.current.model1 = true;

        // If a loading ring is showing at this anchor, hide it
        if (loadingRingsRef.current.ring1) {
          loadingRingsRef.current.ring1.hide();
        }
      }
    };

    // Customize car function
    const customizeCar = ({ color, trim }: { color?: string; trim?: string } = {}) => {
      if (!sceneRef.current) return null;

      const carMaterial = sceneRef.current.getMaterialByName("body_paint") as BABYLON.PBRMaterial;
      if (!carMaterial) {
        console.warn("⚠️ Body_Paint material not found");
        return null;
      }

      // Defaults (fall back to current)
      let newColor = color ?? currentColorRef.current;
      let newTrim = trim ?? currentTrimRef.current;

      const colorProvided = color !== undefined;
      const trimProvided = trim !== undefined;

      // Sanity-check the names
      const colorSetting = colorSettings[newColor as keyof typeof colorSettings];
      if (!colorSetting) {
        console.warn(`⚠️ Invalid color: ${newColor}`);
        return null;
      }

      if (!trimConfigs[newTrim]) {
        console.warn(`⚠️ Invalid trim: ${newTrim}`);
        return null;
      }

      // If user picked a new trim, check if current color is allowed
      if (trimProvided && !colorProvided) {
        const chosenTrim = trimConfigs[newTrim];
        if (!chosenTrim.allowed.includes(newColor)) {
          // Auto-switch to first allowed color
          newColor = chosenTrim.allowed[0];
        }
      }

      // If user picked a new color, check if current trim allows it
      if (colorProvided && !trimProvided) {
        const currentTrimConfig = trimConfigs[newTrim];
        if (!currentTrimConfig.allowed.includes(newColor)) {
          // Find a trim that allows this color
          const compatibleTrim = Object.entries(trimConfigs).find(([_, cfg]) =>
            cfg.allowed.includes(newColor)
          );
          if (compatibleTrim) {
            newTrim = compatibleTrim[0];
          }
        }
      }

      // Apply body paint color
      const paint = colorSettings[newColor as keyof typeof colorSettings];
      carMaterial.albedoColor = BABYLON.Color3.FromHexString(paint.hex);
      carMaterial.metallic = paint.metallic;
      carMaterial.roughness = paint.roughness;
      if (carMaterial.sheen) {
        carMaterial.sheen.intensity = paint.sheen;
      }

      // Apply trim-specific materials
      const chosenTrim = trimConfigs[newTrim];
      for (const [meshName, matName] of Object.entries(chosenTrim.materials)) {
        const mesh = sceneRef.current.getMeshByName(meshName);
        const mat = sceneRef.current.getMaterialByName(matName);
        if (mesh && mat) {
          mesh.material = mat;
        }
      }

      // Update current state
      currentColorRef.current = newColor;
      currentTrimRef.current = newTrim;

      return { finalColor: newColor, finalTrim: newTrim };
    };

    // Load Musecraft model asynchronously (anchor_2, state 5)
    const loadMusecraftAsync = async () => {

      // Wait a bit to ensure anchors and other assets are loaded
      await new Promise(resolve => setTimeout(resolve, 2500));

      try {
        const container = await BABYLON.SceneLoader.LoadAssetContainerAsync("/assets/models/musecraft/", "musecraft.glb", scene);
        container.addAllToScene();


        if (!container.meshes.length) {
          return;
        }

        const modelRoot = container.meshes[0];
        musecraftRootRef.current = modelRoot as any;

        // Store animation groups and stop them initially (will be started by proximity detection)
        musecraftAnimationGroupsRef.current = container.animationGroups;
        container.animationGroups.forEach(group => {
          group.stop();
          group.reset();
        });

        // Store all meshes
        const modelMeshes: BABYLON.AbstractMesh[] = [];
        container.meshes.forEach(mesh => {
          modelMeshes.push(mesh);
        });

        musecraftMeshesRef.current = modelMeshes;

        // Find the anchor_2 mesh from anchors.glb
        const anchorMesh = scene.getMeshByName("anchor_2");

        if (anchorMesh) {
          musecraftAnchorRef.current = anchorMesh;

          // Position model root at anchor location
          const anchorPos = anchorMesh.getAbsolutePosition();
          modelRoot.position.copyFrom(anchorPos);

          // Apply rotation from anchor
          if (!modelRoot.rotationQuaternion) {
            modelRoot.rotationQuaternion = BABYLON.Quaternion.Identity();
          }

          const anchorWorldMatrix = anchorMesh.getWorldMatrix();
          anchorWorldMatrix.decompose(undefined, modelRoot.rotationQuaternion, undefined);

          modelRoot.scaling.set(1, 1, -1); // Flip Z to match scene orientation
          modelOriginalScales.set(modelRoot, modelRoot.scaling.clone()); // Store original scale

          anchorMesh.isVisible = false;

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
          // Use current state from store (not captured 's') to avoid stale state during async loading
          const currentState = useUI.getState().state;
          if (currentState < S.state_4 || currentState > S.state_7) {
            // Not in explore states - hide atom
            atom.root.setEnabled(false);
          } else {
            // In explore states - ensure atom is explicitly enabled
            atom.root.setEnabled(true);
          }
        }

        // Warmup GPU for this model, then hide
        // This pre-compiles shaders and uploads buffers to prevent lag on first appearance
        await warmupModelForGPU(modelRoot, modelMeshes, scene, 50);

        // Initially hide all meshes - proximity detection will show them
        modelMeshes.forEach(mesh => {
          mesh.setEnabled(false);
        });
        modelVisibilityRef.current.model2 = false;

        // Mark model as fully loaded
        modelLoadedRef.current.model2 = true;

        // If a loading ring is showing at this anchor, hide it
        if (loadingRingsRef.current.ring2) {
          loadingRingsRef.current.ring2.hide();
        }
      }
    };

    // Load Dioramas models asynchronously (anchor_3, state 6)
    // Loads 3 separate models: sesc-museum.gltf, sesc-island.gltf, mesc-museum.gltf
    const loadDioramasAsync = async () => {

      // Wait a bit to ensure anchors and other assets are loaded
      await new Promise(resolve => setTimeout(resolve, 3000));

      const dioramaFiles = [
        { name: "sesc-museum", path: "SESC-Museum/", file: "sesc-museum.gltf" },
        { name: "sesc-island", path: "SESC-Island/", file: "sesc-island.gltf" },
        { name: "mesc-museum", path: "MESC-Museum/", file: "mesc-museum.gltf" }
      ];

      try {
        // Find the anchor_3 mesh first
        const anchorMesh = scene.getMeshByName("anchor_3");

        if (!anchorMesh) {
          return;
        }

        dioramasAnchorRef.current = anchorMesh;
        anchorMesh.isVisible = false;

        // Create parent root TransformNode for all diorama models
        const dioramasRoot = new BABYLON.TransformNode("dioramasRoot", scene);
        dioramasRootRef.current = dioramasRoot;

        // Position and rotate the parent root at anchor location
        const anchorPos = anchorMesh.getAbsolutePosition();
        dioramasRoot.position.copyFrom(anchorPos);

        // Apply rotation from anchor
        if (!dioramasRoot.rotationQuaternion) {
          dioramasRoot.rotationQuaternion = BABYLON.Quaternion.Identity();
        }
        const anchorWorldMatrix = anchorMesh.getWorldMatrix();
        anchorWorldMatrix.decompose(undefined, dioramasRoot.rotationQuaternion, undefined);

        dioramasRoot.scaling.set(1, 1, -1); // Flip Z to match scene orientation
        modelOriginalScales.set(dioramasRoot as any, dioramasRoot.scaling.clone()); // Store original scale

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
        // Use current state from store (not captured 's') to avoid stale state during async loading
        const currentState = useUI.getState().state;
        if (currentState < S.state_4 || currentState > S.state_7) {
          // Not in explore states - hide atom
          atom.root.setEnabled(false);
        } else {
          // In explore states - ensure atom is explicitly enabled
          atom.root.setEnabled(true);
        }

        // Load each diorama model
        const allMeshes: BABYLON.AbstractMesh[] = [];

        for (let i = 0; i < dioramaFiles.length; i++) {
          const { name, path, file } = dioramaFiles[i];

          try {
            const container = await BABYLON.SceneLoader.LoadAssetContainerAsync(
              `/assets/models/dioramas/${path}`,
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

            // Parent this model to the shared dioramas root
            modelRoot.parent = dioramasRoot;

            // Stop all animations
            container.animationGroups.forEach(group => {
              group.stop();
              group.reset();
            });

            // Store meshes for this model
            const modelMeshes: BABYLON.AbstractMesh[] = [];
            container.meshes.forEach(mesh => {
              modelMeshes.push(mesh);
              allMeshes.push(mesh);
              // IMPORTANT: Hide immediately to prevent visibility flash before warmup
              mesh.setEnabled(false);
            });
            dioramaModelsRef.current.meshes[i] = modelMeshes;
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

        // Show only the first model (index 0) by default when becoming visible
        // This is handled by the model switching effect

        // Mark model as fully loaded
        modelLoadedRef.current.model3 = true;

        // If a loading ring is showing at this anchor, hide it
        if (loadingRingsRef.current.ring3) {
          loadingRingsRef.current.ring3.hide();
        }
      }
    };

    // Load Petwheels model asynchronously (anchor_4, state 7)
    const loadPetwheelsAsync = async () => {

      // Wait a bit to ensure anchors and other assets are loaded
      await new Promise(resolve => setTimeout(resolve, 3500));

      try {
        const container = await BABYLON.SceneLoader.LoadAssetContainerAsync("/assets/models/petwheels/", "petwheels.gltf", scene);
        container.addAllToScene();

        if (!container.meshes.length) {
          return;
        }

        const modelRoot = container.meshes[0];
        petwheelsRootRef.current = modelRoot as any;

        // Store animation groups and stop them initially (will be started by proximity detection)
        petwheelsAnimationGroupsRef.current = container.animationGroups;
        container.animationGroups.forEach(group => {
          group.stop();
          group.reset();
        });

        // Store all meshes
        const modelMeshes: BABYLON.AbstractMesh[] = [];
        container.meshes.forEach(mesh => {
          modelMeshes.push(mesh);
        });

        petwheelsMeshesRef.current = modelMeshes;

        // Find the anchor_4 mesh from anchors.glb
        const anchorMesh = scene.getMeshByName("anchor_4");

        if (anchorMesh) {
          petwheelsAnchorRef.current = anchorMesh;

          // Position model root at anchor location
          const anchorPos = anchorMesh.getAbsolutePosition();
          modelRoot.position.copyFrom(anchorPos);

          // Apply rotation from anchor
          if (!modelRoot.rotationQuaternion) {
            modelRoot.rotationQuaternion = BABYLON.Quaternion.Identity();
          }

          const anchorWorldMatrix = anchorMesh.getWorldMatrix();
          anchorWorldMatrix.decompose(undefined, modelRoot.rotationQuaternion, undefined);

          modelRoot.scaling.set(1, 1, -1); // Flip Z to match scene orientation
          modelOriginalScales.set(modelRoot, modelRoot.scaling.clone()); // Store original scale

          anchorMesh.isVisible = false;


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
          // Use current state from store (not captured 's') to avoid stale state during async loading
          const currentState = useUI.getState().state;
          if (currentState < S.state_4 || currentState > S.state_7) {
            // Not in explore states - hide atom
            atom.root.setEnabled(false);
          } else {
            // In explore states - ensure atom is explicitly enabled
            atom.root.setEnabled(true);
          }
        }

        // Warmup GPU for this model, then hide
        // This pre-compiles shaders and uploads buffers to prevent lag on first appearance
        await warmupModelForGPU(modelRoot, modelMeshes, scene, 50);

        // Initially hide all meshes - proximity detection will show them
        modelMeshes.forEach(mesh => {
          mesh.setEnabled(false);
        });
        modelVisibilityRef.current.model4 = false;

        // Mark model as fully loaded
        modelLoadedRef.current.model4 = true;

        // If a loading ring is showing at this anchor, hide it
        if (loadingRingsRef.current.ring4) {
          loadingRingsRef.current.ring4.hide();
        }
      }
    };

    // Start loading all models asynchronously (doesn't affect loading screen)
    loadGEELYCarAsync();
    loadMusecraftAsync();
    loadDioramasAsync();
    loadPetwheelsAsync();

    // Register customizeCar callback in state so GeelyCustomizer can call it
    useUI.getState().setGeelyCustomizeCallback(customizeCar);

    // Distance-based visibility for GEELY customizer panel
    const VISIBILITY_DISTANCE = 20; // Show panel when within 100 meters

    scene.onBeforeRenderObservable.add(() => {
      // Early return if ship not loaded yet
      if (!spaceshipRootRef.current) {
        return;
      }

      // Use anchor position if available, otherwise use car position
      let targetPosition: BABYLON.Vector3 | null = null;

      if (carAnchorRef.current) {
        targetPosition = carAnchorRef.current.getAbsolutePosition();
      } else if (carRootRef.current) {
        targetPosition = carRootRef.current.getAbsolutePosition();
      }

      if (!targetPosition) {
        return;
      }

      // Calculate distance from SHIP to anchor/car (NOT camera!)
      const shipPosition = spaceshipRootRef.current.getAbsolutePosition();
      const distance = BABYLON.Vector3.Distance(shipPosition, targetPosition);

      // Show/hide panel based on distance using state
      const shouldBeVisible = distance <= VISIBILITY_DISTANCE;
      const currentlyVisible = useUI.getState().geelyCustomizerVisible;

      if (shouldBeVisible && !currentlyVisible) {
        useUI.getState().setGeelyCustomizerVisible(true);
      } else if (!shouldBeVisible && currentlyVisible) {
        useUI.getState().setGeelyCustomizerVisible(false);
      }
    });

    // Distance-based visibility for Dioramas panel
    const DIORAMAS_VISIBILITY_DISTANCE = 20; // Same threshold as GEELY

    scene.onBeforeRenderObservable.add(() => {
      // Early return if ship or dioramas anchor not loaded yet
      if (!spaceshipRootRef.current || !dioramasAnchorRef.current) {
        return;
      }

      // Calculate distance from SHIP to dioramas anchor
      const shipPosition = spaceshipRootRef.current.getAbsolutePosition();
      const dioramasPosition = dioramasAnchorRef.current.getAbsolutePosition();
      const distance = BABYLON.Vector3.Distance(shipPosition, dioramasPosition);

      // Show/hide dioramas panel based on distance using state
      const shouldBeVisible = distance <= DIORAMAS_VISIBILITY_DISTANCE;
      const currentlyVisible = useUI.getState().dioramasPanelVisible;

      if (shouldBeVisible && !currentlyVisible) {
        useUI.getState().setDioramasPanelVisible(true);
      } else if (!shouldBeVisible && currentlyVisible) {
        useUI.getState().setDioramasPanelVisible(false);
      }
    });

    // Distance-based visibility for Petwheels panel
    const PETWHEELS_VISIBILITY_DISTANCE = 20; // Same threshold as others

    scene.onBeforeRenderObservable.add(() => {
      // Early return if ship or petwheels anchor not loaded yet
      if (!spaceshipRootRef.current || !petwheelsAnchorRef.current) {
        return;
      }

      // Calculate distance from SHIP to petwheels anchor
      const shipPosition = spaceshipRootRef.current.getAbsolutePosition();
      const petwheelsPosition = petwheelsAnchorRef.current.getAbsolutePosition();
      const distance = BABYLON.Vector3.Distance(shipPosition, petwheelsPosition);

      // Show/hide petwheels panel based on distance using state
      const shouldBeVisible = distance <= PETWHEELS_VISIBILITY_DISTANCE;
      const currentlyVisible = useUI.getState().petwheelsPanelVisible;

      if (shouldBeVisible && !currentlyVisible) {
        useUI.getState().setPetwheelsPanelVisible(true);
      } else if (!shouldBeVisible && currentlyVisible) {
        useUI.getState().setPetwheelsPanelVisible(false);
      }
    });

    // Distance-based visibility for Musecraft panel
    const MUSECRAFT_VISIBILITY_DISTANCE = 20; // Same threshold as others

    scene.onBeforeRenderObservable.add(() => {
      // Early return if ship or musecraft anchor not loaded yet
      if (!spaceshipRootRef.current || !musecraftAnchorRef.current) {
        return;
      }

      // Calculate distance from SHIP to musecraft anchor
      const shipPosition = spaceshipRootRef.current.getAbsolutePosition();
      const musecraftPosition = musecraftAnchorRef.current.getAbsolutePosition();
      const distance = BABYLON.Vector3.Distance(shipPosition, musecraftPosition);

      // Show/hide musecraft panel based on distance using state
      const shouldBeVisible = distance <= MUSECRAFT_VISIBILITY_DISTANCE;
      const currentlyVisible = useUI.getState().musecraftPanelVisible;

      if (shouldBeVisible && !currentlyVisible) {
        useUI.getState().setMusecraftPanelVisible(true);
      } else if (!shouldBeVisible && currentlyVisible) {
        useUI.getState().setMusecraftPanelVisible(false);
      }
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
    const inFreeExploreState = s >= S.state_4 && s <= S.state_7;
    const shouldEnableControls = inFreeExploreState && navigationMode === 'free' && !isInteriorView;

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

            // Target velocity for mobile
            const MOBILE_SPEED_MULT = 1.5;
            const shouldMove = MC.cameraRotation === 0;
            const targetVelocity = shouldMove
              ? dir.scale(ShipControls.speed * MOBILE_SPEED_MULT)
              : new BABYLON.Vector3(0, 0, 0);

            // Smooth velocity interpolation (acceleration or drag)
            const interpSpeed = shouldMove ? ShipControls.acceleration : ShipControls.drag;
            ShipControls.velocity.x += (targetVelocity.x - ShipControls.velocity.x) * Math.min(1, dt * interpSpeed);
            ShipControls.velocity.y += (targetVelocity.y - ShipControls.velocity.y) * Math.min(1, dt * interpSpeed);
            ShipControls.velocity.z += (targetVelocity.z - ShipControls.velocity.z) * Math.min(1, dt * interpSpeed);

            const movement = ShipControls.velocity.scale(dt);
            controlTarget.position.addInPlace(movement);

          } else {
            // Idle when not dragging - apply drag to velocity
            ShipControls.velocity.x += (0 - ShipControls.velocity.x) * Math.min(1, dt * ShipControls.drag);
            ShipControls.velocity.y += (0 - ShipControls.velocity.y) * Math.min(1, dt * ShipControls.drag);
            ShipControls.velocity.z += (0 - ShipControls.velocity.z) * Math.min(1, dt * ShipControls.drag);

            // Continue applying velocity even when not dragging (coasting)
            const movement = ShipControls.velocity.scale(dt);
            controlTarget.position.addInPlace(movement);

            if (A.I) play(A.I, wStep);
            // Reset yaw tracking
            MC.yawRate = 0;
            MC.previousYaw = 0;
          }
        }
      });

      // ========== DESKTOP WASD CONTROLS (commented out - using drag controls for both) ==========
      // } else {
      //   // Yaw from A/D (D=right, A=left)
      //   const turnIn = ((K["d"] || K["arrowright"]) ? 1 : 0) -
      //     ((K["a"] || K["arrowleft"]) ? 1 : 0);

      //   // Pitch from Q/E with easing (E=up, Q=down)
      //   const pitchIn = (K["q"] ? 1 : 0) - (K["e"] ? 1 : 0);
      //   const targetPitchVel = pitchIn * PITCH_RATE;
      //   ShipControls.pitchVel += (targetPitchVel - ShipControls.pitchVel) * Math.min(1, dt * SMOOTH);
      //   ShipControls.pitch -= ShipControls.pitchVel * dt;

      //   // Yaw accumulation from A/D
      //   ShipControls.yawTarget -= turnIn * PITCH_RATE * dt;

      //   // Ship orientation - ABSOLUTE rotation from accumulated angles (like prototype)
      //   const qYaw = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, ShipControls.yawTarget);
      //   const qPitch = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.X, ShipControls.pitch);
      //   const qFinal = qYaw.multiply(qPitch);

      //   // Apply rotation directly without Slerp for immediate response
      //   controlTarget.rotationQuaternion = qFinal;

      //   // Choose & blend animation
      //   const BLEND_PER_SEC = 4;
      //   const wStep = BLEND_PER_SEC * dt;

      //   const forwardKey = K["w"] || K["arrowup"];
      //   const brakeKey = K["s"] || K["arrowdown"];

      //   if (A.fwd && A.brk && A.L && A.R && A.I) {
      //     if (turnIn < 0) play(A.L, wStep);
      //     else if (turnIn > 0) play(A.R, wStep);
      //     else if (brakeKey) play(A.brk, wStep);
      //     else if (forwardKey) play(A.fwd, wStep);
      //     else play(A.I, wStep);
      //   }

      //   // Smooth Shift throttle
      //   const wantSpeed = K["shift"] ? ShipControls.speed * ShipControls.speedK : ShipControls.speed;
      //   ShipControls.v += (wantSpeed - ShipControls.v) * Math.min(1, dt * 5);

      //   // Movement with velocity smoothing (inertia/momentum)
      //   const throttle = forwardKey && !brakeKey ? 1 :
      //     forwardKey && brakeKey ? 0.5 : 0;

      //   // Calculate target velocity direction
      //   let targetVelocity = new BABYLON.Vector3(0, 0, 0);

      //   if (throttle > 0) {
      //     // Get forward direction (already includes pitch rotation for circular motion)
      //     const forwardVector = new BABYLON.Vector3(0, 0, 1);

      //     const dir = BABYLON.Vector3.TransformNormal(
      //       forwardVector,
      //       controlTarget.getWorldMatrix()
      //     ).normalize();

      //     // Invert X axis to fix left-right direction (like prototype)
      //     dir.x *= -1;

      //     // Target velocity in the forward direction
      //     targetVelocity = dir.scale(ShipControls.v * 1 * throttle);
      //   }

      //   // Smoothly interpolate current velocity toward target velocity
      //   // When throttle > 0: accelerate toward target
      //   // When throttle = 0: drag slows down to zero
      //   const interpSpeed = throttle > 0 ? ShipControls.acceleration : ShipControls.drag;
      //   ShipControls.velocity.x += (targetVelocity.x - ShipControls.velocity.x) * Math.min(1, dt * interpSpeed);
      //   ShipControls.velocity.y += (targetVelocity.y - ShipControls.velocity.y) * Math.min(1, dt * interpSpeed);
      //   ShipControls.velocity.z += (targetVelocity.z - ShipControls.velocity.z) * Math.min(1, dt * interpSpeed);

      //   // Apply velocity to position
      //   const movement = ShipControls.velocity.scale(dt);
      //   controlTarget.position.addInPlace(movement);
      // }

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
  }, [s, navigationMode, isInteriorView]);

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

      lastDragPosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: PointerEvent) => {
      isDraggingRef.current = false;
      canvas.releasePointerCapture(e.pointerId);
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
    const wasInExploreState = prevState >= S.state_4 && prevState <= S.state_7; // Was in states 4-7
    const isNowInExploreState = s >= S.state_4 && s <= S.state_7; // Is now in states 4-7
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
      const isEnteringExploreState = s >= S.state_4 && s <= S.state_7;
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
        prevState >= S.state_4 && prevState <= S.state_7 &&
        (s <= S.state_3 || s === S.state_final);

      // In guided mode for states 4-7, use bezier curve animation with anchor data
      const isGuidedModeState = currentNavigationMode === 'guided' &&
        s >= S.state_4 && s <= S.state_7;

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
        // Map states to anchor indices (state_4 = anchor1, state_5 = anchor2, etc.)
        const anchorIndex = s - S.state_4 + 1; // 1, 2, 3, or 4
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

              // Check if model is loaded - if not, show loading ring
              const modelKey = `model${anchorIndex}` as 'model1' | 'model2' | 'model3' | 'model4';
              const ringKey = `ring${anchorIndex}` as 'ring1' | 'ring2' | 'ring3' | 'ring4';
              const isModelLoaded = modelLoadedRef.current[modelKey];

              if (!isModelLoaded && scene) {

                // Dispose any existing ring first
                if (loadingRingsRef.current[ringKey]) {
                  loadingRingsRef.current[ringKey]!.dispose();
                }

                // Create loading ring at anchor position
                const loadingRing = createLoadingRing({
                  scene,
                  position: anchorData.position,
                  radius: 2.5
                });
                loadingRingsRef.current[ringKey] = loadingRing;
              }
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

    // Handle spaceship visibility with fade animations
    const spaceship = spaceshipRef.current;
    const shipRoot = spaceshipRootRef.current;
    const spaceshipContainer = shipRoot || spaceship; // Use shipRoot if available, otherwise spaceship

    if (spaceshipContainer) {
      const shouldBeVisible = sceneConfig.spaceshipEnabled;
      const isCurrentlyVisible = spaceshipContainer.isEnabled();
      const flames = flameParticleSystemRef.current;
      const flamesRunning = flames ? flames.isStarted() : false;

      // Fade in when transitioning to state with spaceship enabled
      if (shouldBeVisible && !isCurrentlyVisible && spaceship) {
        // Collect materials
        const spaceshipMaterials: BABYLON.Material[] = [];
        spaceship.getChildMeshes().forEach(mesh => {
          if (mesh.material) {
            spaceshipMaterials.push(mesh.material);
          }
        });
        if (spaceship.material) {
          spaceshipMaterials.push(spaceship.material);
        }

        // Enable with invisible materials and start flames together
        spaceshipMaterials.forEach(mat => mat.alpha = 0.01);
        setShipAndFlamesVisibility({
          container: spaceshipContainer,
          flameParticles: flameParticleSystemRef.current,
          visible: true,
          method: 'enabled',
          logContext: 'Spaceship Fade In'
        });

        // Fade in
        const fps = 60;
        const duration = 1.0;
        const totalFrames = fps * duration;

        spaceshipMaterials.forEach(mat => {
          const alphaAnimation = new BABYLON.Animation(
            "fadeInSpaceship",
            "alpha",
            fps,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
          );

          alphaAnimation.setKeys([
            { frame: 0, value: 0.01 },
            { frame: totalFrames, value: 1 }
          ]);

          const easing = new BABYLON.CubicEase();
          easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
          alphaAnimation.setEasingFunction(easing);

          mat.animations = [alphaAnimation];
          scene.beginAnimation(mat, 0, totalFrames, false, 1, () => {
            mat.alpha = 1;
          });
        });
      }
      // Fade out when transitioning away from state with spaceship
      else if (!shouldBeVisible && isCurrentlyVisible && spaceship) {
        // Collect materials
        const spaceshipMaterials: BABYLON.Material[] = [];
        spaceship.getChildMeshes().forEach(mesh => {
          if (mesh.material) {
            spaceshipMaterials.push(mesh.material);
          }
        });
        if (spaceship.material) {
          spaceshipMaterials.push(spaceship.material);
        }

        // Fade out
        const fps = 60;
        const duration = 0.8;
        const totalFrames = fps * duration;

        spaceshipMaterials.forEach(mat => {
          mat.alpha = 1;

          const alphaAnimation = new BABYLON.Animation(
            "fadeOutSpaceship",
            "alpha",
            fps,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
          );

          alphaAnimation.setKeys([
            { frame: 0, value: 1 },
            { frame: totalFrames, value: 0.01 }
          ]);

          const easing = new BABYLON.CubicEase();
          easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEIN);
          alphaAnimation.setEasingFunction(easing);

          mat.animations = [alphaAnimation];
          scene.beginAnimation(mat, 0, totalFrames, false, 1, () => {
            mat.alpha = 0.01;
          });
        });

        // Disable ship and stop flames after fade completes
        setTimeout(() => {
          setShipAndFlamesVisibility({
            container: spaceshipContainer,
            flameParticles: flameParticleSystemRef.current,
            visible: false,
            method: 'enabled',
            logContext: 'Spaceship Fade Out'
          });
        }, duration * 1000);
      }

      // SAFETY CHECK: Ensure flames are ALWAYS in sync with ship visibility
      // This catches edge cases where state transitions might leave flames out of sync
      else if (shouldBeVisible && isCurrentlyVisible) {
        // Ship is visible and should be visible - ensure flames are running
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
    const inExploreState = s >= S.state_4 && s <= S.state_7;
    const isGuidedMode = navigationMode === 'guided';

    if (inExploreState) {
      // Get camera animation duration to delay enabling controls until animation completes
      const cameraConfig = config.canvas.babylonCamera;
      const animDuration = cameraConfig?.animationDuration ?? 0.4;
      const animDelay = cameraConfig?.animationDelay ?? 0;
      const totalAnimTime = (animDuration + animDelay) * 1000; // Convert to ms

      // Wait for camera animation to complete before enabling controls
      const timeoutId = setTimeout(() => {
        if (isGuidedMode) {
          // In guided mode: enable mouse wheel for zoom (radius limits are animated elsewhere to control zooming)
          camera.inputs.clear();
          camera.inputs.addMouseWheel();
          camera.attachControl(canvas, true);
        } else {
          // In free mode: enable all controls
          camera.inputs.addMouseWheel();
          camera.inputs.addPointers();
          camera.attachControl(canvas, true);
        }
      }, totalAnimTime);

      return () => clearTimeout(timeoutId);
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

    const inExploreState = s >= S.state_4 && s <= S.state_7;
    const isGuidedMode = navigationMode === 'guided';

    // Only enable model rotation in explore states
    if (!inExploreState) {
      return;
    }

    // Get the current model based on state
    const getCurrentModel = () => {
      switch (s) {
        case S.state_4: return carRootRef.current;
        case S.state_5: return musecraftRootRef.current;
        case S.state_6: return dioramasRootRef.current;
        case S.state_7: return petwheelsRootRef.current;
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
        default: return [];
      }
    };

    // Max peek angle in radians (~30 degrees)
    const maxPeekAngle = Math.PI / 12;
    // Resistance factor - higher = more resistance at extremes
    const resistanceFactor = 6;

    const handlePointerDown = (e: PointerEvent) => {
      // Disable rotation in interior view
      if (useUI.getState().isInteriorView) {
        return;
      }

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
      if (useUI.getState().isInteriorView) return;

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

    const inExploreState = s >= S.state_4 && s <= S.state_7;
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

      // Disable zoom in interior view
      if (useUI.getState().isInteriorView) {
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

      // Disable zoom in interior view
      if (useUI.getState().isInteriorView) return;

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
    const inExploreState = s >= S.state_4 && s <= S.state_7;
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

  // Reset model zoom when entering interior view (for Geely car)
  useEffect(() => {
    if (isInteriorView && s === S.state_4) {
      const key = 'model1';
      const originalPos = modelZoomRef.current.originalPositions[key];
      const model = carRootRef.current;

      if (originalPos && model && modelZoomRef.current.isZoomedIn[key]) {
        // Instantly reset to default position when entering interior view
        model.position.copyFrom(originalPos);
        modelZoomRef.current.isZoomedIn[key] = false;
      }
    }
  }, [isInteriorView, s]);

  // Handle navigation mode toggle - move ship to anchor when switching to guided mode in states 4-7
  const prevNavigationModeRef = useRef<'guided' | 'free'>(navigationMode);
  useEffect(() => {
    const prevMode = prevNavigationModeRef.current;
    const scene = sceneRef.current;
    const shipPivot = shipPivotRef.current;
    const shipRoot = spaceshipRootRef.current;
    const camera = cameraRef.current;

    const isMobile = window.innerWidth < 768;

    // Switching from FREE to GUIDED mode in states 4-7
    if (prevMode === 'free' && navigationMode === 'guided' &&
      s >= S.state_4 && s <= S.state_7 &&
      scene && shipPivot && shipRoot) {

      const anchorIndex = s - S.state_4 + 1; // 1, 2, 3, or 4
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
      s >= S.state_4 && s <= S.state_7 &&
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
    const inExploreState = s >= S.state_4 && s <= S.state_7;
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

      // Exit interior view if active
      if (useUI.getState().isInteriorView) {
        useUI.getState().setIsInteriorView(false);
      }

      // Dispose all loading rings when leaving explore states
      const rings = loadingRingsRef.current;
      if (rings.ring1) { rings.ring1.dispose(); rings.ring1 = null; }
      if (rings.ring2) { rings.ring2.dispose(); rings.ring2 = null; }
      if (rings.ring3) { rings.ring3.dispose(); rings.ring3 = null; }
      if (rings.ring4) { rings.ring4.dispose(); rings.ring4 = null; }

      return;
    }

    // In explore states - enable all atoms (they'll show contracted state by default)
    const atoms = atomIndicatorsRef.current;
    if (atoms.atom1) atoms.atom1.root.setEnabled(true);
    if (atoms.atom2) atoms.atom2.root.setEnabled(true);
    if (atoms.atom3) atoms.atom3.root.setEnabled(true);
    if (atoms.atom4) atoms.atom4.root.setEnabled(true);

    // Proximity check function for a single model
    // Uses force mode on atom expand/contract to handle mid-animation interruptions
    const checkModelProximity = (
      modelKey: 'model1' | 'model2' | 'model3' | 'model4',
      rootRef: React.MutableRefObject<BABYLON.TransformNode | BABYLON.AbstractMesh | null>,
      meshesRef: React.MutableRefObject<BABYLON.AbstractMesh[]>,
      anchorRef: React.MutableRefObject<BABYLON.AbstractMesh | null>,
      atomKey: 'atom1' | 'atom2' | 'atom3' | 'atom4'
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

        // Hide any loading ring that might be showing at this anchor
        const ringKey = modelKey.replace('model', 'ring') as 'ring1' | 'ring2' | 'ring3' | 'ring4';
        const loadingRing = loadingRingsRef.current[ringKey];
        if (loadingRing) {
          loadingRing.hide(0.3);
        }

        // Special handling for model3 (dioramas) - only show selected model
        if (modelKey === 'model3') {
          const selectedIndex = useUI.getState().selectedDioramaModel;
          const dioramaModels = dioramaModelsRef.current;

          // Show only the selected diorama model
          for (let i = 0; i < dioramaModels.roots.length; i++) {
            const dioramaRoot = dioramaModels.roots[i];
            const dioramaMeshes = dioramaModels.meshes[i];

            if (!dioramaRoot || dioramaMeshes.length === 0) continue;

            if (i === selectedIndex) {
              // Use scaleModelMeshes for dioramas too (it handles interruption)
              scaleModelMeshes(dioramaRoot, dioramaMeshes, scene, true, 2, () => {
              });
            } else {
              // Keep other models hidden
              dioramaMeshes.forEach(m => m.setEnabled(false));
            }
          }
        } else {
          // Standard scale in for other models (scaleModelMeshes handles interruption)
          scaleModelMeshes(modelRoot, meshes, scene, true, 2, () => { });
        }

        // Start musecraft animation when model becomes visible
        if (modelKey === 'model2' && musecraftAnimationGroupsRef.current.length > 0) {
          musecraftAnimationGroupsRef.current.forEach(group => {
            group.play(true); // Play in loop
          });
        }

        // Initialize Musecraft interaction system (selection + gizmo) for model2
        if (modelKey === 'model2') {

          const root = musecraftRootRef.current;
          if (root && sceneRef.current && !isMusecraftInteractionInitialized()) {
            // Small delay to ensure meshes are fully enabled after scale animation starts
            setTimeout(() => {
              if (musecraftRootRef.current && sceneRef.current) {
                initMusecraftInteraction(musecraftRootRef.current as BABYLON.AbstractMesh, sceneRef.current);
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

        // Start petwheels animation when model becomes visible
        if (modelKey === 'model4' && petwheelsAnimationGroupsRef.current.length > 0) {
          petwheelsAnimationGroupsRef.current.forEach(group => {
            group.play(true); // Play in loop
          });
        }
      }
      // Transition to hidden (HIDE model + CONTRACT atom)
      else if (!shouldBeVisible && isCurrentlyVisible) {
        visibility[modelKey] = false;

        // Stop musecraft animation when model becomes hidden
        if (modelKey === 'model2' && musecraftAnimationGroupsRef.current.length > 0) {
          musecraftAnimationGroupsRef.current.forEach(group => {
            group.stop();
            group.reset();
          });
        }

        // Reset Musecraft interaction when model2 becomes hidden (always, regardless of animations)
        if (modelKey === 'model2') {
          resetMusecraftInteraction();
          stopRocketFlames();
        }

        // Stop petwheels animation when model becomes hidden
        if (modelKey === 'model4' && petwheelsAnimationGroupsRef.current.length > 0) {
          petwheelsAnimationGroupsRef.current.forEach(group => {
            group.stop();
            group.reset();
          });
        }

        // Contract atom with force=true to handle interruptions
        // This stops any running expand animation and starts contract from current state
        if (atom) {
          atom.contract(0.6, true);
        }

        // Scale out model (scaleModelMeshes handles interruption)
        scaleModelMeshes(modelRoot, meshes, scene, false, 2, () => {
          // Exit interior view if this was the car
          if (modelKey === 'model1' && useUI.getState().isInteriorView) {
            useUI.getState().setIsInteriorView(false);
          }
        });
      }
    };

    // Create proximity check observer
    const proximityObserver = scene.onBeforeRenderObservable.add(() => {
      // Check each model's proximity
      checkModelProximity('model1', carRootRef, carMeshesRef, carAnchorRef, 'atom1');
      checkModelProximity('model2', musecraftRootRef, musecraftMeshesRef, musecraftAnchorRef, 'atom2');
      checkModelProximity('model3', dioramasRootRef, dioramasMeshesRef, dioramasAnchorRef, 'atom3');
      checkModelProximity('model4', petwheelsRootRef, petwheelsMeshesRef, petwheelsAnchorRef, 'atom4');
    });

    return () => {
      scene.onBeforeRenderObservable.remove(proximityObserver);
    };
  }, [s]);

  // Handle interior view toggle
  useEffect(() => {
    if (!sceneRef.current || !interiorCameraRef.current || !cameraRef.current) return;

    const glassMesh = sceneRef.current.getMeshByName("glass");

    if (isInteriorView) {
      // Reset car rotation to original when entering interior view
      const carRoot = carRootRef.current;
      if (carRoot && carRoot.rotationQuaternion) {
        const originalRotation = modelOriginalRotations.get(carRoot);
        if (originalRotation) {
          // Reset all rotation state immediately
          modelRotationRef.current.accumulatedYRotation = 0;
          modelRotationRef.current.peekRotationX = 0;
          modelRotationRef.current.originalQuaternion = null;
          modelRotationRef.current.isDragging = false;
          // Apply original rotation instantly
          carRoot.rotationQuaternion.copyFrom(originalRotation);
        }
      }

      // Reset interior camera to fixed starting angle
      // Calculate the fixed alpha based on the anchor's forward direction
      const anchorMesh = carAnchorRef.current;
      if (anchorMesh) {
        const anchorForward = anchorMesh.forward;
        const heading = Math.atan2(anchorForward.x, anchorForward.z);
        interiorCameraRef.current.alpha = -heading + Math.PI / 2;
      }
      // Reset beta to the fixed starting value
      interiorCameraRef.current.beta = Math.PI / 2.3;

      sceneRef.current.activeCamera = interiorCameraRef.current;
      interiorCameraRef.current.attachControl(ref.current, true);
      cameraRef.current.detachControl();

      // Disable glass in interior view
      if (glassMesh) glassMesh.setEnabled(false);
    } else {
      // Reset car rotation to original when exiting interior view
      const carRoot = carRootRef.current;
      if (carRoot && carRoot.rotationQuaternion) {
        const originalRotation = modelOriginalRotations.get(carRoot);
        if (originalRotation) {
          // Reset all rotation state immediately
          modelRotationRef.current.accumulatedYRotation = 0;
          modelRotationRef.current.peekRotationX = 0;
          modelRotationRef.current.originalQuaternion = null;
          modelRotationRef.current.isDragging = false;
          // Apply original rotation instantly
          carRoot.rotationQuaternion.copyFrom(originalRotation);
        }
      }

      sceneRef.current.activeCamera = cameraRef.current;
      cameraRef.current.attachControl(ref.current, true);
      interiorCameraRef.current.detachControl();

      // Enable glass in exterior view
      if (glassMesh) glassMesh.setEnabled(true);
    }
  }, [isInteriorView]);

  // Handle diorama model switching
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const dioramaModels = dioramaModelsRef.current;
    const isModelVisible = modelVisibilityRef.current.model3;

    // Only switch models if the dioramas are currently visible
    if (!isModelVisible) return;

    // For each diorama model
    for (let i = 0; i < dioramaModels.roots.length; i++) {
      const modelRoot = dioramaModels.roots[i];
      const modelMeshes = dioramaModels.meshes[i];

      if (!modelRoot || modelMeshes.length === 0) continue;

      if (i === selectedDioramaModel) {
        // Show selected model with scale-up animation
        // First set scale to near-zero
        modelRoot.scaling.set(0.001, 0.001, 0.001);
        modelMeshes.forEach(mesh => mesh.setEnabled(true));

        // Animate scale up quickly
        const fps = 60;
        const duration = 0.3; // Quick animation
        const totalFrames = fps * duration;

        const scaleAnim = new BABYLON.Animation(
          "dioramaScaleIn",
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

      } else {
        // Hide other models instantly
        modelMeshes.forEach(mesh => mesh.setEnabled(false));
        modelRoot.scaling.set(1, 1, 1); // Reset scale for when it's shown again
      }
    }
  }, [selectedDioramaModel]);

  return <canvas ref={ref} className="block w-full h-full" />;
}