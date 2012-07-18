var events = require("events"),
    fs = require("fs"),
    http = require("http"),
    interfaces = require("os").networkInterfaces(),
    package_json = JSON.parse(fs.readFileSync('package.json', 'utf8')),
    url = require("url");

function DynDNSClient ( options ) {
    "use strict";

    events.EventEmitter.call(this);

    this.options = options;

    if ( typeof(this.options.hostname) === "object" && (this.options.hostname instanceof Array) ) {
        this.options.hostname = this.options.hostname.join(",");
    }

    if ( this.options.protocol === undefined || this.options.protocol === "" ) {
        this.options.protocol = "ipv4";
    }

    this.startMonitoring();
}

DynDNSClient.super_ = events.EventEmitter;
DynDNSClient.prototype = Object.create(events.EventEmitter.prototype, {
    constructor: {
        value     : DynDNSClient,
        enumerable: false
    }
});

DynDNSClient.prototype.startMonitoring = function () {
    "use strict";

    this.interval = setInterval(function ( thisObj ) {
        thisObj.checkIP();
    }, this.options.interval * 1000 || 60000, this);

    this.checkIP();
};

DynDNSClient.prototype.checkIP = function () {
    "use strict";

    var self = this,
        network_interface = null;

    if ( this.options.network_interface === undefined || this.options.network_interface === "external" ) {
        http.get("http://api.externalip.net/ip/", function ( res ) {
            res.on('data', function ( data ) {
                var ip = data.toString();

                if ( self.curIP !== undefined && self.curIP != ip ) {
                    self.ipChanged(ip, self.curIP);
                } else if ( self.curIP === undefined || self.curIP == "" ) {
                    self.curIP = ip;
                    self.update();
                }
            });
        });
    } else {
        if ( interfaces[this.options.network_interface] !== undefined ) {
            interfaces[this.options.network_interface].forEach(function ( obj ) {
                if ( obj.family === this.options.protocol ) {
                    network_interface = obj;
                }
            });

            if ( this.curIP === undefined || this.curIP === "" ) {
                this.curIP = network_interface.address;
            } else if ( this.curIP !== undefined && this.curIP !== network_interface.address ) {
                this.ipChanged(network_interface.address, this.curIP);
                this.update();
            }
        } else {
            this.emit("error", "Networinterface " + this.options.network_interface + " not found.");
        }
    }
};

DynDNSClient.prototype.ipChanged = function ( newIP, oldIP ) {
    "use strict";

    this.curIP = newIP;
    this.emit('IP:changed', [ newIP, oldIP ]);

    this.update();
};

DynDNSClient.prototype.interfaceStateChanged = function () {
    "use strict";

    this.emit('interface:' + this.INTERFACE_STATE);
};

DynDNSClient.prototype.update = function () {
    "use strict";

    var self = this,
        service = url.parse(this.options.url
            .replace("[USERNAME]", this.options.username)
            .replace("[PASSWORD]", this.options.password)
            .replace("[IP]", this.curIP)
            .replace("[HOSTNAME]", this.options.hostname)
        );

    http.get({
        host   : service.hostname,
        port   : service.port,
        path   : service.path,
        headers: {
            "User-Agent": "node-dyndns-client a dyndns updater " + package_json.version
        },
        auth   : service.auth
    }, function ( res ) {
        res.on('data',function ( data ) {
            switch ( data.toString().split(" ")[0] ) {
                case "badauth":
                    clearInterval(self.interval);
                    self.emit("error", "Bad username or password.");
                    break;

                case "notfqdn":
                    clearInterval(self.interval);
                    self.emit("error",
                        "The hostname specified is not a fully-qualified domain name (not in the form hostname.dyndns.org or domain.com).");
                    break;

                case "nohost":
                    clearInterval(self.interval);
                    self.emit("error",
                        "The hostname specified does not exist in this user account (or is not in the service specified in the system parameter).");
                    break;

                case "numhost":
                    clearInterval(self.interval);
                    self.emit("error",
                        "Too many hosts (more than 20) specified in an update. Also returned if trying to update a round robin (which is not allowed).");
                    break;

                case "abuse":
                    clearInterval(self.interval);
                    self.emit("error", "The hostname specified is blocked for update abuse.");
                    break;

                case "dnserr":
                case "911":
                    clearInterval(self.interval);
                    self.emit("error", "Bad username or password.");
                    break;

                case "good":
                case "nochg":
                    self.emit("update:success");
                    break;
            }
        }).on("error", function ( data ) {
                clearInterval(self.interval);
                self.emit("error", "Some error occured during IP update: " + data.toString());
            });
    });
};

module.exports = DynDNSClient;