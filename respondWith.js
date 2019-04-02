function serialise(data) {
	if (!data) {
		return null;
	}

	if (data instanceof Error) {
		const {name, message, stack, code} = data;
		return JSON.stringify({name, message, stack, code});
	}

	return JSON.stringify(data);
}

function respondWith({response, data, headers = {}, statusCode = 200}) {
	// console.log('respondWith', {data, statusCode});
	const serialisedData = serialise(data);
	const dataHeaders = {};

	if (serialisedData) {
		dataHeaders['Content-Type'] = 'application/json';
		dataHeaders['Content-Length'] = Buffer.byteLength(serialisedData);
	}

	// status code
	response.writeHead(statusCode, {
		...headers,
		...dataHeaders,
	});

	// send response
	response.end(serialisedData);
}

module.exports = respondWith;
