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

var Utils = {
    getCurrentTime:function () {
        var dt = new Date();

        return this.lead(dt.getHours()) + ':' + this.lead(dt.getMinutes());
    },

    nowToSafeFormat:function () {
        var dt = new Date();

        return dt.getFullYear().toString() + '-' + this.lead(dt.getMonth() + 1) + '-' + this.lead(dt.getDate()) +
            ' ' +
            this.lead(dt.getHours()) + ':' + this.lead(dt.getMinutes());
    },

    lead:function (n) {
        return (n < 10) ? '0' + n.toString() : n.toString();
    }
};

exports.Utils = Utils;