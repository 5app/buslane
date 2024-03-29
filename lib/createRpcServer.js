const http = require('http');
const logger = require('@5app/logger');
const respondWith = require('./respondWith');
const readJson = require('./readJson');

async function handleRPC(sharedApiKey, services, request, response) {
	if (request.headers['x-api-key'] !== sharedApiKey) {
		respondWith({
			response,
			statusCode: 403,
			data: {
				message: 'Wrong or missing x-api-key header',
			},
		});

		return;
	}

	const {name, methodName, args} = await readJson(request);
	const service = services[name];

	if (!service) {
		respondWith({
			response,
			statusCode: 404,
			data: {
				message: `Unknown ingress ${name}`,
				unknowIngress: name,
			},
		});

		return;
	}

	const method = service[methodName];

	if (!method) {
		respondWith({
			response,
			statusCode: 404,
			data: {
				message: `Unknown ingress method ${name}.${methodName}`,
				unknowIngressMethod: methodName,
			},
		});

		return;
	}

	// method found, so we call it
	try {
		let result = await method.call(service, ...args);

		if (!result) {
			result = {undefined: true};
		}

		respondWith({response, data: result});
	}
	catch (error) {
		respondWith({response, statusCode: 500, data: error});
	}
}

function createRpcServer({name, port, sharedApiKey, services, onReady}) {
	const requestHandler = handleRPC.bind(null, sharedApiKey, services);
	const server = http.createServer(requestHandler);

	server.on('error', error => {
		logger.error(`[Buslane] ${name}: unknown error`, error);
	});

	server.on('socketError', error => {
		logger.error(`[Buslane] ${name}: unknown error`, error);
	});

	server.listen(port, error => {
		if (error) {
			logger.error(`[Buslane] ${name}: local bus server error:`, error);
		}
		else {
			logger.info(`[Buslane] ${name}: local bus server started on ${port}`);

			if (typeof onReady === 'function') {
				onReady();
			}
		}
	});

	return server;
}

module.exports = {createRpcServer, handleRPC};
