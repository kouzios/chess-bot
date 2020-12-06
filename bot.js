const { Client, MessageEmbed, MessageAttachment } = require("discord.js");
var logger = require("winston");
const fetch = require("node-fetch");
var auth = require("./auth.json");
var gifFrames = require('gif-frames');

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

  switch (command) {
    case "chess":
      if (params.length != 0) {
        msg.reply(
          "Please specify only the !chess command and your linked game gif when summoning the bot, with no extra parameters"
        );
        return;
      }
    
      if (msg.attachments.size != 1) {
        msg.reply("Please ensure you have linked (only) your Chess gif file");
        return;
      }
    
      const url = msg.attachments.values().next().value.url;
      msg.attachments = null;
      const extension = url.match(/\.\w{3,4}($|\?)/g)[0];
      if (extension !== ".gif") {
        msg.reply(
          "Please ensure the file you linked is a Chess [.gif] file, not a [" +
            extension +
            "] file"
        );
        return;
      }
      msg.delete({timeout: 500});
      msg.reply("Chess command received, gif deleted to save channel space, creating game");
      chess(msg, url);
      break;
    default:
      return; //Do nothing if a command is sent not relating to our bot
  }
});

const chess = async (msg, url) => {
  //Break the provided gif into frames, then add them to a list to be iterated through as the user pleases
  const frameData = await gifFrames({ url, frames: 'all', outputType: 'jpg', cumulative: true });
  const image1 = (frameData[0].getImage())._obj;
  msg.channel.send(new MessageAttachment(image1))
};


bot.login(auth.token);
