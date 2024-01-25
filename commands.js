const { EventEmitter } = require("node:events");

class CommandProcessor extends EventEmitter {}

exports.CommandProcessor = CommandProcessor;
