var events = require('events'),
    interfaces = require('os').networkInterfaces;

function DynDNSClient ( options ) {
    events.EventEmitter.call(this);

    this.options = options;
    this.startMonitoring();
}

DynDNSClient.super_ = events.EventEmitter;
DynDNSClient.prototype = Object.create(events.EventEmitter.prototype, {
    constructor: {
        value: DynDNSClient,
        enumerable: false
    }
});

DynDNSClient.prototype.startMonitoring = function () {
    this.interval = setInterval(function (thisObj) {
        thisObj.checkIP();
    }, this.options.interval * 1000 || 60000, this);
};

DynDNSClient.prototype.checkIP = function () {
    this.emit('IP:changed', [ this.ip, oldIP ]);
};

DynDNSClient.prototype.ipChanged = function ( newIP, oldIP ) {
    this.ip = newIP;
    this.emit('IP:changed', [ newIP, oldIP ]);

    this.update(oldIP);
};

DynDNSClient.prototype.interfaceStateChanged = function () {
    this.emit('interface:' + this.INTERFACE_STATE);
};

DynDNSClient.prototype.update = function ( oldIP ) {
    this.emit('IP:changed', [ this.ip, oldIP ]);
};

module.exports = DynDNSClient;