var crypto = require('crypto');

module.exports = {
    session: function () {
        return Math.floor(Math.random() * 1000) + (Date.now().toString(36) + Math.random().toString(36).substr(2, Math.floor((Math.random() * 20) + 6))).toLowerCase()
    },
    guid: function () {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    }
};
