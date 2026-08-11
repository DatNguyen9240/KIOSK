/**
 * PARKING KIOSK — AUDIO SOUND EFFECTS & VOICE ANNOUNCER SERVICE
 * Uses Web Audio API for zero-dependency crystal-clear 2-tone "Ting-Ting" chimes
 * combined with Web Speech API for Vietnamese voice announcements ("Cảm ơn quý khách!").
 */

class SoundService {
  constructor() {
    this.audioCtx = null;
  }

  getAudioContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Plays a pleasant 2-tone "Ting-Ting! 🔔" chime sound.
   */
  playTingTing() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // --- TONE 1 ("Ting" - E6 1318Hz) ---
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1318.51, now); // E6 note

      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.3, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.3);

      // --- TONE 2 ("Ting" - B6 1975Hz) ---
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1975.53, now + 0.12); // B6 note

      gain2.gain.setValueAtTime(0, now + 0.12);
      gain2.gain.linearRampToValueAtTime(0.4, now + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(now + 0.12);
      osc2.stop(now + 0.6);
    } catch (err) {
      console.warn('[SoundService] Web Audio API not available:', err);
    }
  }

  /**
   * Announces a voice message in Vietnamese (e.g. "Cảm ơn quý khách!").
   * @param {string} text - Message text
   */
  speakText(text = "Thanh toán thành công. Cảm ơn quý khách!") {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Stop any previous speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'vi-VN';
        utterance.rate = 1.0;
        utterance.pitch = 1.1;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.warn('[SoundService] Speech Synthesis error:', err);
    }
  }

  /**
   * Triggers full Payment Success audio sequence: Ting-Ting chime + Voice Announcement!
   */
  playPaymentSuccessSequence(customVoiceText = "Thanh toán thành công! Cảm ơn quý khách!") {
    this.playTingTing();
    setTimeout(() => {
      this.speakText(customVoiceText);
    }, 400);
  }
}

export const soundService = new SoundService();
