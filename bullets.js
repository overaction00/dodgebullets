/**
 * Created by worms on 2014. 2. 11..
 */

var status = require('./status');

var s = status.status;
var c = status.configure;

var Bullets = function(io) {

  this.funcList = [
    {func:targetBullet, interval:500},
    {func:octetCircleBullet, interval:3000},
    {func:wallBullet, interval:1000},
    {func:laserBullet, interval:1000}
  ];
  this.intervalList = [];
  this.creating = false;

  this.startServerBullets = function() {
    if (this.creating === true) {
      return;
    }
    this.creating = true;
    for (var i in this.funcList) {
      var b = this.funcList[i];
      this.intervalList.push(setInterval(b.func, b.interval));
    }
  };

  this.endServerBullets = function() {
    if (this.creating === false) {
      return;
    }
    this.creating = false;
    for (var i in this.intervalList) {
      clearInterval(this.intervalList[i]);
    }
    this.intervalList = [];
  }

  function targetBullet() {
    var source = generateRandomWallBulletLocation();
    var userIDTarget;
    while (true) {
      var length = Object.keys(s.playingUser).length;
      if (length === 0) {
        return;
      }
      var targetUser = s.playingUser[parseInt((Math.random() * 10000)) % length];
      if (targetUser === undefined) {
        continue;
      }
      userIDTarget = targetUser.id;
      break;
    };
    var bullet = {
      x: source.x,
      y: source.y,
      targetId: s.playingUser[userIDTarget].id,
      speed: 0.1,
      timestamp: (new Date).getTime()
    };
    console.log('Create target bullet: ', (new Date(bullet.timestamp)).toGMTString());
    io.sockets.emit('generate target bullet', bullet);
  }

  function octetCircleBullet() {
    var bullet = {
      speed: 0.03,
      radius: 200,
      x: c.world.canvasWidth / 2,
      y: c.world.canvasHeight / 2,
      timestamp: (new Date).getTime()
    };
    console.log('Create octet circle bullet: ', (new Date(bullet.timestamp)).toGMTString());
    io.sockets.emit('generate octet circle bullet', bullet);
  }


  function generateRandomWallBulletLocation() {
    var x = (Math.random() * 10000) % c.world.canvasWidth;
    var y = (Math.random() * 10000) % c.world.canvasHeight;
    var cs = parseInt((Math.random() * 10) %  4);
    switch(cs) {
      case 0: // start from left wall
        x = 0;
        break;
      case 1: // start from top wall
        y = 0;
        break;
      case 2: // start from right wall
        x = c.world.canvasWidth;
        break;
      case 3: // start from bottom wall
        y = c.world.canvasHeight;
        break;
    }
    return { x: parseInt(x), y: parseInt(y) };
  }

  function wallBullet() {
    var source = generateRandomWallBulletLocation();
    var bullet = {
      x: source.x,
      y: source.y,
      width: 100,
      height: 20,
      speed: 0.1,
      timestamp: (new Date).getTime()
    };
    console.log('Create wall bullet: ', (new Date(bullet.timestamp)).toGMTString());
    io.sockets.emit('generate wall bullet', bullet);
  }

  function laserBullet() {
    var x = (Math.random() * 10000) % c.world.canvasWidth;
    var y = (Math.random() * 10000) % c.world.canvasHeight;
    var axis = parseInt((Math.random() * 10) %  2);
    if (axis === 0) {
      x = 0;
    } else {
      y = 0;
    }
    var bullet = {
      x: x,
      y: y,
      duration: 3000,
      timestamp: (new Date).getTime()
    };
    console.log('Create laser bullet: ', (new Date(bullet.timestamp)).toGMTString());
    io.sockets.emit('generate laser bullet', bullet);
  }
};

exports.Bullets = Bullets;