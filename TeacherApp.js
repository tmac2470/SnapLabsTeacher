// Application object.
var teacherApp = {};

var sensortagMappingData
//var expConfigURL = "http://www.cs.usyd.edu.au/~tmac2470/expConfig.json"
//var expConfigURLJSONP = "https://s3-ap-northeast-1.amazonaws.com/nerldconfigs/expConfig.jsonp";
//var sensontagConfigURLJSONP = "https://s3-ap-northeast-1.amazonaws.com/nerldconfigs/sensortagConfig.jsonp";
//var testConfigURLJSONP = "https://s3-ap-northeast-1.amazonaws.com/nerldconfigs/testConfig.jsonp";
//var uploadPath = "https://s3-ap-northeast-1.amazonaws.com/nerldconfigs/testConfig.jsonp";

var localPath = '10.17.43.1:8080';
var serverroot;
var jsonFormat;
var workingDir; 		//Directory Entry for configuration files

// Experiment COnfiguration File 
var expConfigFileName = "expConfig.jsonp"
var tempFileName = "tempConfigFile.jsonp";
var tempFile; 			// Temporary Config File (FileEntry)
var tempFileWriter; 	// Filewriter for the temporary file


// SensorTag Configuration File 
var sensorConfigFileName = "sensorTagConfig.json";
var newDirectoryName = "TeacherAppConfigFiles";
var sensorFile; 			// Sensortag Config File (FileEntry)
var sensorFileWriter; 	// Filewriter for the sensortag config file

/*
 * OnDevice ready requirements
 * Can now use API - starting server, writing files etc
 */
function onDeviceReady() {
	
	// Get the File system for writing the experiment configuration file
	//window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function(dir) {
	window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory, function(dir) {
		 dir.getDirectory(newDirectoryName, { create: true }, function (dirEntry) {
			// Setting up the files and directories
			workingDir = dirEntry;
			//console.log('DEBUG - File system open: ' + dir.fullPath);
			var isAppend = false;
			
			createFile(dirEntry, tempFileName, false);
			createSensorFile(dirEntry, sensorConfigFileName, false);
			
		 }, errorHandler); 
	}, errorHandler);	

	
	httpd = ( cordova && cordova.plugins && cordova.plugins.CorHttpd ) ? cordova.plugins.CorHttpd : null;
	//Stop server first
	stopServer();
	
	// Start the server at the data directory. 
	serverroot = cordova.file.externalDataDirectory.replace( 'file://', '' );
	startServer(serverroot + newDirectoryName);

}


/*
 * Creating a file
 * (Based https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-file/index.html)
 */
function createFile(dirEntry, fileName, isAppend) {
    // Creates a new file or returns the file if it already exists.
    dirEntry.getFile(fileName, {create: true, exclusive: false}, function(fileEntry) {
        writeTextToFile(fileEntry, null, isAppend);
		tempFile = fileEntry;
    }, errorHandler);

}	

/*
 * Creating a file
 * (Based https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-file/index.html)
 */
function createSensorFile(dirEntry, fileName, isAppend) {
    // Creates a new file or returns the file if it already exists.
    dirEntry.getFile(fileName, {create: true, exclusive: false}, function(fileEntry) {
		//Dont write - empty file if it doesn't exist
		//var stringConf = "{\"sensortagMapping\": {	\"institution\": \"Mt Sinai College\",  \"owner\": \"Tania Machet\",  \"sensortags\": { \"85a6bf0048b000\" : \"SensorTag Number 1\", 	\"36E83684-033A-50E7-668D-1DB03700181E\" : \"SensorTag 2\",	\"85a6bf0048b4b0\" : \"SensorTag 3\" 	}	} }  "
        //writeTextToFile(fileEntry, stringConf, isAppend);  
		sensorFile = fileEntry;
		viewSensorTagConfigFile();
    }, errorHandler); 

}	
/*
 * Writing text string to a file
 * (Based https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-file/index.html)
 */
function writeTextToFile(fileEntry, dataString, isAppend) {
    // Create a FileWriter object for our FileEntry (log.txt).
    fileEntry.createWriter(function (fileWriter) {


        fileWriter.onwriteend = function() {
            //console.log("DEBUG - Successful file write (writeTextToFile) ...");
            readFile(fileEntry);
        };

        fileWriter.onerror = function (e) {
            console.log("Failed file write (writeTextToFile): " + e.toString());
        };

        // If we are appending data to file, go to the end of the file.
        if (isAppend) {
            try {
                fileWriter.seek(fileWriter.length);
            }
            catch (e) {
                console.log("file doesn't exist!");
            }
        }
		tempFileWriter = fileWriter;
		var blob = new Blob([dataString], {type:'text/plain'});
        fileWriter.write(blob);
    });
}


/*
 * Writing text string to a file
 * (Based https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-file/index.html)
 */
function writeTextToFileAndCopy(fileEntry, dataString, isAppend, oldFileName, newFileName) {
    // Create a FileWriter object for our FileEntry (log.txt).
    fileEntry.createWriter(function (fileWriter) {

        fileWriter.onwriteend = function() {
            //console.log("DEBUG - Successful file write (writeTextToFileAndCopy)...");
			//console.log("DEBUG - Starting to rename from " + oldFileName + " to " + newFileName)
			copyFile(workingDir, oldFileName, newFileName);            
        };
        fileWriter.onerror = function (e) {
            console.log("Failed file write: " + e.toString());
        };

        // If we are appending data to file, go to the end of the file.
        if (isAppend) {
            try {
                fileWriter.seek(fileWriter.length);
            }
            catch (e) {
                console.log("file doesn't exist!");
            }
        }
		tempFileWriter = fileWriter;
		var blob = new Blob([dataString], {type:'text/plain'});
        fileWriter.write(blob);
    });
}
/* 
 * Writing one file to another
 * (Based https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-file/index.html)
 */
function writeFileToFile(fileEntry, fileData) {
    // Create a FileWriter object for our FileEntry (log.txt).
    fileEntry.createWriter(function (fileWriter) {

        fileWriter.onwriteend = function() {
            console.log("Successful file write from file ...");
            readFile(fileEntry);
        };

        fileWriter.onerror = function (e) {
            console.log("Failed file write from file: " + e.toString());
        };

        fileWriter.write(fileData);
    });
}

/*
 * Reading a file
 * (Based https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-file/index.html)
 */

function readFile(fileEntry) {

    fileEntry.file(function (file) {
        var reader = new FileReader();

        reader.onloadend = function(evt) {
            //console.log("DEBUG - Successful file read: " + this.result);
            console.log(evt.target.result);
        };

        reader.readAsText(file);

    }, errorHandler);
}

/*
 * Functions to list files in a directory
 * (Based on http://www.html5rocks.com/en/tutorials/file/filesystem/#toc-file)
 */

function toArray(list) {
  return Array.prototype.slice.call(list || [], 0);
}

function listResults(entries) {
  // Document fragments can improve performance since they're only appended
  // to the DOM once. Only one browser reflow occurs.
  var fragment = document.createDocumentFragment();

  entries.forEach(function(entry, i) {
    var img = entry.isDirectory ? '<img src="folder-icon.gif">' :
                                  '<img src="file-icon.gif">';
    var li = document.createElement('li');
    li.innerHTML = [img, '<span>', entry.name, '</span>'].join('');
    fragment.appendChild(li);
  });

  document.querySelector('#filelist').appendChild(fragment);
}

listConfigFiles = function(viewID)
{
	console.log("DEBUG - View ID is " + viewID)
	document.getElementById(viewID).innerHTML="";
	getFileList(workingDir, viewID, listConfigFilesResults);
}


function getFileList(dir, viewID, callback) {
  var dirReader = dir.createReader();
  var entries = [];
  console.log("DEBUG - getting file list for: " + dir.fullPath + " to put in " + viewID)

  // Call the reader.readEntries() until no more results are returned.
  var readEntries = function() {
     dirReader.readEntries (function(results) {
      if (!results.length) {
        callback(entries.sort(), viewID);
      } else {
        entries = entries.concat(toArray(results));
        readEntries();
      }
    }, errorHandler);
  };

  readEntries(); // Start reading dirs.
}

function listConfigFilesResults(entries, viewID) {
  // Document fragments can improve performance since they're only appended
  // to the DOM once. Only one browser reflow occurs.
  //var fragment = document.createDocumentFragment();

  entries.forEach(function(entry, i) {
    //var li = document.createElement('li');
    //li.innerHTML = ['<a class=" ui-icon-grid" onclick="loadExpConfig()">', entry.name, '</a>'].join('');
	var li = "<li><a onclick='socialShareFile(\"" + entry.fullPath +"\")'> " + entry.name + "</a> </li>"
    document.getElementById(viewID).innerHTML += li;
  }); 
}

/*
 * Social Sharing plugin uses the following finctions
 * Based on  https://github.com/EddyVerbruggen/SocialSharing-PhoneGap-Plugin
 */
 
var onSuccess = function(result) {
  console.log("Share completed? " + result.completed); // On Android apps mostly return false even while it's true
  console.log("Shared to app: " + result.app); // On Android result.app is currently empty. On iOS it's empty when sharing is cancelled (result.completed=false)
}

var onError = function(msg) { 
  console.log("Sharing failed with message: " + msg);
}

var socialShareFile = function(fileShare) {
	//var fileName = "file://file" + fileShare
	//var fileName = filePath
	fileName = window.cordova.file.externalDataDirectory + fileShare
	console.log("DEBUG - social sharing " + fileName)

	window.plugins.socialsharing.shareViaEmail(
		'Please find attached the configuration file for Teacher App', // can contain HTML tags, but support on Android is rather limited:  http://stackoverflow.com/questions/15136480/how-to-send-html-content-with-image-through-android-default-email-client
		'Configuration File from Teacher App',
		['taniaNerld@gmail.com'], // TO: must be null or an array
		['taniamachet@gmail.com'], // CC: must be null or an array
		null, // BCC: must be null or an array
		[fileName], // FILES: can be null, a string, or an array
		onSuccess, // called when sharing worked, but also when the user cancelled sharing via email. On iOS, the callbacks' boolean result parameter is true when sharing worked, false if cancelled. On Android, this parameter is always true so it can't be used). See section "Notes about the successCallback" below.
		onError // called when sh*t hits the fan
	);
} 
 
/*
 * Read the SensorTag Configuration file
 */
function readSensorTagConfigFile(callback, newData) {
	sensorFile.file(function(file) {
		var reader = new FileReader();

		reader.onloadend = function(e) {
			
			try{  // is the resource well-formed?
				var json = JSON.parse(this.result); 
			}
			catch (ex){   
				// Invalid JSON, notify of the failure...
				alert('Could not parse the SensorTag configuration File.  Please create a new one.');
				showElementView('overwriteSensortagConfigFile');
				console.log(this.result)
			} 
			if (json){ 
				//Set html values based on Config file
				if('sensortagMapping' in json)
				{	
					//console.log("DEBUG - " + JSON.stringify(json))
					sensortagMappingData = json;
					callback(sensortagMappingData, newData)
				}
				else {
					alert('Could not parse the SensorTag configuration File.  Please create a new one.');
					showElementView('overwriteSensortagConfigFile');
					console.log(this.result)
				}
				//document.getElementById("demo2").innerHTML = json.experimentConfig.labTitle;
			}
		};
		reader.readAsText(file);
	}, errorHandler);


}

/*
 * Output the SensorTag Configuration file
 */
function viewSensorTagConfigFile() {
	readSensorTagConfigFile(showSensorTagConfigFile);
}

/*
 * Create a new SensorTag Configuration file
 */
function newSensorTagConfigFile() {
	// overwrite existing file
	
	var dataObjTemp = $('#newSensorTagConfigForm').serializeJSON();
	
	var data = {}
	data.sensortagMapping = {}
	data.sensortagMapping.institution = dataObjTemp.institution 
	data.sensortagMapping.owner = dataObjTemp.owner
	data.sensortagMapping.sensortags = {};
	console.log("DEBUG - new file string is:" + JSON.stringify(data))
    writeTextToFile(sensorFile, JSON.stringify(data), false);
}
/*
 * Show the SensorTag Configuration file view
 */
function showSensorTagConfigFile(fileData) {
	
	var sensorData = fileData.sensortagMapping;
	var fileOutput = document.getElementById('sensortagConfigFileData');
	fileOutput.innerHTML = "<h1>Current SensorTag Configuration Information:</h1>"; 
	fileOutput.innerHTML += "<b>Institution: </b>" + sensorData.institution + "<br />"; 
	fileOutput.innerHTML += "<b>Owner: </b>" + sensorData.owner + "<br /><br />"; 
	for(sensor in sensorData.sensortags){
		fileOutput.innerHTML += sensorData.sensortags[sensor] + " : " + sensor + "<br />"; 
	}
}

/* 
 * Hide the SensorTag Configuration file
 */
function hideSensorTagConfigFile() {
	// Hide the file data 
	document.getElementById('sensortagConfigFileData').innerHTML = ''
	//Change the buttons to show the file
}

/*
 * Toggle element view
 */
function toggleElementView(el) {
	var current = document.getElementById(el).style.display
	document.getElementById(el).style.display = current==="none" ? "block" : "none";
}


/*
 * Show element view
 */
function showElementView(el) {
	document.getElementById(el).style.display = "block";
}

/*
 * Hide element view
 */
function hideElementView(el) {
	document.getElementById(el).style.display = "none";
}

/*
 * Update the SensorTag configuration file with a new Sensor Name
 */ 
function updateSensorTagConfigFileSensors(sensorData, newData) {
	console.log("DEBUG - Updating file with new Sensortag " + JSON.stringify(newData) )
	if(newData.systemID in sensorData.sensortagMapping.sensortags)
	{
		console.log("Debug - changing name for " +sensorData.sensortagMapping.sensortags[newData.systemID] + " to " + newData.name)
		sensorData.sensortagMapping.sensortags[newData.systemID] = newData.name; 
        writeTextToFile(sensorFile, JSON.stringify(sensorData), false);
		alert("Sensortag name updated to " + newData.name + ".\nPlease mark the SensorTag with this name")
	}else
	{
		console.log("DEBUG - adding sensorTag to file")
		sensorData.sensortagMapping.sensortags[newData.systemID] = newData.name; 
        writeTextToFile(sensorFile, JSON.stringify(sensorData), false);
		alert("Sensortag is now named " + newData.name + ".\nPlease mark the SensorTag with this name")
	}
}
  

/*
 * Get data from the form to update the SensorTag configuration file with a new institution and owner
 */
function updateInstitutionOwner() 
{
	var dataObjTemp = $('#sensorTagConfigForm').serializeJSON();
	var newMetadata = {}
	newMetadata.institution = dataObjTemp.institution
	newMetadata.owner = dataObjTemp.owner
	
	readSensorTagConfigFile(updateSensorTagConfigFileMetadata, newMetadata);
}


/*
 *Update the SensorTag configuration file with a new institution and owner
 */
function updateSensorTagConfigFileMetadata(sensorData, newData) {
	console.log("DEBUG - Updating file with new Sensortag " + JSON.stringify(newData) )
	console.log("DEBUG - Original Values " + sensorData.sensortagMapping.institution +" and " + sensorData.sensortagMapping.owner )
	if(newData.institution != "")
	{
		sensorData.sensortagMapping.institution = newData.institution; 
	}
	if(newData.owner != "")
	{
		sensorData.sensortagMapping.owner = newData.owner; 
	}
    writeTextToFile(sensorFile, JSON.stringify(sensorData), false);
	hideElementView("institutionOwnerUpdate");
}

/*
 * Check whether current SysID is in Config File 
 */
function checkForExistingSensortag(sensorData, newSysID)
{
	console.log("DEBUG - looking for " + newSysID)
	if(newSysID in sensorData.sensortagMapping.sensortags)
	{
		alert("This SensorTag already exists in the configuration file. \nSelect DISCONNECT if you would like to connect to a different SensorTag or press a key on the SensorTag to update the configuration file.")
		showElementView('deviceInfo');
	}else{
		alert("You are connecting to a SensorTag. \nOnce connected, press any key on the SensorTag to add it to the configuration file.")
		showElementView('deviceInfo');
	}
}

/*
 * Renaming a file
 * from http://www.html5rocks.com/en/tutorials/file/filesystem/
 */
function rename(cwd, src, newName) {
  cwd.getFile(src, {}, function(fileEntry) {
	console.log("Renaming from " + fileEntry.name + " to " + newName );
    fileEntry.moveTo(cwd, newName);
  }, errorHandler);
}

/*
 * Copying a file
 * from http://www.html5rocks.com/en/tutorials/file/filesystem/
 */
function copyFile(cwd, src, newName) {
  cwd.getFile(src, {}, function(fileEntry) {
    fileEntry.copyTo(cwd, newName);
  }, errorHandler);
}

/*
 * Copying a file to a new directory
 * from http://www.html5rocks.com/en/tutorials/file/filesystem/
 */
function copyDir(cwd, src, dest) {
  cwd.getFile(src, {}, function(fileEntry) {
    cwd.getDirectory(dest, {}, function(dirEntry) {
      fileEntry.copyTo(dirEntry);
    }, errorHandler);

  }, errorHandler);
}

/*
 * Saving a file 
 * from https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-file/index.html
 */
function saveFile(dirEntry, origFile, fileName) {
    dirEntry.getFile(fileName, { create: true, exclusive: false }, function (fileEntry) {
        writeFileToFile(fileEntry, origFile);
    }, errorHandler);
	
}
/*
 * Error Handler for File Handling
 *
 */
function errorHandler(e) {
  var msg = '';

  switch (e.code) {
    case FileError.QUOTA_EXCEEDED_ERR:
      msg = 'QUOTA_EXCEEDED_ERR';
      break;
    case FileError.NOT_FOUND_ERR:
      msg = 'NOT_FOUND_ERR';
      break;
    case FileError.SECURITY_ERR:
      msg = 'SECURITY_ERR';
      break;
    case FileError.INVALID_MODIFICATION_ERR:
      msg = 'INVALID_MODIFICATION_ERR';
      break;
    case FileError.INVALID_STATE_ERR:
      msg = 'INVALID_STATE_ERR';
      break;
    default:
      msg = 'Unknown Error';
      break;
  };

  console.log('Error: ' + msg);
}


/*
 * getConfigFileName 
 * Prompt User for the configuration File Name
 */
getConfigFileName = function(json) 
{
	jsonFormat = json;
	
	navigator.notification.prompt(
		'Please enter the file name for your configuration file',  // message
		onPromptFileName,     // callback to invoke
		'Configuration File Name ', // title
		['Ok','Exit'],             // buttonLabels
		'expConfig.jsonp'                 // defaultText
	);
}

onPromptFileName = function(results) {
	// Set file name to one entered by user
	expConfigFileName = results.input1;
	var dataObjTemp = $('#experimentForm').serializeJSON({checkboxUncheckedValue: "off"});
	console.log("Form data: " + JSON.stringify(dataObjTemp))
	 
	if(results.buttonIndex===1){
		alert("Your configuration " + jsonFormat + " file has been saved to: " + expConfigFileName + ".\n\n Please make a note of this name.");
		$('[type="reset"]').button('enable');
		$('[type="reset"]').button('refresh');
		submitExperimentConfig();
		
	}else{
		alert("No file saved");
	}
		
	
}
 
/*
 * submitExperimentConfig 
 * Display SensorTag Config informaion for each sensortag depending on user selection
 */
submitExperimentConfig = function() 
{
	var openingStr = "callback({\n\"experimentConfig\": \n";
	var closingString = "}} )";
	var openingStrJson = "{\n\"experimentConfig\": \n";
	var closingStringJson = "} ";

	// Get form information from form
	var dataObj = $('form').serializeJSON({checkboxUncheckedValue: "off"});

	var isAppend = false;
	//Write data to the the temporary file and then copy to new file
	if (jsonFormat === "jsonp"){
		writeTextToFileAndCopy(tempFile, openingStr + JSON.stringify(dataObj) + closingString,isAppend, tempFileName, expConfigFileName ); 
	}
	else{
		writeTextToFileAndCopy(tempFile, openingStrJson + JSON.stringify(dataObj) + closingStringJson, isAppend, tempFileName, expConfigFileName ); 
	}
}
 
/*
 * buildSensortagConfigHTML 
 * Display SensorTag Config information for each sensortag build using html strings for each sensor and tag
 */ 
buildSensortagConfigHTML = function(id) 
{
	var sensors = ['Temperature','Humidity','Barometer','Accelerometer','Gyroscope','Magnetometer','Luxometer','Keypress'];
	var config = document.getElementById('sensortag'+id+'List');

	// Clear form
	config.innerHTML = "";
	// Fields for "Display SensorTag" and "Name of SensorTag"
	config.innerHTML +=	"<div data-role='fieldcontain'><label for='addSensortag" +id +"'><strong>Display SensorTag</strong></label><input type='checkbox' data-role='flipswitch' name='sensorTags["+id+"][connect]' id='addSensortag"+id+"'></div>"
	config.innerHTML += "<label for='sensorTags[" +id +"][title]'><strong>Name of SensorTag:</strong></label><input type='text' name='sensorTags[" +id +"][title]' id='sensorTags" +id +"Name' value='Sensortag " + id +"' onfocus='inputFocus(this)' onblur='inputBlur(this)'/>" 


	//onchange='showHideSensortagConfig("+id+")'></div>"

	for(var i=0 ;i<sensors.length;i++){ 
		// Changed to using a temporary string to make this more readable
		var tempString = ""
		// Side by side flip switches
		tempString += "<fieldset class='ui-grid-a'>"
			tempString += "<div class='ui-block-a'>"
				// Flip switch for data display
				tempString += "<label for='sensorTags[" + id + "][sensors][" + sensors[i] + "[display]'>" + sensors[i] + " Data:</label>"
				tempString += "<input  class='sensortag"+id+"' type='checkbox' data-role='flipswitch' name='sensorTags[" +id + "][sensors][" + sensors[i] + "][display]' id='" + sensors[i] + id +"flip' onchange='showHideLabel(\"" + sensors[i] + id + "label\")'>"
			tempString += "</div>"
			tempString += "<div class='ui-block-b'>"
				// Flip switch for graph diplay
				tempString += "<label for='sensorTags[" + id + "][sensors][" + sensors[i] + "[graph]'>" + sensors[i] + " Graph:</label>"
				tempString += "<input  class='sensortag"+id+"' type='checkbox' data-role='flipswitch' name='sensorTags[" +id + "][sensors][" + sensors[i] + "][graph]' id='" + sensors[i] + id +"flipGraph' style='display:none' onchange='showHideLabel(\"" + sensors[i] + id + "labelGraph\")'> "
			tempString += "</div>"
		tempString += "</fieldset>"
		
		// Label for the temperature data
		tempString += "<div id='"+ sensors[i] + id + "label' style='display:none' >" 
			tempString += "<label for='sensorTags[" +id +"][sensors][" + sensors[i] + "][label]'>"  + sensors[i] + " Data Label:</label>"
			tempString += "<input type='text' name='sensorTags[" +id +"][sensors][" + sensors[i] + "][label]' value='' placeholder='"+ sensors[i] + " Label'/>"
		tempString += "</div>"
			
		// Labels for the temperature graph
		tempString += "<div id='"+ sensors[i] + id + "labelGraph' style='display:none' >" 
			// Graph Title
			tempString += "<label for='sensorTags[" +id +"][sensors][" + sensors[i] + "][graphTitle]'>"  + sensors[i] + " Graph Title:</label>"
			tempString += "<input type='text' name='sensorTags[" +id +"][sensors][" + sensors[i] + "][graphTitle]' value='' placeholder='"+ sensors[i] + " Graph Label'/>"
			// Graph x-axis
			tempString += "<label for='sensorTags[" +id +"][sensors][" + sensors[i] + "][graphXAxis]'>"  + sensors[i] + " X Axis Title:</label>"
			tempString += "<input type='text' name='sensorTags[" +id +"][sensors][" + sensors[i] + "][graphXAxis]' value='' placeholder='"+ sensors[i] + " Graph X Axis Label'/>"
			// Graph y-axis
			tempString += "<label for='sensorTags[" +id +"][sensors][" + sensors[i] + "][graphYAxis]'>"  + sensors[i] + " Y Axis Title:</label>"
			tempString += "<input type='text' name='sensorTags[" +id +"][sensors][" + sensors[i] + "][graphYAxis]' value='' placeholder='"+ sensors[i] + " Graph Y Axis Label'/>"
		tempString += "</div>"
		
		
		config.innerHTML += tempString
		//config.innerHTML += "<fieldset class='ui-grid-a'>     <div class='ui-block-a'>     <div  data-role='fieldcontain' ><label for='sensorTags[" + id + "][sensors][" + sensors[i] + "[display]'>" + sensors[i] + " Data:</label><input  class='sensortag"+id+"' type='checkbox' data-role='flipswitch' name='sensorTags[" +id + "][sensors][" + sensors[i] + "][display]' id='" + sensors[i] + id +"flip' onchange='showElementView(\"" + sensors[i] + id + "label\")'>        </div>         </div>     <div class='ui-block-b'><div data-role='fieldcontain' ><label for='sensorTags[" + id + "][sensors][" + sensors[i] + "[graph]'>" + sensors[i] + " Graph:</label><input  class='sensortag"+id+"' type='checkbox' data-role='flipswitch' name='sensorTags[" +id + "][sensors][" + sensors[i] + "][graph]' id='" + sensors[i] + id +"flipGraph' style='display:none' onchange='showElementView(\"" + sensors[i] + id + "label\")'> </div> </div> </fieldset class>" 
		// Fields for each sensor:  field with flip switch to allow sensor graphing 
		//config.innerHTML += "<div class='ui-block-b'><div data-role='fieldcontain' ><label for='sensorTags[" + id + "][sensors][" + sensors[i] + "[graph]'>" + sensors[i] + " Graph:</label><input  class='sensortag"+id+"' type='checkbox' data-role='flipswitch' name='sensorTags[" +id + "][sensors][" + sensors[i] + "][graph]' id='" + sensors[i] + id +"flipGraph' style='display:none' onchange='showElementView(\"" + sensors[i] + id + "label\")'> </div> </div> </fieldset class>" 		

		// Fields for each sensor: hidden field to name sensor 
		//config.innerHTML += "<div data-role='fieldcontain' id='"+ sensors[i] + id + "label' style='display:none' class='ui-hide-label' ><label for='sensorTags[" +id +"][sensors][" + sensors[i] + "][label]'> " + sensors[i] + " Label:</label><input type='text' name='sensorTags[" +id +"][sensors][" + sensors[i] + "][label]' value='' placeholder='"+ sensors[i] + " Label'/></div>"

	}
}

/*
 * showHideSensortagConfig 
 * Display SensorTag Config informaion for each sensortag depending on user selection
 */
showHideSensortagConfig = function(id) 
{
	// element is hidden
	if($("#sensortag" +id + "List").css('display') === 'none'){
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
	if($("#"+labelID).css('display') === 'none'){
		document.getElementById(labelID).style.display = 'block'
	}
	else{
		document.getElementById(labelID).style.display = 'none'
	}
} 

 
/*
 * Dump File Contents
 * 
 */
dumpLocalFile = function() 
{
    $.ajax({
      url: 'http://10.17.43.1:8080/this.test',
      dataType: 'json',
      async: false,
      success: function(response){
			console.log('downloaded...' + response);
		},
		error: function(xhr, textStatus, errorThrown) {
			console.log("Error: " + xhr.responseText)
			console.log(errorThrown);
		}
	});
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

/* 
 * Corhttpd Functions 
 * https://github.com/floatinghotpot/cordova-httpd
 */

function updateStatus() {
	document.getElementById('location').innerHTML = "document.location.href: " + document.location.href;
	if( httpd ) {
	  /* use this function to get status of httpd
	  * if server is up, it will return http://<server's ip>:port/
	  * if server is down, it will return empty string ""
	  */
		httpd.getURL(function(url){
			if(url.length > 0) {
				document.getElementById('url').innerHTML = "The server is up at: <a href='" + url + "' target='_self'>" + url + "</a>";
			} else {
				document.getElementById('url').innerHTML = "The server is down.";
			}
		});
		// call this function to retrieve the local path of the www root dir
		httpd.getLocalPath(function(path){
			document.getElementById('localpath').innerHTML = "<br/>localPath: " + path;
		});
	} else {
		alert('CorHttpd plugin not available/ready.');
	}	
} 

function startServer( wwwroot ) {
	if ( httpd ) {
		// before start, check whether its up or not
		httpd.getURL(function(url){
			if(url.length > 0) {
				document.getElementById('url').innerHTML = "The server is up at: <a href='" + url + "' target='_blank'>" + url + "</a>";
				//document.getElementById('url').innerHTML += "<br>The server root directory is " + wwwroot;
			} else {
				/* wwwroot is the root dir of web server, it can be absolute or relative path
				* if a relative path is given, it will be relative to cordova assets/www/ in APK.
				* "", by default, it will point to cordova assets/www/, it's good to use 'htdocs' for 'www/htdocs'
				* if a absolute path is given, it will access file system.
				* "/", set the root dir as the www root, it maybe a security issue, but very powerful to browse all dir
				*/
				httpd.startServer({
					'www_root' : wwwroot,
					'port' : 8080,
					'localhost_only' : false
				}, function( url ){
				  // if server is up, it will return the url of http://<server ip>:port/
				  // the ip is the active network connection
				  // if no wifi or no cell, "127.0.0.1" will be returned.
				document.getElementById('url').innerHTML = "The server has been started at: <a href='" + url + "' target='_blank'>" + url + "</a>";
				document.getElementById('url').innerHTML += "<br>The server root directory is " + wwwroot;
				}, function( error ){
					document.getElementById('url').innerHTML = 'Failed to start server: ' + error;
				});
			}

		});
	} else {
		alert('CorHttpd plugin not available/ready.');
	}
}
function stopServer() {
	if ( httpd ) {
		// call this API to stop web server
		httpd.stopServer(function(){
			document.getElementById('url').innerHTML = 'server is stopped.';
		},function( error ){
			document.getElementById('url').innerHTML = 'failed to stop server' + error;
		});
	} else {
		alert('CorHttpd plugin not available/ready.');
	}
}

