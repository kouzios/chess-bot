const { Client, MessageEmbed, MessageAttachment } = require("discord.js");
var logger = require("winston");
const fetch = require("node-fetch");
var auth = require("./auth.json");
var gifFrames = require("gif-frames");

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console(), {
  colorize: true,
});
logger.level = "debug";

const bot = new Client({ disableEveryone: true });

var stored_message = null;
var index = 0;
var frameData = null;
var channel = null;

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
      msg.delete({ timeout: 1000 });
      msg.reply(
        "Chess command received. Chess command with gif attachment deleted. Please iterate through the chess game through the arrow emojis reacted below."
      );
      chess(msg, url);
      break;
    default:
      return; //Do nothing if a command is sent not relating to our bot
  }
});

const chess = async (msg, url) => {
  //Break the provided gif into frames, then add them to a list to be iterated through as the user pleases
  frameData = await gifFrames({
    url,
    frames: "all",
    outputType: "jpg",
    cumulative: true,
  });
  const initial_image = frameData[0].getImage()._obj;

  //Credit to https://github.com/TheTurkeyDev/Discord-Games for the emoji code
  msg.channel.send(new MessageAttachment(initial_image)).then((emsg) => {
    index = 0;
    channel = msg.channel;
    stored_message = emsg;
    stored_message.react("⬅️").then(() => stored_message.react("➡️"));

    emojiOnListen();
  });
};

//Credit to https://github.com/TheTurkeyDev/Discord-Games for the emoji code
const filter = (reaction, user) => {
  return (
    ["⬅️", "➡️"].includes(reaction.emoji.name) &&
    user.id !== stored_message.author.id
  );
};

//Credit to https://github.com/TheTurkeyDev/Discord-Games for the emoji code
const emojiOnListen = () => {
  stored_message //Only listen to author emoji reactions
    .awaitReactions((reaction, user) => filter(reaction, user), {
      max: 1,
      time: 3600000, //One hour til timeout
    })
    .then((collected) => {
      const reaction = collected.first();

      if (reaction.emoji.name === "⬅️" && index > 0) {
        index--;
      } else if (reaction.emoji.name === "➡️" && index < frameData.length) {
        index++;
      }

      const image = frameData[index].getImage()._obj;
      stored_message.delete();
      channel.send(new MessageAttachment(image)).then((emsg) => {
        stored_message = emsg;
        stored_message.react("⬅️").then(() => stored_message.react("➡️"));
        emojiOnListen();
      });
    })
    .catch((collection) => {
      stored_message.delete();
    });
};

bot.login(auth.token);
