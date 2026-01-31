/**
 * Model Animation Configuration
 * 
 * Defines animation settings for portfolio models. Only portfolio models
 * (not scene models) have animations that need to be played.
 */

export interface ModelAnimationConfig {
    // Animation playback speed multiplier (1.0 = normal speed)
    speedRatio: number;
    // Animation mode
    mode: 'loop' | 'intro-then-cycle' | 'none';
    // For 'loop' mode: animation name to loop
    loopAnimation?: string;
    // For 'intro-then-cycle' mode: intro animation name  
    introAnimation?: string;
    // For 'intro-then-cycle' mode: cycle animations and their dependencies
    cycleAnimations?: {
        name: string;
        // If this animation is played, what animation MUST follow it?
        mustFollowWith?: string;
        // If true, this animation is ONLY used as a follow-up, never randomly selected
        followUpOnly?: boolean;
        // Priority weight for random selection (higher = more likely, default is 1)
        priority?: number;
    }[];
    // Total frame count for animations (placeholder values - tweak as needed)
    frameCount?: number;
    // Blend duration in seconds for transitioning between animations (default: 0 = no blending)
    blendDuration?: number;
}

// Animation configurations per model ID (matches ProjectConfig.id)
export const modelAnimationConfigs: Record<string, ModelAnimationConfig> = {
    // === UFSC State (state_7) ===
    'petwheels': {
        speedRatio: 1.4, // Adjust to control walk speed
        mode: 'loop',
        loopAnimation: 'Walk',
        frameCount: 60 // Placeholder - adjust based on actual animation
    },

    // === More Than Real State (state_5) ===
    'sika': {
        speedRatio: 1.0, // Adjust for Sika character speed
        mode: 'intro-then-cycle',
        introAnimation: 'Entrada',
        blendDuration: 2, // 2 second blend between animations (adjust as needed)
        cycleAnimations: [
            // MostrandoProduto animations have higher priority (3x more likely)
            { name: '2.MostrandoProdutos.A', priority: 1 },
            { name: '2.MostrandoProdutos.B', priority: 2 },
            // GirandoPazinha triggers DescruzandoBraços after
            { name: '6.GirandoPazinha.B', mustFollowWith: '4.DescruzandoBraços.B', priority: 1 },
            // DescruzandoBraços is ONLY used after GirandoPazinha, never standalone
            { name: '4.DescruzandoBraços.B', followUpOnly: true },
            // Alongando has normal priority
            { name: '7.Alongando.A', priority: 1 }
        ],
        frameCount: 120 // Placeholder - adjust based on actual animations
    },

    // === Meetkai State (state_4) ===
    'pistons': {
        speedRatio: 1.0, // Adjust for pistons animation speed
        mode: 'loop',
        loopAnimation: 'Pistons_Anim',
        frameCount: 60 // Placeholder - adjust based on actual animation
    },

    'meetkaisuite': {
        speedRatio: 1.0, // Adjust for rotation speed
        mode: 'loop',
        loopAnimation: 'Meetkai_Suit_Rotation',
        frameCount: 60 // Placeholder - adjust based on actual animation
    },

    // === More Than Real State (state_6) ===
    'chevrolet': {
        speedRatio: 1.0, // Adjust for truck bed animation speed
        mode: 'loop',
        loopAnimation: 'Montana',
        frameCount: 120 // Placeholder - adjust based on actual animation
    }
};

/**
 * Returns the animation config for a model ID, or null if no animations configured
 */
export function getModelAnimationConfig(modelId: string): ModelAnimationConfig | null {
    return modelAnimationConfigs[modelId] || null;
}

/**
 * Checks if a model has animations configured
 */
export function hasAnimations(modelId: string): boolean {
    const config = modelAnimationConfigs[modelId];
    return config !== undefined && config.mode !== 'none';
}
