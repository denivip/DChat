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

window.Utils = window.Utils || {};

Utils.Date = {
    /**
     * Convert string to Date object
     *
     * @param {String} date
     * @param {String} delimiter delimiter: '.', '-'
     * @return {Date}
     */
    dateParse:function (date, delimiter) {
        delimiter = delimiter || (date.indexOf('-') != -1 ? '-' : '.');

        var digitpattern = /\d+/g,
            matches = date.match(digitpattern),
            year = 0, month = 0, day = 0, hours = 0, minutes = 0, seconds = 0;

        // Only date
        if (matches.length > 0) {
            if (delimiter == '.') {
                year = parseInt(matches[2]);
                month = parseInt(matches[1], 10) - 1;
                day = parseInt(matches[0], 10);
            }
            if (delimiter == '-') {
                year = parseInt(matches[0]);
                month = parseInt(matches[1], 10) - 1;
                day = parseInt(matches[2], 10);
            }
        }

        // Time is here
        if (matches.length > 3) {
            hours = parseInt(matches[3], 10);
            minutes = parseInt(matches[4], 10);
        }

        // Seconds are here
        if (matches.length > 5) {
            seconds = parseInt(matches[5], 10);
        }

        return new Date(year, month, day, hours, minutes, seconds);
    },

    /**
     * Return hh, mm, ss
     *
     * @private
     * @param {int|Date} date datetime in timestamp format or Date object
     * @return {object}
     */
    _decomposeTime:function (date) {
        var t = typeof date;
        if (t == 'object') {
            return {hours:date.getHours(), minutes:date.getMinutes(), seconds:date.getSeconds()};
        }
        else
        if (t == 'number') {
            var h, m, s;
            date = Math.round(date/1000);
            s = date%60;
            date = (date - s)/60;
            m = date%60;
            h = (date - m)/60;
            return {hours:h%24, minutes:m, seconds:s};
        }
        return null;
    }
};