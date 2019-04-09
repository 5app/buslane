const http = require('http');
const readJson = require('./readJson');

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

async function sendJson({data, port, hostname = 'localhost', path = '/', apiKey = ''}) {
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
		console.error('Error sending a request', error);
		throw error;
	}
}

module.exports = sendJson;
