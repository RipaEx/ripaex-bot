const botSettings = require("./botsettings.json");
const Discord = require('discord.js');

var request = require('request');
var rp = require('request-promise');

Number.prototype.formatMoney = function(c, d, t){
    var n = this, 
    c = isNaN(c = Math.abs(c)) ? 2 : c, 
    d = d == undefined ? "." : d, 
    t = t == undefined ? "," : t, 
    s = n < 0 ? "-" : "", 
    i = String(parseInt(n = Math.abs(Number(n) || 0).toFixed(c))), 
    j = (j = i.length) > 3 ? j % 3 : 0;
   return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
 };

const client = new Discord.Client({disableEveryone: true});

////////////////////////////////

client.on('ready', () => {
    console.log('Bot is running: ' + client.user.username);
	client.channels.find("name", botSettings.channel).send('***' + client.user.username + '***' + '  joined the channel.');
});

client.on('disconnect', () => {
    console.log('Bot is leaving: ' + client.user.username);
	client.channels.find("name", botSettings.channel).send('***' + client.user.username + '***' + '  left the channel.');
});

client.on('message', message => {
	// Don't message if it is the bot itself or if via a direct message
	if (message.author.bot || message.channel.type === 'dm') return; 
	
	let messageArray = message.content.split(' '); // Split with space
	let command = messageArray[0];
	let args = messageArray.slice(1);
	
	let input1 = messageArray[1];
	let input2 = messageArray[2];
	
	// Don't message if not starting with a ! prefix
	if (!command.startsWith(botSettings.prefix)) return; 
	
	// Only allow these commands in the set channel
	if (message.channel.name === botSettings.channel) {
		
		// !help (Gets the help commands)
		if (command === botSettings.prefix + 'help') {
			let embed = new Discord.RichEmbed();

			embed.setDescription('Here are the available commands :information_source: \n\n' +
			'**!links** Gets helpful links\n' +
			'**!whitepaper** Gets the whitepaper links\n' +
			'**!wallet** Gets the wallet links\n\n' +
			
			'**!balance (address)** Gets the balance of an address\n' +
			'**!delegatebalance (username)** Gets the balance of a delegate\n\n' +
			
			'**!supply** Gets the current total supply of XPX\n' +
			'**!height** Gets the current block height\n' +
			'**!lastblock** Gets the last block forged\n' +
			'**!nextforgers** Gets the next delegates to forge\n\n' +
			
			'**!delegatescount** Gets the amount of delegates on the network\n' +
			'**!delegate (username)** Gets a delegates information\n\n' +
			
			'**!mostweight** Gets the top 10 forgers by vote weight\n' +
			'**!mostproductive** Gets the top 10 forgers by productivity\n' +
			'**!mostblocks** Gets the top 10 forgers by produced blocks from the forging 101\n' +
			'**!mostmissed** Gets the 10 forgers with the most missed blocks from the forging 101\n' +
			'**!leastweight** Gets the 10 lowest ranked forgers by vote weight from the forging 101\n' +
			'**!leastproductive** Gets the 10 least productive forgers from the forging 101\n' +
			'**!requiredweight** Gets the lowest voting weight required to forge');

			message.channel.send(embed);
		}

		// !delegatescount (Gets the amount of delegates on the network)
		if (command === botSettings.prefix + 'delegatescount') {
			request('https://api.ripaex.io/api/delegates/count', function (error, response, body) {
			  if (!error && response.statusCode == 200) {
				var jsonContent = JSON.parse(body);
				var count = parseInt(jsonContent.count);
				var standby = count - 101;
				let embed = new Discord.RichEmbed().setDescription('There are ' + count + ' Delegates, 101 Forging and ' + standby + ' Standby')
				message.channel.send(embed);
			  } else { console.log('Error: Could not retrieve the data') }
			})
		}
		
		// !supply (Gets the current total supply of XPX)
		if (command === botSettings.prefix + 'supply') {
			request('https://api.ripaex.io/api/blocks/getSupply', function (error, response, body) {
			  if (!error && response.statusCode == 200) {
				var jsonContent = JSON.parse(body);
				var supply = parseInt(jsonContent.supply);
				supply = (supply / 100000000).formatMoney(0, '.', ',');
				let embed = new Discord.RichEmbed().setDescription('The current Supply is ' + supply + ' XPX')
				message.channel.send(embed);
			  } else { console.log('Error: Could not retrieve the data') }
			})
		}
		
		// !height (Gets the current block height)
		if (command === botSettings.prefix + 'height') {
			request('https://api.ripaex.io/api/blocks/getHeight', function (error, response, body) {
			  if (!error && response.statusCode == 200) {
				var jsonContent = JSON.parse(body);
				var height = parseInt(jsonContent.height);
				height = (height).formatMoney(0, '.', ',');
				let embed = new Discord.RichEmbed().setDescription('The current Block Height is ' + height)
				message.channel.send(embed);
			  } else { console.log('Error: Could not retrieve the data') }
			})
		}
		
		// !lastblock (Gets the last block forged)
		if (command === botSettings.prefix + 'lastblock') {
			request('https://api.ripaex.io/api/blocks/getHeight', function (error, response, body) {
			  if (!error && response.statusCode == 200) {
				var jsonContent = JSON.parse(body);
				var id = jsonContent.id;
				let embed = new Discord.RichEmbed().setDescription('The last block was: https://explorer.ripaex.io/block/' + id)
				message.channel.send(embed);
			  } else { console.log('Error: Could not retrieve the data') }
			})
		}
		
		// !nextforgers (Gets the next delegates to forge)
		if (command === botSettings.prefix + 'nextforgers') {
			rp({
				method: 'GET',
				uri: 'https://api.ripaex.io/api/delegates/getNextForgers',
				json: true 
			}).then(function(jsonContent) {
				var delegates = jsonContent.delegates,
					promises = [];

				for (i = 0; i < delegates.length; ++i) {
					promises.push(rp({
						url: String('https://api.ripaex.io/api/delegates/get?publicKey=' + delegates[i]),
						json: true
					}).then(function(jsonContent2) {
						return jsonContent2.delegate.username;
					}));
				}

				return Promise.all(promises).then(function(resultsArray) {
					let embed = new Discord.RichEmbed().setDescription('The next to forge are ' + resultsArray.join(', '))
					message.channel.send(embed);
				});
				
			}).catch(function(err){
				console.log('Error: Could not retrieve the data')
			});
		}
		
		// !delegate (Gets a delegates info) (!delegate bluedragon)
		if (command === botSettings.prefix + 'delegate') {
			if (typeof input1 !== "undefined") {
			
				request('https://api.ripaex.io/api/delegates/get?username=' + (input1).toLowerCase(), function (error, response, body) {
					if (!error && response.statusCode == 200) {
						var jsonContent = JSON.parse(body);
						
						if (jsonContent.success === true) {
						
							var publickey = jsonContent.delegate.publicKey;
							var promises = [];

							promises.push(new Promise(function(resolve, reject) {
								request(String('https://api.ripaex.io/api/delegates/forging/getForgedByAccount?generatorPublicKey=' + publickey), function (error, response, body) {
									if (!error && response.statusCode == 200) {
										var jsonContent2 = JSON.parse(body);
										resolve(jsonContent2);
									}else{
										reject(error);
									}
								})
							}))
							
							promises.push(new Promise(function(resolve, reject) {
								request('https://api.ripaex.io/api/delegates/voters?publicKey=' + publickey, function (error, response, body) {
									if (!error && response.statusCode == 200) {
										var jsonContent3 = JSON.parse(body);
										resolve(jsonContent3);
									}else{
										reject(error);
									}
								})
							}))

							Promise.all(promises).then(function(resultsArray){
								let embed = new Discord.RichEmbed()
								.setDescription('**Delegate:** ' + jsonContent.delegate.username + '\n' +
								'**Rank:** ' + jsonContent.delegate.rate + '\n' +
								'**Vote Weight:** ' + (jsonContent.delegate.vote / 100000000).formatMoney(2, '.', ',') + ' XPX' + '\n' +
								'**Produced Blocks:** ' + jsonContent.delegate.producedblocks + '\n' +
								'**Missed Blocks:** ' + jsonContent.delegate.missedblocks + '\n' +
								'**Approval:** ' + jsonContent.delegate.approval + '%' + '\n' +
								'**Productivity:** ' + jsonContent.delegate.productivity + '%' + '\n' +
								'**Forged:** ' + (resultsArray[0].forged / 100000000).formatMoney(2, '.', ',') + ' XPX' + '\n' +
								'**Voters:** ' + resultsArray[1].accounts.length)
								message.channel.send(embed);
							}).catch(function(err){ // Handle errors 
							});
						
						} else {
								let embed = new Discord.RichEmbed()
								.setDescription('The delegate was not found')
								message.channel.send(embed);
						}

					} else {
						console.log('Error: Could not retrieve the data')
					}
				});
			}
		}
		
		// !balance (Gets the balance of an address) (!balance PMmnq5Gvq7P4KmYdCLQsyLmSNMit22caKg)
		if (command === botSettings.prefix + 'balance') {
			if (typeof input1 !== "undefined") {
				request('https://api.ripaex.io/api/accounts/getBalance?address=' + input1, function (error, response, body) {
				  if (!error && response.statusCode == 200) {
					var jsonContent = JSON.parse(body);
					if (jsonContent.success === true) {
						var balance = (jsonContent.balance / 100000000).formatMoney(2, '.', ',');
						let embed = new Discord.RichEmbed()
						.setDescription('**' + input1 + '**' + ' has ' + balance + ' XPX')
						message.channel.send(embed);
					} else {
							let embed = new Discord.RichEmbed()
							.setDescription('The address was not found')
							message.channel.send(embed);
					}
				  } else { console.log('Error: Could not retrieve the data') }
				})
			}
		}
		
		// !delegatebalance (Gets the balance of a delegate) (!delegatebalance bluedragon)
		if (command === botSettings.prefix + 'delegatebalance') {
			if (typeof input1 !== "undefined") {
				request('https://api.ripaex.io/api/delegates/get?username=' + (input1).toLowerCase(), function (error, response, body) {
				  if (!error && response.statusCode == 200) {
					var jsonContent = JSON.parse(body);
					if (jsonContent.success === true) {
						var address = jsonContent.delegate.address;
						request('https://api.ripaex.io/api/accounts/getBalance?address=' + address, function (error, response, body) {
							if (!error && response.statusCode == 200) {
								var jsonContent2 = JSON.parse(body);
								var balance = (jsonContent2.balance / 100000000).formatMoney(2, '.', ',');
								let embed = new Discord.RichEmbed()
								.setDescription('**' + (input1).toLowerCase() + '**' + ' has ' + balance + ' XPX')
								message.channel.send(embed);
							} else { console.log('Error: Could not retrieve the data') }
						})
					} else {
							let embed = new Discord.RichEmbed()
							.setDescription('The delegate was not found')
							message.channel.send(embed);
					}
				  } else { console.log('Error: Could not retrieve the data') }
				})
			}
		}
		
		// !mostweight (Gets the top 10 forgers by vote weight)
		if (command === botSettings.prefix + 'mostweight') {
			request('https://api.ripaex.io/api/delegates?limit=10&offset=0&orderBy=vote', function (error, response, body) {
			  if (!error && response.statusCode == 200) {
				var jsonContent = JSON.parse(body);
				var delegates = jsonContent.delegates;
				let embed = new Discord.RichEmbed();
				embed.setDescription('__Most Vote Weight Rankings__ :arrow_up_small:');
				for (let key in delegates) {
					var weight = (delegates[key].vote / 100000000).formatMoney(2, '.', ',');
					embed.addField('#' + (parseInt(key) + 1) + ' Delegate: ' + delegates[key].username, 'Vote Weight: ' + weight + ' XPX');
				}
				message.channel.send(embed);
			  } else { console.log('Error: Could not retrieve the data') }
			})
		}
		
		// !mostproductive (Gets the top 10 forgers by vote productivity)
		if (command === botSettings.prefix + 'mostproductive') {
			request('https://api.ripaex.io/api/delegates?limit=10&offset=0&orderBy=productivity', function (error, response, body) {
			  if (!error && response.statusCode == 200) {
				var jsonContent = JSON.parse(body);
				var delegates = jsonContent.delegates;
				let embed = new Discord.RichEmbed();
				embed.setDescription('__Most Productivity Rankings__ :arrow_up_small:');
				for (let key in delegates) {
					var productivity = delegates[key].productivity;
					embed.addField('#' + (parseInt(key) + 1) + ' Delegate: ' + delegates[key].username, 'Productivity: ' + productivity + '%');
				}
				message.channel.send(embed);
			  } else { console.log('Error: Could not retrieve the data') }
			})
		}

		// !mostblocks (Gets the top 10 forgers by produced blocks from the forging 101)
		if (command === botSettings.prefix + 'mostblocks') {
			request('https://api.ripaex.io/api/delegates?limit=101&offset=0&orderBy=vote', function (error, response, body) {
			  if (!error && response.statusCode == 200) {
				var jsonContent = JSON.parse(body);
				var delegates = jsonContent.delegates;
				let embed = new Discord.RichEmbed();
				embed.setDescription('__Most Produced Blocks Rankings__ :arrow_up_small:');
				var del = [[]];
				for (let key in delegates) {
					del.push([delegates[key].username, delegates[key].producedblocks]);
				}
				del.sort(function(a, b) {
					return b[1] - a[1]
				})
				for (i = 1; i < 11; ++i) {
					embed.addField('#' + (parseInt(i)) + ' Delegate: ' + del[i][0], 'Produced Blocks: ' + del[i][1]);
				}
				message.channel.send(embed);
			  } else { console.log('Error: Could not retrieve the data') }
			})
		}
		
		// !mostmissed (Gets 10 forgers by most missed blocks from the forging 101)
		if (command === botSettings.prefix + 'mostmissed') {
			request('https://api.ripaex.io/api/delegates?limit=101&offset=0&orderBy=vote', function (error, response, body) {
			  if (!error && response.statusCode == 200) {
				var jsonContent = JSON.parse(body);
				var delegates = jsonContent.delegates;
				let embed = new Discord.RichEmbed();
				embed.setDescription('__Most Missed Blocks__ :small_red_triangle_down:');
				var del = [[]];
				for (let key in delegates) {
					del.push([delegates[key].username, delegates[key].missedblocks]);
				}
				del.sort(function(a, b) { 
					return b[1] - a[1]
				})
				for (i = 1; i < 11; ++i) {
					embed.addField('#' + (parseInt(i)) + ' Delegate: ' + del[i][0], 'Missed Blocks: ' + del[i][1]);
				}
				message.channel.send(embed);
			  } else { console.log('Error: Could not retrieve the data') }
			})
		}
		
		// !leastproductive (Gets the 10 least productive forgers from the forging 101)
		if (command === botSettings.prefix + 'leastproductive') {
			request('https://api.ripaex.io/api/delegates?limit=101&offset=0&orderBy=vote', function (error, response, body) {
			  if (!error && response.statusCode == 200) {
				var jsonContent = JSON.parse(body);
				var delegates = jsonContent.delegates;
				let embed = new Discord.RichEmbed();
				embed.setDescription('__Least Productive__ :small_red_triangle_down:');
				var del = [[]];
				for (let key in delegates) {
					del.push([delegates[key].username, delegates[key].productivity]);
				}
				del.sort(function(a, b) { 
					return a[1] - b[1]
				})
				for (i = 1; i < 11; ++i) {
					embed.addField('#' + (parseInt(i)) + ' Delegate: ' + del[i][0], 'Productivity: ' + del[i][1] + '%');
				}
				message.channel.send(embed);
			  } else { console.log('Error: Could not retrieve the data') }
			})
		}
		
		// !leastweight (Gets the lowest 10 forgers by vote weight from the forging 101)
		if (command === botSettings.prefix + 'leastweight') {
			request('https://api.ripaex.io/api/delegates?limit=101&offset=0&orderBy=vote', function (error, response, body) {
			  if (!error && response.statusCode == 200) {
				var jsonContent = JSON.parse(body);
				var delegates = jsonContent.delegates;
				let embed = new Discord.RichEmbed();
				embed.setDescription('__Least Vote Weight__ :small_red_triangle_down:');
				var del = [[]]; 
				for (let key in delegates) {
					del.push([delegates[key].username, delegates[key].vote]);
				}
				del.sort(function(a, b) { 
					return a[1] - b[1]
				})
				for (i = 1; i < 11; ++i) {
					embed.addField('#' + (parseInt(i)) + ' Delegate: ' + del[i][0], 'Vote Weight: ' + (del[i][1]  / 100000000).formatMoney(2, '.', ',') + ' XPX');
				}
				message.channel.send(embed);
			  } else { console.log('Error: Could not retrieve the data') }
			})
		}
		
		// !requiredweight (Gets the lowest voting weight required to forge)
		if (command === botSettings.prefix + 'requiredweight') {
			request('https://api.ripaex.io/api/delegates?limit=101&offset=0&orderBy=vote', function (error, response, body) {
			  if (!error && response.statusCode == 200) {
				var jsonContent = JSON.parse(body);
				var delegates = jsonContent.delegates;
				var del = [[]]; // Create a multi dimensional array
				for (let key in delegates) {
					del.push([delegates[key].username, delegates[key].vote]);
				}
				del.sort(function(a, b) { // Sort multi dimensional array (Ascending order)
					return a[1] - b[1]
				})
				let embed = new Discord.RichEmbed();
				embed.setDescription(((del[1][1]  / 100000000) + 1).formatMoney(0, '.', ',') + ' XPX Vote Weight is required to forge');
				message.channel.send(embed);
			  } else { console.log('Error: Could not retrieve the data') }
			})
		}
		
		// !whitepaper (Gets the whitepaper links)
		if (command === botSettings.prefix + 'whitepaper') {
			let embed = new Discord.RichEmbed();
			embed.setDescription('**Whitepaper (EN):**\n https://github.com/RipaEx/whitepaper/raw/master/eng/RipaEx_WP_EN.pdf \n' +
				'**Executive Summary (EN):**\n https://github.com/RipaEx/whitepaper/raw/master/es_EN/RipaEx_ES_EN.pdf \n' +
				'**Whitepaper Repository:**\n https://github.com/RipaEx/whitepaper');
			message.channel.send(embed);
		}
		
		// !wallet (Gets the wallet links)
		if (command === botSettings.prefix + 'wallet') {
			let embed = new Discord.RichEmbed();
			embed.setDescription('**Desktop Wallet:**\n https://github.com/RipaEx/ripa-desktop/releases \n' +
				'**Mobile Wallet:**\n https://play.google.com/store/apps/details?id=io.ripa.wallet.mobile \n' +
				'**Web Wallet:**\n https://wallet.ripaex.io');
			message.channel.send(embed);
		}
		
		// !links (Gets the important links)
		if (command === botSettings.prefix + 'links') {
			let embed = new Discord.RichEmbed();
			embed.setDescription('**Website:** https://ripaex.io \n' +
				'**Forum:** https://forum.ripaex.io \n\n' +
				'**Bitcointalk ANN:** https://bitcointalk.org/index.php?topic=3759172 \n' +
				'**Bitcointalk Bounty:** https://bitcointalk.org/index.php?topic=4447278.0 \n\n' +
				'**Facebook:** https://facebook.com/ripaex \n' +
				'**Twitter:** https://twitter.com/ripaex \n' +
				'**Steemit:** https://steemit.com/@ripaex \n' +
				'**Reddit:** https://reddit.com/r/RipaEx \n' +
				'**Telegram:** https://t.me/ripaex \n\n' +
				'**GitHub:** https://github.com/RipaEx \n' +
				'**Gitter:** https://gitter.im/RipaEx/RipaEx');
			message.channel.send(embed);
		}
		
	};
	
});

client.login(botSettings.token);
