const moment = require('moment');
const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const format = require('./momentFormat');
const execute = require('lambduh-execute');

exports.handler = function(event, context, callback) { 
  // Auth token
  const token = process.env.AUTH_TOKEN;
  if (!token) {
    console.log('No auth token found, please set the AUTH_TOKEN environment variable.\n');
    process.exit();
  }

//THIS IS A DIRTY HACK TO ALLOW LAMBDA EXECUTE ACCESS TO THE BINARY
  // add temporary folder and task root folder to PATH
  process.env['PATH'] = process.env['PATH'] + ':/tmp/:' + process.env['LAMBDA_TASK_ROOT']

  var result = {}
   execute(result, {
     shell: "echo `ls /tmp/`", // logs output of /tmp/ dir on your lambda machine
     logOutput: true
   })
   .then(function(result) {
     console.log("MediaHelper tmp ls %s", result);
     return execute(result, {
       shell: "cp ./node_modules/ffmpeg-binaries/bin/ffmpeg /tmp/.; chmod 755 /tmp/ffmpeg", // copies an ffmpeg binary to /tmp/ and chmods permissions to run it
       logOutput: true
     })
   })
   .then(function(result) {
     console.log("MediaHelper ffmpeg copy %s", result);
     return execute(result, {
       shell: "cp ./node_modules/ffmpeg-binaries/bin/ffprobe /tmp/.; chmod 755 /tmp/ffprobe", // copies an ffmpeg binary to /tmp/ and chmods permissions to run it
       logOutput: true
     })
   })
   .then(function(result) {
     console.log("MediaHelper ffprobe copy %s", result);
     return execute(result, {
       shell: "echo `ls /tmp/`", // logs output of /tmp/ dir on your lambda machine
       logOutput: true
     })
   })
   .then(function(result) {
     console.log("MediaHelper tmp ls %s", result);
  })
   .fail(function(err) {
    console.log("MediaHelper: Failed executable setup %s",err);
  });
//END DIRTY HACK

  // Debug mode
  const debug = process.env.APP_DEBUG === 'true';

  // Handle graceful shutdowns
  function cleanup() {
    if (bot)
      bot.destroy();
    console.log('Bot shut down: ', moment(Date.now()).format(format));
    process.exit();
  }

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  // Init bot
  const bot = new Discord.Client();
  bot.on('ready', () => {
    console.log('Bot connected to Discord: ', moment(Date.now()).format(format));

    // Play streams using ytdl-core

    const streamOptions = { seek: 0, volume: 2 };
    const broadcast = bot.createVoiceBroadcast();

    const voiceChannel = bot.channels.find('name', 'Music');

    voiceChannel.join()
     .then(connection => {
      url = 'https://www.youtube.com/watch?v=sTt026NTQfE';
      // same as above but for the stream
       const stream = ytdl(url, { filter : 'audioonly' });

       broadcast.playStream(stream, streamOptions);
       const dispatcher = connection.playBroadcast(broadcast);
       dispatcher.on('error', console.error);
       dispatcher.on('warn', console.error);
     }).catch(console.error);

  });

  console.log('Bot started: ', moment(Date.now()).format(format));

  bot.login(token);
}