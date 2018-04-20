var socket = io('/dimas_channel');     //change this in your own code!
var message_state = 0;

var GLOBAL_VAR = 13;

function setup(){
  createCanvas(400, 400);
  background(0);
}

function draw(){
  
  console.log(GLOBAL_VAR);

  background(0);
  textSize(20);
  fill(255, 102, 153);

  //a very simple state machine
  if(message_state==0){
    text("Under Construction", 100, 100);
  }
  else if(message_state==1){
    text("Trigger 1", 100, 100);
  }
  else{
    text("Trigger 2", 100, 100);
  }
}

socket.on('trigger_1', function(){
  console.log("trigger 1 listener fired");
  message_state=1;
})

socket.on('trigger_2', function(data){
  console.log("trigger 2 listener fired and said: "+ data.message);
  GLOBAL_VAR = data.value;
  message_state=2;
})