'use strict';

const {Readable} = require('stream');
const readJson = require('../../readJson');

describe('readJson', () => {
	it('should read a JSON from a stream', async () => {
		const data = {a: 1, b: 'value'};

		// Create a Readable stream from the data
		const testData = Buffer.from(JSON.stringify(data), 'utf8');
		const stream = new Readable();
		stream.push(testData);
		stream.push(null);

		// Extract the JSON from the stream
		const extractedData = await readJson(stream);

		expect(extractedData).to.deep.equal(data);
	});

	it('should throw if the stream does not contain a valid JSON', async () => {
		// Create a Readable stream from an invalid JSON data
		const testData = Buffer.from('{{', 'utf8');
		const stream = new Readable();
		stream.push(testData);
		stream.push(null);

		return expect(readJson(stream)).to.be.rejectedWith('Unexpected token'); // Error coming from JSON.parse
	});
});