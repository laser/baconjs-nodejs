baconjs-nodejs
==============

Bacon.js on the Server

WAT
---

Demonstrating usage of Bacon.js on the server. Examples
include:

1. A simple book-searching app
1. A WebSocket-powered chat server

WHY
---

Really, I just wanted to see what it felt like to build a
web application using Express and Bacon.js. I'm probably
doing it wrong, but, whatever.

SETUP
-----

### All Demos

1. install mongo and run it
1. npm install

### Bookstore

1. npm run-script seed-bookstore
1. npm run-script start-bookstore
1. curl http://localhost:3001/books/The%20Hobbit

### Chat

1. npm run-script start-chat
