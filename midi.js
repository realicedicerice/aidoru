const MIDI_HEADER = Buffer.from([
  0x4d, 0x54, 0x68, 0x64, 0x00, 0x00, 0x00, 0x06,
]);

const TRACK_HEADER = Buffer.from([0x4d, 0x54, 0x72, 0x6b]);

const STATE_OUT_OF_TRACK = 1;
const STATE_IN_TRACK = 2;

// Accepts MIDI buffer and returns a note sequence array
// of type [delta in ms, midi note number, delta in ms, midi note number...]
function midiToSequence(contents) {
  if (!contents.subarray(0, 8).equals(MIDI_HEADER)) {
    throw new Error("Unexpected header (expected 4d 54 68 64 00 00 00 06)");
  }

  // tick per quarter note
  const tpqn = contents.readUInt16BE(12);
  // microseconds per quarter note
  let mpqn = 0;

  let offset = 14;
  let state = STATE_OUT_OF_TRACK;
  let trackEnd = 0;

  let prevEvent = 0;

  let timeCounter = 0;

  let sequence = [];
  const sequences = [];

  while (offset < contents.length) {
    switch (state) {
      case STATE_OUT_OF_TRACK:
        if (!contents.subarray(offset, offset + 4).equals(TRACK_HEADER)) {
          throw new Error(
            "Unexpected byte sequence at " + offset + " (expected MTrk)"
          );
        }

        trackEnd = offset + 8 + contents.readUInt32BE(offset + 4);
        state = STATE_IN_TRACK;
        offset += 8;
        break;
      case STATE_IN_TRACK:
        let delta = 0;

        do {
          delta = (delta << 7) + (contents[offset] & 0b01111111);
        } while (contents[offset++] & 0b10000000);

        const deltaMs = (delta / tpqn) * (mpqn / 1000);
        timeCounter += deltaMs;

        let event = contents[offset];

        if (event & 0b10000000) {
          offset++;
          prevEvent = event;
        } else {
          event = prevEvent;
        }

        if (event === 0xff) {
          const [metaEvent, length] = contents.subarray(offset, offset + 2);

          if (metaEvent === 0x51) {
            mpqn = contents.readUIntBE(offset + 2, 3);
          }

          offset += 2 + length;
        } else {
          if ((event & 0xf0) === 0x90 && contents[offset + 1] !== 0) {
            sequence.push(Math.floor(timeCounter), contents[offset]);

            timeCounter = 0;
          }

          if ((event & 0xf0) === 0xc0 || (event & 0xf0) === 0xd0) {
            offset += 1;
          } else {
            offset += 2;
          }
        }

        break;
    }

    if (offset >= trackEnd) {
      state = STATE_OUT_OF_TRACK;

      sequences.push(sequence);
      sequence = [];
      timeCounter = 0;
    }
  }

  return sequences;
}

exports.midiToSequence = midiToSequence;
