// UNDERTONE v2 by Phillip Jones, ART-74
let hueS, satS, briS, opS, sizeS;
let choice = 0;
let drawing = false;
let px = 0; // left edge of the brush panel
let undoBtn, clearBtn, saveBtn;
let history = []; // saved copies of the canvas for undo
let penSeen = false; // once the Apple Pencil is used, ignore finger/palm touches
let sx, sy; // smoothed pen position
const names = ['Pen', 'Pencil', 'Paintbrush', 'Blur', 'Eraser', 'Marker', 'Calligraphy', 'Spray', 'Watercolor', 'Eyedropper'];

function setup() {
  pixelDensity(1);
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.position(0, 0);
  cnv.style('touch-action', 'none');
  colorMode(HSB, 360, 100, 100, 100);
  background(0, 0, 100);

  hueS = createSlider(0, 360, 20);
  satS = createSlider(0, 100, 60);
  briS = createSlider(0, 100, 30);
  opS = createSlider(1, 100, 100);
  sizeS = createSlider(1, 100, 12);
  undoBtn = createButton('undo');
  undoBtn.mousePressed(undo);
  clearBtn = createButton('clear');
  clearBtn.mousePressed(clearCanvas);
  saveBtn = createButton('save');
  saveBtn.mousePressed(saveImg);
  placeControls();

  // pointer events tell us if it's the Pencil, a finger, or a mouse, and how hard you press
  let c = cnv.elt;
  c.addEventListener('pointerdown', penDown);
  c.addEventListener('pointermove', penMove);
  c.addEventListener('pointerup', penUp);
  c.addEventListener('pointercancel', penUp);
}

// put the panel on the right edge of the window
function placeControls() {
  px = width - 200;
  let all = [hueS, satS, briS, opS, sizeS];
  for (let i = 0; i < 5; i++) {
    all[i].position(px + 10, 25 + i * 45);
    all[i].style('width', '170px');
  }
  undoBtn.position(px + 10, 655);
  clearBtn.position(px + 70, 655);
  saveBtn.position(px + 130, 655);
}

// keep the drawing when the window changes size
function windowResized() {
  let old = get(0, 0, px, height);
  resizeCanvas(windowWidth, windowHeight);
  background(0, 0, 100);
  image(old, 0, 0);
  placeControls();
}

function draw() {
  drawPanel();
}

function penDown(e) {
  if (e.pointerType == 'pen') penSeen = true;
  if (e.pointerType == 'touch' && penSeen) return; // palm rejection
  let x = e.offsetX;
  let y = e.offsetY;

  if (x >= px) { // tapped the panel: pick a brush
    pickBrush(x, y);
    return;
  }
  if (choice == 9) { // eyedropper
    pickColor(x, y);
    return;
  }
  saveState();
  drawing = true;
  sx = x;
  sy = y;
}

function penMove(e) {
  if (!drawing) return;
  if (e.pointerType == 'touch' && penSeen) return;
  // the Pencil can send several points per frame, use them all for smooth lines
  let events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
  if (events.length == 0) events = [e];
  for (let ev of events) {
    let nx = lerp(sx, ev.offsetX, 0.45); // smoothing
    let ny = lerp(sy, ev.offsetY, 0.45);
    let pressure = ev.pointerType == 'pen' ? max(ev.pressure, 0.05) * 1.6 : 1;
    if (nx < px) {
      brush(choice, nx, ny, sx, sy, sizeS.value() * pressure, opS.value() / 100);
    }
    sx = nx;
    sy = ny;
  }
}

function penUp(e) {
  drawing = false;
}

function brush(i, x, y, px, py, s, op) {
  let h = hueS.value();
  let sa = satS.value();
  let b = briS.value();

  if (i == 0) { // pen
    stroke(h, sa, b, 100 * op);
    strokeWeight(s);
    line(x, y, px, py);
  } else if (i == 1) { // pencil
    strokeWeight(1);
    stroke(h, sa, b, 40 * op);
    for (let k = 0; k < 4; k++) {
      let ox = random(-s / 4, s / 4);
      let oy = random(-s / 4, s / 4);
      line(x + ox, y + oy, px + ox, py + oy);
    }
  } else if (i == 2) { // paintbrush
    strokeWeight(2);
    stroke(h, sa, b, 60 * op);
    for (let k = 0; k < 8; k++) {
      let ox = random(-s / 2, s / 2);
      let oy = random(-s / 2, s / 2);
      line(x + ox, y + oy, px + ox, py + oy);
    }
  } else if (i == 3) { // blur
    let p = get(x - s, y - s, s * 2, s * 2);
    p.filter(BLUR, 1);
    image(p, x - s, y - s, s * 2, s * 2);
  } else if (i == 4) { // eraser
    stroke(0, 0, 100);
    strokeWeight(s);
    line(x, y, px, py);
  } else if (i == 5) { // marker
    stroke(h, sa, b, 35 * op);
    strokeWeight(s);
    strokeCap(SQUARE);
    line(x, y, px, py);
    strokeCap(ROUND);
  } else if (i == 6) { // calligraphy, slanted nib
    noStroke();
    fill(h, sa, b, 100 * op);
    let d = s / 3;
    quad(px - d, py + d, px + d, py - d, x + d, y - d, x - d, y + d);
  } else if (i == 7) { // spray
    stroke(h, sa, b, 70 * op);
    strokeWeight(1.5);
    for (let k = 0; k < 15; k++) {
      let a = random(TWO_PI);
      let r = random(s);
      point(x + cos(a) * r, y + sin(a) * r);
    }
  } else if (i == 8) { // watercolor
    noStroke();
    fill(h, sa, b, 5 * op);
    for (let k = 0; k < 3; k++) {
      ellipse(x + random(-s / 3, s / 3), y + random(-s / 3, s / 3), s * 2, s * 2);
    }
  }
}

// eyedropper: set the sliders to the color you tap
function pickColor(x, y) {
  let c = get(x, y);
  colorMode(RGB, 255);
  let col = color(c[0], c[1], c[2]);
  colorMode(HSB, 360, 100, 100, 100);
  hueS.value(hue(col));
  satS.value(saturation(col));
  briS.value(brightness(col));
}

function saveState() {
  history.push(get(0, 0, px, height));
  if (history.length > 20) history.shift(); // keep the last 20 steps
}

function undo() {
  if (history.length > 0) {
    image(history.pop(), 0, 0);
  }
}

function drawPanel() {
  noStroke();
  fill(0, 0, 92);
  rect(px, 0, 200, height);

  fill(0, 0, 0);
  textSize(12);
  text('Hue', px + 10, 20);
  text('Saturation', px + 10, 65);
  text('Brightness', px + 10, 110);
  text('Opacity', px + 10, 155);
  text('Size', px + 10, 200);

  fill(hueS.value(), satS.value(), briS.value(), opS.value());
  rect(px + 10, 230, 170, 10);

  for (let i = 0; i < 10; i++) {
    let bx = px + 5 + (i % 2) * 100;
    let by = 250 + floor(i / 2) * 77;

    noStroke();
    fill(0, 0, 80);
    rect(bx, by, 90, 70);

    // nib picture: a small wavy mark made with the real brush
    randomSeed(i);
    if (i == 3) { // blur
      noStroke();
      for (let k = 0; k < 5; k++) {
        fill(hueS.value(), satS.value(), briS.value(), 100 - k * 18);
        ellipse(bx + 45, by + 40, 10 + k * 14);
      }
    } else if (i == 9) { // eyedropper
      stroke(0, 0, 20);
      strokeWeight(3);
      line(bx + 30, by + 55, bx + 55, by + 30);
      noStroke();
      fill(hueS.value(), satS.value(), briS.value());
      ellipse(bx + 60, by + 25, 16);
    } else {
      for (let t = 0.04; t < 1; t += 0.04) {
        let x1 = bx + 12 + t * 66;
        let y1 = by + 40 + sin(t * TWO_PI) * 14;
        let x0 = bx + 12 + (t - 0.04) * 66;
        let y0 = by + 40 + sin((t - 0.04) * TWO_PI) * 14;
        brush(i, x1, y1, x0, y0, i == 0 ? 4 : 14, 1);
      }
    }

    if (i == choice) {
      noFill();
      stroke(0, 0, 0);
      strokeWeight(3);
      rect(bx, by, 90, 70);
    }
    noStroke();
    fill(0, 0, 0);
    textSize(11);
    text((i + 1) % 10 + ' ' + names[i], bx + 4, by + 12);
  }
  randomSeed(millis());
}

function pickBrush(x, y) {
  for (let i = 0; i < 10; i++) {
    let bx = px + 5 + (i % 2) * 100;
    let by = 250 + floor(i / 2) * 77;
    if (x > bx && x < bx + 90 && y > by && y < by + 70) {
      choice = i;
    }
  }
}

function clearCanvas() {
  saveState();
  noStroke();
  fill(0, 0, 100);
  rect(0, 0, px, height);
}

function saveImg() {
  save(get(0, 0, px, height), 'drawing.png');
}

function keyPressed() {
  let i = '1234567890'.indexOf(key);
  if (i >= 0) choice = i;
  if (key == 'z') undo();
  if (key == 'x') clearCanvas();
  if (key == 'p') saveImg();
}
