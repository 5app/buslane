

const debug = !!process.env.BUS_DEBUG;

const logger = require('@5app/logger');
const sendJson = require('./lib/sendJson');
const RPCError = require('./lib/RPCError');
const {createRpcServer, handleRPC} = require('./lib/createRpcServer');

module.exports = class Buslane {

	constructor(config) {
		if (!config) {
			throw new Error('Missing required config(first param)');
		}

		this.config = config;

		if (!config.name) {
			throw new Error('Missing required config params: name');
		}

		if (!config.map) {
			throw new Error('Missing required config params: map');
		}

		if (!config.shared_api_key) {
			throw new Error('Missing required config params: shared_api_key');
		}

		// register all the ingress that should be accessible to this service
		config.map.forEach(service => {
			if (service.name !== config.name) {
				this[service.name] = {};
				service.ingresses.forEach(egress => {
					this[service.name][egress] = this.registerEgress(service.name, egress);
				});
			}
		});

		this.services = {};
	}

	destroy() {
		this.server.close();
	}

	onReady(fn) {
		this._onReady = fn;
		if (this._ready) {
			fn();
		}
	}

	/*
		Create an http server in accordance with the service object. This object may/should contain:
			- name(String), for Debugging
			- port(Number), required
	 */
	createServer({name, port}) {
		if (!name) {
			throw new Error('name is required');
		}

		if (!port) {
			throw new Error('port is required');
		}

		if (!this.server) {
			this.server = createRpcServer({
				name,
				port,
				sharedApiKey: this.config.shared_api_key,
				services: this.services,
				onReady: () => {
					this._ready = true;
					if (this._onReady) {
						this._onReady();
					}
				}
			});
		}
	}

	/*
		 Return a proxy object that will assume all methods exists. If we take a config with to services with
		 on ingress each, those will be register as egress on the otherside. The proxy object is required
		 to be able to call any function. If the function does not exist on the other side an error is thrown.
	 */
	registerEgress(serviceName, name) {
		const destination = this.config.map.find(x => x.name === serviceName);
		const shared_api_key = this.config.shared_api_key;
		const handler = {
			get(target, methodName) {
				// if an actual property exist, return it, this allow us to mock methods
				if (target[methodName]) {
					return target[methodName];
				}

				return async (...args) => {
					if (destination.mock) {
						throw new Error('Missing Mock');
					}

					const data = {name, methodName, args};

					if (debug) {
						logger.info(`[Buslane] Query on ${serviceName}:${name}`, data);
					}

					const {status, body} = await sendJson({
						data,
						hostname: destination.host,
						port: destination.port,
						apiKey: shared_api_key,
						targetService: destination.name,
					});

					if (status !== 200) {
						if (debug) {
							logger.error(`[Buslane] Bus error(s) on ${serviceName}:${name}:`, {body, currentStack: (new Error()).stack});
						}

						throw new RPCError({
							...body,
							ingress: `${serviceName}:${name}`,
							method: methodName,
						});
					}

					if (body.undefined) {
						return {};
					}

					return body;
				};
			}
		};

		return new Proxy({}, handler);
	}

	/**
		Register a service as an Ingress, making the object methods accessible to
		the other services.

		@param {string} name - The name of the ingress(ex: database, so other service could call database.sql(query))
		@param {object} obj - The object in question (ex: in our example, the database object)
		@returns {undefined}
	*/
	registerIngress(name, obj) {
		const service = this.config.map.find(x => x.name === this.config.name);

		if (!service) {
			throw new Error(`No known ingresses for ${name}`);
		}

		this.createServer(service);
		this.services[name] = obj;
	}

	/**
	 * Handle RPC Connections
	 * @param {Request} req - Http Request object
	 * @param {Response} res - Http Response object
	 * @returns {void}
	 */
	handleRPC(req, res) {

		// Handle RPC Requests...
		return handleRPC(this.config.shared_api_key, this.services, req, res);
	}

};

