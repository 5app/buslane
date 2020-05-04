const logger = require('@5app/logger');

function readStream(readableStream) {
	return new Promise((resolve, reject) => {
		const chunks = [];

		readableStream
			.on('data', chunk => {
				chunks.push(chunk);
			})
			.on('end', () => {
				const body = Buffer.concat(chunks).toString();
				resolve(body);
			})
			.on('error', error => {
				reject(error);
			});
	});
}

async function readJson(readableStream) {
	const data = await readStream(readableStream);

	try {
		return JSON.parse(data);
	}
	catch (error) {
		logger.error('[Buslane] Could not parse data', data);
		throw error;
	}
}

module.exports = readJson;
