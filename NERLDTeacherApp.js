var sensortagMappingData
//var expConfigURL = "http://www.cs.usyd.edu.au/~tmac2470/expConfig.json"
//var expConfigURLJSONP = "https://s3-ap-northeast-1.amazonaws.com/nerldconfigs/expConfig.jsonp";
//var sensontagConfigURLJSONP = "https://s3-ap-northeast-1.amazonaws.com/nerldconfigs/sensortagConfig.jsonp";
//var testConfigURLJSONP = "https://s3-ap-northeast-1.amazonaws.com/nerldconfigs/testConfig.jsonp";
//var uploadPath = "https://s3-ap-northeast-1.amazonaws.com/nerldconfigs/testConfig.jsonp";
var localPath = '10.17.43.1:8080';
var expConfigFileName = "expConfig.jsonp"
var tempFileName = "tempConfigFile.jsonp";
var newDirectoryName = "TeacherAppConfigFiles"
var workingDir; //Directory Entry
var tempFile; // Temporary Config File (FileEntry)
var tempFileWriter; // Filewriter for the temporary file
var openingStr = "callback({\n'experimentConfig': \n";
var closingString = "}} )";
var serverroot;

/*
 * OnDevice ready requirements
 * Can now use API - starting server, writing files etc
 */

function onDeviceReady() {
	
	// Get the File system for writing the configuration file
	window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function(dir) {
		 dir.getDirectory(newDirectoryName, { create: true }, function (dirEntry) {
			// Setting up the files and directories
			workingDir = dirEntry;
			console.log('File system open: ' + dir.fullPath);
			var isAppend = false;
			createFile(dirEntry, tempFileName, isAppend);
		 }, errorHandler);
	}, errorHandler);	


	httpd = ( cordova && cordova.plugins && cordova.plugins.CorHttpd ) ? cordova.plugins.CorHttpd : null;
	//Stop server first
	stopServer();
	stopServer();
	
	// Start the server at the data directory. 
	serverroot = cordova.file.dataDirectory.replace( 'file://', '' );
	startServer(serverroot + newDirectoryName);

}
/*
 * Creating a Directory
 * (Based https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-file/index.html)
 */	
function createDirectory(rootDirEntry) {
    rootDirEntry.getDirectory('NewDirInRoot', { create: true }, function (dirEntry) {
        dirEntry.getDirectory('images', { create: true }, function (subDirEntry) {

            createFile(subDirEntry, "fileInNewSubDir.txt");

        }, onErrorGetDir);
    }, onErrorGetDir);
}
/*
 * Creating a file
 * (Based https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-file/index.html)
 */
function createFile(dirEntry, fileName, isAppend) {
    // Creates a new file or returns the file if it already exists.
    dirEntry.getFile(fileName, {create: true, exclusive: false}, function(fileEntry) {

		tempFile = fileEntry;
        writeTextToFile(fileEntry, null, isAppend);

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
            console.log("Successful file write...");
            //readFile(fileEntry);
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
            //readFile(fileEntry);
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
            console.log("Successful file read: " + this.result);
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

function getFileList() {
  var dirReader = workingDir.createReader();
  var entries = [];

  // Call the reader.readEntries() until no more results are returned.
  var readEntries = function() {
     dirReader.readEntries (function(results) {
      if (!results.length) {
        listResults(entries.sort());
      } else {
        entries = entries.concat(toArray(results));
        readEntries();
      }
    }, errorHandler);
  };

  readEntries(); // Start reading dirs.
}

/*
 * Just to test what is in the file
 */
function justForTesting() {
	console.log("Just Testing the dump from the file");
	tempFile.file(function(file) {
		var reader = new FileReader();

		reader.onloadend = function(e) {
			console.log(this.result);
		};

		reader.readAsText(file);
	}, errorHandler);

}

/*
 * Renaming a file
 * from http://www.html5rocks.com/en/tutorials/file/filesystem/
 */
function rename(cwd, src, newName) {
  cwd.getFile(src, {}, function(fileEntry) {
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
		return fileEntry;
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
getConfigFileName = function() 
{
	navigator.notification.prompt(
		'Please enter the file name for your configuration file',  // message
		onPrompt,     // callback to invoke
		'Configuration File Name ', // title
		['Ok','Exit'],             // buttonLabels
		'expConfig.jsonp'                 // defaultText
	);
}

function onPrompt(results) {
	// Set file name to one entered by user
	expConfigFileName = results.input1;

    alert("Your configuration file has been saved to: " + expConfigFileName + ".\n\n Please make a note of this name.");
	
	submitExperimentConfig();
}

/*
 * submitExperimentConfig 
 * Display SensorTag Config informaion for each sensortag depending on user selection
 */
submitExperimentConfig = function() 
{

	// Get form information from form
	var dataObj = $('form').serializeJSON({checkboxUncheckedValue: "off"});

	var isAppend = false;
	//Write data to the the temporary file
	writeTextToFile(tempFile, openingStr + JSON.stringify(dataObj) + closingString,isAppend); 
	
	// Save the temp file to the new name
	console.log("Starting to copy from " + tempFileName + " to " + expConfigFileName)

	var configFileEntry = saveFile(workingDir, tempFile, expConfigFileName);

	upLoadConfigFileToServer(configFileEntry);
}


/*
 * upLoadConfigFileToServer 
 * Upload the user created file to the Server
 */
upLoadConfigFileToServer = function(fileEntry) 
{
    // !! Assumes variable fileURL contains a valid URL to a text file on the device,
    var fileURL = fileEntry.toURL();

    var success = function (r) {
        console.log("Successful upload...");
        console.log("Code = " + r.responseCode);
        readFile(fileEntry.fullPath);
    }

    var fail = function (error) {
        alert("An error has occurred: Code = " + error.code);
    }

    var options = new FileUploadOptions();
    options.fileKey = "file";
    options.fileName = fileURL.substr(fileURL.lastIndexOf('/') + 1);
    options.mimeType = "text/plain";

    var params = {};
    params.value1 = "test";
    params.value2 = "param";

    options.params = params;

    var ft = new FileTransfer();
    // SERVER must be a URL that can handle the request, like
    // http://some.server.com/upload.php
    ft.upload(fileURL, encodeURI(SERVER), success, fail, options);
	
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
	
	/*$.ajax({
		type: 'PUT',
		url: 'http://10.17.43.1:8080/' + results.input1,
		dataType: 'json',
		async: false,
		contentType: "application/json",
		data: JSON.stringify(dataObj),
        success: function(response){
			console.log('uploaded...' + response);
		},
		error: function(xhr, textStatus, errorThrown) {
			console.log("Error: " + xhr.responseText)
			console.log(errorThrown);
		}
	});	*/
}

/*
 * buildSensortagConfigHTML 
 * Display SensorTag Config informaion for each sensortag build using html strings for each sensor and tag
 */ 
buildSensortagConfigHTML = function(id) 
{
	var sensors = ['Temperature','Humidity','Barometer','Accelerometer','Gyroscope','Magnetometer','Luxometer','Keypress'];
	var config = document.getElementById('sensortag'+id+'List');

	config.innerHTML = "";

	config.innerHTML +=	"<div data-role='fieldcontain'><label for='addSensortag" +id +"'><strong>Display SensorTag</strong></label><input type='checkbox' data-role='flipswitch' name='sensorTags["+id+"][connect]' id='addSensortag"+id+"'></div>"
	config.innerHTML += "<label for='sensorTags[" +id +"][title]'><strong>Name of SensorTag:</strong></label><input type='text' name='sensorTags[" +id +"][title]' id='sensorTags" +id +"Name' value=''/>" 
	//onchange='showHideSensortagConfig("+id+")'></div>"

	for(var i=0 ;i<sensors.length;i++){ 
		config.innerHTML += "<div data-role='fieldcontain' ><label for='sensorTags[" + id + "][sensors][" + sensors[i] + "[display]'>" + sensors[i] + ":</label><input  class='sensortag"+id+"' type='checkbox' data-role='flipswitch' name='sensorTags[" +id + "][sensors][" + sensors[i] + "][display]' id='" + sensors[i] + id +"flip' onchange='showHideLabel(\"" + sensors[i] + id + "label\")'> </div>" 
		config.innerHTML += "<div data-role='fieldcontain' id='"+ sensors[i] + id + "label' style='display:none' class='ui-hide-label' ><label for='sensorTags[" +id +"][sensors][" + sensors[i] + "][label]'> " + sensors[i] + " Label:</label><input type='text' name='sensorTags[" +id +"][sensors][" + sensors[i] + "][label]' value='' placeholder='"+ sensors[i] + " Label'/></div>"
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

/* 
 * Testing Corhttpd
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
                    document.getElementById('url').innerHTML = "server is up: <a href='" + url + "' target='_blank'>" + url + "</a>";
                } else {
                    document.getElementById('url').innerHTML = "server is down.";
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
                    document.getElementById('url').innerHTML += "<br>The server root directory is " + wwwroot;
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