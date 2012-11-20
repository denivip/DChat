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



var DChat = {
    DEFAULT_ROOM: 'room1',
    SERVER_ADDR: 'ws://217.65.2.4:8081/',
    BLOCK_INTERVAL: 3000,

    STATE_READ_ONLY: 1,
    STATE_READY: 2,

    MAX_NICKNAME_LENGTH: 30,
    MAX_MESSAGE_LENGTH: 140,

    _userName: 'Anonimous',
    _currentRoom: null,

    _socket: null,

    _blockThread: null,
    _blockFlag: false,

    _state: null,

    _msgTemplate: null,

    /**
     * Initializing
     */
    initialize: function() {
        this.$el = $('.chat');
        this._msgTemplate = $('.invis .msg-tpl').html();

        this._onOpen = _.bind(this._onOpen, this);
        this._onMessage = _.bind(this._onMessage, this);
        this._onError = _.bind(this._onError, this);
        this._onClose = _.bind(this._onClose, this);

        $('.login-nickname').html(this._userName);

        // if user is running mozilla then use it's built-in WebSocket
        window.WebSocket = window.WebSocket || window.MozWebSocket;

        this._open(this.DEFAULT_ROOM);

        this._delegateEvents();
    },

    /**
     * Delegate events
     *
     * @private
     */
    _delegateEvents: function() {
        var self = this;

        this.$el.find('#submit').click(function() {
            self._send();
        });

        this.$el.find('.room').click(function(e) {
            self._open($(e.target).data('value'));
        });

        this.$el.find('#message').on('keydown' ,function(e) {
            self._onInputEnter(e);
        });

        $('#nick-input').on('keydown' ,function(e) {
            self._onNickInputEnter(e);
        });

        $('.login-nickname').click(function(e) {
            self._nickNameInputOpen();
    });
    },

    /**
     * Open nickname input
     *
     * @private
     */
    _nickNameInputOpen: function() {
        $('#nick-input').show().val(this._userName).focus();
    },

    /**
     * Open chat
     *
     * @private
     * @param {String} room room to enter
     */
    _open: function (room) {
        this._currentRoom = room;

        //close old socket
        if (this._socket && this._socket.close && (this._socket.readyState == 1 || this._socket.readyState == 0)) {
            this._socket.close();
        }

        // open connection
        this._socket = new WebSocket(this.SERVER_ADDR);

        this._socket.onopen = this._onOpen;
        this._socket.onopen = this._onOpen;
        this._socket.onclose = this._onClose;
        this._socket.onmessage = this._onMessage;
    },

    /**
     * Socket callback on open connection
     *
     * @private
     */
    _onOpen: function() {
        console.log('Chat socket opened');

        console.log('block', this._blockFlag);

        this.enterRoom(this._currentRoom);
    },

    /**
     * Socket callback on error occurred
     *
     * @private
     */
    _onError: function() {

    },

    /**
     * Socket callback on closing connection
     *
     * @private
     */
    _onClose: function() {

    },

    /**
     * Socket callback on message received
     *
     * @private
     * @param {Object} message Received message
     */
    _onMessage: function(message) {
        var data = JSON.parse(message.data),
            msg = this._prepareMessage(data);

        // Разбираем тип сообщения
        if (data.t == 'msg') {

            this._evenMessageFlag = !this._evenMessageFlag;
            this._addMessage(msg);

        } else if (data.t == 'usercount') {

            this.$el.find('.users-count__count').html(data.m);

        } else if (data.t == 'history') {

            var historyObj = JSON.parse(msg.text),
                history = '';

            // Разбираем историю по сообщениям
            for (var mes in historyObj) {
                history += Mustache.render(this._msgTemplate, this._prepareMessage(JSON.parse(historyObj[mes])));
                this._evenMessageFlag = !this._evenMessageFlag;
            }

            var el = this.$el.find('.chat-messages');

            el.html(history);

            el[0].scrollTop = el[0].scrollHeight;
        } else if (data.t == 'system') {
            for (var item in msg.text) {
                msg[item] = msg.text[item];
            }

            if (msg.text && (msg.text.nick != this._userName)) {
                this._addMessage(msg);
            }

        } else if (data.t == 'state') {
            this._setChatState(data.m);
        }


    },

    /**
     * Preparing received message
     *
     * @private
     * @param {Object} data Received data
     */
    _prepareMessage: function(data) {
        var time = Utils.Date._decomposeTime(Utils.Date.dateParse(data.dt)),
            self = this;

        return {
            name: data.n,
            type: data.t,
            time: time.hours + ':' + time.minutes,
            channel: data.c,
            text: data.m,
            system: (data.t == 'system') ? true : false,
            even: self._evenMessageFlag
        };
    },

    /**
     * Send message to chat
     *
     * @private
     * @param {String} type message type
     * @param {Object} msg message
     */
    _sendMessage: function(type, msg) {
        this._socket.send(JSON.stringify({
            type: type,
            data: msg
        }));

        this.$el.find('#message').val('');

        var self = this,
            submitBtn = this.$el.find('#submit');

        if (type == 'msg') {
            this._blockFlag = true;

            submitBtn.text('Wait');

            this._blockThread = setTimeout(function() {
                submitBtn.text('Send');
                self._blockFlag = false;
            }, this.BLOCK_INTERVAL)
        }

    },

    /**
     * Add message to DOM
     *
     * @private
     * @param {Object} message prepared message
     */
    _addMessage: function(message) {
        var el = this.$el.find('.chat-messages');

        if (!el.length) {
            return;
        }

        el.append(Mustache.render(this._msgTemplate, message));

        el[0].scrollTop = el[0].scrollHeight;
    },

    /**
     * Enter chat room
     *
     * @param {String} room room
     */
    enterRoom: function(room) {
        this._currentRoom = room;

        this._sendMessage('handshake', {
            channelId: room,
            nickName: this._userName
        });

    },

    /**
     * Get chat history
     */
    getHistory: function() {
        this._sendMessage('history');
    },

    /**
     * Getting userscount
     */
    getUsersCount: function() {
        this._sendMessage('usercount');
    },

    /**
     * Setting the state of chat
     *
     * @private
     * @param {Integer} state state
     */
    _setChatState: function(state) {
        this._state = state.state;

        var rooms = this.$el.find('.room');

        rooms.removeClass('active');

        for (var i = 0; i < rooms.length; i++) {
            if ($(rooms[i]).data('value') == state.channelId) {
                $(rooms[i]).addClass('active');
            }
        }

        if (this._state) {
            this.getUsersCount();
            this.getHistory();
        }


        if (this._state == this.STATE_READ_ONLY) {
            this.$el.addClass('readonly');
        }
    },

    /**
     * Clicking on Send button
     *
     * @private
     */
    _send: function() {
        var text = this.$el.find('#message').val();

        if (!text.length || (text == '\n') || this._blockFlag) {
            return;
        }

        this._sendMessage('msg', text);
    },

    /**
     * Keydown callback on message field
     *
     * @private
     * @param {Event} e event
     */
    _onInputEnter:function (e) {
        if (e.which == 13) {
            this._send();
        } else {
            var $field = $(e.target),
                text = $field.val();

            if (text.length > this.MAX_MESSAGE_LENGTH) {
                $field.val(text.slice(0, this.MAX_MESSAGE_LENGTH));
            }
        }
    },

    /**
     * Keeydown callback on nickname field
     *
     * @private
     * @param {Event} e event
     */
    _onNickInputEnter:function (e) {
        var $field = $(e.target),
            text = $field.val();

        if ((e.which == 13) && text.length) {
            this._changeNickName(text);
        } else {
            if (text.length > this.MAX_NICKNAME_LENGTH) {
                $field.val(text.slice(0, this.MAX_NICKNAME_LENGTH));
            }
        }
    },

    /**
     * Change username
     *
     * @private
     * @param {String} nicname username
     */
    _changeNickName: function(nickname) {
        $('#nick-input').hide();
        this._userName = nickname;
        $('.login-nickname').html(this._userName);

        this._open(this._currentRoom);
    }


}

// start chat, when document is ready
$(function() {
    DChat.initialize();
});