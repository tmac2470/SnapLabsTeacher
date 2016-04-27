/*
 * CordovaHTTP get test to load a local file
 * this file is local at this stage so no test for remote access
 */
loadExpConfig = function() 
{
		var json;
		cordovaHTTP.get(
		"http://www.cs.usyd.edu.au/~tmac2470/FabLabs/test.txt",  
		function(response)  // on success
		{
			try 
			{  // is the resource well-formed?
				json = JSON.parse(client.responseText); 
			}
			catch (ex) 
			{   
				// Invalid JSON, notify of the failure...
				alert('Could not parse json, aborting..');
			} 
			if (json) 
			{ 
				// Ok, it seems to be valid JSON, proceed here with the code
			}
			document.getElementById("demo2").innerHTML = response.data;
		}, 
		function(response)   // on error
		{
			console.log(JSON.stringify(response));
		});
}
