
var status = {
  idSoFar: 0,
  connectedUser: {},
  playingUser: {},
  socketIdToUserIdMap: {},
  numberOfConnections: 0,
  numberOfPlaying: 0
}

var configure = {
  world: {
  canvasWidth: 400,
  canvasHeight: 600
  }
};

exports.status = status;
exports.configure = configure;