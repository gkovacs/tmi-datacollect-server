// Generated by LiveScript 1.4.0
(function(){
  var express, https, fs, forceSsl, requestIp, MongoClient, mongourl, ref$, app, https_options, getMongoDb, getCollection, addlog, addhist;
  express = require('express');
  https = require('https');
  fs = require('fs');
  forceSsl = require('force-ssl');
  requestIp = require('request-ip');
  MongoClient = require('mongodb').MongoClient;
  mongourl = (ref$ = process.env.MONGOHQ_URL) != null
    ? ref$
    : (ref$ = process.env.MONGOLAB_URI) != null
      ? ref$
      : (ref$ = process.env.MONGOSOUP_URL) != null ? ref$ : 'mongodb://localhost:27017/default';
  app = express();
  if (process.env.PORT != null) {
    app.listen(process.env.PORT, '0.0.0.0');
    app.use(forceSsl);
  } else if (fs.existsSync('/var/ssl_tmi/ssl.key')) {
    https_options = {
      key: fs.readFileSync('/var/ssl_tmi/ssl.key'),
      cert: fs.readFileSync('/var/ssl_tmi/ssl.crt'),
      ca: fs.readFileSync('/var/ssl_tmi/intermediate.crt'),
      requestCert: false,
      rejectUnauthorized: false
    };
    https.createServer(https_options, app).listen(3000, '0.0.0.0');
    app.listen(3001, '0.0.0.0');
    forceSsl.https_port = 3000;
    app.use(forceSsl);
  } else {
    app.listen(3001, '0.0.0.0');
  }
  app.use(express['static'](__dirname));
  app.use(require('body-parser').text({
    limit: '1000mb'
  }));
  app.post('/addlog', function(req, res){
    var data, user;
    data = req.body;
    data = JSON.parse(data);
    user = data.user;
    if (user == null) {
      res.send('need user param');
      return;
    }
    data.ip = req.ip;
    return addlog(user, data, function(){
      return res.send('done');
    });
  });
  app.post('/addhist', function(req, res){
    var data, user;
    data = req.body;
    data = JSON.parse(data);
    user = data.user;
    if (user == null) {
      res.send('need user param');
      return;
    }
    data.ip = req.ip;
    return addhist(user, data, function(){
      return res.send('done');
    });
  });
  getMongoDb = function(callback){
    return MongoClient.connect(mongourl, function(err, db){
      if (err) {
        return console.log('error getting mongodb');
      } else {
        return callback(db);
      }
    });
  };
  getCollection = function(collection_name, callback){
    return getMongoDb(function(db){
      return callback(db.collection(collection_name), db);
    });
  };
  addlog = function(user, data, callback){
    return getCollection("logs_" + user, function(collection, db){
      return collection.insert(data, function(err, docs){
        if (err != null) {
          console.log('error upon insertion');
          console.log(err);
        } else {
          if (callback != null) {
            callback();
          }
        }
        return db.close();
      });
    });
  };
  addhist = function(user, data, callback){
    return getCollection("hist_" + user, function(collection, db){
      return collection.insert(data, function(err, docs){
        if (err != null) {
          console.log('error upon insertion');
          console.log(err);
        } else {
          if (callback != null) {
            callback();
          }
        }
        return db.close();
      });
    });
  };
}).call(this);
