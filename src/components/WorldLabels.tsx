/**
 * WorldLabels Component
 * 
 * Renders HTML/CSS labels in world space, positioned at each section anchor.
 * Labels dynamically update based on workplaceConfig sections.
 * 
 * Visibility rules:
 * - Hidden when camera is INSIDE the inner trigger radius (closeup view)
 * - Hidden when camera is OUTSIDE the outer fade radius (too far)
 * - Visible when between the two radii
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import * as BABYLON from 'babylonjs';
import { useUI, S } from '../state';
import { workplaceConfigs } from './workplaceConfig';
import { playShortClick } from './ClickSoundManager';

// Anchor configuration - maps section states to anchor mesh names
const ANCHOR_CONFIG: { state: S; anchorName: string }[] = [
    { state: S.state_4, anchorName: 'anchor_1' },  // Musecraft
    { state: S.state_5, anchorName: 'anchor_2' },  // MeetKai
    { state: S.state_6, anchorName: 'anchor_3' },  // More Than Real
    { state: S.state_7, anchorName: 'anchor_4' },  // Baltha Maker
    { state: S.state_8, anchorName: 'anchor_5' },  // UFSC
];

// Distance thresholds for label visibility (tweakable)
const INNER_RADIUS = 30;   // Hide when closer than this (slightly before WORKPLACE_VISIBILITY_DISTANCE of 20)
const OUTER_RADIUS = 110;  // Hide when farther than this

// Label positioning offset (world units above anchor) - scales with distance
const LABEL_Y_OFFSET_MIN = 3.4;   // Y offset when at inner radius (close)
const LABEL_Y_OFFSET_MAX = 6;   // Y offset when at outer radius (far)

// Scale range for distance-based sizing
const MIN_SCALE = .4;   // Scale when at outer radius
const MAX_SCALE = 1.3;   // Scale when at inner radius

interface LabelData {
    state: S;
    anchorName: string;
    sectionName: string;
    position: { x: number; y: number };
    visible: boolean;
    opacity: number;
    scale: number;
}

export const WorldLabels: React.FC = () => {
    const currentState = useUI((st) => st.state);

    const [labels, setLabels] = useState<LabelData[]>([]);
    const [isVisible, setIsVisible] = useState(false); // For fade-in animation
    const sceneRef = useRef<BABYLON.Scene | null>(null);
    const cameraRef = useRef<BABYLON.ArcRotateCamera | null>(null);
    const observerRef = useRef<BABYLON.Observer<BABYLON.Scene> | null>(null);

    // Show in both guided and free modes during portfolio states (4-8 only, NOT in state 0, 3, or final)
    const shouldRender = currentState >= S.state_4 && currentState <= S.state_8;

    // Handle fade-in/out animation when shouldRender changes
    useEffect(() => {
        if (shouldRender) {
            // Delay the visibility to allow for fade-in animation
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [shouldRender]);

    // Get section names from workplaceConfig
    const getSectionName = useCallback((state: S): string => {
        const config = workplaceConfigs[state];
        return config?.companyName || '';
    }, []);

    // Calculate screen position from world position
    // Uses visualViewport API for robust mobile support
    const worldToScreen = useCallback((
        worldPos: BABYLON.Vector3,
        scene: BABYLON.Scene,
        camera: BABYLON.Camera
    ): { x: number; y: number; behindCamera: boolean } | null => {
        const engine = scene.getEngine();
        const canvas = engine.getRenderingCanvas();
        if (!canvas) return null;

        // Get the actual CSS viewport dimensions
        // Use visualViewport API when available (more accurate on mobile)
        // Falls back to window.innerWidth/Height
        const viewport = window.visualViewport;
        const cssWidth = viewport ? viewport.width : window.innerWidth;
        const cssHeight = viewport ? viewport.height : window.innerHeight;

        // Get engine render dimensions (canvas buffer size)
        const renderWidth = engine.getRenderWidth();
        const renderHeight = engine.getRenderHeight();

        // Project world position to screen using engine dimensions
        const screenPos = BABYLON.Vector3.Project(
            worldPos,
            BABYLON.Matrix.Identity(),
            scene.getTransformMatrix(),
            new BABYLON.Viewport(0, 0, renderWidth, renderHeight)
        );

        // Check if behind camera (rough check using dot product)
        const cameraForward = camera.getForwardRay().direction;
        const toPoint = worldPos.subtract(camera.position).normalize();
        const behindCamera = BABYLON.Vector3.Dot(cameraForward, toPoint) < 0;

        // Convert from render coordinates to CSS pixels
        // This properly handles the difference between canvas buffer size
        // and the actual CSS viewport on real mobile devices
        const scaleX = cssWidth / renderWidth;
        const scaleY = cssHeight / renderHeight;

        return {
            x: screenPos.x * scaleX,
            y: screenPos.y * scaleY,
            behindCamera
        };
    }, []);

    // Calculate distance from camera to anchor
    const getDistanceToAnchor = useCallback((
        anchorPos: BABYLON.Vector3,
        camera: BABYLON.Camera
    ): number => {
        return BABYLON.Vector3.Distance(camera.position, anchorPos);
    }, []);

    // Update label positions and visibility
    const updateLabels = useCallback(() => {
        const scene = sceneRef.current;
        const camera = cameraRef.current;
        if (!scene || !camera) return;

        const newLabels: LabelData[] = [];

        for (const { state, anchorName } of ANCHOR_CONFIG) {
            const anchor = scene.getMeshByName(anchorName);
            if (!anchor) continue;

            // Get anchor world position
            const anchorWorldPos = anchor.getAbsolutePosition();

            // Calculate distance from camera first (needed for dynamic Y offset)
            const distance = getDistanceToAnchor(anchorWorldPos, camera);

            // Calculate dynamic Y offset based on distance (closer = smaller offset, farther = larger offset)
            // This prevents the button from appearing too high above the atom when close
            const distanceRatio = Math.max(0, Math.min(1, (distance - INNER_RADIUS) / (OUTER_RADIUS - INNER_RADIUS)));
            const dynamicYOffset = LABEL_Y_OFFSET_MIN + (distanceRatio * (LABEL_Y_OFFSET_MAX - LABEL_Y_OFFSET_MIN));
            const labelWorldPos = anchorWorldPos.add(new BABYLON.Vector3(0, dynamicYOffset, 0));

            // Calculate screen position
            const screenPos = worldToScreen(labelWorldPos, scene, camera);
            if (!screenPos) continue;

            // Distance already calculated above for dynamic Y offset

            // Determine visibility based on distance thresholds
            let visible = false;
            let opacity = 0;
            let scale = 1;

            if (distance >= INNER_RADIUS && distance <= OUTER_RADIUS) {
                visible = !screenPos.behindCamera;

                // Smooth fade at edges
                if (distance < INNER_RADIUS + 8) {
                    // Fade in as we move away from inner radius
                    opacity = (distance - INNER_RADIUS) / 8;
                } else if (distance > OUTER_RADIUS - 20) {
                    // Fade out as we approach outer radius
                    opacity = (OUTER_RADIUS - distance) / 20;
                } else {
                    opacity = 1;
                }

                opacity = Math.max(0, Math.min(1, opacity));

                // Calculate scale based on distance (closer = larger, farther = smaller)
                const distanceRatio = (distance - INNER_RADIUS) / (OUTER_RADIUS - INNER_RADIUS);
                scale = MAX_SCALE - (distanceRatio * (MAX_SCALE - MIN_SCALE));
                scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
            }

            newLabels.push({
                state,
                anchorName,
                sectionName: getSectionName(state),
                position: { x: screenPos.x, y: screenPos.y },
                visible,
                opacity,
                scale
            });
        }

        setLabels(newLabels);
    }, [getSectionName, worldToScreen, getDistanceToAnchor]);

    // Initialize and attach to scene
    useEffect(() => {
        if (!shouldRender) {
            setLabels([]);
            return;
        }

        // Find scene from global window reference (set by BabylonCanvas)
        const findScene = () => {
            const canvas = document.querySelector('canvas');
            if (!canvas) return null;

            // Get engine from canvas
            const engine = BABYLON.Engine.Instances.find(e =>
                e.getRenderingCanvas() === canvas
            );
            if (!engine) return null;

            const scenes = engine.scenes;
            return scenes.length > 0 ? scenes[0] : null;
        };

        const initLabels = () => {
            const scene = findScene();
            if (!scene) {
                // Retry after a short delay
                setTimeout(initLabels, 500);
                return;
            }

            sceneRef.current = scene;
            cameraRef.current = scene.activeCamera as BABYLON.ArcRotateCamera;

            // Register before render observer
            observerRef.current = scene.onBeforeRenderObservable.add(() => {
                updateLabels();
            });
        };

        initLabels();

        return () => {
            if (sceneRef.current && observerRef.current) {
                sceneRef.current.onBeforeRenderObservable.remove(observerRef.current);
                observerRef.current = null;
            }
        };
    }, [shouldRender, updateLabels]);

    // Handle label click - switch to guided mode and navigate to section
    const handleLabelClick = useCallback((targetState: S) => {
        // Play click sound
        playShortClick();

        // Set a pending navigation to suppress panel expansion during travel
        // We set projectIndex to 0 since we're navigating to the section, not a specific project
        useUI.getState().setPendingProjectNavigation({
            targetState: targetState,
            projectIndex: 0
        });

        // Switch to guided mode
        useUI.getState().setNavigationMode('guided');

        // Navigate to the target state
        useUI.getState().setState(targetState);
    }, []);

    if (!shouldRender || labels.length === 0) {
        return null;
    }

    return (
        <div
            className="absolute inset-0 overflow-hidden z-0 transition-opacity duration-500"
            style={{
                pointerEvents: 'none',
                opacity: isVisible ? 1 : 0,
            }}
        >
            {labels.map((label) => (
                <div
                    key={label.anchorName}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-[opacity,transform] duration-200"
                    style={{
                        left: label.position.x,
                        top: label.position.y,
                        opacity: label.visible ? label.opacity : 0,
                        visibility: label.visible ? 'visible' : 'hidden',
                        transform: `translate(-50%, -50%) scale(${label.visible ? label.scale : 0.8})`,
                        pointerEvents: label.visible ? 'auto' : 'none',
                    }}
                >
                    {/* Label container - white border, dark backdrop, clickable */}
                    <button
                        onClick={() => handleLabelClick(label.state)}
                        className="relative px-3 py-1 border border-white/20 rounded-md backdrop-blur-md bg-brand-dark/20 cursor-pointer transition-all duration-200 hover:border-white/50 hover:bg-brand-dark/40 hover:scale-105 active:scale-95"
                    >
                        {/* Label text */}
                        <span className="text-white text-sm font-mono tracking-wide whitespace-nowrap">
                            {label.sectionName}
                        </span>
                    </button>
                </div>
            ))}
        </div>
    );
};

// Export distance constants for external configuration
export const WORLD_LABELS_CONFIG = {
    INNER_RADIUS,
    OUTER_RADIUS,
    LABEL_Y_OFFSET_MIN,
    LABEL_Y_OFFSET_MAX
};
