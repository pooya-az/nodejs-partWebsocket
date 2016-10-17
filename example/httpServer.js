var http = require('http'),
    fs = require('fs'),
    partWebsocket = require('partWebsocket');

http.createServer(function(request, response) {
    fs.createReadStream('./client.html').pipe(response);
}).listen(80, function() {
    console.log('Http Server is listening on port 80');
});

partWebsocket.onRequest(function (request, connection) {
    partWebsocket.sendToNode(connection.client, {by: 'server', message: Math.random()});
});
partWebsocket.onMessage(function (message, connection) {});
partWebsocket.onClose(function (reasonCode, description, connection) {});
partWebsocket.setPort(3000).start();