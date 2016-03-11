require! {
  express
  https
  fs
  'force-ssl'
  'request-ip'
}

{MongoClient} = require 'mongodb'

mongourl = process.env.MONGOHQ_URL ? process.env.MONGOLAB_URI ? process.env.MONGOSOUP_URL ? 'mongodb://localhost:27017/default'

app = express()

if process.env.PORT? # on heroku
  app.listen process.env.PORT, '0.0.0.0'
  app.use forceSsl
else if fs.existsSync('/var/ssl_tmi/ssl.key')
  https_options = {
    key: fs.readFileSync('/var/ssl_tmi/ssl.key')
    cert: fs.readFileSync('/var/ssl_tmi/ssl.crt')
    ca: fs.readFileSync('/var/ssl_tmi/intermediate.crt')
    requestCert: false
    rejectUnauthorized: false
  }
  https.createServer(https_options, app).listen(3000, '0.0.0.0')
  app.listen 3001, '0.0.0.0'
  forceSsl.https_port = 3000
  app.use forceSsl
else
  #selfSignedHttps = require 'self-signed-https'
  #selfSignedHttps(app).listen(3000, '0.0.0.0')
  app.listen 3001, '0.0.0.0'
  #forceSsl.https_port = 3000
  #app.use forceSsl

app.use express.static __dirname

#app.use require('body-parser').json()
app.use require('body-parser').text({limit: '1000mb'})

app.post '/addlog', (req, res) ->
  data = req.body
  data = JSON.parse data
  {user} = data
  if not user?
    res.send 'need user param'
    return
  data.ip = req.ip
  addlog user, data, ->
    res.send 'done'

app.post '/addhist', (req, res) ->
  data = req.body
  data = JSON.parse data
  {user} = data
  if not user?
    res.send 'need user param'
    return
  data.ip = req.ip
  addhist user, data, ->
    res.send 'done'

get-mongo-db = (callback) ->
  #MongoClient.connect mongourl, {
  #  auto_reconnect: true
  #  poolSize: 20
  #  socketOtions: {keepAlive: 1}
  #}, (err, db) ->
  MongoClient.connect mongourl, (err, db) ->
    if err
      console.log 'error getting mongodb'
    else
      callback db

get-collection = (collection_name, callback) ->
  get-mongo-db (db) ->
    callback db.collection(collection_name), db

addlog = (user, data, callback) ->
  get-collection "logs_#{user}", (collection, db) ->
    collection.insert data, (err, docs) ->
      if err?
        console.log 'error upon insertion'
        console.log err
      else
        if callback?
          callback()
      db.close()

addhist = (user, data, callback) ->
  get-collection "hist_#{user}", (collection, db) ->
    collection.insert data, (err, docs) ->
      if err?
        console.log 'error upon insertion'
        console.log err
      else
        if callback?
          callback()
      db.close()
