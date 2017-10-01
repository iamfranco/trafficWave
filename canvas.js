// GLOBAL
var numberOfCars = 20;
var radius = 300;

// CAR STATS
var initialSpeed = 3;
var maxSpeed = 3;
var acceleration = 0.1;
var brake = 0.2;
var carWidth = 25;
var carHeight = 10;

// DRIVER STATS
var brakingTime = 10; // reaction time (measured in frames)
var minDistanceForAccelerate = 10; // minimum space (in front) required for the drive to be willing to start accelerate

// MANUAL STOPPING
var stopDistance = 10;
var manualBrake = 0.5;

/////////// INTERNAL /////////////
var canvas = document.querySelector('canvas');
var c = canvas.getContext('2d');

var mouse = {
  x: undefined,
  y: undefined,
  r: undefined,
  theta: undefined,
  clicked: false
}
var mouseLineRadius = [radius - 50, radius + 50];

// get current mouse position (x, y)
window.addEventListener('mousemove', function(event) {
  mouse.x = event.x - innerWidth/2;
  mouse.y = event.y - innerHeight/2;
  mouse.r = Math.sqrt(mouse.x*mouse.x + mouse.y*mouse.y);
  mouse.theta = Math.acos(mouse.y/mouse.r)/Math.PI*180;
  if (mouse.x>0) mouse.theta = 360 - mouse.theta;
})

// get current mouse theta (angle) on MOUSEDOWN
window.addEventListener('mousedown', function() {
  mouse.clicked = true;
})

// reset mouse theta on MOUSEUP
window.addEventListener('mouseup', function() {mouse.clicked = false})

// re-initialize on RESIZE
window.addEventListener('resize', function() {init()})

// re-initialize when restart button CLICKED
document.querySelector('.btn').addEventListener('click', function() {init()})

var carArray = [];
function init() {
  carArray = [];
  // note: window.devicePixelRatio = 2 for retina, else 1
  canvas.width = window.innerWidth*window.devicePixelRatio;
  canvas.height = window.innerHeight*window.devicePixelRatio;
  canvas.style.width = canvas.width/window.devicePixelRatio+'px';
  canvas.style.height = canvas.height/window.devicePixelRatio+'px';
  c.scale(window.devicePixelRatio,window.devicePixelRatio);

  // populate carArray
  for (var i=0; i<numberOfCars; i++) carArray.push(new Car(360/numberOfCars * i))

  // set car-in-front
  for (var i=0; i<carArray.length; i++) carArray[i].nextCar = carArray[(i+1)%(carArray.length)]

  // set coordinate center (for circular movement around center)
  c.translate(innerWidth/2,innerHeight/2);
}

function animate() {
  requestAnimationFrame(animate);
  c.clearRect(-innerWidth/2,-innerHeight/2,innerWidth,innerHeight);

  // draw car
  for (var i=0; i<carArray.length; i++) carArray[i].update()

  // draw mouse line
  c.beginPath();
  c.moveTo(mouseLineRadius[0]*Math.sin(-mouse.theta*Math.PI/180),mouseLineRadius[0]*Math.cos(mouse.theta*Math.PI/180));
  c.lineTo(mouseLineRadius[1]*Math.sin(-mouse.theta*Math.PI/180),mouseLineRadius[1]*Math.cos(mouse.theta*Math.PI/180));
  c.strokeStyle = 'rgba(255,0,0,0.5)';
  c.stroke();
}

init();
animate();

// assign speed -> color
function speedToColor(v) {
  var r = Math.floor((1-v/maxSpeed)*180 + 75);
  var b = Math.floor(v/maxSpeed*155 + 100);
  var g = Math.floor(v/maxSpeed*50 + 75);
  return 'rgb('+r+','+g+','+b+')';
}

// return angle between a and b (b>a)
function angleDiff(a, b) {return (b - a + 360)%360}

function Car(theta) {
  this.theta = theta;
  this.radius = radius;
  this.dtheta = initialSpeed;
  this.width = carWidth;
  this.height = carHeight;
  this.color = speedToColor(this.dtheta);
  this.nextCar = undefined;

  this.draw = function() {
    c.rotate(this.theta * Math.PI / 180);
    c.fillStyle = this.color;
    c.fillRect(-this.width/2, this.radius, this.width, this.height);
    c.strokeStyle = '#fff';
    c.strokeRect(-this.width/2, this.radius, this.width, this.height);
    c.rotate(-this.theta * Math.PI / 180);
  }

  this.update = function() {
    // if car in front is too close
    if (angleDiff(this.theta, this.nextCar.theta) < brakingTime*this.dtheta) this.dtheta -= brake;

    // if user manually brakes car
    else if (mouse.clicked && angleDiff(this.theta, mouse.theta) < stopDistance) this.dtheta -= manualBrake;

    // if no traffic in front and car speed below maxSpeed
    else if (this.dtheta < maxSpeed && angleDiff(this.theta, this.nextCar.theta) > minDistanceForAccelerate) this.dtheta += acceleration

    // if car collide with car-in-front
    if (angleDiff(this.theta, this.nextCar.theta) <= this.width*180/radius/Math.PI) this.dtheta = 0

    // if car stopped (prevent braking into negative speed)
    if (this.dtheta <= 0) this.dtheta = 0

    this.theta += this.dtheta;
    this.theta = this.theta % 360;
    this.color = speedToColor(this.dtheta);
    this.draw();
  }
}
