/* Core Engine Variables */
let engine;
let scene;
let canvas;

/* Camera and Controls */
let camera;
let cameraPivot;
let originalCameraZ = -24;
let targetCameraZ = -90;
let orbitRadius = null;
let guidedMode = true;
let dragging = false;
let startX = 0;
let startY = 0;
let dragRotOffset = { x: 0, y: 0 };
const maxRotationY = 0.3;
const maxRotationX = 0.2;

/* Planet and Environment */
let planetRoot1 = null;
let planetRoot2 = null;
let planetBone = null;
let planetMesh = null;
let planetPinCenter = null;
let spaceRoot = null;
let logoRoot = null;
let logoMesh = [];
let rockRing = null;
let rockRingAnimationGroups = null;
let sceneSmoke = null;
let sceneStars = null;
let glowLayer = null;

/* Ship */
let shipRoot = null;
let shipMesh = null;
let engineFlame = null;
let shipOriginalPose = null;
let pivotFreeLocalPos = null;
let pivotFreeLocalRot = null;

/* BYD Car */
let carRoot = null;
let carMeshes = null;
let currentColor = "yellow";
let currentTrim = "lightBlue";
let rotationEnabled = false;
let isInteriorView = false;
const colorSettings = {
    yellow:  { hex: "#AFBF25", metallic: 0.2, roughness: 0.2, sheen: 1 },
    white:   { hex: "#E5DDC9", metallic: 0.2, roughness: 0.2, sheen: 1 },
    black:   { hex: "#000000", metallic: 0.7, roughness: 0.2, sheen: 0.2 },
    pink:    { hex: "#E8BDE1", metallic: 0.18, roughness: 0.2, sheen: 1 }
};

const trimConfigs = {
    lightBlue: {
        allowed: ["yellow"],
        materials: {
            byd_leather_02: "byd_leather_black_02",
            byd_leather_03: "byd_leather_black_03",
            byd_leather_04: "byd_leather_perforated_blue",
            byd_leather_05: "byd_leather_light_blue_05",
            byd_leather_06: "byd_leather_light_blue_06",
            byd_metallic_plastic_01: "byd_metal_paint",
            byd_metallic_plastic_02: "byd_metallic_blue",
            byd_metallic_plastic_03: "byd_yellow",
            byd_steering_wheel: "byd_plastic_skin_wheel",
            byd_buttons: "byd_atlas_metallic",
            byd_stitches: "byd_stitches_yellow"
        }
    },
    pink: {
        allowed: ["white", "pink"],
        materials: {
            byd_leather_02: "byd_leather_black_02",
            byd_leather_03: "byd_leather_pink_03",
            byd_leather_04: "byd_leather_black_04",
            byd_leather_05: "byd_leather_pink_05",
            byd_leather_06: "byd_leather_pink_06",
            byd_metallic_plastic_01: "byd_metal_paint",
            byd_metallic_plastic_02: "byd_metallic_pink",
            byd_metallic_plastic_03: "byd_pink",
            byd_steering_wheel: "byd_plastic_skin_wheel",
            byd_buttons: "byd_atlas_metallic",
            byd_stitches: "byd_stitches_pink"
        }
    },
    darkBlue: {
        allowed: ["white", "black"],
        materials: {
            byd_leather_02: "byd_leather_perforated_dark_blue",
            byd_leather_03: "byd_leather_black_03",
            byd_leather_04: "byd_leather_perforated_red",
            byd_leather_05: "byd_leather_dark_blue",
            byd_leather_06: "byd_leather_black_06",
            byd_metallic_plastic_01: "byd_black_piano",
            byd_metallic_plastic_02: "byd_metallic_black",
            byd_metallic_plastic_03: "byd_orange",
            byd_steering_wheel: "byd_leather_dark_blue_wheel",
            byd_buttons: "byd_atlas_dark",
            byd_stitches: "byd_stitches_orange"
        }
    }
};

/* atlasflow Particle Accelerator */
let atlasflowRoot = null;
let atlasflowMeshes = null;

/* FDA Warehouse */
let fdaRoot = null;
let fdaMeshes = null;

/* Audio and Effects */
let backgroundMusic = null;
let teleportSound = null;
let infoSound = null;
let audioManager = null;

/* Portal System */
let portalInfo = new Map(); // Stores info about each portal
let portalInfoSystem = null;
let defaultPortalMesh = null;
let babylonEditorPortal = null;
let atlasflowPortal = null;
let bydSeagullPortal = null;
let fdaPortal = null;
let warpEffect = null;
let warpEffectAttached = false;
let currentScene = "main";
let previousScene = null;
const ENV_ROOTS = {
    main    : null,   // the space scene with the ship – set below
    byd     : null,   // filled when BYD finishes loading
    atlasflow    : null,   // fill when you load atlasflow
    editor : null    // fill when you load editor
};

/* UI and Interaction */
const screenWidth = 768;
var highlightLayer;
var highlightedContinentMesh = null;
let typingTimeout;

/* CSS Customization */
const overlay = document.getElementById('customization-overlay');
const btnContainer = document.getElementById('button-container');
const buttons = btnContainer.querySelectorAll('button');
const customText = document.getElementById('custom-text');
const overlayTitleBar = document.getElementById('overlay-title-bar');
const liveIndicator = document.getElementById('live-indicator');
const continentButtons1 = document.getElementById('continent-buttons-1');
const continentButtons2 = document.getElementById('continent-buttons-2');
const graphsContainer = document.getElementById('graphs-container');
const textBottom = document.getElementById('text-bottom');
const canvasContainer = document.getElementById('canvas-container');
const chatContainer = document.getElementById('chatContainer');
const header = document.querySelector('.header');
const modeButtonsContainer = document.getElementById('button-container-mode'); // State 3
const modeButtons = modeButtonsContainer.querySelectorAll('button');
const portalControls = document.querySelector('#portal-controls');
const portalInfoOverlay = document.querySelector('#portal-info-overlay');
const glowPathPpl = document.getElementById("myGlowPathPpl");
const mainPathPpl = document.getElementById("myMainPathPpl");
const dotPop = document.getElementById("liveDotPpl");
const glowPathGdp = document.getElementById("myGlowPathGdp");
const mainPathGdp = document.getElementById("myMainPathGdp");
const dotGdp = document.getElementById("liveDotGdp");
const liveEarthTitle = document.getElementById('live-text');
const isDesktop = window.innerWidth >= screenWidth;
const textBox1 = document.querySelector('.text-box-1');
const overlayText = document.querySelector('.overlay-text');
const renderCanvas = document.getElementById('renderCanvas');
const audioBtn = document.getElementById('audio-btn');
const audioIcon = document.getElementById('audio-icon');
const btnElementsMode = document.querySelectorAll('.custom-btn-mode');
const navToggle = document.getElementById('nav-toggle');
const logoIcon = document.querySelector(".logo-icon");
const menuIcon = document.querySelector(".menu-button");
const portalOverlay = document.getElementById('portal-info-overlay');
const continentButtons = document.querySelectorAll('#continent-buttons-1 button, #continent-buttons-2 button');
const btnElements = document.querySelectorAll('.custom-btn');
const carConfigurator = document.getElementById('byd-customizer-panel');
const viewCarBtn = document.getElementById("toggle-view-btn");
const viewCarBtnImg = viewCarBtn.querySelector("img");
const whiteFade = document.getElementById("white-fade-overlay");

/* State Machine */
const STATE_HOME       = 0;
const STATE_HOME_1 = 1;
const STATE_HOME_2 = 2;
const STATE_HOME_3 = 3;
const STATE_EXPLORE    = 4;
const STATE_EXPLORE_1   = 5;
const STATE_EXPLORE_2   = 6;
const STATE_EXPLORE_3   = 7;
const STATE_EXPLORE_4   = 8;
const STATE_EXPLORE_5   = 9;

const maxFreeState     = 4;
const maxGuidedState   = 9;
let maxState         = 9;

let guidedProgress = 0;
let guidedCurve = null;
let guidedCurveLine = null;
let debugArrow = null;
let guidedTargetProgress = 0;
let guidedAnimating = false;
let pathFollower = null;
let currentState = STATE_HOME;
let previousState = STATE_HOME;
let isAnimating = false;
let camAlphaTarget = null;
let camBetaTarget  = null;
let camInputDisabled = false;
let guidedState = null;
let editorCubeCamPos = null;

let guidedPoints = [
    { id: 4, pos: new BABYLON.Vector3(0, 0, -24), alpha: BABYLON.Tools.ToRadians(-90), beta: Math.PI / 2.2, }, // STATE_EXPLORE

    { id: 5, pos: new BABYLON.Vector3(-37, -.7, 6), alpha: BABYLON.Tools.ToRadians(-30), beta: BABYLON.Tools.ToRadians(85) }, // STATE_EXPLORE_1

    { id: 6, pos: new BABYLON.Vector3(37, -.5, 5), alpha: BABYLON.Tools.ToRadians(-115), beta: BABYLON.Tools.ToRadians(85) }, // STATE_EXPLORE_2

    { id: 7, pos: new BABYLON.Vector3(27, 6.5, -35), alpha: BABYLON.Tools.ToRadians(145), beta: BABYLON.Tools.ToRadians(85) }, // STATE_EXPLORE_3

    { id: 8, pos: new BABYLON.Vector3(-27, .5, -35), alpha: BABYLON.Tools.ToRadians(62), beta: BABYLON.Tools.ToRadians(85) }, // STATE_EXPLORE_4
    
    { id: 9, pos: new BABYLON.Vector3(3, 20, -75), alpha: BABYLON.Tools.ToRadians(85), beta: BABYLON.Tools.ToRadians(87)},
    
    { id: 9.1, pos: new BABYLON.Vector3(-15, 0, -25) },
    
    { id: 10, pos: new BABYLON.Vector3(0, 0, -30), alpha: BABYLON.Tools.ToRadians(-90), beta: BABYLON.Tools.ToRadians(90) }, // STATE_EXPLORE_6
];

/* Other Rotation Helpers */
let planetBaseRot = { x: 0, y: 0 };  // planet rotation
let logoBaseRot = { x: 0, y: 0 };    // logo rotation

// Helper function to get position from guided point (handles both direct positions and functions)
function getGuidedPointPos(guidedPoint) {
    return guidedPoint.pos;
}


// Map each continent to its target rotation (in radians)
const planetRotations = {
    Africa: new BABYLON.Vector3(
        BABYLON.Tools.ToRadians(-2),
        BABYLON.Tools.ToRadians(-65),
        BABYLON.Tools.ToRadians(0)
    ),
    NorthAmerica: new BABYLON.Vector3(
      BABYLON.Tools.ToRadians(8.5),
      BABYLON.Tools.ToRadians(53),
      BABYLON.Tools.ToRadians(28)
    ),
    SouthAmerica: new BABYLON.Vector3(
      BABYLON.Tools.ToRadians(-30),
      BABYLON.Tools.ToRadians(9),
      BABYLON.Tools.ToRadians(0)
    ),
    Europe: new BABYLON.Vector3(
      BABYLON.Tools.ToRadians(15),
      BABYLON.Tools.ToRadians(-80),
      BABYLON.Tools.ToRadians(-30)
    ),
    Asia: new BABYLON.Vector3(
      BABYLON.Tools.ToRadians(-23),
      BABYLON.Tools.ToRadians(-155),
      BABYLON.Tools.ToRadians(-3)
    ),
    Oceania: new BABYLON.Vector3(
      BABYLON.Tools.ToRadians(35),
      BABYLON.Tools.ToRadians(-195),
      BABYLON.Tools.ToRadians(-20)
    )
  };

const liveEarthTitles = {
    Africa:        "Live Earth - Africa",
    NorthAmerica:  "Live Earth - North America",
    SouthAmerica:  "Live Earth - South America",
    Europe:        "Live Earth - Europe",
    Asia:          "Live Earth - Asia",
    Oceania:       "Live Earth - Oceania"
};

// Each array is for years: [1950, 1975, 2000, 2025]. 
// The numbers are population in millions, e.g. 229 => 229 million.
const populationData = {
    Africa:      [229, 420, 814, 1550], 
    Asia:        [1394, 2360, 3714, 4980],
    Europe:      [549, 675, 726, 744],
    NorthAmerica:[227, 350, 491, 617],
    SouthAmerica:[114, 217, 350, 438],
    Oceania:     [13, 21, 31, 47]
};

const gdpData = {
    Africa:      [61, 159, 616, 3000],  
    Asia:        [260, 1200, 7600, 40000],
    Europe:      [500, 2200, 9100, 24000],
    NorthAmerica:[330, 2500, 11400, 28000],
    SouthAmerica:[88, 350, 1700, 4200],
    Oceania:     [15, 65, 400, 2000]
  };

const maxPop = 5500;        // e.g. top scale for population (in millions)
const maxGDP = 45000;       // e.g. top scale for GDP (in billions, or however you're storing it)
const xVals  = [0, 33.3, 66.6, 100]; // X positions for 4 data points: 1950, 1975, 2000, 2025

// Accepts the array of data (4 points) + which maximum to scale
function buildPathString(dataArr, maxVal) {
    let pathString = "";
    dataArr.forEach((val, i) => {
      // Map i => x coordinate
      const x = xVals[i];
      // Scale val up to 0..100, invert so bigger is “higher”
      const yVal = (val / maxVal) * 100; 
      const y = 100 - yVal;
      // Move or Line
      if (i === 0) {
        pathString += `M${x},${y} `;
      } else {
        pathString += `L${x},${y} `;
      }
    });
    return pathString;
}
  
function updateGraph(continent) {
    // 1) Grab population & GDP arrays for this continent
    const popArr = populationData[continent];  
    const gdpArr = gdpData[continent];
    
    // 2) Build the path strings for population & GDP lines
    const popPathD = buildPathString(popArr, maxPop);
    const gdpPathD = buildPathString(gdpArr, maxGDP);
  
    // ------ Update POPULATION lines ------
    glowPathPpl.setAttribute("d", popPathD);
    mainPathPpl.setAttribute("d", popPathD);
  
    // 3) Position the CSS-based live dot for population
    //    (Instead of setAttribute("cx"/"cy"), we’ll set .style.left/.style.top)
    
    // final data point’s X/Y in your 0..100 coordinate system
    const lastPopIndex = popArr.length - 1;
    const popXEnd = xVals[lastPopIndex];          // e.g. 0, 33.3, 66.6, or 100
    const popValue = popArr[lastPopIndex];
    const popYPercent = 100 - (popValue / maxPop)*100; 
    // Convert 0..100 into 0..100% for CSS
    dotPop.style.left = popXEnd + "%";
    dotPop.style.top  = popYPercent + "%";
  
    // ------ Update GDP lines ------

    glowPathGdp.setAttribute("d", gdpPathD);
    mainPathGdp.setAttribute("d", gdpPathD);
  
    // 4) Position the CSS-based live dot for GDP
    
    const lastGdpIndex = gdpArr.length - 1;
    const gdpXEnd = xVals[lastGdpIndex];
    const gdpValue = gdpArr[lastGdpIndex];
    const gdpYPercent = 100 - (gdpValue / maxGDP)*100;
    dotGdp.style.left = gdpXEnd + "%";
    dotGdp.style.top  = gdpYPercent + "%";
  }
  
  
// This function animates planetMesh's rotation from its current value to the target rotation.
function animatePlanetMeshTo(targetRotation, durationInSeconds, continentName) {
    const fps = 60;
    const totalFrames = fps * durationInSeconds;
  
    let rotationAnim = new BABYLON.Animation(
      "rotatePlanetMeshContinent",
      "rotation",
      fps,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
  
    // Ensure planetMesh.rotation is set.
    const currentRotation = planetMesh.rotation ? planetMesh.rotation.clone() : BABYLON.Vector3.Zero();
  
    let keys = [
      { frame: 0, value: currentRotation },
      { frame: totalFrames, value: targetRotation }
    ];
    rotationAnim.setKeys(keys);
  
    // Add easing for a smooth transition.
    let easingFunc = new BABYLON.CubicEase();
    easingFunc.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
    rotationAnim.setEasingFunction(easingFunc);
  
    planetMesh.animations = [];
    planetMesh.animations.push(rotationAnim);
  
    scene.beginAnimation(planetMesh, 0, totalFrames, false);

    if (highlightedContinentMesh) {
        highlightLayer.removeMesh(highlightedContinentMesh);
        highlightedContinentMesh = null;
    }
    
    const continentMeshes = planetMesh.getChildMeshes();
    const targetMesh = continentMeshes.find(m => m.name === continentName);
    if (!targetMesh) {
        console.error("Continent mesh not found for:", continentName);
        return;
    }
  
    highlightLayer.addMesh(targetMesh, new BABYLON.Color3(0.93, 0.4, 0.32));
    highlightedContinentMesh = targetMesh;
  }
  
 
  continentButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Stop any running alpha animations on the planet materials.
        let materials = [];
        if (planetMesh?.material) materials.push(planetMesh.material);
        materials.forEach(mat => {
            scene.stopAnimation(mat);
        });
        
        // Update button active classes.
        continentButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    
        // Get the continent name and target rotation.
        const continent = btn.getAttribute('data-continent');
        const targetRotation = planetRotations[continent];

        
        liveEarthTitle.textContent = liveEarthTitles[continent];

        updateGraph(continent);
    
        // Animate the planetMesh's rotation (this doesn't affect opacity).
        animatePlanetMeshTo(targetRotation, 1.5, continent);
  
    });
  });
  

function loadPlanet() {
    return new Promise((resolve) => {
        BABYLON.SceneLoader.ImportMesh("", "", "./assets/models/planet.glb", scene, function(meshes) {
            // Retrieve nodes by their names.
            planetRoot1 = scene.getTransformNodeByName("MainRoot");
            if (!planetRoot1) {
                console.error("Master __root__ node not found in the GLB.");
            }
            planetRoot2 = scene.getTransformNodeByName("PlanetRoot");
            planetBone  = scene.getTransformNodeByName("PlanetBone");
            // Try to get "PlanetMesh" by name; if not found, fallback to the first mesh
            planetMesh = meshes.find(m => m.name === "PlanetMesh" && m.material);
            planetPinCenter = scene.getTransformNodeByName("PinCenter");
    
            const materials = [];
            
            
            planetMesh.material.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
            planetMesh.material.needDepthPrePass = true;
            planetMesh.material.backFaceCulling = true;

            if (planetMesh?.material) materials.push(planetMesh.material);
            
            materials.forEach(mat => {
                mat.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
                mat.needDepthPrePass = true;
                mat.backFaceCulling = true;
            });

            planetRoot1.rotation.y += Math.PI;
            planetBaseRot = planetRoot1.rotation.clone();
            planetRoot1.setEnabled(false);

            // Resolve with the found nodes (wrapped in an object for clarity)
            resolve({planetRoot1,planetRoot2,planetBone,planetMesh,planetPinCenter});
        });
    });
}

function updateOverlayVisibility() {

    function hideElement(el) {
        if (!el) return;
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
        el.style.transition = 'opacity 0.5s ease';
    }

    function showElement(el) {
        if (!el) return;
        el.style.opacity = '1';
        el.style.pointerEvents = 'auto';
        el.style.transition = 'opacity 0.5s ease';
    }

    function disableButtons(buttonList) {
        buttonList.forEach(btn => {
            btn.style.pointerEvents = 'none';
            btn.style.opacity = '0';
            btn.style.zIndex = '-6';
            btn.style.transition = 'opacity 0.5s ease';
        });
    }

    function enableButtons(buttonList) {
        buttonList.forEach(btn => {
            btn.style.pointerEvents = 'auto';
            btn.style.opacity = '1';
            btn.style.zIndex = '6';
            btn.style.transition = 'opacity 0.5s ease';
        });
    }

    if (currentState === STATE_HOME_1) {
        setTimeout(() => {
            overlay.style.opacity = '1';
            overlay.style.pointerEvents = 'auto';
            overlay.style.width = '30%';
            overlay.style.transition = 'opacity 2s ease, width 1s ease';

            btnContainer.style.opacity = '1';
            btnContainer.style.zIndex = '6';
            btnContainer.style.pointerEvents = 'auto';
            btnContainer.classList.remove('animate-highlight');

            buttons.forEach(btn => {
                btn.style.pointerEvents = 'auto';
                btn.style.opacity = '1';
                btn.style.zIndex = '6';
                btn.classList.remove('animate-highlight');
                void btn.offsetWidth;
            });

            setTimeout(() => {
                buttons.forEach((button, index) => {
                    setTimeout(() => {
                        button.classList.add('animate-highlight');
                    }, index * 100);
                });
            }, 800);

            showElement(customText);
            customText.textContent = "Customize it";

            hideElement(overlayTitleBar);
            hideElement(liveIndicator);
            hideElement(continentButtons1);
            hideElement(continentButtons2);
            hideElement(graphsContainer);
            hideElement(modeButtonsContainer);
            disableButtons(modeButtons);
            

        }, 300);
    } 
    
    else if (currentState === STATE_HOME_2) {
        hideElement(modeButtonsContainer);
        disableButtons(modeButtons);
        setTimeout(() => {
            overlay.style.opacity = '1';
            overlay.style.pointerEvents = 'auto';
            overlay.style.width = '65%';
            overlay.style.height = '55%';
            overlay.style.marginTop = '0';
            overlay.style.transition = 'opacity 2s ease, width 1s ease';
            overlay.style.zIndex = '3';

            hideElement(btnContainer);
            buttons.forEach(btn => {
                btn.style.pointerEvents = 'none';
            });

            hideElement(customText);
            showElement(overlayTitleBar);

        }, 200);

        setTimeout(() => {
            showElement(liveIndicator);
            showElement(continentButtons1);
            showElement(continentButtons2);
            showElement(graphsContainer);
        }, 200);
    }
    
    else if (currentState === STATE_HOME_3) {
        setTimeout(() => {
            hideElement(btnContainer);
            buttons.forEach(btn => {
                btn.style.pointerEvents = 'none';
            });

            customText.style.opacity = '1';
            customText.style.pointerEvents = 'none';
            customText.style.transition = 'opacity 0.5s ease';
            customText.textContent = "Navigation mode:";

            hideElement(overlayTitleBar);
            hideElement(liveIndicator);
            hideElement(continentButtons1);
            hideElement(continentButtons2);
            hideElement(graphsContainer);
            

            textBottom.style.color = '#081529';

            hideElement(portalControls);
            setTimeout(() => {
                portalControls.style.zIndex = '-6';
                portalInfoOverlay.style.zIndex = '-6';
            }, 500);

            if (previousState === STATE_EXPLORE) {
                setTimeout(() => {
                    overlay.style.transition = 'opacity 2s ease';
                    overlay.style.opacity = '1';
                    overlay.style.pointerEvents = 'auto';
                    overlay.style.width = '22%';
                    overlay.style.height = '28%';
                    overlay.style.marginTop = '-6%';
                    overlay.style.zIndex = '3';
                }, 1000);
            } else {
                overlay.style.transition = 'none';
                overlay.style.opacity = '0';
                overlay.style.pointerEvents = 'auto';
                overlay.style.width = '22%';
                overlay.style.height = '28%';
                overlay.style.marginTop = '-6%';
                overlay.style.zIndex = '3';

                setTimeout(() => {
                    overlay.style.transition = 'opacity 2s ease';
                    overlay.style.opacity = '1';
                }, 500);
            }
            enableButtons(modeButtons);
            showElement(modeButtonsContainer);

        }, 50);
    }
    
    else if (currentState >= STATE_EXPLORE && currentState != maxGuidedState) {
        setTimeout(() => {
            overlay.style.opacity = '0';
            overlay.style.pointerEvents = 'none';
            overlay.style.transition = 'opacity 0.2s ease';
            overlay.style.zIndex = '-3';

            showElement(btnContainer);
            disableButtons(buttons); // Buttons visible but not clickable
            btnContainer.classList.remove('animate-highlight');

            customText.style.opacity = '1';
            customText.style.pointerEvents = 'none';

            hideElement(liveIndicator);
            hideElement(continentButtons1);
            hideElement(continentButtons2);
            hideElement(graphsContainer);

            textBottom.style.color = '#E5E3DE';

            canvasContainer.style.transition = 'all 1s ease';

            setTimeout(() => {
                showElement(portalControls);
                portalControls.style.zIndex = '6';
                portalInfoOverlay.style.zIndex = '10';
            }, 1000);
        }, 50);
    } else if (currentState >= STATE_EXPLORE && currentState === maxGuidedState) {
        hideElement(portalControls);
        portalInfoOverlay.classList.remove('visible');
        setTimeout(() => {
            portalControls.style.zIndex = '-6';
            portalInfoOverlay.style.zIndex = '-6';
        }, 500);
    }
    
    else {
        setTimeout(() => {
            overlay.style.opacity = '0';
            overlay.style.pointerEvents = 'none';
            overlay.style.transition = 'opacity 0.2s ease';

            showElement(btnContainer);
            enableButtons(buttons);

            showElement(customText);

            hideElement(liveIndicator);
            hideElement(continentButtons1);
            hideElement(continentButtons2);
            hideElement(graphsContainer);
        }, 50);
    }
}


// Update Overlay Position
function updateOverlayPosition() {
    // 1) Choose the reference 3D point for the overlay:
    const referencePoint = new BABYLON.Vector3(0, 0, 0);
  
    if (!scene || !camera || !engine) return;
  
    // 2) Project the reference point into 2D coordinates
    const projected = BABYLON.Vector3.Project(
      referencePoint,
      BABYLON.Matrix.Identity(),
      scene.getTransformMatrix(),
      camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight())
    );
    
    // 3) Get the overlay and the canvas bounding box
    
    if (!overlay) return;
    const canvasRect = canvas.getBoundingClientRect();
  
    // 4) Calculate final overlay position
    //    i.e. add the canvas's top/left to the projected (x, y).
    const offsetX = canvasRect.left;
    const offsetY = canvasRect.top;
  
    overlay.style.left = (offsetX + projected.x - overlay.offsetWidth / 2) + 'px';
    overlay.style.top = (offsetY + projected.y - overlay.offsetHeight / 2) + 'px';
}
  

// Define setClipPath and removeClipPath functions globally
function setClipPath(isOverlayState, duration = 500) {

    const isChatOpen = chatContainer.classList.contains('chat-open');
    let rightInset, leftInset;
    
    // If we're in STATE_EXPLORE, do not change the canvas layout.
    if (currentState >= STATE_EXPLORE && currentState != maxGuidedState) {
        // Get current clip values as computed—preserve layout
        const computedStyle = window.getComputedStyle(canvasContainer);
        const topInsetAdjusted = parseFloat(computedStyle.getPropertyValue('--clip-top')) +50 || 0;
        const bottomInsetAdjusted = parseFloat(computedStyle.getPropertyValue('--clip-bottom')) + 50 || 0;
        const leftInset = parseFloat(computedStyle.getPropertyValue('--clip-left')) || 0;
        const rightInset = parseFloat(computedStyle.getPropertyValue('--clip-right')) || 0;

        positionChatContainer(
            document.getElementById('chatContainer').classList.contains('chat-open'),
            true,
            { topInsetAdjusted, bottomInsetAdjusted, leftInset, rightInset }
        );

        return;
    }

    if (isChatOpen) {
        // When chat is open, reserve 25% (desktop) for chat.
        rightInset = isDesktop ? 0.25 * window.innerWidth : 20;
        leftInset = 20;
        header.style.width = 'calc(100% - 40px)';
        overlayText.style.left = '20px';
        overlayText.style.right = '25%';
        renderCanvas.style.transform = 'translate(-12.5%)';
        textBox1.style.width = 'calc(75% - 40px)';
        textBox1.style.transform = 'translate(-20%)';
        setTimeout(() => {
            textBox1.style.transform = `translateX(${(parseFloat(getComputedStyle(header).width) - parseFloat(getComputedStyle(textBox1).width))/(-2)+20}px)`;
        }, 500);

    } else {
        // Otherwise use the smaller insets.
        rightInset = isDesktop ? 0.125 * window.innerWidth : 20;
        leftInset = isDesktop ? 0.125 * window.innerWidth : 20;
        header.style.width = isDesktop ? '75%' : 'calc(100% - 40px)';
        overlayText.style.left = '12.5%';
        overlayText.style.right = '12.5%';
        renderCanvas.style.transform = 'translate(0)';
        textBox1.style.width = '100%';
        textBox1.style.transform = 'translate(0)';
    }

    const bottomInset = 40;
    let topInset, topInsetAdjusted, bottomInsetAdjusted;
    if (!isOverlayState) {
        // Home state
        if (isDesktop) {
            const textBox1Height = textBox1 && textBox1.style.opacity !== '0' ? textBox1.scrollHeight : 0;
            topInset = textBox1Height + 110; // spacing margin
            const verticalOffset = (topInset - bottomInset) / 2;
            topInsetAdjusted = topInset - verticalOffset;
            bottomInsetAdjusted = bottomInset + verticalOffset;
        } else {
            const textBox1Height = textBox1 && textBox1.style.opacity !== '0' ? textBox1.scrollHeight : 0;
            topInset = textBox1Height + 75;
            const verticalOffset = (topInset - bottomInset) / 2;
            topInsetAdjusted = topInset - verticalOffset;
            bottomInsetAdjusted = bottomInset + verticalOffset;
        }
    } else {
        // Overlay states: use fixed inset value.
            topInset = 95;
            const verticalOffset = (topInset - bottomInset) / 2;
        topInsetAdjusted = topInset - verticalOffset;
        bottomInsetAdjusted = bottomInset + verticalOffset;
    }

    // Apply calculated clip-path variables.
    canvasContainer.style.setProperty('--clip-top', `${topInsetAdjusted}px`);
    canvasContainer.style.setProperty('--clip-right', `${rightInset}px`);
    canvasContainer.style.setProperty('--clip-bottom', `${bottomInsetAdjusted}px`);
    canvasContainer.style.setProperty('--clip-left', `${leftInset}px`);
    canvasContainer.style.setProperty('--clip-radius', `12px`);
    const verticalOffsetFinal = (topInset - bottomInset) / 2;
    canvasContainer.style.setProperty('--vertical-offset', `${verticalOffsetFinal}px`);

    canvasContainer.style.transition = `all ${duration}ms ease`;

    // Recalculate chat container position normally.
    positionChatContainer(isChatOpen, isOverlayState, { topInsetAdjusted, bottomInsetAdjusted, leftInset, rightInset });
}

// Helper to position the chat container within the reserved space.
function positionChatContainer(isChatOpen, isOverlayState, insets) {
    

    // If chat is closed, show as a small button.
    if (!isChatOpen) {
        chatContainer.style.position = 'fixed';
        chatContainer.style.left = 'auto';
        chatContainer.style.top = 'auto';
        chatContainer.style.bottom = '20px';
        chatContainer.style.right = '20px';
        chatContainer.style.width = '60px';
        chatContainer.style.height = '60px';
        return;
    }

    // When open, define fixed margins.
    const marginLeft = 20;
    const marginRight = 20;
    const marginTop = 20;
    const marginBottom = 40;

    // Horizontal positioning: reserve right 25% of the window width.
    const chatReservedAreaWidth = window.innerWidth * 0.25;
    const reservedAreaLeft = window.innerWidth - chatReservedAreaWidth;
    const chatLeft = reservedAreaLeft + marginLeft;
    const chatWidth = chatReservedAreaWidth - (marginLeft + marginRight);

    // Vertical positioning: use the computed visible area from the clip insets.
    const visibleBottom = window.innerHeight - insets.bottomInsetAdjusted;
    // For non-FINAL (non-overlay) states, you may adjust an extra offset (here +100),
    // but in FINAL we want no extra shift.
    
    let chatTop;
    if (!isOverlayState) {
        chatTop = insets.topInsetAdjusted *1.5 + marginTop*2-3;  // normal state offset
    } else {
        chatTop = insets.topInsetAdjusted  + marginTop -2;        // in FINAL, no extra offset
    }
    // Here we choose the chat height equal to the visible area between visibleTop and visibleBottom.
    // (You can further adjust if desired.)
    const chatHeight = visibleBottom - insets.topInsetAdjusted + 10 ;

    chatContainer.style.position = 'fixed';
    chatContainer.style.top = chatTop + 'px';
    chatContainer.style.left = chatLeft + 'px';
    chatContainer.style.width = chatWidth + 'px';
    chatContainer.style.height = chatHeight + 'px';

    // Clear any conflicting bottom/right properties.
    chatContainer.style.bottom = '';
    chatContainer.style.right = '';
}

function removeClipPath(duration = 1500) {


    // Set clip-path insets to zero for full view
    canvasContainer.style.setProperty('--clip-top', `0px`);
    canvasContainer.style.setProperty('--clip-right', `0px`);
    canvasContainer.style.setProperty('--clip-bottom', `0px`);
    canvasContainer.style.setProperty('--clip-left', `0px`);
    canvasContainer.style.setProperty('--clip-radius', `0px`);
    canvasContainer.style.setProperty('--vertical-offset', `0px`);
    renderCanvas.style.transform = 'translate(0)';

    // Set transition duration
    canvasContainer.style.transition = `all ${duration}ms ease`;
}

// Define updateClipPathOnResize in the global scope
function updateClipPathOnResize() {
    if (currentState === STATE_HOME) {
        setClipPath(false);
    } else if (currentState >= STATE_EXPLORE && currentState != maxGuidedState) {
        removeClipPath();
        setClipPath(false);
    } else if (currentState > STATE_EXPLORE) {
        
    } else {
        setClipPath(true);
    }
}

// Define text segments for each scroll threshold
const textSegments = [
    "Whether it's integrating 3D tools into an existing ecosystem, ",
    "building custom 3D applications and data visualizations, ",
    "or creating entire virtual worlds, I've got it covered! Ready to start?"
];

// Loading progress tracking
let loadingProgress = 0;
let loadingTotal = 0;
const loadingBar = document.querySelector('.loading-bar');

function updateLoadingProgress(loaded, total) {
    loadingProgress = loaded;
    loadingTotal = total;
    const percentage = Math.min((loaded / total) * 100, 100);
    if (loadingBar) {
        loadingBar.style.width = percentage + '%';
    }
    console.log(`Loading progress: ${loaded}/${total} (${percentage.toFixed(1)}%)`);
}

function showHomePageBehindLoader() {
    // Show home page behind the loading screen (loading screen stays on top)
    document.getElementById('home-page').style.display = 'flex';
    // Keep loading screen visible
}

function hideLoadingScreen() {
    // Hide loading screen to reveal the home page that's already loaded behind it
    document.getElementById('loading-screen').style.display = 'none';
}

function setupInitialLayout() {
    const isDesktop = window.innerWidth >= screenWidth;
    
    // Ensure textBox1 is visible and properly rendered
    if (textBox1) {
        textBox1.style.opacity = "1";
    }
    
    // Force a reflow to ensure styles are applied
    if (textBox1) {
        textBox1.offsetHeight; // This forces a reflow
    }
    
    // Since we have loading screen covering, we can do multiple attempts with shorter delays
    const attemptLayout = (attempt = 1, maxAttempts = 3) => {
        try {
            // Get the actual rendered height of textBox1
            let textBox1Height = 0;
            if (textBox1) {
                // Try multiple ways to get the height
                textBox1Height = textBox1.scrollHeight || textBox1.offsetHeight || parseFloat(getComputedStyle(textBox1).height) || 0;
                console.log(`Layout attempt ${attempt}: TextBox1 height:`, textBox1Height);
            }
            
            // If we got a reasonable height, proceed
            if (textBox1Height > 0) {
                // Adjust header height dynamically with minimum values
                if (isDesktop) {
                    const headerHeight = Math.max(textBox1Height + 75, 140); // Minimum 140px for desktop
                    header.style.height = `${headerHeight}px`;
                    console.log("Desktop header height set to:", headerHeight);
                } else {
                    const headerHeight = Math.max(textBox1Height + 40, 100); // Minimum 100px for mobile
                    header.style.height = `${headerHeight}px`;
                    console.log("Mobile header height set to:", headerHeight);
                }
                
                // Set the clip path
                setClipPath(false);
                
            } else if (attempt < maxAttempts) {
                // Retry after a short delay
                setTimeout(() => attemptLayout(attempt + 1, maxAttempts), 30);
            } else {
                // Final fallback
                console.warn("Could not get textBox1 height, using fallback");
                if (isDesktop) {
                    header.style.height = "140px";
                } else {
                    header.style.height = "100px";
                }
                setClipPath(false);
            }
            
        } catch (error) {
            console.error("Error in setupInitialLayout:", error);
            // Fallback to default heights
            if (isDesktop) {
                header.style.height = "140px";
            } else {
                header.style.height = "100px";
            }
            setClipPath(false);
        }
    };
    
    // Start the layout attempts
    attemptLayout();
}

// Real loading implementation
document.addEventListener('DOMContentLoaded', async function () {
    const isDesktop = window.innerWidth >= screenWidth;
    
    try {
        // Initialize the scene first
        scene = createScene();
        
        // Wait for core scene assets to load
        await waitForCoreSceneLoading();
        
        // Show home page behind the loading screen (loading screen stays visible)
        showHomePageBehindLoader();
        
        // Setup UI layout immediately while loading screen covers it
        setTimeout(function() {
            setupInitialLayout();
        }, 50);
        
        // Keep loading screen visible for 1.5 seconds to allow layout to fully settle
        setTimeout(function() {
            hideLoadingScreen();
            console.log("Loading screen hidden, home page revealed");
        }, 800);
        
        // Load additional assets in background (as requested)
        idle(async () => {
            await loadBYDCarAsync(scene);
            ENV_ROOTS.byd = carRoot;
            customizeCar({ color: "yellow", trim: "lightBlue" });
            rotateObject(carRoot);
            console.log("BYD loaded in background");
        });
/*         idle(async () => {
            await loadatlasflowAsync(scene);
            ENV_ROOTS.atlasflow = atlasflowRoot;
            console.log("atlasflow loaded in background");
        }); */
/*         idle(async () => {
            await loadFdaAsync(scene);
            ENV_ROOTS.fda = fdaRoot;
            console.log("FDA loaded in background");
        }); */
        
    } catch (error) {
        console.error("Error during scene loading:", error);
        // Show error and hide loading screen anyway
        hideLoadingScreen();
    }
});

document.querySelectorAll(".color-btn").forEach(button => {

    const color = button.getAttribute("data-color");
    button.classList.toggle("active", color === currentColor);

    button.addEventListener("click", () => {
        const selected = button.getAttribute("data-color");
        if (selected === currentColor) return;

        currentColor = selected;
        console.log("Color clicked:", selected);

        infoSound.currentTime = 0.15;
        infoSound.play();

        const result = customizeCar({ color: currentColor });
        if (!result) return;

        currentColor = result.finalColor;
        currentTrim  = result.finalTrim;

        // Sync .active for color buttons
        document.querySelectorAll(".color-btn").forEach(btn => {
            const btnColor = btn.getAttribute("data-color");
            btn.classList.toggle("active", btnColor === currentColor);
        });

        // Sync .active for trim buttons
        document.querySelectorAll(".trim-btn").forEach(btn => {
            const btnTrim = btn.getAttribute("data-trim");
            btn.classList.toggle("active", btnTrim === currentTrim);
        });
    });
});


document.querySelectorAll(".trim-btn").forEach(button => {

    const trim = button.getAttribute("data-trim");
    button.classList.toggle("active", trim === currentTrim);

    button.addEventListener("click", () => {
        const selected = button.getAttribute("data-trim");
        if (selected === currentTrim) return;

        currentTrim = selected;
        console.log("Trim clicked:", selected);

        infoSound.currentTime = 0.15;
        infoSound.play();

        const result = customizeCar({ trim: currentTrim });
        if (!result) return;

        currentTrim  = result.finalTrim;
        currentColor = result.finalColor;

        // Sync .active for trim buttons
        document.querySelectorAll(".trim-btn").forEach(btn => {
            const btnTrim = btn.getAttribute("data-trim");
            btn.classList.toggle("active", btnTrim === currentTrim);
        });

        // Sync .active for color buttons
        document.querySelectorAll(".color-btn").forEach(btn => {
            const btnColor = btn.getAttribute("data-color");
            btn.classList.toggle("active", btnColor === currentColor);
        });
    });
});



// Then in your toggle handler:
viewCarBtn.addEventListener("click", () => {
    isInteriorView = !isInteriorView;
    triggerWhiteFade(() => {
        if (!isInteriorView) {
            viewCarBtnImg.src = "./assets/images/interior.png";
            viewCarBtn.innerHTML = `<img src="./assets/images/interior.png" /> View interior`;
            camera.detachControl();
            camera.setTarget(cameraPivot);
            camera.fov = 0.47;
            camera.alpha = BABYLON.Tools.ToRadians(-50);
            camera.beta = BABYLON.Tools.ToRadians(80);
            camera.lowerRadiusLimit = camera.upperRadiusLimit = 4;
            carRoot.rotation.y = BABYLON.Tools.ToRadians(0);
            //rotationEnabled = true;
            scene.environmentIntensity = .6;
            scene.imageProcessingConfiguration.exposure = 1.2;
            glowLayer.isEnabled = true;
            textBottom.style.color = "#081529";
            carConfigurator.style.opacity = 1;
            
        } else {
            viewCarBtnImg.src = "./assets/images/exterior.png";
            viewCarBtn.innerHTML = `<img src="./assets/images/exterior.png"/> Exterior view`;
            camera.attachControl();
            camera.setTarget(new BABYLON.Vector3(0, 1.25, 0.1));
            camera.fov = 1.2;
            camera.alpha = BABYLON.Tools.ToRadians(90);
            camera.beta = BABYLON.Tools.ToRadians(82);
            camera.lowerRadiusLimit = camera.upperRadiusLimit = 0;
            carRoot.rotation.y = BABYLON.Tools.ToRadians(0);
            //rotationEnabled = true;
            scene.environmentIntensity = .6;
            scene.imageProcessingConfiguration.exposure = 1.2;
            glowLayer.isEnabled = false;
            textBottom.style.color = "#E5E3DE";
            carConfigurator.style.opacity = 1;
        }  
    });
});

function idle(cb) {
    if ('requestIdleCallback' in window) {
        requestIdleCallback(cb, { timeout: 2000 });
    } else {
        setTimeout(cb, 0);
    }
}

function triggerWhiteFade(callback) {
    
    whiteFade.style.transition = "none";      // no fade-in
    whiteFade.style.opacity = "1";            // show white immediately

    requestAnimationFrame(() => {
        if (callback) callback();           // run your camera switch instantly
        whiteFade.style.transition = "opacity 1s ease";
        whiteFade.style.opacity = "0";        // fade out smoothly
    });
}

async function waitForCoreSceneLoading() {
    // Wait for all core assets to finish loading
    const coreAssetPromises = [];
    
    // Wait a bit for createScene to set up the promises
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Collect all the loading promises
    if (window.logoLoadingPromise) {
        coreAssetPromises.push(
            window.logoLoadingPromise.then(() => {
                console.log("Logos loaded");
                return "logos";
            })
        );
    }
    
    if (window.planetLoadingPromise) {
        coreAssetPromises.push(
            window.planetLoadingPromise.then(() => {
                console.log("Planet loaded");
                return "planet";
            })
        );
    }
    
    if (window.spaceshipLoadingPromise) {
        coreAssetPromises.push(
            window.spaceshipLoadingPromise.then(() => {
                console.log("Spaceship loaded");
                return "spaceship";
            })
        );
    }
    
    if (window.rockringLoadingPromise) {
        coreAssetPromises.push(
            window.rockringLoadingPromise.then(() => {
                console.log("Rock ring loaded");
                return "rockring";
            })
        );
    }
    
    // Update progress as each asset loads
    let loadedCount = 0;
    const totalCount = coreAssetPromises.length;
    updateLoadingProgress(0, totalCount);
    
    const promises = coreAssetPromises.map(promise => 
        promise.then(asset => {
            loadedCount++;
            updateLoadingProgress(loadedCount, totalCount);
            return asset;
        })
    );
    
    // Wait for all core assets to load
    await Promise.all(promises);
    console.log("All core scene assets loaded");
}

function createScene() {
    canvas = renderCanvas;
    engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, antialias: true});
    scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
    // Cap the render rate to ~60fps
    //engine.getFps = () => 60; // For internal Babylon stats only

    // debug layer
    const debugLayer = new BABYLON.DebugLayer();
    //debugLayer.show();

    // add fog
    scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
    scene.fogColor = new BABYLON.Color3(13/255, 13/255, 38/255);
    scene.fogStart = 0;
    scene.fogEnd = 300;

    cameraPivot = new BABYLON.TransformNode("cameraPivot", scene);
    cameraPivot.position.set(0, 0, originalCameraZ);   // (-24)

    orbitRadius = Math.abs(originalCameraZ);     // 24

    camera = new BABYLON.ArcRotateCamera(
        "Camera",
        -Math.PI / 2,          // alpha → looking straight down -Z
        Math.PI  / 2,          // beta  → level with horizon
        orbitRadius,           // radius → 24
        cameraPivot,           // target we just created
        scene
    );

    camera.maxZ = 10_000;
    camera.minZ = 0.01;
    camera.lowerRadiusLimit = camera.upperRadiusLimit = orbitRadius; // lock zoom for now

    camAlphaTarget = camera.alpha;
    camBetaTarget  = camera.beta;

    BABYLON.Effect.ShadersStore["portalWarpFragmentShader"] = `
        precision highp float;
        varying vec2 vUV;
        uniform sampler2D textureSampler;
        uniform float intensity;

        void main(void) {
            vec2 center = vec2(0.5);
            vec2 toUV = vUV - center;
            float dist = length(toUV);

            float rippleFade = 1.0 - pow((dist - 0.5) * 2.0, 2.0);
            float ripple = sin(dist * 20.0 - intensity * 20.0) * 0.02 * intensity * rippleFade;

            vec2 uv = vUV + normalize(toUV) * ripple;

            vec4 color = texture2D(textureSampler, uv);

            vec2 texel = vec2(1.0) / vec2(1280.0, 720.0);
            vec4 blur = (
                texture2D(textureSampler, uv + vec2(texel.x, 0.0)) +
                texture2D(textureSampler, uv - vec2(texel.x, 0.0)) +
                texture2D(textureSampler, uv + vec2(0.0, texel.y)) +
                texture2D(textureSampler, uv - vec2(0.0, texel.y))
            ) * 0.25;

            gl_FragColor = mix(color, blur, 0.3);
        }
    `;

    warpEffect = new BABYLON.PostProcess(
        "portalWarp",
        "portalWarp",       // shader name
        ["intensity"],      // uniforms
        null,               // samplers
        1.0,
        camera
    );
    warpEffect.onApply = function (effect) {
        effect.setFloat("intensity", warpEffect._intensity || 0);
    };
    warpEffect._intensity = 0;
    camera.detachPostProcess(warpEffect);
    
    const environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("./assets/textures/environment7.env", scene);
    scene.environmentTexture = environmentTexture;
    environmentTexture.rotationY = BABYLON.Tools.ToRadians(0);
    scene.environmentIntensity = 1;
    scene.imageProcessingConfiguration.exposure = 1.8;
    scene.imageProcessingConfiguration.contrast = 1.3;



    // Create a HighlightLayer for the scene.
    highlightLayer = new BABYLON.HighlightLayer("hl", scene);
    highlightLayer.innerGlow = false; 
    highlightLayer.outerGlow = true;

    highlightLayer.intensity = 1; // Adjust intensity as needed
    // Optionally adjust blur sizes to get a softer glow:
    highlightLayer.blurHorizontalSize = 2;
    highlightLayer.blurVerticalSize = 2;
    highlightLayer.isEnabled = false;


    let lightDirection = new BABYLON.Vector3(3, 3, -3);
    const hemiLight = new BABYLON.HemisphericLight("HemisphericLight", lightDirection, scene);
    hemiLight.intensity = 0.5;
    hemiLight.diffuse = new BABYLON.Color3(1, 1, 1);
    

    // -------------------------
    // Updated runRenderLoop: call updateOverlayPosition each frame.
    // -------------------------
    engine.runRenderLoop(() => {
        scene.render();
        updateOverlayPosition();
        const fpsCounter = document.getElementById('fpsCounter');
        fpsCounter.textContent = `FPS: ${engine.getFps().toFixed(0)}`;
    });

    window.addEventListener("resize", function () {
        engine.resize();

        const isDesktop = window.innerWidth >= screenWidth;
        setTimeout(() => {
            if (currentState === STATE_HOME) {
                // Use the consistent layout setup function
                setupInitialLayout();
                
                // Set icon sizes
                if (isDesktop) {
                    logoIcon.style.height = "35px";
                    menuIcon.style.height = "35px";
                    logoIcon.style.top = "25px";
                    menuIcon.style.top = "25px";
                } else {
                    logoIcon.style.height = "30px";
                    menuIcon.style.height = "30px";
                }
            } else {
                header.style.height = `60px`;
            if (isDesktop) {
                logoIcon.style.height = "25px";
                menuIcon.style.height = "25px";
                logoIcon.style.top = "17px";
                menuIcon.style.top = "17px";
            } else {
                logoIcon.style.height = "21px";
                menuIcon.style.height = "21px";
                }
            }
            updateClipPathOnResize();
            updatePlanetVisibility();

        }, 60);
    });

    audioManager = {
        audios: [],    // registered audios
        enabled: true, // global flag
        add(audio) {
            this.audios.push(audio);
        },
        setEnabled(state) {
            this.enabled = state;
            this.audios.forEach(audio => {
                if (!audio) return;
                audio.muted = !state;
            });
        }
    };
    
    backgroundMusic = new Audio('./assets/audio/spaceVoyage.m4a');
    teleportSound = new Audio('./assets/audio/teleport.m4a');
    infoSound  = new Audio("./assets/audio/info4.m4a");

    teleportSound.volume = 0.75;

    audioManager.add(backgroundMusic);
    audioManager.add(teleportSound);
    audioManager.add(infoSound);

    // Audio button toggle


    let audioEnabled = true; // Start ON (assuming based on your icon)

    // click toggles audio
    audioBtn.addEventListener("click", () => {
        audioEnabled = !audioEnabled;
    
        audioIcon.src = audioEnabled
            ? "./assets/images/audio_on.png"
            : "./assets/images/audio_off.png";
    
        audioManager.setEnabled(audioEnabled);
    
        console.log(audioEnabled ? "Audio Enabled" : "Audio Muted");
    });

    // Logo button functionality - navigate to home page
    const logoIcon = document.querySelector(".logo-icon");
    if (logoIcon) {
        logoIcon.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Logo button clicked - navigating to home page");
            
            // Navigate to home state if not already there
            if (currentState !== STATE_HOME && !isAnimating) {
                previousState = currentState;
                currentState = STATE_HOME;
                console.log(`Logo: changing to state ${currentState}`);
                updateState();
            }
        });
        
        // Add hover effect for better UX
        logoIcon.addEventListener("mouseenter", () => {
            logoIcon.style.transform = "scale(1.1)";
            logoIcon.style.cursor = "pointer";
        });
        logoIcon.addEventListener("mouseleave", () => {
            logoIcon.style.transform = "scale(1)";
        });
    }

    // Add click listeners to your 4 overlay buttons


    function setNavMode(isGuided){
        guidedMode = isGuided;
        console.log("guidedMode", guidedMode);
        console.log("currentState", currentState);
        maxState = guidedMode ? maxGuidedState : maxFreeState;

        /* knob position */
        navToggle.classList.toggle("guided",  guidedMode);
        navToggle.classList.toggle("free",   !guidedMode);

        /* animate camera */
        animateCameraPosition(!guidedMode);
        if (currentState >= STATE_EXPLORE) {
            console.log("current state is equal or higher than state explore");
            attachShipControls(true, guidedMode);
            if (!guidedMode) {
                console.log("guidedMode is false");
                currentState = STATE_EXPLORE;
            } else {
                console.log("guidedMode is true");
                currentState = STATE_EXPLORE;

                moveToGuidedState(currentState);
                console.log("cameraPivot parent", cameraPivot.parent);
                console.log("pathFollower position", pathFollower.position);
                console.log("pathFollower rotation", pathFollower.rotation);
                console.log("shiproot position", shipRoot.position);
            }
        } else {
            attachShipControls(false, guidedMode);
        }
        

        /* highlight the little buttons */
        btnElementsMode.forEach(b => b.classList.remove("active"));
        btnElementsMode[ isGuided ? 0 : 1 ].classList.add("active");
    }

    btnElementsMode.forEach((btn, idx) => {
        btn.addEventListener("click", () => setNavMode(idx === 0));
    });

    navToggle.addEventListener("click", () => {
        // toggle current state
        const nowGuided = navToggle.classList.contains("guided");
        setNavMode(!nowGuided);
    });
    
    // If you want the first button active by default:
    let currentModeIndex = 0;
    btnElementsMode[currentModeIndex].classList.add('active');

    function loadLogo(fileName) {
        return new Promise((resolve) => {
            BABYLON.SceneLoader.ImportMesh("", "", "./assets/models/" + fileName, scene, function(meshes) {
                meshes.forEach(mesh => mesh.setEnabled(false));
                const mainLogo = meshes[0];
                logoMesh.push(mainLogo);
                mainLogo.position = new BABYLON.Vector3(0, -0.5, 0);
                mainLogo.rotation = new BABYLON.Vector3(0, 0, 0);
                resolve({ fileName, meshes });
            });
        });
    }
    
    const logoPromise = Promise.all([
        loadLogo("logo.glb"),
        loadLogo("logo_chain2.glb"),
        loadLogo("logo_cookie.glb"),
        loadLogo("logo_badge.glb")
    ]);
    
    // Store globally for loading tracking
    window.logoLoadingPromise = logoPromise;
    
    logoPromise.then(results => {
        const order = ["logo.glb", "logo_chain2.glb", "logo_cookie.glb", "logo_badge.glb"];
        const logos = order.map(fileName => {
            const result = results.find(r => r.fileName === fileName);
            return result.meshes;
        });
    
        spaceRoot = new BABYLON.TransformNode("spaceRoot", scene);
        logoRoot = new BABYLON.TransformNode("logoRoot", scene);
        logoRoot.parent = spaceRoot;
        logoRoot.rotationQuaternion = null; // Ensure rotation works
    
        // Flatten and parent to logoRoot
        logos.flat().forEach(mesh => {
            mesh.parent = logoRoot;
        });
    
        // Function to toggle logo visibility
        function showLogo(index) {
            logos.forEach((logoMeshes, i) => {
                logoMeshes.forEach(mesh => mesh.setEnabled(i === index));
            });
        }
    
        // Setup buttons
        btnElements.forEach((btn, idx) => {
            btn.addEventListener('click', () => {
                showLogo(idx);
                btnElements.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    
        // Show first by default
        let currentLogoIndex = 0;
        showLogo(currentLogoIndex);
        btnElements[currentLogoIndex].classList.add('active');
    });
    
    
    
    // After your Promise.all for logos, also load the planet:
    const planetPromise = loadPlanet();
    
    // Store globally for loading tracking
    window.planetLoadingPromise = planetPromise;
    
    planetPromise.then(() => {
        if (planetMesh) {   
            // Set the planetMesh rotation directly to SouthAmerica's rotation
            planetMesh.rotation.copyFrom(planetRotations.SouthAmerica);
        
            // Highlight SouthAmerica by default
            animatePlanetMeshTo(planetRotations.SouthAmerica, 1.5, "SouthAmerica");
            
            liveEarthTitle.textContent = liveEarthTitles.SouthAmerica;
        
            // Update continent button state: find the button with data-continent="SouthAmerica" and mark it as active.
            
            continentButtons.forEach(btn => btn.classList.remove('active')); // Clear any active classes.
            const southAmericaButton = document.querySelector('[data-continent="SouthAmerica"]');
            if (southAmericaButton) {
                southAmericaButton.classList.add('active');
            }
        }
    });

    // babylon scene loader
    const rockringPromise = new Promise((resolve) => {
        BABYLON.SceneLoader.ImportMesh("", "", "./assets/models/rockring.glb", scene, function(meshes, particleSystems, skeletons, animationGroups) {
            console.log(meshes);
            rockRing = meshes[0];
            rockRingAnimationGroups = animationGroups;
            animationGroups.forEach(group => group.stop());
            rockRing.position = new BABYLON.Vector3(0, 0, -90);
            meshes.forEach(mesh => {
                if (mesh.material) {
                    mesh.material.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;
                    mesh.material.needDepthPrePass = true;
                    mesh.material.backFaceCulling = false;
                }
            });
            rockRing.setEnabled(false);
            resolve();
        });
    });
    
    // Store globally for loading tracking
    window.rockringLoadingPromise = rockringPromise;

    defaultPortalMesh = BABYLON.MeshBuilder.CreatePlane("defaultInfoPlaceholder", { width: 1, height: 1 }, scene);
    defaultPortalMesh.isVisible = false;
    defaultPortalMesh.setEnabled(false);
    
    portalInfo.set(defaultPortalMesh, {
        sceneKey: "main",
        logo: "./assets/images/info.png",
        title: "Information Panel",
        html: `<p>Get closer to points of interest to learn more about them.</p>`,
        radius: .0001 // so it doesn’t trigger auto-popup
    });

    const spaceshipPromise = new Promise((resolve) => {
        BABYLON.SceneLoader.ImportMesh("", "", "./assets/models/spaceship.glb", scene,
            (meshes) => {
                shipRoot = scene.getTransformNodeByName("shiproot");
                if (!shipRoot) throw new Error("shiproot not found in GLB");
                shipMesh = meshes[0];
                shipRoot.position           = new BABYLON.Vector3(0, -0.8, -24);
                const s = shipRoot.scaling;
                shipRoot.scaling.set(Math.abs(s.x), Math.abs(s.y), Math.abs(s.z));
                sceneSmoke = createSmoke();
                engineFlame = createEngineFlame(scene);
                cameraPivot.parent = shipRoot;
                resolve();
            });
    });
    
    // Store globally for loading tracking
    window.spaceshipLoadingPromise = spaceshipPromise;
    
    spaceshipPromise.then(() => {
        cameraPivot.position = new BABYLON.Vector3(0, 0.7, 0);

        shipRoot.rotationQuaternion ??= BABYLON.Quaternion.Identity();

        shipOriginalPose = {
                rot   : shipRoot.rotationQuaternion.clone(),   // upright, +Z forward
                scale : shipRoot.scaling.clone()
            };
            // 1. Create the portal(s) – this returns the mesh and assigns it to the variable
            updatePortals(false);               //  babylonEditorPortal now === a Disc mesh

            portalInfo.set(babylonEditorPortal, {
                sceneKey: "editor",
                logo  : "./assets/images/babylon_logo.png",
                title : "Babylon.js Editor",
                html  : `
                    <p>A Babylon.js web editor with real-time collaborative support I've been building that prioritizes user experience, performance and accessibility of artists and designers in 3D web workflows.</p>
                    <img src="./assets/images/babylonDashboard.png">
                    <p>Engineered with React + TypeScript + Tailwind and Supabase (auth, storage, realtime). I also designed all the UX and built the full toolchain.</p>
                    <p>The result is a modern 3D creation environment where artists and designers can build interactive WebGL experiences without installs, just open a link and create.</p>
                    <img src="./assets/textures/babylonEditor.png">
                `,
                radius: 6
            });
        
            portalInfo.set(atlasflowPortal, {
                sceneKey: "atlasflow",
                logo  : "./assets/images/blender_logo.png",
                title : "Atlasflow (Blender addon)",
                html  : `
                    <p>Atlasflow is a powerful Blender addon that takes color atlasing to the next-level by enabling per-face PBR editing within a single material and two lightweight 128×128 pixel textures.</p>
                    <img src="./assets/textures/atlasflow_nodes.png">
                    <p>With an intuitive toolset, you can achieve an immense range of PBR value combinations and face-specific settings with unprecedented ease and nearly zero texture footprint.</p>
                    <iframe src="https://www.youtube.com/embed/nHKqTXtzG2U" frameborder="0" allowfullscreen></iframe>`,
                radius: 6
            });
        
            portalInfo.set(bydSeagullPortal, {
                sceneKey: "byd",
                logo  : "./assets/images/byd_logo.png",
                title : "BYD Car Visualizer (Demo)",
                html  : `
                    <p>A 3D car visualizer I built with Babylon.js, showcasing the Seagull model in a fully interactive web experience.</p>
                    <img src="./assets/textures/bydSeagull-All.png">
                    <p>This demo highlights real-time rendering, optimized GLB assets, material switching, and smooth navigation directly in the browser. It demonstrates how WebGL can bring automotive products online in a highly engaging and accessible way.</p>
                `,
                radius: 6
            });
        
            portalInfo.set(fdaPortal, {
                sceneKey: "fda",
                logo  : "./assets/images/fda_logo.png",
                title : "FDA Training Platform",
                html  : `
                    <p>The FDA Training Platform is an interactive simulation designed to train staff in FDA-compliant warehouse operations. Built with Babylon.js, it demonstrates inspection protocols, safety procedures, and regulatory compliance workflows.</p>
                    <img src="./assets/images/fda2.png">
                    <p>3D assets were created by Meetkai’s 3D artists. I handled scene implementation, UI, interactivity, and overall integration—plus 3D adjustments to ensure everything worked seamlessly inside Babylon.js. The platform helps FDA personnel practice navigating storage areas, quality control stations, and documentation processes in a realistic environment.</p>
                    <iframe src="https://www.youtube.com/embed/pRrM0jb3-8s?si=VcQi2w0Gxbjium7Q&amp;start=32" frameborder="0" allowfullscreen></iframe>
                `,
                radius: 6
            });
            
            createGuidedCurve()
        }
    );

    setTimeout(() => {
        // 3. Hand that map to the info-system **after** it’s real
        portalInfoSystem = initPortalInfoSystem({
            scene, camera, ship : shipRoot, meta : portalInfo,
            infoBtnElm   : document.getElementById("info-btn"),
            infoIconElm  : document.getElementById("info-icon"),
            overlayElm   : document.getElementById("portal-info-overlay"),
            overlayLogo  : document.getElementById("portal-logo"),
            overlayTitleElm : document.getElementById("portal-title"),
            overlayBodyElm  : document.getElementById("portal-content"),
            defaultPortal: defaultPortalMesh
        });
    }, 3000);

    initializeScrollActions();
    ENV_ROOTS.main = scene.getTransformNodeByName("spaceRoot") || scene;  // fallback = whole scene

    // Create editor cube for camera positioning
    // createEditorCube(scene);

    return scene;
}

function createEditorCube(scene) {
    // Create the editor cube
    const editorCube = BABYLON.MeshBuilder.CreateBox("editorCube", {size: 4}, scene);
    editorCube.position = new BABYLON.Vector3(40, 3, -50);
    
    // Create a bright material so it's easily visible
    const editorMaterial = new BABYLON.StandardMaterial("editorMaterial", scene);
    editorMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1); // Orange color
    editorMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5); // Slight glow
    editorCube.material = editorMaterial;
    
    // Make it always visible (not affected by fog)
    //editorCube.infiniteDistance = true;
    
    // Initialize the camera position variable
    updateEditorCubeCamPos();
    
    // Create position gizmo - only for this cube, only visible in main scene
    const gizmoManager = new BABYLON.GizmoManager(scene);
    gizmoManager.positionGizmoEnabled = true;
    gizmoManager.rotationGizmoEnabled = true;
    gizmoManager.scaleGizmoEnabled = false;
    gizmoManager.boundingBoxGizmoEnabled = false;
    
    // Set fixed scaling (not adaptive to screen/distance)
    gizmoManager.scaleRatio = 0.8; // Fixed scale for position gizmo
    
    // Set rotation gizmo scale smaller than position gizmo (after attachment)
    setTimeout(() => {
        if (gizmoManager.gizmos.rotationGizmo) {
            gizmoManager.gizmos.rotationGizmo.scaleRatio = 0.6;
        }
    }, 100);
    
    // Attach gizmo only to the editor cube and keep it always attached
    gizmoManager.attachToMesh(editorCube);
    
    // Prevent gizmo from being affected by other mesh selections
    gizmoManager.usePointerToAttachGizmos = false;
    
    // Show/hide gizmo based on current scene and distance
    function updateGizmoVisibility() {
        const shouldShowForScene = currentScene === "main";
        
        // Check distance from camera to editor cube
        let shouldShowForDistance = true;
        if (shouldShowForScene && camera) {
            const distanceToGizmo = BABYLON.Vector3.Distance(camera.position, editorCube.position);
            shouldShowForDistance = distanceToGizmo <= 50; // Hide if more than 50m away
        }
        
        const shouldShow = shouldShowForScene && shouldShowForDistance;
        gizmoManager.positionGizmoEnabled = shouldShow;
        gizmoManager.rotationGizmoEnabled = shouldShow;
    }
    
    // Initial visibility check
    updateGizmoVisibility();
    
    // Store the update function globally so we can call it when scene changes
    window.updateGizmoVisibility = updateGizmoVisibility;
    
    // Update gizmo visibility based on camera distance (check every frame)
    scene.onBeforeRenderObservable.add(() => {
        if (currentScene === "main") {
            updateGizmoVisibility();
        }
    });
    
    // Update camera position when cube is moved
    editorCube.onAfterWorldMatrixUpdateObservable.add(() => {
        updateEditorCubeCamPos();
    });
    
    // Store reference globally
    window.editorCube = editorCube;
    window.gizmoManager = gizmoManager;
    
    console.log("Editor cube created at position:", editorCube.position);
    
    function updateEditorCubeCamPos() {
        editorCubeCamPos = new BABYLON.Vector3(
            editorCube.position.x - 13,
            editorCube.position.y + 3.5,
            editorCube.position.z + 15
        );
        
        // Update the guided point directly in the array
        const guidedPoint = guidedPoints.find(p => p.id === 7);
        if (guidedPoint) {
            guidedPoint.pos.x = editorCubeCamPos.x;
            guidedPoint.pos.y = editorCubeCamPos.y;
            guidedPoint.pos.z = editorCubeCamPos.z;
        }
        
        console.log("Editor cube camera position updated:", editorCubeCamPos);
        console.log("Guided point 7 position updated:", guidedPoint ? guidedPoint.pos : "not found");
    }
}

async function loadFdaAsync(scene, onProgress = () => {}) {
    const gltfPath = "./assets/models/fda/";
    const fdaFile = "warehouse.gltf";
    const lightmapPath = "./assets/models/fda/lightmaps/";

    fdaRoot = new BABYLON.TransformNode("fdaRoot", scene);
    fdaMeshes = [];

    await idlePromise();

    const container = await BABYLON.SceneLoader.LoadAssetContainerAsync(gltfPath, fdaFile, scene);
    container.addAllToScene();

    // Process meshes
    container.meshes.forEach(mesh => {
        if (!(mesh instanceof BABYLON.Mesh)) return;
        
        // Hide mk_collider mesh
        if (mesh.name === "mk_collider") {
            mesh.setEnabled(false);
            mesh.isVisible = false;
            return; // Don't add to fdaMeshes array
        }
        
        mesh.parent = fdaRoot;
        mesh.setEnabled(false);
        fdaMeshes.push(mesh);
    });

    // Position the entire FDA scene 2 meters below
    fdaRoot.position.set(0, -1.2, 3);
    fdaRoot.scaling.set(1, 1, -1);

    // Load and assign lightmaps
    // await loadFdaLightmaps(scene, fdaMeshes, lightmapPath);

    ENV_ROOTS.fda = fdaRoot;
    onProgress(1);

    return;

    function idlePromise() {
        return new Promise(resolve =>
            "requestIdleCallback" in window
                ? requestIdleCallback(() => resolve(), { timeout: 16 })
                : setTimeout(resolve, 16)
        );
    }
}

async function loadFdaLightmaps(scene, meshes, lightmapPath) {
    console.log("Loading FDA lightmaps...");
    
    // Get all lightmap files (assuming they follow the naming convention: [meshName]_lightmap.png)
    const lightmapPromises = meshes.map(async (mesh) => {
        if (!mesh.material) return;
        
        const meshName = mesh.name;
        const lightmapUrl = `${lightmapPath}${meshName}_lightmap.png`;
        
        try {
            // Create lightmap texture
            const lightmapTexture = new BABYLON.Texture(
                lightmapUrl,
                scene,
                false, // noMipmap
                false, // invertY
                BABYLON.Texture.TRILINEAR_SAMPLINGMODE,
                () => {
                    // On success: Assign lightmap to material
                    if (mesh.material) {
                        mesh.material.lightmapTexture = lightmapTexture;
                        mesh.material.lightmapTexture.coordinatesIndex = 1; // Use second UV set
                        mesh.material.useLightmapAsShadowmap = true;
                        console.log(`Applied lightmap to: ${meshName}`);
                    }
                },
                (error) => {
                    // On error: Lightmap not found (this is normal for meshes without lightmaps)
                    console.log(`No lightmap found for: ${meshName}`);
                }
            );
        } catch (error) {
            console.log(`Lightmap loading failed for: ${meshName}`);
        }
    });
    
    // Wait for all lightmap loading attempts to complete
    await Promise.allSettled(lightmapPromises);
    console.log("FDA lightmap loading complete");
}

async function loadatlasflowAsync(scene, onProgress = () => {}) {
    const gltfPath = "./assets/models/atlasflow/";
    const atlasflowFile = "atlasflowMap.gltf"; // changed to .gltf

    atlasflowRoot = new BABYLON.TransformNode("atlasflowRoot", scene);
    atlasflowMeshes = [];

    await idlePromise();

    const container = await BABYLON.SceneLoader.LoadAssetContainerAsync(gltfPath, atlasflowFile, scene);
    container.addAllToScene();


    container.meshes.forEach(mesh => {
        if (!(mesh instanceof BABYLON.Mesh)) return;
        mesh.parent = atlasflowRoot;
        mesh.setEnabled(false);
        atlasflowMeshes.push(mesh);
    });

    atlasflowRoot.position.set(0, 0, 0);
    atlasflowRoot.scaling.set(1, 1, -1);

    ENV_ROOTS.atlasflow = atlasflowRoot;

    onProgress(1);

    return

    function idlePromise() {
        return new Promise(resolve =>
            "requestIdleCallback" in window
                ? requestIdleCallback(() => resolve(), { timeout: 16 })
                : setTimeout(resolve, 16)
        );
    }
}

async function loadBYDCarAsync(scene, onProgress = () => {}) {
    const gltfPath = "./assets/models/byd/";
    const carFile = "byd_seagull.gltf"; // changed to .gltf

    carRoot = new BABYLON.TransformNode("carRoot", scene);
    carMeshes = [];
    const allAnimations = [];

    // 🌟 Optional: glow layer
    glowLayer = new BABYLON.GlowLayer("glow", scene);
    glowLayer.intensity = 1.3;
    glowLayer.isEnabled = false;

    await idlePromise();

    const container = await BABYLON.SceneLoader.LoadAssetContainerAsync(gltfPath, carFile, scene);
    container.addAllToScene();

    container.meshes.forEach(mesh => {
        if (!(mesh instanceof BABYLON.Mesh)) return;
    
        const material = mesh.material;
        if (material && material.ambientTexture) {
            material.ambientTexture.coordinatesIndex = 1;
        }
    });

    container.animationGroups.forEach(group => {
        group.stop();
        group.reset();
        allAnimations.push(group);
    });

    container.meshes.forEach(mesh => {
        if (!(mesh instanceof BABYLON.Mesh)) return;
        mesh.parent = carRoot;
        mesh.setEnabled(false);
        carMeshes.push(mesh);
    });

    carRoot.position.set(0, 0, 0);
    carRoot.scaling.set(1, 1, -1);

    ENV_ROOTS.byd = carRoot;

    onProgress(1);

    return

    function idlePromise() {
        return new Promise(resolve =>
            "requestIdleCallback" in window
                ? requestIdleCallback(() => resolve(), { timeout: 16 })
                : setTimeout(resolve, 16)
        );
    }
}

function customizeCar({ color, trim } = {}) {
    const carMaterial = scene.getMaterialByName("Body_Paint");
    /* 1.  Defaults (fall back to whatever is current on the car)         */
    let newColor = color ?? currentColor;
    let newTrim  = trim  ?? currentTrim;

    const colorProvided = color !== undefined;
    const trimProvided  = trim !== undefined;

    /* 2.  Sanity‑check the names                                         */
    const colorSetting = colorSettings[newColor];
    if (!colorSetting) return;

    if (!trimConfigs[newTrim]) {
        // Unknown trim → pick the first trim that accepts the color
        newTrim = Object.keys(trimConfigs)
                        .find(t => trimConfigs[t].allowed.includes(newColor));
    }
    if (!newTrim) return;   // still nothing? bail out

    /* 3.  Resolve incompatibilities                                      */
    const trimAllowsColor = trimConfigs[newTrim].allowed.includes(newColor);

    if (!trimAllowsColor) {
        if (colorProvided && !trimProvided) {
            /* user changed COLOR → keep it, swap TRIM */
            newTrim = Object.keys(trimConfigs)
                            .find(t => trimConfigs[t].allowed.includes(newColor));
        } else if (!colorProvided && trimProvided) {
            /* user changed TRIM → keep it, swap COLOR */
            newColor = trimConfigs[newTrim].allowed.includes(currentColor)
                       ? currentColor
                       : trimConfigs[newTrim].allowed[0];
        } else {
            /* both provided or nothing matched → prefer COLOR, adjust TRIM */
            newTrim = Object.keys(trimConfigs)
                            .find(t => trimConfigs[t].allowed.includes(newColor));
        }
    }

    /* 4.  Apply body paint                                               */
    const paint = colorSettings[newColor];
    carMaterial.albedoColor        = BABYLON.Color3.FromHexString(paint.hex);
    carMaterial.metallic           = paint.metallic;
    carMaterial.roughness          = paint.roughness;
    carMaterial.sheen.intensity    = paint.sheen;

    /* 5.  Apply trim‑specific materials                                  */
    const chosenTrim = trimConfigs[newTrim];
    for (const [meshName, matName] of Object.entries(chosenTrim.materials)) {
        const mesh = scene.getMeshByName(meshName);
        const mat  = scene.getMaterialByName(matName);
        if (mesh && mat) mesh.material = mat;
    }

    console.log("Applied", { finalColor: newColor, finalTrim: newTrim });
    return { finalColor: newColor, finalTrim: newTrim };
}

function rotateObject(target) {
    let isDragging = false;
    let lastX = 0;

    const sensitivityX = 0.005;

    function onPointerDown(evt) {
        isDragging = true;
        lastX = evt.clientX;
        canvas.style.cursor = "grabbing";
    }

    function onPointerUp() {
        isDragging = false;
        canvas.style.cursor = "default";
    }

    function onPointerMove(evt) {
        if (!isDragging || !rotationEnabled) return;
        const dx = evt.clientX - lastX;
        target.rotation.y -= dx * sensitivityX;
        lastX = evt.clientX;
    }

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerUp);
    canvas.addEventListener("pointermove", onPointerMove);

    return () => {
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointerup", onPointerUp);
        canvas.removeEventListener("pointerleave", onPointerUp);
        canvas.removeEventListener("pointermove", onPointerMove);
    };
}

function updatePortalControls(showReturnButton) {
    const returnBtn = document.getElementById("return-btn");

    if (showReturnButton) {
        if (returnBtn) return; // already shown

        if (navToggle) navToggle.style.display = "none";

        const btn = document.createElement("button");
        btn.className = "control-btn return-btn-with-text";
        btn.id = "return-btn";

        btn.innerHTML = `
            <img src="./assets/images/return.png" alt="Return">
            <span class="return-label">Go Back</span>
        `;

        btn.addEventListener("click", () => {

            activateEnvironment("main");
            updatePortalControls(false);
        });

        portalControls.appendChild(btn);
    } else {
        if (returnBtn) returnBtn.remove();
        if (navToggle) navToggle.style.display = "";
    }
}


function initPortalInfoSystem({
    scene, camera, ship, meta, infoBtnElm, infoIconElm,
    overlayElm, overlayLogo, overlayTitleElm, overlayBodyElm, defaultPortal}) {

    
    /* ── constants ─────────────────────────────────────── */
    const defaultPortalMesh = defaultPortal;
    let userClosedOverlay = false;
    
    infoSound.volume = 0.6;

    /* ── state ─────────────────────────────────────────── */
    let focusPortal   = null;    // currently “nearest & visible” portal
    let overlayOpen   = false;   // info panel status
    let activePortal   = null;      // portal whose info is showing
    const shownPortals = new Set(); // ← portals that were auto-opened once

    /* ── helpers ──────────────────────────────────────── */
    function openOverlay(portalMesh = defaultPortalMesh) {
        let data = meta.get(portalMesh) || meta.get(defaultPortalMesh);
        if (!data) return;
    
        activePortal = portalMesh;      // remember what we’re showing
        overlayLogo.src       = data.logo;
        overlayTitleElm.textContent = data.title;
        overlayBodyElm.innerHTML    = data.html;
    
        overlayElm.classList.add("visible");
        infoIconElm.src = "./assets/images/close.png";
        infoIconElm.classList.add("rotate");
        infoBtnElm.classList.remove("glow-info");
        overlayOpen = true;

        infoSound.currentTime = 0;
        infoSound.play();
    }
    
    
    function closeOverlay() {
        overlayElm.classList.remove("visible");
        infoIconElm.src = "./assets/images/info.png";
        overlayOpen = false;
        infoIconElm.classList.remove("rotate");
        userClosedOverlay = true;

        // If still within proximity, show glow
        if (focusPortal) {
            infoBtnElm.classList.add("glow-info");
        }
    }
    
    function clearFocus() {
        focusPortal = null;
        userClosedOverlay = false; // ← allows glow again if user returns
        if (overlayOpen && activePortal !== defaultPortalMesh) {
            closeOverlay();
        }
        infoBtnElm.classList.remove("glow-info");
    }
    

    /* ── button click ─────────────────────────────────── */
    infoBtnElm.addEventListener("click", () => {
        if (overlayOpen) {
            closeOverlay();
            infoSound.currentTime = 0.13;
            infoSound.play();
            if (currentScene == "byd") {
                carConfigurator.style.opacity = 1;
                carConfigurator.style.zIndex = "9";
            }
            return; // Early exit: we just closed it
        }
    
        // OPEN overlay logic
        if (currentScene !== "main") {
            const portalMesh = [...meta.entries()].find(([_, data]) => data.sceneKey === currentScene)?.[0];
            if (portalMesh) openOverlay(portalMesh);
            if (currentScene == "byd") {
                carConfigurator.style.opacity = 0;
                carConfigurator.style.zIndex = "-10";
            }
        } else {
            const portalToShow = (focusPortal && meta.has(focusPortal)) ? focusPortal : defaultPortalMesh;
            openOverlay(portalToShow);
        }
    });
    
    /* ── per-frame proximity check ────────────────────── */
    scene.registerBeforeRender(() => {
        /* Only in FREE nav mode */
        if (currentScene !== "main") return;

        let nearest = null;
        let nearestDist2 = Infinity;
        let target = null;
        if (guidedMode) {
            target = cameraPivot;
        } else {
            target = ship;
        }
        
        meta.forEach((data, mesh) => {
            if (!(mesh instanceof BABYLON.AbstractMesh)) return;
            
            let r = null;
            if (!guidedMode) {
                r = (data.radius ?? 6) * 7;
            } else {
                r = (data.radius ?? 6) * 5;
            }
            const targetPos = target.getAbsolutePosition();
            const dist2 = BABYLON.Vector3.DistanceSquared(targetPos, mesh.position);
            const inView = camera.isInFrustum(mesh);
    
            if (dist2 < r * r && inView) {
                if (dist2 < nearestDist2) {
                    nearest = mesh;
                    nearestDist2 = dist2;
                }
            }
        });
    
        /* handle focus changes */
        if (nearest) {
            if (nearest !== focusPortal) { // NEW FOCUS
                console.log("[InfoSystem] New portal in focus!", nearest.name);
                focusPortal = nearest;
    
                if (overlayOpen) {
                    const changed = activePortal !== nearest;
                    openOverlay(focusPortal);
                    if (changed) {
                        infoSound.play().catch(e =>
                            console.error("[InfoSystem] Ping sound failed", e));
                    }
                } else {
                    if (!shownPortals.has(nearest)) {
                        infoBtnElm.click();           // auto-open once
                        shownPortals.add(nearest);
                        infoSound.play();
                    } else {
                        if (!guidedMode) {
                            infoBtnElm.classList.add("glow-info");  // glow + ping once
                            infoSound.currentTime = 0.13;
                            infoSound.play();
                        } else {
                            openOverlay(focusPortal);
                        }
                    }
                }
            }
        } else {
            if (focusPortal !== null) {
                console.log("[InfoSystem] No portals in range. Clearing focus.");
            }
            clearFocus();
        }
    });
    return {closeOverlay, openOverlay};
}

function animateEntrance(target, rotate) {
    // Create animation groups
    const animationGroup = new BABYLON.AnimationGroup("EntranceAnimation");

    // Rotation animation (Y-axis, 180 degrees)
    const rotationAnim = new BABYLON.Animation(
        "rotationAnim",
        "rotation.y",
        60, // 60 FPS
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    // Keyframes for rotation (0 to 180 degrees)
    rotationAnim.setKeys([
        { frame: 0, value: target.rotation.y + Math.PI/4}, // Start at current rotation
        { frame: 90, value: target.rotation.y } // Rotate 180 degrees
    ]);

    // Easing for rotation (EaseOutCubic)
    const rotationEase = new BABYLON.CubicEase();
    rotationEase.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
    rotationAnim.setEasingFunction(rotationEase);

    // Scaling animation
    const scaleAnim = new BABYLON.Animation(
        "scaleAnim",
        "scaling",
        60, // 60 FPS
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    // Keyframes for scaling (0.25 to 1)
    scaleAnim.setKeys([
        { frame: 0, value: new BABYLON.Vector3(0.4, 0.4, -0.4) },
        { frame: 90, value: new BABYLON.Vector3(1, 1, -1) }
    ]);

    // Easing for scaling (EaseOutBack for a smooth bounce-in)
    const scaleEase = new BABYLON.CubicEase();
    scaleEase.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
    scaleAnim.setEasingFunction(scaleEase);

    // Attach animations to the target
    target.animations = [rotationAnim, scaleAnim];

    // Add animations to the animation group
    if (rotate) {
        animationGroup.addTargetedAnimation(rotationAnim, target);
    }
    animationGroup.addTargetedAnimation(scaleAnim, target);

    // Start the animation (no pointer events involved)
    animationGroup.play(true);
}


function activateEnvironment(key) {
    previousScene = currentScene;
    currentScene = key;

    // Update gizmo visibility based on new scene
    if (window.updateGizmoVisibility) {
        window.updateGizmoVisibility();
    }

    for (const [name, root] of Object.entries(ENV_ROOTS)) {
        if (!root) continue;               // not loaded yet
        const on = name === key;

        /* ---------- enable / disable the hierarchy ---------- */
        if (typeof root.setEnabled === 'function') {
            root.getChildMeshes().forEach(m => m.setEnabled(on));
        } else if (root.meshes) {          // AssetContainer fallback
            root.meshes.forEach(m => m.setEnabled(on));
        } else if (root instanceof BABYLON.Scene) {
            root.meshes.forEach(m => m.setEnabled(on));
        }

        if (name === 'byd' && on) {
            camera.fov = 0.47;
            camera.alpha = BABYLON.Tools.ToRadians(-50);
            camera.beta = BABYLON.Tools.ToRadians(80);
            camera.lowerRadiusLimit = camera.upperRadiusLimit = 4;
            attachShipControls(false, guidedMode);
            camera.detachControl();
            carRoot.rotation.y = BABYLON.Tools.ToRadians(0);
            rotationEnabled = true;
            scene.environmentIntensity = .6;
            scene.imageProcessingConfiguration.exposure = 1.2;
            glowLayer.isEnabled = true;
            textBottom.style.color = "#081529";
            carConfigurator.style.zIndex = "9";
            carConfigurator.style.opacity = 1;
            portalInfoSystem.closeOverlay();
            animateEntrance(carRoot, false);
            updatePortalControls(true);

        } else if (name === 'atlasflow' && on) {
            camera.fov = 0.54;
            camera.alpha = BABYLON.Tools.ToRadians(-70);
            camera.beta = BABYLON.Tools.ToRadians(60);
            camera.lowerRadiusLimit = 30;  // Min zoom distance (closer view)
            camera.upperRadiusLimit = 70;  // Max zoom distance (farthest view)
            camera.radius = 70; 
            camera.upperBetaLimit = BABYLON.Tools.ToRadians(75);
            camera.lowerBetaLimit = BABYLON.Tools.ToRadians(0);
            attachShipControls(false, guidedMode);
            camera.attachControl(canvas, true);

            scene.environmentIntensity = 1;
            scene.imageProcessingConfiguration.exposure = 1.2;

            atlasflowRoot.rotation.y = BABYLON.Tools.ToRadians(0);
            portalInfoSystem.closeOverlay();
            updatePortalControls(true);
            animateEntrance(atlasflowRoot, true);
            scene.fogEnd = 120;
            scene.fogStart = 50;

        } else if (name === 'fda' && on) {
            camera.fov = 0.9;
            camera.alpha = BABYLON.Tools.ToRadians(0);
            camera.beta = BABYLON.Tools.ToRadians(90);
            camera.lowerRadiusLimit = 0;
            camera.upperRadiusLimit = 0;
            camera.radius = 70;
            camera.upperBetaLimit = null;
            camera.lowerBetaLimit = null
            attachShipControls(false, guidedMode);
            camera.attachControl(canvas, true);

            scene.environmentIntensity = 1;
            scene.imageProcessingConfiguration.exposure = 1.2;

            fdaRoot.rotation.y = BABYLON.Tools.ToRadians(0);
            portalInfoSystem.closeOverlay();
            updatePortalControls(true);
            animateEntrance(fdaRoot, true);
            scene.fogEnd = 120;
            scene.fogStart = 50;

        } else if (name === 'main' && on) {
            scene.fogStart = 0;
            scene.fogEnd = 300;
            scene.environmentIntensity = 1;
            scene.imageProcessingConfiguration.exposure = 1.8;

            camera.upperBetaLimit = null;
            camera.lowerBetaLimit = null;
            camera.lowerRadiusLimit = camera.upperRadiusLimit = guidedMode ? 0 : 4;
            if (previousScene === 'byd') {
                camera.alpha = guidedPoints.find(p => p.id === 7).alpha;
                camera.beta  = guidedPoints.find(p => p.id === 7).beta;
                if (!guidedMode) {
                    shipRoot.position = getGuidedPointPos(guidedPoints.find(p => p.id === 7)).clone();
                    shipRoot.position.x *= -1;
                }
            } else if (previousScene === 'atlasflow') {
                camera.alpha = guidedPoints.find(p => p.id === 6).alpha;
                camera.beta  = guidedPoints.find(p => p.id === 6).beta;
                if (!guidedMode) {
                    shipRoot.position = getGuidedPointPos(guidedPoints.find(p => p.id === 6)).clone();
                    shipRoot.position.x *= -1;
                }
            } else if (previousScene === 'fda') {
                camera.alpha = guidedPoints.find(p => p.id === 6).alpha;
                camera.beta  = guidedPoints.find(p => p.id === 6).beta;
                if (!guidedMode) {
                    shipRoot.position = getGuidedPointPos(guidedPoints.find(p => p.id === 6)).clone();
                    shipRoot.position.x *= -1;
                }
            } else {
                camera.alpha = guidedPoints.find(p => p.id === 4).alpha;
                camera.beta  = guidedPoints.find(p => p.id === 4).beta;
                if (!guidedMode) {
                    shipRoot.position = getGuidedPointPos(guidedPoints.find(p => p.id === 4)).clone();
                }
            }
            
            
            camera.fov = 0.7;
            camera.attachControl();
            attachShipControls(true, guidedMode);
            updatePortalControls(false);
            carConfigurator.style.zIndex = "-6";
            carConfigurator.style.opacity = 0;
            textBottom.style.color = "#E0E0EB";
            glowLayer.isEnabled = false;
            
            // Open information panel if in guided mode when returning from a portal
            if (guidedMode && previousScene && previousScene !== 'main') {
                openPortalInfoAfterReturn();
            }
        }
    }
}

function openPortalInfoAfterReturn() {
    // Wait for the scene to settle and portal detection to work properly
    let attempts = 0;
    const maxAttempts = 10;
    
    const checkForPortalFocus = () => {
        attempts++;
        
        // Get all portals and find which one we're facing
        const allPortals = [bydSeagullPortal, atlasflowPortal, fdaPortal, babylonEditorPortal].filter(p => p);
        
        if (allPortals.length === 0) {
            if (attempts < maxAttempts) {
                setTimeout(checkForPortalFocus, 200);
            }
            return;
        }
        
        // Find the closest portal that we're facing
        let closestPortal = null;
        let closestDistance = Infinity;
        
        const cameraPosition = camera.position;
        const cameraForward = camera.getForwardRay().direction;
        
        allPortals.forEach(portal => {
            const portalPosition = portal.getAbsolutePosition();
            const toPortal = portalPosition.subtract(cameraPosition);
            const distance = toPortal.length();
            
            // Check if we're generally facing this portal (dot product > 0.3 means roughly facing)
            const dot = BABYLON.Vector3.Dot(cameraForward.normalize(), toPortal.normalize());
            
            if (dot > 0.3 && distance < closestDistance) {
                closestDistance = distance;
                closestPortal = portal;
            }
        });
        
        // If we found a portal we're facing, open its info
        if (closestPortal && portalInfoSystem) {
            console.log(`[Portal Return] Opening info for: ${closestPortal.name}`);
            portalInfoSystem.openOverlay(closestPortal);
        } else if (attempts < maxAttempts) {
            // Try again if we haven't found a portal yet
            setTimeout(checkForPortalFocus, 200);
        } else {
            // Fallback: just open the default portal info
            console.log("[Portal Return] Fallback: Opening default portal info");
            if (portalInfoSystem) {
                portalInfoSystem.openOverlay();
            }
        }
    };
    
    // Start checking after a short delay to let everything settle
    setTimeout(checkForPortalFocus, 500);
}

function fadeMaterial(show, durationInSeconds, material) {
    if (!material) return;

    const fps = 30;
    const totalFrames = durationInSeconds * fps;
    const from = show ? 0.01 : 1;
    const to   = show ? 1 : 0;

    if (material instanceof BABYLON.ShaderMaterial) {
        // ShaderMaterial: animate globalAlpha manually
        const startTime = performance.now();
        const durationMs = durationInSeconds * 1000;

        function easeOutCubic(t) {
            return 1 - Math.pow(1 - t, 3);
        }

        const animate = (now) => {
            const elapsed = now - startTime;
            const t = Math.min(elapsed / durationMs, 1);
            const easedT = easeOutCubic(t);
            const currentAlpha = from + (to - from) * easedT;

            material.setFloat("globalAlpha", currentAlpha);

            if (t < 1) {
                requestAnimationFrame(animate);
            }
        };

        material.setFloat("globalAlpha", from);
        requestAnimationFrame(animate);

    } else {
        // Standard/PBR: Use Babylon animation system
        material.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
        material.needDepthPrePass = true;
        material.backFaceCulling = true;

        const alphaAnimation = new BABYLON.Animation(
            "fadeAlpha",
            "alpha",
            fps,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        alphaAnimation.setKeys([
            { frame: 0, value: from },
            { frame: totalFrames, value: to }
        ]);

        const easing = new BABYLON.CubicEase();
        easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
        alphaAnimation.setEasingFunction(easing);

        material.animations = [alphaAnimation];
        scene.beginAnimation(material, 0, totalFrames, false);

        if (show) {
            setTimeout(() => {
                material.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;
                material.needDepthPrePass = false;
                material.backFaceCulling = false;
            }, durationInSeconds * 1000);
        }
    }
}

function updatePortals(isVisible) {

    if (!bydSeagullPortal) {
        bydSeagullPortal = createPortal({
            scene,
            engine,
            camera,
            target: shipRoot,
            pullIn: true,
            portalPosition: new BABYLON.Vector3(40, 4, -50),
            teleportPosition: new BABYLON.Vector3(-1.8, .7, -4),
            iblUrl: "./assets/textures/environment7.env",
            portalRadius: 6,
            name: "bydSeagull",
            title: "BYD Car Visualizer",
            texturePath: "./assets/textures/bydSeagull.png",
            onEnter: () => activateEnvironment('byd')
        });
    }
    bydSeagullPortal.setEnabled(isVisible);
    const bydSeagullPortalMaterial = bydSeagullPortal.material;
    fadeMaterial(isVisible, 4, bydSeagullPortalMaterial);

    if (!atlasflowPortal) {
        atlasflowPortal = createPortal({
            scene,
            engine,
            camera,
            target: shipRoot,
            pullIn: true,
            portalPosition: new BABYLON.Vector3(50, -3, 20),
            teleportPosition: new BABYLON.Vector3(-37, .7, -4),
            iblUrl: "./assets/textures/environment7.env",
            portalRadius: 6,
            name: "atlasflowTour",
            title: "Atlasflow",
            texturePath: "./assets/textures/atlasflow.png",
            //onEnter: () => activateEnvironment('atlasflow')
            onEnter: () => {
                attachShipControls(false, guidedMode);
                window.open(
                "https://superhivemarket.com/products/atlasflow",
                "_blank",
                "noopener,noreferrer"
                );
                attachShipControls(true, guidedMode);
            }
        });
    } 
    atlasflowPortal.setEnabled(isVisible);

    //const teleportPosition = editorCube.position.clone();
    //teleportPosition.x = -teleportPosition.x;
    if (!babylonEditorPortal) {
        babylonEditorPortal = createPortal({
            scene,
            engine,
            camera,
            target: shipRoot,
            pullIn: false,
            //portalPosition: editorCube.position.clone(),
            //teleportPosition: teleportPosition,
            portalPosition: new BABYLON.Vector3(-50, -3, 20),
            teleportPosition: new BABYLON.Vector3(37, .7, -4),
            iblUrl: "./assets/textures/environment7.env",
            portalRadius: 6,
            name: "babylonEditor",
            title: "Babylon.js Editor",
            texturePath: "./assets/textures/babylonEditor.png",
            //onEnter: () => activateEnvironment('editor')
            onEnter: () => {
                attachShipControls(false, guidedMode);
                // window.open(
                //   "https://babylonjseditor.vercel.app/dashboard",
                //   "_blank",
                //   "noopener,noreferrer"
                // );
                alert("Unfortunately, I cannot allow direct access to the link at this moment, but I'd be happy to talk about it more in depth upon request!");
                attachShipControls(true, guidedMode);
              }
        });
    } 
    babylonEditorPortal.setEnabled(isVisible);

    if (!fdaPortal) {
        fdaPortal = createPortal({
            scene,
            engine,
            camera,
            target: shipRoot,
            pullIn: false,
            portalPosition: new BABYLON.Vector3(-40, -2, -50),
            teleportPosition: new BABYLON.Vector3(0, -3, 0),
            iblUrl: "./assets/textures/environment7.env",
            portalRadius: 6,
            name: "fdaWarehouse",
            title: "FDA Training Platform",
            texturePath: "./assets/textures/fdaWarehouse.png",
            //onEnter: () => activateEnvironment('fda')
            onEnter: () => {
                attachShipControls(false, guidedMode);
                // window.open(
                //   "https://arturbalthazar.github.io/fda-babylon-demo/Pages/import-oversight/import-oversight.html",
                //   "_blank",
                //   "noopener,noreferrer"
                // );
                alert("Unfortunately, I cannot allow direct access to the link at this moment, but I'd be happy to talk about it more in depth upon request!");
                attachShipControls(true, guidedMode);
              }
        });
    } 
    fdaPortal.setEnabled(isVisible);

}

function createPortal({
    scene,
    engine,
    camera,
    target,
    pullIn = false,
    portalPosition,
    teleportPosition,
    iblUrl,
    portalRadius = 15,
    name = "portal",
    title = "",
    texturePath = "./assets/textures/static_portal.jpg",
    onEnter = () => {}
}) {
    let guidedScroll = 0;

    const portalMesh = BABYLON.MeshBuilder.CreateDisc(name, {
        radius: portalRadius,
        tessellation: 16
    }, scene);
    portalMesh.position = portalPosition.clone();
    portalMesh.rotation.x = Math.PI;
    portalMesh.rotation.y = Math.PI / 2;
    portalMesh.name = name;
    portalMesh.alwaysSelectAsActiveMesh = true;

    // Shaders
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

            gl_FragColor = vec4(color.rgb, alpha * globalAlpha); // Apply globalAlpha
        }
    `;


    const shaderMat = new BABYLON.ShaderMaterial("portalShader", scene, {
        vertex: "portal",
        fragment: "portal"
    }, {
        attributes: ["position", "uv"],
        uniforms: ["worldViewProjection", "time", "cameraRotation", "globalAlpha", "textureSampler"]
    });
    

    shaderMat.backFaceCulling = false;
    shaderMat.alphaMode = BABYLON.Engine.ALPHA_COMBINE;
    shaderMat.needAlphaBlending = () => true;
    shaderMat.setTexture("textureSampler", new BABYLON.Texture(texturePath, scene));
    
    const portalTex = new BABYLON.Texture(texturePath, scene);
    portalTex.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE; // ← important!
    portalTex.uScale = 1; // normal (default)
    shaderMat.setTexture("textureSampler", portalTex);

    portalMesh.material = shaderMat;

    const label = document.createElement("div");
    label.innerText = title; // or custom text if you want
    label.style.position = "absolute";
    label.style.color = "white";
    label.style.fontFamily = "ballinger-condensed, sans-serif";
    label.style.fontStyle = "normal";
    label.style.fontWeight = "500";
    label.style.fontSize = "40px";  
    label.style.whiteSpace = "nowrap";
    label.style.padding = "8px 16px";
    label.style.borderRadius = "10px";
    label.style.border = "1px solid white";
    label.style.boxShadow = "inset 0 0 15px 5px rgba(255, 255, 255, 0.3)";
    label.style.transform = "translate(-50%, -200%";
    label.style.zIndex = "1";
    label.style.pointerEvents = "none";
    label.style.opacity = "0";
    label.style.transition = "opacity 1s ease";
    
    document.getElementById("canvas-container").appendChild(label);


    // Particle swirl
    const swirl = new BABYLON.ParticleSystem("swirl", 30, scene);
    swirl.particleTexture = new BABYLON.Texture("./assets/textures/twirl_02.png", scene);
    swirl.emitter = portalMesh;
    swirl.minEmitBox = swirl.maxEmitBox = new BABYLON.Vector3(0, 0, 0);
    swirl.direction1 = swirl.direction2 = new BABYLON.Vector3(0, 0, 0);
    swirl.minEmitPower = swirl.maxEmitPower = 0;
    swirl.minSize = portalRadius*2*0.3;
    swirl.maxSize = portalRadius*2*1.2;
    swirl.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
    swirl.minAngularSpeed = 1;
    swirl.maxAngularSpeed = 3;
    swirl.enableColorGradients = true;
    swirl.addColorGradient(0.0, new BABYLON.Color4(0.2, 0.2, .7, 0));
    swirl.addColorGradient(0.2, new BABYLON.Color4(.6/1.5, .62/1.5, .9/1.2, .4));
    swirl.addColorGradient(0.8, new BABYLON.Color4(.78/1.5, .63/1.5, .82/1.2, .4));  
    swirl.addColorGradient(1.0, new BABYLON.Color4(.5, 0.2, 0.9, 0));
    swirl.minLifeTime = 4;
    swirl.maxLifeTime = 8;
    swirl.emitRate = 10;
    swirl.gravity = BABYLON.Vector3.Zero();
    swirl.updateSpeed = 0.01;
    swirl.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_ALL;
    swirl.disposeOnStop = false;
    swirl.start();

    // Runtime logic
    let lastShipSide = null;
    let hasTeleported = false;

    function screenRipple() {
        // Animate ripple
        let t = 0;
        const duration = .7;
        scene.onBeforeRenderObservable.add(function warpPulse() {
            t += engine.getDeltaTime() / 1000;
            const progress = t / duration;
        
            const intensity = Math.max(0, 1 - progress)*.75;
            warpEffect._intensity = intensity;
        
            if (intensity > 0 && !warpEffectAttached) {
                camera.attachPostProcess(warpEffect);
                warpEffectAttached = true;
            } else if (intensity === 0 && warpEffectAttached) {
                camera.detachPostProcess(warpEffect);
                warpEffectAttached = false;
            }
        
            if (progress >= 1) {
                warpEffect._intensity = 0;
                scene.onBeforeRenderObservable.removeCallback(warpPulse);
            }
        });
    }

    scene.registerBeforeRender(() => {
        // Shader scroll and time
        
        shaderMat.setFloat("time", performance.now() * 0.001);

        shaderMat.setFloat("cameraRotation", camera.alpha * 0.2); // tweak scroll sensitivity

        // Face the player
        const toCam = camera.position.subtract(portalMesh.position).normalize();
        const lookQuat = BABYLON.Quaternion.FromLookDirectionLH(toCam, BABYLON.Axis.Y);
        const flipZ = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Z, Math.PI);
        const flipY = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, Math.PI);
        const targetRot = lookQuat.multiply(flipZ).multiply(flipY);
        if (!portalMesh.rotationQuaternion)
            portalMesh.rotationQuaternion = BABYLON.Quaternion.Identity();
        BABYLON.Quaternion.SlerpToRef(portalMesh.rotationQuaternion, targetRot, 0.01, portalMesh.rotationQuaternion);

        // Teleport trigger
        const forward = portalMesh.forward || portalMesh.getDirection(BABYLON.Axis.Z);
        shaderMat.setFloat("time", performance.now() * 0.001);
        shaderMat.setFloat("cameraRotation", camera.alpha * 0.2);
    
        if (guidedMode) {
            guidedScroll -= 0.0002; // scroll speed; tweak this
            if (guidedScroll > 1) guidedScroll -= 1; // keep it in 0–1 range
            shaderMat.setVector2("uvOffset", new BABYLON.Vector2(guidedScroll, 0));
        } else {
            const forward = portalMesh.forward || portalMesh.getDirection(BABYLON.Axis.Z);
            const angle = Math.atan2(forward.x, forward.z);
            const scrollOffset = angle / (2 * Math.PI); // Normalize 0–1
            shaderMat.setVector2("uvOffset", new BABYLON.Vector2(-scrollOffset, 0));
        }
        

        const portalPlane = BABYLON.Plane.FromPositionAndNormal(portalMesh.position, forward);
        const shipPos = target.getAbsolutePosition();
        const currentSide = Math.sign(portalPlane.signedDistanceTo(shipPos));
        const dist = BABYLON.Vector3.Distance(shipPos, portalMesh.position);
        const withinRadius = dist < portalRadius;
        
        if (pullIn) {
            const pullRadius = portalRadius * 2;
            const baseSpeed  = 0.08;
            const exponent   = 2;
            
            if (dist < pullRadius && !hasTeleported) {
            
                const portalPos = portalMesh.getAbsolutePosition();
                const pullDir = portalPos.subtract(shipPos).normalize();
                const t = BABYLON.Scalar.Clamp(dist / pullRadius, 0, 1);
                const pullStrength = Math.pow(1 - t, exponent);
            
                target.translate(
                    pullDir,
                    pullStrength * baseSpeed,
                    BABYLON.Space.WORLD
                );
            }
        }

        if (lastShipSide !== null && currentSide !== lastShipSide && withinRadius && !hasTeleported) {
            target.position = teleportPosition.clone();
            onEnter();
            teleportSound.currentTime = 0.2;
            teleportSound.play();

            scene.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(iblUrl, scene);
            
            hasTeleported = true;
        
            screenRipple();
        }


        if (!withinRadius) hasTeleported = false;
        lastShipSide = currentSide;
    });

    // Update label every frame
    scene.onBeforeRenderObservable.add(() => {
        if (currentScene === "main") {
            const worldAbovePortal = portalMesh.position.add(new BABYLON.Vector3(0, portalRadius * 0.8, 0));

            const screenPos = BABYLON.Vector3.Project(
                worldAbovePortal,
                BABYLON.Matrix.Identity(),
                scene.getTransformMatrix(),
                camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight())
            );

            const fadeRange   = portalRadius * (!guidedMode ? 7 : 5);
            const distToShip  = BABYLON.Vector3.Distance(!guidedMode ? target.getAbsolutePosition() : pathFollower.getAbsolutePosition(), portalMesh.position);
            label.style.opacity = distToShip < fadeRange ? "1" : "0";

            label.style.left = screenPos.x + "px";
            label.style.top = screenPos.y + "px";
            label.style.display = (screenPos.z < 0 || screenPos.z > 1) ? "none" : "block";
        } else {
            label.style.opacity = "0";
        }
    });

    portalMesh.isPickable = true; // Make it clickable

    portalMesh.actionManager = new BABYLON.ActionManager(scene);
    portalMesh.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
            if (hasTeleported) return; // prevent duplicate trigger
    
            // Same logic as your cross-trigger
            target.position = teleportPosition.clone();
            onEnter();
            teleportSound.currentTime = 0.2;
            teleportSound.play();

            scene.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(iblUrl, scene);
    
            hasTeleported = true;
    
            screenRipple();
        })
    );
    
    return portalMesh;
}

function createGuidedCurve() {
    if (guidedPoints.length < 2) return;

    const pathPoints = guidedPoints
        .sort((a, b) => a.id - b.id) // sort by id ascending
        .map(p => getGuidedPointPos(p));

    guidedCurve = BABYLON.Curve3.CreateCatmullRomSpline(
        pathPoints,
        200,
        false // open curve!
    );

    pathFollower = new BABYLON.TransformNode("pathFollower", scene);
    pathFollower.guidedControl = { progress: 0 };
    pathFollower.rotationQuaternion = BABYLON.Quaternion.Identity();
    pathFollower.position.copyFrom(pathPoints[0]);

    // Debug line
/*     const debugCurve = BABYLON.MeshBuilder.CreateLines("debugCurve", {
        points: guidedCurve.getPoints(),
        updatable: false
    }, scene);
    debugCurve.color = new BABYLON.Color3(1, 1, 0); */

    // Precompute exact progress for each point
    const curvePoints = guidedCurve.getPoints();
    const totalPts = curvePoints.length;

    guidedPoints.forEach(p => {
        let bestIdx = 0;
        let bestDist = Number.POSITIVE_INFINITY;
        for (let i = 0; i < totalPts; i++) {
            const d = BABYLON.Vector3.DistanceSquared(getGuidedPointPos(p), curvePoints[i]);
            if (d < bestDist) {
                bestDist = d;
                bestIdx = i;
            }
        }
        p.progress = bestIdx / (totalPts - 1);
    });
}

function moveToGuidedState(state) {

    const duration = 2.4;
    const p = guidedPoints.find(p => p.id === state);
    if (!p) {
        console.warn("[moveToGuidedState] No guided point found for state:", state);
        return;
    }
    
    function tweenGuidedProgress(from, to, secs, onDone = null) {
        const proxy = { v: from };
    
        tweenFloat(proxy, "v", from, to, secs, () => {
            guidedProgress = to;
            if (onDone) onDone();
        });
    
        // Sync during animation
        const sync = scene.onBeforeRenderObservable.add(() => {
            guidedProgress = proxy.v;
            if (Math.abs(proxy.v - to) < 1e-4) {
                scene.onBeforeRenderObservable.removeCallback(sync);
            }
        });
    }
    
    function tweenFloat(obj, prop, from, to, secs, onDone = null) {
        const anim = new BABYLON.Animation(
            "tween_"+prop, prop, 60,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        anim.setKeys([
            { frame: 0, value: from },
            { frame: 60, value: to }
        ]);
    
        const e = new BABYLON.QuadraticEase();
        e.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);

        anim.setEasingFunction(e);
    
        const speed = 1 / secs;
        scene.beginDirectAnimation(obj, [anim], 0, 60, false, speed, onDone);
    }

    isAnimating = true;

    tweenGuidedProgress(
        guidedProgress,
        p.progress,
        duration,
        () => { isAnimating = false; }
    );

    if (p.alpha !== undefined && p.beta !== undefined) {
        const dA = signedDelta(camera.alpha, p.alpha, p.dirAlpha);
        const dB = signedDelta(camera.beta, p.beta, p.dirBeta);

        tweenFloat(camera, "alpha", camera.alpha, camera.alpha + dA, duration);
        tweenFloat(camera, "beta",  camera.beta,  camera.beta  + dB, duration);
    }

    attachShipControls(true, guidedMode);
}

function updateGuidedMovement() {
    if (!guidedCurve || !pathFollower) return;

    /* wrap progress so it always sits in [0, 1) */
    const s = ((guidedProgress % 1) + 1) % 1;  

    /* compute interpolated point on the curve */
    const pts = guidedCurve.getPoints();
    const cnt = pts.length;
    const f   = s * cnt;
    const i1  = Math.floor(f) % cnt;
    const i2  = (i1 + 1) % cnt;
    const t   = f - i1;

    const pos = BABYLON.Vector3.Lerp(pts[i1], pts[i2], t);
    pathFollower.position.copyFrom(pos);

    /* look ahead */
    const look = pts[(i1 + 5) % cnt].subtract(pos).normalize();
    pathFollower.setDirection(look);
}

function signedDelta(from, to, dir /* 1, -1, or 0 / undefined */) {
    const TWO = Math.PI * 2;
    let d = (to - from) % TWO;

    if (!dir) {
        if (d >  Math.PI) d -= TWO;
        if (d < -Math.PI) d += TWO;
    } else if (dir > 0) {
        if (d < 0) d += TWO;
    } else {
        if (d > 0) d -= TWO;
    }
    return d;
}

function attachShipControls(enable, guidedMode) {

    /* ───────── singleton state ───────── */
    const S = attachShipControls;
    if (!S.once) {
        S.keys   = Object.create(null);
        S.once   = true;
        S.speed  = 10;   // cruise
        S.speedK = 3;    // Shift multiplier
        S.v      = S.speed; // smoothed speed
    }

    /* ───────── helpers ───────── */
    const grab = () => ({
        fwd : scene.getAnimationGroupByName("forward"),
        brk : scene.getAnimationGroupByName("stop"),
        L   : scene.getAnimationGroupByName("turnLeft"),
        R   : scene.getAnimationGroupByName("turnRight"),
        I   : scene.getAnimationGroupByName("idle")   // new default clip
    });

    /* ───────── turn OFF ───────── */
    if (!enable) {
        if (S.observer) scene.onBeforeRenderObservable.remove(S.observer);
        S.observer = null;

        canvas.removeEventListener("keydown",     S._d);
        canvas.removeEventListener("keyup",       S._u);

        Object.values(grab()).forEach(g => g?.stop?.());

        shipRoot.rotationQuaternion = BABYLON.Quaternion.Identity();
        S.pitch     = 0;
        S.yawTarget = 0;

        S.keys = Object.create(null);

        shipRoot.setEnabled(true);

        if (cameraPivot.parent !== shipRoot) {
            if (camInputDisabled) {
                camera.inputs.add(new BABYLON.ArcRotateCameraPointersInput());
                camera.attachControl(canvas, true);
                camInputDisabled = false;
            }
            cameraPivot.setParent(shipRoot);                    // back to the craft
            cameraPivot.position.copyFrom(pivotFreeLocalPos);   // original cockpit offset
            cameraPivot.rotationQuaternion = pivotFreeLocalRot.clone();
        }
        return;
    }

    // if guided mode, skip manual inputs
    if (guidedMode) {
        if (S.observer) scene.onBeforeRenderObservable.remove(S.observer);

        if (!camInputDisabled) {
            camera.detachControl(canvas);
            camera.inputs.clear();          // <─ removes all camera inputs
            camInputDisabled = true;
        }

        if (cameraPivot.parent === shipRoot) {
            pivotFreeLocalPos = cameraPivot.position.clone();
            pivotFreeLocalRot = (cameraPivot.rotationQuaternion || BABYLON.Quaternion.Identity()).clone();
        }
    
        /* move the camera onto the rail */
        cameraPivot.setParent(pathFollower);
        cameraPivot.position.set(0, 0, 0);
        cameraPivot.rotationQuaternion = BABYLON.Quaternion.Identity();
    
        shipRoot.setEnabled(false);
        S.observer = scene.onBeforeRenderObservable.add(updateGuidedMovement);
        return;
    }

    if (cameraPivot.parent === pathFollower) {
        if (camInputDisabled) {
            camera.inputs.add(new BABYLON.ArcRotateCameraPointersInput());
            camera.attachControl(canvas, true);
            camInputDisabled = false;
        }
        cameraPivot.setParent(shipRoot);                    // back to the craft
        cameraPivot.position.copyFrom(pivotFreeLocalPos);   // original cockpit offset
        cameraPivot.rotationQuaternion = pivotFreeLocalRot.clone();
    
        shipRoot.setEnabled(true);
    }

    /* ───────── turn ON ───────── */
    const A = grab();
    if (!(A.fwd && A.brk && A.L && A.R && A.I)) {
        console.error("Missing one or more animation groups");
        return;
    }

    Object.values(A).forEach(g => {
        g.enableBlending = true;
        g.blendingSpeed  = .06;
        g.loopAnimation  = true;
        g.stop(); g.reset();
    });
    A.I.play(true);                        // idle is now the starting clip

    /* --- session state --- */
    let pitch = 0,      yawTarget = 0;
    let dragging = false, startY = 0;

    let pitchVel = 0;  
    const PITCH_RATE = Math.PI / 1.5;         //   max rad/s
    const SMOOTH    = 5; 


    /* --- keyboard listeners --- */
    S._d = e => S.keys[e.key.toLowerCase()] = true;
    S._u = e => S.keys[e.key.toLowerCase()] = false;
    canvas.addEventListener("keydown", S._d);
    canvas.addEventListener("keyup",   S._u);
    canvas.tabIndex = 1; canvas.focus();

    /* --- helper: exponential weight blend --- */
    function play(target, step) {
        Object.values(A).forEach(g => {
            let w = g.weight || 0;

            if (g === target) {
                if (!g.isPlaying) g.play(true);
                w += step * (1 - w);        // ease‑in to 1
            } else {
                w -= step * w;              // ease‑out to 0
                if (w < 0.01 && g.isPlaying) g.stop();
            }
            g.weight = BABYLON.Scalar.Clamp(w, 0, 1);
        });
    }

    /* ── per‑frame update ── */
    S.observer = scene.onBeforeRenderObservable.add(() => {
        const dt = engine.getDeltaTime() * 0.001;
        const K  = S.keys;

        /* yaw from A / D */
        const turnIn  = (K["d"] || K["arrowright"] ? 1 : 0) -
                        (K["a"] || K["arrowleft"] ? 1 : 0);

        /* pitch from Q / E … with easing */
        const pitchIn = (K["e"] ? 1 : 0) - (K["q"] ? 1 : 0);
        const targetPitchVel = pitchIn * PITCH_RATE;
        pitchVel += (targetPitchVel - pitchVel) * Math.min(1, dt * SMOOTH); // ➋ smooth Δ
        pitch -= pitchVel * dt;                                             // ➌ apply

        yawTarget -= turnIn * PITCH_RATE * dt;

        /* ship orientation */
        const qYaw   = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, yawTarget);
        const qPitch = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.X, pitch);
        const qFinal = qYaw.multiply(qPitch);
        shipRoot.rotationQuaternion = BABYLON.Quaternion.Slerp(
            shipRoot.rotationQuaternion || BABYLON.Quaternion.Identity(),
            qFinal, 0.12
        );

        /* choose & blend animation */
        const BLEND_PER_SEC = 4;
        const wStep = BLEND_PER_SEC * dt;

        const forwardKey = K["w"] || K["arrowup"];
        const brakeKey   = K["s"] || K["arrowdown"];

        if      (turnIn < 0) play(A.L,   wStep);
        else if (turnIn > 0) play(A.R,   wStep);
        else if (brakeKey)   play(A.brk, wStep);
        else if (forwardKey) play(A.fwd, wStep);
        else                 play(A.I,   wStep);  // idle when nothing else

        /* smooth Shift throttle */
        const wantSpeed = K["shift"] ? S.speed * S.speedK : S.speed;
        S.v += (wantSpeed - S.v) * Math.min(1, dt * 5);     // τ ≈ 0.2 s

        /* movement */
        const throttle = forwardKey && !brakeKey ? 1 :
                         forwardKey &&  brakeKey ? 0.5 : 0;

        if (throttle) {
            const verticalTarget = (K["e"] ? 1 : 0) - (K["q"] ? 1 : 0);
            S.verticalVel += (verticalTarget - S.verticalVel) * Math.min(1, dt * SMOOTH); // smooth up/down
            if (Math.abs(S.verticalVel) > 0.001) {
                const up = BABYLON.Axis.Y.scale(S.v * dt * S.verticalVel);
                shipRoot.position.addInPlace(up);
            }
            const dir = BABYLON.Vector3.TransformNormal(
                new BABYLON.Vector3(0, 0, 1),
                shipRoot.getWorldMatrix()
            ).normalize();
            dir.x *= -1;                                    // fix LR inversion
            shipRoot.position.addInPlace(dir.scale(S.v * dt * throttle));
        }
    });
}


function createEngineFlame(scene) {
    const emitter = scene.getTransformNodeByName("engineFlame");
    emitter.rotation.y = BABYLON.Tools.ToRadians(90);
    emitter.rotation.x = BABYLON.Tools.ToRadians(152);
    emitter.rotation.z = BABYLON.Tools.ToRadians(25);
    if (!emitter) throw new Error("engineFlame node not found");
  
    const flame = new BABYLON.ParticleSystem("engineFlamePS", 600, scene);
    flame.particleTexture        = new BABYLON.Texture("./assets/textures/muzzle_06.png", scene);
    flame.emitter                = emitter;
    flame.updateSpeed            = 0.01;                // smoother updates
    flame.minEmitPower           = 0.02;
    flame.maxEmitPower           = 0.05;
    flame.emitRate               = 1000;                 // higher, constant rate
  
    // point‐spawn exactly at nozzle
    flame.particleEmitterType    = new BABYLON.PointParticleEmitter();
  
    // size randomness
    flame.minSize                = 0.2;
    flame.maxSize                = 0.5;
  
    // rotation randomness
    flame.minInitialRotation     = Math.PI * 1.9;
    flame.maxInitialRotation     = Math.PI * 2.1;
  
    // give each particle a tight lifetime window
    flame.minLifeTime            = 0.03;
    flame.maxLifeTime            = 0.1;
  
    // color & blend
    flame.gravity                = new BABYLON.Vector3(0, 0, 0);
    flame.blendMode              = BABYLON.ParticleSystem.BLENDMODE_ADD;
    flame.color1                 = new BABYLON.Color4(1, 0.6, 0.3, .5);
    flame.color2                 = new BABYLON.Color4(1, 0.2, 0.6, 0.2);
    flame.colorDead              = new BABYLON.Color4(0, 0, .5, .2);
  
    flame.start();
  
    // remove any flicker loop so it stays constant
    // (if you ever want throttle control, just override .emitRate / .minEmitPower / .maxEmitPower)
  
    return flame;
}

function createSmoke() {
    // 1) Invisible emitter box
    const fountain = BABYLON.Mesh.CreateBox("fountain", 0.01, scene);
    fountain.visibility = 0;
    fountain.parent = cameraPivot; // Attach to ship
    fountain.position.set(0, 0, 25);

    // 3) Particle system
    const fogTexture = new BABYLON.Texture(
        "./assets/textures/smoke_15.png",
        scene
    );

    const smoke = new BABYLON.ParticleSystem("cloudParticles", 120, scene);
    smoke.particleTexture = fogTexture;

    smoke.emitter = fountain;
    smoke.updateSpeed            = 0.01; 
    smoke.minEmitBox = new BABYLON.Vector3(-100, -15, 100);
    smoke.maxEmitBox = new BABYLON.Vector3(100, 5, -100);

    smoke.enableColorGradients = true;
    smoke.addColorGradient(0.0, new BABYLON.Color4(0.40, 0.40, 0.88, 0));   // 0% life → fully transparent
    smoke.addColorGradient(0.2, new BABYLON.Color4(0.35, 0.40, 0.88, 0.1)); // 10% life → mostly opaque
    smoke.addColorGradient(0.8, new BABYLON.Color4(0.4,  0.25, 0.5,  0.08)); // 90% life → still opaque
    smoke.addColorGradient(1.0, new BABYLON.Color4(0.3,  0.15, 0.4,  0));   // 100% life → fully transparent

    smoke.minSize = 15;
    smoke.maxSize = 40;
    smoke.fadeOut = true;
    smoke.fadeIn = true;

    smoke.minLifeTime = 4;
    smoke.maxLifeTime = 10;

    smoke.emitRate = 0;

    smoke.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
    smoke.gravity = new BABYLON.Vector3(0, 0, 0);
    smoke.direction1 = new BABYLON.Vector3(0, 0, 0);
    smoke.direction2 = new BABYLON.Vector3(0, 0, 0);
    smoke.minAngularSpeed = -0.5;
    smoke.maxAngularSpeed = 0.5;
    smoke.minEmitPower = 0.5;
    smoke.maxEmitPower = 1.5;
    smoke.updateSpeed = 0.01;

    smoke.start();

    return smoke;
}

function createStars() {
    // 1) Invisible emitter box
    const fountain = BABYLON.Mesh.CreateBox("fountain", 0.01, scene);
    fountain.visibility = 0;
    fountain.position.set(0, 0, 0);


    // 3) Particle system
    const stars = new BABYLON.ParticleSystem("starsParticles", 3000, scene);
    stars.particleTexture = new BABYLON.Texture("./assets/textures/star_07.png", scene);

    // normal box emitter range (we'll override its logic below)
    //stars.minEmitBox = new BABYLON.Vector3(-1000, -1000, 1000);
    //stars.maxEmitBox = new BABYLON.Vector3( 1000,  1000, -1000);

    // ——— no‑spawn‑zone setup ———
    const forbiddenRadius = 3000;                     // <-- adjust this
    const forbiddenRadiusSq = forbiddenRadius * forbiddenRadius;
    const shipPos = shipRoot.position;               // assumes shipRoot is in scope

    // replace the default spawn with our own rejection‑sampling
    stars.startPositionFunction = (worldMatrix, position, particle) => {
        let x, y, z;
        do {
            x = BABYLON.Scalar.RandomRange(-3500+shipRoot.position.x, 3500+shipRoot.position.x);
            y = BABYLON.Scalar.RandomRange(-3500+shipRoot.position.y, 3500+shipRoot.position.y);
            z = BABYLON.Scalar.RandomRange(-3500+shipRoot.position.z, 3500+shipRoot.position.z);
        } while (
            (x - shipPos.x) * (x - shipPos.x) +
            (y - shipPos.y) * (y - shipPos.y) +
            (z - shipPos.z) * (z - shipPos.z)
            < forbiddenRadiusSq
        );

        position.x = fountain.position.x + x;
        position.y = fountain.position.y + y;
        position.z = fountain.position.z + z;
    };

    // color gradients
    stars.enableColorGradients = true;
    stars.addColorGradient(0.0, new BABYLON.Color4(0.8, 0.8, 1,   0));   // birth: transparent
    stars.addColorGradient(0.05, new BABYLON.Color4(.8,   .8,   1,   1));   // pop in
    stars.addColorGradient(0.4, new BABYLON.Color4(.9,   0.9, 0.7, 0.8));
    stars.addColorGradient(0.7, new BABYLON.Color4(1,   0.9, 0.7, 0.8));  // fade
    stars.addColorGradient(1.0, new BABYLON.Color4(1,   0.7, 0.7, 0));    // death: transparent

    // size / lifetime / rate
    stars.minSize      = 20;
    stars.maxSize      = 50;

    stars.minLifeTime  = 10;
    stars.maxLifeTime  = 30;
    stars.emitRate     = 100000;

    // physics
    stars.blendMode       = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
    stars.gravity         = new BABYLON.Vector3(0, 0, 0);
    stars.direction1      = new BABYLON.Vector3(0, 0, 0);
    stars.direction2      = new BABYLON.Vector3(0, 0, 0);
    stars.minAngularSpeed = -0.5;
    stars.maxAngularSpeed =  0.5;
    stars.minEmitPower    = 0.5;
    stars.maxEmitPower    = 1.5;
    stars.updateSpeed     = 0.01;

    stars.start();
    return stars;
}

function animateScene(show, durationInSeconds) {

    function animateRockRing(show, durationInSeconds) {
        const fps = 60;
        const totalFrames = fps * durationInSeconds;

        if (show) {
            rockRing.setEnabled(true);
            rockRingAnimationGroups[0].play(false, 1, 1, 48);
        } else {
            rockRingAnimationGroups[0].play(false, 1, 48, 1);
        }

        // Gather materials from rockRing and its children
        const materials = [];
        rockRing.getChildMeshes().forEach(mesh => {
            if (mesh.material) {
                materials.push(mesh.material);
            }
        });
        // If rockRing itself has a material (and it wasn’t included above), add it.
        if (rockRing.material) {
            materials.push(rockRing.material);
        }

        // Animate each material's alpha value
        materials.forEach(material => {
            material.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;

            const fromAlpha = show ? 0.01 : 1;
            const toAlpha   = show ? 1 : 0;
            material.alpha = fromAlpha;

            const alphaAnimation = new BABYLON.Animation(
                "fadeAlpha",
                "alpha",
                fps,
                BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
            );

            alphaAnimation.setKeys([
                { frame: 0, value: fromAlpha },
                { frame: totalFrames, value: toAlpha }
            ]);

            const easingAlpha = new BABYLON.CubicEase();
            easingAlpha.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
            alphaAnimation.setEasingFunction(easingAlpha);

            material.animations = [alphaAnimation];
            scene.beginAnimation(material, 0, totalFrames, false);
        });
        // Restore material settings after the animation completes.
        setTimeout(() => {
            if (!show) {
                rockRing.setEnabled(false);
            }
        }, durationInSeconds * 1000);
    }
    sceneSmoke.emitRate=10000;
    sceneStars = createStars();
    animateRockRing(show, durationInSeconds);
}

function animatePlanet(show, durationInSeconds) {
    const fps = 60;
    const totalFrames = fps * durationInSeconds;

    const materials = [];

    if (planetMesh?.material) materials.push(planetMesh.material);
    
    materials.forEach(material => {

        material.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLENDANDTEST;
        material.needDepthPrePass = true;
        material.backFaceCulling = true;
        
        const fromAlpha = show ? 0.01 : 1;
        const toAlpha   = show ? 1 : 0;
        material.alpha = fromAlpha;

        const alphaAnimation = new BABYLON.Animation(
            "fadeAlpha",
            "alpha",
            fps,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        alphaAnimation.setKeys([
            { frame: 0, value: fromAlpha },
            { frame: totalFrames, value: toAlpha }
        ]);

        const easingAlpha = new BABYLON.CubicEase();
        easingAlpha.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
        alphaAnimation.setEasingFunction(easingAlpha);

        material.animations = [alphaAnimation];
        scene.beginAnimation(material, 0, totalFrames, false);
    });

    // Restore material settings after the animation completes.
    setTimeout(() => {
        materials.forEach(material => {
            material.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;
            material.needDepthPrePass = false;
            material.backFaceCulling = false;
        });
    }, durationInSeconds * 1000);
    
    // Animate global rotation on planetRoot.
    // Adjust these vectors as needed for your desired effect.
    const fromRotation = show ? new BABYLON.Vector3(-1, -2, 0) : new BABYLON.Vector3(0, 0, 0);
    const toRotation   = show ? new BABYLON.Vector3(0, 0, 0)  : new BABYLON.Vector3(1, 2, 0);
    
    const rotationAnimation = new BABYLON.Animation(
        "rotatePlanet",
        "rotation",
        fps,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    
    rotationAnimation.setKeys([
        { frame: 0, value: fromRotation },
        { frame: totalFrames, value: toRotation }
    ]);
    
    const easingRot = new BABYLON.CubicEase();
    if (show) {
        easingRot.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
    } else {
        easingRot.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEIN);
    }
    rotationAnimation.setEasingFunction(easingRot);
    
    if (planetRoot2) {
        planetRoot2.animations = [rotationAnimation];
        scene.beginAnimation(planetRoot2, 0, totalFrames, false);
    }
}

function updatePlanetVisibility() {
    if (planetRoot1) {
        if (currentState === STATE_HOME_2) {

            const width = window.innerWidth;
            const height = window.innerHeight;
            const baseX = 1;
            const wFactor = 1 / 240;
            const hFactor = 1 / 240;
            const x = (baseX + (wFactor*width)/2 - hFactor*height);

            planetRoot1.position = new BABYLON.Vector3(x, -1, 0);
            setTimeout(() => {
                planetRoot1.setEnabled(true);
                animatePlanet(true, 1.5);
            }, 250);
        }
        else {
            animatePlanet(false, .5);
            setTimeout(() => {
                planetRoot1.setEnabled(false);
            }, 500);
        }
    }
}

function updateLogoVisibility() {
    if (currentState === STATE_HOME) {
        logoRoot.setEnabled(true);
        logoRoot.setParent(null);
        logoRoot.position = BABYLON.Vector3.Zero();
        logoBaseRot = new BABYLON.Vector3(0, 0, 0);
    } else if (currentState === STATE_HOME_1) {
        logoRoot.setEnabled(true);
        logoRoot.setParent(null);
        logoRoot.position = BABYLON.Vector3.Zero();
        logoRoot.scaling = new BABYLON.Vector3(1, 1, 1);
        logoRoot.scaling = new BABYLON.Vector3(1, 1, -1);
        logoRoot.rotation = BABYLON.Vector3.Zero();
        logoBaseRot = new BABYLON.Vector3(0, 0, 0);
    } else if (currentState === STATE_HOME_2) {
        logoRoot.setEnabled(true);
        if (planetPinCenter) {
            logoRoot.setParent(planetPinCenter);
            logoRoot.position = BABYLON.Vector3.Zero();
            logoRoot.scaling = new BABYLON.Vector3(0.25, 0.25, 0.25);
            logoBaseRot = new BABYLON.Vector3(0, 0, 0);
        }
    } else if (currentState === STATE_HOME_3) {
        logoRoot.setEnabled(false);
        logoRoot.setParent(null);
        logoRoot.position = BABYLON.Vector3.Zero();
        logoRoot.scaling = new BABYLON.Vector3(1, 1, -1);
        logoRoot.rotation = BABYLON.Vector3.Zero();
        logoBaseRot = new BABYLON.Vector3(0, 0, 0);
    } else if (currentState === STATE_EXPLORE) {
        logoRoot.setEnabled(false);
        logoRoot.setParent(null);
        logoRoot.position = BABYLON.Vector3.Zero();
        logoRoot.scaling = new BABYLON.Vector3(1, 1, -1);
        logoRoot.rotation = BABYLON.Vector3.Zero();
        logoBaseRot = new BABYLON.Vector3(0, 0, 0);
    }
}

function initializeScrollActions() {
    // Set initial clip-path
    setClipPath(false);
    // Update camera controls based on initial state
    updateCameraControls();
    // Prevent scrolling with mouse wheel
    window.addEventListener(
        "wheel",
        function (e) {            
            // Allow scrolling if mouse is over chat
            if (chatContainer.classList.contains('chat-open') && 
                e.target.closest('#chatMessages')) {
                e.stopPropagation();
                return;
            }
    
            // Allow scrolling if mouse is over the portal info panel
            if (portalOverlay.classList.contains('visible') &&
                e.target.closest('#portal-info-overlay')) {
                e.stopPropagation();
                return;
            }

            if (currentScene !== "main") {
                e.stopPropagation();
                return;
            }
    
            // Otherwise prevent scrolling and handle page states
            e.preventDefault();
            if (!isAnimating) {
                if (e.deltaY > 0) {
                    scrollForward();
                } else if (e.deltaY < 0) {
                    scrollBackward();
                }
            }
        },
        { passive: false }
    );
    

    // Prevent scrolling with touch
    let touchStartY = 0;
    window.addEventListener(
        "touchstart",
        function (e) {
            touchStartY = e.touches[0].clientY;
        },
        { passive: false }
    );

    // Modify your touchmove event listener
    window.addEventListener(
        "touchmove",
        function (e) {
            if (chatContainer.classList.contains('chat-open') && 
                e.target.closest('#chatMessages')) {
                e.stopPropagation();
                return;
            }
            if (portalOverlay.classList.contains('visible') &&
                e.target.closest('#portal-info-overlay')) {
                e.stopPropagation();
                return;
            }
            if (currentScene !== "main") {
                e.stopPropagation();
                return;
            }
            e.preventDefault();
            if (!isAnimating) {
                let touchEndY = e.touches[0].clientY;
                if (touchStartY > touchEndY) {
                    scrollForward();
                } else if (touchStartY < touchEndY) {
                    scrollBackward();
                }
                touchStartY = touchEndY;
            }
        },
        { passive: false }
    );

    
    function scrollForward() {
        if (isAnimating) return;
    
        previousState = currentState;
        // normal forward increment if we’re not at the end
        if (currentState < maxState) currentState++;
        else return;                           // already at the end in free-mode
    
        updateState();

/*         if (currentState === STATE_EXPLORE && guidedMode) {
            setTimeout(() => {
                if (isAnimating) return;
    
                previousState = currentState;
                // normal forward increment if we’re not at the end
                if (currentState < maxState) currentState++;
                else return;                           // already at the end in free-mode
            
                updateState();
            }, 500);
        } */
    }

    function scrollBackward() {
        if (isAnimating) return;
    
        previousState = currentState;
    
        if (currentState > STATE_HOME) currentState--;
        else return; // Already at start
    
        updateState();
    
/*         if (currentState === STATE_EXPLORE && guidedMode) {
            setTimeout(() => {
                if (isAnimating) return;
    
                previousState = currentState;
                
                if (currentState > STATE_HOME) currentState--;
                else return;
    
                updateState();
            }, 1500);
        } */
    }

    function updateState() {
        console.log("[updateState] currentState =", currentState);
        console.log("[updateState] guidedMode =", guidedMode);
    
        // Adjust maxState based on mode
        maxState = guidedMode ? maxGuidedState : maxFreeState;
    
        if (isAnimating) return;
        isAnimating = true;
    
        const fromState = previousState;
        const toState = currentState;
    
        /* special transitions between Services_3 <-> Explore */
        if (fromState === STATE_HOME_3 && toState === STATE_EXPLORE) {
            transitionToExploreState();
        } else if (fromState === STATE_EXPLORE && toState === STATE_HOME_3) {
            transitionFromExploreState();
        } else {
            switch (toState) {
                case STATE_HOME:
                    transitionToHomeState();
                    break;
                case STATE_HOME_1:
                    transitionToFirstOverlay();
                    break;
                case STATE_HOME_2:
                    transitionToSecondOverlay();
                    break;
                case STATE_HOME_3:
                    transitionToThirdOverlay();
                    break;
                case STATE_EXPLORE:
                    if (!guidedMode) {
                        setTimeout(() => { isAnimating = false; }, 500);

                    } else {
                        moveToGuidedState(toState);
                    }
                    break;
                case STATE_EXPLORE_1:
                case STATE_EXPLORE_2:
                case STATE_EXPLORE_3:
                case STATE_EXPLORE_4:
                case STATE_EXPLORE_5:
                    const isDesktop = window.innerWidth >= screenWidth;
                    moveToGuidedState(toState);
                    setTimeout(() => {
                        if (currentState === maxGuidedState) {
                            setClipPath(true, 500);
                            // Change icons back to default color over time
                            canvasContainer.style.transition = 'all 1.5s ease'
                            header.style.transition = 'all 1.5s ease';
                            header.classList.remove('white-icons');
                            header.style.height = `60px`;
                            header.style.backgroundColor= '#F4F2ED';
                            if (isDesktop) {
                                if (chatContainer.classList.contains('chat-open')) {
                                    header.style.width = 'calc(100% - 40px)';
                                } else {
                                header.style.width= '75%';
                                }
                            }
                        } else {
                            removeClipPath(500);
                            // Change icons to light color over time
                            canvasContainer.style.transition = 'all 0.5s ease'
                            header.style.transition = 'all 0.5s ease';
                            header.classList.add('white-icons');
                            header.style.height = `60px`;
                            header.style.backgroundColor='transparent';
                            if (isDesktop) {
                                header.style.width= '100%';
                            }
                        }
                    }, 1000);
                    break;
                default:
                    console.warn("[updateState] Unknown state:", toState);
                    isAnimating = false;
                    break;
            }
            if (currentState === STATE_HOME_2) {
                highlightLayer.isEnabled = true;
            } else {
                highlightLayer.isEnabled = false;
            }
        }
    
        // Always update overlays and planets visibility
        updateOverlayVisibility();
        updatePlanetVisibility();
        updateLogoVisibility();
    }

    function transitionToExploreState() {
        const isDesktop = window.innerWidth >= screenWidth;
        // Remove clip-path with longer transition
        removeClipPath(500);

        // Hide overlay text
        hideOverlayText();

        // Change icons to light color over time
        header.classList.add('white-icons');
        header.style.height = `60px`;
        header.style.backgroundColor='transparent';
        if (isDesktop) {
            header.style.width= '100%';
        }

        attachShipControls(true, guidedMode);
        animateCameraPosition(true);
        updatePortals(true);

        // Delay to match the longer clip-path transition duration
        setTimeout(function() {
            isAnimating = false;
            
        }, 500);
    }

    function transitionFromExploreState() {
        const isDesktop = window.innerWidth >= screenWidth;
        // Restore clip-path with longer transition
        setClipPath(true, 500);

        // Change icons back to default color over time
        header.classList.remove('white-icons');
        header.style.height = `60px`;
        header.style.backgroundColor= '#F4F2ED';
        if (isDesktop) {
            if (chatContainer.classList.contains('chat-open')) {
                header.style.width = 'calc(100% - 40px)';
            } else {
            header.style.width= '75%';
            }
        }
        updatePortals(false);
        attachShipControls(false, guidedMode);


        // Delay to match the longer clip-path transition duration
        setTimeout(function() {
            // Show overlay text for State 4 after clip-path transition
            showOverlayText(textSegments[2]);
            setTimeout(function() {
                isAnimating = false;
            }, 500);
        }, 200);

        animateCameraPosition(false);
    }

    function transitionToHomeState() {
        // Adjust icon sizes based on screen width
        const isDesktop = window.innerWidth >= screenWidth;
        if (isDesktop) {
            logoIcon.style.height = "35px";
            menuIcon.style.height = "35px";
            logoIcon.style.top = "25px";
            menuIcon.style.top = "25px";
    
        } else {
            logoIcon.style.height = "25px";
            menuIcon.style.height = "25px";
        }

        textBox1.style.opacity = "1";

        // Use the same layout setup as initial load
        setTimeout(() => {
            setupInitialLayout();
        }, 50);

        // Hide overlay text
        hideOverlayText();

        // Change icons back to default color
        header.classList.remove('white-icons');

        // Delay to ensure animations complete
        setTimeout(function() {
            isAnimating = false;
        }, 500);
    }

    function transitionToFirstOverlay() {
        // Adjust icon sizes based on screen width
        const isDesktop = window.innerWidth >= screenWidth;
        if (isDesktop) {
            logoIcon.style.height = "25px";
            menuIcon.style.height = "25px";
            logoIcon.style.top = "17px";
            menuIcon.style.top = "17px";
            
        } else {
            logoIcon.style.height = "21px";
            menuIcon.style.height = "21px";
        }

        textBox1.style.opacity = "0";

        // Adjust header height
        header.style.height = `60px`;

        // Adjust clip path
        setClipPath(true);

        // Show overlay text
        showOverlayText(textSegments[0]);
    }

    function transitionToSecondOverlay() {
        const isDesktop = window.innerWidth >= screenWidth;
        if (isDesktop) {
            logoIcon.style.height = "25px";
            menuIcon.style.height = "25px";
            logoIcon.style.top = "17px";
            logoIcon.style.top = "17px";
            
        } else {
            logoIcon.style.height = "21px";
            menuIcon.style.height = "21px";
        }
        // Adjust clip path
        setClipPath(true);

        if (previousState === STATE_HOME_3) {
            animateCameraPosition(false);
        }
        
        // Show overlay text for the given index
        showOverlayText(textSegments[1]);
        setTimeout(() => {
          isAnimating = false;
        }, 1000);
    }

    function transitionToThirdOverlay() {
        const isDesktop = window.innerWidth >= screenWidth;
        if (isDesktop) {
            logoIcon.style.height = "25px";
            menuIcon.style.height = "25px";
            logoIcon.style.top = "17px";
            menuIcon.style.top = "17px";
            
        } else {
            logoIcon.style.height = "21px";
            menuIcon.style.height = "21px";
        }
        // Adjust clip path
        setClipPath(true);
        function isAudioPlaying(audio) {
            return !audio.paused && !audio.ended && audio.currentTime > 0;
        }
        // Show overlay text for the given index
        showOverlayText(textSegments[2]);
        
        if (!isAudioPlaying(backgroundMusic)) {
            
            animateScene(true, 3);

            backgroundMusic.loop = true;
            backgroundMusic.volume = 0;
            backgroundMusic.play();
            const targetVolume = 0.5;
            const duration = 2500; // ms
            const steps = 40;
            const interval = duration / steps;
            let currentStep = 0;
        
            const fadeIn = setInterval(() => {
                currentStep++;
                const newVolume = (targetVolume / steps) * currentStep;
                backgroundMusic.volume = Math.min(newVolume, targetVolume);
        
                if (currentStep >= steps) {
                    clearInterval(fadeIn);
                }
            }, interval);
        }
        if (guidedMode) {
            animateCameraPosition(false);
        } else {
            animateCameraPosition(true);
        }
    }

    function showOverlayText(text) {
        overlayText.style.opacity = "1";
        let typingContent = overlayText.querySelector(".typing-content");

        // Cancel any existing typing timeout
        if (typingTimeout) {
            clearTimeout(typingTimeout);
        }

        // Reset typing content
        typingContent.textContent = "";
        let index = 0;

        // Position the overlay text within the clip-path bounds
        overlayText.style.top = '70px'; // Adjust as needed

        const typingSpeed = 25; // milliseconds per character
        
        setTimeout(() => {
            isAnimating = false; 
        }, 500);

        function typeCharacter() {
            if (index < text.length) {
                typingContent.textContent += text[index];
                index++;
                typingTimeout = setTimeout(typeCharacter, typingSpeed);
            }
        }

        typeCharacter();
    }

    function hideOverlayText() {
        // Cancel any existing typing timeout
        if (typingTimeout) {
            clearTimeout(typingTimeout);
        }
        overlayText.style.opacity = "0";
        overlayText.querySelector(".typing-content").textContent = "";
    }
}

function animateCameraPosition(forward) {
    
    if (forward) {
        camera.attachControl(canvas, false);
    } else {
        camera.detachControl(canvas);
    }

    let navState = false;
    if (currentState === STATE_HOME_3) {
        navState = true;
        camera.detachControl(canvas);
    } else {
        navState = false;
    }

    scene.getAnimationGroupByName("idle").play(true);
    engineFlame.emitRate = forward ? 1000 : (navState ? 1000 : 0);

    const fps     = 60;
    const frames  = fps * 1.5;            // 1‑second sweep
    const easeOut = new BABYLON.QuadraticEase();
    easeOut.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);

    /* --------------------------------------------------------- *
     * 1) PIVOT – slide Z
     * --------------------------------------------------------- */
    const animX = new BABYLON.Animation("pivotX", "position.x", fps, BABYLON.Animation.ANIMATIONTYPE_FLOAT);
    const animY = new BABYLON.Animation("pivotY", "position.y", fps, BABYLON.Animation.ANIMATIONTYPE_FLOAT);
    const animZ = new BABYLON.Animation("pivotZ", "position.z", fps, BABYLON.Animation.ANIMATIONTYPE_FLOAT);
    
    animX.setKeys([{ frame: 0, value: shipRoot.position.x }, { frame: frames, value: forward ? shipRoot.position.x : 0 }]);
    animY.setKeys([{ frame: 0, value: shipRoot.position.y }, { frame: frames, value: forward && !navState ? 0.7 : -0.5 }]);
    animZ.setKeys([{ frame: 0, value: shipRoot.position.z }, { frame: frames, value: forward ? shipRoot.position.z : -24 }]);
    
    [animX, animY, animZ].forEach(a => a.setEasingFunction(easeOut));
    
    shipRoot.animations = [animX, animY, animZ];
    scene.beginAnimation(shipRoot, 0, frames, false);

    /* --------------------------------------------------------- *
     * 2‑4) CAMERA – alpha & radius limits
     * --------------------------------------------------------- */
    function normalizeAngle(angle) {
        return angle % (2 * Math.PI);
    }
    const currentAlpha = normalizeAngle(camera.alpha);

    const alphaAnim = new BABYLON.Animation(
        "camAlpha", "alpha", fps,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    alphaAnim.setKeys([
        { frame: 0,      value: forward ? currentAlpha :  currentAlpha },
        { frame: frames, value: forward ?  -Math.PI/2 : -Math.PI/2 }
    ]);
    alphaAnim.setEasingFunction(easeOut);

    const betaAnim = new BABYLON.Animation(
        "camBeta", "beta", fps,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    betaAnim.setKeys([
        { frame: 0,      value: forward ? camera.beta :  camera.beta },
        { frame: frames, value: forward && !navState && !guidedMode ? Math.PI/2.2 : Math.PI/2}
    ]);
    betaAnim.setEasingFunction(easeOut);

    const rFrom = forward ? camera.lowerRadiusLimit : camera.lowerRadiusLimit;
    const rTo   = forward ? (guidedMode ? 0 : 4) : 0;

    const lowerLimitAnim = new BABYLON.Animation(
        "camLower", "lowerRadiusLimit", fps,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    lowerLimitAnim.setKeys([{frame:0,value:rFrom},{frame:frames,value:rTo}]);
    lowerLimitAnim.setEasingFunction(easeOut);

    const upperLimitAnim = new BABYLON.Animation(
        "camUpper", "upperRadiusLimit", fps,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    upperLimitAnim.setKeys([{frame:0,value:rFrom},{frame:frames,value:rTo}]);
    upperLimitAnim.setEasingFunction(easeOut);

    camera.animations = [alphaAnim, betaAnim, lowerLimitAnim, upperLimitAnim];

    scene.beginAnimation(
        camera,
        0,
        frames,
        false,
        1,
        () => { camera.radius = rTo; }   // snap radius to new clamp
    );
}

// Function to update camera controls based on current state
function updateCameraControls() {
    camera.lowerRadiusLimit = camera.upperRadiusLimit = 0;
    camera.parent = null;
    camera.detachControl(canvas);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('deviceorientation', onDeviceOrientation);
}

function onMouseMove(event) {
    let fractionX = (event.clientX / window.innerWidth) - 0.5;
    let fractionY = (event.clientY / window.innerHeight) - 0.5;

    let offsetY = -fractionX * 5 * maxRotationY;
    let offsetX = -fractionY * 5 * maxRotationX;

    // Add drag rotation offset
    offsetX += dragRotOffset.x;
    offsetY += dragRotOffset.y;

    if (planetRoot1) {
        planetRoot1.rotationQuaternion = null; // Force Babylon to use .rotatio
        planetRoot1.rotation.x = planetBaseRot.x - offsetX/2;
        planetRoot1.rotation.y = planetBaseRot.y - offsetY/2;
    }
    if (logoRoot) {
        if (currentState === STATE_HOME_2) {
            logoRoot.rotation.x = logoBaseRot.x - offsetX / 4;
            logoRoot.rotation.y = logoBaseRot.y - offsetY / 4;
        } else {
            logoRoot.rotation.x = logoBaseRot.x + offsetX;
            logoRoot.rotation.y = logoBaseRot.y + offsetY;
        }
    }
}


// Device orientation handler for mobile
function onDeviceOrientation(event) {
    // Check if event data is available
    if (event.gamma !== null && event.beta !== null) {
        // implememt this too
    }
}