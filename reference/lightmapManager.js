export class LightmapManager {
    constructor(scene) {
        this.scene = scene;
    }

    applyLightmaps(lightmapPath = './assets/lightmapsLockerRoom/') {
        // Loop through each mesh in the scene
        this.scene.meshes.forEach(mesh => {
            // Ensure the mesh has a material
            if (!mesh.material) {
                console.log(`Mesh ${mesh.name} has no material. Skipping.`);
                return;
            }

            // Check if the mesh has a second UV set (UV2)
            const uv2Data = mesh.getVerticesData(BABYLON.VertexBuffer.UV2Kind);
            if (!uv2Data) {
                console.log(`Mesh ${mesh.name} does not have a second UV set. Skipping.`);
                return;
            }

            // Construct the lightmap file path
            const lightmapFileName = `${lightmapPath}${mesh.name}_lightmap.png`;

            // Create a lightmap texture
            const lightmapTexture = new BABYLON.Texture(
                lightmapFileName,
                this.scene,
                false,
                false,
                BABYLON.Texture.TRILINEAR_SAMPLINGMODE,
                () => {
                    // On success: Assign the lightmap to the lightmapTexture of the material
                    mesh.material.lightmapTexture = lightmapTexture;
                    mesh.material.lightmapTexture.coordinatesIndex = 1; // Use the second UV set
                    mesh.material.useLightmapAsShadowmap = true; // Optionally, use the lightmap as a shadow map
                    console.log(`Applied lightmap to mesh: ${mesh.name}`);
                },
                (message, exception) => {
                    // On error: Lightmap file not found or failed to load
                    console.log(`Lightmap for mesh ${mesh.name} not found. Skipping.`);
                }
            );
        });
    }
}
