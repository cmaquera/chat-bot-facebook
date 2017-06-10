'use strict'	//Strict use of the programming language 

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()


var watson = require('watson-developer-cloud');

var conversation = watson.conversation({
  username: '635a667c-eb5f-4840-9c25-d1e47efb07fb',
  password: 'HDQ6cYCmtXMr',
  version: 'v1',
  version_date: '2017-05-26'
});

// Replace with the context obtained from the initial request
var context = {};

const token = process.env.FB_VERIFY_TOKEN
const access = process.env.FB_ACCESS_TOKEN

//Instance the port at listen the server
app.set('port', (process.env.PORT || 5000))

//Process aplication encode the url
app.use(bodyParser.urlencoded({extended: false}))

//Use json on the aplication
app.use(bodyParser.json())

//Defined the index rute
app.get('/', function (req, res){

	res.send('Hello world, I am a Progra Bot ')
})

//for facebook verification
app.get('/webhook/', function(req, res){
	
	//Check the token of Facebook
	if(req.query['hub.verify_token'] === token){
		//Send the Challenge
		res.send(req.query['hub.challenge'])
	}
	//Send the message of Error
	res.send('Error, wrong token')
})

app.post('/webhook', function (req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200);
  }
});
  
function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message.text;
  var messageAttachments = message.attachments;
  
  
  
  if (messageText) {

    // If we receive a text message, check to see if it matches a keyword
    // and send back the example. Otherwise, just echo the text we received.
    switch (messageText) {
      case 'generic':
        sendGenericMessage(senderID);
        break;
      case 'location':
        sendLocationMessage(senderID);
        break;
      case 'pick':
        sendOptionsMessage(senderID);
        break;

      default: {
        Message(messageId);
      }
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}

function Message(data){
  conversation.message({
    workspace_id: 'edd8747e-9441-4808-8793-b4f9dec77095',
    input: {'text': data},
    context: context
  },  function(err, response) {
    if (err)
      console.log('error:', err);
    else
      console.log(JSON.stringify(response, null, 2));
      sendTextMessage(senderID, JSON.stringify(response, null, 2));
  });
}

function sendGenericMessage(recipientId, messageText) {
  // To be expanded in later sections
  
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "rift",
            subtitle: "Next-generation virtual reality",
            item_url: "https://www.oculus.com/en-us/rift/",               
            image_url: "http://messengerdemo.parseapp.com/img/rift.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/rift/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for first bubble",
            }],
          }, {
            title: "touch",
            subtitle: "Your Hands, Now in VR",
            item_url: "https://www.oculus.com/en-us/touch/",               
            image_url: "http://messengerdemo.parseapp.com/img/touch.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/touch/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for second bubble",
            }]
          }]
        }	
      }
    }
  };  

  callSendAPI(messageData);
  
}

function sendLocationMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: "Please share your location:",
      quick_replies: [
        {
          content_type : "location"
        }
      ]
    }
  };

  callSendAPI(messageData);
}

function sendOptionsMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: "Pick a color: ",
      quick_replies: [
        {
          content_type: "text",
          title: "Red",
          payload: "PICK_RED"
        },
        {
          content_type: "text",
          title: "Green",
          payload: "PICK_GREEN"
        }
      ]
    }
  };

  callSendAPI(messageData);
}


function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: access },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });  
}



//Spin up the server
app.listen(app.get('port'), function(){
	//Show the message
	console.log('Running on port localhost', app.get('port'))
})
