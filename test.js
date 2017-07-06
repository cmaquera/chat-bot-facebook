// Endpoint to be call from the client side
app.post( '/api/message', function(req, res) {
  var workspace = process.env.WORKSPACE_ID || '<workspace-id>';
  if ( !workspace || workspace === '<workspace-id>' ) {
    return res.json( {
      'output': {
        'text': 'The app has not been configured with a <b>WORKSPACE_ID</b> environment variable. Please refer to the ' +
        '<a href="https://github.com/watson-developer-cloud/conversation-simple">README</a> documentation on how to set this variable. <br>' +
        'Once a workspace has been defined the intents may be imported from ' +
        '<a href="https://github.com/watson-developer-cloud/conversation-simple/blob/master/training/car_workspace.json">here</a> in order to get a working application.'
      }
    } );
  }
  var payload = {
    workspace_id: workspace,
    context: {},
    input: {}
  };
  var params = null;
  if ( req.body ) {
    if ( req.body.input ) {
      payload.input = req.body.input;
      params = {text: req.body.input.text,features:features};
    }
    if ( req.body.context ) {
      // The client must maintain context/state
      payload.context = req.body.context;
    }
  }

  if(params == null) {
   params = {text: "Some sample input",features:features}
  }

  nlu.analyze(params, function(error, response) {
    if (error) {
      return res.status(error.code || 500).json(error);
    }
    if(response != null) {
      var entities = response.entities;
      var cityList = entities.map(function(entry) {
        if(entry.type == "Location") {
		      if(entry.disambiguation && entry.disambiguation.subtype && entry.disambiguation.subtype.indexOf("City") > -1) {
		        return(entry.text);
		      }
		    }
      });
      
      
	    cityList = cityList.filter(function(entry) {
		    if(entry != null) {
		      return(entry);
		    }
	    });
	    if(cityList.length > 0) {
	      payload.context.appCity = cityList[0];
	    } else {
	      payload.context.appCity = null;
	    }
      var stateList = entities.map(function(entry) {
    		if(entry.type == "Location") {
    		  if(!entry.disambiguation) {
    		    return(entry.text);
    		  }
    		}
      });

  	  stateList = stateList.filter(function(entry) {
    		if(entry != null) {
    		  return(entry);
    		}
  	  });
	  
  	  if (stateList.length > 0) {
  	    payload.context.appST = stateList[0];
  	  } else {
  	    payload.context.appST = null;
  	  }
    } else {
	    if(payload.context.appCity) {
	      payload.context.appCity = null;
	    }
	    if(payload.context.appST) {
	      payload.context.appST = null;
	    }
	    console.log('response from NLU entity extraction is null');
    }
    // Send the input to the conversation service
    conversation.message(payload, function(err, data) {
    if (err) {
      return res.status(err.code || 500).json(err);
    }
      updateResponse(res, data);
    });
  });
});