baconjs-nodejs
==============

Bacon.js w/Express (Node.js) and MongoDB

WAT
---

A simple web application that returns book information
given a title. Uses MongoDB, Express, and Bacon.js. Simply
issue HTTP requests to /books/:title and, assuming we find
a match, get back some JSON.

WHY
---

Really, I just wanted to see what it felt like to build a
web application using Express and Bacon.js. I'm probably
doing it wrong, but, whatever.

SETUP
-----

1. install mongo and run it
1. npm install
1. npm run-script seed
1. npm start
1. curl http://localhost:3001/books/The%20Hobbit
