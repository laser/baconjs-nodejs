#!/usr/bin/env node

var fs              = require('fs');
var path            = require('path');
var client          = require('mongodb').MongoClient;

var COLLECTION_NAME = 'books';

var seedData = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed_data.json')).toString())

client.connect('mongodb://127.0.0.1:27017/library', function(err, db) {
  db.collection(COLLECTION_NAME).drop(function(err, result) {
    console.log('Dropping original collection...\n');
    db.collection(COLLECTION_NAME).insert(seedData, {w: 1}, function(err, result) {
      console.log('Seed data import successful');
      process.exit();
    });
  });
});
