var login = require("facebook-chat-api");
//var threadid = 1015695748506344;
var threadid = 832913696834627;
var fs = require("fs");
var http = require('http');
var xml2js = require('xml2js');

login({email: "YOUR_FB_EMAIL", password: "YOUR_FB_PASSWORD"}, function callback (err, api) {

    	if(err) return console.error(err);
 
    	api.listen(function callback(err, message) {
			
			if (message.body.charAt(0) == '!') {
				var command = '';
				var parameters = [];

				if (message.body.indexOf(' ') == -1) {
					command = message.body.substring(1);
				}
				else {
					command = message.body.substring(1, message.body.indexOf(' '));
					parameters = message.body.substring(message.body.indexOf(' ') + 1).split(" ");
				}

			}
			

			switch (command) {
				
				// dictionary
				case "define":
					if (parameters.length > 1) {
						api.sendMessage("The 'define' command takes only one word", message.threadID);
						break;
					}		
					var word = parameters[0];

        	                        var parser = new xml2js.Parser();
        	                        var url = 'http://www.dictionaryapi.com/api/v1/references/collegiate/xml/' + word + '?key=d6321a0b-65f5-4be4-a549-356e8e2460bb';

        	                        parser.on('error', function(err) { console.log('Parser error', err); });
        	                        var data = '';
                	                http.get(url, function(res) {
                        	                if (res.statusCode >= 200 || res.statusCode < 400) {
                        	                        res.on('data', function(data_) { data += data_.toString(); });
                                        	        res.on('end', function() {
                                        	                parser.parseString(data, function(err, result) {
									try {
	                                                                        var response = "Definition of '" + word + "': " + result["entry_list"]["entry"][0]["def"][0]["dt"][0].replace(':', '');
									}
									catch(err) {
										try {
	                                                                                var response = "Definition of '" + word + "': " + result["entry_list"]["entry"][0]["def"][0]["dt"][0]['_'].replace(':', '');
										}
										catch(err) {
											var response = "Definition of '" + word + "' not found";
										}
									}	
									
                                        	                        console.log("define: " + word);
                                        	                        api.sendMessage(response, message.threadID);
                                        	                });
                                        	        });
                                        	}
                               		});
					break;

				// post meme
				case "meme":
					if (parameters.length > 1) {
                                                api.sendMessage("The 'meme' command takes only one word", message.threadID);
                                                break;
                                        }
					else if (parameters.length == 0) {
						var response = "List of available memes:\n";
						
						var walk    = require('walk');
						var files   = [];

						var walker  = walk.walk('./memes', { followLinks: false });

						walker.on('file', function(root, stat, next) {							    files.push(root + '/' + stat.name);
							next();
						});

						walker.on('end', function() {
							console.log(files.length);
							for (i = 0; i < files.length; i++) {
								var arr = files[i].split("/");
								response = response + '\n' + arr[arr.length - 1].split('.')[0];
							}
							api.sendMessage(response, message.threadID);
						});
						break;
					}

					var meme = parameters[0];
					var response = {
      						attachment: fs.createReadStream(__dirname + '/memes/' + meme + ".jpg")
    					}
    					api.sendMessage(response, message.threadID);
					break;
				
				// add meme
				case "addmeme":
					if (parameters.length != 2) {
                                                api.sendMessage("The 'addmeme' command takes two parameters (example: !addmeme name http://imgur.com/image.jpg)", message.threadID);
                                                break;
                                        }

					var name = parameters[0];
					var link = parameters[1];

					var file = fs.createWriteStream(__dirname + "/memes/" + name + ".jpg");
					console.log("adding meme " + name);
					var request = http.get(link, function(response) {
						response.pipe(file);
					});
	
					break;


				// weather
				case "weather":
					var weather = require('weather-js');

					if (parameters.length == 0) {
						parameters[0] = "Chicago, IL";
					}					

					var place = parameters[0];			
					for (i = 1; i < parameters.length; i++) {
						place = place + ' ' + parameters[i];
					}	
					weather.find({search: place, degreeType: 'F'}, function(err, result) {
  						if(err) console.log(err);
						var response = "Weather report for " + result[0]["location"]["name"] + ":\n\n"
							+ result[0]["current"]["skytext"] + ", " + result[0]["current"]["temperature"] 
							+ "F " + "(feels like " + result[0]["current"]["feelslike"] + ")\n"
							+ "Tomorrow will be " + result[0]["forecast"][0]["skytextday"]
							+ ", high of " + result[0]["forecast"][0]["high"]
							+ " and low of " + result[0]["forecast"][0]["low"];

						api.sendMessage(response, message.threadID);
					});

	
					break;

				case "help":
					var response = "Available commands include:\n" +
						"!define [word]\n" +
						"!meme [meme name]\n" +
						"!addmeme [meme name] [image url]\n" +
						"!weather [place]";

					api.sendMessage(response, message.threadID);	
					console.log("responding to " + message.threadID);
					break;	
			}

	});
});
