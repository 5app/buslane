

const Buslane = require('../..');

function busTestConfig(name) {
	const config = {name, shared_api_key: 'test'};
	config.map = [
		{name: 'argo', port: 11211, ingresses: ['boat']},
		{name: 'jason', port: 11311, ingresses: []},
	];

	return config;
}


class Service {
	constructor() {

	}

	destroy() {

	}
}

class Jason extends Service {
	constructor() {
		super();

		this.buslane = new Buslane(busTestConfig('jason'));
		this.boat = this.buslane.argo.boat;
	}
}

class Argo {
	constructor() {
		this.destination = 'port';
		this.buslane = new Buslane(busTestConfig('argo'));

		// expose the db and the api object to the cluster
		this.buslane.registerIngress('boat', this);

		this.row_count = 0;
	}

	sail(destination) {
		this.destination = destination;

		console.log(`Sailing to ${destination}`);
		return true;
	}

	throwAnError(message = 'An error') {
		throw new Error(message);
	}

	row() {
		this.row_count++;
	}

	destroy() {
		this.buslane.destroy();
	}
}

module.exports = {Jason, Argo};
