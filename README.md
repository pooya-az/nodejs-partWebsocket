WebSocket Client & Server Implementation for Node
=================================================

Overview
--------
[Github address](https://github.com/pooya-az/nodejs-partWebsocket)

[Npm address](https://www.npmjs.com/package/partWebsocket)

Version
-------
Version: 1.0.0


Dependency
-----------
- [Websocket](https://www.npmjs.com/package/websocket): `version ~1.0.0`
- [Extend](https://www.npmjs.com/package/extend): `latest version`


Documentation
=============

[You can read the full API documentation in the docs folder.](https://github.com/pooya-az/nodejs-partWebsocket/wiki)


Changelog
---------

***Current Version: 1.0.0*** — Released 2016-10-17***

Installation
------------ 

In your project root:

    $ npm install partWebsocket
  
Then in your code:

```javascript
var partWebsocket = require('partWebsocket');
```

Note for Windows Users
----------------------
Because there is a small C++ component used for validating UTF-8 data, you will need to install a few other software packages in addition to Node to be able to build this module:

- [Microsoft Visual C++](http://www.microsoft.com/visualstudio/en-us/products/2010-editions/visual-cpp-express)
- [Python 2.7](http://www.python.org/download/) (NOT Python 3.x)

Usage Examples
==============

Http Server Example
-------------------

* You can use cluster in your code

```javascript
#!/usr/bin/env node
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
partWebsocket.onMessage(function (request, connection) {});
partWebsocket.onClose(function (reasonCode, description, connection) {});
partWebsocket.setPort(3000).start();
```

Http Client
------------------

```html
<!DOCTYPE HTML>
<html>
<head>

    <script>
        var socket = null;

        function start () {
            if (socket != null) {
                return;
            }

            var url = "ws://127.0.0.1:3000";

            var wsCtor = window['MozWebSocket'] ? MozWebSocket : WebSocket;
            socket = new wsCtor(url, 'echo-protocol');

            socket.onmessage = handleWebsocketMessage.bind(this);
            socket.onclose = handleWebsocketClose.bind(this);

            document.getElementById('open').style.display = 'none';
            document.getElementById('close').style.display = 'block';
            document.getElementById('connect').style.display = 'block';

            console.log('WebSocket Connection open.');
        }

        function send () {
            var message = document.getElementById('message').value;
            socket.send(JSON.stringify({by: '', message: message}));
            document.getElementById('message').value = '';

            document.getElementById('box').value += "\r\n" + 'You: ' + message;
            document.getElementById('box').scrollTop = document.getElementById('box').scrollHeight;
        }

        function closed () {
            if (socket == null) {
                return;
            }
            socket.close();
        }

        function handleWebsocketMessage (message) {
            try {
                console.log('Websocket Message:', message.data);
                var data = JSON.parse(message.data);
                document.getElementById('box').value += "\r\n" + (data.by == 'self' ? 'You' : data.by) + ': ' + data.message;
                document.getElementById('box').scrollTop = document.getElementById('box').scrollHeight;
            } catch(e) {
                console.log('Invalid websocket message!');
            }
        }

        function handleWebsocketClose () {
            socket = null;

            document.getElementById('open').style.display = 'block';
            document.getElementById('close').style.display = 'none';
            document.getElementById('connect').style.display = 'none';

            console.log('WebSocket Connection Closed.');

            document.getElementById('box').value += "\r\n" + '------ Close connection ------' + "\r\n";
        }
    </script>

</head>
<body>

<div>
    <button type="button" id="open" onclick="start()">Open</button>
    <button type="button" id="close" onclick="closed()" style="display: none;">Close</button>

    <br><br><hr><br>

    <div id="connect" style="display: none;">
        <label for="message">Message: </label><br>
        <input type="text" id="message">
        <button type="button" id="send" onclick="send()">Send</button>

        <br><br>

        <label for="box">Box:</label><br>
        <textarea id="box" cols="60" rows="10"></textarea>
    </div>
</div>

</body>
</html>
```

Server Example
--------------

Here's a short example showing a server that echos back anything sent to it, whether utf-8 or binary.

```javascript
#!/usr/bin/env node
var partWebsocket = require('partWebsocket');

partWebsocket.onRequest(function (request, connection) {
    partWebsocket.sendToNode(connection.client, {by: 'server', message: Math.random()});
});
partWebsocket.onMessage(function (request, connection) {});
partWebsocket.onClose(function (reasonCode, description, connection) {});
partWebsocket.setPort(3000).start();
```

Client Example
--------------

This is a simple example client that will print out any utf-8 messages it receives on the console, and periodically sends a random number.

*This code demonstrates a client in Node.js, not in the browser*

```javascript
#!/usr/bin/env node
var WebSocketClient = require('websocket').client;

var client = new WebSocketClient();

client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});

client.on('connect', function(connection) {
    console.log('WebSocket Client Connected');
    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function() {
        console.log('echo-protocol Connection Closed');
    });
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log("Received: '" + message.utf8Data + "'");
        }
    });

    var number = Math.round(Math.random() * 0xFFFFFF);
    connection.sendUTF(number.toString());
});

client.connect('ws://127.0.0.1:3000/', 'echo-protocol');
```