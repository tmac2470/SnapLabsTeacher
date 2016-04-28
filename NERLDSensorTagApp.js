	var sensortag0
	var sensortag1

	function initialiseSensorTag()
	{
		// Create First SensorTag CC2650 instance.
		sensortag0 = evothings.tisensortag.createInstance(
			evothings.tisensortag.CC2650_BLUETOOTH_SMART)

		sensortag1 = evothings.tisensortag.createInstance(
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
		sensortag0
			.statusCallback(statusHandler)
			.errorCallback(errorHandler)
			.keypressCallback(keypressHandler)
			.temperatureCallback(this.temperatureHandler, 1000)
			.humidityCallback(humidityHandler, 1000)
			.barometerCallback(barometerHandler, 1000)
			.accelerometerCallback(accelerometerHandler, 1000)
			.magnetometerCallback(magnetometerHandler, 1000)
			.gyroscopeCallback(gyroscopeHandler, 1000)
			.luxometerCallback(luxometerHandler, 1000)

		sensortag1
			.statusCallback(statusHandler)
			.errorCallback(errorHandler1)
			.keypressCallback(keypressHandler)
			.temperatureCallback(temperatureHandler1, 1000)
			.humidityCallback(humidityHandler, 1000)
			.barometerCallback(barometerHandler, 1000)
			.accelerometerCallback(accelerometerHandler, 1000)
			.magnetometerCallback(magnetometerHandler, 1000)
			.gyroscopeCallback(gyroscopeHandler, 1000)
			.luxometerCallback(luxometerHandler, 1000)
	}

	function connect0()
	{
		sensortag0.connectToNearestDevice()
	}

	function connect1()
	{
		sensortag1.connectToNearestDevice()
	}
	
	function disconnect()
	{
		sensortag0.disconnectDevice()
		sensortag1.disconnectDevice()
		resetSensorDisplayValues()
	}

	var sensorsOn = true

	function toggleSensors()
	{
		if(sensorsOn)
		{
			sensortag0.keypressOff()
			sensortag0.temperatureOff()
			sensortag0.humidityOff()
			sensortag0.barometerOff()
			sensortag0.accelerometerOff()
			sensortag0.magnetometerOff()
			sensortag0.gyroscopeOff()
			sensortag0.luxometerOff()

			sensortag1.keypressOff()
			sensortag1.temperatureOff()
			sensortag1.humidityOff()
			sensortag1.barometerOff()
			sensortag1.accelerometerOff()
			sensortag1.magnetometerOff()
			sensortag1.gyroscopeOff()
			sensortag1.luxometerOff()
			sensorsOn = false
		}
		else
		{
			sensortag0.keypressOn()
			sensortag0.temperatureOn()
			sensortag0.humidityOn()
			sensortag0.barometerOn()
			sensortag0.accelerometerOn()
			sensortag0.magnetometerOn()
			sensortag0.gyroscopeOn()
			sensortag0.luxometerOn()

			sensortag1.keypressOn()
			sensortag1.temperatureOn()
			sensortag1.humidityOn()
			sensortag1.barometerOn()
			sensortag1.accelerometerOn()
			sensortag1.magnetometerOn()
			sensortag1.gyroscopeOn()
			sensortag1.luxometerOn()
			sensorsOn = true
		}
	}

	function statusHandler(status)
	{
		if ('DEVICE_INFO_AVAILABLE' == status)
		{
			console.log("Status Handler 0 This: " + this.getDeviceModel())

			// Show device model and firmware version.
			displayValue('DeviceModel0', this.getDeviceModel())
			displayValue('FirmwareData0', this.getFirmwareString())

			//displayValue('DeviceMode1', sensortag0.getDeviceModel())
			//displayValue('FirmwareData1', sensortag0.getFirmwareString())

			// Show which sensors are not supported by the connected SensorTag.
			/*if (!sensortag0.isLuxometerAvailable())
			{
				document.getElementById('Luxometer').style.display = 'none'
			}
			if (!sensortag1.isLuxometerAvailable())
			{
				document.getElementById('Luxometer').style.display = 'none'
			}*/
		}

		displayValue('StatusData0', status)
	}

	function errorHandler(error)
	{
		console.log('Error: ' + error)

		if (evothings.easyble.error.DISCONNECTED == error)
		{
			resetSensorDisplayValues()
		}
		else
		{
			displayValue('StatusData0', 'Error: ' + error)
		}
	}

	function errorHandler1(error)
	{
		console.log('Error: ' + error)

		if (evothings.easyble.error.DISCONNECTED == error)
		{
			resetSensorDisplayValues()
		}
		else
		{
			displayValue('StatusData1', 'Error: ' + error)
		}
	}

	function resetSensorDisplayValues()
	{
		// Clear current values.
		var blank = '[Waiting for value]'
		displayValue('StatusData0', 'Press Connect to find a SensorTag')
		displayValue('DeviceModel0', '?')
		displayValue('FirmwareData0', '?')
		displayValue('KeypressData', blank)
		displayValue('TemperatureData0', blank)
		displayValue('AccelerometerData', blank)
		displayValue('HumidityData', blank)
		displayValue('MagnetometerData', blank)
		displayValue('BarometerData', blank)
		displayValue('GyroscopeData', blank)
		displayValue('LuxometerData', blank)

		displayValue('StatusData1', 'Press Connect to find a SensorTag')
		displayValue('DeviceModel1', '?')
		displayValue('FirmwareData1', '?')
		displayValue('KeypressData', blank)
		displayValue('TemperatureData1', blank)
		displayValue('AccelerometerData', blank)
		displayValue('HumidityData', blank)
		displayValue('MagnetometerData', blank)
		displayValue('BarometerData', blank)
		displayValue('GyroscopeData', blank)
		displayValue('LuxometerData', blank)

		// Reset screen color.
		setBackgroundColor('white')
	}

	function keypressHandler(data)
	{
		// Update background color.
		switch (data[0])
		{
			case 0:
				setBackgroundColor('white')
				break;
			case 1:
				setBackgroundColor('red')
				break;
			case 2:
				setBackgroundColor('blue')
				break;
			case 3:
				setBackgroundColor('magenta')
				break;
		}

		// Update the value displayed.
		var string = 'raw: 0x' + bufferToHexStr(data, 0, 1)
		displayValue('KeypressData', string)
	}

	function temperatureHandler(data)
	{
		//console.log("Temp Handler 1 This: " + this.getDeviceModel())

		// Calculate temperature from raw sensor data.
		var values = sensortag0.getTemperatureValues(data)
		var ac = values.ambientTemperature
		var af = sensortag0.celsiusToFahrenheit(ac)
		var tc = values.targetTemperature
		var tf = sensortag0.celsiusToFahrenheit(tc)

		// Prepare the information to display.
		var string =
			//'raw: <span style="font-family: monospace;">0x' +
			//	bufferToHexStr(data, 0, 4) + '</span><br/>' +
			(tc >= 0 ? '+' : '') + tc.toFixed(2) + '&deg; C ' +
			'(' + (tf >= 0 ? '+' : '') + tf.toFixed(2) + '&deg; F)' + '<br/>' +
			(ac >= 0 ? '+' : '') + ac.toFixed(2) + '&deg; C ' +
			'(' + (af >= 0 ? '+' : '') + af.toFixed(2) + '&deg; F) [amb]' +
			'<br/>'

		// Update the value displayed.
		displayValue('TemperatureData0', string)
	}

	function temperatureHandler1(data)
	{
		// Calculate temperature from raw sensor data.
		var values = sensortag1.getTemperatureValues(data)
		var ac = values.ambientTemperature
		var af = sensortag1.celsiusToFahrenheit(ac)
		var tc = values.targetTemperature
		var tf = sensortag1.celsiusToFahrenheit(tc)

		// Prepare the information to display.
		var string =
			//'raw: <span style="font-family: monospace;">0x' +
			//	bufferToHexStr(data, 0, 4) + '</span><br/>' +
			(tc >= 0 ? '+' : '') + tc.toFixed(2) + '&deg; C ' +
			'(' + (tf >= 0 ? '+' : '') + tf.toFixed(2) + '&deg; F)' + '<br/>' +
			(ac >= 0 ? '+' : '') + ac.toFixed(2) + '&deg; C ' +
			'(' + (af >= 0 ? '+' : '') + af.toFixed(2) + '&deg; F) [amb]' +
			'<br/>'

		// Update the value displayed.
		displayValue('TemperatureData1', string)
	}

	function accelerometerHandler(data)
	{
		// Calculate the x,y,z accelerometer values from raw data.
		var values = sensortag0.getAccelerometerValues(data)
		var x = values.x
		var y = values.y
		var z = values.z

		//var model = sensortag.getDeviceModel()
		//var dataOffset = (model == 2 ? 6 : 0)

		// Prepare the information to display.
		string =
			//'raw: <span style="font-family: monospace;">0x' +
			//	bufferToHexStr(data, dataOffset, 6) + '</span><br/>' +
			'x: ' + (x >= 0 ? '+' : '') + x.toFixed(5) + 'G<br/>' +
			'y: ' + (y >= 0 ? '+' : '') + y.toFixed(5) + 'G<br/>' +
			'z: ' + (z >= 0 ? '+' : '') + z.toFixed(5) + 'G<br/>'

		// Update the value displayed.
		displayValue('AccelerometerData', string)
	}

	function humidityHandler(data)
	{
		// Calculate the humidity values from raw data.
		var values = sensortag0.getHumidityValues(data)

		// Calculate the humidity temperature (C and F).
		var tc = values.humidityTemperature
		var tf = sensortag0.celsiusToFahrenheit(tc)

		// Calculate the relative humidity.
		var h = values.relativeHumidity

		// Prepare the information to display.
		string =
			//'raw: <span style="font-family: monospace;">0x' +
			//	bufferToHexStr(data, 0, 4) + '</span><br/>'
			(tc >= 0 ? '+' : '') + tc.toFixed(2) + '&deg; C ' +
			'(' + (tf >= 0 ? '+' : '') + tf.toFixed(2) + '&deg; F)' + '<br/>' +
			(h >= 0 ? '+' : '') + h.toFixed(2) + '% RH' + '<br/>'

		// Update the value displayed.
		displayValue('HumidityData', string)
	}

	function magnetometerHandler(data)
	{
		// Calculate the magnetometer values from raw sensor data.
		var values = sensortag0.getMagnetometerValues(data)
		var x = values.x
		var y = values.y
		var z = values.z

		//var model = sensortag0.getDeviceModel()
		//var dataOffset = (model == 2 ? 12 : 0)

		// Prepare the information to display.
		string =
			//'raw: <span style="font-family: monospace;">0x' +
			//	bufferToHexStr(data, dataOffset, 6) + '</span><br/>' +
			'x: ' + (x >= 0 ? '+' : '') + x.toFixed(5) + '&micro;T <br/>' +
			'y: ' + (y >= 0 ? '+' : '') + y.toFixed(5) + '&micro;T <br/>' +
			'z: ' + (z >= 0 ? '+' : '') + z.toFixed(5) + '&micro;T <br/>'

		// Update the value displayed.
		displayValue('MagnetometerData', string)
	}

	function barometerHandler(data)
	{
		// Calculate pressure from raw sensor data.
		var values = sensortag0.getBarometerValues(data)
		var pressure = values.pressure

		// Prepare the information to display.
		string =
			//'raw: <span style="font-family: monospace;">0x' +
			//	bufferToHexStr(data, 0, 4) + '</span><br/>' +
			'Pressure: ' + pressure.toPrecision(5) + ' mbar<br/>'

		// Update the value displayed.
		displayValue('BarometerData', string)
	}

	function gyroscopeHandler(data)
	{
		// Calculate the gyroscope values from raw sensor data.
		var values = sensortag0.getGyroscopeValues(data)
		var x = values.x
		var y = values.y
		var z = values.z

		// Prepare the information to display.
		string =
			//'raw: <span style="font-family: monospace;">0x' +
			//	bufferToHexStr(data, 0, 6) + '</span><br/>' +
			'x: ' + (x >= 0 ? '+' : '') + x.toFixed(5) + '<br/>' +
			'y: ' + (y >= 0 ? '+' : '') + y.toFixed(5) + '<br/>' +
			'z: ' + (z >= 0 ? '+' : '') + z.toFixed(5) + '<br/>'

		// Update the value displayed.
		displayValue('GyroscopeData', string)
	}

	function luxometerHandler(data)
	{
		var value = sensortag0.getLuxometerValue(data)

		// Prepare the information to display.
		string =
			//'raw: <span style="font-family: monospace;">0x' +
			//	bufferToHexStr(data, 0, 2) + '</span><br/>' +
			'Light level: ' + value.toPrecision(5) + ' lux<br/>'

		// Update the value displayed.
		displayValue('LuxometerData', string)
	}

	function displayValue(elementId, value)
	{
		document.getElementById(elementId).innerHTML = value
	}

	function setBackgroundColor(color)
	{
		document.documentElement.style.background = color
		document.body.style.background = color
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
		function() { evothings.scriptsLoaded(initialiseSensorTag) },
		false)
