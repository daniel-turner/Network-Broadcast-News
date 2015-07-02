var net = require('net');
var PORT = 6969;
// var IP_ADDRESS = '10.0.1.6';
var IP_ADDRESS = '10.0.1.6';
// var IP_ADDRESS = '0.0.0.0';



var client = net.connect({host: IP_ADDRESS, port: PORT}, connectedToServer);

function connectedToServer() {
  console.log('connected to server!');

  process.stdin.pipe(client);
}

client.on('data', function(chunk) {

  process.stdout.write(chunk);

});

client.on('end', function() {
  console.log('disconnected from server');
});