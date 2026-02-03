/**
 * PortalSystem - Portal creation and shader management
 * 
 * This module contains the portal shaders and factory function for creating
 * portal meshes with swirl particle effects.
 */

import * as BABYLON from "babylonjs";

// Flag to track if shaders have been registered
let shadersRegistered = false;

/**
 * Registers the portal shaders in Babylon's shader store.
 * Should be called once before creating any portals.
 */
export function registerPortalShaders(): void {
    if (shadersRegistered) return;

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

    // Portal Vertex Shader
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

    // Portal Fragment Shader
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

    shadersRegistered = true;
}

/**
 * Creates the portal warp post-process effect
 */
export function createPortalWarpEffect(
    camera: BABYLON.ArcRotateCamera
): BABYLON.PostProcess {
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
    return warpEffect;
}

/**
 * Options for creating a portal
 */
export interface CreatePortalOptions {
    scene: BABYLON.Scene;
    camera: BABYLON.ArcRotateCamera;
    position: BABYLON.Vector3;
    radius: number;
    name: string;
    title: string;
    portalSwirlsRef: React.MutableRefObject<BABYLON.ParticleSystem[]>;
}

/**
 * Creates a portal mesh with shader material and particle swirl effect
 */
export function createPortal(options: CreatePortalOptions): BABYLON.Mesh {
    const { scene, camera, position, radius, name, title, portalSwirlsRef } = options;

    // Create portal mesh
    const portalMesh = BABYLON.MeshBuilder.CreateDisc(name, {
        radius: radius,
        tessellation: 16
    }, scene);
    portalMesh.position = position.clone();
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
    swirl.minSize = radius * 2 * 0.3;
    swirl.maxSize = radius * 2 * 1.2;
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
