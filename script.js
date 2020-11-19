const imageUpload = document.getElementById("imageUpload");
const userFace = document.getElementById("userFace");
const cats = document.getElementById("cats");
const status = document.getElementById("status");
let resizedDetections;
let landMarkMode = true;
let expressionMode = true;
let image;
let canvas;

Promise.all([
  faceapi.nets.faceRecognitionNet.loadFromUri("./models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("./models"),
  faceapi.nets.ssdMobilenetv1.loadFromUri("./models"),
  faceapi.nets.faceExpressionNet.loadFromUri("./models")
]).then(start);

async function start() {
  document.getElementById("before").style.display = "none";
  document.getElementById("after").style.display = "block";
  const container = document.createElement("div");
  container.style.position = "relative";
  userFace.append(container);
  imageUpload.addEventListener("change", async () => {
    if (image) image.remove();
    if (canvas) canvas.remove();
    image = await faceapi.bufferToImage(imageUpload.files[0]);
    container.append(image);
    canvas = faceapi.createCanvasFromMedia(image);
    container.append(canvas);
    const displaySize = { width: image.width, height: image.height };
    faceapi.matchDimensions(canvas, displaySize);
    const detections = await faceapi
      .detectAllFaces(image)
      .withFaceLandmarks()
      .withFaceExpressions();
    resizedDetections = faceapi.resizeResults(detections, displaySize);
    drawThings(true);
    filterExpressions(resizedDetections);
  });
}

const expressionList = [
  "neutral",
  "happy",
  "sad",
  "angry",
  "fearful",
  "disgusted",
  "surprised"
];

filterExpressions = resizedDetections => {
  expressions = resizedDetections.map(face => {
    return face.expressions;
  });
  let filteredExpressions = []; // keep only Expressions with score > 0.1
  expressions.forEach((expression, index) => {
    let temp1 = [];
    let temp2 = [];
    expressionList.forEach(exp => {
      if (expression[exp] > 0.1) {
        temp1.push(exp);
        temp2.push(expression[exp]);
      }
    });
    // Sorting
    var len, i, j, stop;
    len = temp2.length;
    for (i = 0; i < len; i++) {
      for (j = 0, stop = len - i; j < stop; j++) {
        if (temp2[j] < temp2[j + 1]) {
          var temp = temp2[j];
          temp2[j] = temp2[j + 1];
          temp2[j + 1] = temp;
          temp = temp1[j];
          temp1[j] = temp1[j + 1];
          temp1[j + 1] = temp;
        }
      }
    }
    filteredExpressions.push({
      faceNo: "Face " + index,
      expressions: temp1,
      score: temp2
    });
  });
  getCats(filteredExpressions, expressions);
};

getCats = (filteredExpressions, expressions) => {
  cats.innerHTML = "";
  console.log("Expressions", expressions);
  console.log("Filtered Expressions", filteredExpressions);
  filteredExpressions.forEach(face => {
    let faceH1 = document.createElement("h1");
    faceH1.append(face.faceNo);
    let faceDiv = document.createElement("div");
    faceDiv.append(faceH1);
    let catsDiv = document.createElement("div");
    face.expressions.forEach((exp, i) => {
      let aCatFace = getCatFace(exp, face.score[i]);
      catsDiv.append(aCatFace);
      if (face.expressions[i + 1] != undefined) catsDiv.append(" + ");
    });
    catsDiv.style.display = "flex";
    faceDiv.append(catsDiv);
    cats.append(faceDiv);
  });
};

getCatFace = (exp, score) => {
  score *= 100;
  score = Math.floor(score);
  faceScore = 0;
  if (score > 80) faceScore = 100;
  else if (score > 60) faceScore = 80;
  else if (score > 40) faceScore = 60;
  else if (score > 20) faceScore = 40;
  else faceScore = 20;
  let tempH3 = document.createElement("h3");
  tempH3.append(exp + "  " + score + "%");
  tempH3.style.margin = 0;
  let imageElement = document.createElement("img");
  imageElement.height = "200";
  imageElement.src = `./newcats/${exp}${faceScore}.jpg`;
  let imageDiv = document.createElement("div");
  imageDiv.append(tempH3);
  imageDiv.append(imageElement);
  return imageDiv;
};

drawThings = () => {
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  resizedDetections.forEach((result, i) => {
    const box = result.detection.box;
    const drawBox = new faceapi.draw.DrawBox(box, { label: "Face " + i });
    drawBox.draw(canvas);
  });
  // faceapi.draw.drawDetections(canvas, resizedDetections);
  if (landMarkMode) faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
  if (expressionMode)
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
};

toggleLandmarks = () => {
  landMarkMode = !landMarkMode;
  drawThings();
};

toggleExpressions = () => {
  expressionMode = !expressionMode;
  drawThings();
};
