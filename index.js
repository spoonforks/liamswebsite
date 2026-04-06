const SCENE_WIDTH = 1949;
const SCENE_HEIGHT = 1116;
const INITIAL_HEAD_DELAY_MS = 1000;
const OPENING_ANIMATION_MS = 2000;
const OPENING_HOLD_MS = 1000;
const PROJECTOR_STATUS_TERMS = [
  "AI",
  "Design",
  "Systems Thinking",
  "Python",
  "Data Science",
  "Human Computer Interaction",
  "Innovation",
  "Technology",
  "Music",
  "Urbanism",
  "Ethics",
  "Sustainability",
  "Interdisciplinary Collaboration",
  "Problem Solving",
  "Research",
];
const PROJECTOR_STATUS_SEPARATOR = "  ][  ";
const PROJECTOR_STATUS_SCROLL_SPEED_PX_PER_SECOND = 112;
const PROJECTOR_STATUS_REPEAT_COUNT = 4;
const FLICKER_STEPS = [
  [0, 1, 0.85],
  [70, 0.28, 0.88],
  [150, 0.94, 0.95],
  [240, 0.16, 0.87],
  [340, 0.76, 0.97],
  [450, 0.22, 0.91],
  [580, 1, 1],
];

function preloadImage(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = resolve;
    image.onerror = resolve;
    image.src = src;
  });
}

function restartGif(node) {
  const replacement = node.cloneNode(false);
  replacement.src = node.dataset.src;
  replacement.alt = node.alt;
  replacement.className = node.className;
  node.replaceWith(replacement);
  return replacement;
}

function updateSceneScale() {
  const widthScale = window.innerWidth / SCENE_WIDTH;
  const heightScale = window.innerHeight / SCENE_HEIGHT;
  const nextScale = Math.min(widthScale, heightScale, 1);
  document.documentElement.style.setProperty("--scene-scale", String(nextScale));
}

function shuffleProjectorStatusTerms() {
  const shuffledTerms = [...PROJECTOR_STATUS_TERMS];

  for (let index = shuffledTerms.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffledTerms[index], shuffledTerms[swapIndex]] = [shuffledTerms[swapIndex], shuffledTerms[index]];
  }

  return shuffledTerms;
}

function applyProjectorStatusTicker(trackNode, textNodes) {
  const tickerText = `${shuffleProjectorStatusTerms().join(PROJECTOR_STATUS_SEPARATOR)}${PROJECTOR_STATUS_SEPARATOR}`;

  for (const node of textNodes) {
    node.textContent = tickerText;
  }

  window.requestAnimationFrame(() => {
    const scrollWidth = Math.ceil(textNodes[0].getBoundingClientRect().width);
    const duration = Math.max(scrollWidth / PROJECTOR_STATUS_SCROLL_SPEED_PX_PER_SECOND, 18);
    trackNode.style.setProperty("--status-scroll-width", `${scrollWidth}px`);
    trackNode.style.animationDuration = `${duration}s`;
  });
}

function startProjectorStatusCycle() {
  const trackNode = document.querySelector(".screen-status-track");

  if (!trackNode) {
    return;
  }

  const existingNodes = [...trackNode.querySelectorAll(".screen-status-text")];

  for (let index = existingNodes.length; index < PROJECTOR_STATUS_REPEAT_COUNT; index += 1) {
    const duplicateNode = existingNodes[0].cloneNode(false);
    duplicateNode.setAttribute("aria-hidden", "true");
    trackNode.appendChild(duplicateNode);
  }

  const textNodes = [...trackNode.querySelectorAll(".screen-status-text")];

  if (textNodes.length < 2) {
    return;
  }

  applyProjectorStatusTicker(trackNode, textNodes);
}

function triggerBeamFlicker(node) {
  for (const [delay, opacity] of FLICKER_STEPS) {
    window.setTimeout(() => {
      node.style.opacity = String(opacity);
    }, delay);
  }
}

function triggerProjectorContentFlicker(node) {
  node.classList.add("is-projecting");

  for (const [delay, , opacity] of FLICKER_STEPS) {
    window.setTimeout(() => {
      node.style.opacity = String(opacity);
    }, delay);
  }
}

function initializeSiteInfoPanel() {
  const toggleButton = document.querySelector(".site-info-toggle");
  const panel = document.querySelector(".site-info-panel");
  const closeButton = document.querySelector(".site-info-close");

  if (!toggleButton || !panel || !closeButton) {
    return;
  }

  const setPanelOpen = (isOpen) => {
    panel.hidden = !isOpen;
    toggleButton.setAttribute("aria-expanded", String(isOpen));
  };

  toggleButton.addEventListener("click", () => {
    setPanelOpen(panel.hidden);
  });

  closeButton.addEventListener("click", () => {
    setPanelOpen(false);
  });
}

window.addEventListener("load", async () => {
  updateSceneScale();
  startProjectorStatusCycle();
  initializeSiteInfoPanel();
  const figure = document.querySelector(".cowboy-figure");
  const projectorContent = document.querySelector(".screen-content");

  if (!figure || !projectorContent) {
    return;
  }

  const stillHead = figure.querySelector(".cowboy-head--still");
  let openingHead = figure.querySelector(".cowboy-head--opening");
  const openingHold = figure.querySelector(".cowboy-head--hold");
  let finalHead = figure.querySelector(".cowboy-head--final");
  const eyeBeams = figure.querySelector(".cowboy-beams");
  const preloadSources = [
    openingHead.dataset.src,
    openingHold.currentSrc || openingHold.src,
    finalHead.dataset.src,
    eyeBeams.currentSrc || eyeBeams.src,
  ];

  await Promise.all(preloadSources.map(preloadImage));

  window.setTimeout(() => {
    stillHead.classList.remove("is-active");
    openingHead = restartGif(openingHead);
    openingHead.classList.add("is-active");

    window.setTimeout(() => {
      openingHead.classList.remove("is-active");
      openingHold.classList.add("is-active");

      window.setTimeout(() => {
        openingHold.classList.remove("is-active");
        finalHead = restartGif(finalHead);
        finalHead.classList.add("is-active");
        triggerBeamFlicker(eyeBeams);
        triggerProjectorContentFlicker(projectorContent);
      }, OPENING_HOLD_MS);
    }, OPENING_ANIMATION_MS);
  }, INITIAL_HEAD_DELAY_MS);
});

window.addEventListener("resize", updateSceneScale);
