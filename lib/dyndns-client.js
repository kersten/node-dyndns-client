var events = require("events"),
    http = require("http"),
    interfaces = require("os").networkInterfaces(),
    url = require("url");

function DynDNSClient ( options ) {
    events.EventEmitter.call(this);

    this.options = {
        protocol: "ipv4"
    };
    
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
    
    this.checkIP();
};

DynDNSClient.prototype.checkIP = function () {
    var self = this,
        interface = null;
    
    if (this.options.interface === undefined || this.options.interface == "external") {
        http.get("http://api.externalip.net/ip/", function(res) {
            res.on('data', function (data) {
                var ip = data.toString();
                
                if (self.curIP !== undefined && self.curIP != ip) {
                    self.ipChanged(ip, self.curIP);
                } else if (self.curIP === undefined || self.curIP == "") {
                    self.curIP = ip;
                    self.update();
                }
            });
        });
    } else {
        if (interfaces[this.options.interface] !== undefined) {
            interfaces[this.options.interface].forEach(function (obj) {
                if (obj.family == this.options.protocol) {
                    interface = obj;
                }
            });
            
            if (this.curIP === undefined || this.curIP == "") {
                this.curIP = interface.address;
            } else if (this.curIP !== undefined && this.curIP != interface.address) {
                this.ipChanged(interface.address, this.curIP);
                this.update();
            }
        } else {
            this.emit("error", "Networinterface " + this.options.interface + " not found.");
        }
    }
};

DynDNSClient.prototype.ipChanged = function ( newIP, oldIP ) {
    this.curIP = newIP;
    this.emit('IP:changed', [ newIP, oldIP ]);
    
    this.update();
    delete(newIP, oldIP);
};

DynDNSClient.prototype.interfaceStateChanged = function () {
    this.emit('interface:' + this.INTERFACE_STATE);
};

DynDNSClient.prototype.update = function () {
    var self = this,
        service = url.parse(this.options.url);
    
    http.get({
        host: service.hostname,
        port: service.port,
        path: "/nic/update?hostname=" + this.options.hostnames.join(",") + "&myip=" + this.curIP + "&wildcard=NOCHG&mx=NOCHG&backmx=NOCHG",
        headers: {
            "User-Agent": "node-dyndns-client dyndns updater v0.1"
        },
        auth: this.options.username + ":" + this.options.password
    }, function(res) {
        res.on('data', function (data) {
            switch (data.toString()) {
                case "badauth":
                    self.emit("error", "Bad username or password.");
                    break;
                
                case "notfqdn":
                    self.emit("error", "The hostname specified is not a fully-qualified domain name (not in the form hostname.dyndns.org or domain.com).");
                    break;
                
                case "nohost":
                    self.emit("error", "The hostname specified does not exist in this user account (or is not in the service specified in the system parameter).");
                    break;
                
                case "numhost":
                    self.emit("error", "Too many hosts (more than 20) specified in an update. Also returned if trying to update a round robin (which is not allowed).");
                    break;
                
                case "abuse":
                    self.emit("error", "The hostname specified is blocked for update abuse.");
                    break;
                
                case "dnserr":
                case "911":
                    self.emit("error", "Bad username or password.");
                    break;
                
                case "good":
                case "nochg":
                    self.emit("update:success");
                    break;
            }
                    
            console.log(data.toString());
        }).on("error", function (data) {
            this.emit("error", "Some error occured during IP update: " + data.toString());
        });
    });
    
    delete(service);
};

module.exports = DynDNSClient;