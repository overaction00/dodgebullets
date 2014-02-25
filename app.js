
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var test = require('./routes/test');
var http = require('http');
var path = require('path');
var socket = require('socket.io');
var util = require('util');
var status = require('./status');
var bullets = require('./bullets');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/test', test.toy);

var server = http.createServer(app);
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


var io = socket.listen(server);
io.set('log level', 2);

var s = status.status;
var c = status.configure;
var bm = new bullets.Bullets(io);


io.sockets.on('connection', function(socket) {
  s.numberOfConnections += 1;
  socket.emit('welcome world', c.world);
  socket.on('world complete', function() {

    function randInt(max) {
      return parseInt(Math.random() * max);
    };
    var newUserData = {
      id: s.idSoFar++,
      fill: util.format('rgb(%d,%d,%d)', randInt(255), randInt(255), randInt(255)),
      x: c.world.canvasWidth,
      y: c.world.canvasHeight,
      hp: 100,
      maxHp: 100,
      direction: [false, false, false, false],
    };
    socket.emit('welcome user', newUserData);
    s.connectedUser[newUserData.id] = newUserData;
    s.socketIdToUserIdMap[socket.id] = newUserData.id;
    console.log('Current noConnection: ', s.numberOfConnections);
  });
  socket.on('request start', function(userID) {
    s.numberOfPlaying += 1;
    if (s.numberOfPlaying > 0) {
      bm.startServerBullets();
    }
    s.connectedUser[userID].direction = [false, false, false, false];
    socket.broadcast.emit('user connected', s.connectedUser[userID]);
    socket.emit('start game', s.playingUser);
    s.playingUser[userID] = s.connectedUser[userID];
  });
  socket.on('end game', function(userID) {
    socket.broadcast.emit('user end', s.playingUser[userID]);
    s.numberOfPlaying -=1;
    console.log('End user: ', userID);
    delete s.playingUser[userID];
    if (s.numberOfPlaying < 1) {
      bm.endServerBullets();
    }
  });


  socket.on('disconnect', function() {
    var disconnectedUserId = s.socketIdToUserIdMap[socket.id];
    console.log('disconnect', disconnectedUserId);
    socket.broadcast.emit('user disconnected', disconnectedUserId, s.connectedUser);
    s.numberOfConnections -= 1;
    if (s.playingUser[disconnectedUserId] !== undefined) {
      delete s.playingUser[disconnectedUserId];
      s.numberOfPlaying -= 1;
      if (s.numberOfPlaying === 0) {
        bm.endServerBullets();
      }
    }
    delete s.connectedUser[disconnectedUserId];
    delete s.socketIdToUserIdMap[socket.id];
    console.log('The number of users currently connected: ', s.numberOfConnections);
  });
  socket.on('user key move start', function(user) {
    socket.broadcast.emit('user move start', user);
  });
  socket.on('user key move end', function(user) {
    socket.broadcast.emit('user move end', user);
    var u = s.connectedUser[user.id];
    u.x = user.x;
    u.y = user.y;
    u.direction[user.keyCode - 37] = false;
    u.timestamp = user.timestamp;
  });
  socket.on('ping', function(t) {
    var now = (new Date()).getTime();
    var cts = now - t.timestamp;
    socket.emit('pong', {
      ct: t.timestamp,
      cts: cts,
      st: now
    });
  });
});





