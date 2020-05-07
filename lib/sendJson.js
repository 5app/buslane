const http = require('http');
const logger = require('@5app/logger');
const readJson = require('./readJson');

// https://nodejs.org/api/errors.html#errors_common_system_errors
const errorReasons = {
	ECONNREFUSED: 'No connection could be made because the target machine actively refused it.',
	ECONNRESET: ' A connection was forcibly closed by the target machine potentially due to a timeout or reboot.',
	ETIMEDOUT: 'Send request timed out because the connected party did not properly respond after a period of time.',
	ENOTFOUND: 'DNS lookup failure. The IP of the target could not be resolved.',
	EPIPE: 'The remote side of the stream being written to has been closed.',
};

function sendRequest(options, data) {
	return new Promise((resolve, reject) => {
		const request = http.request(options, response => {
			resolve(response);
		});

		request.on('error', error => {
			reject(error);
		});

		request.write(data);
		request.end();
	});
}

async function sendJson({data, port, hostname = 'localhost', path = '/', apiKey = '', targetService}) {
	const body = JSON.stringify(data);
	const options = {
		hostname,
		port,
		path,
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Content-Length': Buffer.byteLength(body),
			'x-api-key': apiKey,
		}
	};

	try {
		const response = await sendRequest(options, body);
		const responseJson = await readJson(response);

		return {
			status: response.statusCode,
			body: responseJson,
		};
	}
	catch (error) {
		const {message, code, address} = error;
		const reason = errorReasons[code];

		logger.error(`[Buslane] Error sending a request to ${targetService}`, {
			code,
			reason,
			message,
			hostname,
			address,
			port,
			targetService,
		});

		throw error;
	}
}

module.exports = sendJson;
