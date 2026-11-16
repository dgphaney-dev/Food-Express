/**
 * Utilitário de Notificação Sonora para a Cozinha e Atendimento (KDS)
 * Utiliza a Web Audio API nativa para sintetizar uma sineta harmônica ("Ding-Dong" de restaurante)
 * Sem dependência de arquivos externos mp3/wav que poderiam falhar ao carregar.
 */

const AUDIO_ENABLED_KEY = 'foodexpress_kds_sound_enabled';

export function isSoundEnabled() {
  try {
    const val = localStorage.getItem(AUDIO_ENABLED_KEY);
    return val === 'true'; // Padrão MUDO / Sem som (false)
  } catch {
    return false;
  }
}

export function setSoundEnabled(enabled) {
  try {
    localStorage.setItem(AUDIO_ENABLED_KEY, String(enabled));
  } catch {
    // Ignore storage errors
  }
}

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Toca sineta agradável de 2 tons (Ding-Dong) para avisar de novos pedidos na cozinha
 */
export function playNewOrderChime() {
  if (!isSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Primeiro tom (Ding - 659.25 Hz - E5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Segundo tom harmônico (Dong - 880 Hz - A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.2, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.7);
  } catch {
    // Ignora restrições do navegador se o usuário ainda não tiver interagido com a tela
  }
}
