# Animation Timing Configuration Guide

## Overview
All animation timing parameters for camera, ship, and fog are now configurable in the state files (`stateX.ts`). **State files act as blueprints** - when you enter a state, the scene will animate to match what's defined in that state's configuration, regardless of where you're coming from.

## Key Principle: Blueprint-Based States

Each `stateX.ts` file defines **how the scene should look** in that state. When transitioning to a state:
- ✅ The scene will **always** animate to match the destination state's configuration
- ✅ Works the same **regardless of which state you're coming from**
- ✅ No need to define reverse transitions separately

**Example:**
- State 3 defines: `shipAnimation: { position: { x: 0, y: -1.5, z: 0 } }`
- Coming from State 2 → State 3: Ship animates to `(0, -1.5, 0)` ✓
- Coming from State 4 → State 3: Ship animates to `(0, -1.5, 0)` ✓
- **Same result, every time!**

## State 3 Configuration (`src/states/state3.ts`)

### Camera Animation
```typescript
babylonCamera: {
  animationDuration: 1.0,  // Camera radius/beta/alpha animation duration (seconds)
  animationDelay: 0,       // Delay before camera animation starts (seconds)
  // ... camera targets ...
}
```

### Ship Animation
```typescript
shipAnimation: {
  position: { x: 0, y: -1.5, z: 0 },  // Target ship position
  duration: 1.0,                       // Ship movement duration (seconds)
  delay: 0                             // Delay before ship animation starts (seconds)
}
```

### Fog Animation
```typescript
fogAnimation: {
  fogEnd: 100,     // Target fog end distance
  duration: 0.3,   // Fog animation duration (seconds)
  delay: 0         // Delay before fog animation starts (seconds)
}
```

**Current Timing Summary for State 3:**
- Camera moves over **1.0 seconds**
- Ship moves over **1.0 seconds**
- Both start **immediately** (delay: 0)
- **Result:** Camera and ship move in perfect sync

---

## State 4 Configuration (`src/states/state4.ts`)

### Camera Animation
```typescript
babylonCamera: {
  animationDuration: 0.4,  // Default duration (no override specified)
  animationDelay: 0,       // No delay
  beta: {
    mobile: Math.PI / 2.2,   // ~81.8° - tilted camera angle
    desktop: Math.PI / 2.2
  }
}
```

### Ship Animation
```typescript
shipAnimation: {
  position: { x: 0, y: -0.7, z: 0 },  // Target ship position (closer to camera)
  duration: 1.0,                       // Ship movement duration (seconds)
  delay: 0                             // Delay before ship animation starts (seconds)
}
```

### Fog Animation
```typescript
fogAnimation: {
  fogEnd: 450,     // Increase fog distance for wider view
  duration: 0.6,   // Fog animation duration (seconds)
  delay: 0         // Delay before fog animation starts (seconds)
}
```

**Current Timing Summary for State 4:**
- Camera moves over **0.4 seconds** (default, can be customized)
- Ship moves over **1.0 seconds**
- Fog animates over **0.6 seconds**
- All start **immediately** (delay: 0)
- **Issue:** Camera finishes before ship/fog, causing desync

---

## State 2 Configuration (`src/states/state2.ts`)

### Camera Animation (when coming back from State 3)
```typescript
babylonCamera: {
  animationDuration: 0.8,  // Slower return animation
  animationDelay: 0        // No delay
}
```

### Scene Transform Animation
```typescript
babylonScene: {
  materialAnimationDelay: 0.4,   // Material changes after camera
  transformAnimationDelay: 0.4   // Transform changes after camera
}
```

---

## Synchronization Tips

### Perfect Sync Strategy
To keep animations perfectly synchronized:
1. **Match durations** across all animations
2. **Set delays to 0** for simultaneous start
3. **Use delays** to create sequential effects

### Example: Sync State 3 → State 4 Transition
```typescript
// In state4.ts
babylonCamera: {
  animationDuration: 1.0,  // Match ship duration
  animationDelay: 0
}

shipAnimation: {
  duration: 1.0,
  delay: 0
}

fogAnimation: {
  duration: 1.0,  // Match others for perfect sync
  delay: 0
}
```

### Example: Sequential Animation (Camera → Ship → Fog)
```typescript
// In state4.ts
babylonCamera: {
  animationDuration: 0.5,
  animationDelay: 0        // Start immediately
}

shipAnimation: {
  duration: 0.8,
  delay: 0.5               // Start when camera finishes
}

fogAnimation: {
  duration: 0.6,
  delay: 1.3               // Start when ship finishes (0.5 + 0.8)
}
```

### Example: Overlap Effect
```typescript
// In state3.ts
babylonCamera: {
  animationDuration: 1.2,
  animationDelay: 0        // Start immediately
}

shipAnimation: {
  duration: 1.0,
  delay: 0.2               // Start 0.2s after camera (smooth overlap)
}
```

---

## All Configurable Parameters

### Camera (`babylonCamera`)
- `lowerRadiusLimit` - Minimum zoom distance
- `upperRadiusLimit` - Maximum zoom distance
- `beta` - Vertical rotation angle (radians)
- `alpha` - Horizontal rotation angle (radians)
- `animationDuration` - Animation duration (seconds)
- `animationDelay` - Delay before animation (seconds)

### Ship (`babylonScene.shipAnimation`)
- `position.x` - X position
- `position.y` - Y position
- `position.z` - Z position
- `duration` - Animation duration (seconds)
- `delay` - Delay before animation (seconds)

### Fog (`babylonScene.fogAnimation`)
- `fogStart` - Fog start distance
- `fogEnd` - Fog end distance
- `duration` - Animation duration (seconds)
- `delay` - Delay before animation (seconds)

---

## Debug Console Logs

When animations run, you'll see detailed logs:

### Camera Animation
```
🎬 [State Change] Camera update triggered for state: state4
📋 [Camera Config] { state: "state4", betaDegrees: "81.8", ... }
🎥 [Camera Animation] Starting camera animation { duration: 1.0, delay: 0 }
🔄 [Camera Animation] Added beta animation: 1.571 → 1.427 (81.8°)
✅ [Camera Animation] Animation completed
```

### Ship Animation
```
🚀 [Ship Animation] State 3 → State 4: {
  targetPosition: { x: 0, y: -0.7, z: 0 },
  duration: 1.0,
  delay: 0,
  fromState: 3,
  toState: 4
}
```

### Fog Animation
```
🌫️ [Fog Animation] State 3 → State 4: {
  currentFogEnd: 100,
  currentFogStart: 20,
  targetFogEnd: 450,
  targetFogStart: undefined,
  duration: 0.6,
  delay: 0,
  fromState: 3,
  toState: 4
}
```

---

## Blueprint Logic Implementation

### How It Works

**When entering any state:**
1. System reads the destination state's configuration
2. If `shipAnimation` is defined → animates ship to that position
3. If `shipAnimation` is NOT defined → hides ship behind camera `(0, -4, 20)`
4. If `fogAnimation` is defined → animates fog to those settings
5. Camera always animates using the state's `babylonCamera` config

**Example Transitions:**
- **State 2 → State 3:** Ship animates to state 3's position `(0, -1.5, 0)`
- **State 4 → State 3:** Ship animates to state 3's position `(0, -1.5, 0)` (same!)
- **State 3 → State 2:** Ship hides behind camera (state 2 has no ship config)

### Sync Recommendations

**For State 4:** To sync camera beta change with ship/fog:
```typescript
// In state4.ts
babylonCamera: {
  animationDuration: 1.0,  // ← Match ship duration for perfect sync
  animationDelay: 0
}
```

---

## Quick Reference: Common Timing Values

| Duration | Effect |
|----------|--------|
| 0.3s | Very fast, snappy |
| 0.5s | Fast, responsive |
| 0.8s | Medium, comfortable |
| 1.0s | Slow, smooth |
| 1.5s+ | Very slow, cinematic |

| Delay | Effect |
|-------|--------|
| 0s | Start immediately |
| 0.2s | Slight stagger |
| 0.5s | Noticeable sequence |
| 1.0s+ | Dramatic pause |

---

## Testing Workflow

1. **Modify timing values** in `stateX.ts`
2. **Save the file**
3. **Navigate to the state** in the app
4. **Watch console logs** for timing details
5. **Observe visual sync** between animations
6. **Iterate** until perfect

---

## Key Improvements from Refactoring

### Before (Transition-Based)
- Hardcoded transitions for each state pair (2→3, 3→2, 3→4, 4→3)
- Different logic for "going to" vs "coming from"
- Inconsistent behavior depending on source state
- Had to manually handle reverse transitions

### After (Blueprint-Based)
- ✅ Single source of truth: the destination state's config
- ✅ Consistent behavior regardless of source state
- ✅ Automatic fallback for states without ship/fog config
- ✅ Easier to add new states (just define the blueprint)
- ✅ Simpler code, fewer edge cases

**Result:** State 3 now looks the same whether you come from State 2, State 4, or any other state!

---

## Files Modified

- `src/states/types.ts` - Added ShipAnimationConfig and FogAnimationConfig interfaces
- `src/states/state3.ts` - Added shipAnimation and fogAnimation configs
- `src/states/state4.ts` - Added shipAnimation and fogAnimation configs
- `src/components/canvasBabylon.tsx` - Refactored to blueprint-based system with comprehensive logging

