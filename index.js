const SCENE_WIDTH = 1949;
const SCENE_HEIGHT = 1116;
const INITIAL_HEAD_DELAY_MS = 1000;
const OPENING_ANIMATION_MS = 2000;
const OPENING_HOLD_MS = 1000;
const PROJECTOR_STATUS_WORDS = ["Work in", "Progress"];
const PROJECTOR_STATUS_INTERVAL_MS = 1000;
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

function startProjectorStatusCycle() {
  const statusNode = document.querySelector(".screen-status-text");

  if (!statusNode) {
    return;
  }

  let currentIndex = 0;
  statusNode.textContent = PROJECTOR_STATUS_WORDS[currentIndex];

  window.setInterval(() => {
    currentIndex = (currentIndex + 1) % PROJECTOR_STATUS_WORDS.length;
    statusNode.textContent = PROJECTOR_STATUS_WORDS[currentIndex];
  }, PROJECTOR_STATUS_INTERVAL_MS);
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

window.addEventListener("load", async () => {
  updateSceneScale();
  startProjectorStatusCycle();
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
