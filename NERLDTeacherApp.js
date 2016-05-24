var sensortagMappingData
var expConfigURL = "http://www.cs.usyd.edu.au/~tmac2470/expConfig.json"
var expConfigURLJSONP = "https://s3-ap-northeast-1.amazonaws.com/nerldconfigs/expConfig.jsonp";
var sensontagConfigURLJSONP = "https://s3-ap-northeast-1.amazonaws.com/nerldconfigs/sensortagConfig.jsonp";
var testConfigURLJSONP = "https://s3-ap-northeast-1.amazonaws.com/nerldconfigs/testConfig.jsonp";
var uploadPath = "https://s3-ap-northeast-1.amazonaws.com/nerldconfigs/testConfig.jsonp";


/*
 * buildSensortagConfigHTML 
 * Display SensorTag Config informaion for each sensortag build using html strings for each sensor and tag
 */
buildSensortagConfigHTML = function(id) 
{
	var sensors = ['Temperature','Humidity','Barometer','Accelerometer','Gyroscope','Magnetometer','Luxometer','Keypress'];
	var config = document.getElementById('sensortag'+id+'List');

	config.innerHTML = "";

	config.innerHTML += "<h1> Second SensorTag Configuration</h1> <label for='sensorTag" + id + "Name'><strong>Name of SensorTag:</strong></label><input type='text' name='sensorTag" + id + "Name' id='sensorTags[" +id +"][title]' value=''  />" 
	
	for(var i=0 ;i<sensors.length;i++){
		config.innerHTML += "<div data-role='fieldcontain'><label for='sensorTags[" + id + "][sensors][" + sensors[i] + "[display]'>" + sensors[i] + ":</label><input type='checkbox' data-role='flipswitch' name='sensorTags[" +id + "][sensors]['" + sensors[i] + "][display]' id='" + sensors[i] + id +"flip' onchange='showHideLabel(\"" + sensors[i] + id + "label\")'> </div>" 
		config.innerHTML += "<div data-role='fieldcontain' id='"+ sensors[i] + id + "label' style='display:none' class='ui-hide-label'><label for='sensorTags[" +id +"][sensors][" + sensors[i] + "][label]'> " + sensors[i] + " Label:</label><input type='text' name='sensorTags[" +id +"][sensors][" + sensors[i] + "][label]' value='' placeholder='"+ sensors[i] + " Label'/></div>"
	}
}

/*
 * showHideSensortagConfig 
 * Display SensorTag Config informaion for each sensortag depending on user selection
 */
showHideSensortagConfig = function(id) 
{
	// element is hidden
	if($("#sensortag" +id + "List").css('display') == 'none'){
		document.getElementById("sensortag" +id + "List").style.display = 'block'
		document.getElementById("addSensortag" +id + "Switch").style.background = '#e15a64' //Evothings red
		document.getElementById("addSensortag" +id + "Switch").innerHTML = 'Remove SensorTag' //Evothings red
	}
	else{
		document.getElementById("sensortag" +id + "List").style.display = 'none'
		document.getElementById("addSensortag" +id + "Switch").style.background = '#54dfb3' //Evothings Green 
		document.getElementById("addSensortag" +id + "Switch").innerHTML = 'Add SensorTag' //Evothings red
	}
} 

showHideLabel = function(labelID) 
{
	if($("#"+labelID).css('display') == 'none'){
		document.getElementById(labelID).style.display = 'block'
	}
	else{
		document.getElementById(labelID).style.display = 'none'
	}
} 

/*
 * submitExperimentConfig 
 * Display SensorTag Config informaion for each sensortag depending on user selection
 */
submitExperimentConfig = function() 
{
/*    $.ajax({
        url: testConfigURLJSONP ,
        dataType: "jsonp",
        async: true,
        success: function (result) {
			ajax.parseJSONP(result);
        },
        error: function (request,error) {
			alert('Network error has occurred please try again!');
		}
    });    */
	
	/*$.ajax({
		type: "PUT",
		url: uploadPath,
		dataType: 'jsonp',
		async: false,
		data: JSON.stringify({ "value": value }),
        success: function(response){
			console.log('uploaded...' + response);
		},
		error: function(xhr, textStatus, errorThrown) {
			console.log("Error: " + xhr.responseText)
			console.log(errorThrown);
		}
	});	*/

	/* var dataArray = $('form').serializeArray(),
	len = dataArray.length,
    dataObj = {};
	for (i=0; i<len; i++) {
		dataObj[dataArray[i].name] = dataArray[i].value;
		console.log(dataArray[i].name + ": " +dataArray[i].value) 
	}*/
	var dataObj = $('form').serializeJSON({checkboxUncheckedValue: "off"});
	
	console.log(JSON.stringify(dataObj)); 
	alert(JSON.stringify(dataObj)); 
	
	return true;
}


/*
 * Loading file hosted on AWS S3 as above
 * 
 */
loadExpConfig = function(jsonResponse) 
{
    $.ajax({
            url: expConfigURLJSONP,
            jsonpCallback: "callback",
            cache: false,
            dataType: "jsonp",
            success: function(response){
				if('experimentConfig' in response)
					experimentConfiguration(response.experimentConfig);
				else
					alert('Malformed json...');
				}
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
	
	// Clear experiment data
	experiment.innerHTML = "";
	
	// Display the SensorTags according to the configfle
	for(id in data.sensorTags){
		var sensorTagData = data.sensorTags[id];
		
		//Diplay SensorTag data if configured
		if(sensorTagData.connect=="1"){
 			// Add each SensorTag name and a connect button for each
			experiment.innerHTML += "<p><button onclick=\"connection("+id+")\" class=\"green\" id=\"connectionButton"+id+"\"> Connect to "+sensorTagData.title+"	</button></p>";
			experiment.innerHTML += "<h2 id=\"sensorTagLabel"+id+"\"> "+sensorTagData.title+": <span id=\"SystemID"+id+"\">SensorTag ID</span> </h2>";
			experiment.innerHTML += "<p><strong>Status "+id+":</strong> <span id=\"StatusData"+id+"\">NOT CONNECTED</span></p>";
			//experiment.innerHTML += "<p><strong>Identifier "+id+":</strong> <span id=\"SystemID"+id+"\">SensorTag ID</span></p>";

			console.log("<p><button onclick=\"connection("+id+")\" class=\"green\" id=\"connectionButton"+id+"\"> Connect to "+sensorTagData.title+"	</button></p>")

				for(sensor in sensorTagData.sensors){
				var sensorProps = sensorTagData.sensors[sensor]

				// Use default label in case 
				var sensorLabel = sensorProps.label=="" ? sensor+ " " +id : sensorProps.label;

				//Set up each div for the sensors
				experiment.innerHTML += "<div id=\""+sensor+id+"\" class=\"sensorReadingEntry\"><p><span id=\""+sensor+"Label"+id+"\" class=\"sensorReadingLabel\"><strong>" + sensorLabel +": </strong></span><span id=\""+sensor+"Data"+id+"\" class=\"sensorReadingValue\"> Waiting for value </span></p></div><p>";
				
				//Hide the div if required
				document.getElementById(sensor+id).style.display = sensorProps.display==1 ? "block" : "none";
			}
 		}
	}
}
 
/*
 * CordovaHTTP get test to load a local file
 * Load the sensortag mapping data file
 */
loadSensortagConfig = function() 
{
	$.ajax({
		url: sensontagConfigURLJSONP,
        jsonpCallback: "callback",
        cache: false,
        dataType: "jsonp",
        success: function(response){
			if('sensortagMapping' in response)
			{
				alert('Successfully downloaded configuration file...');
				sensortagMappingData = response.sensortagMapping.sensortags;
			}
			else
				alert('Malformed json...');
		}
    });
	 
}


