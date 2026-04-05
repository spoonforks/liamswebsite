const SIDE_MARGIN_CM = 2;
const TOP_BOTTOM_MARGIN_CM = 1;
const PX_PER_CM = 96 / 2.54;

function getMarginPixels(cm) {
  return cm * PX_PER_CM;
}

function updateAboutScale() {
  const scaleFrame = document.querySelector(".terminal-scale-frame");
  const terminalWindow = document.querySelector(".terminal-window");

  if (!scaleFrame || !terminalWindow) {
    return;
  }

  terminalWindow.style.transform = "scale(1)";

  const naturalWidth = terminalWindow.offsetWidth;
  const naturalHeight = terminalWindow.offsetHeight;
  const availableWidth = Math.max(window.innerWidth - getMarginPixels(SIDE_MARGIN_CM * 2), 0);
  const availableHeight = Math.max(window.innerHeight - getMarginPixels(TOP_BOTTOM_MARGIN_CM * 2), 0);
  const scale = Math.min(availableWidth / naturalWidth, availableHeight / naturalHeight, 1);

  scaleFrame.style.width = `${naturalWidth * scale}px`;
  scaleFrame.style.height = `${naturalHeight * scale}px`;
  terminalWindow.style.transform = `scale(${scale})`;
  scaleFrame.classList.add("is-ready");
}

window.addEventListener("load", () => {
  updateAboutScale();

  if (document.fonts?.ready) {
    document.fonts.ready.then(updateAboutScale);
  }
});

window.addEventListener("resize", updateAboutScale);
