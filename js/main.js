// js/main.js - Coordinador principal del cronómetro (modular y desacoplado)
import { TimerEngine } from './timer.js';
import { LapsManager } from './laps.js';
import { HistoryManager } from './history.js';
import { PresentationManager } from './presentation-manager.js';
import { formatTime } from './utils.js';
import { elements } from './dom.js';
import { showToast } from './toast.js';
import { updateLocalPlaqueContent, togglePlaqueProjection, getIsPlaqueActive } from './plaque.js';
import { renderPartsList } from './sidebar-view.js';
import {
  updateTimerLiveUI,
  updateTimerControlsUI,
  updateNextButtonUI,
  updateViewModeUI,
  renderHistoryUI,
  updateCastUI,
  updateTimerModeUI
} from './timer-view.js';

// ================= ESTADO DE CONTROL =================
let activeTimerIndex = null; // Índice de la parte que corre/pausó el cronómetro
let viewedIndex = 0;         // Índice de la parte que se visualiza o edita

function isTimerActive() {
  return timer.running || timer.getElapsed() > 0;
}

// ================= INSTANCIAS DE GESTORES =================
const presentationManager = new PresentationManager({
  onStatusChange: (status, isConnected) => updateCastUI(status, isConnected),
  onRequestSync: () => syncToPresentation()
});

const timer = new TimerEngine({
  onTick: (state) => {
    updateTimerLiveUI(state);
    syncToPresentation();
  },
  onStateChange: (state) => {
    updateTimerControlsUI(state.running);
    syncToPresentation();
  }
});

const lapsManager = new LapsManager({
  onChange: (parts, currentIndex, dayName) => {
    if (elements.meetingBadge) elements.meetingBadge.textContent = dayName;
    refreshUI();
  }
});

const historyManager = new HistoryManager({
  onChange: (records, summary) => renderHistoryUI(records, summary)
});

// ================= SINCRONIZACIÓN Y ACTUALIZACIÓN DE UI =================
function syncToPresentation() {
  const state = timer.getState();
  const allParts = lapsManager.getAll();
  const tvIdx = (activeTimerIndex !== null) ? activeTimerIndex : viewedIndex;
  const current = allParts[tvIdx] || {};

  presentationManager.broadcast({
    type: 'STATE_UPDATE',
    formattedTime: state.formattedTime,
    differenceMs: state.differenceMs,
    totalTimeMs: state.totalTimeMs,
    running: state.running,
    isNegative: state.isNegative,
    overtimeText: state.isNegative ? `SE PASÓ +${formatTime(Math.abs(state.differenceMs))}` : '',
    showLapTitleOnTV: false,
    lapIndex: tvIdx,
    lapTitle: current.title || '',
    speaker: current.speaker || '',
    origin: current.origin || '',
    topic: current.topic || current.title || '',
    song: current.song || '',
    showSpeakerModal: getIsPlaqueActive()
  });
}

function refreshUI() {
  const allParts = lapsManager.getAll();
  const isMini = isTimerActive() && activeTimerIndex !== null && viewedIndex !== activeTimerIndex;
  const activePart = (activeTimerIndex !== null) ? allParts[activeTimerIndex] : null;
  const viewedPart = allParts[viewedIndex] || {};
  const targetIdx = (activeTimerIndex !== null) ? activeTimerIndex : viewedIndex;
  const isLast = targetIdx >= allParts.length - 1;

  updateViewModeUI({
    isMini,
    activePart,
    viewedPart,
    viewedIndex,
    totalParts: allParts.length,
    timerFormattedTime: timer.getState().formattedTime,
    isRunning: timer.running
  });

  updateNextButtonUI(isLast);
  updateTimerModeUI(timer.getMode());

  renderPartsList({
    parts: allParts,
    currentViewedIdx: viewedIndex,
    onSelectPart: (idx) => {
      if (idx !== viewedIndex) {
        switchToParticipation(idx);
      } else if (idx === activeTimerIndex && isTimerActive()) {
        returnToActivePart();
      }
    },
    onReorderParts: (fromIdx, toIdx) => {
      const oldActiveId = (activeTimerIndex !== null) ? allParts[activeTimerIndex]?.id : null;
      const oldViewedId = allParts[viewedIndex]?.id;

      lapsManager.reorder(fromIdx, toIdx);

      const newParts = lapsManager.getAll();
      if (oldActiveId) activeTimerIndex = newParts.findIndex(p => p.id === oldActiveId);
      if (oldViewedId) viewedIndex = newParts.findIndex(p => p.id === oldViewedId);

      refreshUI();
    },
    onDeletePart: (idx) => {
      const target = lapsManager.getAll()[idx];
      const ok = confirm(`¿Deseas eliminar "${target ? target.title : 'esta participación'}"?`);
      if (!ok) return;

      if (activeTimerIndex === idx) {
        timer.reset();
        activeTimerIndex = null;
      } else if (activeTimerIndex !== null && idx < activeTimerIndex) {
        activeTimerIndex--;
      }

      if (lapsManager.removeParticipation(idx)) {
        const remaining = lapsManager.getAll();
        if (viewedIndex >= remaining.length) {
          viewedIndex = Math.max(0, remaining.length - 1);
        }
        if (!isTimerActive()) {
          const curr = remaining[viewedIndex];
          if (curr) timer.setTime(curr.minutes);
        }
        refreshUI();
        showToast('Participación eliminada');
      } else {
        showToast('Debe quedar al menos una participación');
      }
    }
  });
}

// ================= NAVEGACIÓN Y CAMBIO DE PARTICIPACIÓN =================
function switchToParticipation(idx) {
  const allParts = lapsManager.getAll();
  if (idx < 0 || idx >= allParts.length) return;

  if (isTimerActive()) {
    if (activeTimerIndex === null) activeTimerIndex = viewedIndex;
    viewedIndex = idx;
    lapsManager.setCurrentIndex(idx);
  } else {
    viewedIndex = idx;
    activeTimerIndex = null;
    lapsManager.setCurrentIndex(idx);
    const selected = lapsManager.getCurrent();
    if (selected) timer.setTime(selected.minutes);
  }

  refreshUI();
  syncToPresentation();
}

function returnToActivePart() {
  if (activeTimerIndex !== null) {
    switchToParticipation(activeTimerIndex);
  }
}

// Protección contra spam / clicks rápidos continuos
let lastActionTime = 0;
function throttleAction(minIntervalMs = 150) {
  const now = Date.now();
  if (now - lastActionTime < minIntervalMs) return true;
  lastActionTime = now;
  return false;
}

// ================= ACCIONES DEL CRONÓMETRO =================
function handleToggleTimer() {
  if (throttleAction(120)) return;
  if (timer.running) {
    handlePauseTimer();
  } else {
    handleStartTimer();
  }
}

function handleStartTimer() {
  if (activeTimerIndex === null) activeTimerIndex = viewedIndex;
  timer.start();
  refreshUI();
}

function handlePauseTimer() {
  timer.pause();
  refreshUI();
}

function handleToggleMode() {
  const currentMode = timer.getMode();
  const newMode = (currentMode === 'descending') ? 'ascending' : 'descending';
  timer.setMode(newMode);
  updateTimerLiveUI(timer.getState());
  refreshUI();
  syncToPresentation();
}

function handleResetTimer() {
  if (throttleAction(200)) return;
  timer.reset();
  activeTimerIndex = null;
  const current = lapsManager.getAll()[viewedIndex];
  if (current) timer.setTime(current.minutes);
  updateTimerLiveUI(timer.getState());
  refreshUI();
  syncToPresentation();
}

function handleNextOrFinish() {
  const allParts = lapsManager.getAll();
  const targetIdx = (activeTimerIndex !== null) ? activeTimerIndex : viewedIndex;
  const current = allParts[targetIdx];
  if (!current) return;

  const usedMs = timer.getElapsed();
  if (usedMs < 1000 && !timer.running) {
    const ok = confirm('El cronómetro está en cero. ¿Deseas continuar sin registrar tiempo?');
    if (!ok) return;
  }

  const record = historyManager.recordLap({
    lapNumber: targetIdx + 1,
    title: current.title,
    speaker: current.speaker || '',
    assignedMs: timer.totalTimeMs,
    usedMs: usedMs
  });

  const diffFormatted = formatTime(Math.abs(record.differenceMs));
  const diffLabel = (record.differenceMs >= 0) ? `Sobraron ${diffFormatted}` : `Se pasó por ${diffFormatted}`;

  current.completed = true;
  lapsManager.updateItem(targetIdx, { completed: true });

  if (targetIdx >= allParts.length - 1) {
    timer.pause();
    activeTimerIndex = null;
    viewedIndex = targetIdx;
    refreshUI();
    return;
  }

  const nextIdx = targetIdx + 1;
  activeTimerIndex = null;
  viewedIndex = nextIdx;
  lapsManager.setCurrentIndex(nextIdx);

  const nextPart = lapsManager.getCurrent();
  if (nextPart) timer.setTime(nextPart.minutes);

  refreshUI();
}

// ================= REGISTRO DE EVENTOS DOM =================
// 1. Agregar nueva parte
if (elements.btnAddPart) {
  elements.btnAddPart.addEventListener('click', () => {
    const nextNum = lapsManager.getAll().length + 1;
    lapsManager.addParticipation(`Parte ${nextNum}`, 10);
  });
}

// 2. Transmisión Chromecast / Pantalla secundaria
if (elements.btnCast) {
  elements.btnCast.addEventListener('click', async () => {
    try {
      await presentationManager.startCast();
    } catch (err) {
      if (err.message === 'PRESENTATION_NOT_SUPPORTED') {
        showToast('Aviso: Abriendo ventana secundaria para proyectar...');
        presentationManager.openSecondaryWindow();
      }
    }
  });
}

// 3. Botones maestros de control
if (elements.btnStart) elements.btnStart.addEventListener('click', handleToggleTimer);
if (elements.btnNext) elements.btnNext.addEventListener('click', handleNextOrFinish);
if (elements.btnReset) elements.btnReset.addEventListener('click', handleResetTimer);
if (elements.btnModeToggle) elements.btnModeToggle.addEventListener('click', handleToggleMode);

// 4. Mini Cronómetro
if (elements.btnMiniToggle) {
  elements.btnMiniToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    handleToggleTimer();
  });
}

if (elements.btnMiniNext) {
  elements.btnMiniNext.addEventListener('click', (e) => {
    e.stopPropagation();
    handleNextOrFinish();
  });
}

if (elements.btnReturnActive) {
  elements.btnReturnActive.addEventListener('click', (e) => {
    e.stopPropagation();
    returnToActivePart();
  });
}

if (elements.miniTimerDisplay) {
  elements.miniTimerDisplay.addEventListener('click', returnToActivePart);
}

// 5. Navegación con flechas
if (elements.btnPrevPart) {
  elements.btnPrevPart.addEventListener('click', () => {
    if (viewedIndex > 0) switchToParticipation(viewedIndex - 1);
  });
}

if (elements.btnNextPart) {
  elements.btnNextPart.addEventListener('click', () => {
    const all = lapsManager.getAll();
    if (viewedIndex < all.length - 1) switchToParticipation(viewedIndex + 1);
  });
}

// 6. Ajustes rápidos de tiempo en vivo
elements.quickAdjustButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const deltaSecs = parseInt(btn.dataset.adjust, 10);
    timer.adjustTime(deltaSecs);
  });
});

// 7. Inputs de datos del discursante
[elements.inputSpeaker, elements.inputOrigin, elements.inputTopic, elements.inputSong].forEach(input => {
  if (!input) return;
  input.addEventListener('input', () => {
    lapsManager.updateItem(viewedIndex, {
      speaker: elements.inputSpeaker ? elements.inputSpeaker.value : '',
      origin: elements.inputOrigin ? elements.inputOrigin.value : '',
      topic: elements.inputTopic ? elements.inputTopic.value : '',
      song: elements.inputSong ? elements.inputSong.value : ''
    });

    if (getIsPlaqueActive()) updateLocalPlaqueContent();
    syncToPresentation();
  });

  // Limpiar espacios en los extremos únicamente al perder el foco
  input.addEventListener('blur', () => {
    if (input.value !== input.value.trim()) {
      input.value = input.value.trim();
      lapsManager.updateItem(viewedIndex, {
        speaker: elements.inputSpeaker ? elements.inputSpeaker.value : '',
        origin: elements.inputOrigin ? elements.inputOrigin.value : '',
        topic: elements.inputTopic ? elements.inputTopic.value : '',
        song: elements.inputSong ? elements.inputSong.value : ''
      });
      if (getIsPlaqueActive()) updateLocalPlaqueContent();
      syncToPresentation();
    }
  });
});

if (elements.inputMinutes) {
  elements.inputMinutes.addEventListener('input', () => {
    const val = elements.inputMinutes.value.trim();
    const mins = (val === '') ? 0 : Math.max(0, parseInt(val, 10) || 0);

    lapsManager.updateItem(viewedIndex, { minutes: mins });

    if (!isTimerActive() && viewedIndex === (activeTimerIndex ?? viewedIndex)) {
      timer.setTime(mins);
    }

    syncToPresentation();
  });
}

// 8. Placa de información
if (elements.btnTogglePlaque) {
  elements.btnTogglePlaque.addEventListener('click', () => togglePlaqueProjection(syncToPresentation));
}
if (elements.btnCloseLocalPlaque) {
  elements.btnCloseLocalPlaque.addEventListener('click', () => togglePlaqueProjection(syncToPresentation));
}

// 9. Historial
if (elements.btnClearHistory) {
  elements.btnClearHistory.addEventListener('click', () => {
    if (historyManager.getRecords().length === 0) return;
    if (confirm('¿Deseas limpiar el registro de tiempos?')) {
      historyManager.clear();
      showToast('Registro limpiado');
    }
  });
}

if (elements.btnExpandHistory && elements.historyModalOverlay) {
  elements.btnExpandHistory.addEventListener('click', () => {
    elements.historyModalOverlay.classList.remove('hidden');
  });
}

if (elements.btnCloseHistoryModal && elements.historyModalOverlay) {
  elements.btnCloseHistoryModal.addEventListener('click', () => {
    elements.historyModalOverlay.classList.add('hidden');
  });
}

if (elements.historyModalOverlay) {
  elements.historyModalOverlay.addEventListener('click', (e) => {
    if (e.target === elements.historyModalOverlay) {
      elements.historyModalOverlay.classList.add('hidden');
    }
  });
}

// 10. Atajos de teclado (Espacio = Iniciar/Pausar, Enter = Pasar/Finalizar)
document.addEventListener('keydown', (e) => {
  const activeEl = document.activeElement;
  const isTextInput = activeEl && (
    ['INPUT', 'TEXTAREA'].includes(activeEl.tagName) ||
    activeEl.isContentEditable
  );
  if (isTextInput) return;

  if (e.key === 'Escape' && elements.historyModalOverlay && !elements.historyModalOverlay.classList.contains('hidden')) {
    elements.historyModalOverlay.classList.add('hidden');
    return;
  }

  if (e.code === 'Space') {
    e.preventDefault();
    if (activeEl && activeEl.tagName === 'BUTTON') {
      activeEl.blur();
    }
    handleToggleTimer();
  } else if (e.code === 'Enter') {
    e.preventDefault();
    if (activeEl && activeEl.tagName === 'BUTTON') {
      activeEl.blur();
    }
    handleNextOrFinish();
  }
});

// ================= INICIALIZACIÓN =================
if (elements.meetingBadge) {
  elements.meetingBadge.textContent = lapsManager.getActiveDayName();
}
viewedIndex = lapsManager.getCurrentIndex();
refreshUI();
renderHistoryUI(historyManager.getRecords(), historyManager.getSummary());
syncToPresentation();
