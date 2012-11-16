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
    redisConnectionManager = require('./redisConnectionManager').RedisConnectionManager;

// initializing redis connection manager
redisConnectionManager.init();

var UserManager = {
    /**
     * Add user to chat
     *
     * @param connection {object}
     * @param callback {function}
     * @param context {object}
     */
    addUser: function(connection, callback, context) {
        var self = this,
            conn = redisConnectionManager.getConnection(connection.channelId, redisConnectionManager.connectionType.regular);

        // Increment usercount in redis
        conn.incr(connection.channelId + ':users_count')

        // add new user to chat
        conn.zadd(connection.channelId + ':users', connection.nickName.charCodeAt(0), connection.nickName, function () {
                // get new user count and send it via callback
                self.getCount(connection, callback, context);
            })


    },

    /**
     * Remove user
     *
     * @param connection {object}
     * @param callback {function}
     * @param context {object}
     */
    removeUser:function (connection, callback, context) {
        // remove from redis
        redisConnectionManager
            .getConnection(connection.channelId, redisConnectionManager.connectionType.regular)
            .zrem(connection.channelId + ':users', connection.nickName, function (err, res) {
                if (typeof callback == 'funсtion') {
                    callback.call(context, res);
                }
            });

        redisConnectionManager
            .getConnection(connection.channelId, redisConnectionManager.connectionType.regular)
            .decr(connection.channelId + ':users_count');
    },

    /**
     * Get user count
     *
     * @param connection {object}
     * @param callback {function}
     * @param context {object}
     */
    getCount:function (connection, callback, context) {
        redisConnectionManager
            .getConnection(connection.channelId, redisConnectionManager.connectionType.regular)
            .get(connection.channelId + ':users_count', function (err, res) {
                if (typeof callback == 'function') {
                    var message = {
                        'type': 'usercount',
                        'data': res
                    };

                    callback.call(context, connection, message);
                }
            });
    },

    /**
     * Get users list
     *
     * @param connection {object}
     * @param callback {function}
     * @param context {object}
     */
    getUsersList:function (connection, callback, context) {
        redisConnectionManager
            .getConnection(connection.channelId, redisConnectionManager.connectionType.regular)
            .zrange(connection.channelId + ':users', 0, -1, function (err, res) {
                if (typeof callback == 'function') {
                    var message = {
                        'type': 'userlist',
                        'data': res
                    };

                    callback.call(context, connection, message);
                }
            });
    }
}

exports.UserManager = UserManager;