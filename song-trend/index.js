const lyrics = [
  { time: 0, text: "TUNE JO DEKHA HAI 💖" },
  { time: 3000, text: "TUNE JO JANA HAI 💙" },
  { time: 6000, text: "HUN BHI NHI BHI HUN MAIN VO 🫶" },
  { time: 10000, text: "CHAHO GAY TUM JAISA 💓" },
  { time: 14000, text: "HO JAO GA VAISE CHAHO TO VADA YE LELO 💕" }
];
const box = document.getElementById("lyrics");
const audio = new Audio('song.mp3');

document.body.addEventListener('click', () => {
  box.innerHTML = ''; // "Click to start" hata de
  audio.currentTime = 189; // 3 min 9 sec se start
  audio.play();

  // Gaana bajne ke saath lyrics start karo
  lyrics.forEach(line => {
    setTimeout(() => {
      box.innerHTML = `<p>${line.text}</p>`; // Purani line hata ke nayi dikhao
    }, line.time);
  });

  // 20 sec baad band kar de
  setTimeout(() => {
    audio.pause();
    box.innerHTML = '<p class="start-text">Finished ❤️</p>';
  }, 20000);

}, { once: true });