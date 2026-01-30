/**
 * Model Animation Controller
 * 
 * Manages animation playback for portfolio models based on their configurations.
 * Handles looping animations, intro sequences, and cycling animations with dependencies.
 */

import * as BABYLON from "babylonjs";
import { ModelAnimationConfig, getModelAnimationConfig } from "./modelAnimationConfig";

interface AnimationState {
    modelId: string;
    config: ModelAnimationConfig;
    animationGroups: BABYLON.AnimationGroup[];
    isPlaying: boolean;
    hasPlayedIntro: boolean;
    // Pending follow-up animation (for mustFollowWith rule)
    pendingFollowUp: string | null;
    // Track the currently playing animation group to prevent overlaps
    currentAnimationGroup: BABYLON.AnimationGroup | null;
    // Store observer references for cleanup
    observers: Map<BABYLON.AnimationGroup, BABYLON.Observer<BABYLON.AnimationGroup>>;
    // Blending state
    isBlending: boolean;
    blendingOutGroup: BABYLON.AnimationGroup | null;
    scene: BABYLON.Scene | null;
}

// Store active animation states per model
const animationStates = new Map<string, AnimationState>();

/**
 * Finds an animation group by name from a list
 */
function findAnimationGroup(
    groups: BABYLON.AnimationGroup[],
    name: string
): BABYLON.AnimationGroup | null {
    // First try exact match
    let group = groups.find(g => g.name === name);
    if (group) return group;

    // Then try includes match
    group = groups.find(g => g.name.includes(name));
    return group || null;
}

/**
 * Stops all animation groups and clears their observers
 */
function stopAllAnimations(state: AnimationState): void {
    // Stop any ongoing blending
    state.isBlending = false;
    state.blendingOutGroup = null;

    // Clear all observers first
    state.observers.forEach((observer, group) => {
        group.onAnimationGroupEndObservable.remove(observer);
    });
    state.observers.clear();

    // Stop all animation groups and reset weights
    state.animationGroups.forEach(group => {
        if (group.isPlaying) {
            group.stop();
        }
        // Reset weight to 1 for clean state using .weight property
        (group as any).weight = 1;
    });

    state.currentAnimationGroup = null;
}

/**
 * Gets animations that can start a cycle (excludes follow-up only animations)
 */
function getStartableCycleAnimations(config: ModelAnimationConfig): string[] {
    if (!config.cycleAnimations) return [];

    // Return only animations that are NOT marked as followUpOnly
    return config.cycleAnimations
        .filter(a => !a.followUpOnly)
        .map(a => a.name);
}

/**
 * Picks next animation with weighted probability
 */
function pickNextCycleAnimation(state: AnimationState): string | null {
    const config = state.config;
    if (!config.cycleAnimations) return null;

    const startable = getStartableCycleAnimations(config);
    if (startable.length === 0) return null;

    // Build weighted list based on priority
    const weighted: string[] = [];

    startable.forEach(animName => {
        const animConfig = config.cycleAnimations?.find(a => a.name === animName);
        const priority = animConfig?.priority || 1;

        // Add animation to list 'priority' times for weighting
        for (let i = 0; i < priority; i++) {
            weighted.push(animName);
        }
    });

    if (weighted.length === 0) return null;

    // Pick random from weighted list
    const randomIndex = Math.floor(Math.random() * weighted.length);
    return weighted[randomIndex];
}

/**
 * Plays the next animation in a cycle
 */
function playNextCycleAnimation(state: AnimationState): void {
    if (!state.isPlaying) return;

    // If there's a pending follow-up (from mustFollowWith), play that first
    if (state.pendingFollowUp) {
        const followUpName = state.pendingFollowUp;
        state.pendingFollowUp = null;

        const group = findAnimationGroup(state.animationGroups, followUpName);
        if (group) {
            playAnimationGroup(state, group, false);
            return;
        }
    }

    // Pick and play next cycle animation
    const nextAnimName = pickNextCycleAnimation(state);
    if (!nextAnimName) return;

    const group = findAnimationGroup(state.animationGroups, nextAnimName);
    if (!group) return;

    // Check if this animation has a mustFollowWith requirement
    const animConfig = state.config.cycleAnimations?.find(a => a.name === nextAnimName);
    if (animConfig?.mustFollowWith) {
        state.pendingFollowUp = animConfig.mustFollowWith;
    }

    playAnimationGroup(state, group, false);
}

/**
 * Performs weight-based crossfade blending between two animations
 * Uses Babylon's native blending system with enableBlending and .weight property
 */
function blendAnimations(
    state: AnimationState,
    fromGroup: BABYLON.AnimationGroup,
    toGroup: BABYLON.AnimationGroup,
    duration: number,
    onComplete: () => void
): void {
    state.isBlending = true;
    state.blendingOutGroup = fromGroup;

    const startTime = performance.now();
    const durationMs = duration * 1000;

    // Enable blending on both groups
    fromGroup.enableBlending = true;
    toGroup.enableBlending = true;

    // Set blending speed (inverse of duration in seconds, roughly)
    const blendingSpeed = 1 / (duration * 60); // Approximate for 60fps
    fromGroup.blendingSpeed = blendingSpeed;
    toGroup.blendingSpeed = blendingSpeed;

    // Start the new animation with weight 0
    (toGroup as any).weight = 0;
    if (!toGroup.isPlaying) {
        toGroup.play(false);
    }
    toGroup.speedRatio = state.config.speedRatio;

    // Make sure the old animation keeps playing
    (fromGroup as any).weight = 1;
    if (!fromGroup.isPlaying) {
        fromGroup.play(false);
    }
    fromGroup.speedRatio = state.config.speedRatio;

    // Crossfade using requestAnimationFrame for smooth interpolation
    const blend = () => {
        if (!state.isPlaying || !state.isBlending) {
            // Cleanup if stopped
            fromGroup.stop();
            (fromGroup as any).weight = 1;
            (toGroup as any).weight = 1;
            state.isBlending = false;
            state.blendingOutGroup = null;
            return;
        }

        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / durationMs, 1);

        // Smooth easing (ease out quad)
        const eased = 1 - Math.pow(1 - progress, 2);

        // Crossfade weights using .weight property
        (fromGroup as any).weight = BABYLON.Scalar.Clamp(1 - eased, 0, 1);
        (toGroup as any).weight = BABYLON.Scalar.Clamp(eased, 0, 1);

        if (progress < 1) {
            requestAnimationFrame(blend);
        } else {
            // Blending complete
            fromGroup.stop();
            (fromGroup as any).weight = 1; // Reset weight
            (toGroup as any).weight = 1;
            state.isBlending = false;
            state.blendingOutGroup = null;
            onComplete();
        }
    };

    requestAnimationFrame(blend);
}


/**
 * Plays a single animation group with proper observer management and optional blending
 */
function playAnimationGroup(
    state: AnimationState,
    group: BABYLON.AnimationGroup,
    loop: boolean
): void {
    const blendDuration = state.config.blendDuration || 0;
    const previousGroup = state.currentAnimationGroup;
    const shouldBlend = blendDuration > 0 &&
        previousGroup &&
        previousGroup !== group &&
        previousGroup.isPlaying &&
        !state.isBlending &&
        !loop; // Don't blend into loops

    // Remove old observer from previous group
    if (previousGroup && previousGroup !== group) {
        const oldObserver = state.observers.get(previousGroup);
        if (oldObserver) {
            previousGroup.onAnimationGroupEndObservable.remove(oldObserver);
            state.observers.delete(previousGroup);
        }
    }

    state.currentAnimationGroup = group;
    group.speedRatio = state.config.speedRatio;

    // Setup end observer for cycling (before starting animation)
    if (!loop && state.config.mode === 'intro-then-cycle') {
        // Remove any existing observer for this group
        const existingObserver = state.observers.get(group);
        if (existingObserver) {
            group.onAnimationGroupEndObservable.remove(existingObserver);
            state.observers.delete(group);
        }

        // Add new observer
        const observer = group.onAnimationGroupEndObservable.addOnce(() => {
            state.observers.delete(group);
            state.currentAnimationGroup = null;

            if (state.isPlaying) {
                // Small delay to prevent any edge cases
                setTimeout(() => {
                    if (state.isPlaying) {
                        playNextCycleAnimation(state);
                    }
                }, 50);
            }
        });

        state.observers.set(group, observer);
    }

    // Start animation with or without blending
    if (shouldBlend && previousGroup) {
        blendAnimations(state, previousGroup, group, blendDuration, () => {
            // Blending complete - animation continues on its own
        });
    } else {
        // No blending - stop previous and start new
        if (previousGroup && previousGroup !== group && previousGroup.isPlaying) {
            previousGroup.stop();
            (previousGroup as any).weight = 1;
        }

        // Enable blending on the group if config specifies blend duration
        if (blendDuration > 0) {
            group.enableBlending = true;
            group.blendingSpeed = 1 / (blendDuration * 60);
        }

        (group as any).weight = 1;
        group.start(loop, state.config.speedRatio);
    }
}

/**
 * Initializes and starts animations for a model when it becomes visible
 * 
 * @param modelId - The model identifier (e.g., 'petwheels', 'sika', 'pistons')
 * @param animationGroups - Animation groups from the loaded GLTF container
 * @param isProjectSwitch - True if this is a switch between projects (not initial show)
 */
export function startModelAnimations(
    modelId: string,
    animationGroups: BABYLON.AnimationGroup[],
    isProjectSwitch: boolean = false
): void {
    const config = getModelAnimationConfig(modelId);
    if (!config || config.mode === 'none' || animationGroups.length === 0) {
        return;
    }

    // Stop any existing animations for this model first
    stopModelAnimations(modelId);

    // Get scene from first animation group
    const scene = animationGroups[0]?.targetedAnimations?.[0]?.target?.getScene?.() || null;

    // Create state
    const state: AnimationState = {
        modelId,
        config,
        animationGroups,
        isPlaying: true,
        hasPlayedIntro: false,
        pendingFollowUp: null,
        currentAnimationGroup: null,
        observers: new Map(),
        isBlending: false,
        blendingOutGroup: null,
        scene
    };

    animationStates.set(modelId, state);

    // Handle based on mode
    if (config.mode === 'loop') {
        // Simple looping animation - use Babylon's built-in loop
        const loopGroup = findAnimationGroup(animationGroups, config.loopAnimation || '');
        if (loopGroup) {
            state.currentAnimationGroup = loopGroup;
            loopGroup.start(true, config.speedRatio); // true = loop
        }
    }
    else if (config.mode === 'intro-then-cycle') {
        const introGroup = config.introAnimation
            ? findAnimationGroup(animationGroups, config.introAnimation)
            : null;

        // Play intro if available
        if (introGroup) {
            state.currentAnimationGroup = introGroup;
            introGroup.speedRatio = config.speedRatio;

            // Remove any existing observer
            const existingObserver = state.observers.get(introGroup);
            if (existingObserver) {
                introGroup.onAnimationGroupEndObservable.remove(existingObserver);
            }

            // After intro ends, start cycling
            const observer = introGroup.onAnimationGroupEndObservable.addOnce(() => {
                state.observers.delete(introGroup);
                state.hasPlayedIntro = true;
                state.currentAnimationGroup = null;

                if (state.isPlaying) {
                    setTimeout(() => {
                        if (state.isPlaying) {
                            playNextCycleAnimation(state);
                        }
                    }, 50);
                }
            });

            state.observers.set(introGroup, observer);
            introGroup.start(false, config.speedRatio);
        } else {
            // No intro, start cycling immediately
            state.hasPlayedIntro = true;
            playNextCycleAnimation(state);
        }
    }
}

/**
 * Stops all animations for a model
 * 
 * @param modelId - The model identifier
 */
export function stopModelAnimations(modelId: string): void {
    const state = animationStates.get(modelId);
    if (!state) return;

    state.isPlaying = false;

    // Stop all animations and clear observers
    stopAllAnimations(state);

    // Reset all animation groups to frame 0
    state.animationGroups.forEach(group => {
        group.reset();
    });

    animationStates.delete(modelId);
}

/**
 * Updates the speed ratio for a model's animations while playing
 * 
 * @param modelId - The model identifier
 * @param speedRatio - New speed ratio
 */
export function setModelAnimationSpeed(modelId: string, speedRatio: number): void {
    const state = animationStates.get(modelId);
    if (!state) return;

    state.config.speedRatio = speedRatio;

    // Update currently playing animation
    if (state.currentAnimationGroup?.isPlaying) {
        state.currentAnimationGroup.speedRatio = speedRatio;
    }
}

/**
 * Checks if a model currently has animations playing
 */
export function isModelAnimating(modelId: string): boolean {
    const state = animationStates.get(modelId);
    return state?.isPlaying || false;
}

/**
 * Gets the current animation state for debugging
 */
export function getAnimationDebugInfo(modelId: string): object | null {
    const state = animationStates.get(modelId);
    if (!state) return null;

    return {
        modelId: state.modelId,
        mode: state.config.mode,
        speedRatio: state.config.speedRatio,
        isPlaying: state.isPlaying,
        hasPlayedIntro: state.hasPlayedIntro,
        pendingFollowUp: state.pendingFollowUp,
        currentAnimation: state.currentAnimationGroup?.name || null,
        observerCount: state.observers.size,
        animationGroupNames: state.animationGroups.map(g => g.name)
    };
}
