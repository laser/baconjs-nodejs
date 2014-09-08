var client = require('mongodb').MongoClient

module.exports = {
  getBookByTitle: function(title, callback) {
    client.connect('mongodb://127.0.0.1:27017/library', function(err, db) {
      db.collection('books').findOne({
        title: title
      }, callback);
    });
  }
}
