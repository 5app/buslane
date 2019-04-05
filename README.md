# Buslane

[![Greenkeeper badge](https://badges.greenkeeper.io/5app/buslane.svg)](https://greenkeeper.io/)
[![Coverage Status](https://coveralls.io/repos/github/5app/buslane/badge.svg)](https://coveralls.io/github/5app/buslane)

## Intro

buslane is a cross-service and transparent object.method proxy, using an rpc-lite json/http1 transport.

The need for this lib came about when we decided to move to docker at 5app. I wanted a simple way to remove our direct code dependencies between services without having to add extra endpoints manually.

With buslane and its RPC like object proxying, you can call methods on remote objects as if they were in the same context. So there is no need to create specific service endpoints either. Just write the configuration and buslane will expose the objects to each other.

This is all still very experimental, so use with caution, I sure am.

## Config & Usage

I recommend looking at the [tests](https://github.com/5app/buslane/tree/master/test) to understand how the initialization work.

```
const thisServiceName = 'service1';
const config = {
	name: thisServiceName,
	shared_api_key: 'my shared secret key',
	map: [
		{name: 'service2', port: 11211, ingresses: ['boat']},
		{name: thisServiceName, port: 11311, ingresses: []},
	],
};

const buslane = new Buslane(config);
const rpcResult = await buslane.service2.boat.sail('ocean');
```

## Test

build and run with docker:

```
docker build -t buslane . && docker run buslane
```


## Comparison with Buslane 2

Buslane 3 uses HTTP1 while Buslane 2 uses HTTP2.
The decision on dropping HTTP2 in favour of HTTP1 was made in order to resolve 2 issues:

- Recover connections after the service recovers: this can also be achieved by re-attempting connections and handling extra HTTP2 headers like `GOAWAY` (in addition to the current `ERR_HTTP2_INVALID_SESSION`).
- Load balancing requests between multiple instances of the same service: HTTP2 creates a session which binds 2 services (instances) together using a TCP connection. As a session-less protocol, HTTP1 does not have this issue, but on the other hand, there will be a handshake every time a request is made (with extra overhead compared to HTTP2).

