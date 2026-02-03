/**
 * AtomIndicator - A 3D atom visualization with rotating rings and flame effect
 * 
 * This module creates an atom-like indicator consisting of:
 * - A central flame particle effect
 * - 3 rotating rings at different orientations
 * 
 * The indicator can expand (rings grow, flame stops) or contract (rings shrink, flame starts)
 * based on proximity to models in the scene.
 */

import * as BABYLON from "babylonjs";

// Atom indicator configuration
export interface AtomIndicatorConfig {
    scene: BABYLON.Scene;
    position: BABYLON.Vector3;
    idleRingRadius: number; // Small radius when model is hidden
    expandedRingRadii: [number, number, number]; // Expanded radii for each ring when model visible
    rotationSpeed: number; // Base rotation speed multiplier
    flameScale?: number; // Scale of the flame particle effect (default 1.0)
}

// Atom indicator instance
export interface AtomIndicator {
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
export function createAtomIndicator(config: AtomIndicatorConfig): AtomIndicator {
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
        const radius = idleRingRadius; // All rings same size when collapsed
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

        // Disable fog on the ring material
        if (ring.material) {
            (ring.material as any).disableFog = true;
        }

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
