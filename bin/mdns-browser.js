// import the module
const mdns = require('mdns');


// advertise a http server on port 4321


// watch all http servers

var sequence = [
  mdns.rst.DNSServiceResolve(),
  'DNSServiceGetAddrInfo' in mdns.dns_sd ? mdns.rst.DNSServiceGetAddrInfo() : mdns.rst.getaddrinfo({families:[4]}),
  mdns.rst.makeAddressesUnique()
];

var browser = mdns.createBrowser(mdns.tcp('party'), {resolverSequence: sequence, networkInterface: 0});

//var browser = mdns.browseThemAll({networkInterface: 0})

//const browser = mdns.createBrowser(mdns.tcp('http'));
browser.on('serviceUp', service => {
  console.log("service up: ", service);
});
browser.on('serviceDown', service => {
  console.log("service down: ", service);
});
browser.start();


// discover all available service types
//const all_the_types = mdns.browseThemAll(); // all_the_types is just another browser...
