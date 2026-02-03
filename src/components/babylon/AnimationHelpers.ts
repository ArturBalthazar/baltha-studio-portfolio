/**
 * AnimationHelpers - Universal animation utility functions for Babylon.js
 * 
 * This module contains reusable animation functions for transforms, camera, and fog.
 */

import * as BABYLON from "babylonjs";

// Universal transform animation options
export interface AnimateTransformOptions {
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

export function animateTransform(options: AnimateTransformOptions): void {
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

// Universal camera radius limits animation options
export interface AnimateCameraRadiusOptions {
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

export function animateCameraRadius(options: AnimateCameraRadiusOptions): void {
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

// Universal fog animation options
export interface AnimateFogOptions {
    scene: BABYLON.Scene;
    duration: number; // in seconds
    delay?: number; // delay before animation starts (in seconds)
    fogStart?: number;
    fogEnd?: number;
    easing?: BABYLON.EasingFunction;
    onComplete?: () => void;
}

export function animateFog(options: AnimateFogOptions): void {
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
