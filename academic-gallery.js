const canvas = document.getElementById("gallery-canvas");
const context = canvas.getContext("2d");
const lockButton = document.getElementById("lock-button");
const lockStatus = document.getElementById("lock-status");

const room = {
  width: 22.1,
  depth: 22.1,
  height: 10.4
};

const player = {
  position: { x: 0, y: 3, z: 0 },
  velocity: { x: 0, z: 0 },
  radius: 0.45,
  eyeHeight: 3,
  yaw: Math.PI,
  pitch: 0
};

const movement = {
  acceleration: 90,
  damping: 9,
  maxSpeed: 48.6,
  lookSensitivity: 0.0022
};

const THESIS_PLAQUE_BUTTON_BOUNDS = {
  x: 170,
  y: 522,
  width: 420,
  height: 148
};
const TREE_VIDEO_BUTTON_BOUNDS = {
  x: 242,
  y: 528,
  width: 376,
  height: 136
};

const state = {
  interactiveRegions: [],
  pressed: new Set(),
  lastFrame: performance.now(),
  width: window.innerWidth,
  height: window.innerHeight,
  focalLength: 1,
  dpr: 1
};

const THESIS_PDF_URL = encodeURI("Academic Works/Thesis/liamThesis.pdf");
const TREE_VIDEO_URL = "https://youtu.be/ox3WYoONv8k";
const frameImage = new Image();
frameImage.src = "goldframe.png";
const thesisFrameImage = new Image();
thesisFrameImage.src = "Academic Works/Thesis/thesisFrame.png";
const parametricFrameImage = new Image();
parametricFrameImage.src = "Academic Works/Parametric/parametric.png";
const treeBiodiversityFrameImage = new Image();
treeBiodiversityFrameImage.src = "Academic Works/TreeBiodiversity/treeBiodiversity.png";
const thesisTitleImage = new Image();
thesisTitleImage.src = "Academic Works/Thesis/thesisFrame-title.jpg";
const thesisPipelineImage = new Image();
thesisPipelineImage.src = "Academic Works/Thesis/thesisFrame-pipeline.png";
const thesisChartImage = new Image();
thesisChartImage.src = "Academic Works/Thesis/thesisFrame-chart.png";
const thesisPlaqueTexture = createThesisPlaqueTexture();
const parametricPlaqueTexture = createParametricPlaqueTexture();
const treeBiodiversityPlaqueTexture = createTreeBiodiversityPlaqueTexture();
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
        type: "thesis"
      }
    },
    {
      id: 2,
      wall: "east",
      center: 0,
      width: 9.6,
      height: 6.4,
      content: {
        type: "parametric"
      }
    },
    {
      id: 3,
      wall: "south",
      center: 0,
      width: 9.6,
      height: 6.4,
      content: {
        type: "treeBiodiversity"
      }
    },
    {
      id: 4,
      wall: "west",
      center: 0,
      width: 9.6,
      height: 6.4,
      content: {
        type: "text",
        text: "Coming soon"
      }
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
  if (!config) {
    return null;
  }

  if (config.type === "thesis") {
    return thesisFrameImage;
  }

  if (config.type === "parametric") {
    return parametricFrameImage;
  }

  if (config.type === "treeBiodiversity") {
    return treeBiodiversityFrameImage;
  }

  if (config.type !== "text") {
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

function createThesisTexture() {
  const texture = document.createElement("canvas");
  texture.width = 2200;
  texture.height = 1100;
  const textureContext = texture.getContext("2d");
  const slide = document.createElement("canvas");
  slide.width = 1920;
  slide.height = 1080;
  const slideContext = slide.getContext("2d");

  textureContext.fillStyle = "#ffffff";
  textureContext.fillRect(0, 0, texture.width, texture.height);

  slideContext.fillStyle = "#ffffff";
  slideContext.fillRect(0, 0, slide.width, slide.height);

  const renderSlide = () => {
    slideContext.fillStyle = "#ffffff";
    slideContext.fillRect(0, 0, slide.width, slide.height);

    if (thesisTitleImage.complete && thesisTitleImage.naturalWidth) {
      slideContext.drawImage(thesisTitleImage, 84, 44, 1260, 220);
    } else {
      drawThesisTitle(slideContext);
    }

    drawThesisFindings(slideContext);

    if (thesisPipelineImage.complete && thesisPipelineImage.naturalWidth) {
      slideContext.drawImage(thesisPipelineImage, 1360, 52, 418, 448);
    } else {
      drawThesisPipeline(slideContext, 1372, 68, 470, 430);
    }

    if (thesisChartImage.complete && thesisChartImage.naturalWidth) {
      slideContext.drawImage(thesisChartImage, 1360, 640, 470, 335);
    } else {
      drawThesisBarChart(slideContext, 1342, 642, 520, 300);
    }

    slideContext.save();
    slideContext.font = "italic 48px Georgia, serif";
    slideContext.textAlign = "left";
    slideContext.textBaseline = "alphabetic";
    slideContext.fillStyle = "#0e0e0e";
    slideContext.shadowColor = "rgba(0, 0, 0, 0.16)";
    slideContext.shadowBlur = 2;
    slideContext.fillText("*Currently pending conference acceptance*", 150, 1046);
    slideContext.restore();

    textureContext.fillStyle = "#ffffff";
    textureContext.fillRect(0, 0, texture.width, texture.height);
    const insetY = 18;
    const drawHeight = texture.height - insetY * 2;
    const drawWidth = (drawHeight * slide.width) / slide.height;
    const drawX = (texture.width - drawWidth) / 2 + 110;
    textureContext.drawImage(slide, drawX, insetY, drawWidth, drawHeight);
  };

  renderSlide();

  for (const image of [thesisTitleImage, thesisPipelineImage, thesisChartImage]) {
    if (!image.complete) {
      image.addEventListener("load", renderSlide, { once: true });
    }
  }

  return texture;
}

function drawThesisTitle(textureContext) {
  const titleLines = [
    "Source? I Made it Up: How Hallucinations Can",
    "Be Studied to Reveal Inherent Political Bias in",
    "LLMs"
  ];

  textureContext.save();
  textureContext.fillStyle = "#111111";
  textureContext.textAlign = "center";
  textureContext.textBaseline = "middle";
  textureContext.font = "70px Georgia, serif";

  let y = 92;

  for (const line of titleLines) {
    textureContext.fillText(line, 760, y);
    y += 72;
  }

  textureContext.restore();
}

function drawThesisFindings(textureContext) {
  const textCenterX = 760;
  const groups = [
    {
      y: 316,
      title: "Pipeline combining generation, detection, and classification",
      bullet: "LLM outputs -> detect hallucinations -> classify bias"
    },
    {
      y: 466,
      title: "Use of multiple open-source LLMs for comparison",
      bullet: "Llama, Mistral, DeepSeek evaluated"
    },
    {
      y: 616,
      title: "Hallucinations vary significantly by model",
      bullet: "Frequency differs across models"
    },
    {
      y: 766,
      title: "Hallucinations occur equally across political inputs",
      bullet: "Similar rates for left vs right"
    },
    {
      y: 886,
      title: "Hallucinated content shows systematic left-leaning bias",
      bullet: "Skews left, especially on key topics"
    }
  ];

  textureContext.save();
  textureContext.fillStyle = "#111111";
  textureContext.textAlign = "center";
  textureContext.textBaseline = "middle";

  for (const group of groups) {
    textureContext.font = "45px Aptos, Arial, sans-serif";
    textureContext.fillText(group.title, textCenterX, group.y);
    drawCenteredBulletLine(textureContext, group.bullet, textCenterX, group.y + 48, 18, 39);
  }

  textureContext.restore();
}

function drawCenteredBulletLine(textureContext, text, centerX, centerY, radius, fontSize) {
  textureContext.save();
  textureContext.fillStyle = "#111111";
  textureContext.font = `${fontSize}px Aptos, Arial, sans-serif`;
  textureContext.textAlign = "left";
  textureContext.textBaseline = "middle";

  const textWidth = textureContext.measureText(text).width;
  const gap = 22;
  const totalWidth = radius * 2 + gap + textWidth;
  const startX = centerX - totalWidth / 2;
  const bulletCenterX = startX + radius;

  textureContext.beginPath();
  textureContext.arc(bulletCenterX, centerY, radius / 2.5, 0, Math.PI * 2);
  textureContext.fill();
  textureContext.fillText(text, startX + radius * 2 + gap, centerY);
  textureContext.restore();
}

function drawRoundedRect(textureContext, x, y, width, height, radius, fillStyle, strokeStyle, lineWidth = 2) {
  textureContext.beginPath();
  textureContext.moveTo(x + radius, y);
  textureContext.lineTo(x + width - radius, y);
  textureContext.quadraticCurveTo(x + width, y, x + width, y + radius);
  textureContext.lineTo(x + width, y + height - radius);
  textureContext.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  textureContext.lineTo(x + radius, y + height);
  textureContext.quadraticCurveTo(x, y + height, x, y + height - radius);
  textureContext.lineTo(x, y + radius);
  textureContext.quadraticCurveTo(x, y, x + radius, y);
  textureContext.closePath();

  textureContext.fillStyle = fillStyle;
  textureContext.fill();

  if (strokeStyle) {
    textureContext.strokeStyle = strokeStyle;
    textureContext.lineWidth = lineWidth;
    textureContext.stroke();
  }
}

function drawPill(textureContext, x, y, width, height, label, fontSize = 19) {
  drawRoundedRect(textureContext, x, y, width, height, height / 2, "#a9c7e7", "#5e6d7c", 2);
  textureContext.save();
  textureContext.fillStyle = "#1b2b39";
  textureContext.textAlign = "center";
  textureContext.textBaseline = "middle";
  textureContext.font = `${fontSize}px Aptos, Arial, sans-serif`;
  const lines = label.split("\n");
  const centerY = y + height / 2 - ((lines.length - 1) * fontSize * 0.58) / 2;

  for (let index = 0; index < lines.length; index += 1) {
    textureContext.fillText(lines[index], x + width / 2, centerY + index * fontSize * 1.16);
  }

  textureContext.restore();
}

function drawLink(textureContext, startX, startY, endX, endY) {
  textureContext.save();
  textureContext.strokeStyle = "#5b5b5b";
  textureContext.lineWidth = 2.2;
  textureContext.beginPath();
  textureContext.moveTo(startX, startY);
  textureContext.lineTo(endX, endY);
  textureContext.stroke();
  textureContext.restore();
}

function drawThesisPipeline(textureContext, x, y, width, height) {
  textureContext.save();
  textureContext.strokeStyle = "#6b6b6b";
  textureContext.lineWidth = 2.2;

  drawRoundedRect(textureContext, x + 160, y + 2, 200, 48, 10, "#a9c7e7", "#5e6d7c");
  drawPill(textureContext, x + 212, y + 61, 96, 36, "Prompting", 17);
  drawPill(textureContext, x + 198, y + 112, 128, 52, "Llama 3\nQuestion Generation", 17);
  drawRoundedRect(textureContext, x + 168, y + 182, 188, 44, 8, "#96b6d8", "#5e6d7c");

  drawPill(textureContext, x + 13, y + 116, 92, 40, "DeBERTa", 18);
  drawRoundedRect(textureContext, x + 8, y + 188, 102, 36, 8, "#a9c7e7", "#5e6d7c");
  drawPill(textureContext, x + 2, y + 358, 110, 48, "ownBERT", 18);

  drawPill(textureContext, x + 120, y + 250, 80, 34, "Llama 3", 16);
  drawPill(textureContext, x + 210, y + 250, 80, 34, "Mistral", 16);
  drawPill(textureContext, x + 300, y + 250, 96, 34, "Deepseek", 16);

  drawRoundedRect(textureContext, x + 108, y + 298, 104, 34, 6, "#a9c7e7", "#5e6d7c");
  drawRoundedRect(textureContext, x + 198, y + 320, 104, 34, 6, "#a9c7e7", "#5e6d7c");
  drawRoundedRect(textureContext, x + 304, y + 298, 122, 34, 6, "#a9c7e7", "#5e6d7c");

  drawPill(textureContext, x + 165, y + 370, 100, 42, "ANAH-v2", 18);
  drawRoundedRect(textureContext, x + 152, y + 428, 126, 40, 6, "#a9c7e7", "#5e6d7c");
  drawRoundedRect(textureContext, x + 148, y + 484, 138, 40, 6, "#a9c7e7", "#5e6d7c");
  drawRoundedRect(textureContext, x + 142, y + 540, 150, 42, 6, "#a9c7e7", "#5e6d7c");

  drawRoundedRect(textureContext, x + 383, y + 6, 106, 124, 0, "#ffffff", "#7d7d7d", 2);
  drawRoundedRect(textureContext, x + 393, y + 33, 86, 30, 5, "#a9c7e7", "#5e6d7c");
  drawRoundedRect(textureContext, x + 393, y + 71, 86, 30, 5, "#a9c7e7", "#5e6d7c");
  drawRoundedRect(textureContext, x + 393, y + 109, 86, 30, 5, "#a9c7e7", "#5e6d7c");

  drawLink(textureContext, x + 260, y + 50, x + 260, y + 61);
  drawLink(textureContext, x + 260, y + 97, x + 260, y + 112);
  drawLink(textureContext, x + 260, y + 164, x + 260, y + 182);
  drawLink(textureContext, x + 59, y + 156, x + 59, y + 188);
  drawLink(textureContext, x + 59, y + 224, x + 59, y + 358);

  drawLink(textureContext, x + 214, y + 226, x + 160, y + 250);
  drawLink(textureContext, x + 262, y + 226, x + 250, y + 250);
  drawLink(textureContext, x + 310, y + 226, x + 348, y + 250);
  drawLink(textureContext, x + 160, y + 284, x + 160, y + 298);
  drawLink(textureContext, x + 250, y + 284, x + 250, y + 320);
  drawLink(textureContext, x + 348, y + 284, x + 365, y + 298);

  drawLink(textureContext, x + 160, y + 332, x + 160, y + 376);
  drawLink(textureContext, x + 250, y + 354, x + 250, y + 376);
  drawLink(textureContext, x + 365, y + 332, x + 365, y + 376);
  drawLink(textureContext, x + 160, y + 391, x + 165, y + 391);
  drawLink(textureContext, x + 265, y + 391, x + 365, y + 391);
  drawLink(textureContext, x + 215, y + 412, x + 215, y + 428);
  drawLink(textureContext, x + 215, y + 468, x + 215, y + 484);
  drawLink(textureContext, x + 215, y + 524, x + 215, y + 540);
  drawLink(textureContext, x + 110, y + 382, x + 142, y + 382);
  drawLink(textureContext, x + 142, y + 382, x + 142, y + 561);

  textureContext.fillStyle = "#1b2b39";
  textureContext.textAlign = "center";
  textureContext.textBaseline = "middle";
  textureContext.font = "15px Aptos, Arial, sans-serif";
  textureContext.fillText("Q-Bias - Political News Dataset (no", x + 260, y + 23);
  textureContext.fillText("'center' label)", x + 260, y + 41);
  textureContext.fillText("Fine Tuning", x + 59, y + 206);
  textureContext.fillText("Processed Dataset", x + 262, y + 204);
  textureContext.fillText("Llama Responses", x + 160, y + 315);
  textureContext.fillText("Mistral Responses", x + 250, y + 337);
  textureContext.fillText("Deepseek Responses", x + 365, y + 315);
  textureContext.fillText("Hallucination Annotations", x + 215, y + 448);
  textureContext.fillText("Hallucinations Datasets", x + 217, y + 504);
  textureContext.fillText("Hallucinations Predicted", x + 217, y + 553);
  textureContext.fillText("Leanings", x + 217, y + 571);
  textureContext.fillText("Shape Classes:", x + 436, y + 18);
  textureContext.fillText("Dataset", x + 436, y + 48);
  textureContext.fillText("Process", x + 436, y + 86);
  textureContext.fillText("Model", x + 436, y + 124);

  textureContext.restore();
}

function drawThesisBarChart(textureContext, x, y, width, height) {
  const labels = [
    "Coronavirus",
    "Economy And Jobs",
    "Supreme Court",
    "World",
    "Middle East",
    "Immigration",
    "Elections",
    "US House",
    "Politics",
    "Presidential Elections",
    "Healthcare",
    "Gun Control And Gun Rights",
    "White House"
  ];
  const series = [
    { label: "Llama", color: "#1f77b4", values: [6, 11, 17, 11, 15, 17, 19, 20, 21, 19, 25, 18, 19] },
    { label: "Mistral", color: "#ff7f0e", values: [10, 18, 23, 15, 17, 21, 24, 23, 26, 25, 26, 32, 23] },
    { label: "Deepseek", color: "#2ca02c", values: [17, 24, 25, 26, 32, 33, 35, 35.5, 35.5, 36.5, 36.8, 40, 41.5] }
  ];
  const maxValue = 42;
  const chartLeft = x + 155;
  const chartTop = y + 28;
  const chartWidth = 390;
  const chartHeight = 280;
  const rowHeight = chartHeight / labels.length;
  const clusterHeight = Math.min(19, rowHeight * 0.76);
  const barHeight = clusterHeight / 3.3;

  textureContext.save();
  textureContext.fillStyle = "#111111";
  textureContext.textAlign = "center";
  textureContext.textBaseline = "top";
  textureContext.font = "14px Aptos, Arial, sans-serif";
  textureContext.fillText("Top Hallucinated Topics by Model (Normalized by Baseline)", x + width / 2, y);

  textureContext.strokeStyle = "#a6a6a6";
  textureContext.lineWidth = 1.6;
  textureContext.strokeRect(chartLeft, chartTop, chartWidth, chartHeight);

  textureContext.strokeStyle = "#d8d8d8";
  textureContext.lineWidth = 1;

  for (let tick = 0; tick <= 8; tick += 1) {
    const tickX = chartLeft + (chartWidth * tick) / 8;
    textureContext.beginPath();
    textureContext.moveTo(tickX, chartTop);
    textureContext.lineTo(tickX, chartTop + chartHeight);
    textureContext.stroke();
  }

  textureContext.fillStyle = "#555555";
  textureContext.textBaseline = "middle";
  textureContext.textAlign = "right";
  textureContext.font = "12px Aptos, Arial, sans-serif";

  for (let index = 0; index < labels.length; index += 1) {
    const rowY = chartTop + rowHeight * index + rowHeight / 2;
    textureContext.fillText(labels[index], chartLeft - 6, rowY);
  }

  for (let row = 0; row < labels.length; row += 1) {
    const top = chartTop + rowHeight * row + (rowHeight - clusterHeight) / 2;

    for (let seriesIndex = 0; seriesIndex < series.length; seriesIndex += 1) {
      const entry = series[seriesIndex];
      const barTop = top + seriesIndex * (barHeight + 1);
      const barWidth = (entry.values[row] / maxValue) * chartWidth;
      textureContext.fillStyle = entry.color;
      textureContext.fillRect(chartLeft, barTop, barWidth, barHeight);
    }
  }

  textureContext.textAlign = "center";
  textureContext.textBaseline = "top";
  textureContext.fillStyle = "#555555";

  for (let tick = 0; tick <= 8; tick += 1) {
    const tickX = chartLeft + (chartWidth * tick) / 8;
    textureContext.fillText(String(tick * 5), tickX, chartTop + chartHeight + 5);
  }

  textureContext.fillStyle = "#444444";
  textureContext.fillText("Hallucination Rate Relative to Baseline (%)", chartLeft + chartWidth / 2, chartTop + chartHeight + 24);

  textureContext.textAlign = "left";
  textureContext.textBaseline = "middle";

  for (let index = 0; index < series.length; index += 1) {
    const legendX = x + 464;
    const legendY = y + 36 + index * 19;
    textureContext.fillStyle = series[index].color;
    textureContext.fillRect(legendX, legendY, 15, 8);
    textureContext.fillStyle = "#555555";
    textureContext.fillText(series[index].label, legendX + 22, legendY + 4);
  }

  textureContext.restore();
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

  if (config.content?.type === "thesis") {
    addSprite(spriteCollection, {
      image: thesisPlaqueTexture,
      points: getWallQuad(config.wall, 6.25, 2.24, 2.05, 2.5, frameDepth + 0.002),
      depthBias: -2.6,
      interactive: {
        hotspot: THESIS_PLAQUE_BUTTON_BOUNDS,
        url: THESIS_PDF_URL
      }
    });
  }

  if (config.content?.type === "parametric") {
    addSprite(spriteCollection, {
      image: parametricPlaqueTexture,
      points: getWallQuad(config.wall, 6.2, 2.32, 2.2, 1.85, frameDepth + 0.002),
      depthBias: -2.6
    });
  }

  if (config.content?.type === "treeBiodiversity") {
    addSprite(spriteCollection, {
      image: treeBiodiversityPlaqueTexture,
      points: getWallQuad(config.wall, -6.8, 2.12, 2.6, 2.4, frameDepth + 0.002),
      depthBias: -2.6,
      interactive: {
        hotspot: TREE_VIDEO_BUTTON_BOUNDS,
        url: TREE_VIDEO_URL
      }
    });
  }
}

function createThesisPlaqueTexture() {
  const texture = document.createElement("canvas");
  texture.width = 760;
  texture.height = 820;
  const textureContext = texture.getContext("2d");
  const inset = 28;
  const buttonWidth = THESIS_PLAQUE_BUTTON_BOUNDS.width;
  const buttonHeight = THESIS_PLAQUE_BUTTON_BOUNDS.height;
  const buttonX = THESIS_PLAQUE_BUTTON_BOUNDS.x;
  const buttonY = THESIS_PLAQUE_BUTTON_BOUNDS.y;

  textureContext.fillStyle = "#fdfcf9";
  textureContext.strokeStyle = "rgba(41, 36, 31, 0.18)";
  textureContext.lineWidth = 6;
  roundRect(textureContext, inset, inset, texture.width - inset * 2, texture.height - inset * 2, 32);
  textureContext.fill();
  textureContext.stroke();

  textureContext.fillStyle = "#131313";
  textureContext.textAlign = "center";
  textureContext.textBaseline = "middle";
  textureContext.font = "700 92px Georgia, serif";
  textureContext.fillText("Bachelor", texture.width / 2, 240);
  textureContext.fillText("Thesis", texture.width / 2, 350);

  textureContext.fillStyle = "#ffffff";
  textureContext.strokeStyle = "#111111";
  textureContext.lineWidth = 8;
  roundRect(textureContext, buttonX, buttonY, buttonWidth, buttonHeight, 40);
  textureContext.fill();
  textureContext.stroke();

  textureContext.fillStyle = "#111111";
  textureContext.font = "700 62px Aptos, 'Segoe UI', sans-serif";
  textureContext.fillText("Read More", texture.width / 2, buttonY + buttonHeight / 2 + 2);

  textureContext.font = "500 30px Aptos, 'Segoe UI', sans-serif";
  textureContext.fillText("* You can click on this button *", texture.width / 2, 738);

  return texture;
}

function createParametricPlaqueTexture() {
  const texture = document.createElement("canvas");
  texture.width = 760;
  texture.height = 620;
  const textureContext = texture.getContext("2d");
  const inset = 28;

  textureContext.fillStyle = "#fdfcf9";
  textureContext.strokeStyle = "rgba(41, 36, 31, 0.18)";
  textureContext.lineWidth = 6;
  roundRect(textureContext, inset, inset, texture.width - inset * 2, texture.height - inset * 2, 32);
  textureContext.fill();
  textureContext.stroke();

  textureContext.fillStyle = "#131313";
  textureContext.textAlign = "center";
  textureContext.textBaseline = "middle";
  textureContext.font = "700 76px Georgia, serif";
  textureContext.fillText("Parametric", texture.width / 2, 238);
  textureContext.fillText("Design", texture.width / 2, 332);

  textureContext.fillStyle = "rgba(19, 19, 19, 0.72)";
  textureContext.font = "500 40px Aptos, 'Segoe UI', sans-serif";
  textureContext.fillText("Work in progress", texture.width / 2, 462);

  return texture;
}

function createTreeBiodiversityPlaqueTexture() {
  const texture = document.createElement("canvas");
  texture.width = 860;
  texture.height = 860;
  const textureContext = texture.getContext("2d");
  const inset = 28;
  const buttonX = TREE_VIDEO_BUTTON_BOUNDS.x;
  const buttonY = TREE_VIDEO_BUTTON_BOUNDS.y;
  const buttonWidth = TREE_VIDEO_BUTTON_BOUNDS.width;
  const buttonHeight = TREE_VIDEO_BUTTON_BOUNDS.height;
  const helperTextY = 734;

  textureContext.fillStyle = "#fdfcf9";
  textureContext.strokeStyle = "rgba(41, 36, 31, 0.18)";
  textureContext.lineWidth = 6;
  roundRect(textureContext, inset, inset, texture.width - inset * 2, texture.height - inset * 2, 32);
  textureContext.fill();
  textureContext.stroke();

  textureContext.fillStyle = "#131313";
  textureContext.textAlign = "center";
  textureContext.textBaseline = "middle";
  textureContext.font = "700 64px Georgia, serif";
  textureContext.fillText("Tree Biodiversity", texture.width / 2, 220);
  textureContext.fillText("in Amsterdam", texture.width / 2, 306);

  textureContext.fillStyle = "rgba(19, 19, 19, 0.78)";
  textureContext.font = "500 42px Aptos, 'Segoe UI', sans-serif";
  textureContext.fillText("Watch the video:", texture.width / 2, 426);

  textureContext.fillStyle = "#ffffff";
  textureContext.strokeStyle = "#111111";
  textureContext.lineWidth = 8;
  roundRect(textureContext, buttonX, buttonY, buttonWidth, buttonHeight, 40);
  textureContext.fill();
  textureContext.stroke();

  textureContext.fillStyle = "#111111";
  textureContext.font = "700 54px Aptos, 'Segoe UI', sans-serif";
  textureContext.fillText("Watch Here", texture.width / 2, buttonY + buttonHeight / 2 + 1);

  textureContext.fillStyle = "rgba(19, 19, 19, 0.78)";
  textureContext.font = "500 28px Aptos, 'Segoe UI', sans-serif";
  textureContext.fillText("* you can click on this button *", texture.width / 2, helperTextY);

  return texture;
}

function roundRect(drawingContext, x, y, width, height, radius) {
  const clampedRadius = Math.min(radius, width / 2, height / 2);
  drawingContext.beginPath();
  drawingContext.moveTo(x + clampedRadius, y);
  drawingContext.arcTo(x + width, y, x + width, y + height, clampedRadius);
  drawingContext.arcTo(x + width, y + height, x, y + height, clampedRadius);
  drawingContext.arcTo(x, y + height, x, y, clampedRadius);
  drawingContext.arcTo(x, y, x + width, y, clampedRadius);
  drawingContext.closePath();
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

function getProjectedSpriteQuad(sprite) {
  const nearPlane = 0.08;
  const cameraPoints = sprite.points.map(toCameraSpace);

  if (cameraPoints.some((point) => point.z <= nearPlane)) {
    return null;
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

  return [topLeft, topRight, bottomRight, bottomLeft];
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

  const projectedQuad = getProjectedSpriteQuad(sprite);

  if (!projectedQuad) {
    return;
  }

  const [topLeft, topRight, bottomRight, bottomLeft] = projectedQuad;

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

  return projectedQuad;
}

function getCanvasPointerPosition(event) {
  const bounds = canvas.getBoundingClientRect();

  return {
    x: event.clientX - bounds.left,
    y: event.clientY - bounds.top
  };
}

function isPointInPolygon(point, polygon) {
  let isInside = false;

  for (let currentIndex = 0, previousIndex = polygon.length - 1; currentIndex < polygon.length; previousIndex = currentIndex, currentIndex += 1) {
    const current = polygon[currentIndex];
    const previous = polygon[previousIndex];
    const intersects = ((current.y > point.y) !== (previous.y > point.y))
      && (point.x < ((previous.x - current.x) * (point.y - current.y)) / ((previous.y - current.y) || Number.EPSILON) + current.x);

    if (intersects) {
      isInside = !isInside;
    }
  }

  return isInside;
}

function getBarycentricWeights(point, a, b, c) {
  const denominator = ((b.y - c.y) * (a.x - c.x)) + ((c.x - b.x) * (a.y - c.y));

  if (Math.abs(denominator) < Number.EPSILON) {
    return null;
  }

  const weightA = (((b.y - c.y) * (point.x - c.x)) + ((c.x - b.x) * (point.y - c.y))) / denominator;
  const weightB = (((c.y - a.y) * (point.x - c.x)) + ((a.x - c.x) * (point.y - c.y))) / denominator;
  const weightC = 1 - weightA - weightB;

  return { weightA, weightB, weightC };
}

function getTexturePointInQuad(point, quad, sourceWidth, sourceHeight) {
  const triangles = [
    {
      points: [quad[0], quad[1], quad[2]],
      uv: [{ u: 0, v: 0 }, { u: 1, v: 0 }, { u: 1, v: 1 }]
    },
    {
      points: [quad[0], quad[2], quad[3]],
      uv: [{ u: 0, v: 0 }, { u: 1, v: 1 }, { u: 0, v: 1 }]
    }
  ];

  for (const triangle of triangles) {
    const weights = getBarycentricWeights(point, triangle.points[0], triangle.points[1], triangle.points[2]);

    if (!weights) {
      continue;
    }

    const epsilon = -0.001;

    if (weights.weightA >= epsilon && weights.weightB >= epsilon && weights.weightC >= epsilon) {
      const u = (weights.weightA * triangle.uv[0].u) + (weights.weightB * triangle.uv[1].u) + (weights.weightC * triangle.uv[2].u);
      const v = (weights.weightA * triangle.uv[0].v) + (weights.weightB * triangle.uv[1].v) + (weights.weightC * triangle.uv[2].v);

      return {
        x: u * sourceWidth,
        y: v * sourceHeight
      };
    }
  }

  return null;
}

function getInteractiveRegionAtPoint(point) {
  for (const region of state.interactiveRegions) {
    if (!isPointInPolygon(point, region.points)) {
      continue;
    }

    if (!region.hotspot) {
      return region;
    }

    const texturePoint = getTexturePointInQuad(point, region.points, region.sourceWidth, region.sourceHeight);

    if (!texturePoint) {
      continue;
    }

    const { hotspot } = region;
    const withinHotspotX = texturePoint.x >= hotspot.x && texturePoint.x <= hotspot.x + hotspot.width;
    const withinHotspotY = texturePoint.y >= hotspot.y && texturePoint.y <= hotspot.y + hotspot.height;

    if (withinHotspotX && withinHotspotY) {
      return region;
    }
  }

  return null;
}

function render() {
  context.clearRect(0, 0, state.width, state.height);
  state.interactiveRegions = [];

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
    const projectedQuad = drawProjectedSprite(entry.sprite);

    if (projectedQuad && entry.sprite.interactive) {
      const source = entry.sprite.image;
      state.interactiveRegions.push({
        hotspot: entry.sprite.interactive.hotspot || null,
        points: projectedQuad,
        sourceHeight: source.naturalHeight || source.videoHeight || source.height,
        sourceWidth: source.naturalWidth || source.videoWidth || source.width,
        url: entry.sprite.interactive.url
      });
    }
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
  lockStatus.textContent = "Press Escape to leave";
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

function openInteractiveRegion(region) {
  if (!region?.url) {
    return;
  }

  window.open(region.url, "_blank", "noopener");
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
    const region = getInteractiveRegionAtPoint(getCanvasPointerPosition(event));
    canvas.style.cursor = region
      ? 'url("customCursor/p1-medium.cur"), pointer'
      : 'url("customCursor/p3-medium.cur"), auto';
    return;
  }

  player.yaw -= event.movementX * movement.lookSensitivity;
  player.pitch += event.movementY * movement.lookSensitivity * 0.9;
  player.pitch = clamp(player.pitch, -1.25, 1.25);
});

canvas.addEventListener("click", (event) => {
  if (document.pointerLockElement === canvas) {
    const region = getInteractiveRegionAtPoint({
      x: state.width / 2,
      y: state.height / 2
    });

    if (region) {
      openInteractiveRegion(region);
    }

    return;
  }

  const region = getInteractiveRegionAtPoint(getCanvasPointerPosition(event));

  if (region) {
    openInteractiveRegion(region);
    return;
  }

  requestLock();
});
lockButton.addEventListener("click", requestLock);

resizeCanvas();
render();
updateHud();
requestAnimationFrame(frame);
