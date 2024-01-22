const { setTimeout: setTimeoutAsync } = require("node:timers/promises");
const { readFile } = require("node:fs/promises");

const mc = require("minecraft-protocol");

const { midiToSequence } = require("./midi");

const MIDI_NOTE_TO_NOTEBLOCK = [6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5];

function __noteblock(i) {
  return {
    x: Math.floor(i / 6) + 276,
    y: 63,
    z: 73 - (i % 6),
  };
}

function octaveTranspose(previous, octave) {
  if (octave !== previous[1]) {
    previous[0] = previous[1];
    previous[1] = octave;
  }

  return previous[1] > previous[0];
}

setTimeout(async () => {
  const song = midiToSequence(await readFile(process.env.MIDI_FILE))[0];

  const previous = Uint8Array.from([13, 13]);

  for (let i = 0; i < song.length; i += 2) {
    if (song[i] > 0) {
      await setTimeoutAsync(song[i]);
    }

    let noteblock = 0;

    const midiNote = song[i + 1] % 12;
    const octave = Math.floor(song[i + 1] / 12);

    const high = octaveTranspose(previous, octave);

    noteblock = MIDI_NOTE_TO_NOTEBLOCK[midiNote] + (high ? 12 : 0);

    if (midiNote === 6 && high) noteblock = 24;

    hit(client, __noteblock(noteblock));
  }
}, 4000);

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

client.on("packet", function (packet, meta) {
  if (meta.name === "position") {
    console.log(meta);
    console.log(packet);
    // currentPosition = packet;
  }
});

client.on("connect", function () {
  console.log("connected");
});
