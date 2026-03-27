const canvas = document.getElementById("gallery-canvas");
const context = canvas.getContext("2d");
const lockButton = document.getElementById("lock-button");
const movementStatus = document.getElementById("movement-status");
const lockStatus = document.getElementById("lock-status");

const room = {
  width: 22.1,
  depth: 22.1,
  height: 10.4
};

const player = {
  position: { x: 0, y: 2, z: 0 },
  velocity: { x: 0, z: 0 },
  radius: 0.45,
  eyeHeight: 2,
  yaw: Math.PI,
  pitch: 0
};

const movement = {
  acceleration: 90,
  damping: 9,
  maxSpeed: 48.6,
  lookSensitivity: 0.0022
};

const state = {
  pressed: new Set(),
  lastFrame: performance.now(),
  width: window.innerWidth,
  height: window.innerHeight,
  focalLength: 1,
  dpr: 1
};

const frameImage = new Image();
frameImage.src = "goldframe.png";
const benchModelData = window.BENCH_MODEL_DATA || null;
const frameOpening = {
  left: 88 / 911,
  right: 819 / 911,
  top: 83 / 514,
  bottom: 430 / 514
};

const scene = buildScene();
const faces = scene.faces;
const seams = scene.seams;
const obstacles = scene.obstacles;
const sprites = scene.sprites;

function buildScene() {
  const builtFaces = [];
  const builtSeams = [];
  const builtObstacles = [];
  const builtSprites = [];

  addRoomShell(builtFaces, builtSeams);
  addArchitecturalTrim(builtFaces, builtSeams);

  const artworks = [
    {
      id: 1,
      wall: "north",
      center: 0,
      width: 9.6,
      height: 6.4,
      content: {
        type: "text",
        text: "Thesis"
      }
    },
    {
      id: 2,
      wall: "east",
      center: 0,
      width: 9.6,
      height: 6.4
    },
    {
      id: 3,
      wall: "south",
      center: 0,
      width: 9.6,
      height: 6.4
    },
    {
      id: 4,
      wall: "west",
      center: 0,
      width: 9.6,
      height: 6.4
    }
  ];

  for (const artwork of artworks) {
    artwork.bottom = Math.max(0.5, player.eyeHeight - artwork.height / 2);
    addFramedArtwork(builtFaces, builtSeams, builtSprites, artwork);
  }

  addBenchModel(builtFaces, builtObstacles);

  return {
    faces: builtFaces,
    seams: builtSeams,
    obstacles: builtObstacles,
    sprites: builtSprites
  };
}

function addFace(collection, points, fill, stroke = "rgba(74, 63, 50, 0.08)", sortBias = 0) {
  collection.push({ points, fill, stroke, sortBias });
}

function addLine(collection, start, end) {
  collection.push([start, end]);
}

function addSprite(collection, config) {
  collection.push(config);
}

function createFrameContentTexture(config) {
  if (!config || config.type !== "text") {
    return null;
  }

  const texture = document.createElement("canvas");
  texture.width = 1400;
  texture.height = 900;
  const textureContext = texture.getContext("2d");

  textureContext.fillStyle = "#f5f2eb";
  textureContext.fillRect(0, 0, texture.width, texture.height);
  textureContext.fillStyle = "#141414";
  textureContext.textAlign = "center";
  textureContext.textBaseline = "middle";
  textureContext.font = "140px sans-serif";
  textureContext.fillText(config.text, texture.width / 2, texture.height / 2);

  return texture;
}

function addBox(collection, config) {
  const {
    minX,
    maxX,
    minY,
    maxY,
    minZ,
    maxZ,
    colors,
    stroke = "rgba(74, 63, 50, 0.08)",
    sortBias = 0
  } = config;

  if (colors.bottom) {
    addFace(
      collection,
      [
        { x: minX, y: minY, z: minZ },
        { x: maxX, y: minY, z: minZ },
        { x: maxX, y: minY, z: maxZ },
        { x: minX, y: minY, z: maxZ }
      ],
      colors.bottom,
      stroke,
      sortBias
    );
  }

  if (colors.top) {
    addFace(
      collection,
      [
        { x: minX, y: maxY, z: maxZ },
        { x: maxX, y: maxY, z: maxZ },
        { x: maxX, y: maxY, z: minZ },
        { x: minX, y: maxY, z: minZ }
      ],
      colors.top,
      stroke,
      sortBias
    );
  }

  if (colors.north) {
    addFace(
      collection,
      [
        { x: minX, y: minY, z: minZ },
        { x: maxX, y: minY, z: minZ },
        { x: maxX, y: maxY, z: minZ },
        { x: minX, y: maxY, z: minZ }
      ],
      colors.north,
      stroke,
      sortBias
    );
  }

  if (colors.south) {
    addFace(
      collection,
      [
        { x: maxX, y: minY, z: maxZ },
        { x: minX, y: minY, z: maxZ },
        { x: minX, y: maxY, z: maxZ },
        { x: maxX, y: maxY, z: maxZ }
      ],
      colors.south,
      stroke,
      sortBias
    );
  }

  if (colors.west) {
    addFace(
      collection,
      [
        { x: minX, y: minY, z: maxZ },
        { x: minX, y: minY, z: minZ },
        { x: minX, y: maxY, z: minZ },
        { x: minX, y: maxY, z: maxZ }
      ],
      colors.west,
      stroke,
      sortBias
    );
  }

  if (colors.east) {
    addFace(
      collection,
      [
        { x: maxX, y: minY, z: minZ },
        { x: maxX, y: minY, z: maxZ },
        { x: maxX, y: maxY, z: maxZ },
        { x: maxX, y: maxY, z: minZ }
      ],
      colors.east,
      stroke,
      sortBias
    );
  }
}

function addWallPanel(collection, wall, center, bottom, width, height, depth, fill, stroke, sortBias = 0) {
  const hw = room.width / 2;
  const hd = room.depth / 2;
  const halfWidth = width / 2;
  const top = bottom + height;

  if (wall === "north") {
    addFace(
      collection,
      [
        { x: center - halfWidth, y: bottom, z: -hd + depth },
        { x: center + halfWidth, y: bottom, z: -hd + depth },
        { x: center + halfWidth, y: top, z: -hd + depth },
        { x: center - halfWidth, y: top, z: -hd + depth }
      ],
      fill,
      stroke,
      sortBias
    );
    return;
  }

  if (wall === "south") {
    addFace(
      collection,
      [
        { x: center + halfWidth, y: bottom, z: hd - depth },
        { x: center - halfWidth, y: bottom, z: hd - depth },
        { x: center - halfWidth, y: top, z: hd - depth },
        { x: center + halfWidth, y: top, z: hd - depth }
      ],
      fill,
      stroke,
      sortBias
    );
    return;
  }

  if (wall === "west") {
    addFace(
      collection,
      [
        { x: -hw + depth, y: bottom, z: center + halfWidth },
        { x: -hw + depth, y: bottom, z: center - halfWidth },
        { x: -hw + depth, y: top, z: center - halfWidth },
        { x: -hw + depth, y: top, z: center + halfWidth }
      ],
      fill,
      stroke,
      sortBias
    );
    return;
  }

  addFace(
    collection,
    [
      { x: hw - depth, y: bottom, z: center - halfWidth },
      { x: hw - depth, y: bottom, z: center + halfWidth },
      { x: hw - depth, y: top, z: center + halfWidth },
      { x: hw - depth, y: top, z: center - halfWidth }
    ],
    fill,
    stroke,
    sortBias
  );
}

function addWallMountedBox(collection, wall, start, end, bottom, top, depth, colors, stroke, sortBias = 0) {
  const hw = room.width / 2;
  const hd = room.depth / 2;

  if (wall === "north") {
    addBox(collection, {
      minX: start,
      maxX: end,
      minY: bottom,
      maxY: top,
      minZ: -hd,
      maxZ: -hd + depth,
      colors,
      stroke,
      sortBias
    });
    return;
  }

  if (wall === "south") {
    addBox(collection, {
      minX: start,
      maxX: end,
      minY: bottom,
      maxY: top,
      minZ: hd - depth,
      maxZ: hd,
      colors,
      stroke,
      sortBias
    });
    return;
  }

  if (wall === "west") {
    addBox(collection, {
      minX: -hw,
      maxX: -hw + depth,
      minY: bottom,
      maxY: top,
      minZ: start,
      maxZ: end,
      colors,
      stroke,
      sortBias
    });
    return;
  }

  addBox(collection, {
    minX: hw - depth,
    maxX: hw,
    minY: bottom,
    maxY: top,
    minZ: start,
    maxZ: end,
    colors,
      stroke,
      sortBias
    });
}

function addRectangleOutline(collection, y, inset) {
  const hw = room.width / 2 - inset;
  const hd = room.depth / 2 - inset;
  addLine(collection, { x: -hw, y, z: -hd }, { x: hw, y, z: -hd });
  addLine(collection, { x: hw, y, z: -hd }, { x: hw, y, z: hd });
  addLine(collection, { x: hw, y, z: hd }, { x: -hw, y, z: hd });
  addLine(collection, { x: -hw, y, z: hd }, { x: -hw, y, z: -hd });
}

function getWallPoint(wall, along, y, depth) {
  const hw = room.width / 2;
  const hd = room.depth / 2;

  if (wall === "north") {
    return { x: along, y, z: -hd + depth };
  }

  if (wall === "south") {
    return { x: along, y, z: hd - depth };
  }

  if (wall === "west") {
    return { x: -hw + depth, y, z: along };
  }

  return { x: hw - depth, y, z: along };
}

function getWallQuad(wall, center, bottom, width, height, depth) {
  const hw = room.width / 2;
  const hd = room.depth / 2;
  const halfWidth = width / 2;
  const top = bottom + height;

  if (wall === "north") {
    return [
      { x: center - halfWidth, y: top, z: -hd + depth },
      { x: center + halfWidth, y: top, z: -hd + depth },
      { x: center + halfWidth, y: bottom, z: -hd + depth },
      { x: center - halfWidth, y: bottom, z: -hd + depth }
    ];
  }

  if (wall === "south") {
    return [
      { x: center - halfWidth, y: top, z: hd - depth },
      { x: center + halfWidth, y: top, z: hd - depth },
      { x: center + halfWidth, y: bottom, z: hd - depth },
      { x: center - halfWidth, y: bottom, z: hd - depth }
    ];
  }

  if (wall === "west") {
    return [
      { x: -hw + depth, y: top, z: center + halfWidth },
      { x: -hw + depth, y: top, z: center - halfWidth },
      { x: -hw + depth, y: bottom, z: center - halfWidth },
      { x: -hw + depth, y: bottom, z: center + halfWidth }
    ];
  }

  return [
    { x: hw - depth, y: top, z: center - halfWidth },
    { x: hw - depth, y: top, z: center + halfWidth },
    { x: hw - depth, y: bottom, z: center + halfWidth },
    { x: hw - depth, y: bottom, z: center - halfWidth }
  ];
}

function interpolatePoint3D(start, end, t) {
  return {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t,
    z: start.z + (end.z - start.z) * t
  };
}

function getFrameOpeningQuad(outerQuad) {
  const topLeft = interpolatePoint3D(
    interpolatePoint3D(outerQuad[0], outerQuad[1], frameOpening.left),
    interpolatePoint3D(outerQuad[3], outerQuad[2], frameOpening.left),
    frameOpening.top
  );
  const topRight = interpolatePoint3D(
    interpolatePoint3D(outerQuad[0], outerQuad[1], frameOpening.right),
    interpolatePoint3D(outerQuad[3], outerQuad[2], frameOpening.right),
    frameOpening.top
  );
  const bottomRight = interpolatePoint3D(
    interpolatePoint3D(outerQuad[0], outerQuad[1], frameOpening.right),
    interpolatePoint3D(outerQuad[3], outerQuad[2], frameOpening.right),
    frameOpening.bottom
  );
  const bottomLeft = interpolatePoint3D(
    interpolatePoint3D(outerQuad[0], outerQuad[1], frameOpening.left),
    interpolatePoint3D(outerQuad[3], outerQuad[2], frameOpening.left),
    frameOpening.bottom
  );

  return [topLeft, topRight, bottomRight, bottomLeft];
}

function addRoomShell(collection, lineCollection) {
  const hw = room.width / 2;
  const hh = room.height;
  const hd = room.depth / 2;

  addFace(
    collection,
    [
      { x: -hw, y: 0, z: -hd },
      { x: hw, y: 0, z: -hd },
      { x: hw, y: 0, z: hd },
      { x: -hw, y: 0, z: hd }
    ],
    "#89684b",
    "rgba(86, 60, 37, 0.12)"
  );

  addFace(
    collection,
    [
      { x: -hw, y: hh, z: hd },
      { x: hw, y: hh, z: hd },
      { x: hw, y: hh, z: -hd },
      { x: -hw, y: hh, z: -hd }
    ],
    "#f4efe7",
    "rgba(93, 82, 66, 0.08)"
  );

  addFace(
    collection,
    [
      { x: -hw, y: 0, z: -hd },
      { x: hw, y: 0, z: -hd },
      { x: hw, y: hh, z: -hd },
      { x: -hw, y: hh, z: -hd }
    ],
    "#efe7db",
    "rgba(103, 89, 70, 0.08)"
  );

  addFace(
    collection,
    [
      { x: hw, y: 0, z: hd },
      { x: -hw, y: 0, z: hd },
      { x: -hw, y: hh, z: hd },
      { x: hw, y: hh, z: hd }
    ],
    "#ece3d6",
    "rgba(103, 89, 70, 0.08)"
  );

  addFace(
    collection,
    [
      { x: -hw, y: 0, z: hd },
      { x: -hw, y: 0, z: -hd },
      { x: -hw, y: hh, z: -hd },
      { x: -hw, y: hh, z: hd }
    ],
    "#e9dfd1",
    "rgba(103, 89, 70, 0.08)"
  );

  addFace(
    collection,
    [
      { x: hw, y: 0, z: -hd },
      { x: hw, y: 0, z: hd },
      { x: hw, y: hh, z: hd },
      { x: hw, y: hh, z: -hd }
    ],
    "#f1e8dc",
    "rgba(103, 89, 70, 0.08)"
  );

  const plankStep = 1.3;

  for (let z = -hd + plankStep; z < hd; z += plankStep) {
    addLine(lineCollection, { x: -hw, y: 0.01, z }, { x: hw, y: 0.01, z });
  }

  for (let x = -hw + 2.7; x < hw; x += 2.7) {
    addLine(lineCollection, { x, y: 0.01, z: -hd }, { x, y: 0.01, z: hd });
  }

  addRectangleOutline(lineCollection, 0.01, 0.85);
  addRectangleOutline(lineCollection, hh - 0.01, 1.2);
}

function addArchitecturalTrim(collection, lineCollection) {
  const hw = room.width / 2;
  const hh = room.height;
  const hd = room.depth / 2;
  const baseHeight = 0.34;
  const baseDepth = 0.18;
  const crownHeight = 0.36;
  const crownDepth = 0.28;
  const trimColors = {
    top: "#d2c4b4",
    bottom: "#b1967c",
    north: "#ccbca9",
    south: "#dccdbb",
    west: "#c3b29f",
    east: "#e2d2c2"
  };

  addWallMountedBox(collection, "north", -hw, hw, 0, baseHeight, baseDepth, trimColors);
  addWallMountedBox(collection, "south", -hw, hw, 0, baseHeight, baseDepth, trimColors);
  addWallMountedBox(collection, "west", -hd, hd, 0, baseHeight, baseDepth, trimColors);
  addWallMountedBox(collection, "east", -hd, hd, 0, baseHeight, baseDepth, trimColors);

  addWallMountedBox(collection, "north", -hw, hw, hh - crownHeight, hh, crownDepth, trimColors);
  addWallMountedBox(collection, "south", -hw, hw, hh - crownHeight, hh, crownDepth, trimColors);
  addWallMountedBox(collection, "west", -hd, hd, hh - crownHeight, hh, crownDepth, trimColors);
  addWallMountedBox(collection, "east", -hd, hd, hh - crownHeight, hh, crownDepth, trimColors);

  addLine(lineCollection, { x: -hw + 1.2, y: hh - 0.18, z: -hd + 1.2 }, { x: hw - 1.2, y: hh - 0.18, z: -hd + 1.2 });
  addLine(lineCollection, { x: hw - 1.2, y: hh - 0.18, z: -hd + 1.2 }, { x: hw - 1.2, y: hh - 0.18, z: hd - 1.2 });
  addLine(lineCollection, { x: hw - 1.2, y: hh - 0.18, z: hd - 1.2 }, { x: -hw + 1.2, y: hh - 0.18, z: hd - 1.2 });
  addLine(lineCollection, { x: -hw + 1.2, y: hh - 0.18, z: hd - 1.2 }, { x: -hw + 1.2, y: hh - 0.18, z: -hd + 1.2 });
}

function addFramedArtwork(collection, lineCollection, spriteCollection, config) {
  const frameDepth = 0.036;
  const frameQuad = getWallQuad(config.wall, config.center, config.bottom, config.width, config.height, frameDepth);

  if (config.content) {
    const contentTexture = createFrameContentTexture(config.content);

    if (contentTexture) {
      addSprite(spriteCollection, {
        image: contentTexture,
        points: getFrameOpeningQuad(frameQuad),
        depthBias: -2
      });
    }
  }

  addSprite(spriteCollection, {
    image: frameImage,
    points: frameQuad,
    depthBias: -3
  });
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16)
  };
}

function shadeColor(hex, amount) {
  const color = hexToRgb(hex);
  const clampChannel = (value) => Math.max(0, Math.min(255, Math.round(value)));

  return `rgb(${clampChannel(color.r * amount)}, ${clampChannel(color.g * amount)}, ${clampChannel(color.b * amount)})`;
}

function addBenchModel(collection, obstacleCollection) {
  if (!benchModelData) {
    return;
  }

  const scale = 2.2;
  const position = {
    x: 0,
    y: -benchModelData.bounds.min[1] * scale,
    z: -4.25
  };
  const lightDirection = { x: -0.35, y: 0.9, z: -0.25 };
  const lightLength = Math.hypot(lightDirection.x, lightDirection.y, lightDirection.z);
  lightDirection.x /= lightLength;
  lightDirection.y /= lightLength;
  lightDirection.z /= lightLength;

  for (const triangle of benchModelData.triangles) {
    const a = {
      x: triangle[0] * scale + position.x,
      y: -triangle[1] * scale + position.y,
      z: triangle[2] * scale + position.z
    };
    const b = {
      x: triangle[3] * scale + position.x,
      y: -triangle[4] * scale + position.y,
      z: triangle[5] * scale + position.z
    };
    const c = {
      x: triangle[6] * scale + position.x,
      y: -triangle[7] * scale + position.y,
      z: triangle[8] * scale + position.z
    };
    const ab = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
    const ac = { x: c.x - a.x, y: c.y - a.y, z: c.z - a.z };
    const normal = {
      x: ab.y * ac.z - ab.z * ac.y,
      y: ab.z * ac.x - ab.x * ac.z,
      z: ab.x * ac.y - ab.y * ac.x
    };
    const normalLength = Math.hypot(normal.x, normal.y, normal.z) || 1;
    normal.x = -normal.x / normalLength;
    normal.y = -normal.y / normalLength;
    normal.z = -normal.z / normalLength;
    const lightAmount = 0.58 + 0.42 * Math.max(0, normal.x * lightDirection.x + normal.y * lightDirection.y + normal.z * lightDirection.z);
    const baseColor = benchModelData.palette[triangle[9]];

    addFace(
      collection,
      [a, b, c],
      shadeColor(baseColor, lightAmount),
      "rgba(0, 0, 0, 0)"
    );
  }

  obstacleCollection.push({
    minX: position.x + benchModelData.bounds.min[0] * scale - 0.18,
    maxX: position.x + benchModelData.bounds.max[0] * scale + 0.18,
    minZ: position.z + benchModelData.bounds.min[2] * scale - 0.18,
    maxZ: position.z + benchModelData.bounds.max[2] * scale + 0.18
  });
}

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  state.dpr = dpr;
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  canvas.width = Math.round(state.width * dpr);
  canvas.height = Math.round(state.height * dpr);
  canvas.style.width = `${state.width}px`;
  canvas.style.height = `${state.height}px`;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  state.focalLength = state.height / (2 * Math.tan((75 * Math.PI) / 360));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function length2D(x, z) {
  return Math.hypot(x, z);
}

function getInputVector() {
  let x = 0;
  let z = 0;

  if (state.pressed.has("ArrowLeft") || state.pressed.has("KeyA")) {
    x -= 1;
  }
  if (state.pressed.has("ArrowRight") || state.pressed.has("KeyD")) {
    x += 1;
  }
  if (state.pressed.has("ArrowUp") || state.pressed.has("KeyW")) {
    z += 1;
  }
  if (state.pressed.has("ArrowDown") || state.pressed.has("KeyS")) {
    z -= 1;
  }

  const magnitude = Math.hypot(x, z);

  if (!magnitude) {
    return { x: 0, z: 0 };
  }

  return { x: x / magnitude, z: z / magnitude };
}

function resolveHorizontalCollision(currentX, nextX, z) {
  let resolved = nextX;

  for (const obstacle of obstacles) {
    const expandedMinZ = obstacle.minZ - player.radius;
    const expandedMaxZ = obstacle.maxZ + player.radius;

    if (z <= expandedMinZ || z >= expandedMaxZ) {
      continue;
    }

    if (resolved + player.radius > obstacle.minX && resolved - player.radius < obstacle.maxX) {
      if (currentX <= obstacle.minX - player.radius) {
        resolved = obstacle.minX - player.radius;
      } else if (currentX >= obstacle.maxX + player.radius) {
        resolved = obstacle.maxX + player.radius;
      } else {
        const leftTarget = obstacle.minX - player.radius;
        const rightTarget = obstacle.maxX + player.radius;
        resolved = Math.abs(currentX - leftTarget) < Math.abs(currentX - rightTarget)
          ? leftTarget
          : rightTarget;
      }
    }
  }

  return resolved;
}

function resolveDepthCollision(x, currentZ, nextZ) {
  let resolved = nextZ;

  for (const obstacle of obstacles) {
    const expandedMinX = obstacle.minX - player.radius;
    const expandedMaxX = obstacle.maxX + player.radius;

    if (x <= expandedMinX || x >= expandedMaxX) {
      continue;
    }

    if (resolved + player.radius > obstacle.minZ && resolved - player.radius < obstacle.maxZ) {
      if (currentZ <= obstacle.minZ - player.radius) {
        resolved = obstacle.minZ - player.radius;
      } else if (currentZ >= obstacle.maxZ + player.radius) {
        resolved = obstacle.maxZ + player.radius;
      } else {
        const nearTarget = obstacle.minZ - player.radius;
        const farTarget = obstacle.maxZ + player.radius;
        resolved = Math.abs(currentZ - nearTarget) < Math.abs(currentZ - farTarget)
          ? nearTarget
          : farTarget;
      }
    }
  }

  return resolved;
}

function updatePlayer(dt) {
  const input = getInputVector();
  const damping = Math.exp(-movement.damping * dt);

  player.velocity.x *= damping;
  player.velocity.z *= damping;

  if (input.x || input.z) {
    const sinYaw = Math.sin(player.yaw);
    const cosYaw = Math.cos(player.yaw);
    const rightX = cosYaw;
    const rightZ = sinYaw;
    const forwardX = -sinYaw;
    const forwardZ = cosYaw;
    const worldX = input.x * rightX + input.z * forwardX;
    const worldZ = input.x * rightZ + input.z * forwardZ;

    player.velocity.x += worldX * movement.acceleration * dt;
    player.velocity.z += worldZ * movement.acceleration * dt;
  }

  const speed = length2D(player.velocity.x, player.velocity.z);

  if (speed > movement.maxSpeed) {
    const scale = movement.maxSpeed / speed;
    player.velocity.x *= scale;
    player.velocity.z *= scale;
  }

  const minX = -room.width / 2 + player.radius;
  const maxX = room.width / 2 - player.radius;
  const minZ = -room.depth / 2 + player.radius;
  const maxZ = room.depth / 2 - player.radius;

  let nextX = player.position.x + player.velocity.x * dt;
  nextX = clamp(nextX, minX, maxX);
  const resolvedX = resolveHorizontalCollision(player.position.x, nextX, player.position.z);
  if (resolvedX !== nextX) {
    player.velocity.x = 0;
  }
  nextX = resolvedX;

  let nextZ = player.position.z + player.velocity.z * dt;
  nextZ = clamp(nextZ, minZ, maxZ);
  const resolvedZ = resolveDepthCollision(nextX, player.position.z, nextZ);
  if (resolvedZ !== nextZ) {
    player.velocity.z = 0;
  }
  nextZ = resolvedZ;

  player.position.x = nextX;
  player.position.z = nextZ;
  player.position.y = player.eyeHeight;

  if (length2D(player.velocity.x, player.velocity.z) < 0.0005) {
    player.velocity.x = 0;
    player.velocity.z = 0;
  }
}

function toCameraSpace(point) {
  const dx = point.x - player.position.x;
  const dy = point.y - player.position.y;
  const dz = point.z - player.position.z;
  const sinYaw = Math.sin(-player.yaw);
  const cosYaw = Math.cos(-player.yaw);
  const x1 = dx * cosYaw - dz * sinYaw;
  const z1 = dx * sinYaw + dz * cosYaw;
  const sinPitch = Math.sin(-player.pitch);
  const cosPitch = Math.cos(-player.pitch);
  const y2 = dy * cosPitch - z1 * sinPitch;
  const z2 = dy * sinPitch + z1 * cosPitch;

  return { x: x1, y: y2, z: z2 };
}

function clipPolygonToNearPlane(points, nearPlane) {
  const result = [];

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const currentVisible = current.z > nearPlane;
    const nextVisible = next.z > nearPlane;

    if (currentVisible && nextVisible) {
      result.push(next);
      continue;
    }

    if (currentVisible !== nextVisible) {
      const t = (nearPlane - current.z) / (next.z - current.z);
      const intersection = {
        x: current.x + (next.x - current.x) * t,
        y: current.y + (next.y - current.y) * t,
        z: nearPlane
      };

      result.push(intersection);

      if (!currentVisible && nextVisible) {
        result.push(next);
      }
    }
  }

  return result;
}

function clipLineToNearPlane(start, end, nearPlane) {
  const startVisible = start.z > nearPlane;
  const endVisible = end.z > nearPlane;

  if (!startVisible && !endVisible) {
    return null;
  }

  if (startVisible && endVisible) {
    return [start, end];
  }

  const t = (nearPlane - start.z) / (end.z - start.z);
  const intersection = {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t,
    z: nearPlane
  };

  return startVisible ? [start, intersection] : [intersection, end];
}

function projectPoint(point) {
  const scale = state.focalLength / point.z;

  return {
    x: point.x * scale + state.width / 2,
    y: -point.y * scale + state.height / 2
  };
}

function interpolatePoint(start, end, t) {
  return {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t
  };
}

function drawProjectedSprite(sprite) {
  const source = sprite.image;
  const sourceWidth = source.naturalWidth || source.videoWidth || source.width;
  const sourceHeight = source.naturalHeight || source.videoHeight || source.height;

  if ((source.complete === false) || !sourceWidth || !sourceHeight) {
    return;
  }

  const nearPlane = 0.08;
  const cameraPoints = sprite.points.map(toCameraSpace);

  if (cameraPoints.some((point) => point.z <= nearPlane)) {
    return;
  }

  let [topLeft, topRight, bottomRight, bottomLeft] = cameraPoints.map(projectPoint);
  const leftEdgeX = (topLeft.x + bottomLeft.x) / 2;
  const rightEdgeX = (topRight.x + bottomRight.x) / 2;

  if (leftEdgeX > rightEdgeX) {
    [topLeft, topRight, bottomRight, bottomLeft] = [topRight, topLeft, bottomLeft, bottomRight];
  }

  const topEdgeY = (topLeft.y + topRight.y) / 2;
  const bottomEdgeY = (bottomLeft.y + bottomRight.y) / 2;

  if (topEdgeY > bottomEdgeY) {
    [topLeft, topRight, bottomRight, bottomLeft] = [bottomLeft, bottomRight, topRight, topLeft];
  }

  const strips = Math.max(
    64,
    Math.ceil(Math.max(
      Math.hypot(topRight.x - topLeft.x, topRight.y - topLeft.y),
      Math.hypot(bottomRight.x - bottomLeft.x, bottomRight.y - bottomLeft.y)
    ) / 4)
  );

  context.save();
  context.imageSmoothingEnabled = true;
  context.beginPath();
  context.moveTo(topLeft.x, topLeft.y);
  context.lineTo(topRight.x, topRight.y);
  context.lineTo(bottomRight.x, bottomRight.y);
  context.lineTo(bottomLeft.x, bottomLeft.y);
  context.closePath();
  context.clip();

  for (let index = 0; index < strips; index += 1) {
    const overlap = 0.35 / strips;
    const t0 = Math.max(0, index / strips - overlap);
    const t1 = Math.min(1, (index + 1) / strips + overlap);
    const quadTopLeft = interpolatePoint(topLeft, topRight, t0);
    const quadTopRight = interpolatePoint(topLeft, topRight, t1);
    const quadBottomLeft = interpolatePoint(bottomLeft, bottomRight, t0);
    const quadBottomRight = interpolatePoint(bottomLeft, bottomRight, t1);

    context.setTransform(
      state.dpr * (quadTopRight.x - quadTopLeft.x),
      state.dpr * (quadTopRight.y - quadTopLeft.y),
      state.dpr * (quadBottomLeft.x - quadTopLeft.x),
      state.dpr * (quadBottomLeft.y - quadTopLeft.y),
      state.dpr * quadTopLeft.x,
      state.dpr * quadTopLeft.y
    );
    context.drawImage(
      source,
      sourceWidth * t0,
      0,
      Math.ceil(sourceWidth * (t1 - t0)) + 1,
      sourceHeight,
      0,
      0,
      1,
      1
    );
  }

  context.restore();
}

function render() {
  context.clearRect(0, 0, state.width, state.height);

  const background = context.createLinearGradient(0, 0, 0, state.height);
  background.addColorStop(0, "#e8dccb");
  background.addColorStop(0.48, "#d7c6ae");
  background.addColorStop(1, "#b89e80");
  context.fillStyle = background;
  context.fillRect(0, 0, state.width, state.height);

  const nearPlane = 0.08;
  const projectedFaces = [];

  for (const face of faces) {
    const transformed = face.points.map(toCameraSpace);
    const clipped = clipPolygonToNearPlane(transformed, nearPlane);

    if (clipped.length < 3) {
      continue;
    }

    projectedFaces.push({
      fill: face.fill,
      stroke: face.stroke,
      depth: clipped.reduce((total, point) => total + point.z, 0) / clipped.length + (face.sortBias || 0),
      points: clipped.map(projectPoint)
    });
  }

  projectedFaces.sort((left, right) => right.depth - left.depth);

  for (const face of projectedFaces) {
    context.beginPath();
    context.moveTo(face.points[0].x, face.points[0].y);

    for (let index = 1; index < face.points.length; index += 1) {
      context.lineTo(face.points[index].x, face.points[index].y);
    }

    context.closePath();
    context.fillStyle = face.fill;
    context.fill();
    context.strokeStyle = face.stroke;
    context.lineWidth = 1;
    context.stroke();
  }

  context.strokeStyle = "rgba(58, 46, 31, 0.16)";
  context.lineWidth = 1;

  for (const seam of seams) {
    const start = toCameraSpace(seam[0]);
    const end = toCameraSpace(seam[1]);
    const clipped = clipLineToNearPlane(start, end, nearPlane);

    if (!clipped) {
      continue;
    }

    const projectedStart = projectPoint(clipped[0]);
    const projectedEnd = projectPoint(clipped[1]);

    context.beginPath();
    context.moveTo(projectedStart.x, projectedStart.y);
    context.lineTo(projectedEnd.x, projectedEnd.y);
    context.stroke();
  }

  const projectedSprites = [];

  for (const sprite of sprites) {
    const cameraPoints = sprite.points.map(toCameraSpace);

    if (cameraPoints.some((point) => point.z <= nearPlane)) {
      continue;
    }

    projectedSprites.push({
      sprite,
      depth: cameraPoints.reduce((total, point) => total + point.z, 0) / cameraPoints.length + (sprite.depthBias || 0)
    });
  }

  projectedSprites.sort((left, right) => right.depth - left.depth);

  for (const entry of projectedSprites) {
    drawProjectedSprite(entry.sprite);
  }

  const vignette = context.createRadialGradient(
    state.width / 2,
    state.height / 2,
    state.height * 0.16,
    state.width / 2,
    state.height / 2,
    state.height * 0.82
  );
  vignette.addColorStop(0, "rgba(255, 255, 255, 0)");
  vignette.addColorStop(1, "rgba(49, 36, 24, 0.15)");
  context.fillStyle = vignette;
  context.fillRect(0, 0, state.width, state.height);
}

function updateHud() {
  movementStatus.textContent =
    `Position ${player.position.x.toFixed(1)}m, ${player.eyeHeight.toFixed(1)}m, ${player.position.z.toFixed(1)}m`;

  if (document.pointerLockElement === canvas) {
    lockStatus.textContent = "Mouse locked. Arrow keys move, mouse looks, Esc releases.";
    return;
  }

  lockStatus.textContent = "Click Enter Gallery to capture the mouse.";
}

function frame(now) {
  const dt = Math.min((now - state.lastFrame) / 1000, 0.05);
  state.lastFrame = now;
  updatePlayer(dt);
  render();
  updateHud();
  requestAnimationFrame(frame);
}

function requestLock() {
  canvas.requestPointerLock();
}

function handleKeyChange(event, isPressed) {
  const movementKeys = [
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "KeyA",
    "KeyD",
    "KeyW",
    "KeyS"
  ];

  if (!movementKeys.includes(event.code)) {
    return;
  }

  event.preventDefault();

  if (isPressed) {
    state.pressed.add(event.code);
    return;
  }

  state.pressed.delete(event.code);
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("keydown", (event) => handleKeyChange(event, true));
window.addEventListener("keyup", (event) => handleKeyChange(event, false));

document.addEventListener("pointerlockchange", () => {
  const locked = document.pointerLockElement === canvas;
  document.body.classList.toggle("is-locked", locked);
  lockButton.textContent = locked ? "Mouse Captured" : "Enter Gallery";
});

document.addEventListener("mousemove", (event) => {
  if (document.pointerLockElement !== canvas) {
    return;
  }

  player.yaw -= event.movementX * movement.lookSensitivity;
  player.pitch += event.movementY * movement.lookSensitivity * 0.9;
  player.pitch = clamp(player.pitch, -1.25, 1.25);
});

canvas.addEventListener("click", requestLock);
lockButton.addEventListener("click", requestLock);

resizeCanvas();
render();
updateHud();
requestAnimationFrame(frame);
