class RPCError extends Error {
	constructor({message = 'Unknown error', name, stack, code, ingress, method}) {
		super(message);

		if (name) {
			this.name = name;
		}

		this.stack = stack;
		this.code = code;
		this.ingress = ingress;
		this.method = method;
	}
}

module.exports = RPCError;
