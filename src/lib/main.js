var WebSocketServer = require('websocket').server,
    extend = require('extend'),
    http = require('http'),
    generator = require('./generate'),
    obj = {
        name: 'echo-protocol',
        cookie: {
            name: 'webSocketConnection',
            secure: false,
            maxage: 0,
            httponly: true
        },
        session: false,
        blockMessage: false,
        origin: [],
        countNode: 0,
        on: ['onRequest', 'onMessage', 'onClose', 'onInterval']
    };

function setHost (host) {
    if (typeof host === 'string') {
        obj.host = host;
    }

    return this;
}

function setPort (port) {
    if (typeof port === 'number') {
        obj.port = port;
    }

    return this;
}

function setName (name) {
    if (typeof name === 'string') {
        obj.name = name;
    }

    return this;
}

function setOrigin (origin) {
    if (typeof origin === 'string' && origin.indexOf('localhost') == -1 && origin.indexOf('127.0.0.1') == -1) {
        obj.origin.push(origin.replace('http://', '').replace('https://', ''));
    }

    return this;
}

function setLocalOrigin () {
    obj.origin.push('localhost');
    obj.origin.push('127.0.0.1');

    return this;
}

function setSessionTab () {
    obj.session = true;

    return this;
}

function setBlockClientMessage (bool) {
    if (typeof bool === 'boolean') {
        obj.blockMessage = bool;
    }

    return this;
}

function setCookieOptions (cookie) {
    if (typeof cookie === 'object') {
        extend(obj.cookie, cookie);
    }

    return this;
}

function setIntervalTimer (time) {
    if (typeof time === 'number') {
        obj.interval = time;
    }

    return this;
}

function setOnFunctions (callbacks) {
    if (typeof callbacks === 'object' && Object.keys(callbacks).sort().toString() === obj.on.sort().toString()) {
        Object.keys(callbacks).forEach(function (value) {
            obj[value] = callbacks[value];
        });
    }

    return this;
}

function getConnections () {
    return extend({}, obj.connections);
}

function getConnectionsTabOnline () {
    if (!obj.session) {
        log('Warning', 'Session tab not enabled!');
        return;
    }

    return Object.keys(obj.connections).length;
}

function getConnectionsNodeOnline () {
    return obj.countNode;
}

function getConnectionsBySession (session) {
    var connection = extend({}, obj.connections[session]);
    if (typeof connection != 'undefined') {
        return connection;
    }

    return {};
}

function onRequest (callback) {
    if (typeof callback != 'function') {
        return;
    }
    obj.onRequest = callback;
}

function onMessage (callback) {
    if (typeof callback != 'function') {
        return;
    }
    obj.onMessage = callback;
}

function onClose (callback) {
    if (typeof callback != 'function') {
        return;
    }
    obj.onClose = callback;
}

function onInterval (callback) {
    if (typeof callback != 'function') {
        return;
    }
    obj.onInterval = callback;
}

function start () {
    var error = '';
    if (typeof obj.port === 'undefined') {
        error += '* Port address can\'t empty.' + "\r\n";
    }
    if (typeof obj.onRequest === 'undefined') {
        error += '* onRequest parameter must be function.' + "\r\n";
    } else if (getParamNames(obj.onRequest).length != 2) {
        error += '* onRequest function must be 2 parameters.' + "\r\n";
    }
    if (typeof obj.onMessage === 'undefined') {
        error += '* onMessage parameter must be function.' + "\r\n";
    } else if (getParamNames(obj.onMessage).length != 2) {
        error += '* onMessage function must be 2 parameters.' + "\r\n";
    }
    if (typeof obj.onClose === 'undefined') {
        error += '* onClose parameter must be function.' + "\r\n";
    } else if (getParamNames(obj.onClose).length != 3) {
        error += '* onClose function must be 3 parameters.' + "\r\n";
    }
    if (typeof obj.onInterval != 'undefined' && getParamNames(obj.onInterval).length != 1) {
        error += '* onInterval function must be 1 parameters.' + "\r\n";
    }

    if (error != '') {
        console.log(new Error("\r\n" + error));

        return;
    }

    var server = http.createServer(function(request, response) {
        response.writeHead(404);
        response.end();
    });

    if (typeof obj.host != 'undefined') {
        server.listen(obj.port, obj.host, function () {
            log('Run', 'Server is listening on ' + obj.host + ':' + obj.port);
        });
    } else {
        server.listen(obj.port, function () {
            log('Run', 'Server is listening on port ' + obj.port);
        });
    }

    var wsServer = new WebSocketServer({
        httpServer: server,
        autoAcceptConnections: false
    });

    obj.connections = {};
    wsServer.on('request', function(request) {
        if (!originIsAllowed(request.origin)) {
            log('Reject', 'Client with "' + request.remoteAddress + '" ip address from origin "' + request.origin + '" rejected.');
            //noinspection JSUnresolvedFunction
            request.reject();

            return;
        }

        var connection = null,
            session = '',
            uuid = generator.guid();

        if (obj.session) {
            //noinspection JSUnresolvedVariable
            for (var i = 0; i < request.cookies.length; i++) {
                //noinspection JSUnresolvedVariable
                if (request.cookies[i].name == obj.cookie.name) {
                    //noinspection JSUnresolvedVariable
                    session = request.cookies[i].value;
                    break;
                }
            }
            if (session == '') {
                session = generator.session();
                var cookies = [
                    {
                        name: obj.cookie.name,
                        value: session,
                        path: '/',
                        secure: obj.cookie.secure,
                        maxage: obj.cookie.maxage,
                        httponly: obj.cookie.httponly
                    }
                ];
            }

            //noinspection JSValidateTypes
            connection = request.accept(obj.name, request.origin, cookies);
        } else {
            session = generator.session();
            //noinspection JSValidateTypes
            connection = request.accept(obj.name, request.origin);
        }

        connection.client = {session: session, uuid: uuid, user: ''};
        connection.closeByServer = false;

        if (!obj.session || typeof obj.connections[session] === 'undefined') {
            obj.connections[session] = {};
            obj.connections[session][uuid] = connection;
        } else {
            obj.connections[session][uuid] = connection;
        }
        obj.countNode++;

        log('Connect', 'Client with "' + connection.remoteAddress + '" ip address connected - Protocol Version ' + connection.webSocketVersion);
        obj.onRequest(request, {
            client: connection.client,
            remoteAddress: connection.remoteAddress,
            webSocketVersion: connection.webSocketVersion
        });

        connection.on('message', function(message) {
            if (obj.blockMessage) {
                log('Block', 'Client with "' + connection.remoteAddress + '" ip address blocked message.');

                return;
            }

            obj.onMessage(message, {
                client: connection.client,
                remoteAddress: connection.remoteAddress,
                webSocketVersion: connection.webSocketVersion
            });
        });

        connection.on('close', function(reasonCode, description) {
            log('Close', 'Client with "' + connection.remoteAddress + '" ip address disconnected - ' + (connection.closeByServer ? 'Connection dropped by server.' : 'Connection dropped by remote peer.'));

            if (Object.keys(obj.connections[connection.client.session]).length > 1) {
                delete obj.connections[connection.client.session][connection.client.uuid];
            } else {
                delete obj.connections[connection.client.session];
            }
            obj.countNode--;

            obj.onClose(reasonCode, description, {
                client: connection.client,
                remoteAddress: connection.remoteAddress,
                webSocketVersion: connection.webSocketVersion
            });
        });
    });
    
    if (typeof obj.interval != 'undefined' && typeof obj.onInterval != 'undefined' && typeof wsServer === 'object') {
        setInterval(function () {
            obj.onInterval(getConnections());
        }, obj.interval);
    }
}

function closeConnectionByNode (client) {
    var connection = getConnectionNode(client);
    if (typeof connection === 'boolean' || typeof connection === 'undefined') {
        log('Warning', 'Client node not found in connection! Close failed.');

        return;
    }

    connection.closeByServer = true;
    connection.close();
}

function closeConnectionByTab (client) {
    if (!obj.session) {
        log('Warning', 'Session tab not enabled!');
        return;
    }

    var connections = getConnectionTab(client);
    if (typeof connections === 'boolean' || typeof connections === 'undefined') {
        log('Warning', 'Client tab not found in connection! Close failed.');

        return;
    }

    Object.keys(connections).forEach(function (value) {
        obj.connections[client.session][value].closeByServer = true;
        obj.connections[client.session][value].close();
    });
}

function sendToNode (client, requestMessage, responseMessage) {
    var connection = getConnectionNode(client);
    if (typeof connection === 'boolean' || typeof connection === 'undefined')
        return;

    if (arguments.length == 2) {
        responseMessage = arguments[1];
        requestMessage = '';
    }

    if (requestMessage == '') {
        if (typeof responseMessage != 'string') {
            responseMessage = JSON.stringify(responseMessage);
        }

        connection.send(responseMessage);
    } else if (requestMessage.type === 'utf8') {
        if (typeof responseMessage != 'string') {
            responseMessage = JSON.stringify(responseMessage);
        }

        sendUTF(connection, responseMessage);
    } else if (requestMessage.type === 'binary') {
        sendBytes(connection, responseMessage);
    }
}

function sendToTab (client, requestMessage, responseMessage) {
    if (!obj.session) {
        log('Warning', 'Session tab not enabled!');
        return;
    }

    var connections = getConnectionTab(client);
    if (typeof connections === 'boolean' || typeof connections === 'undefined')
        return;

    if (arguments.length == 2) {
        responseMessage = arguments[1];
        requestMessage = '';
    }

    if (requestMessage == '') {
        if (typeof responseMessage != 'string') {
            responseMessage = JSON.stringify(responseMessage);
        }

        Object.keys(connections).forEach(function (value) {
            obj.connections[client.session][value].send(responseMessage);
        });
    } else if (requestMessage.type === 'utf8') {
        if (typeof responseMessage != 'string') {
            responseMessage = JSON.stringify(responseMessage);
        }

        Object.keys(connections).forEach(function (value) {
            sendUTF(obj.connections[client.session][value], responseMessage);
        });
    } else if (requestMessage.type === 'binary') {
        Object.keys(connections).forEach(function (value) {
            sendBytes(obj.connections[client.session][value], responseMessage);
        });
    }
}

function sendToAll (requestMessage, responseMessage) {
    if (arguments.length == 1) {
        responseMessage = arguments[0];
        requestMessage = '';
    }

    if (requestMessage == '') {
        if (typeof responseMessage != 'string') {
            responseMessage = JSON.stringify(responseMessage);
        }

        Object.keys(obj.connections).forEach(function (value) {
            var session = obj.connections[value];
            Object.keys(session).forEach(function (value) {
                session[value].send(responseMessage);
            });
        });
    } else if (requestMessage.type === 'utf8') {
        if (typeof responseMessage != 'string') {
            responseMessage = JSON.stringify(responseMessage);
        }

        Object.keys(obj.connections).forEach(function (value) {
            var session = obj.connections[value];
            Object.keys(session).forEach(function (value) {
                sendUTF(session[value], responseMessage);
            });
        });
    } else if (requestMessage.type === 'binary') {
        Object.keys(obj.connections).forEach(function (value) {
            var session = obj.connections[value];
            Object.keys(session).forEach(function (value) {
                sendBytes(session[value], responseMessage);
            });
        });
    }
}

function sendUTF (connection, responseMessage) {
    //noinspection JSUnresolvedFunction
    connection.sendUTF(responseMessage);
}

function sendBytes (connection, responseMessage) {
    //noinspection JSUnresolvedFunction
    connection.sendBytes(responseMessage);
}

function getConnectionNode (client) {
    if (typeof client.session === 'undefined' || typeof client.uuid === 'undefined') {
        log('Error', 'Client session or uuid not found!');

        return;
    }

    try {
        var connection = obj.connections[client.session][client.uuid];
        if (connection === 'undefined')
            return false;

        return connection;
    } catch (ex) {
        return false;
    }
}

function getConnectionTab (client) {
    if (typeof client.session === 'undefined') {
        log('Error', 'Client session not found!');

        return;
    }

    var connection = obj.connections[client.session];
    if (connection === 'undefined')
        return false;

    return connection;
}

function originIsAllowed(origin) {
    if (obj.origin.length)
        return obj.origin.indexOf(origin.replace('http://', '').replace('https://', '')) != -1;

    return true;
}

function log (event, message) {
    var date = new Date(),
        sec = (date.getSeconds() > 9 ? date.getSeconds() : '0' + date.getSeconds()),
        min = (date.getMinutes() > 9 ? date.getMinutes() : '0' + date.getMinutes()),
        hour = (date.getHours() > 9 ? date.getHours() : '0' + date.getHours()),
        day = (date.getDate() > 9 ? date.getDate() : '0' + date.getDate()),
        month = (date.getMonth() + 1 > 9 ? date.getMonth() + 1 : '0' + (date.getMonth() + 1));
    var str = '[' + date.getFullYear() + '-' + month + '-' + day + ' ' + hour + ':' + min + ':' + sec + '] Websocket';

    console.log(str + "\t" + event + "\t\t" + message);
}

function getParamNames (func) {
    var STRIP_COMMENTS = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s*=[^,)]*(('(?:\\'|[^'\r\n])*')|("(?:\\"|[^"\r\n])*"))|(\s*=[^,)]*))/mg;
    var ARGUMENT_NAMES = /([^\s,]+)/g;
    var fnStr = func.toString().replace(STRIP_COMMENTS, '');
    var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
    if(result === null)
        result = [];

    return result;
}

exports.setHost = setHost;
exports.setPort = setPort;
exports.setOrigin = setOrigin;
exports.setName = setName;
exports.setCookie = setCookieOptions;
exports.setInterval = setIntervalTimer;
exports.setOnFunctions = setOnFunctions;
exports.blockClientMessage = setBlockClientMessage;
exports.enableLocalOrign = setLocalOrigin;
exports.enableSessionTab = setSessionTab;

exports.getConnections = getConnections;
exports.getConnectionsTabOnline = getConnectionsTabOnline;
exports.getConnectionsNodeOnline = getConnectionsNodeOnline;
exports.getConnectionsBySession = getConnectionsBySession;

exports.closeByNode = closeConnectionByNode;
exports.closeByTab = closeConnectionByTab;

exports.sendToNode = sendToNode;
exports.sendToTab = sendToTab;
exports.broadcast = sendToAll;

exports.onRequest = onRequest;
exports.onMessage = onMessage;
exports.onClose = onClose;
exports.onInterval = onInterval;

exports.start = start;
exports.log = log;