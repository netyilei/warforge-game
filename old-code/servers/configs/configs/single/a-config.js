var wsBaseUrl = "ws://127.0.0.1:"
var httpBaseUrl = "http://127.0.0.1:"
module.exports = {
	values: {
		"local-ip": "0.0.0.0",

		"rpc-center": wsBaseUrl + "30001",
		"rpc-host": httpBaseUrl + "30002",
		"rpc-token": "#LP5BzteqqUmYrycyCS6tHwUpJq#",

		"srs-token": "#YEWUXGEFEttftBd7qegfYL8ScJ#",

		"robot-token": "#783EclOTXSaXnzYadna3BJJccP#",

		"db-connect": "mongodb://admin:ygb2%246Q%40cmSKNfE2@mongodb:27017",
		"db-connect-sec": "mongodb://admin:ygb2%246Q%40cmSKNfE2@mongodb:27017",
		"db-name": "cpp-root",

		"redis": { host: "redis", port: 6379, auth: "Ut3rcplFX*wLBSxy" },
		"redis-listener": { host: "redis", port: 6379, auth: "Ut3rcplFX*wLBSxy", idx: 1 },

		"rpc-logger": httpBaseUrl + "28999" + "/rpclog",

		"originDBName": "cpp-root",
		"project-tag": "cpp",

		"dn-logger": "tds-logger",

		"robot-center-name": "pp-robotenv-center",

		"log-instance": true,
		"log-engine": true,
	}
}
