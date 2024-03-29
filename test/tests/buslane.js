
const services = require('../mock/services.js');
const http = require('http');

let argo;
let jason;

describe('Buslane', () => {
	beforeEach(next => {
		if (argo) {
			// kill the existing webserver
			argo.buslane.destroy();
		}

		argo = new services.Argo();
		jason = new services.Jason();

		argo.buslane.onReady(next);
	});

	it('can call a method, and we can see the result on the other side', async () => {
		await jason.boat.sail('sea');

		expect(argo.destination).to.equal('sea');
	});

	it('can bind to an existing listener', async () => {

		const port = 12345;
		let serverHit;

		// Create a server which listens on another port...
		const srv = http.createServer((req, res) => {
			serverHit = true;
			argo.buslane.handleRPC(req, res);
		}).listen(port);

		// Change the buslane config in jason to use this new port for the handling...
		jason.buslane.config.map.find(item => item.name === 'argo').port = port;

		// Test it works
		await jason.boat.sail('river');
		expect(argo.destination).to.equal('river');

		// ... and that it used the new service
		expect(serverHit).to.be.ok;

		srv.close();
	});

	it('perform under (light) stress', async () => {
		const count = 100;
		const ts = `time for ${count} calls`;

		const prs = [];
		console.time(ts);
		for (let i = 0; i < count; i++) {
			prs.push(jason.boat.row());
		}
		await Promise.all(prs);
		console.timeEnd(ts);

		expect(argo.row_count).to.equal(count);
	});

	it('should throw when we call an unknown method', async () => {
		return expect(jason.boat.unknownMethod('sea')).to.be.rejectedWith('Unknown ingress method boat.unknownMethod');
	});

	it('should throw when we call a method that throws', async () => {
		const errorMessage = 'A unique error message';

		return expect(jason.boat.throwAnError(errorMessage)).to.be.rejectedWith(errorMessage);
	});

	it('should be able to use the remote service when it recovers after a crash', async () => {
		// 1. make sure we can call the remote service
		await jason.boat.sail('sea');

		// 2. stop the service
		argo.buslane.destroy();
		await expect(jason.boat.sail('ocean')).to.be.rejectedWith('connect ECONNREFUSED 127.0.0.1:11211');

		// 3. restart the service
		const argo2 = new services.Argo();

		// 4. make sure we can call the remote service again
		await jason.boat.sail('ocean');
		expect(argo2.destination).to.equal('ocean');
		argo2.destroy();
	});
});
