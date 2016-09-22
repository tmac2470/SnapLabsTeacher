// JavaScript code for the BLE Scan example 

// Application object.

// Device list.
devices = {};

// Timer that updates the device list and removes inactive
// devices in case no devices are found by scan.
updateTimer = null;

// SensorTag methods.
var sensortag

var connectOnce = {}; 

// SensorTag instance

/*initialize = function()
{
	document.addEventListener(
		'deviceready',
		function() { 
			evothings.scriptsLoaded(initialiseSensorTag)
			console.log("DEBUG - Adding device ready function")
			},
		false)
};*/

function initialiseSensorTagTeacher()
{
	// Create First SensorTag CC2650 instance.
	sensortag = evothings.tisensortag.createInstance(
		evothings.tisensortag.CC2650_BLUETOOTH_SMART)
	sensortag.connected = false;

	sensortag
		.statusCallback(statusHandlerTeacher)
		.errorCallback(errorHandlerTeacher)
		.keypressCallback(keypressHandlerTeacher)

	console.log("DEBUG - sensorTag initialised - Teacher")
} 

// Start the scan. Call the callback function when a device is found.
// Format:
//   callbackFun(deviceInfo, errorCode)
//   deviceInfo: address, rssi, name
//   errorCode: String
//startScan = function(callbackFun)
startScan = function(callbackFun)  
{
	stopScan();

	evothings.ble.startScan(
		function(device)
		{
			//console.log("Device found. Name is " +  device.name)
			// Report success. Sometimes an RSSI of +127 is reported.
			// We filter out these values here.
			// Look only for SensorTags
			if (device.rssi <= 0 && device.name != null)
			{
				if((device.name).match(/sensortag/i) != null){
					callbackFun(device, null);
				}
				else{
					//console.log("Not a sensorTag. Name is " +  device.name)
				}
			}
		}, 
		function(errorCode)
		{
			// Report error.
			callbackFun(null, errorCode);
		}
	);
};

// Stop scanning for devices.
stopScan = function()
{
	evothings.ble.stopScan();
};

// Called when Start Scan button is selected.
onStartScanButton = function()
{
	startScan(deviceFound);
	displayStatus('Scanning...');
	updateTimer = setInterval(displayDeviceList, 500);
	displayValue('StatusData', "Searching for SensorTags. To connect, press one of the green SensorTag connection buttons below.")
	document.getElementById("startScanButton").style.display = 'none'
	document.getElementById("pauseScanButton").style.display = 'block'
};

// Called when Stop Scan button is selected.
onStopScanButton = function()
{
	stopScan();
	devices = {};
	displayStatus('Scan Paused');
	displayValue("StatusData","Scanning Paused. Click on a green SensorTag connection button to add or change configuration file.")
	//displayDeviceList();
	clearInterval(updateTimer);
	document.getElementById("startScanButton").style.display = 'block'
	document.getElementById("pauseScanButton").style.display = 'none'
};

// Called when Pause Scan button is selected.
onPauseScanButton = function()
{
	stopScan();
	//devices = {};
	displayStatus('Scan Paused');
	displayValue("StatusData","Scanning Paused. Click on a green SensorTag connection button to add or change configuration file.")
	//displayDeviceList();
	clearInterval(updateTimer);
	document.getElementById("startScanButton").style.display = 'block'
	document.getElementById("pauseScanButton").style.display = 'none'
};

onResetScanButton = function(){
	stopScan();
	devices = {};
	connectOnce = {};
	displayStatus('Scan Paused');
	displayValue("StatusData","Scanning Paused. Click on a green SensorTag connection button to add or change configuration file.")
	//displayDeviceList();
	clearInterval(updateTimer);
	document.getElementById("startScanButton").style.display = 'block'
	document.getElementById("pauseScanButton").style.display = 'none'
	document.getElementById("found-devices").innerHTML = ''
}

// Called when a device is found.
deviceFound = function(device, errorCode)
{
	if (device)
	{
		// Set timestamp for device (this is used to remove
		// inactive devices).
		device.timeStamp = Date.now();

		// Insert the device into table of found devices.
		devices[device.address] = device;
	}
	else if (errorCode)
	{
		displayStatus('Scan Error: ' + errorCode);
	}
};

// Display the device list.
displayDeviceList = function()
{
	// Clear device list.
	$('#found-devices').empty();

	var timeNow = Date.now();

	$.each(devices, function(key, device)
	{
		// Only show devices that are updated during the last 10 seconds.
		if (device.timeStamp + 10000 > timeNow)
		{
			// Map the RSSI value to a width in percent for the indicator.
			var rssiWidth = 100; // Used when RSSI is zero or greater.
			if (device.rssi < -100) { rssiWidth = 0; }
			else if (device.rssi < 0) { rssiWidth = 100 + device.rssi; }

			// Create tag for device data.
			var element = $(
				'<br>'
				// Do not show address on iOS since it can be confused
				// with an iBeacon UUID.
				// +	(evothings.os.isIOS() ? '' : device.address) 
				//+	device.rssi + '<br />'
				//+ 	'<div style="background:rgb(225,0,0);height:20px;width:'
				//+ 		rssiWidth + '%;"></div>'
				+	'<button id="' + device.address +'Connect" data-inline="true" onclick="connect(\'' +  device.address + '\', addToConfig)" class="asellbrightgreen"> <strong> press to connect to ' + device.name + '</strong> </button>' 
				+ '<button id="' + device.address +'Disconnect" data-inline="true" onclick="disconnect(\'' +  device.address + '\')" class="asellred" style="display:none"> <strong> Disconnect </strong> </button>'
				+ 	'<div style="background:rgb(225,0,0);height:20px;width:'
				+ 		rssiWidth + '%;"></div>'
				+ '</br>'
			);
			$('#found-devices').append(element);
			//console.log("DEBUG - Found element with " + device.address + " and  details " + JSON.stringify(device))
		} 
	});
};

// Display a status message
displayStatus = function(message)
{
	$('#scan-status').html(message);
};


/*sensortag.connect = function()
{
	sensortag.connectToNearestDevice()
}*/

connect = function(address, callback) 
{
	console.log("DEBUG - Connect to " + address)
	onPauseScanButton();
	displayValue("StatusData","Connecting to SensorTag ...")

	// This may work only on Android where the Address s advertised
	sensortag.connectToSensorTagAddressNERLD(1000, address, callback)
}


disconnect = function(address)
{
	sensortag.disconnectDevice()
	displayValue(address+'Connect', "Added to configuration: " + address)
	hideElementView(address+'Disconnect')
	displayValue("StatusData", "No SensorTag connected.  Press the green connection button below to update configuration file.")
	//hideElementView('deviceInfo')
}

statusHandlerTeacher = function(status)
{
	/*if ('DEVICE_INFO_AVAILABLE' === status)
	{
		// Show device model and firmware version.
		showElementView('deviceInfo')
		displayValue('DeviceModel', sensortag.getDeviceModel())
		displayValue('FirmwareData', sensortag.getFirmwareString())
		displayValue("StatusData", "Reading SensorTag data")
		//displayValue('SystemID', sensortag.getSystemID())

	}*/

	displayValue('StatusData', status)
}

errorHandlerTeacher = function(error)
{
	console.log('Error: ' + error)

	if (evothings.easyble.error.DISCONNECTED === error)
	{
		displayValue('StatusData', 'Error: ' + error)
		showElementView(device.address+'Disconnect')
	}
	else
	{
		displayValue('StatusData', 'Error: ' + error)
		showElementView(device.address+'Disconnect')
	}
}

keypressHandlerTeacher = function(data)
{
	console.log("DEBUG - Key Pressed")
	// Enter the details only once key press complete
	if(data=='0')
	{
		navigator.notification.prompt(
			'Please enter the name you would like for this Sensor',  // message
			addSensor,     // callback to invoke
			'SensorTag Name', // title
			['Ok','Exit'],             // buttonLabels
			'SensorTag'                 // defaultText
		);
	}

	displayValue('KeypressData', "SensorTag found!")
}

addSensor = function(results)
{
	var newSensor = {};
	newSensor.name = results.input1;
	newSensor.systemID = sensortag.getSystemID();
	readSensorTagConfigFile(updateSensorTagConfigFileSensors,newSensor);
}

displayValue = function(elementId, value)
{
	//console.log("DEBUG - trying to set value to " + value)
	document.getElementById(elementId).innerHTML = value
}

setBackgroundColor = function(color)
{
	document.documentElement.style.background = color
	document.body.style.background = color
}

addToConfig = function(device)
{
	console.log("DEBUG - addToConfig passed sysID is " + JSON.stringify(device) + " Value for address is " +sensortag.getSystemID() )
	// Added check to account for double connection
	// TO DO - find source of double connection 
	if(device.address in connectOnce && connectOnce[device.address] !== "false")
	{ 
		console.log("DEBUG - Already Did Connection")
		connectOnce[device.address] = "false";
	} else{
		displayValue("StatusData", "Searching configuration file for SensorTag ...") 
		readSensorTagConfigFile(checkForExistingSensortag,sensortag.getSystemID());
		connectOnce[device.address] = "true";
	}	
	displayValue(device.address+'Connect', "Connected: " + device.address)
	showElementView(device.address+'Disconnect')
	//console.log("DEBUG - connectOnce is " + JSON.stringify(connectOnce))
}
/**
 * Convert byte buffer to hex string.
 * @param buffer - an Uint8Array
 * @param offset - byte offset
 * @param numBytes - number of bytes to read
 * @return string with hex representation of bytes
 */
function bufferToHexStr(buffer, offset, numBytes)
{
	var hex = ''
	for (var i = 0; i < numBytes; ++i)
	{
		hex += byteToHexStr(buffer[offset + i])
	}
	return hex
}

/**
 * Convert byte number to hex string.
 */
function byteToHexStr(d)
{
	if (d < 0) { d = 0xFF + d + 1 }
	var hex = Number(d).toString(16)
	var padding = 2
	while (hex.length < padding)
	{
		hex = '0' + hex
	}
	return hex
}


document.addEventListener(
	'deviceready',
	function() { evothings.scriptsLoaded(initialiseSensorTagTeacher) },
	false)
	
//initialize();



