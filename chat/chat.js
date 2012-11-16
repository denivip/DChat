/****************************************************
 *
 *  Copyright 2012 DENIVIP Media.  All Rights Reserved.
 *
 *****************************************************
 *
 *  Created by - Vladimir Semenyuk vladimir@denivip.ru
 *  Version 1.0.0
 *
 *****************************************************/

var config = require('./config.js').Config,
    webSocketServer = require('websocket').server,
    http = require('http'),
    ObjectID = require('mongodb').ObjectID,
    chat = require('./app/chatManager.js').ChatManager,
    clients = {};

// Here we listen flash policy requests
require('policyfile').createServer().listen(config.policyPort);
console.log('policy on: ', config.policyPort);


var server = http.createServer();

server.listen(config.port, function() {
    console.log('Chat started on port ' + config.port);
});

var wsServer = new webSocketServer({
    httpServer: server,
    autoAcceptConnections:false
});

wsServer.on('request', function(req) {
    if (wsServer.connections.length >= config.common.maxClients) {
        console.log(req.origin, 'regected');
        req.reject();

        return
    }

    var connection = req.accept();

    connection.id = (new ObjectID()).toString();

    clients[connection.id] = connection;

    connection.on('open', function(con) {
        console.log(req, 'open');
    });

    connection.on('message', function(message) {
        console.log(message);

        if (message.type === 'utf8') {
            // here we check the length of received message
            if (message.utf8Data && (message.utf8Data.length > config.common.maxMessageLength)) {
                return 0;
            }

            try {
                message = JSON.parse(message.utf8Data);

                // Here we check the type og received message
                if (message.type == 'msg') {
                    chat.addMessage(connection, message);
                } else if (message.type == 'handshake') {
                    chat.initSession(connection, message.data);
                } else if (message.type == 'userlist') {
                    chat.sendUsersList(connection);
                } else if (message.type == 'usercount') {
                    chat.sendUsersCount(connection);
                } else if (message.type == 'history') {
                    chat.sendHistory(connection);
                }

            } catch (e) {
                console.log('Error of JSON parsing: ', e);
            }
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
        }
    });

    connection.on('close', function() {
        chat.closeSession(connection);

        if (connection.id && clients[connection.id]) {
            delete clients[connection.id];
        }
    })
})

