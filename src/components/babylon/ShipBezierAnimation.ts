/**
 * ShipBezierAnimation - Guided mode ship animation along bezier curves
 * 
 * This module handles the smooth animation of the spaceship between anchor points
 * in guided navigation mode. It includes:
 * - Cubic bezier curve path calculation
 * - Velocity tracking for smooth speed transitions
 * - Camera zoom animations (zoom out during travel, zoom in on arrival)
 * - Ship visibility management with flame particles
 * - Drag deceleration when cancelling mid-animation
 */

import * as BABYLON from "babylonjs";
import { useUI } from "../../state";
import { updateEngineVelocity, setGuidedAnimationActive } from "../EngineSoundManager";

// Guided mode bezier animation options
export interface AnimateShipAlongBezierOptions {
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
 * Sets the visibility of the ship and flame particles together.
 * This ensures they are always in sync - either both visible or both hidden.
 * NEVER toggle ship visibility without using this function!
 */
export interface SetShipAndFlamesVisibilityOptions {
    shipMeshes?: BABYLON.AbstractMesh[];
    container?: BABYLON.TransformNode | BABYLON.AbstractMesh;
    flameParticles: BABYLON.ParticleSystem | null | undefined;
    visible: boolean;
    method?: 'visibility' | 'enabled';
    logContext?: string;
}

export function setShipAndFlamesVisibility(options: SetShipAndFlamesVisibilityOptions): void {
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
 * Cancels any running bezier animation by invalidating its ID and cleaning up observers.
 * Call this when switching to free mode to immediately stop the guided mode animation.
 * Applies a smooth drag deceleration so the ship coasts to a stop instead of stopping abruptly.
 * @param scene - The Babylon scene (needed to stop animations)
 * @param target - The ship transform node (optional, to stop its animations)
 * @param camera - The camera (optional, to stop camera animations)
 */
export function cancelBezierAnimation(
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

    // Notify engine sound manager that guided animation is no longer active
    setGuidedAnimationActive(false);
    // Keep current velocity for engine sound (free mode will take over tracking)
    updateEngineVelocity(capturedSpeed);

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
 * Animates the ship along a cubic bezier curve from current position/rotation to target.
 * The bezier curve is calculated at runtime based on start/end positions and forward directions.
 * Control points are placed along the forward directions to create a smooth flight path.
 */
export function animateShipAlongBezier(options: AnimateShipAlongBezierOptions): void {
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
        setGuidedAnimationActive(true); // Notify engine sound that animation is starting
        bezierVelocityObserver = scene.onBeforeRenderObservable.add(() => {
            if (thisAnimationId !== currentBezierAnimationId) {
                // This animation was superseded, clean up observer
                if (bezierVelocityObserver) {
                    scene.onBeforeRenderObservable.remove(bezierVelocityObserver);
                    bezierVelocityObserver = null;
                }
                setGuidedAnimationActive(false); // Animation ended
                updateEngineVelocity(0); // Reset velocity
                return;
            }

            const currentPos = target.position.clone();
            if (shipLastPosition) {
                const deltaTime = scene.getEngine().getDeltaTime() / 1000;
                if (deltaTime > 0) {
                    shipCurrentVelocity = currentPos.subtract(shipLastPosition).scale(1 / deltaTime);
                    shipCurrentSpeed = shipCurrentVelocity.length();
                    // Report velocity to engine sound manager
                    updateEngineVelocity(shipCurrentSpeed);
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
                // Notify engine sound manager that animation ended
                setGuidedAnimationActive(false);
                updateEngineVelocity(0);
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
