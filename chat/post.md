Bacon.js + Node.js: Functional Reactive Programming on the Server
======================

What
----

The following demonstrates the usage of the Bacon.js library in implementing a Node.js chat application in the functional reactive programming style. We'll start by re-implementing the canonical Socket.IO chat application in an FRP-idiomatic way, moving on to stream composition, sampling, debouncing, error handling and logging.

Why
---

This document is largely the result of my frustration in finding little examples of using Bacon.js on the server; most of what I've seen has to do with building reactive user interfaces and games. You should expect to get an not only an overview of the Bacon.js API - but also an idea for how one might model a program around a collection of high level event streams and properties. 

Demo App: Seattle Weather Aficionados Chat
---

### Our Baseline Implementation

We'll be building a chat application for Seattle-based weather aficionados. On top of basic chat functionality (sending messages to a chat room, being notified when users enter/leave the room), the application will provide two interesting, user-facing features:

1. New users, upon connection to the server, will be sent a private message containing a summary of the current weather in Seattle.
2. A weather-related fact will be broadcast to the chat room after every 20 messages sent between users.

Behind the scenes, we'll add a few constraints to our server implementation to make things interesting:

1. The greeting sent to newly-connected users is kept fresh by polling the National Weather Service every 2 seconds.
2. All messages sent between users containing the string "cloudy" are sent to an external logging server. This server is notoriously-flaky; in the event of a failure, we'll retry our POST up to 10 times.

The original, vanilla-JavaScript implementation can be found here: TODO CODEZ

## EventStreams and Properties

Using Bacon.js, we'll be modifying our original implementation to use two new concepts: `EventStream` and `Property`. The difference between the two abstractions is nicely summarized by the Bacon.js author on his GitHub page (https://github.com/baconjs/bacon.js/):

> Each EventStream represents a stream of events. [...] In addition to EventStreams, bacon.js has a thing called Property, that is almost like an EventStream, but has a "current value". So things that change and have a current state are Properties, while things that consist of discrete events are EventStreams.

Differently put, events in an `EventStream` may represent things like the moment in time in which a user clicks a mouse, a timer expires, or the result of an asynchronous file-read operation has been made available. A `Property` on the other hand represents a value that might change over time. You might use a property to represent the current value of an HTML input-field or an array of a system's currently logged-in users.

So what are the properties and event streams in our system? To achieve parity with our original, vanilla-JavaScript implementation, we'll want:

1. a `greeting` property whose value will be the greeting-message sent to new users upon connection to the server
2. a `connections` event stream representing incoming socket connections 
3. a `greetings` event stream representing the `greeting` property sampled at the point of each incoming socket connection; we'll use its values to send a greeting to each new user
4. a `messages` event stream representing all messages sent by all users
5. a `fact` property whose value will change after every 20 messages sent between users 
1. a `cloudyMessages` stream representing the messages sent between users that contain the word "cloudy"

## Laying the Foundation ##

### Our First Reactive Property: `greeting`

```js
var greeting = Bacon
  .fromNodeCallback(fs.readFile, './hello.txt', 'utf8')
  .toProperty()
```

We'll kick things off by creating a `Property` representing the contents of our `hello.txt` file. `Bacon.fromCallback` accepts a reference to a function expecting to be passed a Node.js-style callback and any arguments to apply to the function. The resulting value is an `EventStream` that will contain (at most) a single event representing a single call to the `fs.readFile` callback. 

To ensure that we hold on to this value for later use, we convert it to a `Property` using the `EventStream#toProperty` method.

### The `connections` Event Stream

```js
var connections = Bacon.fromBinder(function(sink) {
  io.on('connection', sink)
});
```

Since the `io.on` method does not accept a Node.js-style callback (with error first and then data), we'll need to use something lower-level to create the stream of socket connection-events. In this case, `Bacon.fromBinder` does the trick (`Bacon.Bus` also would have worked). We simply pass the `sink` function as the callback to our `io.on` method and, *voilà*, we've got a `EventStream` of events representing Socket.IO socket-connections.

### Sampling Properties: `greetings` ###

```js
var greetings = greeting.sampledBy(connections, function(grt, skt) {
  return [grt, skt];
})
```

Using `Observable#sampledBy`, we can create a new stream whose events contain values from both our `greeting` property and `connections` stream. This `greetings` stream will contain one event for each event in the `connections` stream; the `greeting` property is "sampled" once per event, with the provided function being used to combine the two values into an array.

### Collapsing Streams of Streams with `flatMap`

Combining `EventStreams` is where things really start to get interesting with Bacon.js. Take, for example, our desire to create a single stream of events representing all messages sent in our system. We've got `connections`, an `EventStream` with one event per Socket.IO connection. Using `Bacon.fromBinder`, we already know how to create a stream of each connection's messages - but how can we collapse them down into a single, application-level event stream? With `Observable#flatMap`, naturally.

```js
var messages = connections.flatMap(function(skt) {
  return Bacon.fromBinder(function(sink) {
    skt.on('message', function(msg) {
      sink([skt, msg]);
    });
  });
});
```

I'll try to diagram out what's happening here, starting with the `connections` stream:

```
connections: socket1 --> socket2 --> socket3 
```

If each one of those sockets is used to create a new stream (of their messages), we'd have something multi-dimensional, like this:

```
socket1 --> socket2 --> socket3
   |           |           |
   v           v           v
  msg1        msg4        msg3
   |
   v
  msg2
```

Using `flatMap`, and the combiner-function passed to `Socket#on`, we can collapse these events into a single stream, which we call `messages`:

```
messages: [socket1, msg1] --> [socket1, msg2] --> [socket3, msg3] --> [socket2, msg4]
```

Our chat application now has a single event stream containing both the message-text and its originating socket. 

We'll follow the same pattern to create a stream of the log file write-events:

```js
var appends = messages.flatMap(function(packed) {
  var socket = packed[0], msg = packed[1];
  var path = './logs/' + socket.id + '.log';
  return Bacon.fromNodeCallback(fs.appendFile, path, msg + '\n');
});
```

## Making Use of Events ##

Now that we've done the work to define all of these streams, let's plug in some subscribers and start consuming their values.

### Announcing New User-Connections ###

```js
connections.onValue(function(socket) {
  socket.broadcast.emit('message', 'CONN: ' + socket.id);
});
```

For every event coming down the `connections` stream, use its value to broadcast a connection-notification to all other users.

### Greeting a New User ###

```js
greetings.onValues(function(greeting, socket) {
  socket.send(greeting);
});
```

For all greetings (the nexus of a greeting and a connection), use the socket to send a welcome-message to the newly-connected user. Note the usage of `onValues` instead of `onValue` - this will deconstruct the value of an event (assuming an array) into arguments passed to the callback.

### Relaying Messages to All Users ###

```js
messages.onValues(function(socket, message) {
  io.emit('message', '' + socket.id + ': ' + message);
});
```

Pretty straightforward: use the `io` global to rebroadcast a message originating from any socket.

### Logging Each Message ###

Given that the callback passed to `fs.appendFile` is never invoked with a success-value (rather, just an error) - we don't actually need anything from the events in this stream. 

```js
appends.onValue(function() {
  // no op;
});
```

Why do we need to register a subscriber if we're not expecting any values? Bacon.js is a "pull"-style FRP system; until we register a subscriber, no events will pass through our streams. If no events pass through our stream, we won't actually do any logging. Thus, we pass a no-op callback to `onValue`.

### Handling Errors ###


 