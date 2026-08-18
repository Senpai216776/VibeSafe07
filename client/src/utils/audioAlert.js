// Web Audio API emergency alarm generator (Zero external dependencies)
class EmergencyAudio {
  constructor() {
    this.audioCtx = null;
    this.oscillator1 = null;
    this.oscillator2 = null;
    this.gainNode = null;
    this.isPlaying = false;
    this.intervalId = null;
    this.isMuted = false;
    this.volume = 0.5;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (muted && this.isPlaying) {
      this.stop();
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(this.volume * 0.3, this.audioCtx ? this.audioCtx.currentTime : 0);
    }
  }

  playSiren() {
    if (this.isMuted || this.isPlaying) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      this.isPlaying = true;
      let toneHigh = true;

      const playTone = () => {
        if (!this.isPlaying || this.isMuted) return;

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(toneHigh ? 960 : 720, this.audioCtx.currentTime);

        gain.gain.setValueAtTime(this.volume * 0.25, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.38);

        toneHigh = !toneHigh;
      };

      playTone();
      this.intervalId = setInterval(playTone, 420);
    } catch (err) {
      console.warn('Could not play emergency audio:', err);
    }
  }

  playSingleChime() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.audioCtx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, this.audioCtx.currentTime + 0.15); // E6

      gain.gain.setValueAtTime(this.volume * 0.3, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.5);
    } catch (err) {
      console.warn('Audio chime error:', err);
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const emergencyAudio = new EmergencyAudio();
