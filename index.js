const { readFile } = require("node:fs/promises");

const mc = require("minecraft-protocol");

const { midiToSequence } = require("./midi");

const { SequencePlayer } = require("./sequence");

const { CommandProcessor } = require("./commands");

function __noteblock(i) {
  return {
    x: Math.floor(i / 6) + 276,
    y: 63,
    z: 73 - (i % 6),
  };
}

const player = new SequencePlayer({
  hit: (noteblock) => hit(client, __noteblock(noteblock)),
});

const client = mc.createClient({
  host: process.env.SERVER_HOST,
  port: process.env.SERVER_PORT,
  username: process.env.USERNAME,
});

function hit(client, location) {
  client.write("block_dig", {
    status: 0,
    location,
    face: 1,
  });

  client.write("arm_animation", {
    hand: Math.round(Math.random()),
  });
}

function msg(client, message) {
  client.write("chat", {
    message,
  });
}

client.on("packet", async function (packet, meta) {
  if (meta.name === "chat") {
    console.log(meta);
    console.log(packet);

    if (packet.sender === "00000000-0000-0000-0000-000000000000") return;

    const message = JSON.parse(packet.message);

    const text = message.with.at(-1).text;

    console.log(text);

    const m1 = text.match(/^\.play (.*)/);

    if (m1) {
      const sequences = midiToSequence(await readFile(m1[1] + ".mid"));
      player.playSequences(sequences);
      msg(client, "Now playing");
    }

    const m2 = text.match(/^\.stop/);

    if (m2) {
      player.stop();
      msg(client, "Stopped");
    }
  }
});

client.on("connect", function () {
  console.log("connected");
});
