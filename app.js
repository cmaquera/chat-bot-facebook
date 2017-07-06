'use strict'
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
var ConversationV1 = require('watson-developer-cloud/conversation/v1');
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var contexts = [];

const access = 'EAAaZCDsqh7uEBAIveArQUlijgzLnqZCDbVVdm37OI0ejsPjolbcigEmc62oFZClsfTk3dZCNOCBsPZCU76qLWYeAkH1mnJ24MQjZCmolOi7aQQ79CWYRRqZAxuVXFtnrielweI35lou97QEphqfsJoxtm0hVMKSvczt4DpxBESIGwZDZD';
const token = 'comida';

const server = app.listen(process.env.PORT || 5000, () => {
  console.log('Express server listening on localhost port %d in %s mode', server.address().port, app.settings.env);
});

app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] && req.query['hub.verify_token'] === token) {
    res.status(200).send(req.query['hub.challenge']);
  } else {
    res.status(403).end();          
  }  
});


/* Para el manejo de los mensajes */
app.post('/webhook', function (req, res) {
  var data = req.body;
  if (data.object === 'page') {
    data.entry.forEach(function(entry) {
      entry.messaging.forEach(function(event) {
        console.log('DATOS EVENTO ' + JSON.stringify(event));
        if (event.message && event.message.text) {
          getWatson(event);
        } else if(event.postback){
          var e = {
            sender: {
              id: event.sender.id
            },
            message: {
              text: JSON.parse(event.postback.payload).data,
              item: JSON.parse(event.postback.payload).item
            }
          };
          if(JSON.parse(event.postback.payload).data != null){
            receipt(e);
          }
          
          //getWatson(e);
        }
      });
    });
    res.sendStatus(200);
  }
});

function getWatson(event){
  let number = event.sender.id;
  let message = event.message.text;
  
  var context = null;
  var index = 0;
  var contextIndex = 0;
  
  contexts.forEach(function(value){
    console.log('EL MALDITO CONTEXTO : ' + value.from);
    if(value.from == number){
      context =  value.context;
      contextIndex = index;
    }
    index= index + 1;
  });
  
  console.log('Mensaje recibido desde ' + number + ' diciendo ' + message + '');
  
  var conversation = new ConversationV1({
    username: '635a667c-eb5f-4840-9c25-d1e47efb07fb', //'b18b1f19-a42a-4bb0-b3bf-681c87f2da0a',
    password: 'HDQ6cYCmtXMr', //'HtKEFQLsrsIg',
    version_date: ConversationV1.VERSION_DATE_2017_04_21
  });
  
  console.log('Mensaje JSON : ' + JSON.stringify(context));
  console.log('contextos canitidad :' + contexts.length);
  
  conversation.message({
    input: { text: message },
    workspace_id: 'edd8747e-9441-4808-8793-b4f9dec77095', //'e19740a6-0b95-407f-a331-943cf4eafdf7',
    context: context
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
        /*
        var intent = response.intents[0].intent;
        console.log("Intento : " + intent);
        if(intent == "done"){
          contexts.splice(contextIndex, 1);
        }*/
        
        nluAnalizye();
        
        console.log('OUTPUT : ' + response.output.text );
        
        if(response.output.attachment == null){
          console.log("entra aqui primero");
          sendText(number, response.output);
        }else if(response.output.text == "listar whiskies"){
          console.log("entra aqui segundo");
          sendList(number, response.output, 'whiskies');
        }else if(response.output.attachment != null){
          console.log("entra aqui tercero");
          sendAttachment(number, response.output);
        }else {
          //sendError(number);
        }
        
      }
  });
}

function receipt(event){
  console.log(event);
  sendReceipt(event.sender.id, event.message.item);
  console.log("Recibo enviado");
}

function sendText(number, output){
  return request({
          url: 'https://graph.facebook.com/v2.6/me/messages',
          qs: {access_token: access},
          method: 'POST',
          json: {
            recipient: {id: number},
            message: {text: output.text[0]}
          }
        }, function (error, response) {
          if (error) {
              console.log('Error sending message: ', error);
          } else if (response.body.error) {
              console.log('Error: ', response.body.error);
          }
        });
}

function sendError(number, err){
  return request({
          url: 'https://graph.facebook.com/v2.6/me/messages',
          qs: {access_token: access},
          method: 'POST',
          json: {
            recipient: {id: number},
            message: {text: err}
          }
        }, function (error, response) {
          if (error) {
              console.log('Error sending message: ', error);
          } else if (response.body.error) {
              console.log('Error: ', response.body.error);
          }
        });
}

function sendAttachment(number, output){
  var attachment = null;
  alice.get('whiskies', function(er, data) {
    if (er) {
      throw er;
    }
    attachment = data.attachment;
  });
  return request({
          url: 'https://graph.facebook.com/v2.6/me/messages',
          qs: {access_token: access},
          method: 'POST',
          json: {
            recipient: {id: number},
            message: {
              attachment: output.attachment
            }
          }
        }, function (error, response) {
          if (error) {
              console.log('Error sending message: ', error);
          } else if (response.body.error) {
              console.log('Error: ', response.body.error);
          }
        });
  
  
  
  
  
}

function sendReceipt(number, item){
  var timestamp = (new Date().getTime() /1000).toFixed();
  var recipe = {
    attachment:{
      type:"template",
      payload:{
        template_type:"receipt",
        recipient_name: "Cesar Maquera",
        order_number: timestamp,       
        currency: "PEN",
        payment_method: "Imaginary",
        order_url:"https://www.liverpool.com.mx/",
        timestamp: timestamp, 
        elements:[
            {
              title: item.name,
              subtitle: item.description,
              quantity: 1,
              price: item.price,
              currency:"PEN",
              image_url: item.img
            }
        ],
        summary:{
            total_cost: item.price
        }
      }
    }
  };
  
  alice.insert(recipe, timestamp, function(err, body, header) {
    if (err) {
      return console.log('[alice.insert] ', err.message);
    }
    console.log('You have inserted the rabbit.');
    console.log(body);
  });
  
  return request({
          url: 'https://graph.facebook.com/v2.6/me/messages',
          qs: {access_token: access},
          method: 'POST',
          json: {
            recipient: {id: number},
            message: {
              attachment: recipe.attachment
            }
          }
        }, function (error, response) {
          if (error) {
              console.log('Error sending message: ', error);
          } else if (response.body.error) {
              console.log('Error: ', response.body.error);
          }
        });
}

function sendList(number, output, key){
  //var attachment = null;
  alice.get(key, function(er, data) {
    if (er) {
      return sendError(number, "Hubo un error con el servidor, diculpe las moelestias. :(");
    }
    return request({
          url: 'https://graph.facebook.com/v2.6/me/messages',
          qs: {access_token: access},
          method: 'POST',
          json: {
            recipient: {id: number},
            message: {
              attachment: data.attachment
            }
          }
        }, function (error, response) {
          if (error) {
              console.log('Error sending message: ', error);
          } else if (response.body.error) {
              console.log('Error: ', response.body.error);
          }
        });
  });
}

function nluAnalizye(){
}

var Cloudant = require('cloudant');

// Initialize Cloudant with settings from .env
var username = process.env.cloudant_username || "7fd0603a-9fba-4802-bc6c-01f49aa9a859-bluemix";
var password = process.env.cloudant_password || "64331a2fef964ceb4fbcef28ed6e87a733412beb555df96a863708609c037fea";
var cloudant = Cloudant({account:username, password:password});
/*
// Remove any existing database called "alice".
cloudant.db.destroy('alice', function(err) {

  // Create a new "alice" database.
  cloudant.db.create('alice', function() {

    // Specify the database we are going to use (alice)...
    var alice = cloudant.db.use('alice')

    // ...and insert a document in it.
    alice.insert(whiskies, 'whiskies', function(err, body, header) {
      if (err) {
        return console.log('[alice.insert] ', err.message);
      }
      console.log('You have inserted the rabbit.');
      console.log(body);
    });
  });
});
*/

var alice = cloudant.db.use('alice');

var whiskies = {
  attachment: {
      type: "template",
      payload: {
          template_type: "list",
          top_element_style: "compact",
          elements: [
              {
                  title: "Chivas Regal",
                  image_url: "https://ss388.liverpool.com.mx/lg/18913739.jpg",
                  subtitle: "12 años",
                  default_action: {
                      type: "web_url",
                      url: "https://www.liverpool.com.mx/tienda/whisky/cat4370445",
                      messenger_extensions: true,
                      webview_height_ratio: "tall",
                      fallback_url: "https://www.liverpool.com.mx/"
                  },
                  buttons: [
                      {
                          title: "Comprar",
                          type: "postback",
                          payload: JSON.stringify(
                            {
                              data: "chivas regal",
                              item: {
                                key: "whiskies",
                                name: "Chivas Regal",
                                img: "https://ss388.liverpool.com.mx/lg/18913739.jpg",
                                description: "12 años",
                                price: 30
                              }
                            })                      
                      }
                  ]                
              },
              {
                  title: "Jhonnie Walker",
                  image_url: "https://ss388.liverpool.com.mx/lg/48830129.jpg",
                  subtitle: "Red label",
                  default_action: {
                      type: "web_url",
                      url: "https://www.liverpool.com.mx/tienda/whisky/cat4370445",
                      messenger_extensions: true,
                      webview_height_ratio: "tall",
                      fallback_url: "https://www.liverpool.com.mx/"
                  },
                  buttons: [
                      {
                          title: "Comprar",
                          type: "postback",
                          payload: JSON.stringify(
                            {
                              data: "jhonnie walker",
                              item: {
                                key: "whiskies",
                                name: "Jhonnie Walker",
                                img: "https://ss388.liverpool.com.mx/lg/48830129.jpg",
                                description: "18 años",
                                price: 50
                              }
                            })                     
                      }
                  ]                
              },
              {
                  title: "Buchanan's",
                  image_url: "https://ss388.liverpool.com.mx/lg/20699639.jpg",
                  subtitle: "18 años",
                  default_action: {
                      type: "web_url",
                      url: "https://www.liverpool.com.mx/tienda/whisky/cat4370445",
                      messenger_extensions: true,
                      webview_height_ratio: "tall",
                      fallback_url: "https://www.liverpool.com.mx/"
                  },
                  buttons: [
                      {
                          title: "Comprar",
                          type: "postback",
                          payload: JSON.stringify(
                            {
                              data: "buchanan's",
                              item: {
                                key: "whiskies",
                                name: "Buchanan's",
                                img: "https://ss388.liverpool.com.mx/lg/20699639.jpg",
                                description: "18 años",
                                price: 5
                              }
                            })                     
                      }
                  ]                
              },
              {
                  title: "Antiquary",
                  image_url: "https://ss388.liverpool.com.mx/lg/1057674241.jpg",
                  subtitle: "Reino Unido 700Ml",
                  default_action: {
                      type: "web_url",
                      url: "https://www.liverpool.com.mx/tienda/whisky/cat4370445",
                      messenger_extensions: true,
                      webview_height_ratio: "tall",
                      fallback_url: "https://www.liverpool.com.mx/"
                  },
                  buttons: [
                      {
                          title: "Comprar",
                          type: "postback",
                          payload: JSON.stringify(
                            {
                              data: "antiquary",
                              item: {
                                key: "whiskies",
                                name: "Anticuary",
                                img: "https://ss388.liverpool.com.mx/lg/1057674241.jpg",
                                description: "18 años",
                                price: 5
                              }
                            })       
                      }
                  ]                
              }
          ],
          buttons: [
              {
                  title: "Ver màs",
                  type: "web_url",
                  url: "https://www.liverpool.com.mx/tienda/whisky/",
                  messenger_extensions: true,
                  webview_height_ratio: "tall",
                  fallback_url: "https://www.liverpool.com.mx/"
              }
          ]  
      }
  }
}
var recipe = {
  attachment:{
    type:"template",
    payload:{
      template_type:"receipt",
      recipient_name:"Stephane Crozatier",
      order_number:"12345678902",
      currency:"USD",
      payment_method:"Visa 2345",        
      order_url:"https://www.liverpool.com.mx/",
      timestamp:"1428444852", 
      elements:[
          {
            title:"Classic White T-Shirt",
            subtitle:"100% Soft and Luxurious Cotton",
            quantity:2,
            price:50,
            currency:"USD",
            image_url:"https://ss388.liverpool.com.mx/lg/1057674241.jpg"
          }
      ],
      address:{
          street_1:"1 Hacker Way",
          street_2:"",
          city:"Menlo Park",
          postal_code:"94025",
          state:"CA",
          country:"US"
      },
      summary:{
          subtotal:75.00,
          shipping_cost:4.95,
          total_tax:6.19,
          total_cost:56.14
      },
      adjustments:[
          {
            name:"New Customer Discount",
            amount:20
          },
          {
            name:"$10 Off Coupon",
            amount:10
          }
      ]
    }
  }
};

var datos = {
  name: "",
  img: "",
  description: "",
  price: 5
}
