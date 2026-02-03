/**
 * ParticleFactories - Factory functions for creating particle systems
 * 
 * This module contains reusable factory functions for creating
 * various particle effects used in the portfolio scene.
 */

import * as BABYLON from "babylonjs";

/**
 * Creates the stars background particle system
 * Stars spawn in a sphere around the ship with a forbidden inner radius
 */
export interface CreateStarsOptions {
    scene: BABYLON.Scene;
    spaceshipRootRef: React.MutableRefObject<BABYLON.TransformNode | null>;
    forbiddenRadius?: number;
    totalRadius?: number;
    particleCount?: number;
}

export function createStarsParticleSystem(options: CreateStarsOptions): {
    emitter: BABYLON.Mesh;
    particles: BABYLON.ParticleSystem;
} {
    const {
        scene,
        spaceshipRootRef,
        forbiddenRadius = 800,
        totalRadius = 1000,
        particleCount = 3000
    } = options;

    const forbiddenRadiusSq = forbiddenRadius * forbiddenRadius;

    // Create emitter
    const starsEmitter = BABYLON.Mesh.CreateBox("starsEmitter", 0.01, scene);
    starsEmitter.visibility = 0;
    starsEmitter.position.set(0, 0, 0);

    const stars = new BABYLON.ParticleSystem("starsParticles", particleCount, scene);
    stars.particleTexture = new BABYLON.Texture("/assets/textures/star_07.png", scene);
    stars.emitter = starsEmitter;

    // Custom spawn function for stars with forbidden radius that follows shipRoot
    stars.startPositionFunction = (worldMatrix, position, particle) => {
        const shipRoot = spaceshipRootRef.current;
        if (!shipRoot) {
            position.x = 0;
            position.y = 0;
            position.z = 0;
            return;
        }

        let relX, relY, relZ;

        // Rejection sampling - keep generating until outside forbidden radius around ship
        do {
            relX = BABYLON.Scalar.RandomRange(-totalRadius, totalRadius);
            relY = BABYLON.Scalar.RandomRange(-totalRadius, totalRadius);
            relZ = BABYLON.Scalar.RandomRange(-totalRadius, totalRadius);
        } while (relX * relX + relY * relY + relZ * relZ < forbiddenRadiusSq);

        // Apply ship offset with X inverted, Y and Z normal
        const x = relX - shipRoot.position.x;
        const y = relY + shipRoot.position.y;
        const z = relZ + shipRoot.position.z;

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

    stars.minSize = 6;
    stars.maxSize = 15;
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

    return { emitter: starsEmitter, particles: stars };
}

/**
 * Creates the smoke/fog ambient particle system
 */
export interface CreateSmokeOptions {
    scene: BABYLON.Scene;
    isMobile?: boolean;
}

export function createSmokeParticleSystem(options: CreateSmokeOptions): {
    emitter: BABYLON.Mesh;
    particles: BABYLON.ParticleSystem;
} {
    const { scene, isMobile = false } = options;

    const smokeEmitter = BABYLON.Mesh.CreateBox("smokeEmitter", 0.01, scene);
    smokeEmitter.visibility = 0;
    smokeEmitter.position.set(0, 0, 25);

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

    if (!isMobile) {
        smoke.start();
    }

    return { emitter: smokeEmitter, particles: smoke };
}

/**
 * Creates the engine flame particle system for the spaceship
 */
export interface CreateEngineFlameOptions {
    scene: BABYLON.Scene;
    emitter: BABYLON.TransformNode;
}

export function createEngineFlameParticleSystem(options: CreateEngineFlameOptions): BABYLON.ParticleSystem {
    const { scene, emitter } = options;

    const flame = new BABYLON.ParticleSystem("engineFlamePS", 600, scene);
    flame.particleTexture = new BABYLON.Texture("/assets/textures/muzzle_06.png", scene);
    flame.emitter = emitter as any;
    flame.updateSpeed = 0.04;
    flame.minEmitPower = 0.02;
    flame.maxEmitPower = 0.05;
    flame.emitRate = 1000;

    // Point spawn at nozzle
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

    return flame;
}

/**
 * Creates the curve/floating light particle system
 */
export interface CreateCurveParticlesOptions {
    scene: BABYLON.Scene;
    vertices: BABYLON.Vector3[];
    isMobile?: boolean;
}

export function createCurveParticleSystem(options: CreateCurveParticlesOptions): {
    emitter: BABYLON.Mesh;
    particles: BABYLON.ParticleSystem;
} {
    const { scene, vertices, isMobile = false } = options;

    const curveParticles = new BABYLON.ParticleSystem("curveParticles", 1000, scene);
    curveParticles.particleTexture = new BABYLON.Texture("/assets/textures/floating_light.png", scene);

    // Create dummy emitter
    const dummyEmitter = BABYLON.Mesh.CreateBox("curveEmitter", 0.01, scene);
    dummyEmitter.visibility = 0;
    dummyEmitter.position.set(0, 0, 0);
    curveParticles.emitter = dummyEmitter;

    // Custom spawn function to place particles at random vertices with offset
    curveParticles.startPositionFunction = (worldMatrix, position, particle) => {
        const randomVertex = vertices[Math.floor(Math.random() * vertices.length)];
        const offsetRange = 3.0;
        position.x = randomVertex.x + (Math.random() - 0.5) * offsetRange;
        position.y = randomVertex.y + (Math.random() - 0.5) * offsetRange;
        position.z = randomVertex.z + (Math.random() - 0.5) * offsetRange;
    };

    if (isMobile) {
        curveParticles.minSize = 0.15;
        curveParticles.maxSize = 0.75;
        curveParticles.emitRate = 200;
    } else {
        curveParticles.minSize = 1;
        curveParticles.maxSize = 3;
        curveParticles.emitRate = 600;
    }

    curveParticles.minInitialRotation = 0;
    curveParticles.maxInitialRotation = Math.PI * 2;

    curveParticles.minLifeTime = 2.5;
    curveParticles.maxLifeTime = 4.5;
    curveParticles.updateSpeed = 0.02;

    curveParticles.minEmitPower = 0.003;
    curveParticles.maxEmitPower = 0.015;

    curveParticles.addColorGradient(0.0, new BABYLON.Color4(0.8, 0.8, 1, 0));
    curveParticles.addColorGradient(0.1, new BABYLON.Color4(0.6, 0.6, 0.9, 0.3));
    curveParticles.addColorGradient(0.5, new BABYLON.Color4(0.8, 0.6, 0.8, 0.3));
    curveParticles.addColorGradient(0.8, new BABYLON.Color4(0.9, 0.5, 0.4, 0.15));
    curveParticles.addColorGradient(1.0, new BABYLON.Color4(1, 0.7, 0.7, 0));

    curveParticles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
    curveParticles.gravity = new BABYLON.Vector3(0, 0.4, 0);

    return { emitter: dummyEmitter, particles: curveParticles };
}

/**
 * Creates a portal swirl particle system
 */
export interface CreatePortalSwirlOptions {
    scene: BABYLON.Scene;
    name: string;
    position: BABYLON.Vector3;
    radius: number;
}

export function createPortalSwirlParticleSystem(options: CreatePortalSwirlOptions): BABYLON.ParticleSystem {
    const { scene, name, position, radius } = options;

    const swirl = new BABYLON.ParticleSystem("swirl_" + name, 30, scene);
    swirl.particleTexture = new BABYLON.Texture("/assets/textures/flare.png", scene);

    // Create emitter at portal position
    const emitter = BABYLON.Mesh.CreateSphere("swirlEmitter_" + name, 4, 0.1, scene);
    emitter.position.copyFrom(position);
    emitter.visibility = 0;
    swirl.emitter = emitter;

    // Configure swirl particles (customizable per-portal)
    swirl.minSize = 0.3;
    swirl.maxSize = 0.8;
    swirl.minLifeTime = 1;
    swirl.maxLifeTime = 2;
    swirl.emitRate = 15;

    swirl.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
    swirl.gravity = new BABYLON.Vector3(0, 0, 0);
    swirl.minEmitPower = 0.5;
    swirl.maxEmitPower = 1;

    // Circular motion emitter
    const circleEmitter = new BABYLON.CylinderParticleEmitter(radius, 0.1, 0, 0);
    swirl.particleEmitterType = circleEmitter;

    swirl.addColorGradient(0.0, new BABYLON.Color4(0.5, 0.7, 1, 0));
    swirl.addColorGradient(0.3, new BABYLON.Color4(0.6, 0.8, 1, 0.8));
    swirl.addColorGradient(0.7, new BABYLON.Color4(0.7, 0.6, 1, 0.6));
    swirl.addColorGradient(1.0, new BABYLON.Color4(0.8, 0.5, 1, 0));

    return swirl;
}
