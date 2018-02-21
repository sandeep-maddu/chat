var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var MongoClient = require('mongodb').MongoClient;
var events = require('events');
var eventEmitter = new events.EventEmitter();

var numUsers=0;

io.on('connection', function(socket) {


  console.log('a user has connected');

  socket.on('join', function(name) {
    socket.username = name;
    numUsers++;
    console.log('numUsers: '+ numUsers);

    socket.emit('login', {
      numUsers: numUsers
    });

    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });

  })

    socket.on('disconnect', function () {

        --numUsers;


        socket.broadcast.emit('user left', {
          username: socket.username,
          numUsers: numUsers
        });

  });



  socket.on('chat_message', function(msg){
    var username = socket.username;
    socket.broadcast.emit('chat_message', username + ":" + msg);
    eventEmitter.emit('store', {username: username, message: msg});
  });


  socket.on('disconnect', function(){
    console.log('user disconnected');
});

socket.on('typingMessage', function(){
  var username = socket.username;
  socket.broadcast.emit('typingMessage', {user:username});
});

socket.on('noLongerTypingMessage', function(){
  var username = socket.username;
  socket.broadcast.emit('noLongerTypingMessage', {user:username});
});

  })


eventEmitter.on('store', function(data) {

  var message = {username: data.username, message:data.message};


  MongoClient.connect('mongodb://localhost', function (err, client) {
  if (err) throw err;

  var db = client.db('chat');

  db.collection('messages').insert(message, function (findErr, result) {
    if (findErr) throw findErr;
    console.log(result);
    client.close();
  });
});

});

app.get('/', function(req,res) {
  res.sendFile(__dirname + '/index.html');
});

server.listen(3000, function(err) {
  console.log('Listening on port 3000');
});
