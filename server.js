//a very very simple server

var express = require('express');
var app = express();

app.use(express.static('public'));

var server = app.listen(process.env.PORT || 8081, function () {
  console.log("Shazam!");
})


var io = require('socket.io')(server);    //http://socket.io/docs/
var name_spaced_com = io.of('/dimas_channel'); //change this name!!!

name_spaced_com.on('connection', function (socket) {
  console.log("Client ID"+socket.id+" connected");

  app.get('/trigger_1', function(request,response){
    // response.json({"status":"success"});
    response.sendStatus(200);
    console.log("trigger 1 pressed");
    name_spaced_com.emit('trigger_1');
  })

  app.get('/trigger_2', function(request,response){
    // response.json({"status":"success"});
    response.sendStatus(200);
    console.log("trigger 2 pressed");
    name_spaced_com.emit('trigger_2', {message:"party at my place!", value: 7});
  })


  socket.on('data-available', function (data) {
    console.log(data);
    name_spaced_com.emit('play-video', { data });

  });

});