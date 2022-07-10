var canvas = document.createElement('canvas');
var ctx = canvas.getContext('2d');
// var colors = [
//   'rgba(69,204,255,.95)',
//   'rgba(73,232,62,.95)',
//   'rgba(255,212,50,.95)',
//   'rgba(232,75,48,.95)',
//   'rgba(178,67,255,.95)'
// ];

const COLOR = [
  '#ff0043',
  '#14fc56',
  '#1e7fff',
  '#e60aff',
  '#ffbf36',
  '#ffffff'
];

// Configure settings options
var config = {
  starSize: 5,
  starSpeed: 1
};
var settings = document.getElementById('settings');
initSettings2();

function initSettings2 () {
  settings.btnSet.onclick = function () {
    config.starSize = Number(settings.StarSize.value);
    config.starSpeed = Number(settings.StarSpeed.value);
  };
  settings.btnClear.onclick = function () {
    clear();
  };
}

resize();
settings.btnSet.onclick();
document.body.appendChild(canvas);
window.onresize = resize;

let fireworks = [];
const isRunning = true;
let overTime = new Date();
window.requestAnimationFrame(fire);
function fire () {
  if (isRunning) {
    createFirework();
  }

  for (var i = 0; i < fireworks.length; i++) {
    var p = fireworks[i];
    p.move();
    p.draw(ctx);
  }
  fade();
  window.requestAnimationFrame(fire);
}

function createFirework() {
  if (new Date() - overTime > 1000) {
    console.log('fireworks:', fireworks);
    const x = rand(0, canvas.width);
    fireworks.push(new Star({
      pos: [x, 0],
      size: config.starSize,
      speed: [0, config.starSpeed]
    }));
    overTime = new Date();
  }
}

class BasicObject {
  constructor(args) {
    const def = {
      gravity: 1,
      acceleration: [0, 0],
      airFriction: 0.009,
      pos: [0, 0],
      color: '#ffbf36', // gold
      speed: [0, 1],
      boomHeight: 1000
    };
    Object.assign(def, args);
    Object.assign(this, def);
  }

  get airFrictionA () {
    return this.speed.map(num => -this.airFriction * Math.pow(num, 2));
  }

  move() {
    // console.log('this.airFrictionA:', this.airFrictionA);
    this.speed[0] += (this.acceleration[0] + this.airFrictionA[0]) / 60;
    this.speed[1] += (this.acceleration[1] - this.gravity + this.airFrictionA[1]) / 60;
    this.pos[0] += this.speed[0];
    this.pos[1] += this.speed[1];
  }

  draw() {
  }

  death() {
    fireworks = fireworks.filter(obj => obj !== this);
  }

  drawRect (ctx, pos, width, height, angle, fillColor) {
    ctx.save();
    ctx.fillStyle = fillColor;
    ctx.translate(pos[0], canvas.height - pos[1]);
    ctx.rotate(angle * Math.PI / 180);
    ctx.fillRect(-width / 2, height / 2, width / 2, height / 2);
    ctx.restore();
  }
}

class Star extends BasicObject {
  constructor(args) {
    super(args);
    const def = {
      pos: [0, 0],
      vertor: {},
      color: 'gold',
      speed: [0, 5],
      size: 5,
      boomHeight: 500
    };
    Object.assign(def, args);
    Object.assign(this, def);
  }

  move() {
    super.move();
    if (this.pos[1] > this.boomHeight) this.death();
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.pos[0], canvas.height - this.pos[1], this.size, 0, 2 * Math.PI);
    // ctx.closePath();
    ctx.fill();
  }

  death() {
    const comets = [];
    let angle = 0;
    const color = COLOR[~~rand(0, COLOR.length - 1)];
    while (angle < 360) {
      const ss = rand(0, 10) < 3 ? rand(0, 2) : rand(2, 4);

      const state = {
        speed: [
          ss * Math.sin(angle * Math.PI / 180),
          ss * Math.cos(angle * Math.PI / 180)
        ],
        color,
        pos: [...this.pos],
        life: 50
      };
      comets.push(new Comet(state));
      angle += rand(1, 2);
    }
    super.death();
    // fireworks = fireworks.filter(obj => obj !== this);
    fireworks.push(...comets);
  }
}

// Comet
class Comet extends BasicObject {
  constructor(args) {
    super(args);
    const def = {
      pos: [0, 0],
      vertor: {},
      color: 'fff',
      speed: [0, 0],
      angle: rand(0, 360),
      size: rand(1, 10),
      life: 50
    };
    Object.assign(def, args);
    Object.assign(this, def);
  }

  draw() {
    if (!this.life) this.death();
    this.life--;
    this.drawRect(ctx, this.pos, this.size, this.size, this.angle, this.color);
    // ctx.fillStyle = this.color;
    // ctx.beginPath();
    // ctx.arc(this.pos[0], canvas.height - this.pos[1], this.size, 0, 1 * Math.PI);
    // ctx.closePath();
    // ctx.fill();
  }

  death() {
    super.death();
  }
}

function fade () {
  ctx.beginPath();
  ctx.fillStyle = 'rgba(0, 0, 0, .1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fill();
}
function clear () {
  ctx.beginPath();
  ctx.fillStyle = 'rgba(0, 0, 0, 1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fill();
  fireworks.length = 0;
}
function resize () {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}
