/****************************************************
 *
 *  Copyright 2012 DENIVIP Media.  All Rights Reserved.
 *
 *****************************************************
 *
 *  Created by - Vadim Madison vadim.a.madison@gmail.com
 *  Version 1.0.0
 *
 *****************************************************/

var
    config = require('./../config').Config,
    redis = require('redis'),
    HashRing = require("hash_ring");

var RedisConnectionManager = {

    //connection type
    connectionType:{
        regular:'regular',
        pubSub:'pubSub'
    },

    ring:null,
    connections:{},

    init:function () {
        this.ring = new HashRing(config.common.redis);
    },

    /**
     * Open connection with server identified by key
     * @param key {string}
     */
    initConnection:function (key, type) {
        var server = this.getNode(key),
            portAndHost = server.split(':'),
            client = redis.createClient(portAndHost[1], portAndHost[0]);

        this.connections[server + type] = client;
    },

    /**
     * Возвращает соединение с целевым сервером
     * @param key {string}
     * @param type {RedisConnectionManager.connectionType}
     */
    getConnection:function (key, type) {
        var conn = this.connections[this.getNode(key) + type];

        if (conn == null || conn == undefined) {
            this.initConnection(key, type);

            conn = this.connections[this.getNode(key) + type];
        }

        return conn;
    },

    /**
     * Close connection identified by key
     * @param key {string}
     */
    closeConnection:function (key) {
        this.connections[this.getNode(key)].quit();
    },

    /**
     * Get redis node
     *
     * @param key {string}
     */
    getNode:function (key) {
        return this.ring.getNode(key);
    }
};

exports.RedisConnectionManager = RedisConnectionManager;