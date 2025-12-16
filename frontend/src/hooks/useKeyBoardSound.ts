const keyStrokeSounds = [
  new Audio("/sounds/keystroke1.mp3"),
  new Audio("/sounds/keystroke2.mp3"),
  new Audio("/sounds/keystroke3.mp3"),
  new Audio("/sounds/keystroke4.mp3"),
];

const useKeyboardSound = () => {
  const playRandomKeyStrokeSound = () => {
    const randomSound = keyStrokeSounds[Math.floor(Math.random() * keyStrokeSounds.length)];

    if (!randomSound) return;

    randomSound.currentTime = 0;
    randomSound.play().catch((error) => console.log("Audio play failed:", error));
  };

  return { playRandomKeyStrokeSound };
}

export default useKeyboardSound;