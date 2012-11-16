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

exports.Config = {
    ip:'192.168.1.1',
    port:8080,
    policyPort: 843, // flash policy if you use flash sockets

    common:{


        /**
         * redis hashring
         */
        redis:{
            '127.0.0.1:6379':1
        },

        maxClients:100000,
        maxClientsPerChannel:60000,
        maxMessageLength: 180,

        maxMessagesInHistory: 100,
        historyBlockLength: 300000, // ms
        historyBlockCount: 36 // stored history blocks
    }
};