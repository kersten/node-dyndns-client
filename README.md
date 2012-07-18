node-dyndns-client
==================

A dynamic dns client for updating hostnames

Options
-------
* url: The URL of the dynamic dns service (eg: http://[USERNAME]:[PASSWORD]@members.dyndns.org/nic/update?hostname=[HOSTNAME]&myip=[IP])
* hostname: Dynamic dns hostname that should be updated. Can be array (for multi host update) or string
* username: Username for authenticate at the service
* password: Password for authenticate at the service
* interface: Networkinterface that is connected to the internet (eg: ppp0). If empty API from externalip.net is used
* protocol: IP protocol should be ipv4 or ipv6
* check: Interval in minutes to check current IP

URL Parsing
-----------
The URL you provide to the API will be parsed and the given placeholders will be replaced with the given parameters.
If you have a service where no password is required, just an API-Key use ether the password or username parameter for
replacing.

Usage
-----
    var DynDNSClient = require("node-dyndns-client"),
        dyndns = new DynDNSClient({
            url: "http://[USERNAME]:[PASSWORD]@members.dyndns.org/nic/update?hostname=[HOSTNAME]&myip=[IP]",
            hostname: [
                "test.dyndns.org",
                "customtest.dyndns.org"
            ],
            username: 'username',
            password: 'password',
            interface: 'ppp0',
            protocol: 'ipv4',
            check: 60
        });

    dyndns.on('IP:changed', function (newIP, oldIP) {
        // IP has changed
    });

    dyndns.on('update:success', function () {
        // Update at services succeeded
    });

    dyndns.on('error', function (err) {
        // Update at services failed
    });