// src/utils/tts.ts
import Tts from 'react-native-tts';

type Off = () => void;

/** สมัคร TTS listener แบบรองรับทั้ง API เก่า/ใหม่ และคืน off() สำหรับ cleanup */
export function addTtsListener(
  event: 'tts-start' | 'tts-finish' | 'tts-cancel' | string,
  handler: (...args: any[]) => void,
): Off {
  const sub: any = (Tts as any).addEventListener(event, handler);
  return () => {
    if (sub && typeof sub.remove === 'function') {
      try {
        sub.remove();
      } catch {}
      return;
    }
    if (typeof (Tts as any).removeEventListener === 'function') {
      try {
        (Tts as any).removeEventListener(event, handler);
      } catch {}
    }
  };
}

/**
 * สั่งพูดพร้อม watchdog: ถ้าเครื่องไม่ยิง tts-finish/cancel จะปลดล็อกเองด้วย timeout
 * - onStart: เรียกเมื่อเริ่มพูด
 * - onDone : เรียกเมื่อพูดจบ (finish/cancel/timeout)
 */
export function speakWithWatchdog(
  text: string,
  onStart: () => void,
  onDone: () => void,
  timeoutMs: number = 8000,
) {
  let finished = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const finish = () => {
    if (finished) return;
    finished = true;
    if (timer) clearTimeout(timer);
    offStart();
    offFinish();
    offCancel();
    onDone();
  };

  const offStart = addTtsListener('tts-start', () => {});
  const offFinish = addTtsListener('tts-finish', finish);
  const offCancel = addTtsListener('tts-cancel', finish);

  try {
    onStart();
    Tts.speak(text);
  } catch {
    finish();
    return;
  }

  // timeout สำรอง หาก finish/cancel ไม่มา
  const minT = 3500;
  const maxT = 12000;
  const est = Math.max(minT, Math.min(maxT, text.length * 120));
  timer = setTimeout(finish, timeoutMs || est);
}
