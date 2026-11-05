let hueS, satS, briS, sizeS;
let choice = 0;
let drawing = false;
const names = ['Pen', 'Pencil', 'Paintbrush', 'Blur', 'Eraser', 'Marker', 'Calligraphy', 'Spray', 'Watercolor', 'Dots'];

function setup() {
  pixelDensity(1);
  let cnv = createCanvas(800, 640);
  cnv.position(0, 0);
  cnv.style('touch-action', 'none');
  colorMode(HSB, 360, 100, 100, 100);
  background(0, 0, 100);

  hueS = createSlider(0, 360, 20);
  satS = createSlider(0, 100, 60);
  briS = createSlider(0, 100, 30);
  sizeS = createSlider(4, 60, 20);
  let all = [hueS, satS, briS, sizeS];
  for (let i = 0; i < 4; i++) {
    all[i].position(610, 25 + i * 45);
    all[i].style('width', '170px');
  }

  let clearBtn = createButton('clear');
  clearBtn.position(610, 600);
  clearBtn.mousePressed(clearCanvas);
  let saveBtn = createButton('save');
  saveBtn.position(700, 600);
  saveBtn.mousePressed(saveImg);
}

function draw() {
  if (drawing) {
    brush(choice, mouseX, mouseY, pmouseX, pmouseY, sizeS.value());
  }
  drawPanel();
}

function brush(i, x, y, px, py, s) {
  let h = hueS.value();
  let sa = satS.value();
  let b = briS.value();

  if (i == 0) { // pen
    stroke(h, sa, b);
    strokeWeight(s / 4);
    line(x, y, px, py);
  } else if (i == 1) { // pencil
    strokeWeight(1);
    stroke(h, sa, b, 40);
    for (let k = 0; k < 4; k++) {
      let ox = random(-s / 4, s / 4);
      let oy = random(-s / 4, s / 4);
      line(x + ox, y + oy, px + ox, py + oy);
    }
  } else if (i == 2) { // paintbrush
    strokeWeight(2);
    stroke(h, sa, b, 60);
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
    stroke(h, sa, b, 35);
    strokeWeight(s);
    strokeCap(SQUARE);
    line(x, y, px, py);
    strokeCap(ROUND);
  } else if (i == 6) { // calligraphy, slanted nib
    noStroke();
    fill(h, sa, b);
    let d = s / 3;
    quad(px - d, py + d, px + d, py - d, x + d, y - d, x - d, y + d);
  } else if (i == 7) { // spray
    stroke(h, sa, b, 70);
    strokeWeight(1.5);
    for (let k = 0; k < 15; k++) {
      let a = random(TWO_PI);
      let r = random(s);
      point(x + cos(a) * r, y + sin(a) * r);
    }
  } else if (i == 8) { // watercolor
    noStroke();
    fill(h, sa, b, 5);
    for (let k = 0; k < 3; k++) {
      ellipse(x + random(-s / 3, s / 3), y + random(-s / 3, s / 3), s * 2, s * 2);
    }
  } else if (i == 9) { // dots
    noStroke();
    fill(h, sa, b);
    if (random() < 0.25) {
      ellipse(x + random(-s, s), y + random(-s, s), random(2, s / 2));
    }
  }
}

function drawPanel() {
  noStroke();
  fill(0, 0, 92);
  rect(600, 0, 200, 640);

  fill(0, 0, 0);
  textSize(12);
  text('Hue', 610, 20);
  text('Saturation', 610, 65);
  text('Brightness', 610, 110);
  text('Size', 610, 155);

  fill(hueS.value(), satS.value(), briS.value());
  rect(610, 185, 170, 10);

  for (let i = 0; i < 10; i++) {
    let bx = 605 + (i % 2) * 100;
    let by = 205 + floor(i / 2) * 77;

    noStroke();
    fill(0, 0, 80);
    rect(bx, by, 90, 70);

    // nib picture: a small wavy mark made with the real brush
    randomSeed(i);
    if (i == 3) {
      noStroke();
      for (let k = 0; k < 5; k++) {
        fill(hueS.value(), satS.value(), briS.value(), 100 - k * 18);
        ellipse(bx + 45, by + 40, 10 + k * 14);
      }
    } else {
      for (let t = 0.04; t < 1; t += 0.04) {
        let x1 = bx + 12 + t * 66;
        let y1 = by + 40 + sin(t * TWO_PI) * 14;
        let x0 = bx + 12 + (t - 0.04) * 66;
        let y0 = by + 40 + sin((t - 0.04) * TWO_PI) * 14;
        brush(i, x1, y1, x0, y0, 14);
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

function startPress() {
  drawing = mouseX < 600 && mouseY < 600;
  for (let i = 0; i < 10; i++) {
    let bx = 605 + (i % 2) * 100;
    let by = 205 + floor(i / 2) * 77;
    if (mouseX > bx && mouseX < bx + 90 && mouseY > by && mouseY < by + 70) {
      choice = i;
    }
  }
}

function mousePressed() {
  startPress();
}

function mouseReleased() {
  drawing = false;
}

function touchStarted() {
  startPress();
  return !drawing; // stops the page from scrolling while you draw
}

function touchEnded() {
  drawing = false;
}

function clearCanvas() {
  background(0, 0, 100);
}

function saveImg() {
  save(get(0, 0, 600, 600), 'drawing.png');
}

function keyPressed() {
  let i = '1234567890'.indexOf(key);
  if (i >= 0) choice = i;
  if (key == 'x') clearCanvas();
  if (key == 'p') saveImg();
}
