const scene = document.querySelector("[data-scene]");
const world = document.querySelector("[data-world]");

if (!scene || !world) {
  throw new Error("Museum scene elements were not found.");
}

const room = {
  width: 1440,
  depth: 1080,
  height: 560,
};

const camera = {
  baseZ: -1180,
  pitch: 0,
};

const player = {
  x: -40,
  y: room.height / 2 - 152,
  z: -room.depth / 2 + 230,
  yaw: 0.26,
  radius: 44,
  walkSpeed: 340,
  turnSpeed: 1.9,
};

const keys = new Set();
const obstacles = [];
let lastTime = performance.now();

// Swap `imageSrc: null` for real image file paths later and the frames will update automatically.
const artworkFrames = [
  { label: "Academic Work 01", wall: "left", offset: -330, fromFloor: 272, width: 220, height: 144, imageSrc: null },
  { label: "Academic Work 02", wall: "left", offset: 0, fromFloor: 272, width: 220, height: 144, imageSrc: null },
  { label: "Academic Work 03", wall: "left", offset: 330, fromFloor: 272, width: 220, height: 144, imageSrc: null },
  { label: "Academic Work 04", wall: "right", offset: -330, fromFloor: 272, width: 220, height: 144, imageSrc: null },
  { label: "Academic Work 05", wall: "right", offset: 0, fromFloor: 272, width: 220, height: 144, imageSrc: null },
  { label: "Academic Work 06", wall: "right", offset: 330, fromFloor: 272, width: 220, height: 144, imageSrc: null },
  { label: "Academic Work 07", wall: "back", offset: -240, fromFloor: 286, width: 248, height: 156, imageSrc: null },
  { label: "Academic Work 08", wall: "back", offset: 240, fromFloor: 286, width: 248, height: 156, imageSrc: null },
];

buildMuseum();
bindControls();
updateCamera();
requestAnimationFrame(render);

function buildMuseum() {
  world.replaceChildren();
  obstacles.length = 0;

  const floorY = room.height / 2;
  const ceilingY = -room.height / 2;
  const frontZ = -room.depth / 2;
  const backZ = room.depth / 2;
  const leftX = -room.width / 2;
  const rightX = room.width / 2;

  addSurface({
    className: "museum-surface museum-floor",
    width: room.width,
    height: room.depth,
    x: 0,
    y: floorY,
    z: 0,
    rx: 90,
  });

  addSurface({
    className: "museum-surface museum-runner",
    width: 480,
    height: 780,
    x: 0,
    y: floorY - 2,
    z: 72,
    rx: 90,
  });

  addSurface({
    className: "museum-surface museum-ceiling",
    width: room.width,
    height: room.depth,
    x: 0,
    y: ceilingY,
    z: 0,
    rx: -90,
  });

  addSurface({
    className: "museum-surface museum-wall museum-wall-front",
    width: room.width,
    height: room.height,
    x: 0,
    y: 0,
    z: frontZ,
    ry: 0,
  });

  addSurface({
    className: "museum-surface museum-wall museum-wall-back",
    width: room.width,
    height: room.height,
    x: 0,
    y: 0,
    z: backZ,
    ry: 180,
  });

  addSurface({
    className: "museum-surface museum-wall museum-wall-left",
    width: room.depth,
    height: room.height,
    x: leftX,
    y: 0,
    z: 0,
    ry: 90,
  });

  addSurface({
    className: "museum-surface museum-wall museum-wall-right",
    width: room.depth,
    height: room.height,
    x: rightX,
    y: 0,
    z: 0,
    ry: -90,
  });

  addTrim();
  addLightRow();
  addBenches();
  addPedestals();
  addCornerColumns();
  addFrames();
}

function addTrim() {
  const floorY = room.height / 2;
  const ceilingY = -room.height / 2;

  const trimPieces = [
    { width: room.width, height: 26, depth: 26, x: 0, y: floorY - 13, z: room.depth / 2 - 13 },
    { width: room.width, height: 26, depth: 26, x: 0, y: floorY - 13, z: -room.depth / 2 + 13 },
    { width: 26, height: 26, depth: room.depth, x: room.width / 2 - 13, y: floorY - 13, z: 0 },
    { width: 26, height: 26, depth: room.depth, x: -room.width / 2 + 13, y: floorY - 13, z: 0 },
    { width: room.width, height: 18, depth: 20, x: 0, y: ceilingY + 9, z: room.depth / 2 - 10 },
    { width: room.width, height: 18, depth: 20, x: 0, y: ceilingY + 9, z: -room.depth / 2 + 10 },
    { width: 20, height: 18, depth: room.depth, x: room.width / 2 - 10, y: ceilingY + 9, z: 0 },
    { width: 20, height: 18, depth: room.depth, x: -room.width / 2 + 10, y: ceilingY + 9, z: 0 },
  ];

  trimPieces.forEach((piece) => {
    addBox({
      ...piece,
      className: "museum-box museum-trim",
    });
  });
}

function addLightRow() {
  [-320, -120, 80, 280, 480].forEach((z) => {
    addSurface({
      className: "museum-surface museum-light-pool",
      width: 380,
      height: 220,
      x: 0,
      y: room.height / 2 - 6,
      z,
      rx: 90,
    });

    addSurface({
      className: "museum-surface museum-light-fixture",
      width: 78,
      height: 78,
      x: 0,
      y: -room.height / 2 + 22,
      z,
      rx: -90,
    });
  });
}

function addBenches() {
  addBench(0, 70);
  addBench(0, -190);
}

function addBench(x, z) {
  const floorY = room.height / 2;

  addBox({
    className: "museum-box museum-bench",
    width: 264,
    height: 42,
    depth: 96,
    x,
    y: floorY - 30,
    z,
  });

  addBox({
    className: "museum-box museum-bench-base",
    width: 212,
    height: 34,
    depth: 54,
    x,
    y: floorY - 68,
    z,
  });

  registerObstacle(x, z, 300, 132);
}

function addPedestals() {
  addPedestal(-420, -20);
  addPedestal(420, 190);
}

function addPedestal(x, z) {
  const floorY = room.height / 2;

  addBox({
    className: "museum-box museum-pedestal",
    width: 112,
    height: 170,
    depth: 112,
    x,
    y: floorY - 85,
    z,
  });

  addBox({
    className: "museum-box museum-pedestal",
    width: 132,
    height: 18,
    depth: 132,
    x,
    y: floorY - 178,
    z,
  });

  addOrb({
    x,
    y: floorY - 240,
    z,
    size: 62,
  });

  registerObstacle(x, z, 150, 150);
}

function addCornerColumns() {
  const floorY = room.height / 2;
  const columnOffsetX = room.width / 2 - 120;
  const columnOffsetZ = room.depth / 2 - 120;

  [
    [-columnOffsetX, -columnOffsetZ],
    [columnOffsetX, -columnOffsetZ],
    [-columnOffsetX, columnOffsetZ],
    [columnOffsetX, columnOffsetZ],
  ].forEach(([x, z]) => {
    addBox({
      className: "museum-box museum-column",
      width: 74,
      height: 260,
      depth: 74,
      x,
      y: floorY - 130,
      z,
    });
  });
}

function addFrames() {
  artworkFrames.forEach((frameConfig) => {
    world.appendChild(createFrame(frameConfig));
  });
}

function createFrame(config) {
  const frame = document.createElement("article");
  frame.className = "museum-frame";
  frame.style.width = `${config.width}px`;
  frame.style.height = `${config.height}px`;
  frame.style.left = `${-config.width / 2}px`;
  frame.style.top = `${-config.height / 2}px`;

  const y = room.height / 2 - config.fromFloor;
  const wallInset = 4;
  let x = 0;
  let z = 0;
  let ry = 0;

  if (config.wall === "left") {
    x = -room.width / 2 + wallInset;
    z = config.offset;
    ry = 90;
  } else if (config.wall === "right") {
    x = room.width / 2 - wallInset;
    z = config.offset;
    ry = -90;
  } else if (config.wall === "back") {
    x = config.offset;
    z = room.depth / 2 - wallInset;
    ry = 0;
  } else {
    x = config.offset;
    z = -room.depth / 2 + wallInset;
    ry = 180;
  }

  frame.style.transform = `${composeTransform({ x, y, z, ry })} translateZ(22px)`;

  const shell = document.createElement("div");
  shell.className = "museum-frame-shell";
  shell.style.width = `${config.width}px`;
  shell.style.height = `${config.height}px`;
  frame.appendChild(shell);

  const art = document.createElement("div");
  art.className = "museum-frame-art";
  art.style.left = "16px";
  art.style.top = "16px";
  art.style.width = `${config.width - 32}px`;
  art.style.height = `${config.height - 32}px`;
  art.dataset.hasImage = config.imageSrc ? "true" : "false";

  if (config.imageSrc) {
    art.style.backgroundImage = `linear-gradient(rgba(255,255,255,0.08), rgba(255,255,255,0.08)), url("${config.imageSrc}")`;
    art.setAttribute("aria-label", config.label);
  } else {
    art.innerHTML = `<div><strong>${config.label}</strong><span>Reserved for upcoming academic work</span></div>`;
  }

  frame.appendChild(art);

  const plaqueWidth = Math.max(150, config.width - 46);
  const plaque = document.createElement("div");
  plaque.className = "museum-frame-plaque";
  plaque.textContent = config.label;
  plaque.style.width = `${plaqueWidth}px`;
  plaque.style.height = "32px";
  plaque.style.left = `${(config.width - plaqueWidth) / 2}px`;
  plaque.style.top = `${config.height + 12}px`;
  plaque.style.transform = "translateZ(10px)";
  frame.appendChild(plaque);

  return frame;
}

function addSurface({ className, width, height, x, y, z, rx = 0, ry = 0, rz = 0 }) {
  const surface = document.createElement("div");
  surface.className = className;
  surface.style.width = `${width}px`;
  surface.style.height = `${height}px`;
  surface.style.left = `${-width / 2}px`;
  surface.style.top = `${-height / 2}px`;
  surface.style.transform = composeTransform({ x, y, z, rx, ry, rz });
  world.appendChild(surface);
  return surface;
}

function addOrb({ x, y, z, size }) {
  const orb = document.createElement("div");
  orb.className = "museum-orb";
  orb.style.width = `${size}px`;
  orb.style.height = `${size}px`;
  orb.style.left = `${-size / 2}px`;
  orb.style.top = `${-size / 2}px`;
  orb.style.transform = composeTransform({ x, y, z });
  world.appendChild(orb);
}

function addBox({ className, width, height, depth, x, y, z, rx = 0, ry = 0, rz = 0 }) {
  const box = document.createElement("div");
  box.className = className;
  box.style.transform = composeTransform({ x, y, z, rx, ry, rz });

  const faces = [
    { face: "front", width, height, left: -width / 2, top: -height / 2, transform: `translateZ(${depth / 2}px)` },
    { face: "back", width, height, left: -width / 2, top: -height / 2, transform: `rotateY(180deg) translateZ(${depth / 2}px)` },
    { face: "right", width: depth, height, left: -depth / 2, top: -height / 2, transform: `rotateY(90deg) translateZ(${width / 2}px)` },
    { face: "left", width: depth, height, left: -depth / 2, top: -height / 2, transform: `rotateY(-90deg) translateZ(${width / 2}px)` },
    { face: "top", width, height: depth, left: -width / 2, top: -depth / 2, transform: `rotateX(90deg) translateZ(${height / 2}px)` },
    { face: "bottom", width, height: depth, left: -width / 2, top: -depth / 2, transform: `rotateX(-90deg) translateZ(${height / 2}px)` },
  ];

  faces.forEach((definition) => {
    const face = document.createElement("div");
    face.className = "museum-box-face";
    face.dataset.face = definition.face;
    face.style.width = `${definition.width}px`;
    face.style.height = `${definition.height}px`;
    face.style.left = `${definition.left}px`;
    face.style.top = `${definition.top}px`;
    face.style.transform = definition.transform;
    box.appendChild(face);
  });

  world.appendChild(box);
  return box;
}

function composeTransform({ x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0 }) {
  return `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`;
}

function registerObstacle(x, z, width, depth) {
  obstacles.push({
    minX: x - width / 2,
    maxX: x + width / 2,
    minZ: z - depth / 2,
    maxZ: z + depth / 2,
  });
}

function bindControls() {
  const handledKeys = new Set([
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "KeyW",
    "KeyA",
    "KeyS",
    "KeyD",
    "ShiftLeft",
    "ShiftRight",
  ]);

  window.addEventListener("keydown", (event) => {
    if (handledKeys.has(event.code)) {
      event.preventDefault();
      keys.add(event.code);
    }
  });

  window.addEventListener("keyup", (event) => {
    if (handledKeys.has(event.code)) {
      event.preventDefault();
      keys.delete(event.code);
    }
  });

  window.addEventListener("blur", () => {
    keys.clear();
  });
}

function render(now) {
  const delta = Math.min((now - lastTime) / 1000, 0.033);
  lastTime = now;

  const moveForward = (keys.has("ArrowUp") || keys.has("KeyW") ? 1 : 0) - (keys.has("ArrowDown") || keys.has("KeyS") ? 1 : 0);
  const turn = (keys.has("ArrowRight") ? 1 : 0) - (keys.has("ArrowLeft") ? 1 : 0);
  const strafe = (keys.has("KeyD") ? 1 : 0) - (keys.has("KeyA") ? 1 : 0);
  const speedBoost = keys.has("ShiftLeft") || keys.has("ShiftRight") ? 1.35 : 1;

  player.yaw += turn * player.turnSpeed * delta;

  let moveX = 0;
  let moveZ = 0;

  if (moveForward || strafe) {
    const magnitude = Math.hypot(strafe, moveForward) || 1;
    const normalizedStrafe = strafe / magnitude;
    const normalizedForward = moveForward / magnitude;
    const forwardX = Math.sin(player.yaw);
    const forwardZ = Math.cos(player.yaw);
    const rightX = Math.cos(player.yaw);
    const rightZ = -Math.sin(player.yaw);

    moveX =
      (forwardX * normalizedForward + rightX * normalizedStrafe) *
      player.walkSpeed *
      speedBoost *
      delta;
    moveZ =
      (forwardZ * normalizedForward + rightZ * normalizedStrafe) *
      player.walkSpeed *
      speedBoost *
      delta;
  }

  const desiredPosition = {
    x: player.x + moveX,
    z: player.z + moveZ,
  };

  const resolvedPosition = resolveCollision(
    { x: player.x, z: player.z },
    desiredPosition
  );

  player.x = resolvedPosition.x;
  player.z = resolvedPosition.z;

  updateCamera();
  requestAnimationFrame(render);
}

function resolveCollision(currentPosition, desiredPosition) {
  const wallInset = 58;

  const bounded = {
    x: clamp(
      desiredPosition.x,
      -room.width / 2 + player.radius + wallInset,
      room.width / 2 - player.radius - wallInset
    ),
    z: clamp(
      desiredPosition.z,
      -room.depth / 2 + player.radius + wallInset,
      room.depth / 2 - player.radius - wallInset
    ),
  };

  if (!isBlocked(bounded)) {
    return bounded;
  }

  const resolved = { ...currentPosition };
  const tryX = { x: bounded.x, z: resolved.z };
  if (!isBlocked(tryX)) {
    resolved.x = tryX.x;
  }

  const tryZ = { x: resolved.x, z: bounded.z };
  if (!isBlocked(tryZ)) {
    resolved.z = tryZ.z;
  }

  return resolved;
}

function isBlocked(position) {
  return obstacles.some((obstacle) => {
    return (
      position.x > obstacle.minX - player.radius &&
      position.x < obstacle.maxX + player.radius &&
      position.z > obstacle.minZ - player.radius &&
      position.z < obstacle.maxZ + player.radius
    );
  });
}

function updateCamera() {
  const yawDeg = (-player.yaw * 180) / Math.PI;
  world.style.transform = [
    `translate3d(0px, 0px, ${camera.baseZ}px)`,
    `rotateX(${camera.pitch}deg)`,
    `rotateY(${yawDeg}deg)`,
    `translate3d(${-player.x}px, ${-player.y}px, ${-player.z}px)`,
  ].join(" ");
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
