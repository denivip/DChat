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
    utils = require('./utils').Utils,
    redisConnectionManager = require('./redisConnectionManager').RedisConnectionManager,
    _ = require('underscore');

// initializing redis connection manager
redisConnectionManager.init();

var MessageManager = {
    channels: [], //array of channels' ids

    /**
     * Subscribe to redis channel
     *
     * @param channelId {string} channel id
     * @param onMessageCallback {function}
     * @param context {object} callback context
     * @param callback {function}
     */
    listenChannel: function(channelId, onMessageCallback, context, callback) {
        // checking if this instance is already subscribed to current channel
        if (this.existsChannel(channelId)) {
            if (typeof callback == "function") {
                callback.call(context);
            }

            return;
        }

        this.channels.push(channelId);

        // subscribe to redis channel
        var conn = redisConnectionManager.getConnection(channelId, redisConnectionManager.connectionType.pubSub);

        conn.subscribe(channelId);

        conn.removeAllListeners('message');
        conn.removeAllListeners('subscribe');

        conn.on('message', function (channel, message) {
            if (typeof onMessageCallback == 'function') {
                onMessageCallback.call(context, channel, JSON.parse(message));
            }
        });

        conn.on('subscribe', function (channel, count) {
            if (typeof callback == "function") {
                callback.call(context);
            }
        });
    },

    /**
     * Check if this chat instance is already subscribed
     *
     * @param channelId {string} channel id
     */
    existsChannel:function (channelId) {
        for (var i = 0; i < this.channels.length; i++) {
            if (this.channels[i] == channelId) {
                return true;
            }
        }

        return false;
    },

    /**
     * Add message to history and to channel
     *
     * @param connection {object}
     * @param message {object}
     * @param type {string} type of message
     */
    addMessage:function(connection, message, type) {

        var time = (new Date()).getTime(),
            msg = JSON.stringify(this.prepareMessageToChannel(connection, message, type)),
            conn = redisConnectionManager.getConnection(connection.channelId, redisConnectionManager.connectionType.regular)

        // We add to history only text messages from users
        if (type == 'msg') {
            // History is stored in blocks
            var historyBlockId = time - (time % config.common.historyBlockLength),
                ttl = config.common.historyBlockCount * config.common.historyBlockLength / 1000;

            conn.zadd(connection.channelId + ':' + historyBlockId, time, msg, function () {

            });

            conn.expire(connection.channelId + ':' + historyBlockId, ttl, function() {

            });

            conn.set(connection.channelId + ':last_block', historyBlockId, function () {

            });
        }

        // Publish message to channel
        conn.publish(connection.channelId, msg);
    },

    /**
     * Preparing message for redis channel
     *
     * @param connection {object}
     * @param message {object}
     * @param type {string} type of mesage
     * @return {object} in format {dt: timestamp, n: nickname, c: channelId, m: message, t: message type}
     */
    prepareMessageToChannel:function (connection, message, type) {
        return {
            dt:utils.nowToSafeFormat(),
            n:connection.nickName,
            c:connection.channelId,
            m:message,
            t:type
        }
    },

    /**
     * Send message to user
     *
     * @param connection {object}
     * @param message {object}
     */
    sendMessage: function(connection, message) {
        var msg = message;

        if ((message.type == 'usercount') ||
            (message.type == 'history') ||
            (message.type == 'system') ||
            (message.type == 'state')) {
            msg = {
                dt:utils.nowToSafeFormat(),
                n:connection.nickName,
                c:connection.channelId,
                m:message.value,
                t:message.type
            }
        }

        connection.sendUTF(JSON.stringify(msg));
    },

    /**
     * Get history from redis
     *
     * @param connection {object}
     * @param callback {function}
     * @param context {object}
     */
    getHistory: function(connection, callback, context) {
        redisConnectionManager
            .getConnection(connection.channelId, redisConnectionManager.connectionType.regular)
            .get(connection.channelId + ':last_block', function (error, blockId) {
                var blockMap = {},
                    //block = blockId,
                    conn = redisConnectionManager.getConnection(connection.channelId, redisConnectionManager.connectionType.regular);

                function _get(block) {
                    conn.zrange(connection.channelId + ':' + block, 0, -1, function (err, res) {
                        blockMap[block] = res;
                    });
                };

                for (var i = 0; i < config.common.historyBlockCount; i++) {
                    var block = blockId - (config.common.historyBlockLength * i);

                    _get(block);
                }

                var historyThread = setInterval(function() {
                    if ((_.size(blockMap)== config.common.historyBlockCount) &&
                        (typeof callback == 'function')) {

                        var history = [],
                            values = _.values(blockMap);

                        for (var item in values) {
                            if (values[item].length &&
                                (history.length < config.common.maxMessagesInHistory)) {
                                history = history.concat(values[item].reverse());
                            }
                        }

                        callback.call(context, history.reverse());

                        clearInterval(historyThread);
                    }
                }, 5);

            });
    },

    /**
     * Send History
     *
     * @param connection {object}
     */
    sendHistory: function(connection) {
        var self = this;

        // Забираем историю из Redis
        this.getHistory(connection, function(history) {
            //console.log(history);

            var message = {
                'type': 'history',
                'value': JSON.stringify(history)
            };

            self.sendMessage(connection, message);
        }, this);
    }
}

exports.MessageManager = MessageManager;