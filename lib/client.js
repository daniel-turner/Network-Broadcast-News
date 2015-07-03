var net = require('net');
var PORT = 6969;
var IP_ADDRESS = '10.0.1.6'; //me
// var IP_ADDRESS = '10.0.1.24'; //judah
// var IP_ADDRESS = "10.0.1.3"; //kavika
// var IP_ADDRESS = "10.0.1.23"; //jason
// var IP_ADDRESS = "10.0.1.30"; //const
// var IP_ADDRESS = '0.0.0.0';
var FLOOD_COUNT = 1000;
// var FLOOD_INTERVAL = 10;

function processCommand(chunk) {

  var message = chunk.substring(0,chunk.length-1);
  var substrings = message.split(' ');
  var command = substrings[0];
  var parameter = substrings[1];

  if(command && parameter) {

    if(command !== '\\flood') {

      process.stdout.write(substring[0] + ' is not a valid command');
      return;
    }

    if(command === '\\flood') {

      // var count = 0;

      // var intervalID = setInterval(function() {

      //   server.write(parameter + "\n");
      //   count++;
      // }, FLOOD_INTERVAL);

      // server.on('drain', function() {

      //   console.log('drain called');

      //   server.write(parameter + '\n');
      //   count++;

      //   if(count > FLOOD_COUNT) {

      //     server.remoteListener('drain');
      //   }
      // })

      // server.write(parameter + '\n');

      // server.setNoDelay(true);

      // for(var i = 0; i < FLOOD_COUNT; i++) {

      //   server.pause();

      //   server.write(parameter + "\n");

      //   server.resume();
      // }

      // server.setNoDelay(false);

      var count = 0;
      server.bufferSize = 5;

      while (count < FLOOD_COUNT) {

        server.pause();

        server.write(parameter + "\n", 'utf8', function() {

          server.resume();

        });

        count++;
      }

      server.resume();

      return;
    }
  }

  server.write(chunk); //passthrough to server
}

function connectedToServer() {
  console.log('connected to server!');

  process.stdin.setEncoding('utf8');
  process.stdin.on('data', function(chunk) {

    var message = chunk.substring(0,chunk.length-1);

    if(message.indexOf('\\') === 0) {

      processCommand(chunk);

    } else {

      server.write(chunk);
    }
  })
}

var server = net.connect({host: IP_ADDRESS, port: PORT}, connectedToServer);

server.on('data', function(chunk) {

  process.stdout.write(chunk);

});

server.on('end', function() {

  console.log('disconnected from server');
});