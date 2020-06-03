var makerjs = require('makerjs');

//All formulas are based on Sensinger's findings and compilations!

// Numbers of inner gear teeth
var N = 10;
// Eccentricity of input shaft (mm)
var e = 4;
// Excenter radius (mm)
var eR = 20;
// Input shaft radius (mm)
var isR = 10;
// Transmission ratio
var ratio = -N - 1;

// Outer pin radius (mm)
var rP = 16;
// Radius of pin circle (Pins lie on this circle) (mm)
var rPC = 80;

// Radius of the output pins (mm)
var rOP = 7;
// Number of output pin holes (mm)
var nOPH = 8;
// Distance of output pin holes from center (mm)
var dOPH = 40;

// Inner roller holes offset tolerance
var dRPC = 0;

// Radius of output pin circles (mm)
var rOPC = rOP + e + dRPC;

// Tolerances
// Excentricity offset tolerance
var de = 0;
// Input shaft offset tolerance
var dIS = 0;
// Cycloidal drive profile offset tolerance
var dCDP = 0;
// Added tolerance "gap"
var dGAP = de + dRPC + dIS + dCDP;
// according to Sensinger, all toleranced add up and are subtracted from rPC
var rPC = rPC - dGAP;

// Drawing resolution in parts of 2 PI
var pNumber = 0.05;

// Formulas for the cycloidal disk:
// Cx = R*cos(PHI) − Rr*cos(PHI+PSI) − e cos((Z1 + 1)*PHI)
// Cy = − R*sin(PHI) + Rr*sin(PHI + PSI) + e*sin((Z1 + 1)*PHI)
// PHI is the angle of the input shaft
// PSI is the contact angle between disk and pins <=>
// PSI = tan-1( (sin(Z1*PHI)) / ( cos(Z1*PHI) - ( R / ( e * (Z1 + 1) ) ) ) )
// Z1 = N, R = rPC, Rr = rP


function psi(PHI) {
  a = Math.sin(N * PHI);
  b = Math.cos(N * PHI);
  c = (rPC / (e * (N + 1)));
  d = a / (b - c);
  PSI = Math.atan(d);
  return PSI;
}


function gearX(PHI) {
  return rPC * Math.cos(PHI) - rP * Math.cos(PHI + psi(PHI)) - (e * Math.cos((N + 1) * PHI));
}


function gearY(PHI) {
  return -rPC * Math.sin(PHI) + rP * Math.sin(PHI + psi(PHI)) + (e * Math.sin((N + 1) * PHI));
}


function rPmax() {
  return Math.sqrt((27 * N * (Math.pow(rPC, 2) - Math.pow(e, 2) * (Math.pow((N + 1), 2)))) / Math.pow((N + 2), 3));
  // return rPC * sin(pi / (N + 1)) --> alternative according to Sensinger
}


function rPCmin() {
  return Math.sqrt((Math.pow(rP, 2) * Math.pow((N + 2), 3)) / (27 * N) + Math.pow(e, 2) * Math.pow((N + 1), 2));
}


function eMax() {
  return Math.sqrt((27 * Math.pow(rPC, 2) * N - Math.pow(rP, 2) * Math.pow((N + 2), 3)) / (27 * N * Math.pow((N + 1), 2)));
}


function isUndercut() {
  if (e > eMax() || rPC < rPCmin() || rP > rPmax()) {
    return true;
  }
  return false;
}

function cycloidalDisk() {
  var points = [];
  
  // manual generation of a kind of plot
  for (i = 0; i < 2 * Math.PI; i += pNumber) {
    points.push([gearX(i), gearY(i)]);
  }

  this.models = {
    diskoutline: new makerjs.models.ConnectTheDots(true, points),
    innerPinHoles: new makerjs.models.BoltCircle(dOPH, rOPC, nOPH, 0)
    //excenterHole: new makerjs.models.Holes(eR, [0,0])
  };

  this.models["diskoutline"].origin = [e, 0];
  this.models["innerPinHoles"].origin = [e, 0];
}

function static_pins() {
  this.models = {
    pins: new makerjs.models.BoltCircle(rPC, rP, N + 1, 0)
  };
}

function excenter() {
  this.models = {
    excenterHole: new makerjs.models.Holes(eR, [0, 0]),
    motorShaft: new makerjs.models.Holes(isR, [0, 0])
  };
  // position it relative to the cycloidal disk -> excentric
  this.models['excenterHole'].origin = [e, 0];
}

function model(number_of_wobbler_teeth, resolution, radius_outer_pins, radius_outer_pin_circle, excentricity, center_distance_output_pins, number_of_output_pins, excenter_radius) {
  rP = radius_outer_pins;
  rPC = radius_outer_pin_circle;
  e = excentricity;
  dOPH = center_distance_output_pins;
  nOPH = number_of_output_pins;
  eR = excenter_radius;
  N = number_of_wobbler_teeth;
  pNumber = resolution;
  
  // basically all models to be drawn
  this.models = {
    diskoutline: new cycloidalDisk(),
    outer_pins: new static_pins(),
    excenter: new excenter()
  };
  // Warnings
  document.write("Current maximum radius of outer pins: " + rPmax() + "<br>");
  document.write("Current minimum radius of outer pin circle: " + rPCmin() + "<br>");
  document.write("Current maximum excentricity: " + eMax() + "<br>");

  if(isUndercut()){
    document.write("<b>Some of your chosen values do not fit");
  }
}

// needed for the sliders
model.metaParameters = [
 { title: "Number of wobbler teeth = - Transmission ratio", type: "range", min: 5, max: 50, value: N },
 { title: "Resolution of cycloidal gear", type: "range", min: 0.0001, max: 0.5, value: pNumber, step: 0.0001 },
 { title: "Radius of the outer pins", type: "range", min: 1, max: 150, value: rP },
 { title: "Distance of outer pins from center", type: "range", min: 1, max: 100, value: rPC },
 { title: "Excentricity", type: "range", min: 0, max: 40, value: e },
 { title: "Output pin distance from center", type: "range", min: 0, max: 50, value: dOPH },
 { title: "Number of output pins", type: "range", min: 0, max: 50, value: nOPH },
 { title: "Radius of the excenter", type: "range", min: 0, max: 100, value: eR }
];

//replace this line with whatever file format you desire to generate!
var svg = makerjs.exporter.toSVG(new model(N, pNumber, rP, rPC, e, dOPH, nOPH, eR));

document.write(svg);
