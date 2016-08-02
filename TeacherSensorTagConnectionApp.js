// JavaScript code for the BLE Scan example app.

// Application object.
var app = {};

// Device list.
app.devices = {};

// UI methods.
app.ui = {};

// Timer that updates the device list and removes inactive
// devices in case no devices are found by scan.
app.ui.updateTimer = null;

// SensorTag methods.
app.sensortag = {};

var connectOnce = {}; 

// SensorTag instance
var sensortag

app.initialize = function()
{
	document.addEventListener(
		'deviceready',
		function() { evothings.scriptsLoaded(app.onDeviceReady) },
		false);
};

app.onDeviceReady = function()
{
	evothings.scriptsLoaded(app.sensortag.initialiseSensorTag)
	
	// Not used.
	// Here you can update the UI to say that
	// the device (the phone/tablet) is ready
	// to use BLE and other Cordova functions.
};

// Start the scan. Call the callback function when a device is found.
// Format:
//   callbackFun(deviceInfo, errorCode)
//   deviceInfo: address, rssi, name
//   errorCode: String
app.startScan = function(callbackFun)
{
	app.stopScan();

	evothings.ble.startScan(
		function(device)
		{
			// Report success. Sometimes an RSSI of +127 is reported.
			// We filter out these values here.
			// Look only for SensorTags
			if (device.rssi <= 0 && device.name != null)
			{
				if((device.name).match(/sensortag/i) != null){
					callbackFun(device, null);
				}
				else{
					console.log("Not a sensorTag")
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
app.stopScan = function()
{
	evothings.ble.stopScan();
};

// Called when Start Scan button is selected.
app.ui.onStartScanButton = function()
{
	app.startScan(app.ui.deviceFound);
	app.ui.displayStatus('Scanning...');
	app.ui.updateTimer = setInterval(app.ui.displayDeviceList, 500);
	document.getElementById("startScanButton").style.display = 'none'
	document.getElementById("pauseScanButton").style.display = 'block'
};

// Called when Stop Scan button is selected.
app.ui.onStopScanButton = function()
{
	app.stopScan();
	app.devices = {};
	app.ui.displayStatus('Scan Paused');
	//app.ui.displayDeviceList();
	clearInterval(app.ui.updateTimer);
	document.getElementById("startScanButton").style.display = 'block'
	document.getElementById("pauseScanButton").style.display = 'none'
};

// Called when Pause Scan button is selected.
app.ui.onPauseScanButton = function()
{
	app.stopScan();
	//app.devices = {};
	app.ui.displayStatus('Scan Paused');
	//app.ui.displayDeviceList();
	clearInterval(app.ui.updateTimer);
	document.getElementById("startScanButton").style.display = 'block'
	document.getElementById("pauseScanButton").style.display = 'none'
};

// Called when a device is found.
app.ui.deviceFound = function(device, errorCode)
{
	if (device)
	{
		// Set timestamp for device (this is used to remove
		// inactive devices).
		device.timeStamp = Date.now();

		// Insert the device into table of found devices.
		app.devices[device.address] = device;
	}
	else if (errorCode)
	{
		app.ui.displayStatus('Scan Error: ' + errorCode);
	}
};

// Display the device list.
app.ui.displayDeviceList = function()
{
	// Clear device list.
	$('#found-devices').empty();

	var timeNow = Date.now();

	$.each(app.devices, function(key, device)
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
				+	'<button id="' + device.address +'Connect" data-inline="true" onclick="app.sensortag.connect(\'' +  device.address + '\', app.sensortag.addToConfig)" class="green"> <strong>' + device.name + '</strong> </button>' 
				+ '<button id="' + device.address +'Disconnect" data-inline="true" onclick="app.sensortag.disconnect(\'' +  device.address + '\')" class="red" style="display:none"> <strong> Disconnect </strong> </button>'
				+ 	'<div style="background:rgb(225,0,0);height:20px;width:'
				+ 		rssiWidth + '%;"></div>'
				+ '</br>'
			);
			$('#found-devices').append(element);
		}
	});
};

// Display a status message
app.ui.displayStatus = function(message)
{
	$('#scan-status').html(message);
};



app.sensortag.initialiseSensorTag = function()
{
	// Create SensorTag CC2650 instance.
	sensortag = evothings.tisensortag.createInstance(
		evothings.tisensortag.CC2650_BLUETOOTH_SMART)

	// Uncomment to use SensorTag CC2541.
	//sensortag = evothings.tisensortag.createInstance(
	//	evothings.tisensortag.CC2541_BLUETOOTH_SMART)

	//
	// Here sensors are set up.
	//
	// If you wish to use only one or a few sensors, just set up
	// the ones you wish to use.
	//
	// First parameter to sensor function is the callback function.
	// Several of the sensors take a millisecond update interval
	// as the second parameter.
	//
	sensortag
		.statusCallback(app.sensortag.statusHandler)
		.errorCallback(app.sensortag.errorHandler)
		.keypressCallback(app.sensortag.keypressHandler)

}

/*app.sensortag.connect = function()
{
	sensortag.connectToNearestDevice()
}*/

app.sensortag.connect = function(address, callback) 
{
	console.log("Connect to " + address)
	app.ui.onPauseScanButton();
	// This may work only on Android where the Address s advertised
	sensortag.connectToSensorTagAddress(1000, address, callback)
}


app.sensortag.disconnect = function(address)
{
	sensortag.disconnectDevice()
	app.sensortag.displayValue(address+'Connect', "Added to configuration: " + address)
	hideElementView(address+'Disconnect')
}

app.sensortag.statusHandler = function(status)
{
	if ('DEVICE_INFO_AVAILABLE' === status)
	{
		// Show device model and firmware version.
		app.sensortag.displayValue('DeviceModel', sensortag.getDeviceModel())
		app.sensortag.displayValue('FirmwareData', sensortag.getFirmwareString())
		app.sensortag.displayValue('SystemID', sensortag.getSystemID())

	}

	app.sensortag.displayValue('StatusData', status)
}

app.sensortag.errorHandler = function(error)
{
	console.log('Error: ' + error)

	if (evothings.easyble.error.DISCONNECTED === error)
	{
		console.log("rest display - error")
	}
	else
	{
		app.sensortag.displayValue('StatusData', 'Error: ' + error)
	}
}

app.sensortag.keypressHandler = function(data)
{
	// Enter the details only once key press complete
	if(data=='0')
	{
		navigator.notification.prompt(
			'Please enter the name you would like for this Sensor',  // message
			app.sensortag.addSensor,     // callback to invoke
			'SensorTag Name', // title
			['Ok','Exit'],             // buttonLabels
			'SensorTag'                 // defaultText
		);
	}

	app.sensortag.displayValue('KeypressData', "SensorTag found!")
}

app.sensortag.addSensor = function(results)
{
	var newSensor = {};
	newSensor.name = results.input1;
	newSensor.systemID = sensortag.getSystemID();
	readSensorTagConfigFile(updateSensorTagConfigFileSensors,newSensor);
}

app.sensortag.displayValue = function(elementId, value)
{
	document.getElementById(elementId).innerHTML = value
}

app.sensortag.setBackgroundColor = function(color)
{
	document.documentElement.style.background = color
	document.body.style.background = color
}

app.sensortag.addToConfig = function(device)
{
	console.log("DEBUG - addToConfig passed sysID is " + JSON.stringify(device) + " Value for address is " +sensortag.getSystemID() )
	// Added check to account for double connection
	// TO DO - find source of double connection 
	if(device.address in connectOnce && connectOnce[device.address] !== "false")
	{ 
		//console.log("DEBUG - Already Did Connection")
		connectOnce[device.address] = "false";
	} else{
		readSensorTagConfigFile(checkForExistingSensortag,sensortag.getSystemID());
		connectOnce[device.address] = "true";
	}	
	app.sensortag.displayValue(device.address+'Connect', "Connected: " + device.address)
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



app.initialize();


