const http = require('http');
const logger = require('@5app/logger');
const readJson = require('./readJson');

// https://nodejs.org/api/errors.html#errors_common_system_errors
const errorReasons = {
	ECONNREFUSED: '(Connection refused): No connection could be made because the target machine actively refused it. This usually results from trying to connect to a service that is inactive on the foreign host.',
	ECONNRESET: '(Connection reset by peer): A connection was forcibly closed by a peer. This normally results from a loss of the connection on the remote socket due to a timeout or reboot. Commonly encountered via the http and net modules.',
	ETIMEDOUT: '(Operation timed out): A connect or send request failed because the connected party did not properly respond after a period of time. Usually encountered by http or net. Often a sign that a socket.end() was not properly called.',
	ENOTFOUND: '(DNS lookup failed): Indicates a DNS failure of either EAI_NODATA or EAI_NONAME. This is not a standard POSIX error.',
	EPIPE: '(Broken pipe): A write on a pipe, socket, or FIFO for which there is no process to read the data. Commonly encountered at the net and http layers, indicative that the remote side of the stream being written to has been closed.',
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
		const {message, code, address, port} = error;
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
