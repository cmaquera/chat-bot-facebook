'use strict'
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
var ConversationV1 = require('watson-developer-cloud/conversation/v1');
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var contexts = [];

//const token = process.env.FB_VERIFY_TOKEN;
//const access = process.env.FB_ACCESS_TOKEN;
const access = 'EAAaZCDsqh7uEBAIveArQUlijgzLnqZCDbVVdm37OI0ejsPjolbcigEmc62oFZClsfTk3dZCNOCBsPZCU76qLWYeAkH1mnJ24MQjZCmolOi7aQQ79CWYRRqZAxuVXFtnrielweI35lou97QEphqfsJoxtm0hVMKSvczt4DpxBESIGwZDZD';
const token = 'comida';


const server = app.listen(process.env.PORT || 5000, () => {
  console.log('Express server listening on localhost port %d in %s mode', server.address().port, app.settings.env);
});

/* Para la validadacoin de facebook */
/*app.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] && req.query['hub.verify_token'] === token) {
    res.status(200).send(req.query['hub.challenge']);
  } else {
    res.status(403).end();
  }
});*/

app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === token) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);          
  }  
});


/* Para el manejo de los mensajes */
app.post('/webhook', (req, res) => {
  console.log('body info: ' + req.body);
  if (req.body.object === 'page') {
    req.body.entry.forEach((entry) => {
      entry.messaging.forEach((event) => {
        if (event.message && event.message.text) {
          getWatson(event);
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });
    res.status(200).end();
  }
});

function getWatson(event){
  let number = event.sender.id;
  let message = event.message.text;
  
  var context = null;
  var index = 0;
  var contextIndex = 0;
  
  contexts.forEach(function(value){
    console.log(value.from);
    if(value.from){
      context =  value.context;
      contextIndex = index;
    }
    index= index + 1;
  });
  
  console.log('Mensaje recivido desde ' + number + ' diciendo ' + message + '');
  
  var conversation = new ConversationV1({
    username: 'b18b1f19-a42a-4bb0-b3bf-681c87f2da0a',
    password: 'HtKEFQLsrsIg',
    version_date: ConversationV1.VERSION_DATE_2017_04_21
  });
  
  console.log('Mensaje JSON : ' + JSON.stringify(context));
  console.log('contextos canitidad :' + contexts.length);
  
  conversation.message({
    input: { text: message },
    workspace_id: 'e19740a6-0b95-407f-a331-943cf4eafdf7'
  }, function(err, response) {
      if (err) {
        console.error(err);
      } else {
      console.log(response.output.text[0]);
        if(context == null){
          contexts.push({ 'from' : number, 'context': response.context });
        } else {
          contexts[contextIndex].context = response.context;
        }
        
        var intent = response.intents[0].intent;
        console.log("Intento : " + intent);
        if(intent == "done"){
          contexts.splice(contextIndex, 1);
        }
        
        request({
          url: 'https://graph.facebook.com/v2.6/me/messages',
          qs: {access_token: access},
          method: 'POST',
          json: {
            recipient: {id: number},
            message: {text: response.output.text[0]}
          }
        }, function (error, response) {
          if (error) {
              console.log('Error sending message: ', error);
          } else if (response.body.error) {
              console.log('Error: ', response.body.error);
          }
        });
      }
  });
  
}


/*
function sendMessage(event) {
  let sender = event.sender.id;
  let text = event.message.text;

  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token: access},
    method: 'POST',
    json: {
      recipient: {id: sender},
      message: {text: text}
    }
  }, function (error, response) {
    if (error) {
        console.log('Error sending message: ', error);
    } else if (response.body.error) {
        console.log('Error: ', response.body.error);
    }
  });
}
*/
