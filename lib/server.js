var net = require('net');
var PORT = 6969;
var clientList = []; //TODO: change to event-driven?
var adminName = "[ADMIN]";
var VALID_COMMANDS = ['\\kick (admin only)','\\who (list of connected users','\\help (this list)','\\quit (ends your session)'];
var rateLimits = {};
var RATE_TIME_LIMIT = 1000;
var RATE_COUNT_LIMIT = 5;

function getClientByPort(port) {

  for(var i = 0; i < clientList.length; i++) {

    if(clientList[i].port === port) {

      return clientList[i];
    }
  }

  return false;
};

function getClientByUserName(username) {

  for(var i = 0; i < clientList.length; i++) {

    if(clientList[i].username === username) {

      return clientList[i];
    }
  }

  return false;
};

function removeClient(client) {

  var clientItem = getClientByPort(client._peername.port);

  if(clientItem) {

    var clientIndex = clientList.indexOf(clientItem);

    if(clientIndex > -1) {

      clientList.splice(clientIndex, 1);
      broadcast(clientItem.username + ' disconnected');
      broadcast(clientList.length + " user(s) connected.");
    }
  }
};

function registerUser(client, username) {

  if(username === "[ADMIN]") {

    return false;
  }

  if(!getClientByUserName(username)) {

    clientList.push({
      port: client.remotePort,
      client: client,
      username: username
    });

    return true;
  }

  return false;
};

function broadcast(message) {

  message += "\n";

  clientList.forEach(function(clientItem) {

    clientItem.client.write(message);
  });

  process.stdout.write(message);

};

function checkRateLimit(port) {

  var timeStamp = Date.now();

  if(rateLimits.port === undefined) {

    rateLimits.port = [timeStamp];
    return false;
  }

  rateLimits.port.unshift(timeStamp);

  if(rateLimits.port.length < RATE_COUNT_LIMIT) {

    return false;
  }

  var scopedToOneSecond = false;

  while(!scopedToOneSecond) {

    if( rateLimits.port[rateLimits.port.length-1] < timeStamp - RATE_TIME_LIMIT) {

      rateLimits.port.pop();
      // console.log('popped ratelimits');

    } else {

      scopedToOneSecond = true;
    }
  }

  if(rateLimits.port.length >= RATE_COUNT_LIMIT) {

    return true;
  }

  return false;
}

function processCommand(message, username, isAdmin) {

  var substrings = message.split(' ');

  var command = substrings[0];
  var parameter = substrings[1];
  var clientItem;

  switch(command) {

    case "\\kick":

      if(!isAdmin) {

        broadcast(username + " cannot kick " + parameter);
        break;
      }

      if(typeof parameter === 'string') {

        clientItem = getClientByUserName(parameter);

        if(clientItem) {

          broadcast(username + " is kicking " + clientItem.username);
          clientItem.client.end();
          break;
        }
      }

      parameter = parseInt(parameter);

      if(typeof parameter === 'number') {

        clientItem = getClientByPort(parameter);

        if(clientItem) {

          broadcast(username + " is kicking " + clientItem.username);
          clientItem.client.end();
          break;
        }
      }

      process.stdout.write("Could not identify user to kick\n");
      break;

    case "\\who":

      var users = [];
      for(var i = 0; i < clientList.length; i++) {

        users.push(clientList[i].username);
      }
      broadcast("Connected users: " + users.join());
      break;

    case "\\help":

      broadcast("Valid commands are: " + VALID_COMMANDS.join(', '));
      break;
    case "\\quit":

      clientItem = getClientByUserName(username);

      if(clientItem) {

        clientItem.client.end();
      }
      break;
    default:

      broadcast(username + " attempted an invalid command");
      break;
  }
}

function clientConnected(client) { //'connection' listener

  client.setEncoding('utf8');
  client.write("Please enter username: ");

  var clientName = client.remoteAddress + ":" + client.remotePort;

  client.on('end', function() {

    removeClient(client);
  });

  client.on('data', function(chunk) {

    client.bufferSize = 5;

    var clientRecord = getClientByPort(client.remotePort);

    if(!clientRecord) {

      var username = chunk.substring(0,chunk.length-1);
      var registered = registerUser(client, username);

      if(!registered) {

        client.write(username + " is an invalid username.\n");
        client.write("Please enter username: ");
        return;
      }

      broadcast(username + ' connected');
      broadcast(clientList.length + " user(s) connected.");
      client.write("Welcome to RudeChat!\n");
      client.write("Valid commands are: " + VALID_COMMANDS.join(', ') + "\n");

    } else {

      var tooMuchData = checkRateLimit(client.remotePort);

      if(tooMuchData) {

        broadcast(clientRecord.username + " is being kicked for spamming the server");
        removeClient(client);
        client.cork();
        client.end();
        client.destroy(); //overkill?
      }

      var message = chunk.substring(0,chunk.length-1);

      if(message.indexOf('\\') === 0) {

        processCommand(message, clientRecord.username, false);
        return;
      }

      message = clientRecord.username + " [" + clientName + "] : " + message;

      broadcast(message);
    }
  });
};

var server = net.createServer(clientConnected);

process.stdin.setEncoding('utf8');
process.stdin.on('data', function(chunk) {

  var message = chunk.substring(0,chunk.length-1);

  if(message.indexOf('\\') === 0) {

    processCommand(message, "[ADMIN]", true);
    return;
  }

  message = "[ADMIN] : " + message;

  broadcast(message);
});

server.listen(PORT,function() {

  console.log('server bound to ' + PORT);
});