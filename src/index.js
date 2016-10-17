var main = require('./lib/main');

exports.setHost = main.setHost;
exports.setPort = main.setPort;
exports.setOrigin = main.setOrigin;
exports.setName = main.setName;
exports.setCookie = main.setCookie;
exports.setInterval = main.setInterval;
exports.setOnFunctions = main.setOnFunctions;
exports.enableSessionTab = main.enableSessionTab;
exports.blockClientMessage = main.blockClientMessage;
exports.enableLocalOrign = main.enableLocalOrign;

exports.getConnections = main.getConnections;
exports.getConnectionsTabOnline = main.getConnectionsTabOnline;
exports.getConnectionsNodeOnline = main.getConnectionsNodeOnline;
exports.getConnectionsBySession = main.getConnectionsBySession;

exports.closeByNode = main.closeByNode;
exports.closeByTab = main.closeByTab;

exports.sendToNode = main.sendToNode;
exports.sendToTab = main.sendToTab;
exports.broadcast = main.broadcast;

exports.onRequest = main.onRequest;
exports.onMessage = main.onMessage;
exports.onClose = main.onClose;
exports.onInterval = main.onInterval;

exports.start = main.start;
exports.log = main.log;