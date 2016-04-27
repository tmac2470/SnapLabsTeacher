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
	//Set Tirle of experiment
	if('labTitle' in data){
		document.getElementById("labTitle").innerHTML = data.labTitle;
	}else{
		document.getElementById("labTitle").innerHTML = "Default Experiment Title";
	}
	
	//Set labels for Temperature
	for(sensor in data.sensorTags){
		var sensorData = data.sensorTags[sensor];
		for(label in sensorData.labels){
			//console.log(label + " and " + sensorData.labels[label]);
			document.getElementById(label).innerHTML = sensorData.labels[label];
		}
	}
	
}
