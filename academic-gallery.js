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
  focalLength: 1
};

const frameImage = new Image();
frameImage.src = "goldframe.png";

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
      wall: "north",
      center: 0,
      width: 5.6,
      height: 3.5,
      palette: {
        frameShadow: "#5d452f",
        frameLight: "#ae865f",
        mat: "#f1ede5",
        base: "#627768",
        accent: "#435148",
        highlight: "#96a691"
      }
    },
    {
      wall: "west",
      center: -4.9,
      width: 2.5,
      height: 1.85,
      palette: {
        frameShadow: "#543f2b",
        frameLight: "#9f7a55",
        mat: "#efe9de",
        base: "#6d7d87",
        accent: "#42525d",
        highlight: "#a0b1ba"
      }
    },
    {
      wall: "west",
      center: 4.6,
      width: 2.35,
      height: 1.75,
      palette: {
        frameShadow: "#59422d",
        frameLight: "#a98359",
        mat: "#f2ede4",
        base: "#746c5d",
        accent: "#4f473c",
        highlight: "#b1a48f"
      }
    },
    {
      wall: "east",
      center: 0.2,
      width: 2.65,
      height: 1.95,
      palette: {
        frameShadow: "#56402f",
        frameLight: "#a07e59",
        mat: "#f0ebe2",
        base: "#7f6f6f",
        accent: "#584c4c",
        highlight: "#bcadad"
      }
    },
    {
      wall: "south",
      center: -4.25,
      width: 1.55,
      height: 1.15,
      palette: {
        frameShadow: "#563f2d",
        frameLight: "#a07f60",
        mat: "#f1ece3",
        base: "#61706c",
        accent: "#45504d",
        highlight: "#97a49f"
      }
    },
    {
      wall: "south",
      center: 4.25,
      width: 1.45,
      height: 1.05,
      palette: {
        frameShadow: "#583f2b",
        frameLight: "#a88661",
        mat: "#f0ebe4",
        base: "#7d6e62",
        accent: "#5a4d44",
        highlight: "#b3a396"
      }
    }
  ];

  for (const artwork of artworks) {
    artwork.bottom = player.eyeHeight - artwork.height / 2;
    addFramedArtwork(builtFaces, builtSeams, builtSprites, artwork);
  }

  addBench(builtFaces, builtSeams, builtObstacles);

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

function addArtworkComposition(collection, wall, center, bottom, width, height, depth, palette) {
  addWallPanel(collection, wall, center, bottom, width, height, depth, palette.base, "rgba(33, 30, 28, 0.05)");
  addWallPanel(
    collection,
    wall,
    center,
    bottom + height * 0.56,
    width,
    height * 0.44,
    depth + 0.0004,
    palette.highlight,
    "rgba(33, 30, 28, 0.03)"
  );
  addWallPanel(
    collection,
    wall,
    center,
    bottom,
    width,
    height * 0.28,
    depth + 0.0008,
    palette.accent,
    "rgba(33, 30, 28, 0.03)"
  );
  addWallPanel(
    collection,
    wall,
    center + width * 0.16,
    bottom + height * 0.18,
    width * 0.22,
    height * 0.48,
    depth + 0.0012,
    "rgba(247, 241, 229, 0.22)",
    "rgba(33, 30, 28, 0.02)"
  );
}

function addFramedArtwork(collection, lineCollection, spriteCollection, config) {
  const frameDepth = 0.036;
  const top = config.bottom + config.height;
  const artworkWidth = config.width * 0.7;
  const artworkHeight = config.height * 0.58;
  const artworkBottom = config.bottom + (config.height - artworkHeight) / 2;
  addArtworkComposition(
    collection,
    config.wall,
    config.center,
    artworkBottom,
    artworkWidth,
    artworkHeight,
    frameDepth - 0.01,
    config.palette
  );

  addSprite(spriteCollection, {
    image: frameImage,
    points: getWallQuad(config.wall, config.center, config.bottom, config.width, config.height, frameDepth),
    depthBias: -3
  });

  addLine(
    lineCollection,
    getWallPoint(config.wall, config.center, top + 0.12, 0.01),
    getWallPoint(config.wall, config.center, Math.min(room.height - 0.42, top + 0.58), 0.01)
  );
}

function addBench(collection, lineCollection, obstacleCollection) {
  const seat = {
    minX: -1.7,
    maxX: 1.7,
    minY: 0.5,
    maxY: 0.7,
    minZ: -4.95,
    maxZ: -3.55
  };
  const wood = {
    top: "#6f4f38",
    bottom: "#4d3426",
    north: "#5f4331",
    south: "#7f5b40",
    west: "#553b2c",
    east: "#7b573f"
  };
  const metal = {
    top: "#4f4d49",
    bottom: "#2f2c29",
    north: "#353230",
    south: "#595651",
    west: "#3a3734",
    east: "#605c57"
  };

  addBox(collection, { ...seat, colors: wood, stroke: "rgba(38, 26, 18, 0.18)" });

  const legs = [
    { minX: -1.45, maxX: -1.17, minZ: -4.8, maxZ: -4.52 },
    { minX: 1.17, maxX: 1.45, minZ: -4.8, maxZ: -4.52 },
    { minX: -1.45, maxX: -1.17, minZ: -3.98, maxZ: -3.7 },
    { minX: 1.17, maxX: 1.45, minZ: -3.98, maxZ: -3.7 }
  ];

  for (const leg of legs) {
    addBox(collection, {
      minX: leg.minX,
      maxX: leg.maxX,
      minY: 0,
      maxY: 0.5,
      minZ: leg.minZ,
      maxZ: leg.maxZ,
      colors: metal,
      stroke: "rgba(34, 31, 28, 0.14)"
    });
  }

  addBox(collection, {
    minX: -1.22,
    maxX: 1.22,
    minY: 0.26,
    maxY: 0.36,
    minZ: -4.43,
    maxZ: -4.07,
    colors: metal,
    stroke: "rgba(34, 31, 28, 0.14)"
  });

  addLine(lineCollection, { x: -1.7, y: 0.71, z: -4.95 }, { x: 1.7, y: 0.71, z: -4.95 });
  addLine(lineCollection, { x: -1.7, y: 0.71, z: -3.55 }, { x: 1.7, y: 0.71, z: -3.55 });

  obstacleCollection.push({
    minX: -1.95,
    maxX: 1.95,
    minZ: -5.2,
    maxZ: -3.3
  });
}

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
  if (!sprite.image.complete || !sprite.image.naturalWidth) {
    return;
  }

  const nearPlane = 0.08;
  const cameraPoints = sprite.points.map(toCameraSpace);

  if (cameraPoints.some((point) => point.z <= nearPlane)) {
    return;
  }

  const projected = cameraPoints.map(projectPoint);
  const [topLeft, topRight, bottomRight, bottomLeft] = projected;
  const strips = Math.max(
    24,
    Math.ceil(Math.hypot(topRight.x - topLeft.x, topRight.y - topLeft.y) / 6)
  );

  context.save();
  context.imageSmoothingEnabled = true;

  for (let index = 0; index < strips; index += 1) {
    const t0 = index / strips;
    const t1 = (index + 1) / strips;
    const quadTopLeft = interpolatePoint(topLeft, topRight, t0);
    const quadTopRight = interpolatePoint(topLeft, topRight, t1);
    const quadBottomLeft = interpolatePoint(bottomLeft, bottomRight, t0);
    const quadBottomRight = interpolatePoint(bottomLeft, bottomRight, t1);

    context.save();
    context.beginPath();
    context.moveTo(quadTopLeft.x, quadTopLeft.y);
    context.lineTo(quadTopRight.x, quadTopRight.y);
    context.lineTo(quadBottomRight.x, quadBottomRight.y);
    context.lineTo(quadBottomLeft.x, quadBottomLeft.y);
    context.closePath();
    context.clip();

    context.setTransform(
      quadTopRight.x - quadTopLeft.x,
      quadTopRight.y - quadTopLeft.y,
      quadBottomLeft.x - quadTopLeft.x,
      quadBottomLeft.y - quadTopLeft.y,
      quadTopLeft.x,
      quadTopLeft.y
    );
    context.drawImage(
      sprite.image,
      sprite.image.naturalWidth * t0,
      0,
      Math.ceil(sprite.image.naturalWidth * (t1 - t0)) + 1,
      sprite.image.naturalHeight,
      0,
      0,
      1,
      1
    );
    context.restore();
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
