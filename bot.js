const { Client, MessageEmbed } = require("discord.js");
var logger = require("winston");
const fetch = require("node-fetch");

var auth = require("./auth.json");

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console(), {
  colorize: true,
});
logger.level = "debug";

const bot = new Client({ disableEveryone: true });

bot.on("ready", () => {
  logger.info("Connected");
});

/**
 * Handles whenever a message is sent into the discord server, irrespective of channels
 */
bot.on("message", async (msg) => {
  var command = "";
  var params = "";
  const content = msg.content;
  if (msg.author.bot || !content.startsWith("!")) return;

  var args = content.substr(1); // Strip away !

  //If there's a given parameter
  if (args.indexOf(" ") != -1) {
    command = args.substr(0, args.indexOf(" ")); // Break off param
    params = args.substr(args.indexOf(" ") + 1); //Break off command
    params = params.split(" ");
  } else {
    command = args;
  }

  /* Change this block to individual if later commands need different parameter styles */
  if (params.length != 0) {
    msg.reply(
      "Please specify only the !chess command and your linked game file when summoning the bot, with no extra parameters"
    );
    return;
  }

  if (msg.attachments.size != 1) {
    msg.reply("Please ensure you have linked (only) your Chess pgn game file");
    return;
  }

  const url = msg.attachments.values().next().value.url;
  const extension = url.match(/\.\w{3,4}($|\?)/g)[0];
  if (extension !== ".pgn") {
    msg.reply(
      "Please ensure the file you linked is a Chess [.pgn] file, not a [" +
        extension +
        "] file"
    );
    return;
	}
  /* End param block */

  switch (command) {
    case "chess":
      chess(msg, url);
      break;
    default:
      return; //Do nothing if a command is sent not relating to our bot
  }
});

const chess = async (msg, url) => {
	//Get match data from provided Discord file, and then parse through it
	const res = await fetch(url);
	const buffer = await res.buffer();
	const fileContents = buffer.toString();
	const output = parseMatchData(fileContents);
	
	const embed = new MessageEmbed()
		.setTitle("Chess Board [TODO]")
		.setColor(0xff0000)
		.setDescription(output);

	msg.channel.send(embed);
};

const parseMatchData = (fileContents) => {
	//Split the data into two sections, the match info and the match plays
	let data = fileContents.split("\n");
	const info = data.splice(0, 13);
	data.shift();//Remove empty new space entry
	let match = data.join('');

	console.log(info);
	console.log(match);
	return match;
}

bot.login(auth.token);
