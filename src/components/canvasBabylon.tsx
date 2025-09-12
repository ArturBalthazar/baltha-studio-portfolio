import React, { useEffect, useRef } from "react";
import * as BABYLON from "babylonjs";
import "@babylonjs/loaders";
import { useUI } from "../state";
import { getStateConfig } from "../states";

// Force register the GLB loader
import { GLTFFileLoader } from "@babylonjs/loaders";
BABYLON.SceneLoader.RegisterPlugin(new GLTFFileLoader());

export function BabylonCanvas() {
  const s = useUI((st) => st.state);
  const config = getStateConfig(s);
  const ref = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const cameraRef = useRef<BABYLON.ArcRotateCamera | null>(null);

  // Initialize scene once
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

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

    // Camera (static)
    const camera = new BABYLON.ArcRotateCamera(
      "cam",
      -Math.PI * 1.5,
      Math.PI / 2,
      24,
      BABYLON.Vector3.Zero(),
      scene
    );
    camera.attachControl(canvas, true);
    cameraRef.current = camera;
    
    camera.inputs.clear();
    camera.panningSensibility = 0;
    camera.fov = .4;

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

    // IBL
    const env = BABYLON.CubeTexture.CreateFromPrefilteredData(
      "/assets/textures/environment.env",
      scene
    );
    scene.environmentTexture = env;
    scene.environmentIntensity = 1.0;
    scene.imageProcessingConfiguration.exposure = 1.3;
    scene.imageProcessingConfiguration.contrast = 1.2;

    // Soft fill
    const hemi = new BABYLON.HemisphericLight(
      "hemi",
      new BABYLON.Vector3(3, 3, -3),
      scene
    );
    hemi.intensity = 1.0;

    // Load logo (non-async)
    BABYLON.SceneLoader.ImportMesh(
      "",
      "/assets/models/",
      "logo.glb",
      scene,
      (meshes) => {
        if (meshes.length) {
          const root = meshes[0];
          root.position.set(0, 0, 0);
        }
      },
      undefined,
      (sceneOrMesh, message, exception) => {
        console.error("logo.glb load error:", message, exception);
      }
    );

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

    // Render
    engine.runRenderLoop(() => scene.render());

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

  // Update camera settings when state changes
  useEffect(() => {
    const camera = cameraRef.current;
    if (!camera) return;

    const isMobile = window.innerWidth < 768; // md breakpoint
    const cameraConfig = config.canvas.babylonCamera;
    if (cameraConfig) {
      const lowerLimit = isMobile ? cameraConfig.lowerRadiusLimit.mobile : cameraConfig.lowerRadiusLimit.desktop;
      const upperLimit = isMobile ? cameraConfig.upperRadiusLimit.mobile : cameraConfig.upperRadiusLimit.desktop;
      camera.lowerRadiusLimit = lowerLimit;
      camera.upperRadiusLimit = upperLimit;
    } else {
      // Fallback values
      camera.lowerRadiusLimit = 18;
      camera.upperRadiusLimit = 18;
    }
  }, [s, config.canvas.babylonCamera]); // Update only camera settings on state change

  return <canvas ref={ref} className="block w-full h-full" />;
}