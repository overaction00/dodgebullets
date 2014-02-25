/**
 * Created by worms on 2014. 2. 10..
 */

/**
 * Global variable
 */
var socket = null;
var frame = 0;
var canvas = null;
var now = 0;
var oldNow = 0;
var lastUpdate = 0;
var ping = 0;
var running = false;
var player = null;
var rivals = {};
var bulletList = [];
var startTime = 0;

var NO_BULLETS = 0;

var Flight = function(user) {
  // Member variables
  this.id = user.id;
  this.x = canvas.width / 2;
  this.y = canvas.height / 2;
  this.r = 10;
  this.speed = 0.2;
  this.fill = user.fill;

  this.maxHp = user.maxHp;
  this.hp = user.hp;

  this.direction = [false, false, false, false];
  this.vector = null;

  this.setDirection = function(code) {
    this.direction[code - 37] = true;
  };
  this.releaseDirection = function(code) {
    this.direction[code - 37] = false;
  };
  this.move = function(time) {
    var x = this.x;
    var y = this.y;
    var speed = this.speed;
    var direction = this.direction;

    if (direction[0] && x > -1) {
      x -= (speed * time);
    }
    if (direction[1] && y > -1) {
      y -= (speed * time);
    }
    if (direction[2] && x < canvas.width) {
      x += (speed * time);
    }
    if (direction[3] && y < canvas.height) {
      y += (speed * time);
    }
    this.x = x;
    this.y = y;
  };
  this.moveTouch = function(time) {
    if (this.vector === null) {
      return;
    }
    if (Math.abs(this.x - this.vector.dstX) < 0.001 &&
      Math.abs(this.y - this.vector.dstY) < 0.001) {
      this.vector = null;
      return;
    }
    this.x += this.vector.x * time * this.speed;
    this.y += this.vector.y * time * this.speed;
  };
  this.draw = function(ctx) {
    // draw position
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r ,0 , 2 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = this.fill;
    ctx.fill();
    ctx.stroke();

    // draw health bar
    ctx.fillStyle = "red";
    ctx.fillRect(10, 10, this.hp, 20);
    ctx.fillStyle = 'yellow';
    ctx.strokeRect(10, 10, this.maxHp, 20);
  };
  this.clearToStart = function() {
    this.direction = [false, false, false, false];
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
    this.r = 10;
    this.speed = 0.2;
    this.hp = 100;
    this.maxHp = 100;
  }
}

$(document).ready(function() {
  canvas = document.getElementById("canvas");

  canvas.addEventListener("touchstart", touchStart, false);
  canvas.addEventListener("touchmove", touchMove, false);
  canvas.addEventListener("touchend", touchEnd, false);
  socket = io.connect();
  socket.on('welcome world', function(world) {
    canvas.style.height = world.canvasHeight + 'px';
    canvas.style.width = world.canvasWidth + 'px';
    socket.emit('world complete');

    var c = canvas.getContext("2d");
    c.font = "25px Arial";
    c.fillStyle = "white";
    c.fillText("Press space bar to start the game",10 , world.canvasHeight / 2);
  });

  socket.on('welcome user', function(newUser) {
    console.log('you are:', newUser);
    player = new Flight(newUser);
  });

  socket.on('user connected', function(user) {
    console.log('user ' + user.id + ' has connected with color ' + user.fill);
    rivals[user.id] = new Flight(user);
  });

  socket.on('start game', function(alreadyPlayingUser) {
    running = true;
    for (var i in alreadyPlayingUser) {
      var u = alreadyPlayingUser[i];
      rivals[u.id] = new Flight(u);
    }
    startTime = (new Date()).getTime();
    loop();
  });
  socket.on('user move start', function(user) {
    rivals[user.id].setDirection(user.keyCode);
    rivals[user.id].x = user.x;
    rivals[user.id].y = user.y;
  });
  socket.on('user move end', function(user) {
    rivals[user.id].releaseDirection(user.keyCode);
    rivals[user.id].x = user.x;
    rivals[user.id].y = user.y;
  });

  socket.on('pong', function(time) {
    var now = (new Date()).getTime();
    ping = now - time.ct;
  });

  socket.on('generate target bullet', function(source) {
    if (running === false) {
      return;
    }
    var target = (source.targetId === player.id) ?
      player : rivals[source.targetId];
    var bullet = new Bullet(canvas, source, target);
    bulletList.push(bullet);
    NO_BULLETS += 1;
  });

  socket.on('generate octet circle bullet', function(source) {
    if (running === false) {
      return;
    }
    var r = source.radius;
    var x = source.x;
    var y = source.y;

    function dtrX(degree) {
      var radian = degree * Math.PI / 180;
      return Math.cos(radian);
    }
    function dtrY(degree) {
      var radian = degree * Math.PI / 180;
      return Math.sin(radian);
    }

    bulletList.push(new Circle(canvas, 270, 360, r, {x: x, y: y + r,speed: source.speed}));
    bulletList.push(new Circle(canvas, 225, 315, r, {x: x + dtrX(45) * r, y: y + dtrY(45) * r,speed: source.speed}));
    bulletList.push(new Circle(canvas, 180, 270, r, {x: x + r, y: y,speed: source.speed}));
    bulletList.push(new Circle(canvas, 315, 405, r, {x: x + dtrX(135) * r, y: y + dtrY(135) * r,speed: source.speed}));
    bulletList.push(new Circle(canvas, 90 , 180, r, {x: x, y: y - r,speed: source.speed}));
    bulletList.push(new Circle(canvas, 45 , 135, r, {x: x + dtrX(225) * r, y: y + dtrY(225) * r,speed: source.speed}));
    bulletList.push(new Circle(canvas, 0  , 90 , r, {x: x - r, y: y,speed: source.speed}));
    bulletList.push(new Circle(canvas, 135, 225, r, {x: x + dtrX(315) * r, y: y + dtrY(315) * r,speed: source.speed}));
    NO_BULLETS += 8;
  });

  socket.on('generate wall bullet', function(source) {
    if (running === false) {
      return;
    }
    var wall = new Wall(canvas, source);
    bulletList.push(wall);
    NO_BULLETS += 1;
  });
  socket.on('generate laser bullet', function(source) {
    if (running === false) {
      return;
    }
    var laser = new Laser(canvas, source);
    bulletList.push(laser);
    NO_BULLETS += 1;
  });


  document.onkeydown = function(e) {
    if (running === false) {
      if (e.keyCode === 32) {
        socket.emit('request start', player.id);
        return true;
      } else {
        return false;
      }
    }
    if (e.keyCode < 37 || e.keyCode > 40) {
      return;
    }
    if (player.direction[e.keyCode - 37] === true ) {
      return false;
    }
    player.direction[e.keyCode - 37] = true;

    socket.emit('user key move start', {
      id: player.id,
      x: player.x,
      y: player.y,
      keyCode: e.keyCode,
      timestamp: (new Date()).getTime()
    });
  }
  document.onkeyup = function(e) {
    if (running === false) {
      return false;
    }
    if (e.keyCode < 37 || e.keyCode > 40) {
      return;
    }
    player.direction[e.keyCode - 37] = false;

    socket.emit('user key move end', {
      id: player.id,
      x: player.x,
      y: player.y,
      keyCode: e.keyCode,
      timestamp: (new Date()).getTime()
    });
  };


  function touchStart(event) {
    event.preventDefault();

    if (running === false) {
      socket.emit('request start', player.id);
      return true;
    }
    var x = event.touches[0].pageX;
    var y = event.touches[0].pageY;
    var v = vector(player, {x: x, y: y})

    player.vector = {x: v.x, y: v.y, dstX: x, dstY: y};
  }
  function touchMove(event) {
    var x = event.touches[0].pageX;
    var y = event.touches[0].pageY;
    var v = vector(player, {x: x, y: y})

    player.vector = {x: v.x, y: v.y, dstX: x, dstY: y};
  }
  function touchEnd(event) {
    player.vector = null;
  }
});

var frameCounter = 0;
function computeObject() {
  frameCounter += 1;
  now = (new Date()).getTime();
  if (oldNow === 0) {
    lastUpdate = oldNow = now;
  }
  var timeDifferencePerLoop = now - oldNow;
  if (now - lastUpdate > 1000) {
    frame = frameCounter;
    frameCounter = 0;
    lastUpdate = now;
    socket.emit('ping', { timestamp: now });
  }

  // compute me
  player.move(timeDifferencePerLoop);
  player.moveTouch(timeDifferencePerLoop);

  // compute rivals
  for (var i in rivals) {
    var rival = rivals[i];
    rival.move(timeDifferencePerLoop);
  }

  // compute bullets
  for (var i in bulletList) {
    var b = bulletList[i];
    if (b.out === true) {
      bulletList.splice(i, 1);
    }
    b.update(timeDifferencePerLoop);
    if (b.isCollide(player)) {
      player.hp -= (b.damage * timeDifferencePerLoop);

      if (player.hp < 0) {
        socket.emit('end game', player.id);
        player.clearToStart();
        running = false;
        bulletList = [];
        rivals = [];
        return;
      }
    }
  }
  oldNow = now;
}


function render() {
  var c = canvas.getContext('2d');
  c.save();
  c.clearRect(0, 0, canvas.width, canvas.height);
  if (running === false) {
    c.font = "25px Arial";
    c.textAlign = "center";
    c.fillStyle = "white";
    c.fillText("Press space bar to start the game", canvas.width / 2 , canvas.height / 2);
    return false;
  }

  // draw rivals
  for (var i in rivals) {
    var rival = rivals[i];
    rival.draw(c);
  }

  // draw bullets
  for (var i in bulletList) {
    var b = bulletList[i];
    b.draw(c);
  }

  // draw player
  player.draw(c);

  // draw barometer
  c.font = "12px Arial";
  c.fillStyle = "33FF00";
  c.textAlign = "center";
  c.fillText('score: ' + (now - startTime), canvas.width / 2, 13);

  c.font = "8px Arial";
  c.textAlign = "end";
  c.fillText('fps: ' + frame, canvas.width - 10, 10);
  c.fillText('ping: ' + ping, canvas.width - 10, 22);
  c.restore();
  window.requestAnimationFrame(loop, canvas);
}



function loop() {
  if (running === false) {
    return;
  }
  computeObject();
  render();
}