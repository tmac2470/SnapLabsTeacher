/*
 * CordovaHTTP get test to load a local file
 * this file is local at this stage so no test for remote access
 */
loadExpConfig = function() 
{
		cordovaHTTP.get(
		"http://www.cs.usyd.edu.au/~tmac2470/expConfig.json",  
		function(response)  // on success
		{
			try{  // is the resource well-formed?
				var json = JSON.parse(response.data); 
			}
			catch (ex){   
				// Invalid JSON, notify of the failure...
				alert('Could not parse json, aborting...');
				console.log(response.data)
			} 
			if (json){ 
				//Set html values based on Config file
				if('experimentConfig' in json)
					experimentConfiguration(json.experimentConfig);
				else
					alert('Malformed json...');
				//document.getElementById("demo2").innerHTML = json.experimentConfig.labTitle;
			}
		}, 
		function(response)   // on error
		{
			console.log(JSON.stringify(response));
		});
}


/*
 * experimetConfiguration 
 * Change app layout based on input from COnfig file
 */
experimentConfiguration = function(data) 
{
	//var expFrame = document.getElementById('experiment').contentWindow.document;
	//expFrame.open();
	//document.getElementById('experiment').style.display = "block";
	var experiment = document.getElementById('experiment')
    
	//Set Title of experiment
	if('labTitle' in data){
		document.getElementById("labTitle").innerHTML = data.labTitle;
	}else{
		document.getElementById("labTitle").innerHTML = "Default Experiment Title";
	}
	
	// Display the SensorTags according to the configfle
	for(id in data.sensorTags){
		var sensorTagData = data.sensorTags[id];
		
		// Add each SensorTag name and a connect button for each
		experiment.innerHTML += "<h2 id=\"sensorTagLabel"+id+"\"> "+sensorTagData.title+" </h2>";
		experiment.innerHTML += "<p><button onclick=\"connect"+id+"()\" class=\"green\"> Connect "+sensorTagData.title+"	</button></p>";
		experiment.innerHTML += "<p><strong>Status "+id+":</strong> <span id=\"StatusData"+id+"\">Press to connect</span></p>";

	   //Testing alternative config format
		for(sensor in sensorTagData.sensors){
			var sensorProps = sensorTagData.sensors[sensor]
			
			//Set up each div for the sensors
			experiment.innerHTML += "<div id=\""+sensor+id+"\"><h2 id=\""+sensor+"Label"+id+"\">" + sensorProps.label +"</h2><p><span id=\""+sensor+"Data"+id+"\"> Waiting for value </span><p></div>";
			
			
			// Use default label in case 
			document.getElementById(sensor+"Label"+id).innerHTML = sensorProps.label=="" ? sensor+ " " +id : sensorProps.label;
			
			//Hide the div if required
			document.getElementById(sensor+id).style.display = sensorProps.display==1 ? "block" : "none";
		}
	
	/* Working with old config format
		for(sensor in sensorTagData.sensors){
			//Set up each div for the sensors
			experiment.innerHTML += "<div id=\""+sensor+id+"\"><h2 id="+sensor+"Label"+id+"\">" + sensor + id +"</h2><p><span id=\""+sensor+"Data"+id+"\"> Waiting for value </span><p></div>";

			//Hide the div if required
			document.getElementById(sensor+id).style.display = sensorTagData.sensors[sensor]==1 ? "block" : "none";
		}
		*/
	}
	
	
	/*Set labels for Temperature
	for(sensor in data.sensorTags){
		var sensorData = data.sensorTags[sensor];
		for(label in sensorData.labels){
			//console.log(label + " and " + sensorData.labels[label]);
			document.getElementById(label).innerHTML = sensorData.labels[label];
		}
	}*/
	
}
