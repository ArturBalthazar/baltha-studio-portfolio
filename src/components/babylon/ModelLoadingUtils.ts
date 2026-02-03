/**
 * ModelLoadingUtils - Utility functions for loading, warming up, and scaling 3D models
 * 
 * This module contains reusable functions for:
 * - Applying lightmaps to model materials
 * - GPU warmup to prevent lag spikes
 * - Scale-based show/hide animations for models
 */

import * as BABYLON from "babylonjs";

// Store original scales for models (set when models are loaded)
export const modelOriginalScales: Map<BABYLON.TransformNode | BABYLON.AbstractMesh, BABYLON.Vector3> = new Map();

// Store original rotations for models (set when models are loaded, used for reset)
export const modelOriginalRotations: Map<BABYLON.TransformNode | BABYLON.AbstractMesh, BABYLON.Quaternion> = new Map();

/**
 * Checks if a lightmaps folder exists for a model and applies lightmaps to mesh materials.
 * Lightmaps are named after the mesh object (e.g., "chair2_lightmap.png" for mesh "chair2")
 * and are assigned to the material's lightmapTexture using UV channel 2 (coordinatesIndex = 1).
 * 
 * @param basePath The base path to the model folder (e.g., "/assets/models/meetkai/thanksgiving/")
 * @param meshes Array of meshes from the loaded container
 * @param scene The Babylon scene
 */
export async function applyLightmapsToModel(
    basePath: string,
    meshes: BABYLON.AbstractMesh[],
    scene: BABYLON.Scene
): Promise<void> {
    // Ensure basePath ends with /
    const normalizedPath = basePath.endsWith('/') ? basePath : basePath + '/';
    const lightmapsPath = `${normalizedPath}lightmaps/`;

    // NOTE: We skip folder existence check - individual file checks with
    // content-type verification are sufficient. HEAD requests to directories
    // on Vite dev server return 200 even for non-existent paths.

    // Try to load lightmaps for each mesh
    for (const mesh of meshes) {
        // Skip meshes without materials or the root __root__ mesh
        if (!mesh.material || mesh.name === '__root__' || mesh.name.startsWith('__')) {
            continue;
        }

        // Check if the mesh has a second UV set (UV2) - required for lightmaps
        const uv2Data = mesh.getVerticesData(BABYLON.VertexBuffer.UV2Kind);
        if (!uv2Data) {
            continue; // No UV2, skip this mesh
        }

        // Construct the lightmap filename: {meshName}_lightmap.png
        const meshName = mesh.name;
        const lightmapUrl = `${lightmapsPath}${meshName}_lightmap.png`;

        // Only apply to PBRMaterial
        const pbrMat = mesh.material as BABYLON.PBRMaterial;
        if (!pbrMat || !pbrMat.getClassName || pbrMat.getClassName() !== 'PBRMaterial') {
            continue;
        }

        // Create the lightmap texture with proper callbacks
        // invertY MUST be false for lightmaps to work correctly
        new BABYLON.Texture(
            lightmapUrl,
            scene,
            false, // noMipmap
            false, // invertY - MUST be false for lightmaps!
            BABYLON.Texture.TRILINEAR_SAMPLINGMODE,
            () => {
                // Success callback - apply the lightmap
                const lightmapTexture = new BABYLON.Texture(lightmapUrl, scene, false, false);
                pbrMat.lightmapTexture = lightmapTexture;
                pbrMat.lightmapTexture.coordinatesIndex = 1; // Use UV2
                pbrMat.useLightmapAsShadowmap = true;
            },
            () => {
                // Error callback - lightmap not found, silently skip
            }
        );
    }
}

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
export async function warmupModelForGPU(
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
export const modelScaleAnimations: Map<BABYLON.TransformNode | BABYLON.AbstractMesh, BABYLON.Animatable> = new Map();

export function scaleModelMeshes(
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
    // Child models use (1,1,1), parent roots may use (1,1,-1) for Z flip
    const fullScale = modelOriginalScales.get(rootMesh) || new BABYLON.Vector3(1, 1, 1);

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
