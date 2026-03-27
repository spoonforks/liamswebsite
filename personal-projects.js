const elevatorShell = document.querySelector("#elevator-shell");
const indicatorValue = document.querySelector("#indicator-value");
const statusLabel = document.querySelector("#elevator-status");
const floorButtons = Array.from(document.querySelectorAll(".floor-button"));
const floorPanels = Array.from(document.querySelectorAll(".floor-panel-content"));

const DOOR_DURATION_MS = 850;
const TRAVEL_PAUSE_MS = 1000;

let currentFloor = null;
let isCycling = false;
let pendingFloor = null;

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function setIndicator(value) {
  indicatorValue.textContent = value ?? "--";
}

function setSelectedButton(floor) {
  floorButtons.forEach((button) => {
    const isSelected = button.dataset.floor === String(floor);
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
}

function showFloorPanel(floor) {
  floorPanels.forEach((panel) => {
    panel.hidden = panel.dataset.floor !== String(floor);
  });
}

async function runElevatorCycle(floor) {
  if (isCycling) {
    pendingFloor = floor;
    return;
  }

  if (currentFloor === floor && elevatorShell.classList.contains("is-open")) {
    return;
  }

  isCycling = true;
  pendingFloor = null;

  const startingFromOpen = elevatorShell.classList.contains("is-open");

  setSelectedButton(floor);
  setIndicator(floor);
  elevatorShell.classList.add("is-moving");
  statusLabel.textContent = startingFromOpen
    ? `Traveling to floor ${floor}.`
    : `Calling floor ${floor}.`;

  if (startingFromOpen) {
    elevatorShell.classList.remove("is-open");
    await wait(DOOR_DURATION_MS);
  }

  await wait(TRAVEL_PAUSE_MS);

  showFloorPanel(floor);
  elevatorShell.classList.add("is-open");
  statusLabel.textContent = `Floor ${floor} open.`;

  await wait(DOOR_DURATION_MS);

  currentFloor = floor;
  elevatorShell.classList.remove("is-moving");
  isCycling = false;

  // Keep only the latest floor request if buttons are pressed during motion.
  if (pendingFloor !== null && pendingFloor !== currentFloor) {
    const nextFloor = pendingFloor;
    pendingFloor = null;
    runElevatorCycle(nextFloor);
  }
}

floorButtons.forEach((button) => {
  button.addEventListener("click", () => {
    runElevatorCycle(button.dataset.floor);
  });
});

window.addEventListener("keydown", (event) => {
  if (event.key === "1" || event.key === "2" || event.key === "3") {
    runElevatorCycle(event.key);
  }
});

const params = new URLSearchParams(window.location.search);
const initialFloor = params.get("floor");
const instantPreview = params.get("instant") === "1";

if (initialFloor === "1" || initialFloor === "2" || initialFloor === "3") {
  if (instantPreview) {
    showFloorPanel(initialFloor);
    setSelectedButton(initialFloor);
    setIndicator(initialFloor);
    statusLabel.textContent = `Floor ${initialFloor} open.`;
    elevatorShell.classList.add("is-open");
    currentFloor = initialFloor;
  } else {
    runElevatorCycle(initialFloor);
  }
}
