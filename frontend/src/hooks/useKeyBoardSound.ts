let keyStrokeSounds: HTMLAudioElement[] | null = null;

const getKeyStrokeSounds = (): HTMLAudioElement[] => {
  if (!keyStrokeSounds) {
    keyStrokeSounds = [
      new Audio("/sounds/keystroke1.mp3"),
      new Audio("/sounds/keystroke2.mp3"),
      new Audio("/sounds/keystroke3.mp3"),
      new Audio("/sounds/keystroke4.mp3"),
    ];
  }
  return keyStrokeSounds;
};

const useKeyboardSound = () => {
  const playRandomKeyStrokeSound = () => {
    const sounds = getKeyStrokeSounds();
    const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
    if (!randomSound) return;
    randomSound.currentTime = 0;
    randomSound.play().catch(() => {});
  };

  return { playRandomKeyStrokeSound };
};

export default useKeyboardSound;
