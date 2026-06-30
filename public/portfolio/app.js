// ---------- Portfolio data ----------
// Categories shown in the header, each with its list of projects.
// Content is placeholder for now — to be filled in per project later.
const CATEGORIES = [
  {
    id: "product-design",
    label: "Product Design",
    description:
      "Projects developed during the Product Design degree, with emphasis on blabla and blabla. Placeholder text to be replaced.",
    projects: [
      { id: "petwheels", title: "Petwheels" },
      { id: "durare", title: "Durare" },
      { id: "docol-cozy", title: "DocolCozy Compact" },
      { id: "zenik", title: "Zenik" },
    ],
  },
  {
    id: "mechanical-engineering",
    label: "Mechanical Engineering",
    description:
      "Mechanical engineering work focused on blabla, covering design, analysis and prototyping. Placeholder text to be replaced.",
    projects: [
      { id: "tuff", title: "TUFF" },
      { id: "epicyclic-magnetic-gear", title: "Epicyclic Magnetic Gear" },
    ],
  },
  {
    id: "3d-printing",
    label: "3D Printing",
    description:
      "3D-printing work from Baltha Maker, my 3D-printing studio (2018–2021) — from a viral Millennium Falcon mouse to large architectural scale models for local museums.",
    projects: [
      { id: "falcon-mouse", title: "Millennium Falcon Mouse" },
      { id: "florianopolis-museum", title: "Florianópolis Museum" },
      { id: "mesc-museum", title: "MESC Museum" },
    ],
  },
  {
    id: "interactive-design",
    label: "Interactive Design",
    description:
      "Interactive 3D experiences for the web and AR \u2014 games, virtual showrooms and product visualizers built with Babylon.js and Blender at MeetKai and More Than Real.",
    projects: [
      { id: "survive-thanksgiving", title: "Survive Thanksgiving" },
      { id: "byd-dealership", title: "BYD Virtual Dealership" },
      { id: "pistons-store", title: "Pistons Virtual Store" },
      { id: "chevrolet-montana", title: "Chevrolet Montana" },
      { id: "dolce-gusto", title: "Nescaf\u00e9 Dolce Gusto" },
    ],
  },
  {
    id: "software",
    label: "Software",
    description:
      "Tools and platforms I build \u2014 a web-based 3D editor and a Blender add-on that automates 3D asset production for the web.",
    projects: [
      { id: "meetcraft", title: "Meetcraft" },
      { id: "meetkai-suite", title: "MeetKai Suite" },
    ],
  },
];

// ---------- State ----------
let activeCategoryId = CATEGORIES[0].id;
let activeProjectId = CATEGORIES[0].projects[0].id; // start on first project
let cvActive = false; // Curriculum Vitae view takes over the main area

// ---------- Elements ----------
const headerNav = document.getElementById("header-nav");
const sidebarNav = document.getElementById("sidebar-nav");
const sidebarTitle = document.getElementById("sidebar-title");
const sidebarLabel = document.getElementById("sidebar-label");
const content = document.getElementById("content");
const skillsPanel = document.getElementById("skills-panel");

// The Petwheels customizer (in an iframe) forwards off-model touch drags here so
// the page scrolls past the 3D viewer instead of rotating it (mobile). See
// petwheels/script.js.
window.addEventListener("message", (e) => {
  if (e.data && e.data.type === "pw-scroll" && typeof e.data.dy === "number") {
    content.scrollBy(0, e.data.dy);
  }
});

// ---------- Render helpers ----------
function getCategory(id) {
  return CATEGORIES.find((c) => c.id === id);
}

function renderHeader() {
  headerNav.innerHTML = "";
  CATEGORIES.forEach((cat) => {
    const btn = document.createElement("button");
    btn.textContent = cat.label;
    btn.classList.toggle("active", cat.id === activeCategoryId);
    btn.addEventListener("click", () => selectCategory(cat.id));
    headerNav.appendChild(btn);
  });
}

// In-page section titles for projects that have a custom page. Labels must match
// the heading text exactly (used to scroll to the section). The "Research &
// Development" group label is intentionally omitted — it's just a divider.
const PROJECT_SECTIONS = {
  petwheels: [
    "Business Model",
    "Patent",
    "In the news",
    "Problem",
    "Diachronic analysis",
    "Market analysis",
    "User research",
    "Environment analysis",
    "Design requirements",
    "Mood boards",
    "Ideation",
    "Creation",
    "Solutions",
    "Materials & fabrication",
    "Customization",
  ],
  zenik: [
    "Briefing",
    "Market analysis",
    "Environment analysis",
    "User research",
    "Mood boards",
    "Design requirements",
    "Ideation",
    "Creation",
    "Solutions",
    "Technical drawings",
  ],
  durare: [
    "Desk research",
    "User research",
    "Functional & structural analysis",
    "Ergonomic analysis",
    "Market analysis",
    "Design requirements",
    "Mood boards",
    "Ideation",
    "Creation",
    "Prototype",
  ],
  "docol-cozy": [
    "Briefing",
    "User research",
    "Market analysis",
    "Design requirements",
    "Concept",
    "Ideation",
    "Creation",
    "Prototype",
  ],
  // Mechanical engineering — TUFF's sections are the four PRODIP design phases;
  // each phase is a collapsible section whose subsections render inline once open.
  tuff: [
    "Informational design",
    "Conceptual design",
    "Preliminary design",
    "Detailed design",
  ],
  // 3D Printing (Baltha Maker)
  "falcon-mouse": ["3D Modeling", "Build and assembly"],
  "florianopolis-museum": ["3D Modeling", "3D printing and finishing"],
  "mesc-museum": ["3D Modeling", "Production and finishing"],
};

// Which project's section list is expanded in the sidebar.
let expandedProjectId = null; // sidebar projects start collapsed

const CHEVRON_SVG =
  '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';

function renderSidebar() {
  const cat = getCategory(activeCategoryId);
  sidebarTitle.textContent = cat.label;
  sidebarLabel.textContent = cat.description;
  sidebarNav.innerHTML = "";

  cat.projects.forEach((proj) => {
    const sections = PROJECT_SECTIONS[proj.id];
    const expanded = expandedProjectId === proj.id;

    const item = document.createElement("div");
    item.className = "side-item";
    item.dataset.proj = proj.id;

    const row = document.createElement("div");
    row.className = "side-row" + (proj.id === activeProjectId ? " active" : "");

    const btn = document.createElement("button");
    btn.className = "side-proj";
    btn.textContent = proj.title;
    btn.addEventListener("click", () => {
      // Already showing this project? Just toggle its section list (no reload).
      // Otherwise switch to it (which expands it and collapses the others).
      if (proj.id === activeProjectId) {
        setSidebarExpanded(expandedProjectId === proj.id ? null : proj.id);
      } else {
        selectProject(proj.id);
      }
    });
    row.appendChild(btn);

    if (sections && sections.length) {
      const arrow = document.createElement("button");
      arrow.className = "side-arrow" + (expanded ? " open" : "");
      arrow.setAttribute("aria-label", "Toggle sections");
      arrow.setAttribute("aria-expanded", String(expanded));
      arrow.innerHTML = CHEVRON_SVG;
      arrow.addEventListener("click", (e) => {
        e.stopPropagation();
        setSidebarExpanded(expandedProjectId === proj.id ? null : proj.id);
      });
      row.appendChild(arrow);
    }
    item.appendChild(row);

    // The section list is always in the DOM (collapsed via CSS) so it can animate.
    if (sections && sections.length) {
      const sub = document.createElement("div");
      sub.className = "side-sub" + (expanded ? " open" : "");
      const subInner = document.createElement("div");
      subInner.className = "side-sub-inner";
      sections.forEach((label) => {
        const sbtn = document.createElement("button");
        sbtn.className = "side-sec";
        sbtn.textContent = label;
        sbtn.addEventListener("click", () => goToSection(proj.id, label));
        subInner.appendChild(sbtn);
      });
      sub.appendChild(subInner);
      item.appendChild(sub);
    }
    sidebarNav.appendChild(item);
  });
}

// Toggle which project's section list is expanded, animating in place (no
// rebuild) so the CSS transition runs.
function setSidebarExpanded(id) {
  expandedProjectId = id;
  sidebarNav.querySelectorAll(".side-item").forEach((item) => {
    const open = item.dataset.proj === id;
    const arrow = item.querySelector(".side-arrow");
    const sub = item.querySelector(".side-sub");
    if (arrow) {
      arrow.classList.toggle("open", open);
      arrow.setAttribute("aria-expanded", String(open));
    }
    if (sub) sub.classList.toggle("open", open);
  });
}

// Scroll to a section by its heading text (selecting the project first if
// needed), opening that collapsible section so its content is visible.
function goToSection(projId, label) {
  if (projId !== activeProjectId) selectProject(projId);
  const scope = pageCache[projId] || content;
  const heads = scope.querySelectorAll(".pw-subtitle, .pw-section-title");
  for (const h of heads) {
    if (h.textContent.trim() === label) {
      const title = h.classList.contains("pw-collapsible")
        ? h
        : h.closest(".pw-collapsible");
      if (title && !title.classList.contains("open")) {
        title.classList.add("open");
        title.setAttribute("aria-expanded", "true");
        const body = title.nextElementSibling;
        if (body && body.classList.contains("pw-sec-body")) {
          body.classList.add("open");
        }
      }
      (title || h).scrollIntoView({ behavior: "smooth", block: "start" });
      break;
    }
  }
}

// Per-project skills / software / knowledge shown in the right rail. Placeholder
// sets — edit freely. A project without an entry shows the empty state.
const PROJECT_SKILLS = {
  meetcraft: {
    Summary:
      "A web-based 3D editor powered by Babylon.js for building interactive 3D scenes in the browser, with real-time collaboration. It started as a personal project to explore AI-powered creative tools and grew into a full platform \u2014 React/TypeScript frontend, Babylon.js rendering, and Supabase for auth, sync and storage.",
    Year: "2024",
    Knowledge: ["Real-time 3D on the web", "Collaborative editing", "AI tooling"],
    Skills: ["Full-stack development", "Babylon.js", "UI/UX design", "3D"],
    Software: ["React", "TypeScript", "Babylon.js", "Supabase", "Blender", "Figma"],
  },
  "meetkai-suite": {
    Summary:
      "A Blender add-on I built on my own initiative to automate MeetKai's 3D-for-web pipeline \u2014 material aggregation and remeshing, lightmap/AO baking, UV mapping, a color-atlas editor, armature aggregation, and an AI assistant. It is now a standard tool used across the team's 3D production.",
    Year: "2023",
    Knowledge: ["3D pipeline optimization", "Lightmapping", "Tooling & automation"],
    Skills: ["Blender add-on development", "Python", "Automation", "AI integration"],
    Software: ["Blender", "Blender API", "Python", "OpenAI API"],
  },
  "survive-thanksgiving": {
    Summary:
      "An interactive web experience for Sony's horror film Thanksgiving, built with MeetKai. I designed the Basement (the film's climactic finale), produced all in-game cutscene videos, and built an optimized 3D crowd system for the outdoor areas that runs smoothly on mobile.",
    Year: "2023",
    Knowledge: ["Real-time 3D", "Performance optimization", "Environment art"],
    Skills: ["Environment design", "3D modeling", "Crowd optimization", "Cutscenes"],
    Software: ["Babylon.js", "Blender", "Substance 3D", "Photoshop"],
  },
  "byd-dealership": {
    Summary:
      "A 3D web showroom for BYD where users tour dealerships, customize colors and take virtual test drives in the browser. I led much of the 3D work \u2014 most notably recreating the BYD Seagull from scratch (exterior, interior, materials and interactive animations) and building the Philippines dealership digital twin.",
    Year: "2024",
    Knowledge: ["Automotive 3D", "Web optimization", "Digital twins"],
    Skills: ["Vehicle modeling", "Interior modeling", "Texturing", "Animation"],
    Software: ["Babylon.js", "Blender", "Substance 3D", "Photoshop"],
  },
  "pistons-store": {
    Summary:
      "An interactive 3D merchandise store for the Detroit Pistons across three environments \u2014 a showroom, the arena court, and a locker-room event space. I was 3D lead and handled most of the UX, building optimized real-time environments with baked lighting and lightweight animated crowds.",
    Year: "2024",
    Knowledge: ["Real-time 3D", "Lightmapping", "Retail / e-commerce 3D"],
    Skills: ["Environment design", "UX design", "Lightmap baking", "3D"],
    Software: ["Babylon.js", "Blender", "Substance 3D", "Photoshop"],
  },
  "chevrolet-montana": {
    Summary:
      "The Chevrolet Montana 2023 recreated as an optimized 3D model for WebAR, part of a major launch campaign (featured on Big Brother Brasil). Built for real-time with reduced polycount, baked AO, texture atlases and rigged tailgate animations, then deployed so customers could place the truck at real scale from their phone.",
    Year: "2022",
    Knowledge: ["WebAR", "Automotive 3D", "Marketing experiences"],
    Skills: ["Vehicle modeling", "Optimization", "AR", "Animation"],
    Software: ["Babylon.js", "Spark AR", "Blender", "Photoshop"],
  },
  "dolce-gusto": {
    Summary:
      "3D models of Nescaf\u00e9 Dolce Gusto coffee machines for WebXR sales and marketing. With no original CAD available, I recreated them from photos and specs \u2014 surface modeling in Fusion 360, then Blender for UVs, materials and per-color variants for real-time AR switching.",
    Year: "2022",
    Knowledge: ["WebXR / AR", "Product visualization", "Surface modeling"],
    Skills: ["Product modeling", "Surface / NURBS modeling", "Materials", "AR"],
    Software: ["Babylon.js", "Spark AR", "Fusion 360", "Blender"],
  },
  "falcon-mouse": {
    Summary:
      "A 3D-printed wireless mouse shaped like the Millennium Falcon, made in 2017 as a Star Wars fan project. After going viral on Instagram (150k+ reach), it was redesigned with higher detail and a solder-free assembly so anyone could print and build their own.",
    Year: "2017",
    Knowledge: ["Reverse engineering", "Digital fabrication", "Hobby electronics"],
    Skills: ["3D modeling", "Mechanism design", "3D printing", "DFAM"],
    Software: ["Autodesk Fusion 360", "Blender", "Ultimaker Cura"],
  },
  "florianopolis-museum": {
    Summary:
      "A 1:41 scale model of the SESC Florianópolis Museum, 3D-printed in multi-color parts and finished with epoxy resin. The hollow model weighs ~20 kg and is on permanent display in the museum's entrance hall.",
    Year: "2018",
    Knowledge: ["Architecture", "NURBS modeling", "Digital fabrication"],
    Skills: ["Technical CAD modeling", "NURBS modeling", "3D printing", "Finishing"],
    Software: ["Autodesk Fusion 360", "Blender", "Ultimaker Cura"],
  },
  "mesc-museum": {
    Summary:
      "A scale model of the neoclassical Museu da Escola Catarinense (MESC), commissioned after the SESC piece. Modeled in Fusion 360 with NURBS detailing and 3D-printed in multi-color parts with an epoxy finish.",
    Year: "2019",
    Knowledge: ["Architecture", "NURBS modeling", "Digital fabrication"],
    Skills: ["Technical CAD modeling", "NURBS modeling", "3D printing", "Finishing"],
    Software: ["Autodesk Fusion 360", "Blender", "Ultimaker Cura"],
  },
  durare: {
    Summary:
      "Durare was a high-complexity product-design project at UFSC, developed in the fourth semester by a team of three: an innovative carry-on suitcase, built to last. The work followed a full development cycle, from desk, user and market research through to a physical prototype. Travellers were surveyed and observed, the case was studied functionally and ergonomically (OWAS postures and anthropometric data), and the findings were turned into ranked requirements through a House of Quality. From there the concept was detailed in CAD and resolved into real mechanisms: a telescopic handle locked by neodymium magnets, and retractable natural-rubber wheels that let the case climb steps. The result was built as a 3D-printed, hand-finished prototype with sewn soft goods.",
    Year: "2019",
    Knowledge: [
      "Design Methodology",
      "Product Ergonomics",
      "Materials & Manufacturing Processes",
      "Marketing & Consumer Behaviour",
      "Design & Innovation",
      "Design & Sustainability",
    ],
    Skills: [
      "Design thinking",
      "User & market research",
      "Ergonomic analysis (OWAS)",
      "Sketching",
      "3D modeling",
      "Mechanism design",
      "Rendering",
      "Prototyping",
    ],
    Software: ["Autodesk Fusion 360", "Ultimaker Cura", "Adobe Photoshop"],
  },
  "docol-cozy": {
    Summary:
      "DocolCozy Compact was a medium-complexity product-design project at UFSC, developed in the third semester in partnership with the sanitary-ware company Docol. The brief was a compact heated towel rail for small studio bathrooms, made usable by as many people as possible through universal design. The work ran from briefing and field research to a working prototype. The target audience was the users most often forgotten in product development, older adults and people with disabilities, studied through field research at NETI (UFSC). The findings became mandatory and desirable requirements, and a weighted decision matrix selected a triangular corner rail: folding the same bar length into a right triangle frees floor space and, with rounded corners, adds 40% of usable length. The design adds an elongated tube section, a discreet wireless timer and smart-home control, and was built as a 3D-printed prototype.",
    Year: "2019",
    Knowledge: [
      "Design Methodology",
      "Product Ergonomics",
      "Universal & Inclusive Design",
      "Materials & Manufacturing Processes",
      "Marketing & Consumer Behaviour",
      "Design & Innovation",
    ],
    Skills: [
      "Design thinking",
      "User research",
      "Industrial design",
      "Sketching",
      "3D modeling",
      "Rendering",
      "Prototyping",
    ],
    Software: ["Autodesk Fusion 360", "Ultimaker Cura", "Adobe Photoshop"],
  },
  zenik: {
    Summary:
      "Zenik was a low-complexity product-design project at UFSC, developed in the second semester by a team of three, in partnership with Centro Sapiens. The brief was urban furniture for the Square Lab, an open coworking plaza in downtown Florianópolis, that had to be easy to move, durable in a public space and welcoming to many different audiences. The work ran from briefing and market analysis to a resolved design with technical drawings. The plaza and its users were studied through field observation, questionnaires and personas, and the findings were turned into mandatory and desirable requirements. The result is Zenik, a wood-and-steel piece that converts between an upright desk for focused work and a reclined lounger for rest, its form anchored on the posture of maximum relaxation and proportioned by the golden ratio.",
    Year: "2018",
    Knowledge: [
      "Design Methodology",
      "Product Ergonomics",
      "Materials & Manufacturing Processes",
      "Marketing & Consumer Behaviour",
      "Theory of Form",
      "Technical Drawing & CAD",
    ],
    Skills: [
      "Design thinking",
      "User & market research",
      "3D modeling",
      "Technical drawing",
      "Rendering",
    ],
    Software: ["Autodesk Fusion 360", "Adobe Photoshop"],
  },
  petwheels: {
    Summary:
      "Project summary placeholder — a concise overview of the Petwheels project will go here.",
    Knowledge: ["Knowledge placeholder 1", "Knowledge placeholder 2", "Knowledge placeholder 3"],
    Skills: ["Skill placeholder 1", "Skill placeholder 2", "Skill placeholder 3"],
    Software: ["Software placeholder 1", "Software placeholder 2", "Software placeholder 3"],
  },
  tuff: {
    Summary:
      "TUFF was a mechanical-engineering project developed in 2016 in the Integrated Project course at UFSC, for the energy-drink brand CAN. The goal was a portable machine that chills a warm bottle to fridge-cold in under a minute. Following the PRODIP development methodology, the work moved through four phases, from user needs and specifications to a detailed, costed design. The winning concept spins the bottle at variable speed in a chilled salt-water bath, cooled by a vapour-compression circuit and held cold by polyurethane-foam insulation. A working prototype was built and bench-tested at the POLO lab, with the refrigeration cycle sized in CoolPack and the rotating flow analysed in SolidWorks Flow Simulation; an Arduino runs the motor and protects the compressor. The detailed design phase produced a fully defined, costed and manufacturable rapid chiller.\n\nAcross a large engineering team, I took part in every stage of the project, though my focus leaned towards turning TUFF into a viable product for the market and the client rather than a pure experiment. That pulled me into the market analysis, the 3D modelling and the prototyping: I was responsible for all of the 3D work and 3D prints, and ran several of the hands-on tests, from filling the reservoir with polyurethane foam to the bottle coupling and its motor-driven rotation.",
    Year: "2016",
    Knowledge: [
      "Engineering Design Methodology",
      "Technical Drawing",
      "Geometric Modelling & CAD",
      "Thermodynamics",
      "Heat Transfer",
      "Fluid Mechanics",
      "Engineering Materials",
      "Manufacturing Processes",
      "Electronics",
    ],
    Skills: [
      "Refrigeration design",
      "Thermal & fluid simulation",
      "3D modeling",
      "Electronics & Arduino",
      "Mechanism design",
      "Prototyping",
      "Bench testing",
    ],
    Software: [
      "Autodesk Inventor",
      "SolidWorks Flow Simulation",
      "CoolPack",
      "Arduino IDE",
    ],
  },
  "epicyclic-magnetic-gear": {
    Summary:
      "The Magnetic Epicyclic Gear was a research project carried out in 2016 during a summer research assistantship at NJIT (New Jersey Institute of Technology), while on a mechanical-engineering exchange. It explores a contactless gearbox that transmits torque through rare-earth magnets instead of meshing teeth, removing the friction, wear, lubrication and most of the noise of a conventional gear. The design uses a planetary (epicyclic) layout, an 18-magnet ring, three planet gears, a three-magnet sun-gear output and a carrier rotor, giving a 7:1 ratio. Every part was modelled and 3D-printed in-house, and the working rig spun a small turbine to light a bulb, reaching about 1.63 V and running without slipping up to roughly 100 RPM input. It was my first real 3D print and my first international presentation, at an NJIT science fair.",
    Year: "2016",
    Knowledge: [
      "Mechanisms",
      "Machine Elements",
      "Electromagnetism",
      "Engineering Materials",
      "Geometric Modelling & CAD",
    ],
    Skills: [
      "Research",
      "3D modeling",
      "Mechanism design",
      "3D printing",
      "Prototyping",
      "Testing",
    ],
    Software: ["Autodesk Inventor"],
  },
};

function renderSkills() {
  if (!skillsPanel) return;
  const cat = getCategory(activeCategoryId);
  const proj = cat.projects.find((p) => p.id === activeProjectId);
  const data = proj && PROJECT_SKILLS[proj.id];

  if (!data) {
    skillsPanel.innerHTML = `
      <p class="skills-title">Skills &amp; tools</p>
      <p class="skills-empty">Software, skills and knowledge for this project, to be added.</p>`;
    return;
  }

  // Display labels for the three pill sets (data keys stay Software/Skills/Knowledge).
  const LABELS = {
    Software: "Software used",
    Skills: "Skills exercised",
    Knowledge: "Knowledge-base",
  };
  const pillSection = (key) => {
    const tags = data[key];
    if (!tags || !tags.length) return "";
    return `
      <section class="skills-block">
        <p class="skills-head">${LABELS[key]}</p>
        <div class="skills-tags">${tags
          .map((t) => `<span class="skill-tag">${t}</span>`)
          .join("")}</div>
      </section>`;
  };
  // The project summary, split into paragraphs on blank lines.
  const summary = data.Summary
    ? `
      <section class="skills-block">
        <p class="skills-head">Project summary</p>
        ${data.Summary.split("\n\n")
          .map((p) => `<p class="skills-summary">${p}</p>`)
          .join("")}
      </section>`
    : "";
  // Year, shown as a single pill to match the other sections.
  const yearBlock = data.Year
    ? `
      <section class="skills-block">
        <p class="skills-head">Year</p>
        <div class="skills-tags"><span class="skill-tag">${data.Year}</span></div>
      </section>`
    : "";

  skillsPanel.innerHTML = `${summary}${yearBlock}${pillSection("Knowledge")}${pillSection(
    "Skills"
  )}${pillSection("Software")}`;
}

// Pause the Petwheels customizer's WebGL render loop the moment its iframe is
// fully out of view — its continuous rendering shares the main thread with the
// page and stutters scrolling otherwise. No rootMargin, so it pauses as soon as
// the viewer leaves the viewport (not 300px later, which left a janky band just
// below it).
let pwVisObserver = null;
// Cover row: size each figure's flex-grow to its media's own aspect ratio, read
// from the real file (image or video). With flex-basis 0, flex-grow ∝ aspect
// makes the figures come out the same height automatically — no hard-coded
// ratios, so it adapts to whatever cover files are dropped in.
function setupPetwheelsCover(scope) {
  const row = scope.querySelector(".pw-cover");
  if (!row) return;
  const figs = [...row.querySelectorAll("figure")];
  const fit = (fig) => {
    const m = fig.querySelector("img, video");
    if (!m) return;
    const w = m.naturalWidth || m.videoWidth;
    const h = m.naturalHeight || m.videoHeight;
    if (w && h) fig.style.flex = `${(w / h).toFixed(4)} 1 0`;
  };
  figs.forEach((fig) => {
    const m = fig.querySelector("img, video");
    if (!m) return;
    if (m.tagName === "VIDEO") {
      if (m.videoWidth) fit(fig);
      else m.addEventListener("loadedmetadata", () => fit(fig), { once: true });
    } else if (m.complete && m.naturalWidth) {
      fit(fig);
    } else {
      m.addEventListener("load", () => fit(fig), { once: true });
    }
  });
}

function setupPetwheelsRenderPause(scope) {
  const iframe = scope.querySelector(".pw-frame iframe");
  if (!iframe || !("IntersectionObserver" in window)) return;
  pwVisObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries.some((e) => e.isIntersecting);
      const w = iframe.contentWindow;
      if (w && typeof w.pwSetRenderActive === "function") w.pwSetRenderActive(visible);
    },
    { root: content, threshold: 0 }
  );
  pwVisObserver.observe(iframe);
}

// The card positions/sizes are authored at this design width/height; the whole
// pile is scaled down proportionally when the content area is narrower than this,
// so it always fits (and grows back to 1:1 on wide screens).
const PW_NEWS_DESIGN_W = 1080;
const PW_NEWS_DESIGN_H = 440;

// Play the "news thrown on the table" animation once the pile scrolls into view
// (rather than on render, which may be far below the fold).
let pwNewsObserver = null;
let pwNewsResize = null;
function setupPetwheelsNews(scope) {
  const pile = scope.querySelector("#pwNews");
  if (!pile) return;

  // Scale the pile to fit the available width, and reserve a matching height.
  // Skip while hidden (clientWidth 0) so the cached page doesn't get scale 0.
  const fitPile = () => {
    if (!pile.clientWidth) return;
    const scale = Math.min(1, pile.clientWidth / PW_NEWS_DESIGN_W);
    pile.style.setProperty("--pw-scale", scale.toFixed(4));
    pile.style.height = PW_NEWS_DESIGN_H * scale + "px";
  };
  pile.__fit = fitPile; // re-run when the cached page is shown again
  fitPile();
  if ("ResizeObserver" in window) {
    // Observe the content area (not the pile, whose height we mutate) so this
    // can't feed back into a resize loop. Content size only changes on real
    // layout changes (window / CV panel), never during scroll.
    pwNewsResize = new ResizeObserver(fitPile);
    pwNewsResize.observe(content);
  }

  if (!("IntersectionObserver" in window)) {
    pile.classList.add("is-in"); // no observer support: just show the pile
    return;
  }
  pwNewsObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          obs.unobserve(e.target); // play once
        }
      });
    },
    { root: content, threshold: 0.3 }
  );
  pwNewsObserver.observe(pile);
}

// Zenik "Creation": the right-hand image cycles through the tested relaxation
// positions every 2s (instant swap, no animation). Images are preloaded so the
// swap doesn't flash.
let zenikSwapTimer = null;
function setupZenikPositions(scope) {
  const img = scope.querySelector("#posSwap");
  if (!img) return;
  const srcs = [
    "assets/zenik/position-1.png",
    "assets/zenik/position-2.png",
    "assets/zenik/position-3.png",
  ];
  srcs.forEach((s) => { const im = new Image(); im.src = s; });
  let i = 0;
  zenikSwapTimer = setInterval(() => {
    i = (i + 1) % srcs.length;
    img.src = srcs[i];
  }, 1500);
}

// Make each main section title (gray stripe) collapsible: wrap the content that
// follows it (up to the next title/group) and toggle it. Sections that come
// before the "Research & Development" group label start expanded; the rest start
// collapsed. Each toggles independently.
function setupCollapsibles(scope) {
  const titles = scope.querySelectorAll(".pw-subtitle, .pw-section-head");
  const group = scope.querySelector(".pw-group");
  titles.forEach((title) => {
    const body = document.createElement("div");
    body.className = "pw-sec-body";
    const inner = document.createElement("div");
    inner.className = "pw-sec-inner";
    let node = title.nextElementSibling;
    while (node && !node.matches(".pw-subtitle, .pw-section-head, .pw-group")) {
      const next = node.nextElementSibling;
      inner.appendChild(node);
      node = next;
    }
    body.appendChild(inner);
    title.after(body);

    // Open by default if this title precedes the R&D group (e.g. Petwheels'
    // Patent and Media). Zenik's group is first, so everything starts collapsed.
    const openByDefault =
      !!group &&
      !!(title.compareDocumentPosition(group) & Node.DOCUMENT_POSITION_FOLLOWING);

    title.classList.add("pw-collapsible");
    title.classList.toggle("open", openByDefault);
    body.classList.toggle("open", openByDefault);
    title.setAttribute("role", "button");
    title.setAttribute("tabindex", "0");
    title.setAttribute("aria-expanded", String(openByDefault));
    // Inner links/buttons (e.g. "View patent") shouldn't toggle the section.
    title
      .querySelectorAll("a, button")
      .forEach((el) => el.addEventListener("click", (e) => e.stopPropagation()));

    const toggle = () => {
      const open = title.classList.toggle("open");
      title.setAttribute("aria-expanded", String(open));
      body.classList.toggle("open", open);
    };
    title.addEventListener("click", toggle);
    title.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    });
  });
}

// ---------- Docol: interactive 3D opportunity map ----------
// Competitors cluster on the cost-benefit wall (innovation ~ 0); Docol breaks out
// along the open innovation axis. Pure CSS 3D + pointer drag, no libraries.
function setupDocolOpportunity(scope) {
  const root = scope.querySelector("#docolOpp");
  if (!root) return;
  try {
    root.innerHTML = ""; // drop the fallback text
    const S = 200; // cube edge (px)
    // b = benefit, c = cost, i = innovation, all normalised 0..1
    const BRANDS = [
      { f: "logo-term.png", n: "Term", b: 0.28, c: 0.2, i: 0 },
      { f: "logo-atlantic.png", n: "Atlantic", b: 0.5, c: 0.42, i: 0 },
      { f: "logo-solaire.png", n: "SolAire", b: 0.63, c: 0.52, i: 0 },
      { f: "logo-warmlyyours.png", n: "WarmlyYours", b: 0.58, c: 0.74, i: 0 },
      { f: "logo-seccare.png", n: "Seccare", b: 0.3, c: 0.82, i: 0 },
      { f: "docol.png", n: "Docol", b: 0.72, c: 0.6, i: 0.9, docol: true },
    ];

    const stage = document.createElement("div");
    stage.className = "opp3d-stage";
    root.appendChild(stage);

    const P = (b, c, i) => ({ x: (b - 0.5) * S, y: -(c - 0.5) * S, z: (i - 0.5) * S });
    const bb = []; // billboarded elements: {el, base}

    // cost-benefit wall (grid plane at innovation = 0)
    const wall = document.createElement("div");
    wall.className = "opp3d-wall";
    wall.style.width = wall.style.height = S + "px";
    const w0 = P(0.5, 0.5, 0);
    wall.style.transform = `translate3d(${w0.x}px, ${w0.y}px, ${w0.z}px) translate(-50%,-50%)`;
    stage.appendChild(wall);

    // axes from the (0,0,0) corner
    const o = P(0, 0, 0);
    function axis(cls, rot, label, emoji) {
      const bar = document.createElement("div");
      bar.className = "opp3d-axis " + cls;
      bar.style.width = S + 22 + "px";
      bar.style.transform = `translate3d(${o.x}px, ${o.y}px, ${o.z}px) ${rot}`;
      stage.appendChild(bar);
      const e = cls === "ax-b" ? P(1.18, 0, 0) : cls === "ax-c" ? P(0, 1.2, 0) : P(0, 0, 1.2);
      const lab = document.createElement("div");
      lab.className = "opp3d-axlabel " + cls + "l";
      lab.innerHTML = `<span class="opp3d-emoji">${emoji}</span>${label}`;
      const base = `translate3d(${e.x}px, ${e.y}px, ${e.z}px)`;
      lab.style.transform = base;
      stage.appendChild(lab);
      bb.push({ el: lab, base });
    }
    axis("ax-b", "", "Benefit", "👍");
    axis("ax-c", "rotateZ(-90deg)", "Cost", "💰");
    axis("ax-i", "rotateY(-90deg)", "Innovation", "⭐");

    // the open-space "?"
    const q = document.createElement("div");
    q.className = "opp3d-q";
    q.textContent = "?";
    const qp = P(0.5, 0.45, 0.6);
    const qbase = `translate3d(${qp.x}px, ${qp.y}px, ${qp.z}px)`;
    q.style.transform = qbase;
    stage.appendChild(q);
    bb.push({ el: q, base: qbase });

    // brand markers
    BRANDS.forEach((br) => {
      const p = P(br.b, br.c, br.i);
      if (br.docol) {
        const base = P(br.b, br.c, 0);
        const conn = document.createElement("div");
        conn.className = "opp3d-conn";
        conn.style.width = br.i * S + "px";
        conn.style.transform = `translate3d(${base.x}px, ${base.y}px, ${base.z}px) rotateY(-90deg)`;
        stage.appendChild(conn);
      }
      const pt = document.createElement("div");
      pt.className = "opp3d-pt" + (br.docol ? " is-docol" : "");
      pt.style.transform = `translate3d(${p.x}px, ${p.y}px, ${p.z}px)`;
      const dot = document.createElement("div");
      dot.className = "opp3d-dot";
      pt.appendChild(dot);
      const chip = document.createElement("div");
      chip.className = "opp3d-chip";
      chip.innerHTML = `<img src="assets/docol/${br.f}" alt="${br.n}" loading="lazy" />`;
      pt.appendChild(chip);
      stage.appendChild(pt);
      bb.push({ el: chip, base: "" });
    });

    // rotation + billboard. Vertical tilt is LOCKED — like Petwheels, only the
    // horizontal (Y) orbit responds to dragging.
    const AX = -4; // fixed tilt: near eye-level (only a touch from the top)
    let ay = 56, auto = true, visible = false, raf = 0;
    const startT = Date.now();
    function draw(ayVal) {
      stage.style.transform = `rotateX(${AX}deg) rotateY(${ayVal}deg)`;
      const inv = ` rotateY(${-ayVal}deg) rotateX(${-AX}deg) translate(-50%,-50%)`;
      bb.forEach((b) => (b.el.style.transform = b.base + inv));
    }
    draw(ay);

    let drag = false, lx = 0;
    root.style.touchAction = "pan-y"; // let the page still scroll vertically
    root.addEventListener("pointerdown", (e) => {
      drag = true; auto = false; lx = e.clientX;
      root.classList.add("grabbing");
      try { root.setPointerCapture(e.pointerId); } catch (_) {}
    });
    root.addEventListener("pointermove", (e) => {
      if (!drag) return;
      ay += (e.clientX - lx) * 0.4; // horizontal orbit only
      lx = e.clientX;
      draw(ay);
    });
    const end = () => { drag = false; root.classList.remove("grabbing"); };
    root.addEventListener("pointerup", end);
    root.addEventListener("pointercancel", end);

    const io = new IntersectionObserver(
      (es) => { visible = es[0].isIntersecting; },
      { threshold: 0.05 }
    );
    io.observe(root);

    // A small, decaying sway every ~2s (not a constant spin) until first interaction.
    function wiggle() {
      const c = (Date.now() - startT) % 2000;
      if (c >= 850) return 0;
      const p = c / 850;
      return Math.sin(p * Math.PI * 2) * 6 * (1 - p);
    }
    function tick() {
      if (auto && visible) draw(ay + wiggle());
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
  } catch (err) {
    root.innerHTML =
      '<div class="opp3d-fallback">Cost × Benefit × Innovation map.</div>';
  }
}

// Epicyclic gear: a simple slide viewer for the 21-slide presentation. One slide
// shown at a time, prev/next + counter, with arrow-key support.
function setupEpicyclicSlider(scope) {
  const root = scope.querySelector("#epiSlider");
  if (!root) return;
  const slides = [...root.querySelectorAll(".epi-slide")];
  if (!slides.length) return;
  const counter = root.querySelector(".epi-counter");
  const prev = root.querySelector(".epi-prev");
  const next = root.querySelector(".epi-next");
  let i = 0;
  const show = (n) => {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle("on", k === i));
    if (counter) counter.textContent = `${i + 1} / ${slides.length}`;
  };
  prev.addEventListener("click", () => show(i - 1));
  next.addEventListener("click", () => show(i + 1));
  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") show(i - 1);
    else if (e.key === "ArrowRight") show(i + 1);
  });
  show(0);
}

// Custom pages are built once and kept in the DOM (just shown/hidden), so their
// iframes — notably the Petwheels 3D customizer — aren't reloaded on return.
const pageCache = {}; // proj.id -> cached page node
let transientNode = null; // landing / placeholder content (recreated each time)

function renderContent() {
  renderSkills();

  const cat = getCategory(activeCategoryId);
  const proj = cat.projects.find((p) => p.id === activeProjectId);

  // Hide all cached pages and drop the transient one.
  Object.values(pageCache).forEach((el) => (el.style.display = "none"));
  if (transientNode) { transientNode.remove(); transientNode = null; }

  // Custom, hand-built pages — cached and reused (iframe state preserved).
  if (proj && PROJECT_PAGES[proj.id]) {
    let node = pageCache[proj.id];
    if (!node) {
      node = document.createElement("div");
      node.innerHTML = PROJECT_PAGES[proj.id]();
      content.appendChild(node);
      pageCache[proj.id] = node;
      // One-time setup, scoped to this page.
      if (proj.id === "petwheels") {
        setupPetwheelsCover(node);
        setupPetwheelsRenderPause(node);
        setupPetwheelsNews(node);
      }
      if (proj.id === "zenik") setupZenikPositions(node);
      if (proj.id === "docol-cozy") setupDocolOpportunity(node);
      if (proj.id === "epicyclic-magnetic-gear") setupEpicyclicSlider(node);
      setupCollapsibles(node);
    }
    node.style.display = "";
    const pile = node.querySelector("#pwNews"); // re-fit in case the window
    if (pile && pile.__fit) pile.__fit(); // resized while this page was hidden
    content.scrollTop = 0;
    return;
  }

  // Transient content: category landing or a placeholder project.
  transientNode = document.createElement("div");
  transientNode.innerHTML = !proj
    ? `<div class="content-inner">
         <h1>${cat.label}</h1>
         <p>Select a project from the sidebar to view its details. This section
         collects work in ${cat.label.toLowerCase()}.</p>
       </div>`
    : `<div class="content-inner">
         <h1>${proj.title}</h1>
         <p>Placeholder description for <strong>${proj.title}</strong>. Project
         details, images and write-up will go here.</p>
         <div class="placeholder-box">Content coming soon</div>
       </div>`;
  content.appendChild(transientNode);
  content.scrollTop = 0;
}

// ---------- Curriculum Vitae ----------
// Rendered once into the slide-in CV panel (see #cv-inner).
const CV_INFO = [
  { label: "Name", value: "Artur Donadel Balthazar" },
  { label: "Nationality", value: "Brazilian / Italian" },
  {
    label: "Email",
    value: "arturbalthazar@gmail.com",
    href: "mailto:arturbalthazar@gmail.com",
  },
  { label: "Phone", value: "+55 (48) 99128-7795", href: "tel:+5548991287795" },
];

const CV_PROFILE = `Creative technologist with an academic background in mechanical
engineering and a degree in product design. Passionate about bringing original
ideas to life, bridging the gap between design and engineering. Skilled in CAD,
surface and organic 3D modeling; computational design workflows; additive
manufacturing; and software to automate and extend design and fabrication tasks.
Strong focus on user-centered design and prototyping, with hands-on experience
turning concepts into physical products. Holistic, end-to-end approach to
projects, comfortable planning business models and running my own ventures.
Effective communicator in multidisciplinary teams, working proactively toward
high-quality results.`;

// Each group renders its tags as rounded "chips", matching the project skills.
const CV_SKILLS = [
  {
    label: "Knowledge-based skills",
    tags: ["Surface, organic and CAD modeling"],
    note: "More to be added.",
  },
  {
    label: "Soft skills",
    tags: [
      "Problem-solving",
      "Creativity",
      "Originality",
      "Eye for detail",
      "Proactivity",
      "Task-driven",
      "Self-motivation",
      "Adaptability",
      "Flexibility",
      "Willingness to learn and share",
      "Teamwork",
      "Time management",
      "Organization",
      "Communication",
      "Positive attitude",
    ],
  },
  {
    label: "Software, tools and programming languages",
    tags: [
      "Blender",
      "Maya",
      "3DsMax",
      "SketchUp",
      "Fusion 360",
      "Rhinoceros",
      "Unity",
      "Unreal Engine",
      "Adobe Substance",
      "Photoshop",
      "Illustrator",
      "Figma",
      "Blender API",
      "Python",
      "JavaScript",
      "TypeScript",
      "Babylon.js",
      "Git/GitHub",
      "Supabase",
      "React",
      "Cursor",
    ],
  },
];

function cvSkillGroup(group) {
  const tags = group.tags
    .map((t) => `<span class="skill-tag">${t}</span>`)
    .join("");
  const note = group.note
    ? `<span class="cv-skill-note">${group.note}</span>`
    : "";
  return `
    <div class="cv-skill-group">
      <p class="cv-skill-label">${group.label}</p>
      <div class="cv-skill-tags">${tags}${note}</div>
    </div>`;
}

function renderCV() {
  const info = CV_INFO.map(
    (i) => `
      <div class="cv-info-row">
        <span class="cv-info-label">${i.label}</span>
        <span class="cv-info-value">${
          i.href
            ? `<a href="${i.href}">${i.value}</a>`
            : i.value
        }</span>
      </div>`
  ).join("");

  return `
    <div class="content-wide cv-page">
      <!-- Identity card -->
      <section id="cv-about" class="cv-card">
        <img class="cv-photo" src="assets/cv.png" alt="Artur Donadel Balthazar" />
        <div class="cv-info">${info}</div>
      </section>

      <!-- Profile -->
      <section id="cv-profile" class="cv-section">
        <h2 class="cv-section-title">Profile</h2>
        <p class="cv-text">${CV_PROFILE}</p>
      </section>

      <!-- Skills -->
      <section id="cv-skills" class="cv-section">
        <h2 class="cv-section-title">Skills</h2>
        ${CV_SKILLS.map(cvSkillGroup).join("")}
      </section>

      <!-- Experience -->
      <section id="cv-experience" class="cv-section">
        <h2 class="cv-section-title">Experience</h2>
        <p class="cv-text">Placeholder — roles, companies, dates and a short
        description of responsibilities and achievements will go here.</p>
        <div class="placeholder-box">Experience details coming soon</div>
      </section>

      <!-- Education -->
      <section id="cv-education" class="cv-section">
        <h2 class="cv-section-title">Education</h2>
        <p class="cv-text">Placeholder — degrees, institutions and dates will go
        here.</p>
        <div class="placeholder-box">Education details coming soon</div>
      </section>
    </div>`;
}

// ---------- Docol: User research + Design requirements section bodies ----------
// Ported from a standalone build; classes namespaced dur-* / ddr-* to avoid
// colliding with Durare's dr-* classes. Headings come from the page's pw-subtitle.
const DUR_ICON = {
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
  wrench: `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
  atom: `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z"/><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z"/></svg>`,
  target: `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></svg>`,
  flower: `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5"/><path d="M12 7.5V9"/><path d="M7.5 12H9"/><path d="M16.5 12H15"/><path d="M12 16.5V15"/><path d="m8 8 1.88 1.88"/><path d="M14.12 9.88 16 8"/><path d="m8 16 1.88-1.88"/><path d="M14.12 14.12 16 16"/></svg>`,
};
const DUR_AUD = {
  elderly: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="1"/><path d="m9 20 3-6 3 6"/><path d="m6 8 6 2 6-2"/><path d="M12 10v4"/></svg>`,
  physical: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="4" r="1"/><path d="m18 19 1-7-6 1"/><path d="m5 8 3-3 5.5 3-2.36 3.5"/><path d="M4.24 14.5a5 5 0 0 0 6.88 6"/><path d="M13.76 17.5a5 5 0 0 0-6.88-6"/></svg>`,
  cognitive: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 18V5"/><path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4"/><path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5"/><path d="M17.997 5.125a4 4 0 0 1 2.526 5.77"/><path d="M18 18a4 4 0 0 0 2-7.464"/><path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517"/><path d="M6 18a4 4 0 0 1-2-7.464"/><path d="M6.003 5.125a4 4 0 0 0-2.526 5.77"/></svg>`,
};
const docolAud = (icon, title, sub) =>
  `<div class="dur-aud-card"><span class="dur-aud-icon">${icon}</span><span class="dur-aud-text"><b>${title}</b><span>${sub}</span></span></div>`;
const docolDemand = (color, icon, label) =>
  `<div class="dur-demand" style="--c:${color}"><span class="dur-icon">${icon}</span><span class="dur-demand-label">${label}</span></div>`;

function docolUserResearchBody() {
  return `
        <p class="pw-text">
          The aim was a product that as many people as possible could use comfortably,
          so the research deliberately focused on the users that most product developers
          tend to "forget", working from a simple premise: if this group can use the
          product well, everyone else will be just as able to.
        </p>
        <div class="dur-audience">
          ${docolAud(DUR_AUD.elderly, "Older adults", "Reduced strength, reach &amp; balance")}
          ${docolAud(DUR_AUD.physical, "Physical disabilities", "Wheelchair users, limited mobility")}
          ${docolAud(DUR_AUD.cognitive, "Cognitive disabilities", "Parkinson's, autism and more")}
        </div>
        <h4 class="dur-subtitle">Field research at NETI · UFSC</h4>
        <div class="dur-field">
          <div class="dur-field-text">
            <p class="pw-text">
              The main round of data collection took place at <strong>NETI</strong> (Núcleo de
              Estudos da Terceira Idade), a UFSC programme that educates and brings back into
              society adults and older people who couldn't study when they were young. Its
              members range from the elderly to wheelchair users and people with Parkinson's
              or autism.
            </p>
            <p class="pw-text">
              In one of the classrooms, the team ran a hands-on activity to understand this
              group's main frustrations when using the wet areas (bathrooms and kitchens) of
              their homes and workplaces.
            </p>
          </div>
          <figure class="dur-photo">
            <img src="assets/docol/user-research-neti.jpg" alt="Research activity with NETI participants at UFSC" loading="lazy" />
            <figcaption>Research activity with NETI participants, UFSC</figcaption>
          </figure>
        </div>
        <h4 class="dur-subtitle">Three core demands</h4>
        <p class="pw-text">
          Every session was audio-recorded, transcribed, studied and distilled into three
          demands that needed the most attention:
        </p>
        <div class="dur-demands">
          ${docolDemand("#8CC152", DUR_ICON.shield, "Safety")}
          ${docolDemand("#FB9A29", DUR_ICON.wrench, "Maintenance")}
          ${docolDemand("#A05BC8", DUR_ICON.atom, "Technology")}
        </div>
        <h4 class="dur-subtitle">Two key interviews</h4>
        <p class="pw-text">
          Two other important interviews were done, with <strong>Dona Eddy</strong>, NETI's
          coordinator at the height of her 89 years, and with <strong>Mariluci</strong>, an
          educator there. After transcribing those conversations as well, a second set of
          emerging demands came up:
        </p>
        <div class="dur-demands">
          ${docolDemand("#FB4F2E", DUR_ICON.target, "Practicality")}
          ${docolDemand("#8CC152", DUR_ICON.shield, "Safety")}
          ${docolDemand("#EC4C8E", DUR_ICON.flower, "Aesthetics")}
        </div>`;
}

const DDR_MUST = [
  ["Be safe", "Interviews"],
  ["Be durable", "Briefing"],
  ["Be economical", "Briefing"],
  ["Be compact", "Desk research"],
  ["Simple to use", "Desk research"],
  ["Easy to maintain", "Interviews"],
];
const DDR_NICE = [
  ["Finish options", "Briefing"],
  ["More than one function", "Market analysis"],
  ["Smart-home connectivity", "Market analysis"],
  ["Low production cost", "Market analysis"],
];
const docolDrRows = (list) =>
  list
    .map(
      ([req, src]) =>
        `<div class="ddr-row"><span class="ddr-req">${req}</span><span class="ddr-src">${src}</span></div>`
    )
    .join("");
const docolDrTable = (variant, title, list) =>
  `<div class="ddr-table ddr-${variant}"><div class="ddr-head"><span>${title}</span><span class="ddr-head-src">Source</span></div>${docolDrRows(list)}</div>`;

function docolDesignReqBody() {
  return `
        <p class="pw-text">
          From all of the data gathered in the briefing, desk research, market analysis
          and the user interviews, the project requirements were defined and split into
          <strong>mandatory</strong> and <strong>desirable</strong>, each one traced back
          to the stage it came from.
        </p>
        <div class="ddr-tables">
          ${docolDrTable("must", "Must-have", DDR_MUST)}
          ${docolDrTable("nice", "Nice-to-have", DDR_NICE)}
        </div>`;
}

// ---------- Custom project pages ----------
const PROJECT_PAGES = {
  // ===== Software =====
  meetcraft: () => `
    <div class="content-wide pw-page work-page">
      <img class="pw-logo" src="assets/work/meetcraft/logo.png" alt="Meetcraft" />

      <p class="pw-intro">
        Meetcraft is a web-based 3D editor powered by Babylon.js that lets you
        create interactive 3D scenes for the web — with real-time, collaborative
        editing right in the browser.
      </p>

      <div style="display:flex;flex-wrap:wrap;gap:10px;margin:0 0 24px">
        <a class="pw-btn" href="https://meetcraft.xyz" target="_blank" rel="noopener"><span>Visit site</span></a>
        <a class="pw-btn" href="https://www.youtube.com/@Meetcraft-Editor" target="_blank" rel="noopener"><span>YouTube</span></a>
        <a class="pw-btn" href="https://discord.gg/eFxZfEWB" target="_blank" rel="noopener"><span>Discord</span></a>
      </div>

      <figure class="pw-img pw-img-single">
        <img src="assets/work/meetcraft/cover.png" alt="Meetcraft editor interface" loading="lazy" />
      </figure>

      <p class="pw-text">
        It started as a personal project to explore AI-powered creative tools and
        has grown into a fully functional platform — built with React and
        TypeScript on the frontend, Babylon.js for real-time rendering, and
        Supabase for authentication, real-time sync and secure cloud storage.
      </p>

      <div class="pw-video">
        <iframe src="https://www.youtube.com/embed/6g6zZgZ-FrE" title="Meetcraft demo" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
      </div>

      <div class="pw-feature">
        <div class="pw-feature-media"><img src="assets/work/meetcraft/image1.png" alt="Cloud and local storage" loading="lazy" /></div>
        <div class="pw-feature-body">
          <h3>Cloud and local storage</h3>
          <p>Projects can live in the cloud via Supabase or entirely offline using the browser's File System Access — work on local folders like a desktop app, or sync assets to the cloud for team access.</p>
        </div>
      </div>

      <section class="pw-section">
        <div class="pw-section-head"><h2 class="pw-section-title">3D editing environment</h2></div>
        <p class="pw-text">
          Full scene authoring with meshes, PBR materials, lights, cameras,
          physics, animations and spatial audio, plus a play mode to test scenes
          without leaving the editor. The interface is intentionally designed to
          feel familiar to Blender users, easing the transition for 3D artists.
        </p>
        <figure class="pw-img pw-img-single"><img src="assets/work/meetcraft/image3.png" alt="3D editing environment" loading="lazy" /></figure>
      </section>

      <section class="pw-section">
        <div class="pw-section-head"><h2 class="pw-section-title">Integrated UI editor</h2></div>
        <p class="pw-text">
          Design HTML/CSS interfaces directly in the 3D environment and anchor them
          to scene objects, with a style editor, animation support and responsive
          breakpoints for building interactive 3D web experiences.
        </p>
        <figure class="pw-img pw-img-single"><img src="assets/work/meetcraft/image4.png" alt="Integrated UI editor" loading="lazy" /></figure>
      </section>

      <div class="pw-feature">
        <div class="pw-feature-media"><img src="assets/work/meetcraft/image5.png" alt="AI-powered scripting" loading="lazy" /></div>
        <div class="pw-feature-body">
          <h3>AI-powered scripting</h3>
          <p>A Monaco-powered code editor with integrated AI assistance — describe what you want in natural language and it generates executable scripts with full context of your scene and the Meetcraft API.</p>
        </div>
      </div>

      <section class="pw-section">
        <div class="pw-section-head"><h2 class="pw-section-title">Real-time collaboration</h2></div>
        <p class="pw-text">
          Create teams with role-based permissions and collaborate live — multiple
          users can edit the same scene at once, with selections, transforms and
          changes syncing instantly alongside presence indicators.
        </p>
        <figure class="pw-img pw-img-single"><img src="assets/work/meetcraft/image2.png" alt="Real-time collaboration" loading="lazy" /></figure>
      </section>

      <div class="pw-feature img-right">
        <div class="pw-feature-media"><img src="assets/work/meetcraft/image6.png" alt="Addon architecture" loading="lazy" /></div>
        <div class="pw-feature-body">
          <h3>Add-on architecture</h3>
          <p>An extensible API inspired by Blender's add-on system — add-ons can register menus, inject panels, subscribe to events, and access scene, physics, animation, audio and history with sandboxed permissions.</p>
        </div>
      </div>

      <div class="pw-feature">
        <div class="pw-feature-media"><img src="assets/work/meetcraft/image7.png" alt="Export to GitHub" loading="lazy" /></div>
        <div class="pw-feature-body">
          <h3>Export to GitHub</h3>
          <p>Export projects straight to GitHub as ready-to-deploy web apps, with snapshot-based versioning to save and revert scene states — a complete pipeline from creation to publication.</p>
        </div>
      </div>
    </div>`,

  "meetkai-suite": () => `
    <div class="content-wide pw-page work-page">
      <img class="pw-logo" src="assets/work/meetkai-suite/logo.png" alt="Blender" />

      <p class="pw-intro">
        MeetKai Suite is a Blender add-on I built on my own initiative after seeing
        the team could benefit from automation tools that didn't exist yet. It has
        since transformed our 3D-for-web asset pipeline and is now a standard tool
        used across our production.
      </p>

      <figure class="pw-img pw-img-single">
        <img src="assets/work/meetkai-suite/cover.png" alt="MeetKai Suite add-on" loading="lazy" />
      </figure>

      <div class="pw-feature img-right">
        <div class="pw-feature-media"><img src="assets/work/meetkai-suite/material-aggregator.png" alt="Material aggregator and object remesher" loading="lazy" /></div>
        <div class="pw-feature-body">
          <h3>Material Aggregator &amp; Object Remesher</h3>
          <p>Merges multiple materials into a single optimized texture set with integrated geometry remeshing. One-click "Apply and Aggregate" finalizes mesh and textures together, drastically reducing draw calls.</p>
        </div>
      </div>

      <div class="pw-feature">
        <div class="pw-feature-media"><img src="assets/work/meetkai-suite/lightmap-baker.png" alt="Lightmap and AO baker" loading="lazy" /></div>
        <div class="pw-feature-body">
          <h3>Lightmap &amp; AO Baker</h3>
          <p>Generates high-quality lightmaps or ambient-occlusion maps with HDR output, per-object baking and an HQ mode for automatic downscaling. Built-in noise reduction delivers production-ready results.</p>
        </div>
      </div>

      <div class="pw-feature img-right">
        <div class="pw-feature-media"><img src="assets/work/meetkai-suite/uv-mapper.png" alt="UV mapper" loading="lazy" /></div>
        <div class="pw-feature-body">
          <h3>UV Mapper</h3>
          <p>Automatic UV unwrapping inspired by Unity — handling scaling, packing and index generation, so artists no longer need to prepare UV layouts for lightmaps by hand.</p>
        </div>
      </div>

      <div class="pw-feature">
        <div class="pw-feature-media"><img src="assets/work/meetkai-suite/color-atlas-editor.png" alt="Color atlas editor" loading="lazy" /></div>
        <div class="pw-feature-body">
          <h3>Color Atlas Editor</h3>
          <p>Per-face PBR editing using just two 128×128 textures, enabling a huge range of value combinations with almost zero footprint — ideal for stylized models and high-optimization projects.</p>
        </div>
      </div>

      <div class="pw-feature img-right">
        <div class="pw-feature-media"><img src="assets/work/meetkai-suite/armature-aggregator.png" alt="Armature aggregator" loading="lazy" /></div>
        <div class="pw-feature-body">
          <h3>Armature Aggregator</h3>
          <p>Merges multiple rigs into one while preserving bone structure and animations, with action merging to combine animation tracks into a single unified action.</p>
        </div>
      </div>

      <div class="pw-feature">
        <div class="pw-feature-media"><img src="assets/work/meetkai-suite/meetkai-assistant.png" alt="MeetKai assistant" loading="lazy" /></div>
        <div class="pw-feature-body">
          <h3>MeetKai Assistant</h3>
          <p>AI-powered agentic editing inside Blender — type a prompt, press Execute, and an AI agent performs the operation using Blender's scripting capabilities.</p>
        </div>
      </div>
    </div>`,

  // ===== Interactive Design =====
  "survive-thanksgiving": () => `
    <div class="content-wide pw-page work-page">
      <img class="pw-logo" src="assets/work/survive-thanksgiving/logo.png" alt="Sony" />

      <figure class="pw-img pw-img-single">
        <img src="assets/work/survive-thanksgiving/cover.png" alt="Survive Thanksgiving game" loading="lazy" />
      </figure>

      <p class="pw-text">
        Thanksgiving is a Sony horror film about a masked killer on the loose during
        the holiday. Sony and MeetKai partnered on an interactive web experience to
        market the movie worldwide. I worked on key 3D elements: the Basement scene
        (the film's climactic finale), all in-game cutscene videos, and an optimized
        3D crowd system for the external areas.
      </p>

      <div class="pw-video">
        <iframe src="https://www.youtube.com/embed/V8zJ_4dDaD8" title="Survive Thanksgiving trailer" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
      </div>

      <section class="pw-section">
        <div class="pw-section-head"><h2 class="pw-section-title">The Basement</h2></div>
        <p class="pw-text">
          The basement is where the movie's final scene takes place — a long dinner
          table set for a twisted Thanksgiving feast. I designed and built the whole
          environment, from the eerie table settings to the dim lighting that sets
          the horror mood.
        </p>
        <div class="pw-images pw-images-2">
          <figure class="pw-img"><img src="assets/work/survive-thanksgiving/basement2.png" alt="Basement scene view 1" loading="lazy" /></figure>
          <figure class="pw-img"><img src="assets/work/survive-thanksgiving/basement3.png" alt="Basement scene view 2" loading="lazy" /></figure>
        </div>
      </section>

      <section class="pw-section">
        <div class="pw-section-head"><h2 class="pw-section-title">External Crowds</h2></div>
        <p class="pw-text">
          The outdoor areas needed a living, breathing crowd to sell the Black
          Friday chaos. I created an optimized 3D crowd system that runs smoothly
          even on mobile — using armature aggregation and animation-track merging to
          keep draw calls minimal while keeping the movement natural.
        </p>
        <div class="pw-images pw-images-2">
          <figure class="pw-img"><img src="assets/work/survive-thanksgiving/crowd1.png" alt="External crowd view 1" loading="lazy" /></figure>
          <figure class="pw-img"><img src="assets/work/survive-thanksgiving/crowd2.png" alt="External crowd view 2" loading="lazy" /></figure>
        </div>
      </section>

      <section class="pw-section">
        <div class="pw-section-head"><h2 class="pw-section-title">Cutscenes</h2></div>
        <p class="pw-text">
          Throughout the game, cutscene videos play when the player encounters the
          killer. I created all of these — short, intense moments that tie the
          gameplay to the film's horror atmosphere. A few examples:
        </p>
        <div class="pw-video">
          <iframe src="https://www.youtube.com/embed/C7IkYRqhUZU" title="Cutscene 1" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
        </div>
        <div class="pw-video">
          <iframe src="https://www.youtube.com/embed/_q2h88RLk5Q" title="Cutscene 2" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
        </div>
      </section>
    </div>`,

  "byd-dealership": () => `
    <div class="content-wide pw-page work-page">
      <img class="pw-logo" src="assets/work/byd-dealership/logo.png" alt="BYD" />

      <figure class="pw-img pw-img-single">
        <img src="assets/work/byd-dealership/facade.png" alt="BYD Los Angeles virtual dealership" loading="lazy" />
      </figure>

      <p class="pw-text">
        The BYD Virtual Dealership brings real showrooms into an interactive 3D web
        experience. Users explore dealerships in Los Angeles, Singapore, the
        Philippines and virtual test tracks — touring vehicles, customizing colors
        and even taking virtual test drives, all from the browser.
      </p>

      <section class="pw-section">
        <div class="pw-section-head"><h2 class="pw-section-title">My role and the BYD Seagull</h2></div>
        <p class="pw-text">
          I played a major role in the 3D side of this project, particularly vehicle
          modeling and optimization. We usually received existing car models that
          needed optimization with proper textures, materials and animations for web
          delivery.
        </p>
        <p class="pw-text">
          For the BYD Seagull there was no existing model, so I recreated the entire
          car from scratch — one of my favorite pieces of work. I modeled everything:
          the exterior body, the interior cabin, the materials, and all the
          interactive animations.
        </p>
        <figure class="pw-img pw-img-single">
          <img src="assets/work/byd-dealership/image1.png" alt="BYD Seagull 3D modeling process" loading="lazy" />
          <figcaption>Exterior modeling: from reference blueprints to final topology.</figcaption>
        </figure>
        <p class="pw-text">
          The entire interior was modeled with attention to detail — seats,
          dashboard, steering wheel, door panels and trim — for an immersive feel
          when users explore the car from inside.
        </p>
        <figure class="pw-img pw-img-single">
          <img src="assets/work/byd-dealership/image2.png" alt="BYD Seagull final renders" loading="lazy" />
          <figcaption>Final renders — exterior and fully detailed interior.</figcaption>
        </figure>
      </section>

      <section class="pw-section">
        <div class="pw-section-head"><h2 class="pw-section-title">Philippines Dealership</h2></div>
        <p class="pw-text">
          I was also the 3D lead for the Philippines dealership digital twin at
          Quezon Avenue — recreating the entire dealership architecture and showroom
          where the car models are showcased.
        </p>
        <figure class="pw-img pw-img-single"><img src="assets/work/byd-dealership/image3.png" alt="Philippines dealership 3D render" loading="lazy" /></figure>
        <figure class="pw-img pw-img-single"><img src="assets/work/byd-dealership/image4.png" alt="Philippines dealership web view" loading="lazy" /></figure>
      </section>
    </div>`,

  "pistons-store": () => `
    <div class="content-wide pw-page work-page">
      <img class="pw-logo" src="assets/work/pistons-store/logo.png" alt="Detroit Pistons" />

      <figure class="pw-img pw-img-single">
        <img src="assets/work/pistons-store/cover.png" alt="Pistons virtual store" loading="lazy" />
      </figure>

      <p class="pw-text">
        The Pistons Virtual Store is an interactive 3D web experience for Detroit
        Pistons official merchandise — jerseys, hoodies, headwear and gifts across
        three immersive environments. I was 3D lead and handled most of the UX
        decisions, building all three environments (and many interactive assets)
        optimized for real-time web rendering.
      </p>

      <div class="pw-video">
        <iframe src="https://www.youtube.com/embed/XhoeLlXyoLE" title="Pistons virtual store" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
      </div>

      <section class="pw-section">
        <div class="pw-section-head"><h2 class="pw-section-title">The Virtual Store</h2></div>
        <p class="pw-text">
          The main showroom organizes products by category — jerseys on mannequins,
          headwear on shelving, gifts arranged throughout. Lighting was key to the
          atmosphere: carefully baked lightmaps bring out the displays and make the
          space feel inviting.
        </p>
        <div class="pw-images pw-images-2">
          <figure class="pw-img"><img src="assets/work/pistons-store/render1.png" alt="Showroom without baked lighting" loading="lazy" /><figcaption>Without baked lighting.</figcaption></figure>
          <figure class="pw-img"><img src="assets/work/pistons-store/render2.png" alt="Showroom with baked lighting" loading="lazy" /><figcaption>With baked lightmaps.</figcaption></figure>
        </div>
      </section>

      <section class="pw-section">
        <div class="pw-section-head"><h2 class="pw-section-title">The Court</h2></div>
        <p class="pw-text">
          The basketball court is a full arena with an animated crowd. I used a
          lightweight technique where the crowd is rendered as flat planes with
          atlas textures that swap between animation frames — the illusion of a
          cheering 3D audience while keeping web performance optimized.
        </p>
        <figure class="pw-img pw-img-single"><img src="assets/work/pistons-store/court3.png" alt="Pistons basketball court" loading="lazy" /></figure>
      </section>

      <section class="pw-section">
        <div class="pw-section-head"><h2 class="pw-section-title">The Locker Room</h2></div>
        <p class="pw-text">
          The locker room was designed as a virtual event space where Pistons
          players could appear on screen during scheduled meet-and-greets — so it's
          more spacious than a typical locker room. It showcases the team's
          championship legacy with banners, player lockers and an immersive
          atmosphere.
        </p>
        <figure class="pw-img pw-img-single"><img src="assets/work/pistons-store/locker2.png" alt="Pistons locker room" loading="lazy" /></figure>
      </section>
    </div>`,

  "chevrolet-montana": () => `
    <div class="content-wide pw-page work-page">
      <img class="pw-logo" src="assets/work/chevrolet-montana/logo.png" alt="Chevrolet" />

      <figure class="pw-img pw-img-single">
        <img src="assets/work/chevrolet-montana/cover.png" alt="Chevrolet Montana lineup" loading="lazy" />
      </figure>

      <p class="pw-text">
        The Chevrolet Montana 2023 launched with a major marketing campaign,
        including a feature on the Big Brother Brasil reality show. I developed the
        3D model for AR visualization as part of the campaign — one of several
        automotive projects I worked on at More Than Real.
      </p>

      <section class="pw-section">
        <div class="pw-section-head"><h2 class="pw-section-title">3D Development</h2></div>
        <p class="pw-text">
          The model was optimized for real-time rendering — polycount reduction,
          baked AO maps, texture atlases, and rigged animations for the truck-bed
          mechanisms that show off the versatile tailgate configurations.
        </p>
        <figure class="pw-img pw-img-single">
          <img src="assets/work/chevrolet-montana/image1.png" alt="Chevrolet Montana 3D model in Blender" loading="lazy" />
          <figcaption>Animated truck bed with tailgate and accessory configurations.</figcaption>
        </figure>
      </section>

      <section class="pw-section">
        <div class="pw-section-head"><h2 class="pw-section-title">AR Visualization</h2></div>
        <p class="pw-text">
          The final model was deployed to WebAR, letting customers place the vehicle
          in their own environment at real scale using just their smartphone.
        </p>
        <figure class="pw-img pw-img-single">
          <img src="assets/work/chevrolet-montana/image2.png" alt="Chevrolet Montana in AR" loading="lazy" />
          <figcaption>AR visualization on a smartphone.</figcaption>
        </figure>
      </section>
    </div>`,

  "dolce-gusto": () => `
    <div class="content-wide pw-page work-page">
      <img class="pw-logo" src="assets/work/dolce-gusto/logo.png" alt="Nescafé Dolce Gusto" />

      <figure class="pw-img pw-img-single">
        <img src="assets/work/dolce-gusto/cover.png" alt="Dolce Gusto coffee machines" loading="lazy" />
      </figure>

      <p class="pw-text">
        This project involved creating 3D models of Nescafé Dolce Gusto coffee
        machines for use in WebXR sales and marketing experiences — interactive AR
        models that let customers explore the products in their own space before
        buying.
      </p>

      <p class="pw-text">
        Since Nescafé had no original 3D files for these machines, I recreated them
        from scratch using only photos and technical specs. Surface modeling was
        done in Autodesk Fusion 360, then brought into Blender for UV unwrapping,
        materials and rendering.
      </p>

      <figure class="pw-img pw-img-single">
        <img src="assets/work/dolce-gusto/dolcegusto1.png" alt="Dolce Gusto 3D modeling process" loading="lazy" />
        <figcaption>Surface modeling stages, from reference to final mesh.</figcaption>
      </figure>

      <p class="pw-text">
        Blender also let me create material variants for the different product
        colors — essential for AR, where users switch between options in real time.
      </p>
    </div>`,

  // ===== 3D Printing (Baltha Maker) =====
  "falcon-mouse": () => `
    <div class="content-wide pw-page maker-page">
      <img class="pw-logo" src="assets/maker/falcon-mouse/logo.png" alt="Star Wars" />

      <p class="pw-intro">
        As a fan of the Star Wars series, I made this 3D-printed wireless mouse of
        the Millennium Falcon back in 2017. After I posted it on Instagram it
        reached over 150k people, and many wanted to build their own — so I
        designed an upgraded version with higher detail and an easier, solder-free
        assembly.
      </p>

      <figure class="pw-img pw-img-single">
        <img src="assets/maker/falcon-mouse/cover.png" alt="Millennium Falcon 3D-printed mouse" loading="lazy" />
      </figure>

      <div class="pw-video">
        <iframe src="https://www.youtube.com/embed/zsmf0Fp8Sbo" title="Millennium Falcon Mouse" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
      </div>

      <section class="pw-section">
        <div class="pw-section-head">
          <h2 class="pw-section-title">3D Modeling</h2>
        </div>
        <p class="pw-text">
          The first step was to pick a cheap wireless mouse from AliExpress and
          reverse-engineer its electronics in Autodesk Fusion 360. Then I modeled
          the Falcon from reference images, making sure the internal electronics
          would fit neatly inside the hull.
        </p>
        <div class="pw-row" style="max-width:760px">
          <figure class="pw-img" style="flex: 1.864 1 0"><img src="assets/maker/falcon-mouse/mouse1.png" alt="3D model of the Millennium Falcon mouse" loading="lazy" /><figcaption>The Falcon modeled around the mouse internals.</figcaption></figure>
          <figure class="pw-img" style="flex: 0.832 1 0"><img src="assets/maker/falcon-mouse/mouse2.png" alt="Internal electronics layout" loading="lazy" /><figcaption>Electronics packed inside.</figcaption></figure>
        </div>
      </section>

      <section class="pw-section">
        <div class="pw-section-head">
          <h2 class="pw-section-title">Build and assembly</h2>
          <a class="pw-btn" href="https://www.thingiverse.com/thing:6683242" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>Get the files</span>
          </a>
        </div>
        <p class="pw-text">
          The design has a screw lid on top for the USB plug, a blue LED in the
          rear to simulate light speed, and a side button to toggle the LED. After
          printing, assembly is straightforward with no soldering required —
          which makes it a great project for hobbyists, kids learning robotics, or
          professional makers.
        </p>
        <figure class="pw-img pw-img-single">
          <img src="assets/maker/falcon-mouse/mouse3.png" alt="Assembly process and the final mouse with its LED" loading="lazy" />
          <figcaption>Printed parts, assembly, and the final result with its blue LED glow.</figcaption>
        </figure>
      </section>
    </div>`,

  "florianopolis-museum": () => `
    <div class="content-wide pw-page maker-page">
      <img class="pw-logo" src="assets/maker/florianopolis-museum/logo.png" alt="SESC" />

      <p class="pw-intro">
        A 1:41 scale model of the SESC Florianópolis Museum — the historic
        Victor Meirelles building — now on display in the museum's entrance
        hall. It let me bring together architecture, design engineering, technical
        CAD and, for the first time, NURBS modeling, which I've used ever since.
      </p>

      <figure class="pw-img pw-img-single">
        <img src="assets/maker/florianopolis-museum/cover.png" alt="Florianópolis Museum — Victor Meirelles building" loading="lazy" />
      </figure>

      <section class="pw-section">
        <div class="pw-section-head">
          <h2 class="pw-section-title">3D Modeling</h2>
        </div>
        <p class="pw-text">
          From archives, floor plans and facade drawings, I built the 3D model of
          the building in Autodesk Fusion 360 — technical CAD modeling for the
          structure and NURBS for the fine ornamental details to be reproduced in
          the print.
        </p>
        <figure class="pw-img pw-img-single">
          <img src="assets/maker/florianopolis-museum/image1.png" alt="3D model details of the Florianópolis Museum" loading="lazy" />
          <figcaption>Ornamental elements modeled with NURBS in Fusion 360.</figcaption>
        </figure>
      </section>

      <section class="pw-section">
        <div class="pw-section-head">
          <h2 class="pw-section-title">3D printing and finishing</h2>
        </div>
        <p class="pw-text">
          For printing, the model was split into many parts and printed in different
          colors to minimize painting. The parts were joined by vacuum fitting and
          gluing, and the whole surface was sealed with a final layer of epoxy resin
          for protection and preservation.
        </p>
        <figure class="pw-img pw-img-single">
          <img src="assets/maker/florianopolis-museum/image2.png" alt="3D printing process and individual parts" loading="lazy" />
          <figcaption>Multi-color printed parts — railings, shutters and ornaments.</figcaption>
        </figure>
        <p class="pw-text">
          The finished model is hollow and weighs around 20&nbsp;kg. It sits in the
          entrance hall of the museum, catching the eye of everyone who visits.
        </p>
        <figure class="pw-img pw-img-single">
          <img src="assets/maker/florianopolis-museum/image3.jpg" alt="Final 3D-printed model on display in the museum" loading="lazy" />
          <figcaption>The finished 1:41 scale model in the museum's entrance hall.</figcaption>
        </figure>
      </section>
    </div>`,

  "mesc-museum": () => `
    <div class="content-wide pw-page maker-page">
      <img class="pw-logo" src="assets/maker/mesc-museum/logo.png" alt="MESC" />

      <p class="pw-intro">
        After the Florianópolis Museum model, the Museu da Escola Catarinense
        (MESC) — a nearby institution downtown — asked me for a similar
        piece. It's a beautiful early-20th-century neoclassical building with
        imposing columns and a distinctive curved skylight roof.
      </p>

      <figure class="pw-img pw-img-single">
        <img src="assets/maker/mesc-museum/cover.png" alt="Museu da Escola Catarinense — MESC" loading="lazy" />
      </figure>

      <section class="pw-section">
        <div class="pw-section-head">
          <h2 class="pw-section-title">3D Modeling</h2>
        </div>
        <p class="pw-text">
          The experience from the SESC project made this one much smoother. I
          followed the same workflow: architectural floor plans and facade
          references to build an accurate model in Autodesk Fusion 360, with NURBS
          surfaces for the columns, cornices and other ornamental detail.
        </p>
        <figure class="pw-img pw-img-single">
          <img src="assets/maker/mesc-museum/mesc1.png" alt="3D CAD model of the MESC Museum" loading="lazy" />
          <figcaption>The complete model rendered in Autodesk Fusion 360.</figcaption>
        </figure>
      </section>

      <section class="pw-section">
        <div class="pw-section-head">
          <h2 class="pw-section-title">Production and finishing</h2>
        </div>
        <p class="pw-text">
          The model was printed in multiple parts with the same multi-color
          approach. The curved skylight was especially interesting to produce,
          taking careful print orientation and supports. After vacuum fitting and
          gluing, the surface was coated in epoxy resin for durability and a premium
          finish.
        </p>
        <figure class="pw-img pw-img-single">
          <img src="assets/maker/mesc-museum/mesc2.png" alt="3D-printed MESC model during assembly" loading="lazy" />
          <figcaption>The assembled scale model before final finishing.</figcaption>
        </figure>
        <figure class="pw-img pw-img-single">
          <img src="assets/maker/mesc-museum/mesc3.png" alt="Finished MESC Museum scale model" loading="lazy" />
          <figcaption>The completed model ready for display (I know it looks AI-generated with this sun beam — it's not).</figcaption>
        </figure>
      </section>
    </div>`,

  petwheels: () => `
    <div class="content-wide pw-page">
      <img class="pw-logo" src="assets/petwheels-logo.png" alt="Petwheels" />

      <p class="pw-intro">
        Petwheels is a 3D-printed wheelchair for dogs with motor disabilities,
        designed as a parametric model that adapts to each dog from a few
        measurements before it's printed, instead of being hand-built one at a time.
        It was my final project in Product Design at UFSC, and was later patented,
        reached the national media, and turned into a real online service.
      </p>

      <!-- Cover: still + looping video (muted, no controls), side by side at
           matched height (figures carry their own aspect ratio). -->
      <div class="pw-cover">
        <figure class="pw-cover-still"><img src="assets/petwheels/cover1.png" alt="Petwheels render of the wheelchair" loading="lazy" /></figure>
        <figure class="pw-cover-vid"><video src="assets/petwheels/cover2.mp4" autoplay loop muted playsinline preload="auto"></video></figure>
      </div>

      <!-- ===== Business Model ===== -->
      <section class="pw-section">
        <div class="pw-section-head">
          <h2 class="pw-section-title">Business Model</h2>
        </div>
        <p class="pw-text">
          The business model rests on digital fabrication: every chair is
          parametrically fit to a dog's measurements and printed on demand,
          anywhere, by anyone with a 3D printer, instead of being hand-built one
          by one. Try the live customiser below: change the measurements and the
          chair re-fits in real time.
        </p>
        <!-- Interactive 3D customizer (isolated in its own document) -->
        <div class="pw-frame">
          <iframe src="petwheels/index.html?v=7" title="Petwheels 3D customizer" loading="lazy"></iframe>
        </div>
      </section>

      <!-- ===== Patent ===== -->
      <section class="pw-section">
        <div class="pw-section-head">
          <h2 class="pw-section-title">Patent</h2>
          <a class="pw-btn" href="assets/petwheels/patent.pdf" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span>View patent</span>
          </a>
        </div>
        <p class="pw-text">
          Registered as Brazilian utility model <strong>BR&nbsp;20&nbsp;2022&nbsp;002397-8</strong>
          (filed 2022, published 2023) by UFSC, with Artur Donadel Balthazar and Regiane
          Trevisan Pupo as inventors. Its core contribution is the chair's
          <strong>flexible lateral bars</strong>: existing wheelchairs use rigid aluminium
          or PVC side bars that force the dog to walk in a straight line and, on
          front-wheeled designs, require swivel casters. Petwheels replaces them with thin,
          flexible printed bars that bend only left and right, letting the dog rotate its
          thorax naturally as it moves. Ordinary wheels can then take the place of casters,
          and the animal gains real freedom of movement.
        </p>
        <p class="pw-text">
          Digital fabrication and 3D printing make the complex geometry affordable and let
          the chair be fitted to each dog's measurements at the design stage, removing most
          of the manual height, length and width adjustments that older designs depend on.
        </p>
        <div class="pw-images pw-images-2">
          <figure class="pw-img">
            <img src="assets/petwheels/patent-fig5.jpg" alt="Patent figure 5: front isometric view" loading="lazy" />
            <figcaption>Figure 5: front isometric view</figcaption>
          </figure>
          <figure class="pw-img">
            <img src="assets/petwheels/patent-fig3.jpg" alt="Patent figure 3: top view in the flexed position" loading="lazy" />
            <figcaption>Figure 3: top view, flexed (the side bars bending left and right)</figcaption>
          </figure>
        </div>
      </section>

      <!-- ===== Media ===== -->
      <section class="pw-section">
        <div class="pw-section-head">
          <h2 class="pw-section-title">In the news</h2>
        </div>
        <p class="pw-text">
          After SINOVA (UFSC's innovation agency) published the patent, the project
          drew the attention of the Brazilian national media. Several news outlets,
          including Brazil's largest media group, G1 (Globo), ran articles about
          Petwheels, and I gave television
          and press interviews about how digital fabrication can make custom canine
          mobility affordable and accessible.
        </p>

        <!-- News pile: cards are "thrown" onto the table from 8 (first, sits at
             the back) to 1 (last, lands on top). Animation starts when scrolled
             into view (see setupPetwheelsNews). -->
        <div class="pw-news" id="pwNews" aria-label="Press coverage of Petwheels">
          <div class="pw-news-stage">
          ${[
            // Rotations are deliberately NOT monotonic with x (some cards tilt
            // "the wrong way") so the pile reads as a chaotic scatter, not a neat
            // symmetric arc. y varies irregularly too. `w` overrides card width.
            { n: 1, x: -14, y: 88, rot: -5, w: 300 },
            { n: 2, x: -162, y: -34, rot: 6, w: 296 },
            { n: 3, x: 122, y: -14, rot: -9, w: 312 },
            { n: 4, x: -318, y: 30, rot: -16 },
            { n: 5, x: 256, y: -6, rot: 7 },
            { n: 6, x: -410, y: -62, rot: -11 }, // far-left, lifted above news-4
            { n: 7, x: 372, y: 32, rot: 15 },
            { n: 8, x: 36, y: -48, rot: 11 },
          ]
            .map(
              (c) =>
                `<img class="pw-news-card" src="assets/petwheels/news-${c.n}.png"
                  alt="Press coverage of Petwheels (${c.n})" loading="lazy"
                  style="--x:${c.x}px;--y:${c.y}px;--rot:${c.rot}deg;width:${
                  c.w || 260
                }px;z-index:${(9 - c.n) * 10};--delay:${(
                  (8 - c.n) *
                  0.071
                ).toFixed(2)}s" />`
            )
            .join("")}
          </div>
        </div>
      </section>

      <!-- ===== Research & Development ===== -->
      <section class="pw-section">
        <div class="pw-group">
          <span class="pw-group-label">Research &amp; Development</span>
        </div>

        <!-- Problem -->
        <h3 class="pw-subtitle">Problem</h3>
        <p class="pw-text">
          Building a wheelchair for a dog with motor disabilities is full of
          challenges, from the cost of materials to the final fitting, because
          every animal has its own anatomy and temperament: small or large, thin
          or heavy, calm or anxious, amputated or paralysed, with or without a
          need for physiotherapy. Beyond the technical difficulty there is a
          cultural one: an animal's needs are often overlooked, with euthanasia,
          abandonment and neglect chosen over looking for a solution, and little
          scientific investment goes into developing real alternatives. The mind
          map below lays out the main variables involved and highlights the
          bottlenecks the project set out to address.
        </p>
        <figure class="pw-img pw-img-single">
          <img src="assets/petwheels/mental-map.png" alt="Mind map of the variables and bottlenecks around a wheelchair for dogs with motor disabilities" loading="lazy" />
          <figcaption>Mind map of the variables and bottlenecks around a dog wheelchair.</figcaption>
        </figure>

        <!-- Diachronic analysis -->
        <h3 class="pw-subtitle">Diachronic analysis</h3>
        <p class="pw-text">
          The first widely known mobility solution for animals was invented in
          1961 in the United States by Dr.&nbsp;Lincoln Parkes, a veterinarian,
          surgeon and World&nbsp;War&nbsp;II veteran. He founded K9&nbsp;Carts that
          same year and patented the design in 1967, with no real competition for
          its first decade. For a long time the product changed little from that
          original rigid, aluminium-framed design.
        </p>
        <div class="pw-timeline">
          <div class="pw-tl">
            <div class="pw-tl-year">1961 · 1967</div>
            <div class="pw-tl-title">The first dog wheelchair</div>
            <p class="pw-tl-text">Dr.&nbsp;Lincoln Parkes invents the first dog wheelchair and founds K9&nbsp;Carts, shipping rigid aluminium chairs across the US and refining the original model.</p>
            <div class="pw-tl-figs">
              <figure class="pw-img"><img src="assets/petwheels/dia-parkes-patent.png" alt="Lincoln Parkes's 1967 patent drawing of the first dog wheelchair" loading="lazy" /><figcaption>The 1967 patent (US3406661).</figcaption></figure>
              <figure class="pw-img"><img src="assets/petwheels/dia-k9carts.png" alt="Vintage photographs of early K9 Carts wheelchairs in use" loading="lazy" /><figcaption>Early K9 Carts in use.</figcaption></figure>
            </div>
          </div>
          <div class="pw-tl">
            <div class="pw-tl-year">2008</div>
            <div class="pw-tl-title">The first truly adjustable chair</div>
            <p class="pw-tl-text">Mark Robinson patents what he considers the first genuinely adjustable wheelchair and sells it as <em>Walkin' Wheels</em>.</p>
            <div class="pw-tl-figs">
              <figure class="pw-img"><img src="assets/petwheels/dia-walkin.jpg" alt="A boxer in a blue Walkin' Wheels adjustable wheelchair" loading="lazy" /><figcaption>Robinson's <em>Walkin' Wheels</em>.</figcaption></figure>
            </div>
          </div>
          <div class="pw-tl">
            <div class="pw-tl-year">2000s</div>
            <div class="pw-tl-title">The internet &amp; the DIY wave</div>
            <p class="pw-tl-text">As information sharing spread, low-cost and DIY builds let owners assemble chairs for their own animals from shared projects and simple materials.</p>
            <div class="pw-tl-figs">
              <figure class="pw-img"><img src="assets/petwheels/dia-diy.png" alt="Several home-made PVC-pipe dog wheelchairs" loading="lazy" /><figcaption>Shared PVC-pipe DIY builds.</figcaption></figure>
            </div>
          </div>
          <div class="pw-tl">
            <div class="pw-tl-year">2009</div>
            <div class="pw-tl-title">3D printing arrives</div>
            <p class="pw-tl-text">Affordable 3D printing and digital design accelerate orthopaedic research in human and veterinary medicine, chasing more practicality, better ergonomics and lower cost.</p>
            <div class="pw-tl-figs">
              <figure class="pw-img"><img src="assets/petwheels/dia-3dprint.jpg" alt="A small dog in a 3D-printed front-leg wheelchair shared on Instructables" loading="lazy" /><figcaption>An open-source, 3D-printable build.</figcaption></figure>
            </div>
          </div>
          <div class="pw-tl">
            <div class="pw-tl-year">2018</div>
            <div class="pw-tl-title">Digital-native models</div>
            <p class="pw-tl-text">New business models appear, like the Czech startup AnyoneGo, alongside a surge of open-source, 3D-printable projects shared on platforms such as Instructables and Thingiverse.</p>
            <div class="pw-tl-figs">
              <figure class="pw-img"><img src="assets/petwheels/dia-anyonego.jpg" alt="A dachshund in a green AnyoneGo 3D-printed wheelchair" loading="lazy" /><figcaption>AnyoneGo's 2018 model.</figcaption></figure>
            </div>
          </div>
        </div>

        <!-- Market analysis (synchronic) -->
        <h3 class="pw-subtitle">Market analysis</h3>
        <p class="pw-text">
          A synchronic look at today's makers, both established manufacturers and a
          growing DIY community, shows they still wrestle with the same core
          challenge: every chair has to be customised and adapted to an individual
          animal. Most rely on rigid aluminium or 3D-printed frames adjusted by
          screws, rarely use standardised wheels, and span a wide price range.
        </p>
        <div class="pw-mkt">
          <div class="pw-mkt-card">
            <p class="pw-mkt-name">K9 Carts</p>
            <p class="pw-mkt-loc">Florida, USA · since 1961</p>
            <div class="pw-mkt-meta"><span>$269-$1,794</span><span>Adjustable aluminium</span><span>Rear / four / front / kits</span></div>
            <p class="pw-mkt-note">The original maker, selling rear-, front- and four-paw chairs plus retrofit kits. Rigid, adjustable aluminium frames with rubber-lined leg rings and soft fabric supports, but, tellingly, no standardised wheels across its range.</p>
            <div class="pw-mkt-figs">
              <figure class="pw-img"><img src="assets/petwheels/mkt-k9carts-1.png" alt="K9 Carts rear-paw wheelchair" loading="lazy" /></figure>
              <figure class="pw-img"><img src="assets/petwheels/mkt-k9carts-2.png" alt="K9 Carts four-paw wheelchair on a corgi" loading="lazy" /></figure>
              <figure class="pw-img"><img src="assets/petwheels/mkt-k9carts-3.png" alt="K9 Carts adjustable aluminium frame" loading="lazy" /></figure>
            </div>
          </div>
          <div class="pw-mkt-card">
            <p class="pw-mkt-name">VetCar</p>
            <p class="pw-mkt-loc">Botucatu, Brazil · since 1998</p>
            <div class="pw-mkt-meta"><span>Price on request</span><span>Thin tubular aluminium</span><span>Lighter &amp; smaller</span></div>
            <p class="pw-mkt-note">A patented design similar to K9 Carts but lighter and more compact. No online purchase or pricing; buyers fill in a technical sheet (measurements, age, build, nature of the disability) for a quote. Wheels are non-standard, likely salvaged or donated.</p>
            <div class="pw-mkt-figs">
              <figure class="pw-img"><img src="assets/petwheels/mkt-vetcar-1.png" alt="VetCar four-paw wheelchair" loading="lazy" /></figure>
              <figure class="pw-img"><img src="assets/petwheels/mkt-vetcar-2.png" alt="VetCar rear-paw wheelchair" loading="lazy" /></figure>
              <figure class="pw-img"><img src="assets/petwheels/mkt-vetcar-3.png" alt="VetCar harness with owner handle" loading="lazy" /></figure>
            </div>
          </div>
          <div class="pw-mkt-card">
            <p class="pw-mkt-name">Pineal</p>
            <p class="pw-mkt-loc">São José dos Pinhais, Brazil · ~3 years</p>
            <div class="pw-mkt-meta"><span>R$954-R$2,252</span><span>3D-printed, screw-adjusted</span><span>Custom colour &amp; geometry</span></div>
            <p class="pw-mkt-note">Human and veterinary solutions built with 3D modelling and printing. Robust models that stand out for geometric personalisation and a wide colour range, adjusted by screws; premium and clearly digital-first.</p>
            <div class="pw-mkt-figs">
              <figure class="pw-img"><img src="assets/petwheels/mkt-pineal-1.png" alt="Pineal 3D-printed wheelchair in blue and red" loading="lazy" /></figure>
              <figure class="pw-img"><img src="assets/petwheels/mkt-pineal-2.png" alt="Pineal 3D-printed walker in red" loading="lazy" /></figure>
              <figure class="pw-img"><img src="assets/petwheels/mkt-pineal-3.png" alt="Pineal 3D-printed wheelchair in pink" loading="lazy" /></figure>
            </div>
          </div>
          <div class="pw-mkt-card">
            <p class="pw-mkt-name">DIY models</p>
            <p class="pw-mkt-loc">Worldwide · open-source</p>
            <div class="pw-mkt-meta"><span>Lowest cost</span><span>PVC &amp; salvaged parts</span><span>Shared online</span></div>
            <p class="pw-mkt-note">A style of its own: owners who can't afford specialist care build chairs from PVC pipe, second-hand wheels and adapted collars, often from open-source files (Thingiverse); accessible, but rarely ergonomic.</p>
            <div class="pw-mkt-figs">
              <figure class="pw-img"><img src="assets/petwheels/mkt-diy-1.png" alt="Home-made PVC-pipe dog wheelchair" loading="lazy" /></figure>
              <figure class="pw-img"><img src="assets/petwheels/mkt-diy-2.png" alt="Open-source 3D-printed DIY dog wheelchair" loading="lazy" /></figure>
            </div>
          </div>
        </div>

        <!-- User research -->
        <h3 class="pw-subtitle">User research</h3>
        <p class="pw-text">
          The primary user is the dog, which can't answer questionnaires, so
          insight was gathered qualitatively through recorded interviews with
          veterinarians, manufacturers and owners (the full transcripts are in the
          report's appendix). Across every group the same order of priorities
          emerged: <strong>functionality</strong> first, then aesthetics,
          practicality, cost and durability. Three distinct audiences stood out,
          each with its own pains and demands.
        </p>
        <table class="pw-aud">
          <thead>
            <tr><th>&nbsp;</th><th>Individual owners</th><th>NGOs &amp; volunteers</th><th>Veterinarians</th></tr>
          </thead>
          <tbody>
            <tr><th>Demand</th><td>High, usually milder, reversible cases.</td><td>Very high, mostly severe, irreversible cases.</td><td>High, generally milder, reversible cases.</td></tr>
            <tr><th>Cost</th><td>High, but viable in most cases.</td><td>Very high and often unviable without donations.</td><td>High; buying materials eats into the service margin.</td></tr>
            <tr><th>Where they buy</th><td>Internet, local makers or vets.</td><td>Internet, local makers or vets.</td><td>Local makers or in-house production.</td></tr>
            <tr><th>Duration of use</th><td>Often short, a month to a year, until recovery (or lifelong for geriatric cases).</td><td>Usually lifelong; amputation or permanent paralysis.</td><td>While the client keeps up veterinary follow-up, usually under a year.</td></tr>
          </tbody>
        </table>
        <p class="pw-text">
          Individual owners tend to have the means and the will to pay, since it's
          one animal, and a family member. NGOs and volunteers run a continuous
          task force where those costs simply don't scale, and lean on donations.
          Veterinarians sit in between, treating the animal and bridging the
          product to the end client. Three personas put faces to those audiences.
        </p>
        <div class="pw-personas">
          <div class="pw-persona">
            <span class="pw-persona-pub">Individual owner</span>
            <div class="pw-persona-head">
              <img class="pw-persona-av" src="assets/petwheels/persona-simone.jpg" alt="Simone" loading="lazy" />
              <div><p class="pw-persona-name">Simone, 41</p><p class="pw-persona-role">Criminal lawyer</p></div>
            </div>
            <p>Early in the pandemic her Dachshund, Bala, lost movement in his hind legs, almost certainly IVDD. With clinics closed she bought a chair online that didn't fit and that she disliked, then found a specialist maker. After repeated trips to measure and adjust, Bala runs around again, but Simone wished the whole process were simpler, with far less back-and-forth.</p>
          </div>
          <div class="pw-persona">
            <span class="pw-persona-pub">NGO / volunteer</span>
            <div class="pw-persona-head">
              <img class="pw-persona-av" src="assets/petwheels/persona-natasha.jpg" alt="Natasha" loading="lazy" />
              <div><p class="pw-persona-name">Natasha, 29</p><p class="pw-persona-role">Veterinary student</p></div>
            </div>
            <p>She lives with 13 dogs and 8 cats rescued from the street. Three have permanent hind-leg paralysis and one was born without front limbs: four dogs who need wheelchairs, but she has only two donated PVC chairs. She knows ill-fitting chairs cause pain, so she's crowdfunding on social media to build proper, made-to-measure ones.</p>
          </div>
          <div class="pw-persona">
            <span class="pw-persona-pub">Veterinarian</span>
            <div class="pw-persona-head">
              <img class="pw-persona-av" src="assets/petwheels/persona-jefferson.jpg" alt="Jefferson" loading="lazy" />
              <div><p class="pw-persona-name">Jefferson, 37</p><p class="pw-persona-role">Vet &amp; rehab specialist</p></div>
            </div>
            <p>His days are neurological and orthopaedic assessments, taking measurements and, often, building chairs, prostheses and orthoses. He's adamant that a chair should never be bought without a veterinary evaluation, since a bad one can worsen the animal, yet he badly misses a practical way to make genuinely adaptable, affordable chairs to recommend to clients and volunteer groups.</p>
          </div>
        </div>

        <!-- Environment analysis -->
        <h3 class="pw-subtitle">Environment analysis</h3>
        <p class="pw-text">
          The environment-and-use analysis watched the everyday tasks both the dog
          and the owner carry out with the chair, and pulled the recurring problems
          straight out of them.
        </p>

        <p class="pw-pill">Tasks performed by the dog</p>
        <div class="pw-taskgrid pw-taskgrid-3">
          <div class="pw-taskcard"><h5>Walk / run</h5><p>The most frequent task, on four paws for physiotherapy, or on two when the chair replaces the weakened limbs. Needs space and dry, fairly even ground; real physical effort.</p></div>
          <div class="pw-taskcard"><h5>Rest</h5><p>Brief, since the chair is meant to keep the dog moving. How it's built sets the resting positions: lying, sitting or with the head supported. No effort.</p></div>
          <div class="pw-taskcard"><h5>Eat / drink</h5><p>Brief and static: the dog lowers its head to the bowl, with effort in the jaw, usually on four paws, but also sitting or leaning.</p></div>
        </div>
        <div class="pw-taskgrid pw-taskgrid-2">
          <div class="pw-taskcard pw-taskcard-media">
            <div class="pw-taskcard-txt"><h5>Urinate</h5><p>Brief, usually outdoors and static; the posture differs between males and females, and the chair doesn't get in the way.</p></div>
            <figure class="pw-img"><img src="assets/petwheels/task-urinate-male.png" alt="A dog urinating while using a wheelchair" loading="lazy" /></figure>
          </div>
          <div class="pw-taskcard pw-taskcard-media">
            <div class="pw-taskcard-txt"><h5>Defecate</h5><p>Brief, outdoors and static; it needs enough clearance between the legs for the stool to pass. The owner cleans up afterwards.</p></div>
            <figure class="pw-img"><img src="assets/petwheels/task-defecate.png" alt="A dog defecating while using a wheelchair, with clearance between the legs" loading="lazy" /></figure>
          </div>
        </div>

        <p class="pw-pill">Tasks performed by the owner</p>
        <div class="pw-taskgrid pw-taskgrid-3">
          <div class="pw-taskcard"><h5>Put on / take off</h5><p>Brief: position the dog and secure it, usually with collars, fabric or Velcro. Harder with anxious or restless dogs.</p></div>
          <div class="pw-taskcard"><h5>Walk the dog</h5><p>Medium to long: the owner supervises while the dog walks or exercises, outdoors on dry, even ground.</p></div>
          <div class="pw-taskcard"><h5>Wash / clean</h5><p>Light cleaning wipes the wheels after each outing; heavy cleaning, every few weeks, may mean taking the chair apart: fabric in the machine, rigid parts scrubbed.</p></div>
        </div>

        <p class="pw-pill">Problems identified</p>
        <p class="pw-text">
          Watching dogs and owners use existing chairs in real conditions surfaced
          eight recurring problems, the core targets the design had to solve.
        </p>
        <ol class="pw-probs">
          <li class="pw-prob"><span class="pw-prob-n">1</span><div><p class="pw-prob-t">Loose fixation on bumps</p><p>Without proper fixation, hitting a bump at speed can knock the dog's hips out of position, even throwing it from the chair, or hurting it as it drops back in.</p></div></li>
          <li class="pw-prob"><span class="pw-prob-n">2</span><div><p class="pw-prob-t">Wheels set too wide</p><p>Wheels too far apart make collisions with obstacles much more likely.</p></div></li>
          <li class="pw-prob"><span class="pw-prob-n">3</span><div><p class="pw-prob-t">The "tripod" tip</p><p>Wheels too wide, or too close to the dog's front support, cause a tripod tip, so the dog topples to one side.</p></div></li>
          <li class="pw-prob"><span class="pw-prob-n">4</span><div><p class="pw-prob-t">The "seesaw" effect</p><p>Wheels too close to the front support split weight fore and aft of the axle, making the dog work harder to move.</p></div></li>
          <li class="pw-prob"><span class="pw-prob-n">5</span><div><p class="pw-prob-t">Over-stretched rear legs</p><p>Rear legs left too stretched destabilise the spine.</p></div></li>
          <li class="pw-prob"><span class="pw-prob-n">6</span><div><p class="pw-prob-t">Curving blocked by rigid bars</p><p>A dog naturally curves left and right around a fixed rear support, but most chairs' rigid lateral bars block that movement or strain the thorax.</p></div></li>
          <li class="pw-prob"><span class="pw-prob-n">7</span><div><p class="pw-prob-t">Swinging rear legs</p><p>A large gap between the fixation and grip points lets the rear legs swing and wobble, adding instability.</p></div></li>
          <li class="pw-prob"><span class="pw-prob-n">8</span><div><p class="pw-prob-t">Missing front limbs</p><p>In dogs missing the front limbs the spine is already deformed; if the chair doesn't correct it, the wheels end up leaning excessively.</p></div></li>
        </ol>

        <p class="pw-pill">Captured in use</p>
        <div class="pw-images pw-images-3">
          <figure class="pw-img"><img src="assets/petwheels/1.gif" alt="A rear-wheel chair crossing uneven ground" loading="lazy" /><figcaption>Crossing uneven ground.</figcaption></figure>
          <figure class="pw-img"><img src="assets/petwheels/2.gif" alt="The front of the chair lifting under load" loading="lazy" /><figcaption>The front lifting under load.</figcaption></figure>
          <figure class="pw-img"><img src="assets/petwheels/3.gif" alt="A dog turning and reaching down on grass" loading="lazy" /><figcaption>Turning and reaching down.</figcaption></figure>
          <figure class="pw-img"><img src="assets/petwheels/4.gif" alt="A dog working along a narrow, busy path" loading="lazy" /><figcaption>Working a narrow path.</figcaption></figure>
          <figure class="pw-img"><img src="assets/petwheels/5-1.png" alt="Top view of a dog's natural left-and-right curving" loading="lazy" /><figcaption>Top view: natural curving (problem 6).</figcaption></figure>
          <figure class="pw-img"><img src="assets/petwheels/5-2.png" alt="Side view showing the rear-leg support and grip geometry" loading="lazy" /><figcaption>Side view: rear-leg geometry (problems 5 and 7).</figcaption></figure>
        </div>

        <!-- Design requirements -->
        <h3 class="pw-subtitle">Design requirements</h3>
        <p class="pw-text">
          With everything gathered in the theory, market, environment and user
          research, the project requirements were defined and split into
          <strong>mandatory</strong> (without which the product loses its purpose)
          and <strong>desirable</strong>, each traced back to where it came from.
        </p>
        <div class="ddr-tables">
          <div class="ddr-table ddr-must">
            <div class="ddr-head"><span>Mandatory</span><span class="ddr-head-src">Source</span></div>
            <div class="ddr-row"><span class="ddr-req">Be light (10-15% of the dog's weight)</span><span class="ddr-src">User research</span></div>
            <div class="ddr-row"><span class="ddr-req">Be durable</span><span class="ddr-src">Research / Use</span></div>
            <div class="ddr-row"><span class="ddr-req">Be stable</span><span class="ddr-src">Research / Use</span></div>
            <div class="ddr-row"><span class="ddr-req">Custom measurements</span><span class="ddr-src">Theory / Research</span></div>
            <div class="ddr-row"><span class="ddr-req">Be adjustable</span><span class="ddr-src">Research / Market</span></div>
            <div class="ddr-row"><span class="ddr-req">Be comfortable</span><span class="ddr-src">Research / Use</span></div>
            <div class="ddr-row"><span class="ddr-req">Practical fixation</span><span class="ddr-src">Research / Use</span></div>
          </div>
          <div class="ddr-table ddr-nice">
            <div class="ddr-head"><span>Desirable</span><span class="ddr-head-src">Source</span></div>
            <div class="ddr-row"><span class="ddr-req">Low production cost</span><span class="ddr-src">Research / Market</span></div>
            <div class="ddr-row"><span class="ddr-req">Allow different colours</span><span class="ddr-src">Market analysis</span></div>
          </div>
        </div>

        <!-- Mood boards -->
        <h3 class="pw-subtitle">Mood boards</h3>
        <p class="pw-text">
          The boards are where the design takes shape. A lifestyle board pictures the
          target audience's life with the dog; from it, and everything gathered so
          far, three concepts pinned down the product's meaning, and a final
          board set the look the product itself should carry.
        </p>
        <p class="pw-pill">Lifestyle</p>
        <figure class="pw-img pw-img-single" style="max-width:520px">
          <img src="assets/petwheels/lifestyle.png" alt="Lifestyle mood board: dogs and their owners outdoors, at play and on the move" loading="lazy" />
          <figcaption>A portrait of the audience's everyday life with the dog.</figcaption>
        </figure>
        <p class="pw-pill">Concept</p>
        <div class="pw-concepts">
          <div class="pw-concept">
            <figure><img src="assets/petwheels/concept-freedom.png" alt="Freedom mood board: dogs running free, broken chains, open sky" loading="lazy" /></figure>
            <p class="pw-concept-name">Freedom</p>
            <p>The product's very purpose: to give back movement, to feel free again as it should.</p>
          </div>
          <div class="pw-concept">
            <figure><img src="assets/petwheels/concept-resilience.png" alt="Resilience mood board" loading="lazy" /></figure>
            <p class="pw-concept-name">Resilience</p>
            <p>A reality for the animal and a feeling for its people: to resist, to not give up, to overcome the obstacle.</p>
          </div>
          <div class="pw-concept">
            <figure><img src="assets/petwheels/concept-technology.png" alt="Technology mood board" loading="lazy" /></figure>
            <p class="pw-concept-name">Technology</p>
            <p>The means by which the product delivers that freedom and honours the fight against limitation.</p>
          </div>
        </div>
        <p class="pw-pill">Product expression</p>
        <p class="pw-text">
          The expression board pinned down the traits, lines and attitude the
          product should carry: robustness and controlled speed over fragility,
          drawing on working dogs and concept cars.
        </p>
        <div class="pw-row" style="max-width:680px">
          <figure class="pw-img" style="flex: 1.585 1 0"><img src="assets/petwheels/expression-dog.jpg" alt="A working police dog in a tactical harness" loading="lazy" /></figure>
          <figure class="pw-img" style="flex: 2 1 0"><img src="assets/petwheels/expression-car1.jpg" alt="A yellow sports car as a reference for robustness and speed" loading="lazy" /></figure>
        </div>

        <!-- Ideation -->
        <h3 class="pw-subtitle">Ideation</h3>
        <p class="pw-text">
          Because the form is so organic, sheets were printed with the dog seen
          from several angles, making it easier to sketch ideas straight over the
          animal rather than fighting the drawing.
        </p>
        <figure class="pw-img pw-img-single" style="max-width:360px">
          <div class="pw-ph">Printed dog templates used as a sketching base</div>
          <figcaption>Printed dog templates used as a sketching base.</figcaption>
        </figure>
        <div class="pw-row" style="max-width:720px">
          <figure class="pw-img" style="flex: 1.333 1 0"><div class="pw-ph">Concept sketch over a printed dog template</div></figure>
          <figure class="pw-img" style="flex: 0.75 1 0"><div class="pw-ph">Concept sketch</div></figure>
          <figure class="pw-img" style="flex: 0.75 1 0"><div class="pw-ph">Concept sketch</div></figure>
        </div>

        <!-- Creation -->
        <h3 class="pw-subtitle">Creation</h3>
        <p class="pw-text">
          The final product targets nearly every kind of motor limitation, most
          often the hind legs, but, as the customisations show, four-paw paralysis
          and front-limb cases too. It was named <strong>Pet Wheels</strong>, a nod
          to the miniature-car brand Hot Wheels.
        </p>
        <div class="pw-row" style="max-width:820px">
          <figure class="pw-img" style="flex: 1.937 1 0"><div class="pw-ph">Pet Wheels final product: side view</div></figure>
          <figure class="pw-img" style="flex: 1.936 1 0"><div class="pw-ph">Pet Wheels final product: front view</div></figure>
        </div>

        <p class="pw-pill">Morphometric parameters</p>
        <p class="pw-text">
          The first step was to adapt the 3D dog model (the "dummy") to a
          wheelchair-user posture: the femur and tibia set at 90° as vets
          recommend for relaxation, with a slight lateral gap between the thighs so
          they seat into the chair and the dog can still urinate and defecate.
          Knowing the measurements would be taken by third parties, vets or owners,
          five simple, easy-to-take parameters were chosen to drive the whole
          design.
        </p>
        <div class="pw-measures">
          <div class="pw-measure"><span class="pw-measure-n">1</span><span class="pw-measure-k">Length (fore-to-hind limb)</span><span class="pw-measure-v">450&nbsp;mm</span></div>
          <div class="pw-measure"><span class="pw-measure-n">2</span><span class="pw-measure-k">Shoulder height to ground</span><span class="pw-measure-v">435&nbsp;mm</span></div>
          <div class="pw-measure"><span class="pw-measure-n">3</span><span class="pw-measure-k">Pelvis width</span><span class="pw-measure-v">170&nbsp;mm</span></div>
          <div class="pw-measure"><span class="pw-measure-n">4</span><span class="pw-measure-k">Shoulder width</span><span class="pw-measure-v">265&nbsp;mm</span></div>
          <div class="pw-measure"><span class="pw-measure-n">5</span><span class="pw-measure-k">Thigh circumference</span><span class="pw-measure-v">360&nbsp;mm</span></div>
        </div>
        <figure class="pw-img pw-img-single" style="max-width:560px">
          <div class="pw-ph">The five morphometric measurements marked on the dog model</div>
          <figcaption>The five measurements that parametrise the whole chair.</figcaption>
        </figure>

        <p class="pw-pill">3D modelling</p>
        <p class="pw-text">
          From there, organic forms were explored around the thigh to create a
          geometrically modern part, deliberately breaking with PVC pipe and
          aluminium profiles. The final shape was built with T-Splines whose
          control points are positioned by functions of the parameters above and
          multiplication factors. The whole product is driven by such functions,
          so it adapts to each dog's measurements <em>before</em> fabrication, which
          is more predictable, less error-prone, cheaper and far quicker than the
          mostly handcrafted process it replaces.
        </p>
        <div class="pw-row" style="max-width:640px">
          <figure class="pw-img" style="flex: 1.03 1 0"><div class="pw-ph">Organic thigh-seat form developed over the dog mesh</div></figure>
          <figure class="pw-img" style="flex: 1.031 1 0"><div class="pw-ph">The final parametric thigh-seat part</div></figure>
        </div>
        <p class="pw-text">
          The wheels got the same treatment. The concept cars from the expression
          board were the reference, so the wheel reads as robust yet fluid and
          fast, not fragile with thin rims and hollow spokes.
        </p>
        <figure class="pw-img pw-img-single" style="max-width:300px">
          <div class="pw-ph">The final wheel design: robust, fluid spokes within a tyre</div>
          <figcaption>The wheel: robust and fluid, not fragile.</figcaption>
        </figure>

        <!-- Solutions -->
        <h3 class="pw-subtitle">Solutions</h3>
        <p class="pw-text">
          A series of structural decisions answer the problems found in the
          environment analysis directly.
        </p>
        <h4 class="pw-subhead">Rear-paw support near the grip point</h4>
        <p class="pw-text">
          The hind-paw support sits close to the grip point so the legs can't swing
          enough to destabilise the dog while it moves.
        </p>
        <div class="pw-row" style="max-width:620px">
          <figure class="pw-img" style="flex: 0.7 1 0"><div class="pw-ph">Rear-paw fixation near the grip point</div></figure>
          <figure class="pw-img" style="flex: 2.968 1 0"><div class="pw-ph">Three fabric-strap fixation points along the dog's back</div></figure>
        </div>
        <h4 class="pw-subhead">Three fabric-strap fixation points</h4>
        <p class="pw-text">
          To hold the dog securely and keep the spine properly aligned, fabric
          straps anchor at three points along the body, the second of which is
          optional.
        </p>
        <h4 class="pw-subhead">Flexible horizontal bars</h4>
        <p class="pw-text">
          The standout solution, and the heart of the patent, is the flexible
          horizontal bars. They bend in the XY plane to give the body real freedom
          of movement, while staying rigid vertically; wide gaps let the fabric
          straps follow the dog's thorax as it rotates.
        </p>
        <figure class="pw-img pw-img-single" style="max-width:440px">
          <div class="pw-ph">Top view of the chair flexing left and right with the dog's body</div>
          <figcaption>The bars flex with the dog's natural left-and-right curving.</figcaption>
        </figure>
        <h4 class="pw-subhead">Fine adjustment</h4>
        <p class="pw-text">
          Adapting the dog to the chair at the design stage removes the need for a
          heavily adjustable product, but a fine adjustment still matters, since
          taking measurements carries a margin of error. The tell is the spine: if
          it isn't horizontal, two adjustments compensate. Adjustment&nbsp;1 sets
          the wheel-arm angle across five positions (5° steps), and
          adjustment&nbsp;2 extends or retracts the arm across five positions
          (1&nbsp;cm steps).
        </p>
        <figure class="pw-img pw-img-single" style="max-width:420px">
          <div class="pw-ph">Diagram of the wheel-arm angle and extension adjustments</div>
          <figcaption>Angle (1) and extend/retract (2) fine adjustments.</figcaption>
        </figure>
        <h4 class="pw-subhead">Wheels inclined at 10°</h4>
        <p class="pw-text">
          The wheel axes are tilted 10°, giving the dog more stability on sloped
          ground and cutting the chance of a tip. The incline also helps the chair
          hold its position: the more it tends to pitch forward or back, the harder
          it is to move; in the extreme, fully tipped upright, the wheels point in
          different directions and the chair won't roll either way unless dragged.
        </p>
        <div class="pw-row" style="max-width:560px">
          <figure class="pw-img" style="flex: 1.034 1 0"><div class="pw-ph">Inclined wheels keeping the chair stable on a slope</div></figure>
          <figure class="pw-img" style="flex: 1.854 1 0"><div class="pw-ph">How the inclined wheels resist rolling fore and aft</div></figure>
        </div>

        <!-- Materials & fabrication -->
        <h3 class="pw-subtitle">Materials &amp; fabrication</h3>
        <p class="pw-text">
          Materials were chosen by weight, durability, ease of fabrication, cost
          and looks. Most parts are FDM 3D-printed, everything except the screws,
          nuts, bearings and fabrics, and every part is shaped so it can sit
          flat on the print bed.
        </p>
        <div class="pw-materials">
          <div class="pw-mat">
            <p class="pw-mat-name">PETg filament</p>
            <p class="pw-mat-use">Rigid parts</p>
            <p>Easy to print, with good mechanical and thermal resistance (the worst case being a hot, stuffy sunny day). A wide colour range lets the chair be personalised to the client's taste.</p>
          </div>
          <div class="pw-mat">
            <p class="pw-mat-name">TPU filament</p>
            <p class="pw-mat-use">Flexible parts</p>
            <p>The flexible filament, vital for the horizontal bars (thorax movement), the wheel covering (a quieter, longer-lasting "tyre") and the thigh rings. Colours are limited, so black is the default.</p>
          </div>
          <div class="pw-mat">
            <p class="pw-mat-name">Nylon webbing</p>
            <p class="pw-mat-use">Straps</p>
            <p>Used for the chest collar and the rear strap, with buckles and length adjusters.</p>
          </div>
          <div class="pw-mat">
            <p class="pw-mat-name">Perforated polyester</p>
            <p class="pw-mat-use">Chest-collar finish</p>
            <p>Durable, comfortable and good-looking, and it lets the covered area breathe.</p>
          </div>
          <div class="pw-mat">
            <p class="pw-mat-name">Galvanised steel</p>
            <p class="pw-mat-use">Fasteners</p>
            <p>Screws and nuts, the best value of the options, with good durability and mechanical strength at low cost.</p>
          </div>
        </div>

        <!-- Customization -->
        <h3 class="pw-subtitle">Customization</h3>
        <p class="pw-text">
          Because the design is parametric, it adapts beyond the common hind-leg
          case. A four-wheel version serves four-paw paralysis, and doubles as a
          physiotherapy aid, while a front variant handles front-limb disability,
          including congenital absence or amputation.
        </p>
        <figure class="pw-img pw-img-single">
          <div class="pw-ph">The four-wheel Pet Wheels variant for four-paw paralysis and physiotherapy</div>
          <figcaption>The four-wheel variant: for four-paw paralysis and physiotherapy.</figcaption>
        </figure>
      </section>
    </div>`,

  zenik: () => `
    <div class="content-wide pw-page zenik-page">
      <img class="pw-logo" src="assets/zenik/zenik-logo.png" alt="Zenik" />

      <p class="pw-intro">
        Zenik is a piece of convertible urban furniture created for the Square
        Lab, the coworking and creative-experimentation plaza of Centro Sapiens,
        an initiative turning the east side of downtown Florianópolis into a
        creative district. Developed as a low-complexity product-design project at
        UFSC, by a three-person team in partnership with Centro Sapiens, it
        answers the plaza's brief for furniture that is easy to move and
        transport, compatible with many different audiences and occasions, simple
        to use, and resistant and durable enough for an open public space. The
        result is a wood-and-steel structure that converts between two modes: an
        upright desk for focused work and a fully reclined lounge for resting or
        working in a laid-back way, living up to its motto, "Keep calm and work".
      </p>

      <!-- Cover: the two product modes side by side, matched in height.
           Each figure's flex-grow is its image aspect ratio (w/h), so the row
           gives them equal heights with widths set by their proportions. -->
      <div class="zenik-cover">
        <figure class="pw-img" style="flex: 1.52 1 0"><img src="assets/zenik/cover.png" alt="Zenik in its reclined lounge mode" loading="lazy" /><figcaption>Zenik reclined into its lounger mode.</figcaption></figure>
        <figure class="pw-img" style="flex: 1 1 0"><img src="assets/zenik/image1.png" alt="Zenik in its upright desk mode" loading="lazy" /><figcaption>Zenik upright in its desk mode.</figcaption></figure>
      </div>

      <!-- ===== Research & Development ===== -->
      <section class="pw-section">
        <div class="pw-group">
          <span class="pw-group-label">Research &amp; Development</span>
          <span class="pw-group-tag">Summarized</span>
        </div>

        <h3 class="pw-subtitle">Briefing</h3>
        <p class="pw-text">
          Centro Sapiens, an extension of Sapiens Parque, sets out to turn the
          eastern part of Florianópolis's historic centre into a Creative District
          through urban revitalisation and a stronger local creative economy. In
          meetings with its coordinator and the architects of the Square Lab (a
          coworking and creative-experimentation plaza that was about to open at the
          time), they briefed us on what the plaza's urban furniture needed to be:
          easy to move and transport, compatible with many different audiences and
          occasions, simple to use, and resistant and durable enough for an open
          public space.
        </p>
        <figure class="pw-img pw-img-single">
          <img src="assets/zenik/briefing.png" alt="Top view of the Square Lab plaza within the historic centre of Florianópolis" loading="lazy" />
          <figcaption>Top view of the plaza and the surrounding historic centre of Florianópolis.</figcaption>
        </figure>

        <h3 class="pw-subtitle">Market analysis</h3>
        <p class="pw-text">
          A synchronic analysis compared the two kinds of space the plaza draws
          from: public squares and parks, which are free, open-air and able to hold
          huge numbers of people but offer few services, and private coworking
          spaces, which are paid and small but fully equipped with internet,
          kitchens and meeting areas. The Square Lab sits between the two: a free,
          open-air plaza that still has to support focused work.
        </p>
        <p class="pw-text">
          A benchmarking of national furniture makers, covering both office
          furniture and pieces for rest and relaxation, mapped the recurring
          solutions and trends: wood-and-metal construction, mobility through
          casters or folding, and a clear split between indoor (office) and
          indoor/outdoor (leisure) products. No single product comfortably bridged
          work and rest in an open public setting, which is exactly the gap this
          project targets.
        </p>
        <p class="pw-text">
          Finally, a SWOT analysis positioned the Centro Sapiens plaza within that
          scenario:
        </p>
        <div class="swot-wrap">
        <div class="swot" role="img" aria-label="SWOT analysis of the Centro Sapiens plaza">
          <div class="swot-quad swot-s">
            <h4>Strengths</h4>
            <ul>
              <li>Central location</li>
              <li>Connection with UFSC</li>
              <li>Open space</li>
              <li>Low cost</li>
            </ul>
          </div>
          <div class="swot-quad swot-w">
            <h4>Weaknesses</h4>
            <ul>
              <li>Financial limits</li>
              <li>Open space</li>
              <li>Hard to control the public</li>
            </ul>
          </div>
          <div class="swot-quad swot-o">
            <h4>Opportunities</h4>
            <ul>
              <li>Social interest</li>
              <li>Cultural richness</li>
              <li>Emerging creative economy</li>
              <li>Urban revitalisation</li>
            </ul>
          </div>
          <div class="swot-quad swot-t">
            <h4>Threats</h4>
            <ul>
              <li>Creative economy not yet consolidated</li>
              <li>Public may not embrace the concept</li>
              <li>Unfavourable weather</li>
              <li>Lack of financial incentive</li>
            </ul>
          </div>
          <span class="swot-axis swot-axis-v" aria-hidden="true"></span>
          <span class="swot-axis swot-axis-h" aria-hidden="true"></span>
        </div>
        </div>

        <h3 class="pw-subtitle">Environment analysis</h3>
        <p class="pw-text">
          We studied two complementary environments. The first was the public
          space around the Square Lab, the plaza and streets of downtown
          Florianópolis, to learn who uses it and how. Two cases captured its
          range: <strong>Praça XV</strong>, a busy and socially mixed central
          square (elderly, students and workers alongside a vulnerable homeless
          population, in a delicate part of the city), and <strong>Avenida
          Hercílio Luz</strong>, a younger and more open counterpoint: an avenue
          with bars, quiet and fairly empty at its start, with stretches well
          exposed to the sun, and plenty of room to be enriched aesthetically,
          culturally and with information.
        </p>
        <div class="pw-images pw-images-2">
          <figure class="pw-img">
            <img src="assets/zenik/env-1.png" alt="Field photos of Praça XV: people gathered, a police-monitored area sign, a homeless person, and a plaza map" loading="lazy" />
            <figcaption>Praça XV, a busy, socially mixed and delicate central square.</figcaption>
          </figure>
          <figure class="pw-img">
            <img src="assets/zenik/env-2.png" alt="Field photos of Avenida Hercílio Luz: street benches, an empty paved path, bar seating and a pedestrian crossing" loading="lazy" />
            <figcaption>Avenida Hercílio Luz, a younger and more open avenue.</figcaption>
          </figure>
        </div>
        <p class="pw-text">
          The second was how established coworking spaces are organised. Using the
          Impact Hub as a reference, we mapped its building blocks: shared desks
          wired for power and internet, private offices and meeting rooms, a
          community kitchen, and informal relaxation areas. These pointed to which
          coworking functions a single piece of furniture could bring out into the
          open plaza.
        </p>
        <div class="pw-images pw-images-2">
          <figure class="pw-img">
            <img src="assets/zenik/env-3.png" alt="Impact Hub work areas: shared desks, a private office, a community kitchen and a networking wall" loading="lazy" />
            <figcaption>Impact Hub: shared desks, private offices and networking.</figcaption>
          </figure>
          <figure class="pw-img">
            <img src="assets/zenik/env-4.png" alt="Impact Hub relaxation areas: swings, floor mattresses, a shared library and a meditation corner" loading="lazy" />
            <figcaption>Impact Hub: informal relaxation and social spaces.</figcaption>
          </figure>
        </div>

        <h3 class="pw-subtitle">User research</h3>
        <p class="pw-text">
          Because the Square Lab is a public plaza, three potential user groups
          were surveyed: <strong>coworkers</strong> (34 responses, from CoCreation
          Lab, S7 and Impact Hub), <strong>students</strong> (17, mostly
          university and junior-enterprise members) and the
          <strong>elderly</strong> (8, in public squares). Open-ended answers
          about what they liked and disliked in their work, study or plaza
          environments were distilled into keywords, and respondents also rated
          their interest across a range of themes.
        </p>

        <div class="aud-wrap">
          <!-- Who they are -->
          <div class="aud-card">
          <p class="aud-cap">Who they are: gender split and average age</p>
          <div class="aud-demo">
            <div class="aud-group">
              <h4>Coworkers</h4>
              <div class="aud-row"><span class="aud-k">Men</span><span class="aud-track"><span class="aud-fill aud-m" style="width:58.8%"></span></span><span class="aud-v">58.8%</span></div>
              <div class="aud-row"><span class="aud-k">Women</span><span class="aud-track"><span class="aud-fill aud-f" style="width:41.2%"></span></span><span class="aud-v">41.2%</span></div>
              <p class="aud-age">Avg age <strong>34</strong></p>
            </div>
            <div class="aud-group">
              <h4>Students</h4>
              <div class="aud-row"><span class="aud-k">Men</span><span class="aud-track"><span class="aud-fill aud-m" style="width:45.5%"></span></span><span class="aud-v">45.5%</span></div>
              <div class="aud-row"><span class="aud-k">Women</span><span class="aud-track"><span class="aud-fill aud-f" style="width:54.5%"></span></span><span class="aud-v">54.5%</span></div>
              <p class="aud-age">Avg age <strong>23</strong></p>
            </div>
            <div class="aud-group">
              <h4>Elderly</h4>
              <div class="aud-row"><span class="aud-k">Men</span><span class="aud-track"><span class="aud-fill aud-m" style="width:87.5%"></span></span><span class="aud-v">87.5%</span></div>
              <div class="aud-row"><span class="aud-k">Women</span><span class="aud-track"><span class="aud-fill aud-f" style="width:12.5%"></span></span><span class="aud-v">12.5%</span></div>
              <p class="aud-age">Avg age <strong>67</strong></p>
            </div>
          </div>
          </div>

          <!-- What they value -->
          <div class="aud-card">
          <p class="aud-cap">What they value most (total mentions across the three groups)</p>
          <div class="aud-needs">
            <div class="aud-need"><span class="aud-need-k">Networking</span><span class="aud-track"><span class="aud-fill aud-n" style="width:100%"></span></span><span class="aud-v">28</span></div>
            <div class="aud-need"><span class="aud-need-k">Infrastructure</span><span class="aud-track"><span class="aud-fill aud-n" style="width:96%"></span></span><span class="aud-v">27</span></div>
            <div class="aud-need"><span class="aud-need-k">Productive environment</span><span class="aud-track"><span class="aud-fill aud-n" style="width:61%"></span></span><span class="aud-v">17</span></div>
            <div class="aud-need"><span class="aud-need-k">Silence</span><span class="aud-track"><span class="aud-fill aud-n" style="width:46%"></span></span><span class="aud-v">13</span></div>
            <div class="aud-need"><span class="aud-need-k">Rest &amp; leisure</span><span class="aud-track"><span class="aud-fill aud-n" style="width:29%"></span></span><span class="aud-v">8</span></div>
            <div class="aud-need"><span class="aud-need-k">Privacy</span><span class="aud-track"><span class="aud-fill aud-n" style="width:25%"></span></span><span class="aud-v">7</span></div>
          </div>
          </div>

          <!-- How they work -->
          <div class="aud-card">
          <p class="aud-cap">How coworkers work: company and most / least productive times</p>
          <div class="aud-habits">
            <div class="aud-pie-block">
              <div class="aud-pie" style="background: conic-gradient(#8d9094 0 71%, #2f86c9 71% 100%)"></div>
              <p class="aud-pie-cap">Company</p>
              <ul class="aud-legend">
                <li><i style="background:#8d9094"></i>With others (71%)</li>
                <li><i style="background:#2f86c9"></i>Alone (29%)</li>
              </ul>
            </div>
            <div class="aud-pie-block">
              <div class="aud-pie" style="background: conic-gradient(#a7cf86 0 33%, #6fa84e 33% 71%, #4a7a2e 71% 100%)"></div>
              <p class="aud-pie-cap">Most productive</p>
              <ul class="aud-legend">
                <li><i style="background:#a7cf86"></i>Morning (33%)</li>
                <li><i style="background:#6fa84e"></i>Afternoon (38%)</li>
                <li><i style="background:#4a7a2e"></i>Evening (29%)</li>
              </ul>
            </div>
            <div class="aud-pie-block">
              <div class="aud-pie" style="background: conic-gradient(#f0c2a2 0 44%, #e2925d 44% 67%, #c4631f 67% 100%)"></div>
              <p class="aud-pie-cap">Least productive</p>
              <ul class="aud-legend">
                <li><i style="background:#f0c2a2"></i>Morning (44%)</li>
                <li><i style="background:#e2925d"></i>Afternoon (23%)</li>
                <li><i style="background:#c4631f"></i>Evening (33%)</li>
              </ul>
            </div>
          </div>
          </div>
        </div>

        <p class="pw-text">
          The survey brought up demands we already expected, like networking and
          interaction between people, but it also revealed a problem specific to
          coworkers: a lack of <strong>privacy</strong>, closely tied to silence
          and a productive environment. Since the Square Lab will be an open
          coworking plaza, with a strong focus on events and visitors, a good
          balance between focus and leisure areas became the project's central
          challenge. To carry these findings forward, a persona and an empathy map
          were created for each group, guiding the decisions through the rest of the
          project.
        </p>

        <h3 class="pw-subtitle">Mood boards</h3>
        <p class="pw-text">
          The boards are the source of all the inspiration for the product, so this
          is where the first brushstrokes begin. A lifestyle board portrays the
          audience's daily life; together with the research gathered so far, it
          feeds the concept boards that set the values the product should carry; and
          a product-expression board then gathers existing products that already
          reflect those concepts.
        </p>

        <h4 class="pw-subhead">Lifestyle</h4>
        <p class="pw-text">
          Snapshots of the audience's everyday routine around the centre:
          commuting along Beira-Mar, focused coworking, plenty of coffee, and
          unwinding on the university library's beanbags.
        </p>
        <figure class="pw-img pw-img-single mb-board">
          <img src="assets/zenik/mood-board-1.png" alt="Lifestyle mood board: Praça XV, focus and concentration, relaxation, coworking spaces, coffee, the Beira-Mar bus and unwinding on library beanbags" loading="lazy" />
          <figcaption>Lifestyle board: the audience's everyday routine around the centre.</figcaption>
        </figure>

        <h4 class="pw-subhead">Concepts</h4>
        <p class="pw-text">
          The concepts came both from the briefing and the existing ideas of Centro
          Sapiens and the Square Lab, and from the questionnaires and the audience.
          Three of them were defined to steer the product's direction:
        </p>
        <div class="concepts">
          <div class="concept">
            <img class="concept-ic" src="assets/zenik/technology.png" alt="" loading="lazy" />
            <h5 class="concept-name concept-tech">Technology</h5>
            <p>The most influential theme among the audience and one of the main areas Centro Sapiens works in. It brings the idea of a limitless future, full of possibilities.</p>
          </div>
          <div class="concept">
            <img class="concept-ic" src="assets/zenik/community.png" alt="" loading="lazy" />
            <h5 class="concept-name concept-comm">Community</h5>
            <p>Closely tied to coworking and cocreation. It is about uniting individual strengths and skills towards a greater good.</p>
          </div>
          <div class="concept">
            <img class="concept-ic" src="assets/zenik/vitality.png" alt="" loading="lazy" />
            <h5 class="concept-name concept-vita">Vitality</h5>
            <p>Balance and tranquillity, so the essence of life isn't lost amid the rapid changes of the 21st century. It also reflects values like health, nature and freedom.</p>
          </div>
        </div>

        <h4 class="pw-subhead">Product expression</h4>
        <p class="pw-text">
          Finally, a board of reference products set the formal language to aim
          for: clean and organised, innovative, ergonomic and relaxing, organic,
          contemporary and modern.
        </p>
        <figure class="pw-img pw-img-single mb-board">
          <img src="assets/zenik/mood-board-2.png" alt="Product-expression mood board: clean organised desks, innovation, ergonomic and relaxing lounge furniture, organic architecture, and contemporary, elegant, modern references" loading="lazy" />
          <figcaption>Product-expression board: the formal language to aim for.</figcaption>
        </figure>

        <h3 class="pw-subtitle">Design requirements</h3>
        <p class="pw-text">
          After bringing together the market, environment, use and audience
          analyses, the objective of the project was defined: urban furniture that
          secures focus, concentration and privacy for the plaza's coworkers and
          students; provides the infrastructure for study and work; offers a better
          integration of those tasks with rest and leisure; and fosters networking
          among users. From there, the requirements were split into mandatory and
          desirable, each one traced back to the research stage that raised it.
        </p>
        <div class="req-wrap">
          <table class="req req-must">
            <thead><tr><th>Mandatory</th><th>Source</th></tr></thead>
            <tbody>
              <tr><td>Mobility</td><td>Briefing</td></tr>
              <tr><td>Universal ergonomics</td><td>Environment &amp; use</td></tr>
              <tr><td>Easy to use</td><td>Briefing / Audience</td></tr>
              <tr><td>Easy maintenance</td><td>Briefing</td></tr>
              <tr><td>Resistant</td><td>Environment &amp; use</td></tr>
              <tr><td>Low cost</td><td>Briefing</td></tr>
              <tr><td>Promote rest &amp; leisure</td><td>Personas / Audience</td></tr>
              <tr><td>Promote study &amp; work</td><td>Personas / Audience</td></tr>
            </tbody>
          </table>
          <table class="req req-nice">
            <thead><tr><th>Desirable</th><th>Source</th></tr></thead>
            <tbody>
              <tr><td>Foldable</td><td>Environment &amp; use</td></tr>
              <tr><td>Cover / shade</td><td>Environment &amp; use</td></tr>
              <tr><td>Charge electronics</td><td>Competitor analysis</td></tr>
              <tr><td>Playful elements</td><td>Briefing / Competitors</td></tr>
              <tr><td>Biomimetic aesthetics</td><td>Competitor analysis</td></tr>
              <tr><td>Cultural references</td><td>Briefing</td></tr>
              <tr><td>Night lighting</td><td>Environment &amp; use</td></tr>
              <tr><td>Promote information</td><td>Environment &amp; use</td></tr>
              <tr><td>Place for belongings</td><td>Personas / Audience</td></tr>
              <tr><td>Cushioned seats</td><td>Environment &amp; use</td></tr>
            </tbody>
          </table>
        </div>

        <h3 class="pw-subtitle">Ideation</h3>
        <p class="pw-text">
          During ideation, the most varied ideas came up, from swings to exercise
          furniture. One idea stood out, though: a desk that can rotate and become a
          lounger. It made it possible to bring study and work together with rest
          and leisure in the same space, which could be one of the Square Lab's
          private areas, promoting focus, concentration, silence and privacy.
        </p>
        <figure class="pw-img pw-img-single">
          <img src="assets/zenik/ideation.png" alt="Ideation sketches exploring different furniture concepts, with the rotating desk-to-lounger idea highlighted" loading="lazy" />
          <figcaption>Ideation sketches: the rotating desk-to-lounger idea stood out.</figcaption>
        </figure>

        <h3 class="pw-subtitle">Creation</h3>
        <figure class="pw-img pw-img-single">
          <img src="assets/zenik/identity.png" alt="Zenik visual identity: logo, colour palette and typography" loading="lazy" />
          <figcaption>Zenik's visual identity: logo, colours and typography.</figcaption>
        </figure>
        <p class="pw-text">
          To anchor the form, the team looked at the position of maximum relaxation.
          In 1960, G. Lehmann published experiments on a possible posture of maximum
          relaxation, later replicated by NASA in 1978 while studying the best
          resting posture for astronauts in zero gravity. These postures point to an
          angle of around 45° between the arms and the body, and a 130° opening at
          the knees. The posture was reproduced and measured across real tasks
          (working on a laptop, reading) and then transferred to a 3D mannequin, to
          set the ideal body position the furniture would be modelled around.
        </p>
        <div class="zenik-cover">
          <figure class="pw-img" style="flex: 2.85 1 0">
            <img src="assets/zenik/position-ideal.png" alt="The ideal relaxation position transferred to the 3D mannequin" loading="lazy" />
            <figcaption>Ideal body position (from the maximum-relaxation posture), transferred to the 3D model.</figcaption>
          </figure>
          <figure class="pw-img" style="flex: 2.11 1 0">
            <img id="posSwap" src="assets/zenik/position-1.png" alt="The relaxation posture tested across real tasks, with body angles measured" loading="lazy" />
            <figcaption>The posture measured across real tasks.</figcaption>
          </figure>
        </div>

        <h4 class="pw-subhead">Materials</h4>
        <p class="pw-text">
          Each part of Zenik was specified in two cost tiers, so it can be built
          to different budgets without a redesign. The curved structure uses
          laminated bamboo, which is flexible, easy to curve and a rival to solid
          hardwood, or treated reforestation pine as the low-cost option. The metal
          supports are stainless-steel sheets (corrosion-resistant, recyclable and
          needing no galvanic plating) or carbon-steel "metalon" for cost. The seat
          fabric is linen, which is durable, soft and ecological, or a breathable
          poly-cotton blend when cost matters most. Every choice favours durability,
          comfort and a warm, natural finish, in line with the product's vitality
          concept.
        </p>
        <figure class="pw-img pw-img-single">
          <img src="assets/zenik/materials.png" alt="Zenik with material callouts: laminated bamboo or treated pine for the structure, stainless steel or metalon for the supports, and linen or poly-cotton for the fabric" loading="lazy" />
          <figcaption>Material options per part: a premium ($$) and a low-cost ($) tier.</figcaption>
        </figure>

        <h4 class="pw-subhead">Golden ratio</h4>
        <p class="pw-text">
          Finally, the golden ratio (1.618…) guided the form. It is the proportion
          nature settles on for balanced growth, found in everything from the
          tiniest bodies, like the atom, to the most gigantic, like planets and
          galaxies. Zenik carries it too: folded as a table it fits a perfect
          square, and reclined as a lounger it fits a golden rectangle.
        </p>
        <div class="pw-images pw-images-2">
          <figure class="pw-img">
            <img src="assets/zenik/image4.png" alt="The golden ratio in nature: a daisy, a nautilus shell, a bonsai tree and a spiral galaxy" loading="lazy" />
            <figcaption>The golden ratio across nature.</figcaption>
          </figure>
          <figure class="pw-img">
            <img src="assets/zenik/image5.gif" alt="Diagram: Zenik fits a perfect square as a table and a golden rectangle as a lounger, with the golden spiral overlaid" loading="lazy" />
            <figcaption>Zenik fits a square as a table and a golden rectangle as a lounger.</figcaption>
          </figure>
        </div>

        <h3 class="pw-subtitle">Solutions</h3>
        ${[
          "A simple, robust mechanism rotates the table 90°.",
          "Swivel and fixed casters for easy movement.",
          "A metal rod on the tabletop stores the sling when it isn't in use.",
          "Neodymium-magnet locks hold the tabletop and the chair backrest.",
          "A recessed tabletop edge avoids head bumps; the pillow adjusts on elastic.",
          "A notebook-and-book table with adjustable height and angle.",
          "Slings printed with artwork by the plaza's collaborators.",
        ]
          .map(
            (cap, i) =>
              `<figure class="pw-img pw-img-single"><img src="assets/zenik/solution${
                i + 1
              }.png" alt="${cap}" loading="lazy" /><figcaption>${cap}</figcaption></figure>`
          )
          .join("")}

        <h3 class="pw-subtitle">Technical drawings</h3>
        ${[
          "Desk mode: orthographic views and dimensions (mm).",
          "Lounger mode: orthographic views and dimensions (mm).",
          "The chair: orthographic views and dimensions (mm).",
          "The adjustable laptop table: views, dimensions and tilt angles (mm).",
          "The casters: locking swivel and fixed, with dimensions (mm).",
        ]
          .map(
            (cap, i) =>
              `<figure class="pw-img pw-img-single"><img src="assets/zenik/drawing${
                i + 1
              }.png" alt="${cap}" loading="lazy" /><figcaption>${cap}</figcaption></figure>`
          )
          .join("")}
      </section>
    </div>`,

  durare: () => `
    <div class="content-wide pw-page durare-page">
      <img class="pw-logo" src="assets/durare/durare.png" alt="Durare" />

      <p class="pw-intro">
        Durare is an innovative carry-on suitcase, "built to last", developed as
        a high-complexity product-design project at UFSC. The goal was to bring
        solutions not yet seen on the market, drawing on some of the main trends
        that are shaping how people travel.
      </p>

      <div class="zenik-cover durare-cover">
        <figure class="pw-img" style="flex: 1.109 1 0"><img src="assets/durare/cover1.png" alt="The Durare carry-on suitcase" loading="lazy" /></figure>
        <figure class="pw-img" style="flex: 0.671 1 0"><img src="assets/durare/cover2.png" alt="The Durare carry-on suitcase, alternate view" loading="lazy" /></figure>
        <figure class="pw-img" style="flex: 0.75 1 0"><img src="assets/durare/prototype1.jpg" alt="The finished Durare prototype" loading="lazy" /></figure>
      </div>

      <section class="pw-section">
        <div class="pw-group">
          <span class="pw-group-label">Research &amp; Development</span>
        </div>
        <h3 class="pw-subtitle">Desk research</h3>
        <p class="pw-text">
          Anticipating the future gets harder every year, as the world goes
          through drastic changes across all of its spheres in ever shorter
          spans of time. Designing today means staying deeply connected to
          everything happening around us, so as to exercise the sensitivity that
          real innovation needs. The project began by mapping the rules, the news
          and, above all, the trends shaping society, and how each one could feed
          into the product.
        </p>

        <p class="pw-pill">News</p>
        <p class="pw-text">A scan of the sector helped set the context for the project:</p>
        <ul class="pw-list">
          <li><strong>Carry-on limits.</strong> Brazil's ANAC caps cabin bags at 10&nbsp;kg. On size, every local carrier follows a 55&nbsp;×&nbsp;35&nbsp;×&nbsp;25&nbsp;cm standard, while some international flights ask for smaller, lighter bags.</li>
          <li><strong>Lithium-battery restrictions.</strong> After the Samsung Note&nbsp;7 incidents, bags with non-removable internal batteries were restricted. The battery has to come out before boarding, or stay under tight power limits.</li>
          <li><strong>Low-cost carriers arriving.</strong> Deregulation brought at least four low-cost airlines to Brazil. Their cheaper fares are offset by charging for services that used to be included, such as checked bags.</li>
          <li><strong>Dynamic baggage pricing.</strong> LATAM began pricing checked bags dynamically on domestic flights, varying the price by season, destination and date.</li>
          <li><strong>Smarter airports.</strong> Florianópolis's new terminal offers luggage carts that ride the escalators alongside the traveller.</li>
        </ul>

        <p class="pw-pill">Trends</p>
        <p class="pw-text">
          Three trends stood out as forces shaping how people will travel, and
          each one influenced Durare.
        </p>

        <h4 class="pw-subhead">1 · Self-regenerating materials</h4>
        <p class="pw-text">
          The idea is not new. It has been known since the Colosseum in Rome,
          when people noticed some of its cracks recovering on their own.
          Self-healing materials are the ones that "scar" by themselves, through
          added linking molecules that restore the material's internal bonds. In
          2013 LG launched a phone with a back that could heal small scratches,
          though it had little impact, since the material did not prove very
          effective. In 2017 Imperial Motion launched a line of jackets and
          backpacks made from a thin, light self-healing fabric that closes fairly
          large tears with almost 100% efficiency. And in 2018 Harvard patented a
          self-healing natural rubber, which would be revolutionary for the
          industry, since once vulcanised, natural rubber becomes a non-recyclable
          thermoset. Both ideas fed directly into Durare's nano-regenerative
          pocket fabric and rubber wheels.
        </p>
        <figure class="pw-img pw-img-single" style="max-width:520px">
          <img src="assets/durare/trend-regenerative.jpg" alt="A hand stretching self-healing fabric on a backpack" loading="lazy" />
          <figcaption>Imperial Motion's self-healing fabric closing a tear.</figcaption>
        </figure>

        <h4 class="pw-subhead">2 · New mobility technologies</h4>
        <p class="pw-text">
          Still on rubber: Michelin developed a new type of tyre that needs no
          air, with no inner chamber to rupture. This considerably increases
          durability, since a large share of tyres are scrapped exactly because
          that inner chamber fails. Michelin signed a contract with GM in early
          2019, and the tyre starts rolling out from 2024. It influenced Durare's
          tougher, more damage-resistant wheels.
        </p>
        <figure class="pw-img pw-img-single" style="max-width:340px">
          <img src="assets/durare/trend-tire.jpg" alt="Michelin's airless tyre fitted to a Chevrolet Bolt EV" loading="lazy" />
          <figcaption>Michelin's airless tyre on a Chevrolet Bolt EV.</figcaption>
        </figure>

        <h4 class="pw-subhead">3 · The future of parts replacement</h4>
        <p class="pw-text">
          EU countries are weighing right-to-repair laws to push companies into
          offering more accessible repairs, and to curb the e-waste and greenhouse
          emissions that come from replacing whole appliances. This will lead
          makers down one of two paths, or both: build more durable products, or
          develop new ways to supply replacement parts. In parallel, 3D printing
          is rising fast as a practical way to make those parts across every
          product segment. It is a direct argument for a case that is
          <strong>built to last</strong> and easy to repair.
        </p>
        <div class="pw-row">
          <figure class="pw-img" style="flex: 1.685 1 0"><img src="assets/durare/trend-parts.jpg" alt="An assortment of replacement parts and fittings" loading="lazy" /><figcaption>Replacement parts and fittings.</figcaption></figure>
          <figure class="pw-img" style="flex: 0.958 1 0"><img src="assets/durare/trend-3dprint.jpg" alt="A 3D printer extruding a red part" loading="lazy" /><figcaption>3D-printed parts on demand.</figcaption></figure>
        </div>

        <h3 class="pw-subtitle">User research</h3>
        <p class="pw-text">
          To understand who Durare is for, we ran a survey through Google Forms and
          gathered 59 responses, helped by easy contact with a work and off-road
          travel group on a messaging app. This was backed by informal, one-on-one
          contact with part of the audience at airports, shops and on trips,
          through interviews and observation. The main findings:
        </p>
        <div class="aud-wrap">
          <div class="aud-card">
            <p class="aud-cap">Who they are</p>
            <p class="dr-sub">Gender</p>
            <div class="aud-needs dr-bars">
              <div class="aud-need"><span class="aud-need-k">Men</span><span class="aud-track"><span class="aud-fill aud-m" style="width:79.7%"></span></span><span class="aud-v">79.7%</span></div>
              <div class="aud-need"><span class="aud-need-k">Women</span><span class="aud-track"><span class="aud-fill aud-f" style="width:20.3%"></span></span><span class="aud-v">20.3%</span></div>
            </div>
            <p class="dr-sub">Where they live</p>
            <div class="aud-needs dr-bars">
              <div class="aud-need"><span class="aud-need-k">South</span><span class="aud-track"><span class="aud-fill aud-n" style="width:64.4%"></span></span><span class="aud-v">64.4%</span></div>
              <div class="aud-need"><span class="aud-need-k">Southeast</span><span class="aud-track"><span class="aud-fill aud-n" style="width:25.4%"></span></span><span class="aud-v">25.4%</span></div>
            </div>
            <p class="dr-note"><strong>88.1%</strong> are over 30. The largest group is 50+ (35.6%), then 31-40 (20.3%). The most-cited professions were <strong>engineers</strong> and <strong>entrepreneurs</strong>.</p>
          </div>

          <div class="aud-card">
            <p class="aud-cap">How they travel</p>
            <p class="dr-sub">Trip purpose</p>
            <div class="aud-needs dr-bars">
              <div class="aud-need"><span class="aud-need-k">Leisure + work</span><span class="aud-track"><span class="aud-fill aud-n" style="width:49.2%"></span></span><span class="aud-v">49.2%</span></div>
              <div class="aud-need"><span class="aud-need-k">Leisure only</span><span class="aud-track"><span class="aud-fill aud-n" style="width:40.7%"></span></span><span class="aud-v">40.7%</span></div>
              <div class="aud-need"><span class="aud-need-k">Work only</span><span class="aud-track"><span class="aud-fill aud-n" style="width:10.1%"></span></span><span class="aud-v">10.1%</span></div>
            </div>
            <p class="dr-sub">Work trips</p>
            <p class="dr-note">Short and domestic: 83% last 1-3 days and 83% stay within Brazil, mostly by car (83%) over plane (50%). Smartphones (80%) and notebooks (40%) come along.</p>
            <p class="dr-sub">Leisure trips</p>
            <p class="dr-note">Occasional and family-oriented: 63% travel 1-3 times a year, 88% with family, by car and plane equally (83%), for anywhere from 3 to 30 days.</p>
          </div>

          <div class="aud-card">
            <p class="aud-cap">What they carry</p>
            <div class="aud-needs dr-bars">
              <div class="aud-need"><span class="aud-need-k">Smartphone</span><span class="aud-track"><span class="aud-fill aud-n" style="width:82.6%"></span></span><span class="aud-v">82.6%</span></div>
              <div class="aud-need"><span class="aud-need-k">Camera</span><span class="aud-track"><span class="aud-fill aud-n" style="width:56.5%"></span></span><span class="aud-v">56.5%</span></div>
              <div class="aud-need"><span class="aud-need-k">Power bank</span><span class="aud-track"><span class="aud-fill aud-n" style="width:13%"></span></span><span class="aud-v">13%</span></div>
              <div class="aud-need"><span class="aud-need-k">Notebook</span><span class="aud-track"><span class="aud-fill aud-n" style="width:8.7%"></span></span><span class="aud-v">8.7%</span></div>
            </div>
          </div>

          <div class="aud-card">
            <p class="aud-cap">What matters in a bag</p>
            <div class="aud-needs dr-bars">
              <div class="aud-need"><span class="aud-need-k">Durability</span><span class="aud-track"><span class="aud-fill aud-n" style="width:71.2%"></span></span><span class="aud-v">71.2%</span></div>
              <div class="aud-need"><span class="aud-need-k">Price</span><span class="aud-track"><span class="aud-fill aud-n" style="width:59.3%"></span></span><span class="aud-v">59.3%</span></div>
              <div class="aud-need"><span class="aud-need-k">Internal dividers</span><span class="aud-track"><span class="aud-fill aud-n" style="width:40.7%"></span></span><span class="aud-v">40.7%</span></div>
              <div class="aud-need"><span class="aud-need-k">Aesthetics</span><span class="aud-track"><span class="aud-fill aud-n" style="width:39%"></span></span><span class="aud-v">39%</span></div>
            </div>
            <p class="dr-note">On format, opinion splits evenly: 51.7% prefer hard cases, 50% fabric. In practice, 46.6% end up checking their bag and 39.7% buy a larger extra bag than they set out with.</p>
            <div class="dr-key">The bag travellers identified with most was a <strong>carry-on with an expandable compartment</strong>, which is exactly the gap Durare aimed to fill.</div>
          </div>
        </div>

        <h3 class="pw-subtitle">Functional &amp; structural analysis</h3>
        <p class="pw-text">
          In general, suitcases can be split into rigid and flexible. Rigid cases
          protect their contents better and last longer. Flexible cases, usually
          finished in fabric, are more malleable and versatile, but leave the
          interior more exposed to knocks and damage.
        </p>

        <p class="pw-pill">Materials</p>
        <div class="dr-mat-grid">
          <div class="dr-mat">
            <h4>ABS</h4>
            <p>Low-cost, light, flexible and good-looking, with solid impact resistance and easy moulding into many shapes. Downsides: weak UV resistance and limited bending strength.</p>
          </div>
          <div class="dr-mat">
            <h4>Polypropylene (PP)</h4>
            <p>Strong and light, with low moisture absorption and the ability to spring back after stress. Medium cost, easy to mould. Downsides: scratches easily; poor UV and oxidation resistance.</p>
          </div>
          <div class="dr-mat">
            <h4>Polycarbonate (PC)</h4>
            <p>PP-like elasticity with a much higher yield strength (around 50% more than ABS), which makes it far harder to break. It is pricier, though, which raises the cost of PC cases.</p>
          </div>
          <div class="dr-mat">
            <h4>ABS + PC blend</h4>
            <p>A composite pairing PC's good mechanical properties with ABS's low cost. It can be combined in different ways, as covered in manufacturing below.</p>
          </div>
        </div>

        <p class="pw-pill">Manufacturing</p>
        <p class="pw-text">
          Cases usually come in several sizes of the same model. This is not only
          to offer a product line to the customer, but also to make assembly easier
          on the production line. Rigid shells are made mostly by vacuum forming,
          though some makers injection-mould them.
        </p>
        <div class="dr-mfg">
          <div class="dr-mfg-cell">
            <h4 class="pw-subhead">Vacuum forming</h4>
            <p class="pw-text">
              Lets the PC + ABS blend be made very practically, with no need for
              pre-mixed raw material. Some makers build a PC + ABS "sandwich", with
              the PC sheet on the outside and the ABS on the inside, so the shell
              keeps the mechanical and visual qualities of polycarbonate while
              saving material with ABS.
            </p>
            <figure class="pw-img"><img src="assets/durare/vacuum-forming.png" alt="A suitcase shell made by vacuum forming" loading="lazy" /><figcaption>A shell made by vacuum forming.</figcaption></figure>
          </div>
          <div class="dr-mfg-cell">
            <h4 class="pw-subhead">Polymer injection</h4>
            <p class="pw-text">
              An alternative that moulds the shell directly; burrs are trimmed
              before the components are installed.
            </p>
            <figure class="pw-img"><img src="assets/durare/plastic-injection.png" alt="A suitcase shell made by polymer injection" loading="lazy" /><figcaption>A shell made by polymer injection.</figcaption></figure>
          </div>
        </div>

        <div class="dr-box">
          <h4 class="pw-subhead">In-house components</h4>
          <p class="pw-text">
            Components are usually bought off the shelf from specialist makers,
            such as telescopic handles, wheels and grips. That is not a rule,
            though. Some brands verticalise instead: the British brand Rolling, for
            example, injection-moulds its own wheels to cut its internal costs.
          </p>
          <div class="pw-row">
            <figure class="pw-img" style="flex: 1.536 1 0"><img src="assets/durare/wheel-0.png" alt="Injection-moulding machine producing wheels" loading="lazy" /><figcaption>Moulding machine.</figcaption></figure>
            <figure class="pw-img" style="flex: 1.679 1 0"><img src="assets/durare/wheel-1.png" alt="A moulded plastic wheel" loading="lazy" /><figcaption>Moulded wheel.</figcaption></figure>
            <figure class="pw-img" style="flex: 1.345 1 0"><img src="assets/durare/wheel-2.png" alt="A caster housing" loading="lazy" /><figcaption>Caster housing.</figcaption></figure>
            <figure class="pw-img" style="flex: 1.567 1 0"><img src="assets/durare/wheel-3.png" alt="An assembled spinner caster" loading="lazy" /><figcaption>Assembled spinner.</figcaption></figure>
            <figure class="pw-img" style="flex: 1.550 1 0"><img src="assets/durare/wheel-4.png" alt="A finished branded caster" loading="lazy" /><figcaption>Finished caster.</figcaption></figure>
          </div>
        </div>

        <p class="pw-pill">Components</p>
        <h4 class="pw-subhead">Wheels</h4>
        <p class="pw-text">
          There are two main types. <strong>360° spinners</strong> move in any
          direction and are the most popular, since they save a lot of effort on
          the flat floors of an airport. On the downside, they can slip on inclined
          surfaces, struggle on uneven ground such as pavements, cost more and take
          up part of the internal volume. <strong>Embedded</strong> wheels roll in
          a single direction only. They are sturdier, cheaper and leave more room
          inside, but they limit the manoeuvrability of the case.
        </p>
        <div class="pw-row">
          <figure class="pw-img" style="flex: 1.5 1 0"><img src="assets/durare/wheel-360.png" alt="360-degree spinner wheels on a suitcase" loading="lazy" /><figcaption>360° spinner wheels.</figcaption></figure>
          <figure class="pw-img" style="flex: 1.359 1 0"><img src="assets/durare/wheel-embedded.png" alt="An embedded single-direction wheel" loading="lazy" /><figcaption>Embedded wheel.</figcaption></figure>
        </div>
        <h4 class="pw-subhead">Telescopic handle</h4>
        <p class="pw-text">
          These vary in look but all work the same way, regardless of the case,
          and are bought from companies that specialise in extruded metal tubes.
          They work through a metal pin that retracts when the user triggers it.
          The main problem is that the tubes have to extend a long way relative to
          their cross-section, which brings a lot of instability to the internal
          parts (tension and compression springs, steel cables and rods, small
          nylon gears, injected plastic and screws), making them a common failure
          point. This comes back in the ergonomic analysis.
        </p>
        <figure class="pw-img pw-img-single">
          <img src="assets/durare/retractable-handle.png" alt="A news headline calling retractable suitcase handles a common failure point" loading="lazy" />
          <figcaption>The press flagged retractable handles as a frequent weak point.</figcaption>
        </figure>
        <h4 class="pw-subhead">Handles</h4>
        <p class="pw-text">
          Handles can be bought from third parties or made together with the case,
          and have the simple job of letting the user hold it without using the
          wheels. <strong>Rigid</strong> handles are usually fixed on axes, so they
          fold flush with the surface of the case but stay ergonomic when needed.
          <strong>Flexible</strong> handles add a retraction mechanism that lets the
          handle slide around 2&nbsp;cm on each side to make room for the hand.
        </p>
        <div class="pw-row">
          <figure class="pw-img" style="flex: 1.742 1 0"><img src="assets/durare/handle1.png" alt="A rigid suitcase handle on folding brackets" loading="lazy" /><figcaption>Rigid handle.</figcaption></figure>
          <figure class="pw-img" style="flex: 0.992 1 0"><img src="assets/durare/handle2.png" alt="A flexible retracting suitcase handle" loading="lazy" /><figcaption>Flexible handle.</figcaption></figure>
        </div>
        <h4 class="pw-subhead">Closing system</h4>
        <p class="pw-text">
          The most common way to close a case is with a zipper. Others close by
          pressing the shells against a sealing rubber gasket. In both cases there
          are locks to guard against theft and accidental opening: optional on
          zippers, mandatory on pressure seals. It is worth noting that airport
          staff sometimes need to open the case, which is what TSA locks are for.
          They can be opened by the owner and by airports that hold the right key,
          while staying locked for everyone else.
        </p>

        <h3 class="pw-subtitle">Ergonomic analysis</h3>
        <p class="pw-text">
          We built a flowchart of how the case is used, to understand which tasks
          are most critical to its durability and everyday handling. Each of these
          tasks was then looked at more closely with <strong>OWAS</strong> (Ovako
          Working Posture Analysing System), a method that shows the level of
          physical effort a posture demands from the back, arms and legs.
        </p>

        <p class="pw-pill">Activities &amp; postures</p>
        <h4 class="pw-subhead">Reading an OWAS code</h4>
        <p class="pw-text">
          Each posture is coded by three digits, for the back, arms and legs. The
          combination, weighed against how long it is held, falls into one of four
          action categories, from "no action needed" to "corrective measures
          immediately".
        </p>
        <div class="pw-row">
          <figure class="pw-img" style="flex: 0.868 1 0"><img src="assets/durare/owas1.png" alt="OWAS posture codes for the back, arms and legs" loading="lazy" /><figcaption>Posture codes for the back, arms and legs.</figcaption></figure>
          <figure class="pw-img" style="flex: 1.454 1 0"><img src="assets/durare/owas2.png" alt="OWAS action-category table by posture and holding time" loading="lazy" /><figcaption>Action categories by posture and time held.</figcaption></figure>
        </div>

        <div class="erg-tasks">
          <article class="erg-task">
            <figure class="pw-img"><img src="assets/durare/usage1.png" alt="A user bending over to pick up a suitcase, OWAS code 211" loading="lazy" /></figure>
            <div class="erg-task-body">
              <div class="erg-task-head"><h4>A · Picking up the case</h4><span class="erg-code">OWAS 211</span></div>
              <p class="erg-posture">Back bent · arms low · legs straight</p>
              <p>
                Effort changes with the shell material and how full the case is,
                and it gets higher when the case has no side grips. The height of
                the case also matters, since even shorter users have to load the
                lower back to reach down to it.
              </p>
            </div>
          </article>

          <article class="erg-task">
            <figure class="pw-img"><img src="assets/durare/usage2.png" alt="A user seated, opening a suitcase, OWAS code 213" loading="lazy" /></figure>
            <div class="erg-task-body">
              <div class="erg-task-head"><h4>B · Opening &amp; closing</h4><span class="erg-code">OWAS 213</span></div>
              <p class="erg-posture">Back bent · arms low · legs bent</p>
              <p>
                Usually done on a raised surface such as a bed, sofa or counter,
                so effort stays low and falls mainly on the arms. On larger cases
                it gets more awkward, since the user has to stretch or move around
                to reach the zips all the way round.
              </p>
            </div>
          </article>

          <article class="erg-task erg-task--wide">
            <figure class="pw-img"><img src="assets/durare/usage3.png" alt="A user walking while pulling a suitcase, OWAS code 111" loading="lazy" /></figure>
            <div class="erg-task-body">
              <div class="erg-task-head"><h4>C · Walking with the case</h4><span class="erg-code">OWAS 111</span></div>
              <p class="erg-posture">All neutral</p>
              <p>
                Done in two ways: dragging the case on two wheels, or rolling it
                on four. Four wheels ask the least, since the case carries its own
                weight. On two wheels a heavy case puts more load on the shoulder
                and arm. Overall the effort is between low and medium.
              </p>
            </div>
          </article>

          <article class="erg-task erg-task--wide">
            <figure class="pw-img"><img src="assets/durare/usage4.png" alt="A user lifting a suitcase overhead to store it, OWAS code 131" loading="lazy" /></figure>
            <div class="erg-task-body">
              <div class="erg-task-head"><h4>D · Storing in the luggage rack</h4><span class="erg-code">OWAS 131</span></div>
              <p class="erg-posture">Back straight · arms raised · legs straight</p>
              <p>
                Effort depends on the weight of the case, and side grips help
                bring it down. User height is very relevant here, so the lift was
                analysed across the range, from the 5th-percentile woman to the
                95th-percentile man.
              </p>
            </div>
          </article>
        </div>

        <p class="pw-pill">Problems found</p>
        <p class="pw-text">
          Watching the case out in the real world, on the street, at night and
          while loading a car, brought up the recurring problems it would have to
          answer.
        </p>
        <div class="erg-problems">
          <article class="erg-problem erg-problem--two">
            <div class="erg-problem-imgs">
              <figure class="pw-img" style="flex: 1.198 1 0"><img src="assets/durare/problem1.png" alt="A traveller dragging a suitcase across uneven pavement" loading="lazy" /></figure>
              <figure class="pw-img" style="flex: 1.363 1 0"><img src="assets/durare/problem2.png" alt="A suitcase dragged over a rough kerb at night" loading="lazy" /></figure>
            </div>
            <div class="erg-problem-body">
              <h4><span class="erg-num">I</span> Walking on uneven ground</h4>
              <p>
                Carry-ons are usually designed for the smooth, regular floors of
                an airport. In practice, though, the case is used on pavements,
                stairs, slopes and all kinds of ground just as often, if not more,
                than inside the airport itself, by day and by night. This rough
                ground weakens the wheel mechanism until it eventually breaks, and
                makes the case harder to steer.
              </p>
            </div>
          </article>

          <article class="erg-problem">
            <figure class="pw-img"><img src="assets/durare/problem4.png" alt="A user forcing a suitcase into a packed car boot" loading="lazy" /></figure>
            <div class="erg-problem-body">
              <h4><span class="erg-num">II</span> Storing in tight spaces</h4>
              <p>
                Fitting the case into a packed car boot or overhead bin can take
                a lot of effort, often because the shell is too rigid to give at
                all.
              </p>
            </div>
          </article>

          <article class="erg-problem">
            <figure class="pw-img"><img src="assets/durare/problem3.png" alt="Close-up of small suitcase wheels struggling on loose gravel" loading="lazy" /></figure>
            <div class="erg-problem-body">
              <h4><span class="erg-num">III</span> Vulnerable wheels</h4>
              <p>
                More than half of the cases that need repair come down to the
                wheels. On cases with a less resistant shell, a hard knock to a
                wheel can even crack the body itself.
              </p>
            </div>
          </article>

          <article class="erg-problem erg-problem--text">
            <div class="erg-problem-body">
              <h4><span class="erg-num">IV</span> Wheel noise</h4>
              <p>
                Some users complain about the noise the wheels make on the floor,
                to the point of preferring to carry the case by the handle to
                avoid it.
              </p>
            </div>
          </article>

          <article class="erg-problem erg-problem--text">
            <div class="erg-problem-body">
              <h4><span class="erg-num">V</span> Usability tied to user height</h4>
              <p>
                The telescopic handle is one of the weak points of any case,
                because of how complex its internal components are, and all of
                that just so the handle can suit the different heights of each
                user.
              </p>
            </div>
          </article>

          <article class="erg-problem erg-problem--text">
            <div class="erg-problem-body">
              <h4><span class="erg-num">VI</span> Not enough internal space</h4>
              <p>
                Too little room inside, or simply poor internal organisation,
                becomes a source of confusion and stress when packing the case or
                trying to reach one specific item.
              </p>
            </div>
          </article>
        </div>

        <p class="pw-pill">Anthropometric criteria</p>
        <p class="pw-text">
          The dimensions were taken from the American work <em>Human Scale</em>
          (Diffrient, Tilley &amp; Bardagjy, 1974), shown in the percentile table
          below, sizing the case to serve the full range of users, from the
          5th-percentile woman to the 95th-percentile man.
        </p>
        <figure class="pw-img pw-img-single">
          <img src="assets/durare/anthropometric-citeria.png" alt="Percentile table of body measurements for men and women" loading="lazy" />
          <figcaption>Percentile table, from the 5th-percentile woman to the 95th-percentile man.</figcaption>
        </figure>

        <h4 class="pw-subhead">Significant measures</h4>
        <div class="erg-sig">
          <figure class="erg-sig-figure pw-img">
            <img src="assets/durare/measures.png" alt="Anthropometric diagram of the body dimensions referenced for the project" loading="lazy" />
            <figcaption>The two dimensions that drove the design.</figcaption>
          </figure>
          <div class="erg-sig-measures">
            <div class="erg-measure erg-measure--orange">
              <span class="erg-measure-val">56.5-73 cm</span>
              <h4>Hand height off the floor</h4>
              <p>Sets how far the telescopic handle has to travel, sized to cover from the 5th-percentile woman to the 95th-percentile man.</p>
            </div>
            <div class="erg-measure erg-measure--blue">
              <span class="erg-measure-val">≥ 10 cm</span>
              <h4>Hand width</h4>
              <p>Sizes the grips, taken from the palm width of the 95th-percentile man so the largest hands still fit.</p>
            </div>
          </div>
        </div>

        <h3 class="pw-subtitle">Market analysis</h3>
        <p class="pw-text">
          The carry-on market is not new and is already quite mature. To map it,
          five of the brands on sale in Brazil were studied, from the global leader
          to local players and a luxury name, looking at their materials, prices
          and what, if anything, sets each one apart.
        </p>
        <div class="mkt-brands">
          <div class="mkt-brand">
            <div class="mkt-logo"><img src="assets/durare/logo-samsonite.png" alt="Samsonite" loading="lazy" /></div>
            <p class="mkt-price">R$ 500-2,850</p>
            <p class="mkt-note">Around since 1910 and the market leader, so the most experienced of all. Rigid lines (PC, ABS, PP, aluminium, Curv®) and flexible fabric or PE lines.</p>
            <div class="mkt-shot"><img src="assets/durare/suitcase-samsonite.jpg" alt="A Samsonite hard-shell suitcase" loading="lazy" /></div>
          </div>
          <div class="mkt-brand">
            <div class="mkt-logo"><img src="assets/durare/logo-lansay.png" alt="Lansay" loading="lazy" /></div>
            <p class="mkt-price">R$ 459-729</p>
            <p class="mkt-note">Brazilian (São Paulo), mid-range. ABS shells and polyester fabric, nine models, two-year warranty against manufacturing defects.</p>
            <div class="mkt-shot"><img src="assets/durare/suitcase-lansay.jpg" alt="A Lansay fabric suitcase" loading="lazy" /></div>
          </div>
          <div class="mkt-brand">
            <div class="mkt-logo"><img src="assets/durare/logo-baggagio.png" alt="Baggagio" loading="lazy" /></div>
            <p class="mkt-price">R$ 199-499</p>
            <p class="mkt-note">Brazilian (Rio), low to mid. Wide colour range and made-to-order personalisation, but nothing innovative in function, and a confusing buying flow.</p>
            <div class="mkt-shot"><img src="assets/durare/suitcase-baggagio.jpg" alt="A Baggagio hard-shell suitcase" loading="lazy" /></div>
          </div>
          <div class="mkt-brand">
            <div class="mkt-logo"><img src="assets/durare/logo-sestini.png" alt="Sestini" loading="lazy" /></div>
            <p class="mkt-price">R$ 199-599</p>
            <p class="mkt-note">Brazilian, low to mid, and the most innovative here. Some models add retractable wheels, a USB port and dedicated compartments.</p>
            <div class="mkt-shot"><img src="assets/durare/suitcase-sestini.jpg" alt="A Sestini hard-shell suitcase" loading="lazy" /></div>
          </div>
          <div class="mkt-brand">
            <div class="mkt-logo"><img src="assets/durare/logo-landrover.png" alt="Land Rover" loading="lazy" /></div>
            <p class="mkt-price">≈ £225</p>
            <p class="mkt-note">English luxury brand. Polycarbonate shell on an aluminium frame, with a zipperless closure. Much of its value is emotional, bought for the badge.</p>
            <div class="mkt-shot"><img src="assets/durare/suitcase-landrover.jpg" alt="A Land Rover hard-shell suitcase" loading="lazy" /></div>
          </div>
        </div>

        <p class="pw-pill">Independent testing</p>
        <p class="pw-text">
          Consumer association Proteste bench-tested the leading brands (2016). The
          findings that mattered most here:
        </p>
        <ul class="pw-list">
          <li>Every case showed some weakness in <strong>waterproofing</strong>.</li>
          <li><strong>Telescopic handle</strong>: Lansay best, Le Postiche worst (it tends to slide down on its own).</li>
          <li><strong>Wheels &amp; suspension</strong>: Samsonite best, Le Postiche and Primícia worst.</li>
          <li><strong>Closing system</strong>: Samsonite and Primícia led.</li>
        </ul>

        <p class="pw-pill">Cost × benefit</p>
        <p class="pw-text">
          Plotting the brands on cost against benefit shows where there is room to
          move. Since the market is already quite mature, the opportunities are no
          great novelty unless the aim is to deliver the best possible product at
          the lowest cost, landing in the orange <strong>area of opportunity</strong>
          (high benefit, low cost). One way to add value is through invention and
          innovation, bringing things that are simply different from the norm and
          with real benefits for the audience. It is worth noting that Land Rover,
          besides having good cases, also gains a lot from its audience, who buy the
          case out of desire for the car.
        </p>
        <div class="cxb-wrap">
          <div class="cxb">
            <span class="cxb-ylabel"><span class="cxb-emoji">💰</span> Cost</span>
            <span class="cxb-xlabel">Benefit <span class="cxb-emoji">👍</span></span>
            <span class="cxb-opp" style="left:76%; top:55%"><span>Area of<br>opportunity</span></span>
            <span class="cxb-mark" style="left:42%; top:13%"><img src="assets/durare/logo-landrover.png" alt="Land Rover" loading="lazy" /></span>
            <span class="cxb-mark" style="left:64%; top:19%"><img src="assets/durare/logo-samsonite.png" alt="Samsonite" loading="lazy" /></span>
            <span class="cxb-mark" style="left:27%; top:44%"><img src="assets/durare/logo-lansay.png" alt="Lansay" loading="lazy" /></span>
            <span class="cxb-mark" style="left:47%; top:52%"><img src="assets/durare/logo-sestini.png" alt="Sestini" loading="lazy" /></span>
            <span class="cxb-mark" style="left:24%; top:72%"><img src="assets/durare/logo-baggagio.png" alt="Baggagio" loading="lazy" /></span>
          </div>
        </div>

        <h3 class="pw-subtitle">Design requirements</h3>
        <p class="pw-text">
          From all of the analyses so far, a table of qualitative <strong>user
          requirements</strong> was put together, a list of needs from the point of
          view of whoever is going to use the product. A House of Quality (QFD) then
          converts those needs into quantifiable <strong>project
          requirements</strong>, to clearly understand the main technical challenges
          that deserve the most attention.
        </p>

        <h4 class="pw-subhead">User requirements</h4>
        <table class="dr-table">
          <thead><tr><th>Requirement</th><th>Source</th></tr></thead>
          <tbody>
            <tr><td>Be light</td><td>Desk research / Ergonomic analysis / User research</td></tr>
            <tr><td>Be durable</td><td>User research / Desk research</td></tr>
            <tr><td>Have malleability</td><td>User research / Ergonomic analysis</td></tr>
            <tr><td>Practical, efficient usability</td><td>Ergonomic analysis</td></tr>
            <tr><td>Size compliant with norms</td><td>Desk research</td></tr>
            <tr><td>Easy mobility</td><td>Ergonomic analysis / Market analysis</td></tr>
            <tr><td>Good organisation</td><td>User research / Functional &amp; structural / Market analysis</td></tr>
            <tr><td>Stability</td><td>Ergonomic analysis</td></tr>
            <tr><td>Low cost</td><td>Market analysis / User research</td></tr>
            <tr><td>Be safe</td><td>Market analysis / User research</td></tr>
          </tbody>
        </table>

        <h4 class="pw-subhead">House of Quality</h4>
        <p class="pw-text">
          Cross-referencing the user needs against engineering characteristics
          weights and ranks each requirement:
        </p>
        <figure class="pw-img pw-img-single">
          <img src="assets/durare/house-of-quality.png" alt="House of Quality (QFD) matrix cross-referencing user needs with engineering characteristics" loading="lazy" />
          <figcaption>The House of Quality (QFD) matrix.</figcaption>
        </figure>

        <h4 class="pw-subhead">Project requirements</h4>
        <table class="dr-table dr-table-num">
          <thead><tr><th>#</th><th>Requirement</th><th>Relevance</th><th>Target</th></tr></thead>
          <tbody>
            ${[
              ["Internal volume", 9, "38.5×10³ cm³"],
              ["Lock system", 4, "TSA locks"],
              ["Support area", 5, "600 cm²"],
              ["Weight", 8, "3.2 kg"],
              ["Material cost", 9, "Up to R$500"],
              ["Wheel diameter", 7, "8 cm"],
              ["Handle height", 6, "65-90 cm"],
              ["General dimensions", 6, "55×35×25 cm"],
              ["Number of compartments", 8, "3"],
              ["Degrees of freedom of movement", 3, "2"],
              ["Rupture stress", 4, "50 MPa"],
              ["Wheel friction (static / kinetic)", 3, "0.9 / 0.7"],
              ["Modulus of elasticity", 4, "200 MPa"],
              ["Noise", 3, "50 dB"],
              ["Access time to interior", 5, "20 s"],
            ]
              .map(
                ([req, rel, target], i) =>
                  `<tr><td>${i + 1}</td><td>${req}</td><td><span class="dr-relev" title="${rel}/10" aria-label="${rel} out of 10"><span class="dr-relev-n">${rel}</span>${Array.from(
                    { length: 10 },
                    (_, k) => `<i class="dr-dot${k < rel ? " on" : ""}"></i>`
                  ).join("")}</span></td><td>${target}</td></tr>`
              )
              .join("")}
          </tbody>
        </table>

        <h3 class="pw-subtitle">Mood boards</h3>
        <p class="pw-text">
          The inspiration boards turn the research into a visual direction: how the
          audience lives, the concepts the product should carry, and the formal
          language it should speak.
        </p>

        <h4 class="pw-subhead">Lifestyle</h4>
        <figure class="pw-img dr-board">
          <img src="assets/durare/lifestyle.png" alt="Lifestyle board for the Durare audience" loading="lazy" />
        </figure>

        <h4 class="pw-subhead">Concepts</h4>
        <p class="pw-text">Two concepts guided Durare: resilience and technology.</p>
        <div class="pw-row">
          <figure class="pw-img" style="flex: 0.935 1 0"><img src="assets/durare/resilience.png" alt="Resilience concept board" loading="lazy" /><figcaption>Resilience.</figcaption></figure>
          <figure class="pw-img" style="flex: 0.909 1 0"><img src="assets/durare/technology.png" alt="Technology concept board" loading="lazy" /><figcaption>Technology.</figcaption></figure>
        </div>

        <h4 class="pw-subhead">Product expression</h4>
        <figure class="pw-img dr-board">
          <img src="assets/durare/expression.png" alt="Product-expression board for Durare" loading="lazy" />
        </figure>

        <h3 class="pw-subtitle">Ideation</h3>
        <p class="pw-text">
          Sketching explored a range of carry-on concepts. Each one was weighed
          against the project requirements using an idea-selection method, a
          weighted decision matrix, and the strongest alternative was taken forward
          and refined into the digital sketch below.
        </p>
        <div class="dr-ideation">
          <div class="dr-ideation-grid">
            <figure class="pw-img"><img src="assets/durare/sketch1.png" alt="Concept sketch 1" loading="lazy" /></figure>
            <figure class="pw-img"><img src="assets/durare/sketch2.png" alt="Concept sketch 2" loading="lazy" /></figure>
            <figure class="pw-img"><img src="assets/durare/sketch3.png" alt="Concept sketch 3" loading="lazy" /></figure>
            <figure class="pw-img"><img src="assets/durare/sketch-final.png" alt="The chosen concept refined as a polished digital sketch" loading="lazy" /><figcaption>The chosen alternative, refined as a digital sketch.</figcaption></figure>
          </div>
        </div>

        <h3 class="pw-subtitle">Creation</h3>
        <p class="pw-text">
          With a direction chosen, the concept was turned into a real product, with
          its proportions validated, its mechanisms worked out and every part
          detailed, down to the locks and supports.
        </p>

        <p class="pw-pill">Refining the form</p>
        <p class="pw-text">
          Two early checks settled the geometry. A mock-up of the front-mounted
          telescopic handle confirmed there is no ergonomic difference compared to
          a conventional one. Since the grip and the wheels sit in the same places,
          the lever motion stays the same. To work out how far the wheels should
          extend, we needed the angle the case makes with the ground while being
          pulled. A user of average height for a Brazilian man (171&nbsp;cm), with
          the handle at a comfortable height, gives an angle of around 50°, which
          can vary by about 5° up or down depending on the user and the handle
          height.
        </p>
        <div class="pw-row">
          <figure class="pw-img" style="flex: 1.627 1 0"><img src="assets/durare/creation1.png" alt="A foam mock-up of the front telescopic handle being pulled" loading="lazy" /><figcaption>Handle mock-up, ergonomics unchanged.</figcaption></figure>
          <figure class="pw-img" style="flex: 1.575 1 0"><img src="assets/durare/creation2.png" alt="The 50-degree angle between case and ground while walking" loading="lazy" /><figcaption>≈50° between case and ground.</figcaption></figure>
        </div>
        <p class="pw-text">
          Some geometries were compared to understand how much volume the inclined
          detail on the top of the case would cost. Four inclinations were put side
          by side: 0° holds 42&nbsp;L (100%), 10° holds 40.5&nbsp;L (97%), 15° holds
          39.8&nbsp;L (95%) and 20° drops to 38.4&nbsp;L (91%). The 20° option was
          ruled out early for costing nearly 10% of the internal volume. With little
          difference between 3% and 5%, the <strong>15°</strong> option was kept,
          since it gives the best form at a modest cost.
        </p>
        <figure class="pw-img pw-img-single">
          <img src="assets/durare/creation3.png" alt="Four shell geometries compared at 0, 10, 15 and 20 degrees of top inclination" loading="lazy" />
          <figcaption>Comparing 0°, 10°, 15° and 20° of top inclination.</figcaption>
        </figure>

        <p class="pw-pill">The product</p>
        <p class="pw-text">
          And so the final product took shape, named <strong>Durare</strong>, Latin
          for "to last". The handle coming over the front face was meant to echo the
          rails on the top of off-road cars, where travel gear is usually strapped
          down, and the overall form tries to convey robustness allied with
          technology. Closed, it stands 54.5&nbsp;cm tall, 34.8&nbsp;cm wide and
          24.2&nbsp;cm deep, reaching 90&nbsp;cm with the handle extended.
        </p>
        <figure class="pw-img pw-img-single">
          <img src="assets/durare/creation10.png" alt="Durare shown closed, with the handle extended, and in side profile, with dimensions" loading="lazy" />
          <figcaption>Closed, handle extended and side profile. 54.5 × 34.8 × 24.2 cm.</figcaption>
        </figure>

        <p class="pw-pill">Telescopic handle</p>
        <p class="pw-text">
          An alternative to the usual telescopic handle was tried, using neodymium
          magnets. The advantages are large, but some care was needed, since the
          magnetic locks depend only on the force applied to the handle, and not on
          a release button like current handles use. For that, a few combinations of
          magnets and ferromagnetic materials were tested for tensile resistance, to
          reach a viable option.
        </p>
        <div class="dr-magnets">
          <div class="dr-magnets-grid">
            <div class="dr-mag">
              <div class="dr-mag-img"><img src="assets/durare/magnet1.png" alt="Two stacked 10 mm magnets" loading="lazy" /></div>
              <div class="dr-mag-body"><span class="dr-mag-n">1</span><span class="dr-mag-spec">2× Ø10 × 10 mm magnets</span><span class="dr-mag-tag pick">Chosen, extended</span></div>
            </div>
            <div class="dr-mag">
              <div class="dr-mag-img"><img src="assets/durare/magnet2.png" alt="One 10 mm magnet topped with five thin magnets" loading="lazy" /></div>
              <div class="dr-mag-body"><span class="dr-mag-n">2</span><span class="dr-mag-spec">1× Ø10 × 10 mm + 5× Ø8 × 1 mm</span><span class="dr-mag-tag out">Discarded, needs glue</span></div>
            </div>
            <div class="dr-mag">
              <div class="dr-mag-img"><img src="assets/durare/magnet3.png" alt="One 10 mm magnet with a smaller magnet on top" loading="lazy" /></div>
              <div class="dr-mag-body"><span class="dr-mag-n">3</span><span class="dr-mag-spec">1× Ø10 × 10 mm + 1× Ø5 × 8 mm</span><span class="dr-mag-tag out">Lowest resistance</span></div>
            </div>
            <div class="dr-mag">
              <div class="dr-mag-img"><img src="assets/durare/magnet4.png" alt="One 10 mm magnet with a steel nail" loading="lazy" /></div>
              <div class="dr-mag-body"><span class="dr-mag-n">4</span><span class="dr-mag-spec">1× Ø10 × 10 mm + 1× Ø7 × 12 mm nail</span><span class="dr-mag-tag pick">Chosen, retracted</span></div>
            </div>
            <div class="dr-mag">
              <div class="dr-mag-img"><img src="assets/durare/magnet5.png" alt="Two thin wide magnets that fractured under load" loading="lazy" /></div>
              <div class="dr-mag-body"><span class="dr-mag-n">5</span><span class="dr-mag-spec">2× Ø3 × 20 mm magnets</span><span class="dr-mag-tag out">Strongest, but fractured</span></div>
            </div>
          </div>
        </div>
        <p class="pw-text">
          Combination&nbsp;5 had the highest tensile resistance, but the force was so
          high that the magnet split in two, so it was discarded. Combination&nbsp;1
          came next, and combination&nbsp;3 was the weakest, while combination&nbsp;2
          was dropped for needing glue between the smaller magnets. Since the handle
          has to resist the most when it is open, <strong>combination&nbsp;1</strong>
          was chosen for the extended position, and the cheaper
          <strong>combination&nbsp;4</strong> for the retracted one. The case rolling
          on two wheels was an advantage here, since the handle then needs only two
          heights (each position adds 22.5&nbsp;cm), unlike handles for 360° spinners,
          where the case can follow the user from the side and so needs a lower
          setting too.
        </p>
        <figure class="pw-img pw-img-single" style="max-width:540px">
          <img src="assets/durare/creation4.png" alt="The telescopic handle shown retracted and at its two extended heights" loading="lazy" />
          <figcaption>Retracted and the two extended heights.</figcaption>
        </figure>

        <p class="pw-pill">Retractable wheel</p>
        <p class="pw-text">
          The retractable wheels are made of natural rubber and can extend up to
          25&nbsp;mm out of the case. They also have a hollow geometry, developed
          specifically to improve damping, which gives the case several benefits and
          solves many of the problems found during the project:
        </p>
        <ul class="pw-list">
          <li>Less prone to damage, and absorb possible impacts on the outer structure;</li>
          <li>Allow better use of the internal volume;</li>
          <li>Make no noise, and are not damaged on uneven floors;</li>
          <li>Make it possible to climb steps such as kerbs and stairs;</li>
          <li>Are simple to assemble, which makes producing them in the factory itself viable.</li>
        </ul>
        <div class="dr-wheel">
          <figure class="pw-img dr-wheel-explode">
            <img src="assets/durare/creation5.png" alt="Exploded view of the retractable wheel and its named components" loading="lazy" />
            <figcaption>Exploded view: spring, lock, trigger, rubber wheel, bearing and 6 mm axle.</figcaption>
          </figure>
          <div class="dr-wheel-mech">
            <figure class="pw-img dr-mech-fig"><img src="assets/durare/creation6.png" alt="Three-step sequence of the wheel locking mechanism" loading="lazy" /></figure>
            <ol class="dr-steps">
              <li><strong>1.</strong><span>Wheel locked.</span></li>
              <li><strong>2.</strong><span>Wheel released by the user unlocking it.</span></li>
              <li><strong>3.</strong><span>The button springs back on its own, locking the wheel at its new position.</span></li>
            </ol>
          </div>
        </div>

        <p class="pw-pill">Front pocket</p>
        <p class="pw-text">
          The front pocket is made of flexible polyethylene coated with a
          nano-regenerative fabric, which makes it far more durable than the
          compositions on the market today. It opens by zip, and its interior is
          padded with foam and lined in polyester. The inclined geometry of the case
          makes good use of this space, so the pocket splits into a quick-access part
          (passport, boarding pass, phone, earphones, glasses and other small items)
          and a notebook part (laptop, tablets, document folders, books), and it can
          open fully or only partway. A TSA lock secures it.
        </p>
        <figure class="pw-img pw-img-single" style="max-width:460px">
          <img src="assets/durare/creation7.png" alt="The front pocket opened, showing the quick-access and notebook compartments and TSA lock" loading="lazy" />
          <figcaption>Quick-access and notebook compartments, behind a TSA lock.</figcaption>
        </figure>

        <p class="pw-pill">Other accessories</p>
        <p class="pw-text">
          A set of supporting parts completes the case: four side supports and two
          bottom supports it can rest on, plastic hinges, two retractable side
          handles for lifting, and the TSA lock.
        </p>
        <figure class="pw-img pw-img-single" style="max-width:520px">
          <img src="assets/durare/creation8.png" alt="Durare with its accessories labelled: side and bottom supports, plastic hinges, retractable handles and TSA lock" loading="lazy" />
          <figcaption>Side and bottom supports, plastic hinges, retractable handles and TSA lock.</figcaption>
        </figure>

        <p class="pw-pill">In use</p>
        <p class="pw-text">
          Climbing stairs no longer means lifting the case by its handles, since the
          wheels do the work of getting it up each step.
        </p>
        <figure class="pw-img pw-img-single">
          <img src="assets/durare/creation9.png" alt="Two figures taking Durare up a flight of stairs on its wheels" loading="lazy" />
          <figcaption>The wheels carry the case up the steps.</figcaption>
        </figure>

        <h3 class="pw-subtitle">Prototype</h3>
        <p class="pw-text">
          A physical prototype brought the design into the real world. The shell and
          the parts were <strong>3D-printed</strong> and then finished by hand:
          automotive body filler smoothed some surfaces, others were sanded and
          <strong>painted</strong>, and the soft parts were sewn from
          <strong>fabric bought for both the inside and the outside</strong>, with a
          working <strong>zipper</strong> and fittings.
        </p>
        <div class="proto-make">
          <div class="proto-make-grid">
            <figure class="pw-img"><img src="assets/durare/prototype0-1.jpg" alt="3D-printed parts of the prototype" loading="lazy" /></figure>
            <figure class="pw-img"><img src="assets/durare/prototype0-2.jpg" alt="Prototype parts being filled and sanded" loading="lazy" /></figure>
            <figure class="pw-img"><img src="assets/durare/prototype0-3.jpg" alt="Painting the prototype shell" loading="lazy" /></figure>
            <figure class="pw-img"><img src="assets/durare/prototype0-4.jpg" alt="Fabric and zipper being fitted to the prototype" loading="lazy" /></figure>
          </div>
        </div>

        <h4 class="pw-subhead">The finished prototype</h4>
        <p class="pw-text">
          With every part finished and assembled, the result is the full Durare
          prototype, shown here from every angle, in use and in detail.
        </p>
        <div class="proto-mosaic">
          <figure class="pw-img"><img src="assets/durare/prototype1.jpg" alt="The finished Durare prototype" loading="lazy" /></figure>
          <figure class="pw-img"><img src="assets/durare/prototype2.jpg" alt="The finished Durare prototype" loading="lazy" /></figure>
          <figure class="pw-img"><img src="assets/durare/prototype3.jpg" alt="The finished Durare prototype" loading="lazy" /></figure>
          <figure class="pw-img"><img src="assets/durare/prototype4.jpg" alt="The finished Durare prototype" loading="lazy" /></figure>
          <figure class="pw-img"><img src="assets/durare/prototype6.jpg" alt="The finished Durare prototype" loading="lazy" /></figure>
          <figure class="pw-img"><img src="assets/durare/prototype5.jpg" alt="The finished Durare prototype" loading="lazy" /></figure>
          <figure class="pw-img"><img src="assets/durare/prototype7.jpg" alt="The finished Durare prototype" loading="lazy" /></figure>
          <figure class="pw-img proto-video"><video src="assets/durare/prototype8.mp4" autoplay loop muted playsinline></video></figure>
          <figure class="pw-img"><img src="assets/durare/prototype9.jpg" alt="The finished Durare prototype" loading="lazy" /></figure>
          <figure class="pw-img"><img src="assets/durare/prototype10.jpg" alt="The finished Durare prototype" loading="lazy" /></figure>
          <figure class="pw-img"><img src="assets/durare/prototype11.jpg" alt="The finished Durare prototype" loading="lazy" /></figure>
          <figure class="pw-img"><img src="assets/durare/prototype12.jpg" alt="The finished Durare prototype" loading="lazy" /></figure>
          <figure class="pw-img"><img src="assets/durare/prototype13.jpg" alt="The finished Durare prototype" loading="lazy" /></figure>
          <figure class="pw-img"><img src="assets/durare/prototype14.jpg" alt="The finished Durare prototype" loading="lazy" /></figure>
          <figure class="pw-img"><img src="assets/durare/prototype15.jpg" alt="The finished Durare prototype" loading="lazy" /></figure>
          <figure class="pw-img"><img src="assets/durare/prototype16.jpg" alt="The finished Durare prototype" loading="lazy" /></figure>
        </div>
      </section>
    </div>`,

  // ---------- TUFF (mechanical engineering) ----------
  // The four PRODIP phases (NEDIP-UFSC) ARE the collapsible sections. Each phase
  // opens with a short paragraph, then its PRODIP-model diagram (phase1-4.png),
  // then its subsections rendered inline as pw-pill blocks (not separately
  // collapsible). Phase 1 (Informational) is fully built from the report; phases
  // 2-4 are framed shells to be fleshed out later.
  tuff: () => {
    // 5-dot importance meter (reuses durare's .dr-relev / .dr-dot styling).
    const meter = (v) =>
      `<span class="dr-relev" title="${v}/5" aria-label="${v} out of 5"><span class="dr-relev-n">${v}</span>${Array.from(
        { length: 5 },
        (_, k) => `<i class="dr-dot${k < v ? " on" : ""}"></i>`
      ).join("")}</span>`;
    // Goal direction arrow for the specification table.
    const goal = (dir) =>
      dir === "up"
        ? `<span class="tuff-goal tuff-goal-up" title="Higher is better">▲</span>`
        : `<span class="tuff-goal tuff-goal-down" title="Lower is better">▼</span>`;

    // Conceptual phase — the five concepts (rows = partial functions, cols = C1-C5),
    // their Pugh-matrix totals, and the winning concept's solution principles.
    const CONCEPT_FNS = [
      "Bottle fixturing",
      "Working fluid",
      "Motion",
      "Thermal insulation",
      "Cooling element",
      "Power source",
      "Bottle removal",
      '"TUFF" sound',
      "User engagement",
      "Acoustic insulation",
    ];
    const CONCEPT_MATRIX = [
      ["Radial clamp", "Salt water", "Variable-speed rotation", "Polyurethane foam", "Compressor circuit", "Mains", "Manually", "Tablet", "Mini-tablet app / plate", "Acoustic foam"],
      ["Radial clamp", "Salt water", "Constant rotation", "Styrofoam", "Ice", "Battery", "Hooks", "Mini speaker", "QR code", "Glass wool"],
      ["Axial clamp", "Propylene glycol", "Alternating axial", "Styrofoam", "Peltier", "Mains", "Robotic aid", "Mechanical", "Mini-tablet app", "Acoustic foam"],
      ["Radial clamp", "Salt water", "Constant rotation", "Glass", "Ice", "Manual", "Manually", "Mechanical", "Instruction plate", "None"],
      ["Moulded base", "Salt water", "Variable-speed rotation", "Polyurethane foam", "Compressor circuit", "Mains", "Manually", "Mechanical", "QR / tablet / plate", "Glass wool"],
    ];
    const SELECTED_CONCEPT = [
      ["Bottle fixturing", "Radial clamp"],
      ["Working fluid", "Salt water"],
      ["Motion", "Variable-speed rotation"],
      ["Thermal insulation", "Polyurethane foam"],
      ["Cooling element", "Compressor circuit"],
      ["Power source", "Mains electricity"],
      ["Bottle removal", "Manually"],
      ['"TUFF" sound', "Tablet"],
      ["User engagement", "Mini-tablet app / instruction plate"],
      ["Acoustic insulation", "Acoustic foam"],
    ];

    // Preliminary phase — component lists and the five prototype bench tests.
    const PROTO_REFRIG = [
      ["Compressor", "Embraco EM U60CLP, refrigerant R-600a (isobutane); 293 W dissipation at −15 °C", "compressor.png"],
      ["Condenser", "Heat exchanger sourced from UFSC's LMPT lab", "condenser.png"],
      ["Capillary tube", "Sized in CoolPack: 1.5 m long, 0.9 mm inner diameter", "capillary-tube.jpg"],
      ["Evaporator", "Copper-tube coil (serpentine) immersed in the reservoir", "evaporator.png"],
    ];
    const OPT_REFRIG = [
      ["Compressor", "FFI 12HBX, R-134a; 586 W at −15 °C; COP 1.69; ≈ R$ 231", "compressor-chosen.png"],
      ["Condenser", "ELGIN CDE 2782, copper tubes / aluminium fins; ≈ 1318 W rejected; ≈ R$ 65", "condenser-chosen.png"],
      ["Fan", "ELGIN MM11-B (EL11), Ø161 mm; ≈ R$ 35-50", "cooler-fan.png"],
      ["Capillary tube", "1.5 m long, 0.82 mm inner diameter (CoolPack)", "capillary-tube.jpg"],
      ["Evaporator", "Copper coil, 4 m of ¼″ tube, 90 mm coil diameter; works near −15 °C", "evaporator.png"],
    ];
    const OPT_ELECTRONIC = [
      ["Controller", "Arduino UNO (ATmega328), runs the cycle", "arduino-atmega328.png"],
      ["Power supply", "MS25W-24V (Chux), 24 V, 25 W", "power-supply-ms25w.png"],
      ["Voltage regulator", "LM2596 step-down, drops 24 V to ~10-12 V for the Arduino", "voltage-regulator-lm2596.png"],
      ["H-bridge", "L298M, drives the motor and reverses its direction", "h-bridge-hl298m.png"],
      ["Temperature sensor", "LM35, replaces the thermostat, read digitally", "temp-sensor-lm35.png"],
      ["Start button", "Tactile switch, triggers the cycle", "start-button.png"],
      ["Relay", "5 V module, switches the compressor on/off", "relay.png"],
    ];
    // Prototype bench tests: coolant (ethylene glycol) start, bottle start/final, time, reversal.
    const PROTO_TESTS = [
      ["1 (compressor off)", "−13.5", "24.5", "30 s", "5 s", "19.7"],
      ["2", "−17.3", "20.2", "45 s", "3 s", "12.3"],
      ["3", "−27.5", "23.0", "45 s", "3 s", "12.3"],
      ["4", "−28.0", "23.0", "90 s", "3 s", "5.4"],
      ["5", "−27.0", "23.0", "180 s", "3 s", "−2.5"],
    ];
    // Prototype refrigeration cycle state points (CoolPack, R-600a) — Fig. 21.
    const PROTO_STATE = [
      ["1", "−9.0", "87.5", "667.0", "2.4"],
      ["2", "48.3", "469.6", "749.3", "11.5"],
      ["3", "48.3", "463.3", "749.5", "11.3"],
      ["4", "33.0", "463.3", "408.9", "540.7"],
      ["5", "33.0", "463.3", "408.9", "540.7"],
      ["6", "−15.0", "89.3", "408.9", "-"],
      ["7", "−10.0", "89.3", "665.3", "2.5"],
      ["8", "−9.0", "87.5", "667.0", "2.4"],
    ];
    // Optimized refrigeration cycle state points (CoolPack, R-134a) — Fig. 53.
    const OPT_STATE = [
      ["1", "32.8", "160.7", "278.9", "6.7"],
      ["2", "141.9", "1175.1", "375.2", "37.5"],
      ["3", "141.9", "1160.0", "375.3", "37.0"],
      ["4", "35.0", "1160.0", "98.0", "1168.2"],
      ["5", "9.4", "1160.0", "62.3", "1263.5"],
      ["6", "−15.0", "164.1", "62.3", "-"],
      ["7", "−10.0", "164.1", "242.1", "8.1"],
      ["8", "−9.5", "160.7", "242.6", "7.9"],
    ];
    // Freezing point of water vs. NaCl mass fraction (selected rows).
    const SALT_FREEZE = [
      ["0", "0", "1.002"],
      ["5", "−3.05", "1.085"],
      ["10", "−6.56", "1.193"],
      ["14", "−9.94", "1.317"],
      ["16", "−11.89", "1.388"],
      ["18", "−14.04", "1.463"],
      ["20", "−16.46", "1.557"],
      ["22", "−19.18", "1.676"],
    ];
    // Insulation thickness needed for a given allowable heat gain (side walls).
    const INSULATION = [
      ["50", "1.49"],
      ["10", "7.92"],
      ["5", "17.09"],
      ["1", "167.52"],
    ];
    // Refrigeration power for different cooling times / final temperatures.
    const PROTO_POWER = [
      ["30", "10", "17", "18564", "618.8"],
      ["30", "12", "15", "16380", "546.0"],
      ["40", "12", "15", "16380", "409.5"],
      ["30", "8", "19", "20748", "691.6"],
    ];
    // Serpentine temperature required, from the external (Taylor–Couette) analysis.
    const SERPENTINE = [
      ["60 rad/s constant", "11.8", "492", "−17.3"],
      ["Reversed every 5 s", "8.8", "583", "−14.0"],
    ];
    // Component card; shows a photo if one is supplied, else a labelled slot.
    const part = (name, spec, img) =>
      `<div class="tuff-part"><div class="tuff-part-shot${img ? "" : " placeholder-box"}">${
        img ? `<img src="assets/tuff/${img}" alt="${name}" loading="lazy" />` : `${name} - image`
      }</div><div class="tuff-part-name">${name}</div><p class="tuff-part-spec">${spec}</p></div>`;

    // ----- Detailed phase: relevant data, manufacturing costs, bill of materials -----
    const MACHINE_DATA = [
      ["Physical", "Estimated total weight", "20 kg"],
      ["Physical", "Max dimensions (Ø × height)", "350 × 500 mm"],
      ["Electrical", "Voltage", "220 V"],
      ["Performance", "Estimated cooling time (bottle)", "45 s"],
      ["Performance", "Time to chill the convection fluid", "45 min"],
    ];
    // Injection-moulded ABS parts (1 g ≈ R$ 0.0375) — name, weight (g), cost (R$).
    const MOLDED_PARTS = [
      ["Reservoir", "800", "30"],
      ["Motor plate", "60", "2"],
      ["Housing", "-", "75"],
      ["Base", "400", "15"],
      ["Electronics case", "175", "7"],
    ];
    // Zinc-coated steel parts — name, cost (R$).
    const METAL_PARTS = [
      ["Side supports (×3)", "7"],
      ["Shaft metal guard", "5"],
      ["Lower mounts", "12"],
      ["Metal cup", "20"],
    ];
    // Fasteners (Leroy Merlin price reference) — item, unit (R$), total (R$).
    const FASTENERS = [
      ["Rivet (×25)", "0.10", "2.50"],
      ["Hex nut M5 (×4)", "0.08", "0.33"],
      ["Hex nut M4 (×12)", "0.06", "0.67"],
      ["Hex nut M3 (×6)", "0.03", "0.20"],
      ["Square nut M10 (×4)", "0.20", "0.80"],
      ["Square nut M6 (×1)", "0.18", "0.18"],
      ["Screw M10 (×6)", "0.50", "3.00"],
      ["Screw M5 (×4)", "0.63", "2.50"],
      ["Screw M4 (×12)", "0.67", "8.00"],
      ["Screw M3 (×6)", "0.67", "4.00"],
      ["Washer M3 (×6)", "0.25", "1.50"],
      ["Washer M4 (×12)", "0.17", "2.00"],
      ["Washer M5 (×4)", "0.25", "1.00"],
      ["Washer M10 (×6)", "0.42", "2.50"],
    ];
    // Full bill of materials grouped by subsystem — category, item, cost (R$).
    const BOM = [
      ["Refrigeration", "Compressor, Embraco FFI 12HBX", "231.00"],
      ["Refrigeration", "Condenser, ELGIN CDE 2782", "63.60"],
      ["Refrigeration", "Fan, ELGIN EL11 micro-motor", "36.88"],
      ["Refrigeration", "Capillary tube, 1.5 m copper, 0.82 mm", "4.00"],
      ["Refrigeration", "Evaporator, 4 m of ¼″ copper tube", "33.36"],
      ["Reservoir", "Convection fluid, salt water (NaCl)", "≈ 0"],
      ["Reservoir", "Thermal insulation, Tekbond PU foam", "18.79"],
      ["Reservoir", "Thermostat, Robertshaw RC54009-4P", "30.00"],
      ["Reservoir", "Motor, ZHENG ZGB37RG geared DC", "60.21"],
      ["Electronics", "Arduino Uno", "30.00"],
      ["Electronics", "H-bridge L298M", "20.00"],
      ["Electronics", "Power supply MS25W-24V", "20.00"],
      ["Electronics", "Temperature sensor LM35", "9.00"],
      ["Electronics", "Step-down LM2596", "10.00"],
      ["Electronics", "Relay module", "10.00"],
      ["Electronics", "Tactile switch", "0.30"],
      ["Structure", "Rivets, screws, nuts &amp; washers", "29.18"],
      ["Structure", "Injection-moulded ABS parts", "129.00"],
      ["Structure", "Zinc-coated steel parts", "44.00"],
    ];

    return `
    <div class="content-wide pw-page tuff-page">
      <div class="tuff-brand">
        <img class="tuff-can-logo" src="assets/tuff/can-logo.png" alt="CAN Energy Drink" />
        <span class="tuff-wordmark">TUFF</span>
      </div>

      <p class="pw-intro">
        TUFF is a <strong>rapid beverage chiller</strong>, a mechanical-engineering
        project developed at UFSC's Department of Mechanical Engineering (2016) for
        the energy-drink brand <strong>CAN</strong>. The goal was direct: take a
        warm bottle to fridge-cold in <strong>under a minute</strong>, in a
        portable machine. A radial clamp grips the bottle and spins it at variable
        speed inside a chilled salt-water bath, while a vapour-compression circuit
        and polyurethane-foam insulation do the cooling. The whole project followed
        the <strong>PRODIP</strong> product-development methodology (NEDIP-UFSC),
        moving through four phases: Informational, Conceptual, Preliminary and
        Detailed design.
      </p>

      <div class="tuff-cover">
        <figure class="pw-img" style="flex: 2.22 1 0"><img src="assets/tuff/cover.png" alt="TUFF final product render: the CAN-branded housing, two views" loading="lazy" /></figure>
        <figure class="pw-img" style="flex: 1.71 1 0"><img src="assets/tuff/prototype-3.png" alt="The working TUFF prototype on its test bench" loading="lazy" /></figure>
      </div>

      <section class="pw-section">

        <!-- ===================== PHASE 1 ===================== -->
        <h3 class="pw-subtitle">Informational design</h3>
        <p class="pw-text">
          The opening phase of PRODIP. It captures <strong>what the user needs</strong>
          and converts those needs into measurable, prioritised <strong>project
          specifications</strong>, the spec sheet every later phase is held against.
          For TUFF that meant patent and market research, the applicable standards, and
          a House of Quality to rank the requirements.
        </p>
        <figure class="pw-img pw-img-single tuff-phase-img">
          <img src="assets/tuff/phase1.png" alt="PRODIP product-development model with the Informational Design phase highlighted" loading="lazy" />
          <figcaption>PRODIP model: Informational design highlighted.</figcaption>
        </figure>

        <p class="pw-pill">Patent research</p>
        <p class="pw-text">
          Required for legal due diligence, the patent search checked the rapid-cooling
          idea against prior art before any development, searching the
          <strong>INPI</strong> (Brazil) and <strong>Google Patents</strong> for terms
          like <em>cooper cooler</em>, <em>refrigeração de bebidas</em>,
          <em>Peltier</em> and <em>fast cooler</em>.
        </p>
        <table class="dr-table">
          <thead><tr><th>Relevant prior art</th><th>Number</th></tr></thead>
          <tbody>
            <tr><td>Apparatus &amp; method for rapid beverage refrigeration <span class="tuff-src">INPI</span></td><td>PI 0706295-8 A2</td></tr>
            <tr><td>Improvement to beverage-cooling equipment <span class="tuff-src">INPI</span></td><td>PI 0403876-2 A2</td></tr>
            <tr><td>Automatic beverage refrigerator &amp; cooling method <span class="tuff-src">INPI</span></td><td>BR 10 2014 013038 1 A2</td></tr>
            <tr><td>Portable beverage refrigerator <span class="tuff-src">INPI</span></td><td>PI 9500508-0 A2</td></tr>
            <tr><td>Food-grade liquid cooler device <span class="tuff-src">INPI</span></td><td>MU 7700757-3 Y1</td></tr>
            <tr><td>Rapid refrigeration equipment &amp; method <span class="tuff-src">Google</span></td><td>CN105115243A</td></tr>
            <tr><td>Rapid beverage cooling <span class="tuff-src">Google</span></td><td>US5505054A</td></tr>
          </tbody>
        </table>
        <div class="dr-key">No direct equivalent exists on the market, so the project was cleared to proceed, although individual concepts and methods overlap with existing patents.</div>

        <p class="pw-pill">Market research</p>
        <p class="pw-text">
          A survey of the beverage-cooler field: what exists, how efficient it is, and
          where the gap sits. Most products lean on Peltier elements and take the better
          part of an hour. Only the rotating Cooper Cooler is genuinely fast, and none
          chills a bottle in under a minute while staying portable.
        </p>
        <div class="mkt-brands">
          <div class="mkt-brand">
            <div class="mkt-logo"><span class="mkt-name">Can Cooler</span></div>
            <p class="mkt-price">8-10&nbsp;°C below ambient · ~1&nbsp;h</p>
            <p class="mkt-note">Peltier element, no compressor: silent but slow. Compact at 105 × 150 × 120&nbsp;mm, so genuinely portable.</p>
            <div class="mkt-shot"><img src="assets/tuff/canCooler.png" alt="The Can Cooler thermoelectric beverage cooler" loading="lazy" /></div>
          </div>
          <div class="mkt-brand">
            <div class="mkt-logo"><span class="mkt-name">Wine Bottle Cooler / Warmer</span></div>
            <p class="mkt-price">Two bottles · ~R$ 250</p>
            <p class="mkt-note">Peltier cooler/warmer; its differentiator is chilling two wine or champagne bottles at once, but, like the rest, slow.</p>
            <div class="mkt-shot"><img src="assets/tuff/bottleCooler.png" alt="The Wine Bottle Cooler / Warmer, holding two bottles" loading="lazy" /></div>
          </div>
          <div class="mkt-brand">
            <div class="mkt-logo"><span class="mkt-name">Thermoelectric Can Cooler &amp; Warmer</span></div>
            <p class="mkt-price">−20&nbsp;°C cool · 50-60&nbsp;°C heat</p>
            <p class="mkt-note">Thermoelectric, cools and heats, under 1&nbsp;kg, light enough for office, home or car. Versatile, but not fast.</p>
            <div class="mkt-shot"><img src="assets/tuff/thermoCanCooler.png" alt="The Thermoelectric Can Cooler & Warmer" loading="lazy" /></div>
          </div>
          <div class="mkt-brand tuff-mkt-key">
            <div class="mkt-logo"><span class="mkt-name">Cooper Cooler</span></div>
            <p class="mkt-price">Bottle in 3.5&nbsp;min · rotation</p>
            <p class="mkt-note">Spins the bottle while pouring chilled water over it. This rotating-in-water principle is the direct inspiration for TUFF, pushed under a minute. ~R$ 200-300.</p>
            <div class="mkt-shot"><img src="assets/tuff/cooperCooler.png" alt="The Cooper Cooler, which rotates the bottle in iced water" loading="lazy" /></div>
          </div>
        </div>
        <div class="dr-key">The takeaway: thermoelectric coolers are quiet but slow; only the Cooper Cooler's spin-in-water approach is fast, which pointed the concept towards forced convection by rotating the bottle in a chilled bath.</div>

        <p class="pw-pill">Standards</p>
        <p class="pw-text">
          Because the machine runs a refrigeration system, the standards search centred
          on refrigerant substances and on noise, to keep the product safe for both the
          user and the environment.
        </p>
        <table class="dr-table">
          <thead><tr><th>Standard</th><th>Scope</th></tr></thead>
          <tbody>
            <tr><td>CONAMA Resolution nº 267</td><td>Regulates ozone-depleting substances, relevant to the refrigerant gas.</td></tr>
            <tr><td>NBR 13971</td><td>Scheduled maintenance of refrigeration, air-conditioning and ventilation systems.</td></tr>
            <tr><td>NBR 10152</td><td>Noise levels for acoustic comfort: maximum noise per type of environment.</td></tr>
            <tr><td>NBR 16401</td><td>Covers compressor requirements; complies with NBR 10152.</td></tr>
            <tr><td>Lei 1916/67, Art. 5º</td><td>Maximum permitted noise for compressors.</td></tr>
          </tbody>
        </table>
        <div class="dr-key">The compressor drives the key constraint: a <strong>55&nbsp;dB</strong> noise ceiling, which later forces acoustic insulation into the design.</div>

        <p class="pw-pill">Design requirements</p>
        <p class="pw-text">
          User needs were captured and weighted, then translated into measurable
          engineering requirements through a <strong>House of Quality (QFD)</strong>.
          The ranking it produces steers the rest of the project.
        </p>
        <h4 class="pw-subhead">User requirements</h4>
        <table class="dr-table">
          <thead><tr><th>Requirement</th><th>Importance</th></tr></thead>
          <tbody>
            ${[
              ["Efficient cooling", 5],
              ["Fast process", 5],
              ["Be compact", 4],
              ["Be portable", 4],
              ["Practical usability", 4],
              ["Low noise", 3],
              ["Low cost", 2],
              ["Ergonomic", 2],
              ["Durable", 2],
              ["Good aesthetics", 2],
            ]
              .map(([req, v]) => `<tr><td>${req}</td><td>${meter(v)}</td></tr>`)
              .join("")}
          </tbody>
        </table>
        <h4 class="pw-subhead">House of Quality</h4>
        <p class="pw-text">
          Cross-referencing the user needs against engineering characteristics weights
          and ranks each requirement:
        </p>
        <figure class="pw-img pw-img-single">
          <img src="assets/tuff/house-of-quality.png" alt="House of Quality (QFD) matrix cross-referencing TUFF's user needs with engineering characteristics" loading="lazy" />
          <figcaption>The House of Quality (QFD) matrix.</figcaption>
        </figure>
        <h4 class="pw-subhead">Project requirements (ranked)</h4>
        <table class="dr-table dr-table-num">
          <thead><tr><th>#</th><th>Requirement</th></tr></thead>
          <tbody>
            ${[
              [1, "Cooling time"],
              [2, "System footprint"],
              [3, "Density"],
              [4, "Electronic-command use time"],
              [4, "Number of commands"],
              [4, "Bottle-swap time"],
              [5, "Total energy used"],
              [5, "Thermal / mechanical / chemical resistance"],
              [5, "Total volume"],
              [6, "Total weight"],
              [7, "Mechanical vibration"],
              [8, "Mechanical noise"],
              [9, "Refrigerant contact area"],
              [10, "Material cost"],
              [11, "Acoustic insulation coefficient"],
              [11, "Support area"],
              [12, "Rounded corners"],
            ]
              .map(([rank, req]) => `<tr><td>${rank}º</td><td>${req}</td></tr>`)
              .join("")}
          </tbody>
        </table>

        <p class="pw-pill">Design specifications</p>
        <p class="pw-text">
          The QFD ranking becomes concrete, measurable targets, the specification
          sheet that closes the Informational phase and feeds the conceptual work.
        </p>
        <table class="dr-table dr-table-num tuff-spec-table">
          <thead><tr><th>#</th><th>Specification</th><th>Target</th><th>Unit</th><th>Goal</th></tr></thead>
          <tbody>
            ${[
              [1, "Cooling time", "5 ≤ t ≤ 50", "s", "down"],
              [2, "System footprint", "≤ 0.24", "m²", "down"],
              [3, "Density", "179", "kg/m³", "down"],
              [4, "Electronic-command use time", "5 ≤ t ≤ 60", "s", "down"],
              [4, "Number of commands", "4", "-", "down"],
              [4, "Bottle-swap time", "≤ 10", "s", "down"],
              [5, "Total energy used", "1000", "W", "down"],
              [5, "Thermal / mech. / chemical resistance", "-", "-", "up"],
              [5, "Total volume", "0.168", "m³", "down"],
              [6, "Total weight", "≤ 30", "kg", "down"],
              [7, "Mechanical vibration", "-", "-", "down"],
              [8, "Mechanical noise", "≤ 55", "dB", "down"],
              [9, "Refrigerant contact area", "-", "-", "up"],
              [10, "Material cost", "≤ 500", "R$", "down"],
              [11, "Acoustic insulation coeff.", "-", "-", "up"],
              [11, "Support area", "400 × 600", "mm²", "down"],
              [12, "Rounded corners", "30", "%", "up"],
            ]
              .map(
                ([rank, spec, target, unit, dir]) =>
                  `<tr><td>${rank}º</td><td>${spec}</td><td>${target}</td><td>${unit}</td><td>${goal(dir)}</td></tr>`
              )
              .join("")}
          </tbody>
        </table>
        <div class="dr-key">The priority spec is <strong>cooling time</strong>: a bottle from warm to cold in 50&nbsp;s, inside a 30&nbsp;kg, R$ 500, 55&nbsp;dB envelope.</div>

        <!-- ===================== PHASE 2 ===================== -->
        <h3 class="pw-subtitle">Conceptual design</h3>
        <p class="pw-text">
          Turns the specifications into <strong>solution principles</strong>. The global
          function is decomposed into partial functions, each function gets candidate
          solutions in a morphological matrix, and the best combination is chosen with a
          Pugh matrix, producing the selected concept.
        </p>
        <figure class="pw-img pw-img-single tuff-phase-img">
          <img src="assets/tuff/phase2.png" alt="PRODIP product-development model with the Conceptual Design phase highlighted" loading="lazy" />
          <figcaption>PRODIP model: Conceptual design highlighted.</figcaption>
        </figure>

        <p class="pw-pill">Functional structure</p>
        <p class="pw-text">
          First, the thing being chilled: a 260 mL <strong>CAN Energy Drink</strong>
          bottle, a local Florianópolis (Canasvieiras) brand. Its size and shape
          (≈ 55 mm across) set the geometry the whole machine is built around.
        </p>
        <figure class="pw-img tuff-product">
          <img src="assets/tuff/tuff-bottle.jpg" alt="The 260 mL CAN Energy Drink bottle that TUFF is designed to chill" loading="lazy" />
          <figcaption>The CAN 260 mL bottle, the product TUFF is built to chill.</figcaption>
        </figure>
        <p class="pw-text">
          The starting point is the <strong>global function</strong>, <em>refrigerate
          the bottle</em>, drawn as a black box of inputs and outputs: electrical energy, a
          warm bottle and a user signal go in; heat, a cold bottle and a status signal come out.
        </p>
        <figure class="pw-img pw-img-single tuff-phase-img">
          <img src="assets/tuff/globalFunction.png" alt="Global-function black box: electrical energy, warm bottle and signal in; heat, cold bottle and signal out" loading="lazy" />
          <figcaption>Global function: refrigerate the bottle.</figcaption>
        </figure>
        <p class="pw-text">
          That global function was then decomposed into the <strong>partial
          functions</strong> the machine has to perform: transfer heat (working fluid
          and movement), generate cold (cooling element and energy source), secure and
          remove the bottle, thermal and acoustic insulation, and a sound factor (the
          signature TUFF sound and keeping the user engaged during the cycle).
        </p>
        <figure class="pw-img pw-img-single">
          <img src="assets/tuff/partialFunction.png" alt="Partial-functions tree breaking the global function into its sub-functions" loading="lazy" />
          <figcaption>Partial functions decomposed from the global function.</figcaption>
        </figure>

        <p class="pw-pill">Morphological matrix</p>
        <p class="pw-text">
          Through brainstorming and research, each partial function was given several
          candidate solution principles (PS1-PS5), laid out in a morphological matrix,
          the menu that candidate concepts are assembled from.
        </p>
        <figure class="pw-img pw-img-single">
          <img src="assets/tuff/morphologicalMatrix.png" alt="Morphological matrix mapping each partial function to candidate solution principles PS1 to PS5" loading="lazy" />
          <figcaption>Morphological matrix: solution principles per partial function.</figcaption>
        </figure>

        <p class="pw-pill">Concept selection</p>
        <p class="pw-text">
          Combining options from the matrix, the team assembled <strong>five
          concepts</strong>, each a complete set of solution principles. Concept&nbsp;1
          (highlighted) is the one that won:
        </p>
        <div class="tuff-table-scroll">
          <table class="tuff-ctable">
            <thead>
              <tr>
                <th>Function</th>
                <th class="tuff-ctable-win">Concept 1 ★</th>
                <th>Concept 2</th>
                <th>Concept 3</th>
                <th>Concept 4</th>
                <th>Concept 5</th>
              </tr>
            </thead>
            <tbody>
              ${CONCEPT_FNS.map(
                (f, i) =>
                  `<tr><th>${f}</th>${CONCEPT_MATRIX.map(
                    (c, ci) =>
                      `<td${ci === 0 ? ' class="tuff-ctable-win"' : ""}>${c[i]}</td>`
                  ).join("")}</tr>`
              ).join("")}
            </tbody>
          </table>
        </div>

        <p class="pw-text">
          Concept&nbsp;2 was taken as the reference, and all five were scored against
          weighted criteria in a <strong>Pugh matrix</strong>: durability, usability,
          low noise, cooling time, cost, safety and more. <strong>Concept&nbsp;1</strong>
          came out on top (+7), ahead of Concept&nbsp;5 (+6).
        </p>
        <figure class="pw-img pw-img-single">
          <img src="assets/tuff/pughMatrix.png" alt="Pugh matrix scoring the five concepts against weighted criteria; Concept 1 sums to the highest total" loading="lazy" />
          <figcaption>Pugh matrix: Concept&nbsp;1 scores highest.</figcaption>
        </figure>

        <h4 class="pw-subhead">Selected concept</h4>
        <p class="pw-text">
          The winning concept, chosen because rapid cooling demands a compressor
          circuit, variable-speed rotation maximises heat exchange, and salt water gives
          reasonable exchange with no toxicity:
        </p>
        <table class="tuff-selected">
          <thead><tr><th colspan="2">Concept 1 · selected</th></tr></thead>
          <tbody>
            ${SELECTED_CONCEPT.map(
              ([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`
            ).join("")}
          </tbody>
        </table>
        <div class="dr-key">In short: a radial clamp spins the bottle at variable speed in a salt-water bath chilled by a compressor circuit, wrapped in polyurethane-foam and acoustic insulation, on mains power. That is the concept carried into the preliminary phase.</div>

        <!-- ===================== PHASE 3 ===================== -->
        <h3 class="pw-subtitle">Preliminary design</h3>
        <p class="pw-text">
          Bridges concept and detail. The chosen concept becomes a real
          <strong>prototype</strong> (sized components, calculations, thermal
          simulations and bench tests), then an <strong>optimized product</strong>,
          refined towards economic viability.
        </p>
        <figure class="pw-img pw-img-single tuff-phase-img">
          <img src="assets/tuff/phase3.png" alt="PRODIP product-development model with the Preliminary Design phase highlighted" loading="lazy" />
          <figcaption>PRODIP model: Preliminary design highlighted.</figcaption>
        </figure>

        <p class="pw-pill">Prototype</p>
        <p class="pw-text">
          Because cooling time is the make-or-break spec, the team built a real working
          prototype, with heavy support from UFSC's <strong>POLO</strong> lab, to put
          numbers on the concept and surface problems before committing to the final
          design.
        </p>

        <h4 class="pw-subhead">Refrigeration circuit</h4>
        <p class="pw-text">
          A vapour-compression loop drives the whole cycle. The cycle was estimated in
          <strong>CoolPack</strong> (evaporation −15 °C, condensation 35 °C, ≈ 70 %
          isentropic efficiency), giving a <strong>COP of 2.81</strong> and sizing the
          capillary tube at <strong>1.5 m × 0.9 mm</strong> inner diameter.
        </p>
        <div class="tuff-parts">
          ${PROTO_REFRIG.map(([k, v, img]) => part(k, v, img)).join("")}
        </div>
        <figure class="pw-img pw-img-single">
          <img src="assets/tuff/refrigeration-cycle-estimate.png" alt="Estimated refrigeration cycle for the prototype on a pressure-enthalpy diagram" loading="lazy" />
          <figcaption>Estimated refrigeration cycle (CoolPack).</figcaption>
        </figure>
        <p class="pw-cap">Cycle state points (R-600a):</p>
        <table class="dr-table dr-table-num">
          <thead><tr><th>Point</th><th>T (°C)</th><th>P (kPa)</th><th>h (kJ/kg)</th><th>ρ (kg/m³)</th></tr></thead>
          <tbody>
            ${PROTO_STATE.map(
              (r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td></tr>`
            ).join("")}
          </tbody>
        </table>

        <h4 class="pw-subhead">Reservoir &amp; convection fluid</h4>
        <p class="pw-text">
          The bottle is spun inside a fluid that carries heat from its wall to the
          evaporator coil. Ethylene glycol was rejected for toxicity (it can contact the
          drink), so the prototype used a cheap, non-toxic <strong>salt-water</strong>
          (NaCl) mix. The more salt, the lower the freezing point: at ~20 % it stays
          liquid down to about −16 °C, comfortably below the coil's working temperature:
        </p>
        <div class="tuff-parts">
          ${part("Salt water (NaCl)", "Non-toxic, cheap convection fluid; freezing point tuned by salt fraction", "salt-water.png")}
        </div>
        <table class="dr-table dr-table-num">
          <thead><tr><th>NaCl (wt %)</th><th>Freezing point (°C)</th><th>Viscosity (cP)</th></tr></thead>
          <tbody>
            ${SALT_FREEZE.map(
              (r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`
            ).join("")}
          </tbody>
        </table>

        <h4 class="pw-subhead">Thermal insulation</h4>
        <p class="pw-text">
          With the compressor's limited power, heat leaking in would wreck the fast
          cooling, so the reservoir is wrapped in <strong>polyurethane foam</strong>
          (k = 0.026 W/m·K). Modelling the side wall as heat flow between two concentric
          cylinders gives the thickness needed to hold the gain to a chosen budget:
        </p>
        <div class="tuff-formula">q = 2&pi;Lk (T<sub>1</sub> &minus; T<sub>2</sub>) / ln(r<sub>2</sub> / r<sub>1</sub>)</div>
        <table class="dr-table dr-table-num">
          <thead><tr><th>Allowed gain (W)</th><th>Wall thickness (mm)</th></tr></thead>
          <tbody>
            ${INSULATION.map(([q, t]) => `<tr><td>${q}</td><td>${t}</td></tr>`).join("")}
          </tbody>
        </table>
        <p class="pw-text">
          Keeping the leak near 1 % of the ~500 W cooling power needs only ~17 mm; a
          conservative <strong>30 mm</strong> was adopted for margin.
        </p>

        <h4 class="pw-subhead">Motor &amp; rotation</h4>
        <p class="pw-text">
          A 50-second target is impossible from the compressor alone, so the bottle is
          rotated to force convection, and reversing the spin mid-cycle disrupts the
          boundary layer and boosts exchange further. The prototype used an
          <strong>Akiyama</strong> geared DC micro-motor on a DPDT switch for reversal.
        </p>
        <div class="tuff-parts">
          ${part("Akiyama geared DC motor", "300 rpm · 15 W · 8 kgf·cm · DPDT direction reversal", "akiyama-motor.png")}
        </div>
        <figure class="pw-img pw-img-single tuff-phase-img">
          <img src="assets/tuff/akiyama-motor-drawing.png" alt="Technical drawing of the Akiyama geared DC motor" loading="lazy" />
          <figcaption>Akiyama motor: technical drawing.</figcaption>
        </figure>

        <h4 class="pw-subhead">Structure &amp; build</h4>
        <p class="pw-text">
          The whole machine was modelled in <strong>Inventor</strong> (refrigeration
          circuit, reservoir, the claw/coupling that grips the bottle), then built at the
          POLO lab.
        </p>
        <div class="tuff-build">
          <div class="tuff-build-rows">
            <div class="tuff-brow">
              <figure><img src="assets/tuff/cad-1.png" alt="CAD model: refrigeration circuit" loading="lazy" /></figure>
              <figure><img src="assets/tuff/cad-2.png" alt="CAD model: reservoir" loading="lazy" /></figure>
              <figure><img src="assets/tuff/cad-3.png" alt="CAD model: claw and coupling" loading="lazy" /></figure>
            </div>
            <div class="tuff-brow">
              <figure><img src="assets/tuff/cad-4.png" alt="CAD model: full assembly without walls" loading="lazy" /></figure>
              <figure><img src="assets/tuff/cad-5.png" alt="CAD model: full assembly with walls" loading="lazy" /></figure>
              <figure><img src="assets/tuff/cad-6.png" alt="CAD model: external view" loading="lazy" /></figure>
            </div>
            <div class="tuff-brow">
              <figure><img src="assets/tuff/prototype-1.png" alt="Prototype build photo 1" loading="lazy" /></figure>
              <figure><img src="assets/tuff/prototype-2.png" alt="Prototype build photo 2" loading="lazy" /></figure>
              <figure><img src="assets/tuff/prototype-4.png" alt="Prototype build photo 4" loading="lazy" /></figure>
            </div>
          </div>
          <figure class="pw-img tuff-tall"><img src="assets/tuff/prototype-5.png" alt="Motor and coupling mounted on the bottle" loading="lazy" /></figure>
        </div>

        <h4 class="pw-subhead">Calculations</h4>
        <p class="pw-text">
          The energy to chill the drink, and the cooling power it implies for a given
          time, follow from a simple thermal-inertia balance (bottle ≈ 260 ml of water):
        </p>
        <div class="tuff-formula">Q = m · c<sub>p</sub> · &Delta;T&nbsp;&nbsp;&rarr;&nbsp;&nbsp;P = Q / t</div>
        <p class="pw-where">m = 0.260 kg&nbsp;·&nbsp;c<sub>p</sub> &approx; 4200 J/kg·K&nbsp;·&nbsp;T<sub>amb</sub> = 27 °C</p>
        <table class="dr-table dr-table-num">
          <thead><tr><th>Time (s)</th><th>T<sub>final</sub> (°C)</th><th>&Delta;T (°C)</th><th>Q (J)</th><th>Power (W)</th></tr></thead>
          <tbody>
            ${PROTO_POWER.map(
              (r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td></tr>`
            ).join("")}
          </tbody>
        </table>

        <h4 class="pw-subhead">Simulation</h4>
        <p class="pw-text">
          Heat transfer through a small rotating cylinder had no off-the-shelf formula,
          so the problem was split into two analyses in <strong>SolidWorks Flow
          Simulation</strong>: the flow inside the bottle, and the Taylor-Couette flow in
          the gap around it.
        </p>
        <p class="pw-text">
          <strong>Internal:</strong> with a fixed wall temperature, the local convection
          coefficient is <span class="tuff-inline">h = q / [A (T<sub>m</sub> &minus; T<sub>par</sub>)]</span>.
          Reversing the spin every few seconds keeps the average coefficient well above
          constant rotation:
        </p>
        <table class="dr-table">
          <thead><tr><th>Rotation</th><th>Avg. h (W/m²·K)</th></tr></thead>
          <tbody>
            <tr><th>Constant 60 rad/s</th><td>1585</td></tr>
            <tr><th>Reversed every 5 s</th><td>2187</td></tr>
          </tbody>
        </table>
        <div class="tuff-jrow">
          <figure style="--ar:0.547"><img src="assets/tuff/flowSim-1.png" alt="Flow-simulation domain: the bottle as a cylinder" loading="lazy" /></figure>
          <figure style="--ar:0.762"><img src="assets/tuff/flowSim-2.png" alt="Vorticity and temperature at t = 0.25 s" loading="lazy" /></figure>
          <figure style="--ar:0.706"><img src="assets/tuff/flowSim-3.png" alt="Vorticity and temperature at t = 1 s" loading="lazy" /></figure>
          <figure style="--ar:0.710"><img src="assets/tuff/flowSim-4.png" alt="Vorticity and temperature at t = 7 s" loading="lazy" /></figure>
          <figure style="--ar:1.509"><img src="assets/tuff/flowSim-5.png" alt="Convection coefficient over time: constant vs reversed rotation" loading="lazy" /></figure>
        </div>
        <p class="pw-text">
          <strong>External:</strong> the steady Taylor-Couette correlation gives the
          coil-surface temperature the system must reach to pull that heat out in 30 s:
        </p>
        <div class="tuff-formula">Nu<sub>d</sub> = 0.13 · Re<sub>d</sub><sup>0.53</sup>&nbsp;&nbsp;,&nbsp;&nbsp;Re<sub>d</sub> = &rho; V<sub>t</sub> d / &mu;&nbsp;&nbsp;,&nbsp;&nbsp;h<sub>ext</sub> = Nu<sub>d</sub> k<sub>f</sub> / d&nbsp;&nbsp;,&nbsp;&nbsp;T<sub>ext</sub> = T<sub>s</sub> &minus; q<sub>m</sub> / (h<sub>ext</sub> A<sub>s</sub>)</div>
        <table class="dr-table dr-table-num">
          <thead><tr><th>Rotation</th><th>Bottle final (°C)</th><th>Avg. heat (W)</th><th>Coil temp. (°C)</th></tr></thead>
          <tbody>
            ${SERPENTINE.map(
              (r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`
            ).join("")}
          </tbody>
        </table>

        <h4 class="pw-subhead">Bench tests</h4>
        <p class="pw-text">
          Five runs varied the coolant temperature, cooling time and reversal interval
          (the prototype was tested with ethylene glycol, on hand at the lab). Colder
          coolant, longer time and shorter reversal intervals all pulled more heat out:
        </p>
        <div class="tuff-table-scroll">
          <table class="tuff-ctable">
            <thead><tr><th>Test</th><th>Coolant start (°C)</th><th>Bottle start (°C)</th><th>Time</th><th>Reversal</th><th>Bottle final (°C)</th></tr></thead>
            <tbody>
              ${PROTO_TESTS.map(
                (r) => `<tr><th>${r[0]}</th>${r.slice(1).map((c) => `<td>${c}</td>`).join("")}</tr>`
              ).join("")}
            </tbody>
          </table>
        </div>
        <figure class="pw-img pw-img-single tuff-phase-img">
          <img src="assets/tuff/cooling-curve.png" alt="Bottle temperature falling over time across the bench tests" loading="lazy" />
          <figcaption>Bottle temperature vs time: the cooling is exponential.</figcaption>
        </figure>
        <div class="dr-key">The decisive finding: the prototype's 300 rpm motor was too slow (the simulations called for ~570 rpm), which set the headline change for the optimized product.</div>

        <p class="pw-pill">Optimized product</p>
        <p class="pw-text">
          With the prototype's parameters in hand (a ~500 W cooling target chief among
          them), each subsystem was reselected for performance, cost and a clean final
          layout.
        </p>

        <h4 class="pw-subhead">Refrigeration circuit</h4>
        <p class="pw-text">
          Re-run in CoolPack (evaporation −15 °C, condensation 45 °C), the optimized
          cycle sizes the capillary at <strong>1.5 m × 0.82 mm</strong> and pairs a
          stronger compressor with a matched condenser and fan.
        </p>
        <div class="tuff-parts">
          ${OPT_REFRIG.map(([k, v, img]) => part(k, v, img)).join("")}
        </div>
        <figure class="pw-img pw-img-single">
          <img src="assets/tuff/refrigeration-cycle-optimized.png" alt="Optimized refrigeration cycle on a pressure-enthalpy diagram" loading="lazy" />
          <figcaption>Optimized refrigeration cycle (CoolPack).</figcaption>
        </figure>
        <p class="pw-cap">Cycle state points (R-134a):</p>
        <table class="dr-table dr-table-num">
          <thead><tr><th>Point</th><th>T (°C)</th><th>P (kPa)</th><th>h (kJ/kg)</th><th>ρ (kg/m³)</th></tr></thead>
          <tbody>
            ${OPT_STATE.map(
              (r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td></tr>`
            ).join("")}
          </tbody>
        </table>

        <h4 class="pw-subhead">Reservoir</h4>
        <p class="pw-text">
          <strong>Salt water</strong> was confirmed as the convection fluid: glycol's
          viscosity at low temperature badly hurt the heat exchange in testing, on top of
          its toxicity. Insulation stays <strong>polyurethane foam, 30 mm</strong>, and
          the acoustic foam was dropped because the compressor ran quietly in tests.
          Temperature control and a faster motor complete the reservoir:
        </p>
        <div class="tuff-parts">
          ${part("Robertshaw RC54009-4P thermostat", "Off at −18 °C, on at −14 °C; controls the compressor", "robertshaw-rc54009.png")}
          ${part("ZHENG ZGB37RG geared motor", "600 rpm · 3.2 kgf·cm · 24 V, reaches the ~570 rpm the sims required", "zheng-zgb37rg.png")}
        </div>

        <h4 class="pw-subhead">Electronic system</h4>
        <p class="pw-text">
          The optimized product is run by an <strong>Arduino</strong>: on a button press
          it spins the motor for ~45 s while reversing direction every 2 s, and monitors
          temperature to protect the compressor (cutting it at −20 °C, restarting at
          −15 °C).
        </p>
        <div class="tuff-parts">
          ${OPT_ELECTRONIC.map(([k, v, img]) => part(k, v, img)).join("")}
        </div>
        <figure class="pw-img pw-img-single">
          <img src="assets/tuff/arduino-code.png" alt="Arduino control code for the motor and compressor" loading="lazy" />
          <figcaption>Arduino control code: motor reversal and compressor protection.</figcaption>
        </figure>
        <figure class="pw-img pw-img-single">
          <img src="assets/tuff/circuit-diagram.png" alt="Wiring diagram of the electronic system" loading="lazy" />
          <figcaption>Electronics wiring diagram.</figcaption>
        </figure>

        <h4 class="pw-subhead">Structure &amp; assembly</h4>
        <p class="pw-text">
          The coupling works like a blender: a metal cup holds the bottle, lined with
          rubbers that let the user slide the bottle in and out while gripping it during
          the spin; sealing rings on the shaft stop the fluid leaking. The reservoir
          (inner wall, outer wall, 30 mm foam between) is fixed to the housing by steel
          arms, the motor mounts underneath, and the electronics sit in a compartment at
          the back, all wrapped in a housing carrying the CAN Energy Drink branding.
        </p>
        <div class="tuff-jgallery" style="--h:215px">
          <figure><img src="assets/tuff/coupling.png" alt="Initial coupling concept between motor and bottle" loading="lazy" /></figure>
          <figure><img src="assets/tuff/can-holder.png" alt="Metal claw cage that holds and spins the bottle" loading="lazy" /></figure>
          <figure><img src="assets/tuff/motor-bottle-system.png" alt="Motor, coupling and bottle assembly in section" loading="lazy" /></figure>
          <figure><img src="assets/tuff/reservoir-internal-external.png" alt="Reservoir inner and outer walls" loading="lazy" /></figure>
          <figure><img src="assets/tuff/refrigerant-fluid-reservoir.png" alt="Reservoir holding the convection fluid" loading="lazy" /></figure>
          <figure><img src="assets/tuff/internal-assembly.png" alt="Complete system without the housing" loading="lazy" /></figure>
        </div>
        <figure class="pw-img pw-img-single">
          <img src="assets/tuff/cover.png" alt="Final product render: the CAN-branded TUFF housing, two views" loading="lazy" />
          <figcaption>Final product: the CAN-branded housing.</figcaption>
        </figure>
        <div class="dr-key">Outcome: a fully defined optimized model, with components priced and manufacturing routes identified, ready to hand off to the detailed-design phase.</div>

        <!-- ===================== PHASE 4 ===================== -->
        <h3 class="pw-subtitle">Detailed design</h3>
        <p class="pw-text">
          The closing phase documents the product for build: manufacturing notes, a
          full bill of materials with selected components, and the dimensioned technical
          drawings.
        </p>
        <figure class="pw-img pw-img-single tuff-phase-img">
          <img src="assets/tuff/phase4.png" alt="PRODIP product-development model with the Detailed Design phase highlighted" loading="lazy" />
          <figcaption>PRODIP model: Detailed design highlighted.</figcaption>
        </figure>

        <p class="pw-pill">Machine data</p>
        <p class="pw-text">The headline figures of the finished rapid chiller:</p>
        <table class="dr-table">
          <thead><tr><th>Group</th><th>Characteristic</th><th>Value</th></tr></thead>
          <tbody>
            ${(() => {
              let html = "";
              let i = 0;
              while (i < MACHINE_DATA.length) {
                const g = MACHINE_DATA[i][0];
                let j = i;
                while (j < MACHINE_DATA.length && MACHINE_DATA[j][0] === g) j++;
                for (let k = i; k < j; k++) {
                  html += "<tr>";
                  if (k === i) html += `<th rowspan="${j - i}">${g}</th>`;
                  html += `<td>${MACHINE_DATA[k][1]}</td><td>${MACHINE_DATA[k][2]}</td></tr>`;
                }
                i = j;
              }
              return html;
            })()}
          </tbody>
        </table>

        <p class="pw-pill">Manufacturing</p>
        <p class="pw-text">
          The client makes at most <strong>100 units</strong>, so the plan favours low
          tooling cost. Rotomoulding was considered but rejected for poor finish and
          waste; the plastic parts are <strong>injection-moulded in ABS</strong> (cheap,
          appliance-grade, any colour) through a third party, paying only for moulds and
          per-piece cost. The coupling parts are <strong>steel</strong> for rigidity,
          zinc-coated against salt-water corrosion.
        </p>
        <h4 class="pw-subhead">Injection-moulded ABS parts</h4>
        <table class="dr-table dr-table-num">
          <thead><tr><th>Part</th><th>Weight (g)</th><th>Cost (R$)</th></tr></thead>
          <tbody>
            ${MOLDED_PARTS.map(([p, w, c]) => `<tr><td>${p}</td><td>${w}</td><td>${c}</td></tr>`).join("")}
            <tr class="dr-total"><th>Total</th><td>1437</td><td>129</td></tr>
          </tbody>
        </table>
        <h4 class="pw-subhead">Zinc-coated steel parts</h4>
        <table class="dr-table dr-table-num">
          <thead><tr><th>Part</th><th>Cost (R$)</th></tr></thead>
          <tbody>
            ${METAL_PARTS.map(([p, c]) => `<tr><td>${p}</td><td>${c}</td></tr>`).join("")}
            <tr class="dr-total"><th>Total</th><td>44</td></tr>
          </tbody>
        </table>

        <p class="pw-pill">Bill of materials</p>
        <p class="pw-text">
          The full purchase list across all four subsystems, with the selected
          components. The whole machine comes to <strong>≈ R$ 779</strong> per unit
          (materials and parts, excluding mould tooling).
        </p>
        <table class="dr-table tuff-bom">
          <thead><tr><th>Subsystem</th><th>Item</th><th>Cost (R$)</th></tr></thead>
          <tbody>
            ${(() => {
              let html = "";
              let i = 0;
              while (i < BOM.length) {
                const cat = BOM[i][0];
                let j = i;
                while (j < BOM.length && BOM[j][0] === cat) j++;
                for (let k = i; k < j; k++) {
                  html += "<tr>";
                  if (k === i) html += `<th rowspan="${j - i}">${cat}</th>`;
                  html += `<td>${BOM[k][1]}</td><td>${BOM[k][2]}</td></tr>`;
                }
                i = j;
              }
              return html;
            })()}
            <tr class="dr-total"><th colspan="2">Total per unit</th><td>779.32</td></tr>
          </tbody>
        </table>
        <h4 class="pw-subhead">Fasteners</h4>
        <p class="pw-text">Rivets, screws, nuts and washers (price reference: Leroy Merlin):</p>
        <table class="dr-table dr-table-num">
          <thead><tr><th>Item</th><th>Unit (R$)</th><th>Total (R$)</th></tr></thead>
          <tbody>
            ${FASTENERS.map(([it, u, t]) => `<tr><td>${it}</td><td>${u}</td><td>${t}</td></tr>`).join("")}
            <tr class="dr-total"><th>Total</th><td></td><td>29.18</td></tr>
          </tbody>
        </table>

        <p class="pw-pill">Technical drawings</p>
        <p class="pw-text">
          Dimensioned drawings of every part and the full assembly close out the
          detailed design:
        </p>
        <div class="tuff-drawings">
          ${[1, 2, 3, 4, 5, 6]
            .map(
              (n) =>
                `<figure class="pw-img tuff-drawing"><img src="assets/tuff/drawing-${n}.jpg" alt="Technical drawing ${n}" loading="lazy" /></figure>`
            )
            .join("")}
        </div>
      </section>
    </div>`;
  },

  // ---------- Epicyclic Magnetic Gear (mechanical engineering) ----------
  // A single, concise page (no collapsible phases): the brand lockup, a short
  // story intro, two cover videos, a bulleted project summary, and the original
  // 21-slide talk in a simple slide viewer.
  "epicyclic-magnetic-gear": () => `
    <div class="content-wide pw-page epi-page">
      <div class="epi-brand">
        <img class="epi-njit-badge" src="assets/epicyclic-gear/njit-logo.png" alt="NJIT, New Jersey Institute of Technology" />
        <span class="epi-wordmark">Epicyclic Magnetic Gear</span>
      </div>

      <p class="pw-intro">
        This one is simpler than my other projects, but it marks a few milestones I
        think are important, which is why I'm including it here. It's a
        <strong>3D-printed magnetic epicyclic (planetary) gear</strong>: a contactless
        gearbox that transmits torque through rare-earth magnets instead of meshing
        teeth. Built in 2016 during a summer research assistantship at
        <strong>NJIT</strong> (New Jersey Institute of Technology), in a physics lab
        exploring materials and energy.
      </p>

      <div class="epi-cover">
        <figure style="flex:1.333 1 0">
          <video src="assets/epicyclic-gear/simulation.mp4" autoplay muted loop playsinline controls></video>
          <figcaption>CAD motion simulation.</figcaption>
        </figure>
        <figure style="flex:1.778 1 0">
          <video src="assets/epicyclic-gear/prototype.mp4" autoplay muted loop playsinline controls></video>
          <figcaption>The 3D-printed prototype running.</figcaption>
        </figure>
      </div>

      <p class="pw-pill">Why it's here</p>
      <ul class="pw-list epi-why">
        <li>It was my <strong>very first real 3D print</strong>, right after a tiny Batman logo to test the printer I'd just bought in the US during my mechanical-engineering exchange (2016).</li>
        <li>From zero to <strong>working prototypes in under a week</strong>, which felt genuinely magical to me and my supervisor.</li>
        <li>My advisor, <strong>Prof. Ravindra</strong>, was so impressed he bought a 3D printer for the lab, changing how it prototyped from then on.</li>
        <li>It was my <strong>first international presentation</strong>, to professors, students and visitors at an NJIT science fair.</li>
      </ul>

      <p class="pw-pill">The project</p>
      <ul class="pw-list">
        <li><strong>Problem.</strong> Mechanical gears wear: friction, lubrication, noise, maintenance. Wind-turbine gearboxes are a notorious failure point (a single one can weigh as much as ~300 people).</li>
        <li><strong>Idea.</strong> <strong>Contactless magnetic gears</strong>, where torque crosses an air gap between magnets, so there's no lubrication, no friction, no wear, near-silent running and high efficiency.</li>
        <li><strong>Design.</strong> A planetary layout with rare-earth magnets as the "teeth":
          <ul>
            <li>Ring gear: 18 magnets, Ø&nbsp;18&nbsp;cm</li>
            <li>Planet gears: ×3, 6 magnets each, Ø&nbsp;6&nbsp;cm</li>
            <li>Sun gear (output): 3 magnets, Ø&nbsp;3&nbsp;cm</li>
            <li>Carrier: the input rotor; a 24&nbsp;V DC motor runs as a generator</li>
            <li>Gear ratio: <strong>7:1</strong></li>
          </ul>
        </li>
        <li><strong>Build &amp; result.</strong> Every part 3D-printed (Original Prusa i3). The rig spun a small turbine and lit a bulb, up to <strong>1.63&nbsp;V</strong>, running without slipping to ~100&nbsp;RPM input.</li>
        <li><strong>Takeaway.</strong> As rare-earth magnets get cheaper, magnetic gears are a promising substitute for mechanical ones, part of the emerging field of MARS (magnetic augmented rotational systems).</li>
      </ul>
      <p class="pw-text epi-credit">Team: Artur Balthazar, Eduardo Pereira, Leonardo Fonto&nbsp;·&nbsp;Advisor: Prof. Ravindra Nuggehalli&nbsp;·&nbsp;NJIT, July 2016.</p>

      <p class="pw-pill">Presentation</p>
      <p class="pw-text">The original 21-slide talk. Step through it with the arrows.</p>
      <div class="epi-slider" id="epiSlider" tabindex="0" aria-label="Presentation slides">
        <div class="epi-stage">
          ${Array.from(
            { length: 21 },
            (_, k) =>
              `<img class="epi-slide${k === 0 ? " on" : ""}" src="assets/epicyclic-gear/slide-${String(
                k + 1
              ).padStart(2, "0")}.jpg?v=2" alt="Presentation slide ${k + 1}" />`
          ).join("")}
        </div>
        <div class="epi-controls">
          <button class="epi-nav epi-prev" type="button" aria-label="Previous slide">&lsaquo;</button>
          <span class="epi-counter">1 / 21</span>
          <button class="epi-nav epi-next" type="button" aria-label="Next slide">&rsaquo;</button>
        </div>
      </div>
    </div>`,

  "docol-cozy": () => `
    <div class="content-wide pw-page docol-page">
      <img class="pw-logo docol-logo" src="assets/docol/docol.png" alt="Docol" />

      <p class="pw-intro">
        DocolCozy Compact is a compact heated towel rail, developed as a
        medium-complexity product-design project at UFSC in partnership with
        <strong>Docol</strong>. The goal was to bring the comfort of a warm towel to
        the small studio apartments, with no dividers between the rooms, that are
        shaping how people live today, guided throughout by universal-design
        principles so it works for as many people as possible.
      </p>

      <div class="zenik-cover durare-cover">
        <figure class="pw-img" style="flex: 2.255 1 0"><img src="assets/docol/cover.png" alt="DocolCozy Compact concept render" loading="lazy" /></figure>
        <figure class="pw-img" style="flex: 0.75 1 0"><img src="assets/docol/prototype1.jpg" alt="The finished DocolCozy Compact prototype, in use" loading="lazy" /></figure>
      </div>

      <section class="pw-section">
        <div class="pw-group">
          <span class="pw-group-label">Research &amp; Development</span>
        </div>

        <h3 class="pw-subtitle">Briefing</h3>
        <p class="pw-text">
          The brief had two sides. The project ran in partnership with
          <strong>Docol</strong>, so the product had to fit the company, its
          identity, values and the market it competes in. The theme set by the
          course was also clear: design for <strong>reduced spaces</strong> and for
          everyone, through <strong>universal design</strong>. Everything below works
          from that brief.
        </p>

        <p class="pw-pill">The company</p>
        <p class="pw-text">
          Docol is a Brazilian sanitary-metals maker whose business is
          <em>sustainable, innovative solutions for the rational use of water</em>.
        </p>
        <div class="docol-mv">
          <div class="docol-mv-card">
            <span class="docol-mv-k">Mission</span>
            <p>Contribute to the conscious use of water through design, comfort, quality and technology, generating value for society, employees and shareholders.</p>
          </div>
          <div class="docol-mv-card">
            <span class="docol-mv-k">Vision</span>
            <p>To be a brand recognised at home and abroad for sustainable, innovative, high-quality products, with broad, effective distribution, profitability and growth.</p>
          </div>
        </div>
        <p class="dr-sub">Principles</p>
        <div class="docol-principles">
          <div class="docol-pri"><span>Customer</span><p>Continuously deepen the relationship and satisfaction.</p></div>
          <div class="docol-pri"><span>Profit</span><p>Ensure sustainable growth.</p></div>
          <div class="docol-pri"><span>Innovation</span><p>Anticipate solutions.</p></div>
          <div class="docol-pri"><span>People</span><p>Respect, develop and value them, as a driver of evolution.</p></div>
          <div class="docol-pri"><span>Docol</span><p>A brand of excellence and reliability.</p></div>
        </div>

        <p class="pw-pill">Competitor analysis</p>
        <p class="pw-text">
          Three of Docol's direct competitors set the baseline: origin, price,
          materials and warranty, plus what each one is known for.
        </p>
        <div class="cmp-cards">
          <div class="cmp-card">
            <div class="cmp-left">
              <div class="cmp-logo"><img src="assets/docol/logo-deca.png" alt="Deca" loading="lazy" /></div>
              <dl class="cmp-info">
                <div><dt>Origin</dt><dd>São Paulo</dd></div>
                <div><dt>Avg. price</dt><dd>Medium to high</dd></div>
                <div><dt>Material</dt><dd>Metal</dd></div>
                <div><dt>Warranty</dt><dd>10 years</dd></div>
              </dl>
            </div>
            <div class="cmp-body">
              <p>Docol's main competitor, with build quality similar to the brand's. Its pieces are focused on design and innovate on technology too. There is a strong presence of metal in the hydraulic parts, some of them mixing metal and rubber, and plastic only shows up in toilet seats and bathroom finishes.</p>
            </div>
          </div>

          <div class="cmp-card">
            <div class="cmp-left">
              <div class="cmp-logo"><img src="assets/docol/logo-lorenzetti.png" alt="Lorenzetti" loading="lazy" /></div>
              <dl class="cmp-info">
                <div><dt>Origin</dt><dd>São Paulo</dd></div>
                <div><dt>Avg. price</dt><dd>Low to high</dd></div>
                <div><dt>Material</dt><dd>Metal &amp; plastic</dd></div>
                <div><dt>Warranty</dt><dd>12 years</dd></div>
              </dl>
            </div>
            <div class="cmp-body">
              <p>Works in the low and mid price segment, with its main focus on hydraulics. It is best known for its showers, which are almost a synonym for quality and efficiency. It has a broad range of materials, with finishes in plastic or metal, and also a line focused on accessibility.</p>
            </div>
          </div>

          <div class="cmp-card">
            <div class="cmp-left">
              <div class="cmp-logo"><img src="assets/docol/logo-meber.png" alt="Meber" loading="lazy" /></div>
              <dl class="cmp-info">
                <div><dt>Origin</dt><dd>Bento Gonçalves</dd></div>
                <div><dt>Avg. price</dt><dd>Low to high</dd></div>
                <div><dt>Material</dt><dd>Metal</dd></div>
                <div><dt>Warranty</dt><dd>10 years</dd></div>
              </dl>
            </div>
            <div class="cmp-body">
              <p>Seen by retailers as an entry-level choice for metal taps and showers. In stores its taps sit in the low and mid range, though online it positions itself higher up. Its tap line is all metal.</p>
            </div>
          </div>
        </div>

        <p class="pw-pill">Universal design</p>
        <p class="pw-text">
          Universal design aims to make a product usable by as many people as
          possible, with no need for adaptation. Coined in 1997 by architect Ron
          Mace at North Carolina State University's Center for Universal Design,
          it's organised around seven principles.
        </p>
        <div class="ud-grid">
          <div class="ud-card"><span class="ud-n">1</span><h4>Equitable use</h4><p>Useful and marketable to people with diverse abilities, with the same means for everyone where possible.</p></div>
          <div class="ud-card"><span class="ud-n">2</span><h4>Flexibility in use</h4><p>Accommodates a wide range of preferences and abilities, for left- or right-handed users, at each user's own pace.</p></div>
          <div class="ud-card"><span class="ud-n">3</span><h4>Simple &amp; intuitive</h4><p>Easy to understand regardless of experience, knowledge, language or concentration.</p></div>
          <div class="ud-card"><span class="ud-n">4</span><h4>Perceptible information</h4><p>Communicates the essentials effectively whatever the setting or the user's senses.</p></div>
          <div class="ud-card"><span class="ud-n">5</span><h4>Tolerance for error</h4><p>Minimises hazards and the consequences of accidental or unintended actions.</p></div>
          <div class="ud-card"><span class="ud-n">6</span><h4>Low physical effort</h4><p>Usable efficiently and comfortably, with minimum fatigue.</p></div>
          <div class="ud-card"><span class="ud-n">7</span><h4>Size &amp; space for use</h4><p>Enough room to approach, reach and use it whatever the user's body, posture or mobility.</p></div>
        </div>

        <p class="pw-pill">Reduced spaces</p>
        <p class="pw-text">
          Studios, small apartments with no walls between the bedroom, living room
          and kitchen, are a growing trend in the property market of big cities
          around the world. The drivers behind them:
        </p>
        <ul class="pw-list">
          <li>More people living alone;</li>
          <li>A small home as the way into pricier neighbourhoods;</li>
          <li>Central locations that spare residents hours in traffic;</li>
          <li>Higher rental yield per square metre;</li>
          <li>More units sold per development;</li>
          <li>Relaxed parking rules, since studio buyers accept units with no parking space.</li>
        </ul>
        <div class="dr-key">The brief, in one line: a partner that prizes innovation and quality, a market with clear price/quality reference points, and a product that must serve small spaces and every kind of user.</div>

        <h3 class="pw-subtitle">User research</h3>
        ${docolUserResearchBody()}

        <h3 class="pw-subtitle">Market analysis</h3>

        <p class="pw-pill">Product definition</p>
        <div class="pdef-row">
          <p class="pw-text">
            Bringing together what came out of the audience interviews and the
            market, we saw the possibility of working with <strong>heated towel
            rails</strong>. That defined the product to design: a heated towel rail,
            for the studio bathroom, for everyone.
          </p>
          <figure class="pdef-icon"><img src="assets/docol/product-def.png" alt="Heated towel rail icon" loading="lazy" /></figure>
        </div>

        <p class="pw-pill">The market today</p>
        <p class="pw-text">The heated-towel-rail field, at home and abroad:</p>
        <div class="htr-grid">
          <div class="htr-card">
            <div class="htr-logo"><img src="assets/docol/logo-term.png" alt="Term" loading="lazy" /></div>
            <p class="htr-tag">Brazilian budget pioneer</p>
            <p class="htr-note">One of the pioneers of the category in Brazil, founded a little over 10 years ago. It stands out for the low cost of its products, thanks to carbon steel with an electrostatic-paint finish, but it offers only a couple of models.</p>
          </div>
          <div class="htr-card">
            <div class="htr-logo"><img src="assets/docol/logo-seccare.png" alt="Seccare" loading="lazy" /></div>
            <p class="htr-tag">Priciest, budget detailing</p>
            <p class="htr-note">The most expensive rails on the market, yet they use ordinary buttons like the ones on voltage stabilisers and power strips. A premium price with minimal-effort detailing.</p>
          </div>
          <div class="htr-card">
            <div class="htr-logo"><img src="assets/docol/logo-atlantic.png" alt="Atlantic" loading="lazy" /></div>
            <p class="htr-tag">Imported, feature-rich</p>
            <p class="htr-note">International brand, imported by Sudare at relatively accessible prices, with a control panel full of functions. Being tied to a reseller, though, it lacks strong brand presence in Brazil.</p>
          </div>
          <div class="htr-card">
            <div class="htr-logo"><img src="assets/docol/logo-solaire.png" alt="SolAire" loading="lazy" /></div>
            <p class="htr-tag">Wireless control</p>
            <p class="htr-note">A foreign brand whose main draw is a wireless control panel. It lets the user control the rail more easily, without bending down to a switch that is often hidden for the sake of looks.</p>
          </div>
          <div class="htr-card">
            <div class="htr-logo"><img src="assets/docol/logo-warmlyyours.png" alt="WarmlyYours" loading="lazy" /></div>
            <p class="htr-tag">Smart-home plug</p>
            <p class="htr-note">A foreign brand that bundles the WeMo smart plug, turning the rail into a device you can control from your phone through smart-home apps.</p>
          </div>
        </div>

        <p class="pw-pill">Where Docol fits</p>
        <p class="pw-text">
          Docol recently launched the <strong>DocolCozy</strong> line, with the Round
          and Square models, which differ mainly in the shape of the tubes. Each one
          is made as a single piece, and if the rail has any fault, the whole unit is
          replaced. It has an integrated timer as its only adjustable function, a
          constant temperature around 40&nbsp;°C and power use equivalent to an
          incandescent bulb. Unlike the other brands, it is made of polished stainless
          steel. Docol's main edge is in quality, simplicity and elegance.
        </p>
        <div class="docol-rails">
          <figure class="pw-img" style="flex: 0.796 1 0"><img src="assets/docol/rail-square.jpg" alt="DocolCozy Square heated towel rail" loading="lazy" /><figcaption>DocolCozy Square</figcaption></figure>
          <figure class="pw-img" style="flex: 0.808 1 0"><img src="assets/docol/rail-round.jpg" alt="DocolCozy Round heated towel rail" loading="lazy" /><figcaption>DocolCozy Round</figcaption></figure>
        </div>

        <p class="pw-pill">Opportunity</p>
        <p class="pw-text">
          Mapping every brand on cost against benefit only tells part of the story.
          Looking more closely, one thing stands out: <strong>no heated towel rail is
          genuinely innovative</strong>, in Brazil or abroad. Stretched metal bars on
          the wall are hard to make beautiful, and when you pay a high price, you
          expect more in return: more value, more usability and more aesthetics. So a
          third axis was added, <strong>innovation</strong>. On it, every competitor
          sits at nearly zero, clustered flat on the cost and benefit wall. That
          leaves the innovation space wide open, a perfect opportunity for Docol to
          take a leap over its competitors and enter the market with a genuinely
          disruptive product.
        </p>
        <div class="opp3d" id="docolOpp" aria-label="3D opportunity map: cost, benefit and innovation">
          <div class="opp3d-fallback">Cost × Benefit × Innovation map. Drag to rotate.</div>
        </div>
        <p class="opp3d-cap">Cost × Benefit × Innovation: the competitors sit flat on the cost and benefit wall (innovation ≈ 0), while Docol breaks out along the open innovation axis. <span>Drag to rotate.</span></p>

        <h3 class="pw-subtitle">Design requirements</h3>
        ${docolDesignReqBody()}

        <h3 class="pw-subtitle">Concept</h3>
        <p class="pw-text">
          The concept aimed to convey harmony and comfort, allied to the sense of
          innovation and energy that good technology brings. Two poles guided it, and
          the product had to sit where they meet.
        </p>
        <div class="cpt-poles">
          <div class="cpt-pole">
            <img class="cpt-circle" src="assets/docol/concept-comfort.jpg?v=2" alt="A person relaxing in a warm bath" loading="lazy" />
            <div class="cpt-pole-name">Comfort</div>
            <div class="cpt-tags"><span>Tranquillity</span><span>Rest</span><span>Coziness</span><span>Peace</span></div>
          </div>
          <div class="cpt-pole">
            <img class="cpt-circle" src="assets/docol/concept-tech.jpg?v=2" alt="A human hand shaking a robotic hand" loading="lazy" />
            <div class="cpt-pole-name">Technology</div>
            <div class="cpt-tags"><span>Innovation</span><span>Performance</span><span>Automation</span><span>Smart home</span></div>
          </div>
        </div>

        <h4 class="pw-subhead">Comfort, a warm bath</h4>
        <p class="pw-text">
          The warmth-and-rest pole: peace and balance, coziness and softness, the
          ease of a hot bath at the end of the day.
        </p>
        <figure class="pw-img cpt-board">
          <img src="assets/docol/comfort.jpg" alt="Comfort mood board: warm bath, rest, coziness, softness" loading="lazy" />
        </figure>

        <h4 class="pw-subhead">Technology, man &amp; machine</h4>
        <p class="pw-text">
          The innovation pole: artificial intelligence, clean energy, connected
          devices and the smart home, technology working quietly in the background.
        </p>
        <figure class="pw-img cpt-board">
          <img src="assets/docol/technology.jpg" alt="Technology mood board: AI, clean energy, smart home, connected devices" loading="lazy" />
        </figure>

        <h3 class="pw-subtitle">Ideation</h3>
        <p class="pw-text">
          Ideation focused on the right shape and tube configuration, to get the most
          usable hanging length for towels while taking up as little of a small room
          as possible. Here, "space" means the whole interaction, not just the object:
          the user is part of the product's footprint, so a design that forces a
          person to take up valuable room while using it is a poor one. Several
          arrangements were sketched and modelled to weigh that trade-off.
        </p>
        <div class="idea-stack">
          <figure><img src="assets/docol/ideation.jpg" alt="Seven tube-configuration concepts for the heated towel rail" loading="lazy" /></figure>
        </div>

        <h4 class="pw-subhead">Choosing a direction</h4>
        <p class="pw-text">
          With the seven concepts on the table, a <strong>weighted decision
          matrix</strong> scored each one from 1 to 5 across the criteria that
          mattered most, still at the concept level, not the finished design. Each
          criterion is weighted by how much it counts, and the weighted totals (out
          of 155) point the way.
        </p>
        <div class="idm-wrap">
          <table class="idm">
            <thead>
              <tr>
                <th>Concept</th>
                <th>Available Towel Length</th>
                <th>Tubes in contact with towel</th>
                <th>Contact area<span>(tube cross section)</span></th>
                <th>Universal-design fit</th>
                <th>Reduced-space fit</th>
                <th>Aesthetics</th>
                <th>Manufacturing cost</th>
                <th>Sum</th>
              </tr>
              <tr class="idm-w">
                <td>Weight</td><td>5</td><td>4</td><td>4</td><td>5</td><td>5</td><td>4</td><td>4</td><td>/155</td>
              </tr>
            </thead>
            <tbody>
              <tr><td><b>1</b> Flat wall rail, circular tubes and handrail</td><td>2</td><td>4</td><td>2</td><td>3</td><td>3</td><td>3</td><td>4</td><td>92</td></tr>
              <tr><td><b>2</b> Flat wall rail, circular tubes and handrail, 90°</td><td>2</td><td>2</td><td>1</td><td>4</td><td>2</td><td>1</td><td>5</td><td>76</td></tr>
              <tr><td><b>3</b> Double flat wall rail, rectangular tubes and handrail, 90°</td><td>4</td><td>2</td><td>3</td><td>4</td><td>2</td><td>2</td><td>3</td><td>90</td></tr>
              <tr><td><b>4</b> Triangular rail bent into the corner, circular tubes and handrail, 90°</td><td>3</td><td>2</td><td>1</td><td>4</td><td>4</td><td>1</td><td>4</td><td>87</td></tr>
              <tr><td><b>5</b> Triangular, curved corner rail, rectangular tubes, two towel runs and a wall handrail</td><td>5</td><td>3</td><td>4</td><td>5</td><td>5</td><td>4</td><td>2</td><td>127</td></tr>
              <tr><td><b>6</b> Circular corner rail, rectangular tubes, two towel runs</td><td>5</td><td>3</td><td>4</td><td>4</td><td>4</td><td>5</td><td>3</td><td>125</td></tr>
              <tr class="idm-win"><td><b>7</b> Triangular, curved corner rail, rectangular tubes, two towel runs <span class="idm-tag">Chosen</span></td><td>5</td><td>3</td><td>4</td><td>4</td><td>5</td><td>5</td><td>3</td><td>130</td></tr>
            </tbody>
          </table>
        </div>
        <p class="pw-text">
          On the weighted totals, the three corner concepts with rectangular tubes
          and a double run of towel length came clearly ahead. Concept&nbsp;7, a
          <strong>triangular, curved corner rail</strong>, came out on top with
          <strong>130/155</strong>: the rectangular section maximises the
          towel-contact area, the corner geometry frees up the room, and dropping the
          extra wall handrail (concept&nbsp;5) keeps it simpler and cheaper to make.
          That is the direction refined in Creation.
        </p>

        <h3 class="pw-subtitle">Creation</h3>
        <p class="pw-text">
          And so the chosen direction became the <strong>DocolCozy Compact</strong>,
          a heated towel rail that folds into the corner of a small bathroom.
        </p>

        <p class="pw-pill">From the DocolCozy line</p>
        <p class="pw-text">The product keeps some features already established in the DocolCozy line:</p>
        <ul class="pw-list">
          <li><strong>Single piece.</strong> Being made as a single piece supports universal-design principles 3 and 5 (intuitive use and tolerance for error). Since Docol replaces the whole unit if there is a fault, there is no need for heavy maintenance.</li>
          <li><strong>Heating.</strong> Moderate and constant (between 35 and 45&nbsp;°C), with no temperature control, which keeps it simple, intuitive and safe.</li>
          <li><strong>Timer.</strong> The one adjustable function, closely tied to Docol's vision of delivering sustainable, ecologically economical products.</li>
          <li><strong>Stainless steel.</strong> Adds to the durability and quality of the product, a strong value of the brand.</li>
        </ul>

        <p class="pw-pill">Form &amp; dimensions</p>
        <p class="pw-text">
          It joins the DocolCozy family alongside the Square and Round. It stands
          66&nbsp;cm tall, within the width of a 30&nbsp;cm ruler, with 8&nbsp;cm
          between the bars.
        </p>
        <div class="pw-row">
          <figure class="pw-img" style="flex: 0.811 1 0"><img src="assets/docol/creation1.png" alt="DocolCozy Square dimensions" loading="lazy" /><figcaption>DocolCozy Square</figcaption></figure>
          <figure class="pw-img" style="flex: 0.882 1 0"><img src="assets/docol/creation2.png" alt="DocolCozy Round dimensions" loading="lazy" /><figcaption>DocolCozy Round</figcaption></figure>
          <figure class="pw-img" style="flex: 0.942 1 0"><img src="assets/docol/creation3.png" alt="DocolCozy Compact dimensions" loading="lazy" /><figcaption>DocolCozy Compact</figcaption></figure>
        </div>
        <p class="pw-text">
          The key move is the geometry. Taking the market's average bar length of
          54&nbsp;cm, folding that same 540&nbsp;mm run into a right triangle with
          legs of just 16&nbsp;cm considerably reduces the space the product needs,
          without changing the total length in use. Rounding the corners then takes
          the usable run up to 76.5&nbsp;cm, a <strong>+40%</strong> gain over a
          straight rail.
        </p>
        <div class="pw-row">
          <figure class="pw-img" style="flex: 1.247 1 0"><img src="assets/docol/creation4.png" alt="The same 540 mm run folded into a right triangle with 16 cm legs" loading="lazy" /><figcaption>Same 540&nbsp;mm run, folded into a 16&nbsp;cm corner.</figcaption></figure>
          <figure class="pw-img" style="flex: 1.137 1 0"><img src="assets/docol/creation5.png" alt="Rounded corners raise the perimeter to 765 mm, +40%" loading="lazy" /><figcaption>Rounded corners → 765&nbsp;mm (+40%).</figcaption></figure>
        </div>
        <p class="pw-text">
          That extra length means the rail performs well not only with smaller towels,
          but even with the largest ones on the Brazilian market, which reach
          80&nbsp;cm in width.
        </p>
        <div class="pw-row" style="max-width:380px">
          <figure class="pw-img" style="flex: 0.742 1 0"><img src="assets/docol/creation6.jpg" alt="A 60 cm towel" loading="lazy" /><figcaption>60&nbsp;cm towel</figcaption></figure>
          <figure class="pw-img" style="flex: 0.748 1 0"><img src="assets/docol/creation7.jpg" alt="An 80 cm towel" loading="lazy" /><figcaption>80&nbsp;cm towel</figcaption></figure>
        </div>

        <p class="pw-pill">Solutions</p>
        <h4 class="pw-subhead">An elongated tube section</h4>
        <p class="pw-text">
          To avoid the need to zig-zag the towel between the heated bars, the tubes
          use an elongated cross-section, which optimises the contact area between bar
          and towel and makes the product easier to use.
        </p>
        <figure class="pw-img pw-img-single" style="max-width:440px"><img src="assets/docol/creation8.png" alt="Contact-area comparison across round, square and elongated tube sections" loading="lazy" /><figcaption>Contact area by tube section: the elongated profile wins.</figcaption></figure>

        <h4 class="pw-subhead">Heat that concentrates</h4>
        <p class="pw-text">
          Because the rail is almost "radial", heat from the inner face of the bars
          radiates towards the centre, concentrating warmth there and noticeably
          improving drying.
        </p>
        <figure class="pw-img pw-img-single" style="max-width:360px"><img src="assets/docol/creation9.png" alt="Heat radiating to the centre of the curved triangle" loading="lazy" /><figcaption>Heat concentrates at the centre.</figcaption></figure>

        <h4 class="pw-subhead">Mount it anywhere</h4>
        <p class="pw-text">
          With a single vertical support, the rail opens up a range of design
          possibilities for architects. It can be fixed in many different places in
          the bathroom and used at many different angles, anticipating a solution not
          yet seen in the towel-rail market and putting Docol a step ahead of the
          competition.
        </p>
        <figure class="pw-img pw-img-single" style="max-width:420px"><img src="assets/docol/creation10.jpg" alt="The rail approached from several angles around its single support" loading="lazy" /><figcaption>One support, many approach angles.</figcaption></figure>

        <h4 class="pw-subhead">A discreet wireless control</h4>
        <p class="pw-text">
          Controls should be visible, reachable, intuitive and, ideally, good-looking,
          which is a difficulty on most rails. Here it is solved with a discreet,
          elegant wireless device for the timer. It runs on a single AAA battery and
          has the same functions as the current DocolCozy rails. The Wi-Fi symbol
          refers to the Smart Home feature, covered next.
        </p>
        <figure class="pw-img pw-img-single" style="max-width:230px"><img src="assets/docol/creation11.jpg" alt="The discreet wireless timer control" loading="lazy" /><figcaption>The wireless timer control.</figcaption></figure>

        <h4 class="pw-subhead">Smart-home ready</h4>
        <p class="pw-text">
          Like other Docol devices, the rail can be controlled and monitored from a
          smartphone. Smart Home is a trend that is here to stay and a great way to
          take a step ahead of the competition, who are still taking their first steps
          in this area, adding value to the product without necessarily affecting
          production costs.
        </p>
        <figure class="pw-img pw-img-single" style="max-width:300px"><img src="assets/docol/creation12.png" alt="Controlling the rail from a smartphone app" loading="lazy" /><figcaption>Smart-home control from the phone.</figcaption></figure>

        <p class="pw-pill">In the bathroom</p>
        <p class="pw-text">
          A set of renders shows where the corner form pays off, turning awkward,
          wasted spots into a good place for a towel rail.
        </p>
        <div class="amb-grid">
          <div class="amb-card">
            <figure><img src="assets/docol/ambient1.jpg" alt="Rail tucked into the corner beside the basin" loading="lazy" /></figure>
            <h4>Borrow a corner</h4>
            <p>It can use the corners created by other fixtures, like the side of the basin, that usually go to waste.</p>
          </div>
          <div class="amb-card">
            <figure><img src="assets/docol/ambient2.jpg" alt="Rail mounted in a corner created by a wall niche" loading="lazy" /></figure>
            <h4>Plumbing niches</h4>
            <p>Small flats often have steps on the bathroom walls because of the pipework, and each one makes a corner the Compact can slot into.</p>
          </div>
          <div class="amb-card amb-tall">
            <figure><img src="assets/docol/ambient3.jpg" alt="Floor space left free beneath the rail" loading="lazy" /></figure>
            <h4>Free floor below</h4>
            <p>Unlike a flat wall rail, the space underneath stays usable, for a bin, a plant, a plunger or a laundry basket.</p>
          </div>
          <div class="amb-card">
            <figure><img src="assets/docol/ambient4.jpg" alt="A standing user reaching the rail" loading="lazy" /></figure>
            <h4>Any height</h4>
            <p>It mounts at any height to suit every body, and leaves wall free for decor, hooks, grab bars or shelves.</p>
          </div>
          <div class="amb-card">
            <figure><img src="assets/docol/ambient5.jpg" alt="A wheelchair user reaching the rail at an angle" loading="lazy" /></figure>
            <h4>Works at an angle</h4>
            <p>A wheelchair user does not have to get flush to the wall as with a flat rail, since the multi-angle form keeps it within reach.</p>
          </div>
        </div>
        <p class="pw-text">
          And the timer device itself is just <strong>7 × 4 cm</strong>, discreet
          enough to fix wherever is most convenient for the user.
        </p>
        <div class="pw-row" style="max-width:820px; margin:4px 0 22px">
          <figure class="pw-img" style="flex: 1.461 1 0"><img src="assets/docol/ambient6.jpg" alt="A hand pressing the wireless timer on the wall" loading="lazy" /></figure>
          <figure class="pw-img" style="flex: 1.285 1 0"><img src="assets/docol/ambient7.jpg" alt="A hand adjusting the timer beside the rail" loading="lazy" /></figure>
        </div>

        <h3 class="pw-subtitle">Prototype</h3>
        <p class="pw-text">
          To take the concept off the screen, a working prototype was built. The bars
          were 3D-printed and bent into shape, assembled into the corner form,
          finished and painted, and the wireless timer was put together.
        </p>

        <p class="pw-pill">The build</p>
        <div class="proto-grid">
          <figure class="pw-img"><img src="assets/docol/build1.jpg" alt="3D-printing the prototype parts" loading="lazy" /></figure>
          <figure class="pw-img"><img src="assets/docol/build2.jpg" alt="Printed tube segments" loading="lazy" /></figure>
          <figure class="pw-img"><img src="assets/docol/build3.jpg" alt="The bars assembled into the corner form" loading="lazy" /></figure>
          <figure class="pw-img"><img src="assets/docol/build5.jpg" alt="The assembled rail" loading="lazy" /></figure>
          <figure class="pw-img"><img src="assets/docol/build6.jpg" alt="Fitting the rail together by hand" loading="lazy" /></figure>
          <figure class="pw-img"><img src="assets/docol/build7.jpg" alt="The painted rail" loading="lazy" /></figure>
          <figure class="pw-img"><img src="assets/docol/build8.jpg" alt="The wireless timer device" loading="lazy" /></figure>
          <figure class="pw-img"><img src="assets/docol/build9.jpg" alt="Finishing and painting the tubes" loading="lazy" /></figure>
        </div>

        <p class="pw-pill">The finished prototype</p>
        <div class="proto-grid">
          <figure class="pw-img"><img src="assets/docol/prototype1.jpg" alt="The finished prototype with a towel" loading="lazy" /></figure>
          <figure class="pw-img"><img src="assets/docol/prototype2.jpg" alt="The prototype mounted in the corner" loading="lazy" /></figure>
          <figure class="pw-img"><img src="assets/docol/prototype3.jpg" alt="The prototype seen head-on" loading="lazy" /></figure>
          <figure class="pw-img"><img src="assets/docol/prototype4.jpg" alt="The built wireless timer device, close up" loading="lazy" /></figure>
          <figure class="pw-img"><img src="assets/docol/prototype5.jpg" alt="The timer device installed" loading="lazy" /></figure>
        </div>
      </section>
    </div>`,
};

// ---------- Actions ----------
// The CV panel slides over independently, so browsing projects/categories
// leaves it untouched — only the main-area content updates.
function selectCategory(id) {
  activeCategoryId = id;
  // Auto-select the first project in the new category.
  const cat = getCategory(id);
  activeProjectId = cat.projects.length ? cat.projects[0].id : null;
  expandedProjectId = null; // keep the sidebar project list collapsed
  renderHeader();
  renderSidebar();
  renderContent();
  renderCategorySelect(); // mobile: reflect the active category
  renderProjectSelect(); // mobile: repopulate the project picker
}

function selectProject(id) {
  activeProjectId = id;
  // Update the sidebar in place (no rebuild) so the expand/collapse animates when
  // switching from one project to another.
  updateSidebarActive();
  setSidebarExpanded(id); // animates: collapses the previous, expands the new
  renderContent();
  if (projectDD) projectDD.setCurrent(id); // mobile: keep the picker in sync
}

// Move the active highlight to the current project without rebuilding the sidebar.
function updateSidebarActive() {
  sidebarNav.querySelectorAll(".side-item").forEach((item) => {
    const row = item.querySelector(".side-row");
    if (row) row.classList.toggle("active", item.dataset.proj === activeProjectId);
  });
}

// ---------- Curriculum Vitae panel (slides in from the right) ----------
// The panel shares the viewport with the product content (roughly 50/50) and
// overlays nothing — the main area simply compresses while it's open.
const appEl = document.querySelector(".app");
const aboutToggle = document.getElementById("about-toggle");
const cvPanel = document.getElementById("cv-panel");
const cvInner = document.getElementById("cv-inner");

// Build the CV document once; toggling only slides the panel.
cvInner.innerHTML = renderCV();

function setCVOpen(open) {
  cvActive = open;
  appEl.classList.toggle("cv-open", open); // hides the skills rail while open
  cvPanel.classList.toggle("open", open);
  cvPanel.setAttribute("aria-hidden", String(!open));
  aboutToggle.classList.toggle("active", open);
  aboutToggle.setAttribute("aria-pressed", String(open));
  renderCategorySelect(); // mobile: reflect CV selection in the category picker
}

aboutToggle.addEventListener("click", () => setCVOpen(!cvActive));

// ---------- Mobile shell (category picker, project picker, info overlay) ----------
// A small custom dropdown so the menu is styled to match the site and stays on
// screen (native <select> popups render unstyled and can overflow the viewport).
const DD_CHEVRON =
  '<svg class="m-dd-chev" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';

function createDropdown(root, ariaLabel) {
  if (!root) return null;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "m-dd-btn";
  btn.setAttribute("aria-haspopup", "listbox");
  btn.setAttribute("aria-expanded", "false");
  if (ariaLabel) btn.setAttribute("aria-label", ariaLabel);
  const label = document.createElement("span");
  label.className = "m-dd-label";
  btn.appendChild(label);
  btn.insertAdjacentHTML("beforeend", DD_CHEVRON);
  const menu = document.createElement("ul");
  menu.className = "m-dd-menu";
  menu.setAttribute("role", "listbox");
  root.appendChild(btn);
  root.appendChild(menu);

  let items = [];
  let current = null;
  let onPick = () => {};

  function close() {
    root.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
  }
  function open() {
    document
      .querySelectorAll(".m-dd.open")
      .forEach((d) => d !== root && d.classList.remove("open"));
    root.classList.add("open");
    btn.setAttribute("aria-expanded", "true");
  }
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    root.classList.contains("open") ? close() : open();
  });

  function render() {
    menu.innerHTML = "";
    items.forEach((it) => {
      const li = document.createElement("li");
      li.className = "m-dd-opt" + (it.value === current ? " active" : "");
      li.setAttribute("role", "option");
      li.textContent = it.label;
      li.addEventListener("click", (e) => {
        e.stopPropagation();
        close();
        onPick(it.value);
      });
      menu.appendChild(li);
    });
    const cur = items.find((i) => i.value === current);
    label.textContent = cur ? cur.label : "";
  }

  return {
    setItems(list) { items = list; render(); },
    setCurrent(v) { current = v; render(); },
    onSelect(fn) { onPick = fn; },
    close,
  };
}

// Any outside click closes open dropdowns.
document.addEventListener("click", () =>
  document.querySelectorAll(".m-dd.open").forEach((d) => d.classList.remove("open"))
);

const CV_OPTION = "__cv__"; // sentinel value for the Curriculum Vitae entry

const categoryDD = createDropdown(
  document.getElementById("category-dd"),
  "Select category"
);
const projectDD = createDropdown(
  document.getElementById("project-dd"),
  "Select project"
);
const infoToggle = document.getElementById("info-toggle");
const infoModal = document.getElementById("info-modal");
const infoModalBody = document.getElementById("info-modal-body");
const cvClose = document.getElementById("cv-close");

if (categoryDD)
  categoryDD.onSelect((v) => {
    if (v === CV_OPTION) {
      setCVOpen(true);
    } else {
      if (cvActive) setCVOpen(false);
      selectCategory(v);
    }
  });
if (projectDD) projectDD.onSelect((v) => selectProject(v));

// Header category picker — the four categories plus a Curriculum Vitae entry.
// The currently-shown view (a category, or the CV) is the selected option.
function renderCategorySelect() {
  if (!categoryDD) return;
  const items = CATEGORIES.map((c) => ({ value: c.id, label: c.label }));
  items.push({ value: CV_OPTION, label: "Curriculum Vitae" });
  categoryDD.setItems(items);
  categoryDD.setCurrent(cvActive ? CV_OPTION : activeCategoryId);
}

// Project picker — the active category's projects.
function renderProjectSelect() {
  if (!projectDD) return;
  const cat = getCategory(activeCategoryId);
  projectDD.setItems(cat.projects.map((p) => ({ value: p.id, label: p.title })));
  projectDD.setCurrent(activeProjectId);
}

// Info overlay mirrors the current project's skills-rail content.
function openInfo() {
  infoModalBody.innerHTML = skillsPanel.innerHTML;
  infoModal.classList.add("open");
  infoModal.setAttribute("aria-hidden", "false");
}
function closeInfo() {
  infoModal.classList.remove("open");
  infoModal.setAttribute("aria-hidden", "true");
}

if (infoToggle) infoToggle.addEventListener("click", openInfo);
if (cvClose) cvClose.addEventListener("click", () => setCVOpen(false));
document
  .querySelectorAll("[data-close-info]")
  .forEach((el) => el.addEventListener("click", closeInfo));

// ---------- Init ----------
renderHeader();
renderSidebar();
renderContent();
renderCategorySelect();
renderProjectSelect();
