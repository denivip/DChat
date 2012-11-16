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

var cluster = require('cluster');
var numCPUs = require('os').cpus().length;

cluster.setupMaster({
    exec:'./chat.js'
});

for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
}