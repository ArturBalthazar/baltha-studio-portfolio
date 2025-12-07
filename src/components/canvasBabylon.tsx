import React, { useEffect, useRef } from "react";
import * as BABYLON from "babylonjs";
import "@babylonjs/loaders";
import { useUI, S } from "../state";
import { getStateConfig } from "../states";

import { colorSettings, trimConfigs } from "./carConfig";

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
    console.log('🎥 [Camera Animation] Starting camera animation', {
      currentLowerRadiusLimit: camera.lowerRadiusLimit,
      currentUpperRadiusLimit: camera.upperRadiusLimit,
      currentBeta: camera.beta,
      currentAlpha: camera.alpha,
      targetLowerRadiusLimit: lowerRadiusLimit,
      targetUpperRadiusLimit: upperRadiusLimit,
      targetBeta: beta,
      targetAlpha: alpha,
      duration,
      delay
    });

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
      console.log('📐 [Camera Animation] Added lower radius limit animation:', currentLower, '→', lowerRadiusLimit);
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
      console.log('📐 [Camera Animation] Added upper radius limit animation:', currentUpper, '→', upperRadiusLimit);
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
      console.log('🔄 [Camera Animation] Added beta animation:', currentBeta, '→', normalizedBeta, `(target: ${beta}, normalized for shortest path)`);
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
      console.log('🔄 [Camera Animation] Added alpha animation:', currentAlpha, '→', normalizedAlpha, `(target: ${alpha}, normalized for shortest path)`);
    }

    // Apply animations
    if (animations.length > 0) {
      camera.animations = animations;
      scene.beginAnimation(camera, 0, totalFrames, false, 1, () => {
        console.log('✅ [Camera Animation] Animation completed', {
          finalLowerRadiusLimit: camera.lowerRadiusLimit,
          finalUpperRadiusLimit: camera.upperRadiusLimit,
          finalBeta: camera.beta,
          finalAlpha: camera.alpha
        });
        if (onComplete) onComplete();
      });
    } else if (onComplete) {
      onComplete();
    }
  };

  // Apply delay if specified
  if (delay > 0) {
    console.log('⏱️ [Camera Animation] Delaying animation by', delay, 'seconds');
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
  stateRadius?: number; // camera radius for zoomed-out view during travel
  skipArrivalZoom?: boolean; // if true, don't zoom to 0 at arrival (for state_3/final)
  skipArrivalHide?: boolean; // if true, don't hide ship at arrival (for state_3/final)
  onComplete?: () => void;
}

// Duration for guided mode ship animations
const GUIDED_SHIP_DURATION = 4.0;

// Track current bezier animation to prevent stale callbacks from affecting visibility
let currentBezierAnimationId = 0;

/**
 * Animates the ship along a cubic bezier curve from current position/rotation to target.
 * The bezier curve is calculated at runtime based on start/end positions and forward directions.
 * Control points are placed along the forward directions to create a smooth flight path.
 */
function animateShipAlongBezier(options: AnimateShipAlongBezierOptions): void {
  // Increment animation ID - any previous animation's callbacks will now be stale
  currentBezierAnimationId++;
  const thisAnimationId = currentBezierAnimationId;
  
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
    onComplete
  } = options;

  // Make ship visible before departing (use visibility, not setEnabled, to keep particles working)
  target.getChildMeshes().forEach(mesh => mesh.visibility = 1);
  console.log("🚀 [Bezier Animation] Ship visible for departure");

  // Calculate the distance between start and end for control point scaling
  const distance = BABYLON.Vector3.Distance(startPosition, endPosition);
  
  // Control point distance is proportional to the total distance
  // Using 1/3 of the distance creates a nice smooth curve
  const controlPointDistance = distance * 0.4;

  // Create cubic bezier control points:
  // P0 = start position
  // P1 = start position - startForward * controlPointDistance (ship continues in its facing direction)
  // P2 = end position + endForward * controlPointDistance (approaches target aligned with its facing direction)
  // P3 = end position
  
  const p0 = startPosition.clone();
  const p1 = startPosition.subtract(startForward.scale(controlPointDistance));
  const p2 = endPosition.add(endForward.scale(controlPointDistance));
  const p3 = endPosition.clone();

  console.log("🛸 [Bezier Animation] Starting curve animation:", {
    p0: p0.toString(),
    p1: p1.toString(),
    p2: p2.toString(),
    p3: p3.toString(),
    distance,
    duration
  });

  // Create a Babylon Curve3 from the bezier points
  const bezierCurve = BABYLON.Curve3.CreateCubicBezier(p0, p1, p2, p3, 200);
  const curvePoints = bezierCurve.getPoints();

  // Animation parameters
  const fps = 60;
  const totalFrames = fps * duration;
  const numKeyframes = 120; // Number of keyframes for smooth animation

  // Asymmetric ease: moderate start, very smooth arrival
  // Uses quadratic ease-in (faster start) but quintic ease-out (very smooth stop)
  const smoothEase = (t: number): number => {
    if (t < 0.5) {
      // Quadratic ease-in: faster departure than quintic
      return 2 * t * t;
    } else {
      // Quintic ease-out: very smooth arrival
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
    console.log("✅ [Bezier Animation] Ship animation complete at:", target.position.toString());
    // Only hide ship if:
    // 1. This animation is still current (not superseded)
    // 2. skipArrivalHide is not set
    // 3. Navigation mode is still 'guided' (user didn't switch to free during animation)
    const currentNavMode = typeof useUI !== 'undefined' ? useUI.getState().navigationMode : 'guided';
    const shouldHide = thisAnimationId === currentBezierAnimationId && 
                       !options.skipArrivalHide && 
                       currentNavMode === 'guided';
    
    if (shouldHide) {
      target.getChildMeshes().forEach(mesh => mesh.visibility = 0);
      console.log("🛬 [Bezier Animation] Ship hidden after arrival");
    } else {
      if (thisAnimationId !== currentBezierAnimationId) {
        console.log("⏭️ [Bezier Animation] Skipping hide - animation was superseded");
      } else if (options.skipArrivalHide) {
        console.log("⏭️ [Bezier Animation] Skipping hide - skipArrivalHide is set");
      } else if (currentNavMode !== 'guided') {
        console.log("⏭️ [Bezier Animation] Skipping hide - switched to free mode");
      }
    }
    if (onComplete) onComplete();
  });

  // Animate camera alpha/beta to smoothly transition viewing angle
  if (camera) {
    const startAlpha = camera.alpha;
    const startBeta = camera.beta;
    
    // Calculate target alpha based on endForward direction
    // Camera should be positioned "behind" the ship relative to its forward direction
    // alpha = atan2(x, z) gives the angle, we want opposite direction (+PI)
    const endAlpha = Math.atan2(-endForward.x, -endForward.z) - Math.PI / 2;
    
    // Target beta - slightly above horizontal for good viewing angle
    // PI/2 = horizontal, smaller = looking down from above
    const endBeta = Math.PI / 2.2; // About 81 degrees from vertical
    
    // Normalize alpha difference for shortest rotation path
    let alphaDiff = endAlpha - startAlpha;
    while (alphaDiff > Math.PI) alphaDiff -= 2 * Math.PI;
    while (alphaDiff < -Math.PI) alphaDiff += 2 * Math.PI;
    const normalizedEndAlpha = startAlpha + alphaDiff;
    
    console.log("📷 [Bezier Animation] Camera animation:", {
      startAlpha: startAlpha.toFixed(3),
      endAlpha: normalizedEndAlpha.toFixed(3),
      startBeta: startBeta.toFixed(3),
      endBeta: endBeta.toFixed(3)
    });
    
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
      console.log("✅ [Bezier Animation] Camera animation complete");
    });
    
    // Camera radius animation - triggered by PATH COMPLETION, not time
    // Use beginDirectAnimation so it doesn't overwrite the alpha/beta animations
    const stateRadius = options.stateRadius; // Zoom-out radius from state config
    const arrivalRadius = 0; // Close-up radius for arrival
    const radiusAnimDuration = duration * 0.25;
    const radiusFps = 60;
    const totalPathLength = bezierCurve.length();
    
    // Track which triggers have fired
    let zoomOutTriggered = false;
    let zoomInTriggered = false;
    
    // Path completion thresholds (adjustable)
    const ZOOM_OUT_THRESHOLD = 0.001; // 5% of path
    const ZOOM_IN_THRESHOLD = 0.85;  // 80% of path
    
    // Helper to calculate path completion (0 to 1)
    const getPathCompletion = (): number => {
      const currentPos = target.position;
      const distanceFromStart = BABYLON.Vector3.Distance(startPosition, currentPos);
      const distanceToEnd = BABYLON.Vector3.Distance(currentPos, endPosition);
      const totalDist = distanceFromStart + distanceToEnd;
      if (totalDist === 0) return 0;
      return distanceFromStart / totalDist;
    };
    
    // Observer to check path completion each frame
    const pathObserver = scene.onBeforeRenderObservable.add(() => {
      const completion = getPathCompletion();
      
      // Trigger zoom OUT at ~5% path completion
      if (!zoomOutTriggered && completion >= ZOOM_OUT_THRESHOLD) {
        zoomOutTriggered = true;
        const currentRadius = camera.radius;
        console.log(`🔭 [Bezier Animation] Path ${(completion * 100).toFixed(0)}% - Zooming out:`, currentRadius, "→", stateRadius);
        
        // Temporarily allow the radius range
        camera.lowerRadiusLimit = 0;
        camera.upperRadiusLimit = stateRadius;
        
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
          { frame: radiusFps * radiusAnimDuration, value: stateRadius }
        ]);
        
        scene.beginDirectAnimation(camera, [zoomOutAnim], 0, radiusFps * radiusAnimDuration, false, 1);
      }
      
      // Trigger zoom IN at ~80% path completion (unless skipArrivalZoom is set)
      if (!zoomInTriggered && completion >= ZOOM_IN_THRESHOLD) {
        zoomInTriggered = true;
        
        if (options.skipArrivalZoom) {
          console.log(`⏭️ [Bezier Animation] Path ${(completion * 100).toFixed(0)}% - Skipping arrival zoom (skipArrivalZoom is set)`);
        } else {
          const currentRadius = camera.radius;
          console.log(`🔍 [Bezier Animation] Path ${(completion * 100).toFixed(0)}% - Zooming in:`, currentRadius, "→", arrivalRadius);
          
          // Allow zooming all the way in
          camera.lowerRadiusLimit = 0;
          
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
          
          scene.beginDirectAnimation(camera, [zoomInAnim], 0, radiusFps * radiusAnimDuration, false, 1);
        }
      }
      
      // Remove observer when both triggers have fired
      if (zoomOutTriggered && zoomInTriggered) {
        scene.onBeforeRenderObservable.remove(pathObserver);
      }
    });
    
    // Safety cleanup: remove observer after animation duration + buffer
    setTimeout(() => {
      scene.onBeforeRenderObservable.remove(pathObserver);
    }, (duration + 1) * 1000);
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
  const rockRingHasShownRef = useRef(false);
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
    speed: 12,
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
    targetDirection: new BABYLON.Vector3(0, 0, 1), // Default forward
    hasDirection: false,
    cameraRotation: 0, // -1 for left, 0 for none, 1 for right
    pointerX: 0, // Track pointer X position
    pointerY: 0,  // Track pointer Y position
    previousYaw: 0, // Track previous yaw for turn rate calculation
    yawRate: 0 // Current turn rate (-1 to 1, negative = left, positive = right)
  });

  // BYD Car refs
  const carRootRef = useRef<BABYLON.AbstractMesh | null>(null);
  const carMeshesRef = useRef<BABYLON.AbstractMesh[]>([]);
  const carAnchorRef = useRef<BABYLON.AbstractMesh | null>(null);
  const currentColorRef = useRef<string>("yellow");
  const currentTrimRef = useRef<string>("lightBlue");
  const interiorCameraRef = useRef<BABYLON.ArcRotateCamera | null>(null);
  const isInteriorView = useUI((st) => st.isInteriorView);

  // Guided mode anchor data refs (position + rotation)
  // Anchors are stored as { desktop1, desktop2, desktop3, desktop4, mobile1, mobile2, mobile3, mobile4 }
  const anchorDataRef = useRef<Record<string, AnchorData>>({});



  // BYD Car customization configuration imported from shared file
  // See carConfig.ts



  // Initialize scene once
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    // Detect if mobile
    isMobileRef.current = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      ('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0);
    console.log("📱 Mobile detected:", isMobileRef.current);

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
    scene.fogEnd = 100;

    // Create camera pivot - camera will target this
    const shipPivot = new BABYLON.TransformNode("shipPivot", scene);
    shipPivot.position = BABYLON.Vector3.Zero();
    shipPivotRef.current = shipPivot;

    // Camera (static) - always locked to shipPivot
    const camera = new BABYLON.ArcRotateCamera(
      "cam",
      -Math.PI * 1.5,
      Math.PI / 2,
      24,
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
      camera.lowerRadiusLimit = 18;
      camera.upperRadiusLimit = 18;
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
    console.log("🎯 Control sphere created for mobile input");

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
    root1.position.set(0, 0, 0);
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
    const totalAssets = 7; // 4 logos + planet + rockring + spaceship
    const updateProgress = () => {
      loadedCount++;
      const progress = Math.min((loadedCount / totalAssets) * 100, 100);
      useUI.getState().setLoadingProgress(progress);
      if (loadedCount >= totalAssets) {
        setTimeout(() => {
          useUI.getState().setIsLoading(false);
        }, 1000);
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

          // Debug: Log all mesh names to find anchor_byd
          console.log("🔍 Rockring meshes loaded:", meshes.map(m => m.name).join(", "));
          const anchorByd = meshes.find(m => m.name === "anchor_byd");
          console.log("🔍 anchor_byd found in rockring:", anchorByd ? "YES" : "NO");
          if (anchorByd) {
            console.log("🔍 anchor_byd position:", anchorByd.position);
          }


          // Find the Curve mesh and create particle effect
          const curveMesh = meshes.find(m => m.name === "Curve");
          if (curveMesh) {
            console.log("🌟 Found Curve mesh in rockring2.glb");

            // Get vertices from the curve mesh
            const positions = curveMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            if (positions) {
              const vertexCount = positions.length / 3;
              console.log(`🌟 Curve mesh has ${vertexCount} vertices`);

              // Store vertices in world space
              const worldMatrix = curveMesh.getWorldMatrix();
              const vertices: BABYLON.Vector3[] = [];
              for (let i = 0; i < positions.length; i += 3) {
                const localPos = new BABYLON.Vector3(positions[i], positions[i + 1], positions[i + 2]);
                const worldPos = BABYLON.Vector3.TransformCoordinates(localPos, worldMatrix);
                vertices.push(worldPos);
              }
              console.log(`🌟 Extracted ${vertices.length} vertices from Curve mesh`);

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
                const offsetRange = 10.0; // Adjust this to control spread around vertices
                position.x = randomVertex.x + (Math.random() - 0.5) * offsetRange;
                position.y = randomVertex.y + (Math.random() - 0.5) * offsetRange;
                position.z = randomVertex.z + (Math.random() - 0.5) * offsetRange;
              };
              if (isMobileRef.current) {
                // Particle size - visible but not huge
                curveParticles.minSize = .5;
                curveParticles.maxSize = 2.5;
                curveParticles.emitRate = 200;
              } else {
                // Particle size - visible but not huge
                curveParticles.minSize = 2;
                curveParticles.maxSize = 6;
                curveParticles.emitRate = 600;
              }
              // Rotation randomness
              curveParticles.minInitialRotation = 0;
              curveParticles.maxInitialRotation = Math.PI * 2;

              curveParticles.minLifeTime = 2.5;
              curveParticles.maxLifeTime = 4.5;
              curveParticles.updateSpeed = 0.02;

              // Very slow gentle movement
              curveParticles.minEmitPower = 0.01;
              curveParticles.maxEmitPower = 0.05;

              curveParticles.addColorGradient(0.0, new BABYLON.Color4(0.8, 0.8, 1, 0));
              curveParticles.addColorGradient(0.1, new BABYLON.Color4(.6, 0.6, 0.9, 0.3));
              curveParticles.addColorGradient(0.5, new BABYLON.Color4(.8, 0.6, 0.8, 0.3));
              curveParticles.addColorGradient(0.8, new BABYLON.Color4(.9, 0.5, 0.4, 0.15));
              curveParticles.addColorGradient(1.0, new BABYLON.Color4(1, 0.7, 0.7, 0));

              curveParticles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
              curveParticles.gravity = new BABYLON.Vector3(0, 1, 0);

              // Don't start automatically - will be controlled by state config
              curveParticleSystemRef.current = curveParticles;
              console.log("🌟 Curve particle system created (will start in state 4+)");
            } else {
              console.warn("⚠️ Curve mesh has no position data");
            }

            // Hide the Curve mesh itself
            curveMesh.isVisible = false;
            console.log("🌟 Curve mesh hidden (only particles visible)");
          } else {
            console.warn("⚠️ Curve mesh not found in rockring2.glb");
          }

          rockRing.setEnabled(false); // Hidden by default, shown in state 3
          rockRingRef.current = rockRing;
          updateProgress();
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
        console.log("⚓ Anchors loaded:", meshes.map(m => m.name).join(", "));
        
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
            
            // Get rotation and add 90° to X
            let rotX: number, rotY: number, rotZ: number;
            if (anchor.rotationQuaternion) {
              const euler = anchor.rotationQuaternion.toEulerAngles();
              rotX = euler.x;
              rotY = euler.y;
              rotZ = euler.z;
            } else {
              rotX = anchor.rotation.x;
              rotY = anchor.rotation.y;
              rotZ = anchor.rotation.z;
            }
            
            // Add 90° (PI/2) to X rotation
            const rotation = BABYLON.Quaternion.FromEulerAngles(
              rotX - Math.PI / 2,
              rotY,
              rotZ
            );
            
            // Calculate forward direction from corrected rotation (local Z forward in world space)
            const forward = new BABYLON.Vector3(0, 0, 1);
            forward.rotateByQuaternionToRef(rotation, forward);
            
            anchorDataRef.current[name] = { position, rotation, forward };
            console.log(`⚓ Anchor ${name}:`, { 
              position: position.toString(), 
              rotation: `x:${rotX + Math.PI/2}, y:${rotY}, z:${rotZ}`,
              forward: forward.toString() 
            });
            
            // Hide the anchor mesh
            anchor.isVisible = false;
          } else {
            console.warn(`⚠️ Anchor mesh "${name}" not found in anchors.glb`);
          }
        });
        
        // Hide the root mesh as well
        if (meshes[0]) {
          meshes[0].setEnabled(false);
        }
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
          console.log("📦 ShipRoot loaded at position:", shipRoot.position.clone());
          // Initially place ship behind camera, will animate to correct position when entering state 3
          shipRoot.position.set(0, -4, 20);
          const s = shipRoot.scaling;
          shipRoot.scaling.set(Math.abs(s.x) * 1.1, Math.abs(s.y) * 1.1, Math.abs(s.z) * -1.1);
          shipRoot.rotationQuaternion = shipRoot.rotationQuaternion || BABYLON.Quaternion.Identity();

          // Check if ship mesh has offset inside shipRoot
          console.log("📦 ShipRoot position after set:", shipRoot.position);
          console.log("📦 Spaceship mesh position:", spaceship.position);

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
          console.log("💾 Saved ORIGINAL ship state on load:", {
            position: shipInitialStateRef.current.position,
            rotation: "Identity"
          });
          
          updateProgress();

          // Create engine flame particle systems (two flames with offset)
          const emitter = scene.getTransformNodeByName("engineFlame");
          if (emitter) {
            console.log("🔥 Found engineFlame emitter node");
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

            flame.start();
            flameParticleSystemRef.current = flame;
            console.log("🔥 Engine flame 1 particle system created and started");

            /* // ===== SECOND FLAME (offset in Z) =====
            // Create a second emitter as child of the first emitter
            const emitter2 = new BABYLON.TransformNode("engineFlame2", scene);
            emitter2.parent = emitter;
            emitter2.position.z = FLAME_2_Z_OFFSET; // Offset along local Z axis
            
            const flame2 = new BABYLON.ParticleSystem("engineFlamePS2", 600, scene);
            flame2.particleTexture = new BABYLON.Texture("/assets/textures/muzzle_06.png", scene);
            flame2.emitter = emitter2 as any;
            flame2.updateSpeed = .04;
            flame2.minEmitPower = 0.02;
            flame2.maxEmitPower = 0.05;
            flame2.emitRate = 1000;
            
            flame2.particleEmitterType = new BABYLON.PointParticleEmitter();
            
            // Identical settings to first flame
            flame2.minSize = 0.2;
            flame2.maxSize = 0.5;
            flame2.minInitialRotation = Math.PI * 1;
            flame2.maxInitialRotation = Math.PI * 3;
            flame2.minLifeTime = 0.1;
            flame2.maxLifeTime = 0.2;
            flame2.gravity = new BABYLON.Vector3(0, 0, 0);
            flame2.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
            flame2.color1 = new BABYLON.Color4(1, 0.6, 0.3, 0.5);
            flame2.color2 = new BABYLON.Color4(1, 0.2, 0.6, 0.2);
            flame2.colorDead = new BABYLON.Color4(0, 0, 0.5, 0.2);
            
            flame2.start();
            flameParticleSystem2Ref.current = flame2;
            console.log("🔥 Engine flame 2 particle system created and started at Z offset:", FLAME_2_Z_OFFSET); */
          } else {
            console.warn("⚠️ engineFlame transform node not found in spaceship model");
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

    smoke.minEmitBox = new BABYLON.Vector3(-100, -17, 100);
    smoke.maxEmitBox = new BABYLON.Vector3(100, 7, -100);

    // Color gradients for smoke
    smoke.addColorGradient(0.0, new BABYLON.Color4(0.40, 0.40, 0.88, 0));
    smoke.addColorGradient(0.2, new BABYLON.Color4(0.35, 0.40, 0.88, 0.1));
    smoke.addColorGradient(0.8, new BABYLON.Color4(0.4, 0.25, 0.5, 0.08));
    smoke.addColorGradient(1.0, new BABYLON.Color4(0.3, 0.15, 0.4, 0));

    smoke.minSize = 30;
    smoke.maxSize = 60;
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
      "portal_bydSeagull",
      "BYD Car Visualizer"
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

    // Load BYD car asynchronously (doesn't block loading screen)
    const loadBYDCarAsync = async () => {
      console.log("🚗 Starting BYD car loading (async)...");

      // Wait a bit to ensure rockring and other assets are loaded
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log("🚗 Waited 2s for scene to load, now loading car...");

      const gltfPath = "/assets/models/byd/";
      const carFile = "byd_seagull.gltf";

      try {
        // Load the car model as asset container
        const container = await BABYLON.SceneLoader.LoadAssetContainerAsync(gltfPath, carFile, scene);
        container.addAllToScene();

        console.log("🚗 BYD car model loaded, processing meshes...");

        if (!container.meshes.length) {
          console.error("❌ No meshes found in BYD car model");
          return;
        }

        // Get the root mesh (first mesh in the container)
        const carRoot = container.meshes[0];
        carRootRef.current = carRoot as any; // Store as AbstractMesh
        console.log("🚗 Car root mesh:", carRoot.name);

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

        // Find the anchor_byd mesh from rockring
        console.log("🚗 Searching for anchor_byd mesh...");
        const anchorMesh = scene.getMeshByName("anchor_byd");
        console.log("🚗 Anchor search result:", anchorMesh ? "FOUND" : "NOT FOUND");

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

          // Create interior camera
          if (!interiorCameraRef.current) {
            const offset = new BABYLON.Vector3(0, 13, 0);
            const rotatedOffset = offset.applyRotationQuaternion(carRoot.rotationQuaternion!);
            const targetPos = anchorPos.add(rotatedOffset);

            const iCam = new BABYLON.ArcRotateCamera(
              "interiorCamera",
              0,            // alpha
              Math.PI / 2.2,  // beta
              0,            // radius
              targetPos,
              scene
            );
            iCam.fov = 1.2;
            iCam.minZ = 0.01;
            iCam.lowerRadiusLimit = 0;
            iCam.upperRadiusLimit = 0;

            // Sync rotation with car/anchor
            // We calculate heading from the anchor's forward vector to be robust against scaling/quaternions
            const anchorForward = anchorMesh.forward;
            const heading = Math.atan2(anchorForward.x, anchorForward.z);

            // ArcRotateCamera alpha 0 looks down -X axis (in Babylon left-handed)
            // We want to convert our heading (angle from +Z) to alpha
            // Formula: alpha = -heading - Math.PI/2
            iCam.alpha = -heading - Math.PI / 7.5;

            interiorCameraRef.current = iCam;
          }

          // Hide the anchor mesh but keep it enabled for position tracking
          anchorMesh.isVisible = false;

          console.log(`🚗 BYD car positioned at anchor_byd: (${carRoot.position.x.toFixed(2)}, ${carRoot.position.y.toFixed(2)}, ${carRoot.position.z.toFixed(2)})`);
          console.log(`🚗 Anchor mesh hidden but enabled for distance tracking`);
        } else {
          // Fallback to manual position if anchor not found
          carRoot.position.set(131, -6.7, 50);
          carRoot.scaling.set(1, 1, -1);
          console.warn("⚠️ anchor_byd mesh not found, positioning car at (131, -6.7, 50)");
          console.log(`🚗 Car root position after manual set: (${carRoot.position.x.toFixed(2)}, ${carRoot.position.y.toFixed(2)}, ${carRoot.position.z.toFixed(2)})`);
        }

        // Enable all meshes so the car is visible ONLY if state >= 4
        const shouldBeVisible = useUI.getState().state >= 4;
        carMeshes.forEach(mesh => {
          mesh.setEnabled(shouldBeVisible);
        });

        console.log(`🚗 BYD car loaded successfully! ${carMeshes.length} meshes (enabled and visible)`);
        console.log(`🚗 Final car root position: (${carRoot.position.x.toFixed(2)}, ${carRoot.position.y.toFixed(2)}, ${carRoot.position.z.toFixed(2)})`);

        // Apply initial customization (yellow body, lightBlue trim)
        setTimeout(() => {
          customizeCar({ color: "yellow", trim: "lightBlue" });
        }, 100);
      } catch (error) {
        console.error("❌ Error loading BYD car:", error);
      }
    };

    // Customize car function
    const customizeCar = ({ color, trim }: { color?: string; trim?: string } = {}) => {
      if (!sceneRef.current) return null;

      const carMaterial = sceneRef.current.getMaterialByName("Body_Paint") as BABYLON.PBRMaterial;
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
          console.log(`🎨 Trim ${newTrim} requires color change to ${newColor}`);
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
            console.log(`🎨 Color ${newColor} requires trim change to ${newTrim}`);
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

      console.log(`🎨 Applied customization: ${newColor} / ${newTrim}`);
      return { finalColor: newColor, finalTrim: newTrim };
    };

    // Start loading the car asynchronously (doesn't affect loading screen)
    loadBYDCarAsync();

    // Register customizeCar callback in state so BydCustomizer can call it
    useUI.getState().setBydCustomizeCallback(customizeCar);

    // Distance-based visibility for BYD customizer panel
    const VISIBILITY_DISTANCE = 70; // Show panel when within 100 meters

    scene.onBeforeRenderObservable.add(() => {
      // Early return if ship not loaded yet
      if (!spaceshipRootRef.current) {
        // console.log("⚠️ Ship not loaded yet, skipping distance check");
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
        // console.log("⚠️ Car/anchor not loaded yet");
        return;
      }

      // Calculate distance from SHIP to anchor/car (NOT camera!)
      const shipPosition = spaceshipRootRef.current.getAbsolutePosition();
      const distance = BABYLON.Vector3.Distance(shipPosition, targetPosition);

      // Log distance occasionally for debugging
      if (Math.random() < 0.016) {
        console.log(`📏 SHIP distance to car: ${distance.toFixed(2)}m (threshold: ${VISIBILITY_DISTANCE}m)`);
        console.log(`   Ship pos: (${shipPosition.x.toFixed(1)}, ${shipPosition.y.toFixed(1)}, ${shipPosition.z.toFixed(1)})`);
        console.log(`   Car pos: (${targetPosition.x.toFixed(1)}, ${targetPosition.y.toFixed(1)}, ${targetPosition.z.toFixed(1)})`);
      }

      // Show/hide panel based on distance using state
      const shouldBeVisible = distance <= VISIBILITY_DISTANCE;
      const currentlyVisible = useUI.getState().bydCustomizerVisible;

      if (shouldBeVisible && !currentlyVisible) {
        useUI.getState().setBydCustomizerVisible(true);
        console.log(`🚗 BYD customizer panel shown (SHIP distance to anchor: ${distance.toFixed(2)}m)`);
      } else if (!shouldBeVisible && currentlyVisible) {
        useUI.getState().setBydCustomizerVisible(false);
        console.log(`🚗 BYD customizer panel hidden (SHIP distance to anchor: ${distance.toFixed(2)}m)`);
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
      mouseRotationRef.current.x = (beta / 180) * .6;
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

    console.log("🚀 Spaceship controls effect triggered", { s, navigationMode, spaceship: !!spaceship });

    const ShipControls = shipControlsRef.current;
    const flame = flameParticleSystemRef.current;

    // Only enable controls in states 4-7 with free mode
    const inFreeExploreState = s >= S.state_4 && s <= S.state_7;
    const shouldEnableControls = inFreeExploreState && navigationMode === 'free' && !isInteriorView;

    console.log("🚀 Control state:", { inFreeExploreState, navigationMode, shouldEnableControls });

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
      console.log("🚀 Disabling controls - playing idle animation");

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
          console.log("🎬 Playing IDLE animation in guided mode");
        }
      }

      return;
    }

    // Enable controls in free mode (with delay if ship is animating)
    if (!spaceship) {
      console.log("🚀 No spaceship found, cannot enable controls");
      return;
    }

    // Store handlers for cleanup (must be outside setTimeout)
    let handleKeyDown: ((e: KeyboardEvent) => void) | null = null;
    let handleKeyUp: ((e: KeyboardEvent) => void) | null = null;
    let handlePointerDown: ((e: PointerEvent) => void) | null = null;
    let handlePointerMove: ((e: PointerEvent) => void) | null = null;
    let handlePointerUp: ((e: PointerEvent) => void) | null = null;

    // Delay enabling controls until ship animation completes
    console.log(`🚀 Delaying ship controls by ${totalShipAnimTime}ms to let ship animation complete`);
    const controlsTimeoutId = setTimeout(() => {
      console.log("🚀 Ship animation complete - enabling free mode controls");

      // Get shipRoot - this is required now
      let shipRoot = spaceshipRootRef.current;
      if (!shipRoot) {
        shipRoot = scene.getTransformNodeByName("shiproot");
        if (shipRoot) {
          console.log("🚀 Found shiproot in scene");
          spaceshipRootRef.current = shipRoot;
          shipRoot.rotationQuaternion = shipRoot.rotationQuaternion || BABYLON.Quaternion.Identity();
        } else {
          console.error("❌ shiproot not found! Cannot enable controls. Make sure shiproot is exported from Blender.");
          return;
        }
      }

      // Always use shipRoot as control target
      const controlTarget = shipRoot;
      console.log("🚀 Control target:", controlTarget.name, "Position:", controlTarget.position);
      console.log("🚀 Control target scaling:", controlTarget.scaling);
      console.log("🚀 Control target rotation:", controlTarget.rotation);

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
        console.log("🚀 Initialized control angles from ship rotation:", { pitch: ShipControls.pitch, yaw: ShipControls.yawTarget });
      }

      // Setup camera following - parent pivot to shipRoot at rotation center
      const shipPivot = shipPivotRef.current;

      if (shipPivot && shipPivot.parent !== controlTarget) {
        console.log("📷 Parenting shipPivot to shipRoot at center");
        shipPivot.setParent(controlTarget);
        // Different position for mobile vs desktop
        const pivotY = isMobileRef.current ? 1.17 : 0.9;
        shipPivot.position.set(0, pivotY, 0);
        shipPivot.rotationQuaternion = BABYLON.Quaternion.Identity();
        console.log(`📱 Ship pivot Y offset: ${pivotY} (mobile: ${isMobileRef.current})`);


        // Parent smoke emitter to shipPivot so it follows the ship (like prototype)
        const smokeEmitter = smokeEmitterRef.current;
        if (smokeEmitter && !smokeEmitter.parent) {
          smokeEmitter.parent = shipPivot;
          console.log("💨 Smoke emitter parented to shipPivot - will follow ship");
        }

        // Camera targets the center pivot (ship rotates correctly around its center)
        if (camera) {
          camera.lockedTarget = shipPivot;

          // Adjust camera beta (vertical angle) to look down at the ship from above
          // Beta of Math.PI/2 = horizontal, smaller values = looking down from above
          // Look down at about 82 degrees

          console.log("📷 Camera locked to shipPivot");
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
      console.log("🎬 ALL animation groups in scene:", scene.animationGroups.map(g => g.name));

      const A = grab();
      console.log("🎬 Animation groups found:", {
        forward: A.fwd ? A.fwd.name : "NOT FOUND",
        stop: A.brk ? A.brk.name : "NOT FOUND",
        turnLeft: A.L ? A.L.name : "NOT FOUND",
        turnRight: A.R ? A.R.name : "NOT FOUND",
        idle: A.I ? A.I.name : "NOT FOUND"
      });

      // Setup animation groups if they exist
      if (A.fwd && A.brk && A.L && A.R && A.I) {
        console.log("🎬 ✅ All animations found! Setting up blending...");
        Object.values(A).forEach(g => {
          if (g) {
            g.enableBlending = true;
            g.blendingSpeed = 0.06;
            g.loopAnimation = true;
            g.stop();
            g.reset();
            console.log(`🎬 Configured animation: ${g.name}`);
          }
        });
        A.I.play(true); // Start with idle
        console.log("🎬 ▶️ Playing IDLE animation");
      } else {
        console.warn("⚠️ Some animation groups are missing!");
        if (!A.fwd) console.warn("   Missing: forward");
        if (!A.brk) console.warn("   Missing: stop");
        if (!A.L) console.warn("   Missing: turnLeft");
        if (!A.R) console.warn("   Missing: turnRight");
        if (!A.I) console.warn("   Missing: idle");
        console.warn("   Controls will work without animations");
      }

      console.log("🔥 Flame particle system:", !!flame);
      if (flame) {
        console.log("🔥 Flame emitter:", flame.emitter);
      }

      // Keyboard listeners
      handleKeyDown = (e: KeyboardEvent) => {
        ShipControls.keys[e.key.toLowerCase()] = true;
      };

      handleKeyUp = (e: KeyboardEvent) => {
        ShipControls.keys[e.key.toLowerCase()] = false;
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);

      canvas.tabIndex = 1;
      canvas.focus();

      // Mobile drag control handlers
      const MC = mobileControlRef.current;

      handlePointerDown = (e: PointerEvent) => {
        if (!isMobileRef.current) return; // Only for mobile
        MC.isDragging = true;
        MC.yawRate = 0; // Reset turn rate when starting drag
      };

      handlePointerMove = (e: PointerEvent) => {
        if (!isMobileRef.current || !MC.isDragging) return;

        // Just update pointer position - raycasting happens in render loop
        MC.pointerX = e.clientX;
        MC.pointerY = e.clientY;
      };

      handlePointerUp = (e: PointerEvent) => {
        if (!isMobileRef.current) return;
        MC.isDragging = false;
        MC.hasDirection = false;
        MC.cameraRotation = 0; // Stop camera rotation
        MC.yawRate = 0; // Reset turn rate
        MC.previousYaw = 0; // Reset previous yaw
        console.log("📱 Mobile drag ended");
      };

      canvas.addEventListener('pointerdown', handlePointerDown);
      canvas.addEventListener('pointermove', handlePointerMove);
      canvas.addEventListener('pointerup', handlePointerUp);
      canvas.addEventListener('pointercancel', handlePointerUp);

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

        // Mobile drag control: Update direction and edge rotation every frame
        if (isMobileRef.current && MC.isDragging) {
          // Check if pointer is near screen edges (5% threshold)
          const screenWidth = window.innerWidth;
          const edgeThreshold = screenWidth * 0.1;

          if (MC.pointerX < edgeThreshold) {
            MC.cameraRotation = -1; // Rotate left
          } else if (MC.pointerX > screenWidth - edgeThreshold) {
            MC.cameraRotation = 1; // Rotate right
          } else {
            MC.cameraRotation = 0; // No edge rotation
          }

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

        // Camera edge rotation (when dragging near screen edges)
        if (camera && MC.cameraRotation !== 0) {
          const rotationSpeed = 1.5; // Radians per second
          camera.alpha -= MC.cameraRotation * rotationSpeed * dt;
        }

        frameCount++;

        // Mobile vs Desktop controls
        if (isMobileRef.current) {
          // ========== MOBILE CONTROLS ==========
          // Rotation and movement are both based on drag direction

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
        } else {
          // ========== DESKTOP CONTROLS ==========
          // Yaw from A/D (D=right, A=left)
          const turnIn = ((K["d"] || K["arrowright"]) ? 1 : 0) -
            ((K["a"] || K["arrowleft"]) ? 1 : 0);

          // Pitch from Q/E with easing (E=up, Q=down)
          const pitchIn = (K["q"] ? 1 : 0) - (K["e"] ? 1 : 0);
          const targetPitchVel = pitchIn * PITCH_RATE;
          ShipControls.pitchVel += (targetPitchVel - ShipControls.pitchVel) * Math.min(1, dt * SMOOTH);
          ShipControls.pitch -= ShipControls.pitchVel * dt;

          // Yaw accumulation from A/D
          ShipControls.yawTarget -= turnIn * PITCH_RATE * dt;

          // Ship orientation - ABSOLUTE rotation from accumulated angles (like prototype)
          const qYaw = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, ShipControls.yawTarget);
          const qPitch = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.X, ShipControls.pitch);
          const qFinal = qYaw.multiply(qPitch);

          // Apply rotation directly without Slerp for immediate response
          controlTarget.rotationQuaternion = qFinal;

          // Choose & blend animation
          const BLEND_PER_SEC = 4;
          const wStep = BLEND_PER_SEC * dt;

          const forwardKey = K["w"] || K["arrowup"];
          const brakeKey = K["s"] || K["arrowdown"];

          if (A.fwd && A.brk && A.L && A.R && A.I) {
            if (turnIn < 0) play(A.L, wStep);
            else if (turnIn > 0) play(A.R, wStep);
            else if (brakeKey) play(A.brk, wStep);
            else if (forwardKey) play(A.fwd, wStep);
            else play(A.I, wStep);
          }

          // Smooth Shift throttle
          const wantSpeed = K["shift"] ? ShipControls.speed * ShipControls.speedK : ShipControls.speed;
          ShipControls.v += (wantSpeed - ShipControls.v) * Math.min(1, dt * 5);

          // Movement with velocity smoothing (inertia/momentum)
          const throttle = forwardKey && !brakeKey ? 1 :
            forwardKey && brakeKey ? 0.5 : 0;

          // Calculate target velocity direction
          let targetVelocity = new BABYLON.Vector3(0, 0, 0);

          if (throttle > 0) {
            // Get forward direction (already includes pitch rotation for circular motion)
            const forwardVector = new BABYLON.Vector3(0, 0, 1);

            const dir = BABYLON.Vector3.TransformNormal(
              forwardVector,
              controlTarget.getWorldMatrix()
            ).normalize();

            // Invert X axis to fix left-right direction (like prototype)
            dir.x *= -1;

            // Target velocity in the forward direction
            targetVelocity = dir.scale(ShipControls.v * 1 * throttle);
          }

          // Smoothly interpolate current velocity toward target velocity
          // When throttle > 0: accelerate toward target
          // When throttle = 0: drag slows down to zero
          const interpSpeed = throttle > 0 ? ShipControls.acceleration : ShipControls.drag;
          ShipControls.velocity.x += (targetVelocity.x - ShipControls.velocity.x) * Math.min(1, dt * interpSpeed);
          ShipControls.velocity.y += (targetVelocity.y - ShipControls.velocity.y) * Math.min(1, dt * interpSpeed);
          ShipControls.velocity.z += (targetVelocity.z - ShipControls.velocity.z) * Math.min(1, dt * interpSpeed);

          // Apply velocity to position
          const movement = ShipControls.velocity.scale(dt);
          controlTarget.position.addInPlace(movement);

        }
      });

    }, totalShipAnimTime); // Close setTimeout

    return () => {
      clearTimeout(controlsTimeoutId);

      // Clean up keyboard listeners if they were added
      if (handleKeyDown) window.removeEventListener('keydown', handleKeyDown);
      if (handleKeyUp) window.removeEventListener('keyup', handleKeyUp);

      // Clean up pointer event listeners (mobile control) if they were added
      if (canvas) {
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

    console.log('🎬 [State Change] Camera update triggered for state:', s);

    const isMobile = window.innerWidth < 768; // md breakpoint
    const cameraConfig = config.canvas.babylonCamera;
    if (cameraConfig) {
      const lowerLimit = isMobile ? cameraConfig.lowerRadiusLimit.mobile : cameraConfig.lowerRadiusLimit.desktop;
      const upperLimit = isMobile ? cameraConfig.upperRadiusLimit.mobile : cameraConfig.upperRadiusLimit.desktop;

      // Get beta and alpha from config if available
      const targetBeta = cameraConfig.beta ? (isMobile ? cameraConfig.beta.mobile : cameraConfig.beta.desktop) : undefined;
      const targetAlpha = cameraConfig.alpha ? (isMobile ? cameraConfig.alpha.mobile : cameraConfig.alpha.desktop) : undefined;

      console.log('📋 [Camera Config]', {
        state: s,
        isMobile,
        lowerLimit,
        upperLimit,
        targetBeta,
        targetAlpha,
        betaDegrees: targetBeta ? (targetBeta * 180 / Math.PI).toFixed(1) : 'N/A',
        alphaDegrees: targetAlpha ? (targetAlpha * 180 / Math.PI).toFixed(1) : 'N/A'
      });

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
      camera.lowerRadiusLimit = 18;
      camera.upperRadiusLimit = 18;
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
    const isComingFromState3 = prevState === S.state_3 && s === S.state_2; // State 3 → State 2
    const isComingFromExploreToState3 = wasInExploreState && s === S.state_3; // States 4-7 → State 3
    const isGoingToStateFinal = s === S.state_final; // Any state → State Final
    const isGoingToState3 = prevState === S.state_2 && s === S.state_3; // State 2 → State 3
    const isGoingToState4 = prevState === S.state_3 && s === S.state_4; // State 3 → State 4


    // Handle logo visibility based on config with delay when coming from state 3
    if (isComingFromState3 && sceneConfig.logoEnabled) {
      // Disable logo initially, enable after delay
      logosRoot.setEnabled(false);
      setTimeout(() => {
        logosRoot.setEnabled(true);
      }, 400); // 0.4 second delay
    } else {
      logosRoot.setEnabled(sceneConfig.logoEnabled);
    }

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

    // Use config value for transform delay only when coming from state 3 to state 2
    const transformDelay = isComingFromState3 ? (sceneConfig.transformAnimationDelay ?? 0) : 0;

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
        console.log("🌟 Curve particles started (state 4+)");
      } else if (!shouldEnableCurveParticles && curveParticles.isStarted()) {
        curveParticles.stop();
        curveParticles.reset(); // Immediately kill all active particles
        console.log("🌟 Curve particles stopped and reset (state 3 or less)");
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
        console.log("📷 Parenting shipPivot to shipRoot for explore state");
        animShipPivot.setParent(animShipRoot);
        const pivotY = isMobile ? 1.17 : 0.9;
        animShipPivot.position.set(0, pivotY, 0);
        animShipPivot.rotationQuaternion = BABYLON.Quaternion.Identity();
        
        if (camera) {
          camera.lockedTarget = animShipPivot;
        }
      }

      // Check if coming FROM guided state (4-7) TO any non-explore state while in guided mode
      // This includes state_0, state_1, state_2, state_3, and state_final
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
          console.log("💨 [Leaving Guided] Smoke emitter parented to shipPivot");
        }
        
        // Camera radius for travel (use destination state's lower limit)
        const cameraConfig = config.canvas.babylonCamera;
        const stateRadius = isMobile 
          ? cameraConfig?.lowerRadiusLimit?.mobile ?? 12 
          : cameraConfig?.lowerRadiusLimit?.desktop ?? 12;
        
        // Determine state name for logging
        const stateNames: Record<number, string> = {
          [S.state_0]: 'state_0',
          [S.state_1]: 'state_1', 
          [S.state_2]: 'state_2',
          [S.state_3]: 'state_3',
          [S.state_final]: 'state_final'
        };
        
        console.log(`⚓ [Leaving Guided] Bezier animation to ${stateNames[s] || `state_${s}`}:`, {
          startPos: startPosition.toString(),
          endPos: endPosition.toString(),
          stateRadius
        });
        
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
          skipArrivalHide: true  // Don't hide ship (state config handles visibility)
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
            console.log("💨 [Guided Mode] Smoke emitter parented to shipPivot");
          }
          
          // Get camera radius from state config for zoom-out during travel
          const cameraConfig = config.canvas.babylonCamera;
          const stateRadius = isMobile 
            ? cameraConfig?.lowerRadiusLimit?.mobile ?? 24 
            : cameraConfig?.lowerRadiusLimit?.desktop ?? 24;
          
          console.log(`⚓ [Guided Mode] Bezier animation to anchor ${anchorKey}:`, {
            startPos: startPosition.toString(),
            endPos: anchorData.position.toString(),
            startForward: startForward.toString(),
            endForward: anchorData.forward.toString(),
            stateRadius
          });
          
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
            stateRadius
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
        let targetPos: { x: number; y: number; z: number } | undefined;
        
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

          console.log(`🚀 [Ship Animation] State ${prevState} → State ${s} (${isMobile ? 'mobile' : 'desktop'}, ${currentNavigationMode}):`, {
            targetPosition: targetPos,
            duration,
            delay,
            fromState: prevState,
            toState: s
          });

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
          console.log(`🚀 [Ship Animation] State ${prevState} → State ${s}: No ship config, moving behind camera`);
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

        console.log(`🌫️ [Fog Animation] State ${prevState} → State ${s}:`, {
          currentFogEnd: scene.fogEnd,
          currentFogStart: scene.fogStart,
          targetFogEnd: fogEnd,
          targetFogStart: fogStart,
          duration,
          delay,
          fromState: prevState,
          toState: s
        });

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
        
        console.log("🔄 Restored ship to original state:", {
          position: controlTarget.position,
          rotation: "Identity"
        });
      }

      // Reset camera to initial default rotation (same as scene initialization)
      if (camera) {
        camera.alpha = -Math.PI * 1.5;
        camera.beta = Math.PI / 2;
        console.log("🔄 Reset camera to initial rotation - alpha:", camera.alpha, "beta:", camera.beta);
      }

      // Reset ship pivot
      if (pivotToReset && pivotToReset.parent) {
        pivotToReset.setParent(null);
        pivotToReset.position.set(0, 0, 0);
        console.log("🔄 Reset ship pivot (leaving explore states)");
      }

      // Reset smoke emitter
      const smokeEmitter = smokeEmitterRef.current;
      if (smokeEmitter && smokeEmitter.parent) {
        smokeEmitter.parent = null;
        smokeEmitter.position.set(0, 0, 25);
        console.log("🔄 Reset smoke emitter (leaving explore states)");
      }

      // Keep camera locked to shipPivot (don't unlock)
      if (camera && !camera.lockedTarget) {
        camera.lockedTarget = pivotToReset;
        console.log("🔄 Ensuring camera stays locked to shipPivot");
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

        // Enable with invisible materials
        spaceshipMaterials.forEach(mat => mat.alpha = 0.01);
        spaceshipContainer.setEnabled(true);

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

        // Disable after fade completes
        setTimeout(() => {
          spaceshipContainer.setEnabled(false);
        }, duration * 1000);
      }
    }

    // Handle camera controls - managed by navigation mode in a separate effect
    // (see useEffect below that watches navigationMode)

    // Handle state 3 - rockring fade in (only once)
    // Handle rockring visibility and animation (State 3+)
    if (s >= S.state_3 && rockRing) {
      // Ensure enabled
      if (!rockRing.isEnabled()) {
        rockRing.setEnabled(true);
      }

      // Initial fade-in
      if (!rockRingHasShownRef.current) {
        rockRingHasShownRef.current = true;

        const fps = 60;
        const duration = 1; // seconds
        const totalFrames = fps * duration;

        // Play animation
        if (rockRingAnimationGroups.length > 0) {
          const animGroup = rockRingAnimationGroups[0];
          animGroup.start(true, 1.7, 1, 2000);
        }

        // Gather materials from rockRing and its children
        const materials: BABYLON.Material[] = [];
        rockRing.getChildMeshes().forEach(mesh => {
          if (mesh.material) {
            materials.push(mesh.material);
          }
        });
        if (rockRing.material) {
          materials.push(rockRing.material);
        }

        // Fade in animation for all materials
        materials.forEach(material => {
          material.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;

          const fromAlpha = 0.01;
          const toAlpha = 1;
          material.alpha = fromAlpha;

          const alphaAnimation = new BABYLON.Animation(
            "fadeAlpha",
            "alpha",
            fps,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
          );

          alphaAnimation.setKeys([
            { frame: 0, value: fromAlpha },
            { frame: totalFrames, value: toAlpha }
          ]);

          const easingAlpha = new BABYLON.CubicEase();
          easingAlpha.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
          alphaAnimation.setEasingFunction(easingAlpha);

          material.animations = [alphaAnimation];
          scene.beginAnimation(material, 0, totalFrames, false);
        });
      } else {
        // Ensure animation is playing if it stopped (e.g. switching back from state 4 to 3)
        if (rockRingAnimationGroups.length > 0) {
          const animGroup = rockRingAnimationGroups[0];
          if (!animGroup.isPlaying) {
            animGroup.start(true, 1.7, 1, 2000);
          }
        }
      }
    }

    if (s === S.state_2) { // State 2 (index 2)
      // State 2: Scale down logos, move them
      logosRoot.scaling.set(0.25, 0.25, 0.25);
      logosRoot.position.set(0, 1.25, 4);

      // Fade in logos when coming from state 3
      if (isComingFromState3) {
        const logoModels = logoModelsRef.current;
        const currentLogoModel = logoModels[selectedLogoModel];

        if (currentLogoModel) {
          const logoMaterials: BABYLON.Material[] = [];
          currentLogoModel.getChildMeshes().forEach(mesh => {
            if (mesh.material) {
              logoMaterials.push(mesh.material);
            }
          });
          if (currentLogoModel.material) {
            logoMaterials.push(currentLogoModel.material);
          }

          const logoMaterialDelay = (sceneConfig.materialAnimationDelay ?? 0) * 1000;

          const animateLogo = () => {
            const fps = 60;
            const duration = 1.0; // 1 second fade
            const totalFrames = fps * duration;

            logoMaterials.forEach(mat => {
              mat.alpha = 0.01;

              const alphaAnimation = new BABYLON.Animation(
                "fadeInLogo",
                "alpha",
                fps,
                BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
              );

              alphaAnimation.setKeys([
                { frame: 0, value: 0.01 },
                { frame: totalFrames, value: 1 }
              ]);

              const easingAlpha = new BABYLON.CubicEase();
              easingAlpha.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
              alphaAnimation.setEasingFunction(easingAlpha);

              mat.animations = [alphaAnimation];
              scene.beginAnimation(mat, 0, totalFrames, false, 1, () => {
                mat.alpha = 1;
              });
            });
          };

          if (logoMaterialDelay > 0) {
            setTimeout(animateLogo, logoMaterialDelay);
          } else {
            animateLogo();
          }
        }
      }

      if (material) {
        // Get target rotation for current continent
        const currentContinent = useUI.getState().selectedContinent;
        const targetRotation = planetRotations[currentContinent]
          ? planetRotations[currentContinent].clone()
          : new BABYLON.Vector3(0, 0, 0);
        targetRotation.y += Math.PI;

        // Set initial rotation to opposite side (flip X and Y by 180 degrees)
        const fromRotation = new BABYLON.Vector3(
          targetRotation.x + Math.PI / 2,
          targetRotation.y + Math.PI / 2,
          targetRotation.z
        );
        planet.rotation = fromRotation;

        // Use config value for material animation delay only when coming from state 3
        const materialDelay = isComingFromState3 ? (sceneConfig.materialAnimationDelay ?? 0) * 1000 : 0;

        const animatePlanet = () => {
          // Enable planet with invisible material right before animation
          material.alpha = 0.01;
          planet.setEnabled(true);

          // Fade in animation
          const fps = 60;
          const duration = 1.5; // seconds
          const totalFrames = fps * duration;

          const alphaAnimation = new BABYLON.Animation(
            "fadeInPlanet",
            "alpha",
            fps,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
          );

          alphaAnimation.setKeys([
            { frame: 0, value: 0.01 },
            { frame: totalFrames, value: 1 }
          ]);

          const easingAlpha = new BABYLON.CubicEase();
          easingAlpha.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
          alphaAnimation.setEasingFunction(easingAlpha);

          material.animations = [alphaAnimation];
          scene.beginAnimation(material, 0, totalFrames, false, 1, () => {
            material.alpha = 1;
          });

          // Rotation animation during fade in
          const rotationAnimation = new BABYLON.Animation(
            "rotateInPlanet",
            "rotation",
            fps,
            BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
          );

          rotationAnimation.setKeys([
            { frame: 0, value: fromRotation },
            { frame: totalFrames, value: targetRotation }
          ]);

          const easingRot = new BABYLON.CubicEase();
          easingRot.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
          rotationAnimation.setEasingFunction(easingRot);

          planet.animations = [rotationAnimation];
          scene.beginAnimation(planet, 0, totalFrames, false);
        };

        if (materialDelay > 0) {
          setTimeout(animatePlanet, materialDelay);
        } else {
          animatePlanet();
        }
      }
    } else {
      // States 0, 1, 3: Normal logo size and position, fade out and hide planet
      logosRoot.scaling.set(1, 1, 1);
      logosRoot.position.set(0, 0, 0);

      if (material && planet.isEnabled()) {
        // Fade out animation
        const fps = 60;
        const duration = 0.6; // seconds
        const totalFrames = fps * duration;

        material.alpha = 1;

        const alphaAnimation = new BABYLON.Animation(
          "fadeOutPlanet",
          "alpha",
          fps,
          BABYLON.Animation.ANIMATIONTYPE_FLOAT,
          BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        alphaAnimation.setKeys([
          { frame: 0, value: 1 },
          { frame: totalFrames / 1.5, value: 0.01 }
        ]);

        const easingAlpha = new BABYLON.CubicEase();
        easingAlpha.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEIN);
        alphaAnimation.setEasingFunction(easingAlpha);

        material.animations = [alphaAnimation];
        scene.beginAnimation(material, 0, totalFrames / 1.5, false, 1, () => {
          planet.setEnabled(false);
          material.alpha = 1;
        });

        // Rotation animation during fade out (rotate to opposite)
        const currentRotation = planet.rotation.clone();
        const toRotation = new BABYLON.Vector3(
          currentRotation.x + Math.PI,
          currentRotation.y + Math.PI,
          currentRotation.z
        );

        const rotationAnimation = new BABYLON.Animation(
          "rotateOutPlanet",
          "rotation",
          fps,
          BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
          BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        rotationAnimation.setKeys([
          { frame: 0, value: currentRotation },
          { frame: totalFrames, value: toRotation }
        ]);

        const easingRot = new BABYLON.CubicEase();
        easingRot.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEIN);
        rotationAnimation.setEasingFunction(easingRot);

        planet.animations = [rotationAnimation];
        scene.beginAnimation(planet, 0, totalFrames, false);
      } else {
        planet.setEnabled(false);
      }
    }

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

    // Only enable controls in states 4-7 with free mode
    const inFreeExploreState = s >= S.state_4 && s <= S.state_7;
    const shouldEnableControls = inFreeExploreState; // && navigationMode === 'free';

    if (shouldEnableControls) {
      // Get camera animation duration to delay enabling controls until animation completes
      const cameraConfig = config.canvas.babylonCamera;
      const animDuration = cameraConfig?.animationDuration ?? 0.4;
      const animDelay = cameraConfig?.animationDelay ?? 0;
      const totalAnimTime = (animDuration + animDelay) * 1000; // Convert to ms

      // Wait for camera animation to complete before enabling controls
      const timeoutId = setTimeout(() => {
        camera.inputs.addMouseWheel();
        camera.inputs.addPointers();
        camera.attachControl(canvas, true);
      }, totalAnimTime);

      return () => clearTimeout(timeoutId);
    } else {
      camera.detachControl();
      camera.inputs.clear();
    }
  }, [s, navigationMode]);

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
          console.log("📷 [Mode Toggle] Parenting shipPivot to shipRoot for guided mode animation");
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
          console.log("💨 [Mode Toggle] Smoke emitter parented to shipPivot for guided mode");
        }
        
        // Get camera radius from state config for zoom-out during travel
        const cameraConfig = config.canvas.babylonCamera;
        const stateRadius = isMobile 
          ? cameraConfig?.lowerRadiusLimit?.mobile ?? 24 
          : cameraConfig?.lowerRadiusLimit?.desktop ?? 24;
        
        console.log(`⚓ [Mode Toggle] Animating to anchor ${anchorKey}:`, {
          startPos: startPosition.toString(),
          endPos: anchorData.position.toString(),
          stateRadius
        });
        
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
          stateRadius
        });
      } else {
        console.warn(`⚠️ [Mode Toggle] Anchor ${anchorKey} not found`);
      }
    }
    
    // Switching from GUIDED to FREE mode in states 4-7
    if (prevMode === 'guided' && navigationMode === 'free' && 
        s >= S.state_4 && s <= S.state_7 && 
        scene && camera) {
      
      // Restore ship visibility (it may have been hidden after guided mode arrival)
      const shipRoot = spaceshipRootRef.current;
      if (shipRoot) {
        shipRoot.getChildMeshes().forEach(mesh => mesh.visibility = 1);
        console.log("👁️ [Mode Toggle] Ship visibility restored for free mode");
      }
      
      // Animate camera radius limits back to state values for free exploration
      const cameraConfig = config.canvas.babylonCamera;
      const lowerLimit = isMobile 
        ? cameraConfig?.lowerRadiusLimit?.mobile ?? 2 
        : cameraConfig?.lowerRadiusLimit?.desktop ?? 5;
      const upperLimit = isMobile 
        ? cameraConfig?.upperRadiusLimit?.mobile ?? 20 
        : cameraConfig?.upperRadiusLimit?.desktop ?? 50;
      
      console.log(`🔓 [Mode Toggle] Restoring camera radius for free mode:`, {
        lowerLimit,
        upperLimit
      });
      
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

  // Handle car visibility based on state
  useEffect(() => {
    if (carMeshesRef.current.length > 0) {
      const shouldBeVisible = s >= S.state_4 && s <= S.state_7; // States 4-7
      carMeshesRef.current.forEach(mesh => mesh.setEnabled(shouldBeVisible));

      // If car becomes hidden, exit interior view
      if (!shouldBeVisible && useUI.getState().isInteriorView) {
        useUI.getState().setIsInteriorView(false);
      }
    }
  }, [s]);

  // Handle interior view toggle
  useEffect(() => {
    if (!sceneRef.current || !interiorCameraRef.current || !cameraRef.current) return;

    const glassMesh = sceneRef.current.getMeshByName("byd_glass");

    if (isInteriorView) {
      sceneRef.current.activeCamera = interiorCameraRef.current;
      interiorCameraRef.current.attachControl(ref.current, true);
      cameraRef.current.detachControl();

      // Disable glass in interior view
      if (glassMesh) glassMesh.setEnabled(false);
    } else {
      sceneRef.current.activeCamera = cameraRef.current;
      cameraRef.current.attachControl(ref.current, true);
      interiorCameraRef.current.detachControl();

      // Enable glass in exterior view
      if (glassMesh) glassMesh.setEnabled(true);
    }
  }, [isInteriorView]);

  return <canvas ref={ref} className="block w-full h-full" />;
}