const { setTimeout: setTimeoutAsync } = require("node:timers/promises");

function octaveTranspose(previous, octave) {
  if (octave !== previous[1]) {
    previous[0] = previous[1];
    previous[1] = octave;
  }

  return previous[1] > previous[0];
}

class SequencePlayer {
  constructor(blockInterface) {
    this.playing = false;

    this.previous = Uint8Array.from([13, 13]);

    this.blockInterface = blockInterface;
  }

  async playSequences(sequences) {
    if (this.playing) {
      return false;
    }

    this.playing = true;

    return await Promise.all(sequences.map((s) => this.playSequence(s)));
  }

  async playSequence(sequence) {
    for (let i = 0; i < sequence.length; i += 2) {
      if (!this.playing) {
        return;
      }

      if (sequence[i] > 0) {
        await setTimeoutAsync(sequence[i]);
      }

      let noteblock = 0;

      const note = (sequence[i + 1] + 6) % 12;
      const octave = Math.floor(sequence[i + 1] / 12);
      const high = octaveTranspose(this.previous, octave);

      noteblock = note + (high ? 12 : 0);

      if (note === 0 && high) noteblock = 24;

      this.blockInterface.hit(noteblock);
    }
  }

  stop() {
    this.playing = false;
  }
}

exports.SequencePlayer = SequencePlayer;
