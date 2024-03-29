const Opus = require('node-opus');
const Path = require('path');
const AudioHandler = require(Path.resolve(__dirname, "AudioHandler.js"));
const Math = require('mathjs');
const FS = require('fs');

const prefix = "/";
const delimiter = ",";

const commands = [
	{
		name: "ping",
		arguments: 0,
		description: "Responds with pong, whenever the user enters \'ping\'.",
		isAdminCommand: false,
		method: function(message,args){
			sendMessage(message,"pong");
		}
	},
	{
		name: "clip",
		arguments: null,
		description: "Deals with song clips. First option is action type: 'play', 'stop', 'list'  or 'describe'."
				+ " Second option is the clip name."
				+ "\n Example: " + prefix + "clip" + delimiter + " play" + delimiter + " diamonds",
		isAdminCommand: false,
		method: function(message,args){
			// Voice only works in guilds, if the message does not come from a guild,
  			// we ignore it
			if (!message.guild) return;
			if(args.length == 0){
				sendMessage(message,"Unable to process the 'clip' command with 0 arguments."		
							+ " Use '" + prefix + "help" + delimiter + "clip' to see correct syntax."
					);
				return;
			}

			let audioData = AudioHandler.getAudioData();
			let audioDataDictionary = AudioHandler.getAudioDataDictionary();
			
			let action = args[0].trim();

			if(action == 'play'){
				if(args.length != 2){
					sendMessage(message,"I am not sure what clip you would like me to play." 
								+ " Use '" + prefix + "help" + delimiter + "clip' to see correct syntax."
						);
				}else{
					let song = args[1].trim();
					if(audioDataDictionary[song]){	
						playClip(audioDataDictionary[song], message);
					}else{
						sendMessage(message,"Unable to find clip " + song);
					}
				}
			}else if(action == 'stop'){
				if(args.length != 1){
					sendMessage(message,"Incorrect command usage. Try: " + prefix + "clip" + delimiter + " " + action);
				}else{
					playClip(null, message);
				}
			}else if(action == 'list'){	
				if(args.length != 1){
					sendMessage(message,"Incorrect command usage. Try: " + prefix + "clip" + delimiter + " " + action);
				}else{
					sendMessage(message,Object.keys(audioDataDictionary));
				}
			}else if(action == 'describe'){
				if(args.length != 2){
					sendMessage(message,"I am not sure what clip you would like me to describe." 
								+ " Use '" + prefix + "help" + delimiter + "clip' to see correct syntax."
						);
				}else{
					let song = args[1].trim();
					if(audioDataDictionary[song]){
						sendMessage(message,song + ": " + audioDataDictionary[song].description);
					}else{
						sendMessage(message,"Unable to find clip " + song);
					}

				}
			}else{
				sendMessage(message,"Unknown argument " + action
					+ ". Could you mean '" + prefix + "clip" + delimiter + " play" + delimiter + " " + action + "' ?");
			}
		}
	},
	{
		name: "commandList",
		arguments: 0,
		description: "Lists all accessable commands.",
		isAdminCommand: false,
		method: function(message,args){
			let commandList = [];
			for(var i = 0; i < commands.length; i++){
				if(!commands[i].isAdminCommand){
					commandList.push(commands[i].name);
				}
			}
			commandList.sort();//sort alphabetically
			
			let commandsString = "Command List: \n";
			for(var i = 0; i < commandList.length; i++){
				commandsString += (i+1) + ")\t" + commandList[i] + "\n";
			}
			commandsString += "* Use " + prefix + "help with a command to see its description, and " + prefix + "syntax to view the current syntax for commands. *";
			sendMessage(message,commandsString);
		}
	},
	{
		name: "help",
		arguments: 1,
		description: "Explains what a certain command does. Example: " + prefix + "help" + delimiter + "ping.",
		isAdminCommand: false,
		method: function(message,args){
			var commandName = args[0].trim().toLowerCase();
			let failFlag = true;
			
			
			for(var i = 0; i < commands.length; i++){
				if(commands[i].name.toLowerCase() == commandName){
					sendMessage(message,commands[i].description);
					failFlag = false;
					break;
				}
			}

			if(failFlag){
				sendMessage(message,"No such command exists.");
			}
		}
	},
	{ 
		name: "roll",
		arguments: 1,
		description: "Rolls a die with x sides. Example: " + prefix + "roll" + delimiter + "6",
		isAdminCommand: false,
		method: function(message,args){
			var numberOfSides = args[0];
			sendMessage(message,"I rolled a " + (Math.floor(Math.random() * numberOfSides) + 1) + ".");
		}
	},
	{
		name: "avatar",
		arguments: 1,
		description: "Gets the avatar of the listed user. Example: " + prefix + "avatar" + delimiter + "@FisherBot#0187",
		isAdminCommand: false,
		method: function(message,args){
			if(message.mentions.users.first() != null){
				sendMessage(message,message.mentions.users.first().avatarURL);
			}else{
				sendMessage(message,"No user was mentioned. You can mention a user with @ + their username.");
			}
		}
	},
	{
		name: "timestamp",
		arguments: 0,
		description: "Gets the current timestamp.",
		isAdminCommand: false,
		method: function(message,args){
			sendMessage(message,timeStamp());
		}
	},
	{		
		name: "purge",
		arguments: 1,
		description: "Deletes a certain number of recent messages in the chat. Example: " + prefix + "purge" + delimiter +  "2",
		isAdminCommand: true,
		method: function(message,args){
			let numMessages = Math.abs(parseInt(args[0]))+1;
			if(numMessages > 20){
				sendMessage(message,"You may not purge more than 20 messages at once.");
			}else{
				message.channel.fetchMessages({limit: numMessages}).then(messages => message.channel.bulkDelete(messages));
			}
		}
	},
	{
		name: "remindme",
		arguments: 2,
		description: "Sends a user a reminder after x minutes. WARNING: WILL NOT REMIND YOU IF BOT IS UNDERGOING MAINTENANCE! Example: " + prefix + "remindme" + delimiter+ "10" + delimiter + "Wash the Dishes!",
		isAdminCommand: false,
		method: function(message,args){
			
			let numMins = parseFloat(args[0]);
			let remindMessage = args[1];
			if(numMins <= 35791){
				sendMessage(message,"You will be reminded in " + numMins + " minutes.");
				setTimeout(
					function(){
						message.reply(remindMessage);
					},
					numMins*60*1000//Mins->Seconds->Miliseconds
				);
			}else{
				sendMessage(message,"That is too many minutes!");
			}
		}
	},
	{
		name: "syntax",
		arguments: 0,
		description: "Displays the current syntax that Fisherbot uses.",
		isAdminCommand: false,
		method: function(message,args){
			sendMessage(message,"The current Delimiter is: \'" + delimiter + "\'\nThe current command prefix is: \'" + prefix + "\'\nExample: " + prefix + "roll" + delimiter + "6");
		}
	},
	{
		name: "flip",
		arguments: 0,
		description: "Flips a coin.",
		isAdminCommand: false,
		method: function(message,args){
			var rand = Math.random();
			if(rand > 0.5){
				sendMessage(message,"Heads");
			}else{
				sendMessage(message,"Tails");
			}
		}
	},
	{
		name: "getid",
		arguments: 0,
		description: "Gets the user's ID (mostly for debugging purposes)",
		isAdminCommand: false,
		method: function(message,args){
			sendMessage(message,"This ID for " + message.author.username + " is " + message.author.id);
		}
	},
	{
		name: "intown",
		arguments: 0,
		description: "Sets the user to be in town",
		isAdminCommand: false,
		method: function(message,args){
			if(!message.member.roles.has(message.guild.roles.find(x => x.name === "In Town").id)) {
				let roles = message.guild.roles;//message.author.addRole(role).catch(console.error);
				let roleIDs = Array.from(roles.keys());
				let newRoleArray = [];
				for(var i = 0; i < roleIDs.length; i++){
					let currentRole = roleIDs[i];
					if(message.member.roles.has(currentRole) && currentRole != message.guild.roles.find(x => x.name === "Out of Town").id){
						newRoleArray.push(currentRole + "");
					}
				}
				newRoleArray.push(message.guild.roles.find(x => x.name === "In Town").id);

				message.member.setRoles(newRoleArray);
				sendMessage(message,"You are now set to be 'In Town'");
			}else{
				sendMessage(message,"You are already set as 'In Town'");
			}
		}
	},
	{
		name: "outtown",
		arguments: 0,
		description: "Sets the user to be out of town",
		isAdminCommand: false,
		method: function(message,args){
			if(!message.member.roles.has(message.guild.roles.find(x => x.name === "Out of Town").id)) {
				let roles = message.guild.roles;//message.author.addRole(role).catch(console.error);
				let roleIDs = Array.from(roles.keys());
				let newRoleArray = [];
				for(var i = 0; i < roleIDs.length; i++){
					let currentRole = roleIDs[i];
					if(message.member.roles.has(currentRole) && currentRole != message.guild.roles.find(x => x.name === "In Town").id){
						newRoleArray.push(currentRole + "");
					}
				}
				newRoleArray.push(message.guild.roles.find(x => x.name === "Out of Town").id);

				message.member.setRoles(newRoleArray);
				sendMessage(message,"You are now set to be 'Out of Town'");
			}else{
				sendMessage(message,"You are already set as 'Out of Town'");
			}
		}
	},
	{
		name: "math",
		arguments: null,
		description: "Solves a math problem. Example: " + prefix + "math" + delimiter + " 2 + 2",
		isAdminCommand: false,
		method: function(message,args){
			let command = "";
			
			try{
				for(var i = 0; i < args.length; i++){
					command += args[i];
					if(i != args.length - 1){
						command += delimiter;
					}
				}
				sendMessage(message,command + " = " + Math.eval(command));
			} catch(err){
				sendMessage(message,"Unable to parse '" + command + "'");
			}
		}

	},
	{
		name: "purge",
		arguments: 1,
		description: "Deletes a certain number of recent messages in the chat. Example: " + prefix + "purge" + delimiter +  "2",
		isAdminCommand: true,
		method: function(message,args){
			let numMessages = Math.abs(parseInt(args[0]))+1;
			if(numMessages > 20){
				sendMessage(message,"You may not purge more than 20 messages at once.");
			}else{
				message.channel.fetchMessages({limit: numMessages}).then(messages => message.channel.bulkDelete(messages));
			}
		}
	},
	{
		name: "pin",
		arguments: 0,
		description: "Pins the message sent, which can be edited later",
		isAdminCommand: false,
		method: function(message, args){
			message.react('🤔');
			message.pin();
		}
	},
	{
		name: "chester",
		arguments: 0,
		description: "Plays a sounds from the chester soundboard",
		isAdminCommand: false,
		method: function(message, args){
			playChesterClip(message);
		}
	}
//	{
//		name: "testcommand",
//		arguments: 0,
//		description: "N/A",
//		isAdminCommand: false,
//		method: function(message,args){
//			sendMessage(message,"\u200F hey ");
//		}
//	}
];

function playClip(songData, message){
	if(message.member == null){
		sendMessage(message,"This command does not work unless it is in a server.");
		return;
	}
	ch = message.member.voiceChannel;
	
	if(songData == null){
		sendMessage(message,"This function is still in development.");
		return;
	}
	if(ch == null){
		sendMessage(message,"Please join a channel first.");
	}else{
		message.member.voiceChannel.join().then(connection => {
			let pathString = Path.resolve(__dirname, "../audio_clips/" + songData.file_name);
			let dispatcher = connection.playFile(pathString);
			dispatcher.on('error', e => {
				console.log(e);	
			});

			dispatcher.on('debug', msg => {
				console.log(msg);
			});

			dispatcher.on('end', ()=> {
				console.log("Clip has finished playing file " + pathString);
				if(message.member.voiceChannel){
					message.member.voiceChannel.leave();
				}
			});

			dispatcher.setVolume(1);
		}).catch(
			function(error){
				sendMessage(message,"I have encountered an error trying to play this clip. Please ask my developer to check the error logs.");
				console.log(error);
			}
		);
	}
}

function playChesterClip(message){
	if(message.member == null){
		sendMessage(message,"This command does not work unless it is in a server.");
		return;
	}
	ch = message.member.voiceChannel;
	if(ch == null){
		sendMessage(message,"Please join a channel first");
		return;
	}
	const chesterFolder = "../audio_clips/chester_sounds/";
	FS.readdir(Path.resolve(__dirname, chesterFolder), (err, files) => {
		if(err){
			console.log(err);
			sendMessage(message,"Unable to play chester clip, please ask the admin to check their logs.");
			return;
		}
		let chosenSong = files[Math.floor(Math.random()*files.length)];	
		message.member.voiceChannel.join().then(connection => {
			let pathString = Path.resolve(__dirname, chesterFolder + chosenSong);
			let dispatcher = connection.playFile(pathString);
			dispatcher.on('error', e => {
				console.log(e);	
			});

			dispatcher.on('debug', msg => {
				console.log(msg);
			});

			dispatcher.on('end', ()=> {
				console.log("Clip has finished playing chester file " + pathString);
				if(message.member.voiceChannel){
					message.member.voiceChannel.leave();
				}
			});

			dispatcher.setVolume(1);
		}).catch(
			function(error){
				sendMessage(message,"I have encountered an error trying to play this clip. Please ask my developer to check the error logs.");
				console.log(error);
			}
		);
	});
	
}

let sendMessage = (messageData, sendString) => {
	messageData.channel.send("```" + sendString + "```");
}

(function(){
	module.exports.getCommands = function(){
		return commands;
	}
}());
