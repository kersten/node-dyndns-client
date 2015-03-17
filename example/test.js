var DynDNSClient = require('../index'),
	dyndns = new DynDNSClient({
		url                 : "http://members.dyndns.org/nic/update",
		hostname            : [
			"test.dyndns.org",
			"customtest.dyndns.org"
		],
		username            : 'username',
		password            : 'password',
		network_interface   : 'en0',
		protocol            : 'ipv4',
		check               : 60
	});

dyndns.on('IP:changed', function (newIP, oldIP) {
    console.log(newIP, oldIP);
});

dyndns.on('update:success', function () {
	console.log('updated');
});

dyndns.on('error', function (err) {
	console.log(err);
});

