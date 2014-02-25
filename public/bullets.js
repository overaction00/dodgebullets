/**
 * Created by worms on 2014. 2. 10..
 */

function vector(src, dst) {
  var x = dst.x - src.x;
  var y = dst.y - src.y;
  var arctan = Math.atan2(x, y);
  return { x: Math.sin(arctan), y: Math.cos(arctan) };
}
function distance(o1, o2) {
  return Math.sqrt(Math.pow(o2.y - o1.y, 2) + Math.pow(o2.x - o1.x, 2));
}
var Bullet = function (canvas, src, dst) {
  this.x = src.x;
  this.y = src.y;
  this.r = 5;
  this.speed = src.speed;
  this.out = false;
  this.damage = 0.07;

  this.v = vector(src, dst);

  this.update = function(timeDifferencePerLoop) {
    this.x += this.v.x * timeDifferencePerLoop * this.speed;
    this.y += this.v.y * timeDifferencePerLoop * this.speed;
    if (this.x > canvas.width ||
        this.x < -1 ||
        this.y > canvas.height ||
        this.y < -1) {
      this.out = true;
    }
  };

  this.draw = function(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r ,0 , 2 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.stroke();
  };

  this.isCollide = function(player) {
    // 두원의 중심점에x서 거리가 반지름보다 작으면 충돌
    var dist = distance(this, player);
    return (this.r + player.r) > dist;
  };
};


var Circle = function(canvas, startDegree, endDegree, radius, src) {
  this.x = src.x;
  this.y = src.y;
  this.r = 5;
  this.radius = radius;
  this.speed = src.speed;
  this.out = false;
  this.damage = 0.07;

  this.update = function(time) {
    startDegree += (this.speed * time);
    var radian = startDegree * Math.PI / 180;
    this.x = src.x + Math.cos(radian) * radius;
    this.y = src.y + Math.sin(radian) * radius;
    if (this.x > canvas.width ||
        this.x < -1 ||
        this.y > canvas.height ||
        this.y < -1) {
      this.out = true;
    }
  };
  this.draw = function(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r ,0 , 2 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.stroke();
  };
  this.isCollide = function(player) {
    // 두원의 중심점에x서 거리가 반지름보다 작으면 충돌
    var dist = distance(this, player);
    return (this.r + player.r) > dist;
  };
};

var Wall = function(canvas, source) {
  this.x = source.x;
  this.y = source.y;
  this.speed = source.speed;
  this.width = source.width;
  this.height = source.height;
  this.v = null;
  this.damage = 0.1;

  this.init = function() {
    if (this.x === 0) {
      this.v = vector(source, {x: this.x + canvas.width, y: this.y});
      this.x -= source.width;
    } else if (this.y === 0) {
      this.v = vector(source, {x: this.x, y: this.y + canvas.height});
      this.y -= source.height;
    } else if (this.x === canvas.width) {
      this.v = vector(source, {x: this.x - canvas.width, y: this.y});
    } else if (this.y === canvas.height) {
      this.v = vector(source, {x: this.x, y: this.y - canvas.height});
    } else {
      console.log('Never reach this.');
    }
  };
  this.update = function(timeDifferencePerLoop) {
    this.x += this.v.x * timeDifferencePerLoop * this.speed;
    this.y += this.v.y * timeDifferencePerLoop * this.speed;

    if (this.x > canvas.width ||
      this.x < -1 ||
      this.y  > canvas.height ||
      this.y < -1) {
      this.out = true;
    }
  };
  this.draw = function(ctx) {
    ctx.fillStyle = 'gray';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  };
  this.isCollide = function(player) {
    // 사각형을 PLAYER 의 반지름 만큼 확장하여 중심점이 사각형 안에 들어 있는지 확인.
    var x = player.x,
        y = player.y,
        r = player.r;
    var ltx = this.x - r,
        lty = this.y - r,
        rbx = this.x + this.width + r,
        rby = this.y + this.height + r;
    if ( x > ltx && y > lty && x < rbx && y < rby ) {
      return true;
    }
    return false;
  };

  this.init();
};

var Laser = function(canvas, source) {

  this.x = source.x;
  this.y = source.y;
  this.thickness = 0.05;
  //this.isEffect = true;
  this.startTime = 0;
  this.now = 0;
  this.duration = source.duration;
  this.damage = 0;
  this.out = false;
  this.step = 1;

  this.update = function(timeDifferencePerLoop) {
    if (this.startTime === 0) {
      this.startTime = (new Date()).getTime();
    }
    this.now = (new Date()).getTime();
    if (this.now - this.startTime < this.duration * 0.20) {
      // step 1: growth laser
      var variation = timeDifferencePerLoop * 0.02;
      this.thickness += (variation  * 2);
      if (this.x === 0) {
        this.y -= variation;
      } else {
        this.x -= variation;
      }
    } else if (this.now - this.startTime < this.duration * 0.80) {
      if (this.step === 1) {
        if (this.x === 0) {
          this.y += this.thickness / 2;
        } else {
          this.x += this.thickness / 2;
        }
        this.thickness = 0.5;
        this.damage = 0.02;
        this.step = 2;
      }

    } else {
      if (this.step === 2) {
        if (this.x === 0) {
          this.y -= this.thickness / 2;
        } else {
          this.x -= this.thickness / 2;
        }
        this.step = 3;
        this.thickness = 2;
        this.damage = 1;
      }

    }
    if (this.now - this.startTime > this.duration) {
      this.out = true;
    }
  };
  this.draw = function(ctx) {
    ctx.fillStyle = '#51D1EB';
    ctx.shadowColor = '#34A2B7';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 50;
    if (this.x === 0) { // if receive horizontal axis
      ctx.fillRect(this.x, this.y, canvas.width, this.thickness);
    } else if (this.y === 0) { // if receive vertical axis
      ctx.fillRect(this.x, this.y, this.thickness, canvas.height);
    }
    ctx.shadowBlur = 0;
  };
  this.isCollide = function(player) {
    // 사각형을 PLAYER 의 반지름 만큼 확장하여 중심점이 사각형 안에 들어 있는지 확인.
    var x = player.x,
        y = player.y,
        r = player.r;
    if (this.x === 0) {
      if (y > this.y - r && y < this.y + this.thickness + r) {
        return true;
      }
    } else if (this.y === 0) {
      if (x > this.x - r && x < this.x + this.thickness + r) {
        return true;
      }
    } else {
      throw new Error("Never reach this.");
    }
    return false;
  };
};

