const SKIPPED_STACK_TRACE_ENTRIES = [
	'at runMicrotasks (',
	'at processTicksAndRejections (',
];

function cleanUpStackTraceEntries(stackTraceEntries) {
	return stackTraceEntries.filter(entry => {
		const trimmedEntry = entry.trim();

		return !SKIPPED_STACK_TRACE_ENTRIES.some(skippedEntry => trimmedEntry.startsWith(skippedEntry));
	});
}

function extendStackTrace(current, extension) {
	if (!extension) {
		return current;
	}

	const [, ...currentEntries] = current.split('\n');
	const [rootCause, ...extensionEntries] = extension.split('\n');

	const extendedStackTrace = [
		rootCause,
		...cleanUpStackTraceEntries(extensionEntries),
		...cleanUpStackTraceEntries(currentEntries),
	];

	return extendedStackTrace.join('\n');
}

class RPCError extends Error {
	constructor({message = 'Unknown error', name, stack, code, ingress, method}) {
		super(message);

		if (name) {
			this.name = name;
		}

		this.stack = extendStackTrace(this.stack, stack);
		this.code = code;
		this.ingress = ingress;
		this.method = method;
	}
}

module.exports = RPCError;
