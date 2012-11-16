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

var config = require('./../config').Config,
    messageManager = require('./messageManager').MessageManager,
    userManager = require('./userManager').UserManager,
    _ = require('underscore');

var STATE_READ_ONLY = 1,
    STATE_READY = 2;

var ChatManager = {
    connections: {}, // contains user connection objects grouped by channels

    /**
     * Session initialization, User authorization
     *
     * @param connection {object}
     * @param data {object} - User data
     */
    initSession: function(connection, data) {
        var self = this;

        connection.userId = data.userId;
        connection.channelId = 'ch:'+data.channelId;
        connection.nickName = data.nickName;

        // Subscribing to channel
        messageManager.listenChannel(connection.channelId, this.onMessage, self, function() {

        });

        this.subscribe(connection);
    },

    /**
     * Close user session
     *
     * @param connection {object}
     */
    closeSession: function(connection) {
        //
        if (connection.state == STATE_READ_ONLY) {
            return;
        }

        userManager.removeUser(connection);

        // Sending new user count to all current users
        this.sendUsersCount(connection);


        if (connection.channelId && this.connections[connection.channelId] && this.connections[connection.channelId][connection.id]) {
            // Now we are preparing system message about the user exited
            var systemMsg = {
                "type": 'system',
                "data": {
                    "nick": connection.nickName,
                    "message": 'is away'
                }
            };

            // and send this message to redis channel
            this.addMessage(connection,systemMsg);

            delete this.connections[connection.channelId][connection.id];
            connection.close();
            connection = {};
        }
    },

    /**
     * User subscription
     *
     * @param connection {object}
     */
    subscribe: function(connection) {
        // if this chat instance doesn't know about some redis channel - we are making it know
        if (!this.connections[connection.channelId]) {
            this.connections[connection.channelId] = {};
        }

        // add new connection to this chat
        this.connections[connection.channelId][connection.id] = connection;

        // checking for user limits in a room
        if (_.size(this.connections[connection.channelId]) > config.common.maxClientsPerChannel) {
            connection.state = STATE_READ_ONLY;

            this.sendState(connection);

            return;
        }

        connection.state = STATE_READY;

        // Now we are preparing system message about the user entered
        var systemMsg = {
            "type": 'system',
            "data": {
                "nick": connection.nickName,
                "message": 'entered chat'
            }
        };

        // send this message to redis channel
        this.addMessage(connection,systemMsg);

        userManager.addUser(connection);

        // and send state message to newcomer
        this.sendState(connection);
    },

    /**
     * Getting and sending users list
     *
     * @param connection {object}
     */
    sendUsersList: function(connection) {
        userManager.getUsersList(connection, this.sendMessage, this);
    },

    /**
     * Getting and sending users count
     *
     * @param connection {object}
     */
    sendUsersCount: function(connection) {
        userManager.getCount(connection, this.addMessage, this);
    },

    /**
     * Send state message to user
     *
     * @param connection {object}
     */
    sendState: function(connection) {
        this.sendMessage(connection, {
            type: 'state',
            value: {
                state: connection.state,
                room: connection.channelId.slice(3, connection.channelId.length)
            }
        });
    },

    /**
     * Adding message to channel
     *
     * @param connection {object}
     * @param message {object} in format {"type": string, "data": object}
     */
    addMessage: function(connection, message) {
        // users in read only mode can't send messages
        if ((connection.state == STATE_READY) || (connection.state == 'closed')) {
            messageManager.addMessage(connection, message.data, message.type);
        }
    },

    /**
     * Chat onMessage callback
     *
     * @param channel {string} channel id
     * @param message {object}
     */
    onMessage:function (channel, message) {
        //
        var ch = this.connections[channel];

        // send message to all users in current channel in this chat instance
        for (var con in ch) {
            this.sendMessage(ch[con], message);
        }

    },

    /**
     * Send message to user
     *
     * @param connection {object}
     * @param message {object}
     */
    sendMessage: function(connection, message) {
        messageManager.sendMessage(connection, message);
    },

    /**
     * Send message history
     *
     * @param connection {object}
     */
    sendHistory: function(connection) {
        messageManager.sendHistory(connection, this.sendMessage, this);
    }
}

exports.ChatManager = ChatManager;