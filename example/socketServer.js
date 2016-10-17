var partWebsocket = require('partWebsocket');

partWebsocket.onRequest(function (request, connection) {
    partWebsocket.sendToNode(connection.client, {by: 'server', message: Math.random()});
});
partWebsocket.onMessage(function (message, connection) {});
partWebsocket.onClose(function (reasonCode, description, connection) {});
partWebsocket.setPort(3000).start();