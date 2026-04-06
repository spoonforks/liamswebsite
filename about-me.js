const SIDE_MARGIN_CM = 2;
const TOP_BOTTOM_MARGIN_CM = 1;
const PX_PER_CM = 96 / 2.54;
const MIN_VISIBLE_TITLEBAR_WIDTH = 180;
const dragState = {
  active: false,
  hasUserMoved: false,
  left: 0,
  pointerId: null,
  startLeft: 0,
  startTop: 0,
  startX: 0,
  startY: 0,
  top: 0,
};
let hasMarkedSceneReady = false;

function getMarginPixels(cm) {
  return cm * PX_PER_CM;
}

function getWindowElements() {
  const scaleFrame = document.querySelector(".terminal-scale-frame");
  const terminalWindow = document.querySelector(".terminal-window");

  if (!scaleFrame || !terminalWindow) {
    return null;
  }

  return { scaleFrame, terminalWindow };
}

function getDragBounds(scaleFrame) {
  const titlebar = document.querySelector(".terminal-titlebar");
  const visibleTitlebarHeight = Math.min(titlebar?.getBoundingClientRect().height ?? 32, scaleFrame.offsetHeight);
  const visibleTitlebarWidth = Math.min(MIN_VISIBLE_TITLEBAR_WIDTH, scaleFrame.offsetWidth);
  const minLeft = visibleTitlebarWidth - scaleFrame.offsetWidth;
  const maxLeft = window.innerWidth - visibleTitlebarWidth;
  const minTop = visibleTitlebarHeight - scaleFrame.offsetHeight;
  const maxTop = window.innerHeight - visibleTitlebarHeight;

  return { maxLeft, maxTop, minLeft, minTop };
}

function applyFramePosition(scaleFrame, left, top) {
  const bounds = getDragBounds(scaleFrame);
  const nextLeft = Math.min(Math.max(left, bounds.minLeft), bounds.maxLeft);
  const nextTop = Math.min(Math.max(top, bounds.minTop), bounds.maxTop);

  dragState.left = nextLeft;
  dragState.top = nextTop;
  scaleFrame.style.left = `${nextLeft}px`;
  scaleFrame.style.top = `${nextTop}px`;
}

function centerFrame(scaleFrame) {
  const bounds = getDragBounds(scaleFrame);
  const centeredLeft = bounds.minLeft + (bounds.maxLeft - bounds.minLeft) / 2;
  const centeredTop = bounds.minTop + (bounds.maxTop - bounds.minTop) / 2;

  applyFramePosition(scaleFrame, centeredLeft, centeredTop);
}

function updateAboutScale() {
  const elements = getWindowElements();

  if (!elements) {
    return;
  }

  const { scaleFrame, terminalWindow } = elements;

  terminalWindow.style.transform = "scale(1)";

  const naturalWidth = terminalWindow.offsetWidth;
  const naturalHeight = terminalWindow.offsetHeight;
  const availableWidth = Math.max(window.innerWidth - getMarginPixels(SIDE_MARGIN_CM * 2), 0);
  const availableHeight = Math.max(window.innerHeight - getMarginPixels(TOP_BOTTOM_MARGIN_CM * 2), 0);
  const scale = Math.min(availableWidth / naturalWidth, availableHeight / naturalHeight, 1);

  scaleFrame.style.width = `${naturalWidth * scale}px`;
  scaleFrame.style.height = `${naturalHeight * scale}px`;
  terminalWindow.style.transform = `scale(${scale})`;

  if (dragState.hasUserMoved) {
    applyFramePosition(scaleFrame, dragState.left, dragState.top);
  } else {
    centerFrame(scaleFrame);
  }

  scaleFrame.classList.add("is-ready");
}

function markSceneReady() {
  if (hasMarkedSceneReady) {
    return;
  }

  const aboutPage = document.querySelector(".about-page");

  if (!aboutPage) {
    return;
  }

  hasMarkedSceneReady = true;
  window.requestAnimationFrame(() => {
    aboutPage.classList.add("is-scene-ready");
  });
}

function initializeAboutDrag() {
  const elements = getWindowElements();

  if (!elements) {
    return;
  }

  const { scaleFrame } = elements;
  const titlebar = document.querySelector(".terminal-titlebar");

  if (!titlebar || titlebar.dataset.dragReady === "true") {
    return;
  }

  const endDrag = () => {
    dragState.active = false;
    dragState.pointerId = null;
    titlebar.classList.remove("is-dragging");
    document.body.classList.remove("is-dragging-window");
  };

  titlebar.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || event.target.closest(".terminal-controls")) {
      return;
    }

    dragState.active = true;
    dragState.hasUserMoved = true;
    dragState.pointerId = event.pointerId;
    dragState.startLeft = dragState.left;
    dragState.startTop = dragState.top;
    dragState.startX = event.clientX;
    dragState.startY = event.clientY;

    titlebar.classList.add("is-dragging");
    document.body.classList.add("is-dragging-window");
    titlebar.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  titlebar.addEventListener("pointermove", (event) => {
    if (!dragState.active || dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    applyFramePosition(scaleFrame, dragState.startLeft + deltaX, dragState.startTop + deltaY);
  });

  titlebar.addEventListener("pointerup", (event) => {
    if (dragState.pointerId === event.pointerId) {
      endDrag();
    }
  });

  titlebar.addEventListener("pointercancel", (event) => {
    if (dragState.pointerId === event.pointerId) {
      endDrag();
    }
  });

  titlebar.dataset.dragReady = "true";
}

window.addEventListener("load", () => {
  initializeAboutDrag();
  updateAboutScale();
  markSceneReady();

  if (document.fonts?.ready) {
    document.fonts.ready.then(updateAboutScale);
  }
});

window.addEventListener("resize", updateAboutScale);
