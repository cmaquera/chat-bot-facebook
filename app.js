const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
var ConversationV1 = require('watson-developer-cloud/conversation/v1');
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var contexts = [];

const token = process.env.FB_VERIFY_TOKEN;
const access = process.env.FB_ACCESS_TOKEN;

const server = app.listen(process.env.PORT || 5000, () => {
  console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});

/* Para la validadacoin de facebook */
app.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] && req.query['hub.verify_token'] === 'tuxedo_cat') {
    res.status(200).send(req.query['hub.challenge']);
  } else {
    res.status(403).end();
  }
});

/* Para el manejo de los mensajes */
app.post('/webhook', (req, res) => {
  console.log(req.body);
  if (req.body.object === 'page') {
    req.body.entry.forEach((entry) => {
      entry.messaging.forEach((event) => {
        if (event.message && event.message.text) {
          getWatson(event);
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
    index++;
  });
  
  console.log('Mensaje recivido desde ' + number + ' diciendo ' + message + '');
  
  var conversation = new ConversationV1({
    username: 'b18b1f19-a42a-4bb0-b3bf-681c87f2da0a',
    password: 'HtKEFQLsrsIg',
    version_date: ConversationV1.VERSION_DATE_2017_04_21
  });
  
  console.log(JSON.stringify(context));
  console.log(contexts.length);
  
  conversation.message({
    input: { text: message },
    workspace_id: 'dc5c4ab9-f699-4590-8bdf-b5ca1a15cc9a'
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
        console.log(intent);
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
