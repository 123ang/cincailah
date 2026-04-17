import confetti from 'canvas-confetti';

export function fireConfetti() {
  const end = Date.now() + 1500;

  const colors = ['#DC2626', '#10B981', '#FACC15', '#3B82F6', '#8B5CF6'];

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}
