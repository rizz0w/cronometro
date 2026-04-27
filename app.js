// cosos del dom
const timerDisplay = document.getElementById("timer");
const btnStart = document.getElementById("btn-start");
const btnReset = document.getElementById("btn-reset");

// parte de los modals
const presentationModal = document.getElementById("presentation-modal");
const displaySpeaker = document.getElementById("display-speaker");
const displayOrigin = document.getElementById("display-origin");
const displayTopic = document.getElementById("display-topic");
const displaySong = document.getElementById("display-song");
const btnCloseModal = document.getElementById("btn-close-modal");

const btnToggleSettings = document.getElementById("btn-toggle-settings");
const settingsPanel = document.getElementById("settings-panel");
const inputSpeaker = document.getElementById("input-speaker");
const inputOrigin = document.getElementById("input-origin");
const inputTopic = document.getElementById("input-topic");
const inputSong = document.getElementById("input-song");
const inputMinutes = document.getElementById("input-minutes");
const btnShowInfo = document.getElementById("btn-show-info");
const btnCloseSettings = document.getElementById("btn-close-settings");

// cosos del cronometro
let startTime;
let updatedTime;
let tInterval;
let running = false;
let pausedTime = 0;
let totalTimeMs = 5 * 60 * 1000; // Valor por defecto

// inicializa los datos pa q los muestre en el ashete eme ele
function initDisplay() {
  let mins = parseInt(inputMinutes.value) || 0;
  totalTimeMs = mins * 60 * 1000;
  timerDisplay.innerHTML = formatTime(totalTimeMs);
  timerDisplay.classList.remove("negative");
}

// Formatear tiempo a MM:SS
function formatTime(ms) {
  const isNegative = ms < 0;
  const absMs = Math.abs(ms);
  const totalSeconds = Math.floor(absMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(seconds).padStart(2, "0");

  return `${isNegative ? "-" : ""}${formattedMinutes}:${formattedSeconds}`;
}

function updateTimer() {
  updatedTime = new Date().getTime();

  let elapsed = updatedTime - startTime + pausedTime;
  let difference = totalTimeMs - elapsed;

  timerDisplay.innerHTML = formatTime(difference);

  if (difference < 0) {
    timerDisplay.classList.add("negative");
  } else {
    timerDisplay.classList.remove("negative");
  }
}

// Controles del Cronómetro
btnStart.addEventListener("click", () => {
  if (!running) {
    startTime = new Date().getTime();
    tInterval = setInterval(updateTimer, 200);
    running = true;
    btnStart.disabled = true;
    btnStart.style.opacity = "0.5";
    btnStart.style.cursor = "not-allowed";
  }
});

// resetea el tiempo al especificado dentro de los controles de tiempo
btnReset.addEventListener("click", () => {
  clearInterval(tInterval);
  running = false;
  pausedTime = 0;
  btnStart.disabled = false;
  btnStart.style.opacity = "1";
  btnStart.style.cursor = "pointer";
  initDisplay();
});

// controles del panel
btnToggleSettings.addEventListener("click", () => {
  settingsPanel.classList.toggle("hidden");
});

btnCloseSettings.addEventListener("click", () => {
  settingsPanel.classList.add("hidden");
});

// Cerrar panel si se hace clic fuera de él
document.addEventListener("click", (e) => {
  if (!settingsPanel.classList.contains("hidden")) {
    if (
      !settingsPanel.contains(e.target) &&
      !btnToggleSettings.contains(e.target)
    ) {
      settingsPanel.classList.add("hidden");
    }
  }
});

// si hay cambios en el texto los detecta y los guarda.
function updatePresentationData() {
  const speaker = inputSpeaker.value.trim();
  const origin = inputOrigin.value.trim();
  const topic = inputTopic.value.trim();
  const song = inputSong.value.trim();

  toggleField(displaySpeaker, speaker, true);
  toggleField(displayOrigin, origin, true);
  toggleField(displayTopic, topic, true);
  
  if (song) {
    displaySong.textContent = `Canción: ${song}`;
    displaySong.style.display = "";
  } else {
    displaySong.style.display = "none";
  }
}

function toggleField(element, value, uppercase = false) {
  if (value) {
    element.textContent = uppercase ? value.toUpperCase() : value;
    element.style.display = "";
  } else {
    element.textContent = "";
    element.style.display = "none";
  }
}

// muestra el modal de la info del discursante
btnShowInfo.addEventListener("click", () => {
  updatePresentationData();
  presentationModal.classList.remove("hidden");
  settingsPanel.classList.add("hidden");
});

// cierra el modal del discursante
btnCloseModal.addEventListener("click", () => {
  presentationModal.classList.add("hidden");
});

// actualiza en tiempo real si el modal está visible
inputSpeaker.addEventListener("input", () => {
  if (!presentationModal.classList.contains("hidden")) {
    updatePresentationData();
  }
});

inputTopic.addEventListener("input", () => {
  if (!presentationModal.classList.contains("hidden")) {
    updatePresentationData();
  }
});

// Actualizar el cronómetro si el usuario cambia los minutos y no está corriendo
inputMinutes.addEventListener("input", () => {
  if (!running) {
    initDisplay();
  }
});

inputOrigin.addEventListener("input", () => {
  if (!presentationModal.classList.contains("hidden")) {
    updatePresentationData();
  }
});

inputSong.addEventListener("input", () => {
  if (!presentationModal.classList.contains("hidden")) {
    updatePresentationData();
  }
});

// Iniciar con el valor correcto
initDisplay();
