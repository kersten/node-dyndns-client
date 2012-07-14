node-dyndns-client
==================

A dynamic dns client for updating IPs

Options
-------
    var options = {
        url: "http://members.dyndns.org/",
        hostnames: [
            "test.dyndns.org",
            "customtest.dyndns.org"
        ],
        username: 'username',
        password: 'password',
        interface: 'ppp0',
        protocol: 'ipv4',
        check: 60
    };

Usage
-----
    var DynDNSClient = require("node-dyndns-client"),
        dyndns = new DynDNSClient({
            url: "http://members.dyndns.org/",
            hostnames: [
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