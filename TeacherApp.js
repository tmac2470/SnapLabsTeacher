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

	
	/* 
	* Start the locally running server for file sharing
	*/
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
		//viewSensorTagConfigFile();
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
            //console.log("Successful file write from file ...");
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

/*
 * Functions to list files in a directory
 * (Based on http://www.html5rocks.com/en/tutorials/file/filesystem/#toc-file)
 */

listConfigFiles = function(viewID, listFunction)
{
	console.log("DEBUG - View ID is " + viewID)
	document.getElementById(viewID).innerHTML="";
	getFileList(workingDir, viewID, listConfigFilesResults, listFunction);
}


function getFileList(dir, viewID, callback, listFunction) {
  var dirReader = dir.createReader();
  var entries = [];
  console.log("DEBUG - getting file list for: " + dir.fullPath + " to put in " + viewID)

  // Call the reader.readEntries() until no more results are returned.
  var readEntries = function() {
     dirReader.readEntries (function(results) {
      if (!results.length) {
        callback(entries.sort(), viewID, listFunction);
      } else {
        entries = entries.concat(toArray(results));
        readEntries();
      }
    }, errorHandler);
  };

  readEntries(); // Start reading dirs.
}

function listConfigFilesResults(entries, viewID, listFunction) {
  // Document fragments can improve performance since they're only appended
  // to the DOM once. Only one browser reflow occurs.
  //var fragment = document.createDocumentFragment();

  entries.forEach(function(entry, i) {
    //var li = document.createElement('li');
    //li.innerHTML = ['<a class=" ui-icon-grid" onclick="loadExpConfig()">', entry.name, '</a>'].join('');
	var li = "<li><a class='ui-btn ui-btn-icon-right ui-icon-carat-r' onclick='"+ listFunction + "(\"" + entry.fullPath +"\")'> " + entry.name + "</a> </li>"
    document.getElementById(viewID).innerHTML += li;
  }); 
}

/*
 * Social Sharing plugin uses the following finctions
 * Based on  https://github.com/EddyVerbruggen/SocialSharing-PhoneGap-Plugin
 */
 
var onSuccess = function(result) {
  console.log("DEBUG - Share completed? " + result.completed); // On Android apps mostly return false even while it's true
  console.log("DEBUG - Shared to app: " + result.app); // On Android result.app is currently empty. On iOS it's empty when sharing is cancelled (result.completed=false)
}

var onError = function(msg) { 
  console.log("Sharing failed with message: " + msg);
}

var socialShareFile = function(fileShare) {
	//var fileName = "file://file" + fileShare
	//var fileName = filePath
	fileName = window.cordova.file.externalDataDirectory + fileShare
	//console.log("DEBUG - social sharing " + fileName)

	window.plugins.socialsharing.shareViaEmail(
		'Please find attached the configuration file for Teacher App', // can contain HTML tags, but support on Android is rather limited:  http://stackoverflow.com/questions/15136480/how-to-send-html-content-with-image-through-android-default-email-client
		'Configuration File from Teacher App',
		null, // TO: must be null or an array
		null, // CC: must be null or an array
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
	return true;
}
/*
 * Show the SensorTag Configuration file view
 */
function showSensorTagConfigFile(fileData) {
	
	var sensorData = fileData.sensortagMapping;
	var fileOutput = document.getElementById('sensortagConfigFileData');
	fileOutput.innerHTML = "<h2>Current SensorTag Configuration Information:</h2>"; 
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
	
	alert("SensorTag Mapping file updated")
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
	//hideElementView("institutionOwnerUpdate");
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
		displayValue("StatusData","SensorTag found in configuration file.")
		//showElementView('deviceInfo');
	}else{
		alert("You are connecting to a SensorTag. \nOnce connected, press any key on the SensorTag to add it to the configuration file.")
		displayValue("StatusData","New SensorTag found (not in configuration file).")
		//showElementView('deviceInfo');
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
		'expConfig.json'                 // defaultText
	);
}

onPromptFileName = function(results) {
	// Set file name to one entered by user
	expConfigFileName = results.input1;
	var dataObjTemp = $('#experimentForm').serializeJSON({checkboxUncheckedValue: "off"});
	console.log("Form data: " + JSON.stringify(dataObjTemp))
	 
	if(results.buttonIndex===1){
		alert("Your configuration " + jsonFormat + " file has been saved to: " + expConfigFileName + ".\n\n Please make a note of this name.");
		$('#experimentFormReset').button('enable');
		$('#experimentFormReset').button('refresh');
		submitExperimentConfig();
		
	}else{
		alert("No file saved");
	}
}
 

/*
 * submitExperimentConfig 
 * Submit the information from the form to the config file to save
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
 * quickDesignConfiguration 
 * Submit information from form, validate and fill out missing information and save
 */
 
quickDesignConfiguration = function(){
	var sensorList = ['Temperature','Humidity','Barometer','Accelerometer','Gyroscope','Magnetometer','Luxometer'];
	var dataObjTemp = $('#quickDesignForm').serializeJSON();
	console.log("DEBUG - Form for quick design is: " + JSON.stringify(dataObjTemp) )
	var newDataObj = dataObjTemp


	// Check if the field exists in the formObject, if not create it and set to default value
	newDataObj.labTitle = dataObjTemp.labTitle || "Investigation"
	var fileName = newDataObj.labTitle.replace(/ /g,'')
	console.log("DEBUG - file name is: " + fileName  + ", before replaced is " +newDataObj.labTitle)

	newDataObj.dataStorageAllowed = dataObjTemp.dataStorageAllowed || "on"
	newDataObj.videoAllowed = dataObjTemp.videoAllowed || "off"
	newDataObj.dataStoragePrefix = dataObjTemp.dataStoragePrefix || fileName
	newDataObj.videoPrefix = dataObjTemp.labTitle || fileName
	newDataObj.graphAutoStart = dataObjTemp.graphAutoStart || "off"

	for (var i=0; i<2; i++)
	{
		newDataObj.sensorTags[i] = dataObjTemp.sensorTags[i] || {};
		newDataObj.sensorTags[i].connect = dataObjTemp.sensorTags[i].connect || "off"
		newDataObj.sensorTags[i].title = dataObjTemp.sensorTags[i].title || "SensorTag"
		newDataObj.sensorTags[i].sensors = dataObjTemp.sensorTags[i].sensors || {}
		for(var j=0 ;j<sensorList.length;j++){
			var sensorName = sensorList[j]
			newDataObj.sensorTags[i].sensors[sensorName] = dataObjTemp.sensorTags[i].sensors[sensorName] || {}
			newDataObj.sensorTags[i].sensors[sensorName].data = dataObjTemp.sensorTags[i].sensors[sensorName].data || {}
			newDataObj.sensorTags[i].sensors[sensorName].data.display = dataObjTemp.sensorTags[i].sensors[sensorName].data.display || "off"
			newDataObj.sensorTags[i].sensors[sensorName].data.label = dataObjTemp.sensorTags[i].sensors[sensorName].data.label || sensorName
			newDataObj.sensorTags[i].sensors[sensorName].graph = dataObjTemp.sensorTags[i].sensors[sensorName].graph || {}
			newDataObj.sensorTags[i].sensors[sensorName].graph.graphdisplay = dataObjTemp.sensorTags[i].sensors[sensorName].graph.graphdisplay || "off"
			newDataObj.sensorTags[i].sensors[sensorName].graph.graphType = dataObjTemp.sensorTags[i].sensors[sensorName].graph.graphType || "spline"
			newDataObj.sensorTags[i].sensors[sensorName].graph.graphTitle = dataObjTemp.sensorTags[i].sensors[sensorName].graph.graphTitle || sensorName + " Graph"
			newDataObj.sensorTags[i].sensors[sensorName].graph.graphXAxis = dataObjTemp.sensorTags[i].sensors[sensorName].graph.graphXAxis || "Time (s)"
			newDataObj.sensorTags[i].sensors[sensorName].graph.graphYAxis = dataObjTemp.sensorTags[i].sensors[sensorName].graph.graphYAxis || sensorName
			newDataObj.sensorTags[i].sensors[sensorName].captureOnClick = dataObjTemp.sensorTags[i].sensors[sensorName].captureOnClick || "off"
			newDataObj.sensorTags[i].sensors[sensorName].grid = dataObjTemp.sensorTags[i].sensors[sensorName].grid || {}
			newDataObj.sensorTags[i].sensors[sensorName].grid.griddisplay = dataObjTemp.sensorTags[i].sensors[sensorName].grid.griddisplay || "off"
			newDataObj.sensorTags[i].sensors[sensorName].grid.columns = dataObjTemp.sensorTags[i].sensors[sensorName].grid.columns || "4"
			newDataObj.sensorTags[i].sensors[sensorName].grid.rows = dataObjTemp.sensorTags[i].sensors[sensorName].grid.rows || "4"
			
			switch (sensorName)
			{
				case "Temperature":
					newDataObj.sensorTags[i].sensors[sensorName].parameters = dataObjTemp.sensorTags[i].sensors[sensorName].parameters || {}
					newDataObj.sensorTags[i].sensors[sensorName].parameters.ambient = dataObjTemp.sensorTags[i].sensors[sensorName].parameters.ambient || "on"
					newDataObj.sensorTags[i].sensors[sensorName].parameters.IR = dataObjTemp.sensorTags[i].sensors[sensorName].parameters.IR || "on"
					break;
				case "Magnetometer":
				case "Accelerometer":
					newDataObj.sensorTags[i].sensors[sensorName].parameters = dataObjTemp.sensorTags[i].sensors[sensorName].parameters || {}
					newDataObj.sensorTags[i].sensors[sensorName].parameters.xyz = dataObjTemp.sensorTags[i].sensors[sensorName].parameters.xyz || "on"
					newDataObj.sensorTags[i].sensors[sensorName].parameters.scalar = dataObjTemp.sensorTags[i].sensors[sensorName].parameters.scalar || "on"
					break;
			}
		}
	}


	alert("Your configuration file has been saved to: " + fileName+".json" + ".\n\n Please make a note of this name.");
	
	submitQuickExperimentConfig(newDataObj, fileName+".json")
	//console.log("DEBUG - After manipulation oject is: " + JSON.stringify(newDataObj) )
}

/*
 * submitQuickExperimentConfig 
 * Submit the information from the form to the config file to save
 */
submitQuickExperimentConfig = function(dataObj, fileName) 
{
	var openingStr = "callback({\n\"experimentConfig\": \n"; 
	var closingString = "}} )";
	var openingStrJson = "{\n\"experimentConfig\": \n";
	var closingStringJson = "} ";

	console.log("DEBUG - written String is: " + openingStrJson + JSON.stringify(dataObj) + closingStringJson )
	
	var isAppend = false;
	//Write data to the the temporary file and then copy to new file
	if (jsonFormat === "jsonp"){
		writeTextToFileAndCopy(tempFile, openingStr + JSON.stringify(dataObj) + closingString,isAppend, tempFileName, fileName ); 
	}
	else{
		writeTextToFileAndCopy(tempFile, openingStrJson + JSON.stringify(dataObj) + closingStringJson, isAppend, tempFileName, fileName ); 
	}
}
 
resetQuickDesign = function()
{
	$('.widgetItem','#canvaspanel').each(function() {
		var itemid = $(this).attr("itemid");
		var sensor = itemid.split("_");
 
		$(this).appendTo("#"+sensor[0]+"_Selection");

		//console.log("DEBUG - looping through widgets. Item id is " + itemid)
	});
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
		tempString += "<hr><p><strong class='sensortitle'>" + sensors[i] + "</strong></p>"
		
		// Data sampling rate 
		// TODO - Adda field for setting sampling rate
		tempString += 	"<div class='ui-field-contain'>"
		tempString +=  		"<label for='sensorTags[" + id + "][sensors][" + sensors[i] + "][sampleinteval]'>Sampling rate:</label>"
		tempString += 		"<select name='sensorTags[" + id + "][sensors][" + sensors[i] + "][sampleinteval]' id='select-native-1'>"
        tempString += 			"<option value='1000'>1 sample per second</option>"
        tempString += 			"<option value='500'>2 samples per second</option>"
        tempString += 			"<option value='250'>4 samples per second</option>"
        tempString += 			"<option value='100'>10 samples per second</option>"
		tempString += 		"</select>"
		tempString += 	"</div>"

		// Additonal parameters depending on sensor
		switch(sensors[i]){
			case "Temperature":
				// Temperature sensor can choose to display ambient and/or IR temp
				tempString += "<fieldset class='ui-grid-a'>"
				tempString += 	"<div class='ui-block-a'>"
				// Flip switch for IR Temperature
				tempString += 		"<label for='sensorTags[" + id + "][sensors][" + sensors[i] + "][parameters][IR]'>Infrared or object temperature:</label>"
				tempString += 		"<input  class='sensortag"+id+"' type='checkbox' data-role='flipswitch' name='sensorTags[" +id + "][sensors][" + sensors[i] + "][parameters][IR]' id='" + sensors[i] + id +"TempIRflip'>"
				tempString += 	"</div>"
				tempString += 	"<div class='ui-block-b'>"
				// Flip switch for ambient Temperature diplay
				tempString += 		"<label for='sensorTags[" + id + "][sensors][" + sensors[i] + "][parameters][ambient]'>Ambient temperature:</label>"
				tempString += 		"<input  class='sensortag"+id+"' type='checkbox' data-role='flipswitch' name='sensorTags[" +id + "][sensors][" + sensors[i] + "][parameters][ambient]' id='" + sensors[i] + id +"TempAmbientflip'>"
				tempString += 	"</div>"
				tempString += "</fieldset>"
				break;
			case "Magnetometer":
			case "Accelerometer":
				// 3 axis sensors can choose to display xyz axis and/or scalar values 
				tempString += "<fieldset class='ui-grid-a'>"
				tempString += 	"<div class='ui-block-a'>"
				// Flip switch for IR Temperature
				tempString += 		"<label for='sensorTags[" + id + "][sensors][" + sensors[i] + "][parameters][xyz]'>x-y-z axis values:</label>"
				tempString += 		"<input  class='sensortag"+id+"' type='checkbox' data-role='flipswitch' name='sensorTags[" +id + "][sensors][" + sensors[i] + "][parameters][xyz]' id='" + sensors[i] + id +"XYZflip'>"
				tempString += 	"</div>"
				tempString += 	"<div class='ui-block-b'>"
				// Flip switch for ambient Temperature diplay
				tempString += 		"<label for='sensorTags[" + id + "][sensors][" + sensors[i] + "][parameters][ambient]'>Scalar:</label>"
				tempString += 		"<input  class='sensortag"+id+"' type='checkbox' data-role='flipswitch' name='sensorTags[" +id + "][sensors][" + sensors[i] + "][parameters][scalar]' id='" + sensors[i] + id +"Scalarflip'>"
				tempString += 	"</div>"
				tempString += "</fieldset>"
				break;
		}

		// Side by side flip switches for display and data options
		// Common to all sensors
		tempString += "<fieldset class='ui-grid-c'>"
			tempString += "<div class='ui-block-a'>"
				// Flip switch for data display
				tempString += "<label for='sensorTags[" + id + "][sensors][" + sensors[i] + "][data][display]'>Data:</label>"
				tempString += "<input  class='sensortag"+id+"' type='checkbox' data-role='flipswitch' name='sensorTags[" +id + "][sensors][" + sensors[i] + "][data][display]' id='" + sensors[i] + id +"flip' onchange='showHideLabel(\"" + sensors[i] + id + "label\")'>"
			tempString += "</div>"
			tempString += "<div class='ui-block-b'>"
				// Flip switch for graph diplay
				tempString += "<label for='sensorTags[" + id + "][sensors][" + sensors[i] + "][graph]'>Graph:</label>"
				tempString += "<input  class='sensortag"+id+"' type='checkbox' data-role='flipswitch' name='sensorTags[" +id + "][sensors][" + sensors[i] + "][graph][graphdisplay]' id='" + sensors[i] + id +"flipGraph' style='display:none' onchange='showHideLabel(\"" + sensors[i] + id + "labelGraph\")'> "
			tempString += "</div>"
			tempString += "<div class='ui-block-c'>" 
				// Flip switch for grid diplay
				tempString += "<label for='sensorTags[" + id + "][sensors][" + sensors[i] + "][grid][griddisplay]'> Grid:</label>"
				tempString += "<input  class='sensortag"+id+"' type='checkbox' data-role='flipswitch' name='sensorTags[" +id + "][sensors][" + sensors[i] + "][grid][griddisplay]' id='" + sensors[i] + id +"flipGrid' style='display:none' onchange='showHideLabel(\"" + sensors[i] + id + "GridConfig\")'> "
			tempString += "</div>"
			tempString += "<div class='ui-block-d'>" 
				// Flip switch for graph diplay
				tempString += "<label for='sensorTags[" + id + "][sensors][" + sensors[i] + "][captureOnClick]'> Capture on Click:</label>"
				tempString += "<input  class='sensortag"+id+"' type='checkbox' data-role='flipswitch' name='sensorTags[" +id + "][sensors][" + sensors[i] + "][captureOnClick]' id='" + sensors[i] + id +"flipCaptureOnClick' style='display:none'> "
			tempString += "</div>"
		tempString += "</fieldset>"
		


		// Label for the  data 
		tempString += "<div id='"+ sensors[i] + id + "label' style='display:none' >" 
			tempString += "<label for='sensorTags[" +id +"][sensors][" + sensors[i] + "][data][label]'>"  + sensors[i] + " Data Label:</label>"
			tempString += "<input type='text' name='sensorTags[" +id +"][sensors][" + sensors[i] + "][data][label]' value='' placeholder='"+ sensors[i] + " Label'/>"
		tempString += "</div>"
			
		// Labels for the graph, graph type 
		tempString += "<div id='"+ sensors[i] + id + "labelGraph' style='display:none' >" 
		// Graph Type
		tempString += "<div class='ui-field-contain'>"
		tempString += 	"<label for='sensorTags[" +id +"][sensors][" + sensors[i] + "][graph][graphType]'>Graph Type:</label>"
		tempString += 	"<select name='sensorTags[" +id +"][sensors][" + sensors[i] + "][graph][graphType]'>"
		tempString +=  		"<option value='spline'>Smoothed Line Graph</option>"
		tempString +=  		"<option value='line'>Line Graph</option>"
		tempString +=  		"<option value='scatter'>Scatter Graph</option>"
		tempString +=  		"<option value='area'>Area Graph</option>"
		tempString += 	"</select>"
		tempString += "</div>"
		// Graph Title
		tempString += "<label for='sensorTags[" +id +"][sensors][" + sensors[i] + "][graph][graphTitle]'>"  + sensors[i] + " Graph Title:</label>"
		tempString += "<input type='text' name='sensorTags[" +id +"][sensors][" + sensors[i] + "][graph][graphTitle]' value='' placeholder='"+ sensors[i] + " Graph Label'/>"
		// Graph x-axis
		tempString += "<label for='sensorTags[" +id +"][sensors][" + sensors[i] + "][graphXAxis]'>"  + sensors[i] + " X Axis Title:</label>"
		tempString += "<input type='text' name='sensorTags[" +id +"][sensors][" + sensors[i] + "][graph][graphXAxis]' value='' placeholder='"+ sensors[i] + " Graph X Axis Label'/>"
		// Graph y-axis
		tempString += "<label for='sensorTags[" +id +"][sensors][" + sensors[i] + "][graph][graphYAxis]'>"  + sensors[i] + " Y Axis Title:</label>"
		tempString += "<input type='text' name='sensorTags[" +id +"][sensors][" + sensors[i] + "][graph][graphYAxis]' value='' placeholder='"+ sensors[i] + " Graph Y Axis Label'/>"
		tempString += "</div>"

		//Configuration for the grid
		tempString += "<div id='"+ sensors[i] + id + "GridConfig' style='display:none' >" 
		tempString += 	"<div class='ui-field-contain'>"
		tempString += 		"<label for='sensorTags[" + id + "][sensors][" + sensors[i] + "][grid][columns]'>Columns:</label>"
		tempString += 			"<select name='sensorTags[" + id + "][sensors][" + sensors[i] + "][grid][columns]'>"
		for(var j=2 ;j<6;j++){ 
			tempString +=		"<option value='" +j +"'>" +j +"</option>"
		}
		tempString += 		"</select>"
		tempString += 	"</div>"
		tempString += 	"<div class='ui-field-contain'>"
		tempString += 		"<label for='sensorTags[" + id + "][sensors][" + sensors[i] + "][grid][rows]'>Rows:</label>"
		tempString += 			"<select name='sensorTags[" + id + "][sensors][" + sensors[i] + "][grid][rows]'>"
		for(var k=1 ;k<11;k++){ 
			tempString +=		"<option value='" +k +"'>" +k +"</option>"
		}
		tempString += 		"</select>"
		tempString += "</div>"
			
		
		config.innerHTML += tempString
	}
}

/*
 * loadExperimentConfigFile 
 * Loads up an experiment config file to edit
 */

loadExperimentConfigFile = function(fileName){
	console.log("DEBUG - loading config for " + fileName)
	$("body").pagecontainer("change", "#pageExperiment");
	
	workingDir.getFile(fileName, {create: false, exclusive: false}, function(fileEntry) {
		fileEntry.file(function(file) {
			var reader = new FileReader();

			reader.onloadend = function(e) {
				//console.log("DEBUG - Data read is: " + this.result);
				var data = JSON.parse(this.result)
				populate("#experimentForm", data.experimentConfig)
				console.log("DEBUG - Data sent is: " + JSON.stringify(data.experimentConfig));
			};
			
			reader.readAsText(file);
		}, errorHandler);
	}, errorHandler);

}

function populate(frm, data) {   
	$.each(data, function(key, value){  
		if(key == "sensorTags")
		{
			for( i=0; i <2; i++)
			{
				$.each(value[i], function(key_i, value_i){  
					//console.log("DEBUG - Looking at element: "+ key_i + " with type " + $ctrl_i.attr("type") + " with value " + value_i)
					if(key_i == "sensors")
					{
						$.each(value_i, function(key_j, value_j){  
							if( typeof value_j === "object")
							{
								$.each(value_j, function(key_k, value_k){  
									if( typeof value_k === "object")
									{
										$.each(value_k, function(key_l, value_l){  
											var $ctrl_l = $('[name="sensorTags['+i+']['+key_i+']['+key_j+']['+key_k+']['+key_l+']"]', frm);   
											//console.log("DEBUG - Looking at element: "+ key_l + " with type " + $ctrl_l.attr("type") + " with value " + value_l)
											//console.log("DEBUG - element is: "+ $ctrl_l.selector)
											popSwitch($ctrl_l, value_l)  
										});
									}
									else
									{
											var $ctrl_k = $('[name="sensorTags['+i+']['+key_i+']['+key_j+']['+key_k+']"]', frm);   
											//console.log("DEBUG - Looking at element: "+ key_k + " with type " + $ctrl_k.attr("type") + " with value " + value_k)
											//console.log("DEBUG - element is: "+ $ctrl_k.selector)
											popSwitch($ctrl_k, value_k)  
									}
								});
							}
							else
							{
								var $ctrl_j = $('[name="sensorTags['+i+']['+key_i+']['+key_j+']"]', frm);   
								//console.log("DEBUG - Looking at element: "+ key_j + " with type " + $ctrl_j.attr("type") + " with value " + value_j)
								//console.log("DEBUG - element is: "+ $ctrl_j.selector)
								popSwitch($ctrl_j, value_j)  
							}
						});
					}
					else
					{
						var $ctrl_i = $('[name="sensorTags['+i+']['+key_i+']"]', frm);   
						popSwitch($ctrl_i, value_i)  
						//console.log("DEBUG - element is: "+ $ctrl_i.selector + " with type " +  $ctrl_i.attr("type") + ", name " + $ctrl_i.attr("name") + " and value " + $ctrl_i.val());
					}
				});
			}
		}
		else
		{
			var $ctrl = $('[name='+key+']', frm);   
			//console.log("DEBUG - Looking at element: "+ key + " with type " + $ctrl.attr("type") + " with value " + value)
			popSwitch($ctrl, value)  
		}
	}); 
 
}
//Internal function for repeated switch statement
function popSwitch($ctrl, value)
{
	switch($ctrl.attr("type"))  
	{  
		case "text" :   
		case "hidden":  
			$ctrl.val(value);   
		break;   
		case "radio" : 
		case "checkbox": 
			//console.log("DEBUG - Before. Value is: " + $ctrl.prop("checked") + " for " + $ctrl.attr("name"))
			if(value == "on") {  
				$ctrl.prop("checked", true ).flipswitch('refresh');
			}
			else {  
				$ctrl.prop("checked", false ).flipswitch('refresh');
			}				
			//console.log("DEBUG - After. Value is: " + $ctrl.val() + " for " + $ctrl.attr("name"))
		break;  
		default:
			$ctrl.val(value); 
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

 
/*
 * createWidgets to create the list of available widgets for experiment design
 */
createWidgets = function()
{
	var sensors = ['Temperature','Humidity','Barometer','Accelerometer','Gyroscope','Magnetometer','Luxometer'];
	var widgetList = document.getElementById('widgetset');

	// Clear form
	widgetList.innerHTML = "";

	var collapsibleString = ""
	
	// set up the widgets for the form along with the hidden details they need
	for(var i=0 ;i<sensors.length;i++) 
	{ 
		collapsibleString += "<div data-role='collapsible' class='selectionpanel'>"
		collapsibleString += 	"<h3>" + sensors[i] + " Widgets</h3>"
		collapsibleString +=	"<div id='" + sensors[i] + "_Selection'>"
									// Set Up a Graph Widget
		collapsibleString +=  		"<div itemid='" +sensors[i] +"_Graph' class='ui-btn ui-btn-inline ui-widget widgetItem ui-widget-content' revert='true' style='position: relative;'>" 
		collapsibleString +=			"<img src='ui/images/graphicon.png' alt='graph' class='widgetimage'><span class='widgetcaption'>" + sensors[i] + "</span><span class='widgetcaption'> Graph </span>"
										// Set SensorTag 0 to display
		collapsibleString +=			"<input type='hidden' value='on' name='sensorTags[0][connect]'>"
										// Set Graph for Sensor on Tag 0 to display
		collapsibleString +=			"<input type='hidden' value='on' name='sensorTags[0][sensors][" + sensors[i] + "][graph][graphdisplay]'>"
		collapsibleString +=		"</div> " 
									// Set Up a Data Only Widget
		collapsibleString +=		"<div itemid='" +  sensors[i] + "_Data' class='ui-btn ui-btn-inline ui-widget widgetItem ui-widget-content' style='position: relative;'>"
		collapsibleString +=			"<img src='ui/images/dataicon.jpg' alt='data' class='widgetimage'><span class='widgetcaption'>" + sensors[i]+ "</span><span class='widgetcaption'> Data Only </span>" 
										// Set SensorTag 0 to display
		collapsibleString +=			"<input type='hidden' value='on' name='sensorTags[0][connect]'>"
										// Set Sensor on Tag 0 to display
		collapsibleString +=			"<input type='hidden' value='on' name='sensorTags[0][sensors][" + sensors[i] + "][data][display]'>"
		collapsibleString +=		"</div> " 
									// Set Up a Grid  Widget
		collapsibleString +=		"<div itemid='" +  sensors[i] + "_Grid' class='ui-btn ui-btn-inline ui-widget widgetItem ui-widget-content' revert='true' style='position: relative;'>"
		collapsibleString +=			"<img src='ui/images/gridicon.png' alt='grid' class='widgetimage'><span class='widgetcaption'> 4x4 " + sensors[i]+ "</span><span class='widgetcaption'> Grid </span>" 
										// Set SensorTag 0 to display
		collapsibleString +=			"<input type='hidden' value='on' name='sensorTags[0][connect]'>"
										// Set Grid for Sensor on Tag 0 to display as default 4x4
		collapsibleString +=			"<input type='hidden' value='on' name='sensorTags[0][sensors][" + sensors[i] + "][grid][griddisplay]'>"
		collapsibleString +=			"<input type='hidden' value='4' name='sensorTags[0][sensors][" + sensors[i] + "][grid][columns]'>"
		collapsibleString +=			"<input type='hidden' value='4' name='sensorTags[0][sensors][" + sensors[i] + "][grid][rows]'>"
		collapsibleString +=		"</div> " 
		collapsibleString +=	"</div> " 
		collapsibleString += "</div> "  
	}
	widgetList.innerHTML += collapsibleString;

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
			document.getElementById('url').innerHTML = 'Server has stopped. Restart the application to start the server again.';
		},function( error ){
			document.getElementById('url').innerHTML = 'Failed to stop server' + error;
		});
	} else {
		alert('CorHttpd plugin not available/ready.');
	}
}

