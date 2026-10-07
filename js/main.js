// js/main.js - Coordinador con Sidebar Drag & Drop, detección automática de día y tiempo a cero
import { TimerEngine } from './timer.js';
import { LapsManager } from './laps.js';
import { HistoryManager } from './history.js';
import { PresentationManager } from './presentation-manager.js';
import { formatTime, escapeHtml } from './utils.js';

// ================= REFERENCIAS DOM =================
const elements = {
  // Sidebar
  meetingBadge: document.getElementById('meeting-badge'),
  btnAddPart: document.getElementById('btn-add-part'),
  partsDragList: document.getElementById('parts-drag-list'),

  // Barra superior del área principal
  activePartTitle: document.getElementById('active-part-title'),
  activePartBadge: document.getElementById('active-part-badge'),
  btnCast: document.getElementById('btn-cast'),
  castStatusText: document.getElementById('cast-status-text'),
  castStatusPill: document.getElementById('cast-status-pill'),

  // Cronómetro
  timerDisplay: document.getElementById('timer'),
  timerProgressBar: document.getElementById('timer-progress-bar'),

  // 4 Botones Maestros
  btnStart: document.getElementById('btn-start'),
  btnPause: document.getElementById('btn-pause'),
  btnNext: document.getElementById('btn-next'),
  btnNextLabel: document.getElementById('btn-next-label'),
  iconBtnNext: document.getElementById('icon-btn-next'),
  btnReset: document.getElementById('btn-reset'),
  quickAdjustButtons: document.querySelectorAll('.btn-adjust[data-adjust]'),

  // Inputs del orador
  inputSpeaker: document.getElementById('input-speaker'),
  inputOrigin: document.getElementById('input-origin'),
  inputTopic: document.getElementById('input-topic'),
  inputSong: document.getElementById('input-song'),
  inputMinutes: document.getElementById('input-minutes'),

  // Placa única
  btnTogglePlaque: document.getElementById('btn-toggle-plaque'),
  btnPlaqueText: document.getElementById('btn-plaque-text'),
  localPlaqueOverlay: document.getElementById('local-plaque-overlay'),
  btnCloseLocalPlaque: document.getElementById('btn-close-local-plaque'),
  plaqueSpeaker: document.getElementById('plaque-speaker'),
  plaqueOrigin: document.getElementById('plaque-origin'),
  plaqueDivider: document.getElementById('plaque-divider'),
  plaqueTopic: document.getElementById('plaque-topic'),
  plaqueSongBox: document.getElementById('plaque-song-box'),

  // Historial & Balance
  balanceBanner: document.getElementById('balance-banner'),
  balanceMainLabel: document.getElementById('balance-main-label'),
  balanceTotalAssigned: document.getElementById('balance-total-assigned'),
  balanceTotalUsed: document.getElementById('balance-total-used'),
  historyItemsList: document.getElementById('history-items-list'),
  historyEmpty: document.getElementById('history-empty'),
  btnCopyHistory: document.getElementById('btn-copy-history'),
  btnClearHistory: document.getElementById('btn-clear-history'),

  // Toast
  toast: document.getElementById('toast')
};

// ================= ESTADO Y MÓDULOS =================
let isPlaqueActive = false;
let draggedItemIndex = null;

// 1. Presentation Manager
const presentationManager = new PresentationManager({
  onStatusChange: (status, isConnected) => {
    updateCastUI(status, isConnected);
  },
  onRequestSync: () => {
    syncToPresentation();
  }
});

// 2. Motor del Cronómetro
const timer = new TimerEngine({
  onTick: (state) => {
    updateTimerLiveUI(state);
    syncToPresentation();
  },
  onStateChange: (state) => {
    updateTimerControlsUI(state);
    syncToPresentation();
  }
});

// 3. Gestor de Participaciones
const lapsManager = new LapsManager({
  onChange: (parts, currentIndex, dayName) => {
    elements.meetingBadge.textContent = dayName;
    renderPartsList(parts, currentIndex);
    syncCurrentPartToUI();
    updateNextButtonUI();
  }
});

// 4. Gestor de Historial
const historyManager = new HistoryManager({
  onChange: (records, summary) => {
    renderHistoryUI(records, summary);
  }
});

// ================= SINCRONIZACIÓN CON LA TV =================
function syncToPresentation() {
  const state = timer.getState();
  const current = lapsManager.getCurrent() || {};

  presentationManager.broadcast({
    type: 'STATE_UPDATE',
    formattedTime: state.formattedTime,
    differenceMs: state.differenceMs,
    totalTimeMs: state.totalTimeMs,
    running: state.running,
    isNegative: state.isNegative,
    overtimeText: state.isNegative ? `SE PASÓ +${formatTime(Math.abs(state.differenceMs))}` : '',
    showLapTitleOnTV: false,
    lapIndex: lapsManager.getCurrentIndex(),
    lapTitle: current.title || '',
    speaker: elements.inputSpeaker.value.trim(),
    origin: elements.inputOrigin.value.trim(),
    topic: elements.inputTopic.value.trim(),
    song: elements.inputSong.value.trim(),
    showSpeakerModal: isPlaqueActive
  });
}

// ================= RENDERIZADO DE PARTICIPACIONES (CON DRAG & DROP) =================
function renderPartsList(parts, currentIndex) {
  elements.partsDragList.innerHTML = '';

  parts.forEach((part, idx) => {
    const li = document.createElement('li');
    li.className = `part-drag-item ${idx === currentIndex ? 'active' : ''} ${part.completed ? 'completed' : ''}`;
    li.draggable = true;
    li.dataset.index = idx;

    li.innerHTML = `
      <div class="drag-handle" title="Arrastrar para mover">⋮⋮</div>
      <div class="part-item-num">${idx + 1}</div>
      <div class="part-item-content">
        <span class="part-item-title">${escapeHtml(part.title || `Parte ${idx + 1}`)}</span>
        <span class="part-item-mins">${part.minutes} min</span>
      </div>
      <button class="btn-delete-item" data-delete-idx="${idx}" title="Eliminar parte">&times;</button>
    `;

    // Selección al hacer clic
    li.addEventListener('click', (e) => {
      if (e.target.closest('.btn-delete-item')) return;
      if (idx !== lapsManager.getCurrentIndex()) {
        if (timer.running) {
          const ok = confirm('El cronómetro está corriendo. ¿Deseas saltar a esta participación?');
          if (!ok) return;
        }
        lapsManager.setCurrentIndex(idx);
        const selected = lapsManager.getCurrent();
        if (selected) {
          timer.setTime(selected.minutes);
        }
      }
    });

    // Eventos Drag & Drop nativos
    li.addEventListener('dragstart', (e) => {
      draggedItemIndex = idx;
      e.dataTransfer.effectAllowed = 'move';
      li.classList.add('dragging');
    });

    li.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });

    li.addEventListener('dragenter', () => {
      if (draggedItemIndex !== idx) {
        li.classList.add('drag-over');
      }
    });

    li.addEventListener('dragleave', () => {
      li.classList.remove('drag-over');
    });

    li.addEventListener('drop', (e) => {
      e.preventDefault();
      li.classList.remove('drag-over');
      if (draggedItemIndex !== null && draggedItemIndex !== idx) {
        lapsManager.reorder(draggedItemIndex, idx);
        showToast('Participación reordenada');
      }
    });

    li.addEventListener('dragend', () => {
      li.classList.remove('dragging');
      draggedItemIndex = null;
    });

    elements.partsDragList.appendChild(li);
  });
}

function syncCurrentPartToUI() {
  const current = lapsManager.getCurrent();
  const allParts = lapsManager.getAll();
  const currentIndex = lapsManager.getCurrentIndex();

  if (current) {
    elements.activePartTitle.textContent = current.title || `Participación ${currentIndex + 1}`;
    elements.activePartBadge.textContent = `Parte ${currentIndex + 1} de ${allParts.length}`;
    elements.inputMinutes.value = current.minutes;

    elements.inputSpeaker.value = current.speaker || '';
    elements.inputOrigin.value = current.origin || '';
    elements.inputTopic.value = current.topic || current.title || '';
    elements.inputSong.value = current.song || '';

    // Si el cronómetro no está corriendo ni fue iniciado, prepara el tiempo asignado
    if (!timer.running && timer.getElapsed() === 0) {
      timer.setTime(current.minutes);
    }
  }
}

/**
 * Actualiza el botón de avance: si está en la última participación, muestra "FINALIZAR REUNIÓN"
 */
function updateNextButtonUI() {
  const isLast = lapsManager.isLastParticipation();

  if (isLast) {
    elements.btnNext.classList.remove('btn-action-next');
    elements.btnNext.classList.add('btn-action-finish');
    elements.btnNextLabel.textContent = 'FINALIZAR REUNIÓN';
    elements.iconBtnNext.innerHTML = '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line>';
  } else {
    elements.btnNext.classList.remove('btn-action-finish');
    elements.btnNext.classList.add('btn-action-next');
    elements.btnNextLabel.textContent = 'SIGUIENTE PARTICIPACIÓN';
    elements.iconBtnNext.innerHTML = '<polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line>';
  }
}

function updateTimerLiveUI(state) {
  elements.timerDisplay.textContent = state.formattedTime;
  elements.timerProgressBar.style.width = `${state.progressPercent}%`;

  if (state.isNegative) {
    elements.timerDisplay.classList.add('negative');
    elements.timerDisplay.classList.remove('warning');
    elements.timerProgressBar.classList.add('negative');
    elements.timerProgressBar.classList.remove('warning');
  } else if (state.isWarning) {
    elements.timerDisplay.classList.add('warning');
    elements.timerDisplay.classList.remove('negative');
    elements.timerProgressBar.classList.add('warning');
    elements.timerProgressBar.classList.remove('negative');
  } else {
    elements.timerDisplay.classList.remove('negative', 'warning');
    elements.timerProgressBar.classList.remove('negative', 'warning');
  }
}

function updateTimerControlsUI(state) {
  if (state.running) {
    elements.btnStart.disabled = true;
    elements.btnStart.style.cursor = 'not-allowed'
    elements.btnStart.style.opacity = '0.6';
    elements.btnPause.disabled = false;
    elements.btnPause.style.opacity = '1';
  } else {
    elements.btnStart.disabled = false;
    elements.btnStart.style.opacity = '1';
    elements.btnPause.disabled = true;
    elements.btnPause.style.opacity = '0.6';
  }
}

function renderHistoryUI(records, summary) {
  elements.historyItemsList.innerHTML = '';

  if (records.length === 0) {
    elements.historyEmpty.classList.remove('hidden');
    elements.balanceBanner.className = 'balance-banner surplus';
    elements.balanceMainLabel.textContent = 'Sobró 00:00';
    elements.balanceTotalAssigned.textContent = '00:00';
    elements.balanceTotalUsed.textContent = '00:00';
    return;
  }

  elements.historyEmpty.classList.add('hidden');

  records.forEach((record) => {
    const diff = record.differenceMs;
    const isSurplus = diff >= 0;
    const diffFormatted = formatTime(Math.abs(diff));
    const label = isSurplus ? `Sobró ${diffFormatted}` : `Se pasó ${diffFormatted}`;
    const badgeClass = isSurplus ? 'badge-sobro' : 'badge-paso';

    const li = document.createElement('li');
    li.className = 'history-item-row';
    li.innerHTML = `
      <div class="hist-part-meta">
        <span class="hist-part-num">#${record.lapNumber}</span>
        <div>
          <strong class="hist-part-title">${escapeHtml(record.title)}</strong>
          ${record.speaker ? `<span class="hist-part-speaker">• ${escapeHtml(record.speaker)}</span>` : ''}
          <div class="hist-time-stats">Asignado: ${formatTime(record.assignedMs)} | Usó: ${formatTime(record.usedMs)}</div>
        </div>
      </div>
      <div class="hist-badge ${badgeClass}">${label}</div>
    `;
    elements.historyItemsList.appendChild(li);
  });

  elements.balanceTotalAssigned.textContent = summary.formattedAssigned;
  elements.balanceTotalUsed.textContent = summary.formattedUsed;

  if (summary.isSurplus) {
    elements.balanceBanner.className = 'balance-banner surplus';
    elements.balanceMainLabel.textContent = `Sobró ${summary.formattedDifference}`;
  } else {
    elements.balanceBanner.className = 'balance-banner deficit';
    elements.balanceMainLabel.textContent = `Se pasó ${summary.formattedDifference}`;
  }
}

function updateCastUI(status, isConnected) {
  if (isConnected) {
    elements.btnCast.classList.add('connected');
    elements.castStatusText.textContent = 'Transmitiendo en TV';
    elements.castStatusPill.textContent = 'Conectado';
    elements.castStatusPill.className = 'status-pill online';
  } else {
    elements.btnCast.classList.remove('connected');
    elements.castStatusText.textContent = 'Transmitir a TV';
    if (status === 'available') {
      elements.castStatusPill.textContent = 'Disponible';
      elements.castStatusPill.className = 'status-pill seeking';
    } else {
      elements.castStatusPill.textContent = 'Desconectado';
      elements.castStatusPill.className = 'status-pill offline';
    }
  }
}

let toastTimer;
function showToast(msg) {
  elements.toast.textContent = msg;
  elements.toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    elements.toast.classList.add('hidden');
  }, 2600);
}

// ================= ACCIONES PRINCIPALES =================
function handleStartTimer() {
  timer.start();
}

function handlePauseTimer() {
  timer.pause();
}

function handleResetTimer() {
  timer.reset();
  showToast('Tiempo reiniciado');
}

/**
 * Avanza a la siguiente participación o finaliza la reunión si es la última
 */
function handleNextOrFinish() {
  const current = lapsManager.getCurrent();
  if (!current) return;

  const usedMs = timer.getElapsed();

  if (usedMs < 1000 && !timer.running) {
    const confirmSkip = confirm('El cronómetro está en cero. ¿Deseas continuar sin registrar tiempo?');
    if (!confirmSkip) return;
  }

  // Registrar en el historial
  const record = historyManager.recordLap({
    lapNumber: lapsManager.getCurrentIndex() + 1,
    title: current.title,
    speaker: elements.inputSpeaker.value.trim() || current.speaker,
    assignedMs: timer.totalTimeMs,
    usedMs: usedMs
  });

  const diffFormatted = formatTime(Math.abs(record.differenceMs));
  const diffLabel = record.differenceMs >= 0 ? `Sobraron ${diffFormatted}` : `Se pasó por ${diffFormatted}`;

  // Si era la última participación: finalizar reunión
  if (lapsManager.isLastParticipation()) {
    lapsManager.markCurrentCompleted();
    timer.pause();
    showToast(`🎉 ¡Reunión finalizada! ${diffLabel}`);
    return;
  }

  showToast(`✅ ${current.title}: ${diffLabel}`);

  // Avanzar a la siguiente participación en la cola
  const nextPart = lapsManager.advanceToNext();
  if (nextPart) {
    // Configura el tiempo de la nueva parte y la deja en PAUSA
    timer.setTime(nextPart.minutes);
  }
}

// ================= PLACA ÚNICA (EN AMBAS PANTALLAS) =================
function updateLocalPlaqueContent() {
  const speaker = elements.inputSpeaker ? elements.inputSpeaker.value.trim() : '';
  const origin = elements.inputOrigin ? elements.inputOrigin.value.trim() : '';
  const topic = elements.inputTopic ? elements.inputTopic.value.trim() : '';
  const song = elements.inputSong ? elements.inputSong.value.trim() : '';

  // Discursante: si no hay nada en el campo, no mostrar nada
  if (speaker) {
    elements.plaqueSpeaker.textContent = speaker.toUpperCase();
    elements.plaqueSpeaker.classList.remove('hidden');
    elements.plaqueSpeaker.style.display = '';
  } else {
    elements.plaqueSpeaker.textContent = '';
    elements.plaqueSpeaker.classList.add('hidden');
    elements.plaqueSpeaker.style.display = 'none';
  }

  // Congregación: si no hay nada en el campo, no mostrar nada
  if (origin) {
    elements.plaqueOrigin.textContent = origin.toUpperCase();
    elements.plaqueOrigin.classList.remove('hidden');
    elements.plaqueOrigin.style.display = '';
  } else {
    elements.plaqueOrigin.textContent = '';
    elements.plaqueOrigin.classList.add('hidden');
    elements.plaqueOrigin.style.display = 'none';
  }

  // Tema: si no hay nada en el campo, no mostrar nada
  if (topic) {
    elements.plaqueTopic.textContent = topic;
    elements.plaqueTopic.classList.remove('hidden');
    elements.plaqueTopic.style.display = '';
  } else {
    elements.plaqueTopic.textContent = '';
    elements.plaqueTopic.classList.add('hidden');
    elements.plaqueTopic.style.display = 'none';
  }

  // Línea divisora del tema: se mantiene siempre como elemento que marca el tema
  if (elements.plaqueDivider) {
    elements.plaqueDivider.classList.remove('hidden');
    elements.plaqueDivider.style.display = '';
  }

  // Canción: si no hay nada en el campo, no mostrar nada
  if (song) {
    elements.plaqueSongBox.innerHTML = `<span>Cántico ${escapeHtml(song)}</span>`;
    elements.plaqueSongBox.classList.remove('hidden');
    elements.plaqueSongBox.style.display = '';
  } else {
    elements.plaqueSongBox.textContent = '';
    elements.plaqueSongBox.classList.add('hidden');
    elements.plaqueSongBox.style.display = 'none';
  }
}

function togglePlaqueProjection() {
  isPlaqueActive = !isPlaqueActive;

  if (isPlaqueActive) {
    updateLocalPlaqueContent();
    elements.localPlaqueOverlay.classList.remove('hidden');
    elements.btnTogglePlaque.classList.add('active');
    elements.btnPlaqueText.textContent = 'Ocultar información';
    showToast('📺 Información proyectada en TV y Pantalla Principal');
  } else {
    elements.localPlaqueOverlay.classList.add('hidden');
    elements.btnTogglePlaque.classList.remove('active');
    elements.btnPlaqueText.textContent = 'Mostrar información';
    showToast('Información ocultada');
  }

  syncToPresentation();
}

// ================= LISTENERS DE EVENTOS =================
// 1. Agregar y Eliminar Participaciones
elements.btnAddPart.addEventListener('click', () => {
  const nextNum = lapsManager.getAll().length + 1;
  lapsManager.addParticipation(`Parte ${nextNum}`, 10);
  showToast(`Parte ${nextNum} agregada`);
});

elements.partsDragList.addEventListener('click', (e) => {
  const delBtn = e.target.closest('[data-delete-idx]');
  if (delBtn) {
    const idx = parseInt(delBtn.dataset.deleteIdx, 10);
    const target = lapsManager.getAll()[idx];
    const ok = confirm(`¿Deseas eliminar "${target ? target.title : 'esta participación'}"?`);
    if (ok) {
      const removed = lapsManager.removeParticipation(idx);
      if (removed) {
        timer.reset();
        const curr = lapsManager.getCurrent();
        if (curr) timer.setTime(curr.minutes);
        showToast('Participación eliminada');
      } else {
        showToast('Debe quedar al menos una participación');
      }
    }
  }
});

// 2. Transmisión a TV
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

// 3. Los 4 Botones Maestros
elements.btnStart.addEventListener('click', handleStartTimer);
elements.btnPause.addEventListener('click', handlePauseTimer);
elements.btnNext.addEventListener('click', handleNextOrFinish);
elements.btnReset.addEventListener('click', handleResetTimer);

// 4. Ajustes rápidos en vivo
elements.quickAdjustButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const deltaSecs = parseInt(btn.dataset.adjust, 10);
    timer.adjustTime(deltaSecs);
    showToast(`${deltaSecs > 0 ? '+' : ''}${deltaSecs}s ajustados`);
  });
});

// 5. Inputs del orador
[elements.inputSpeaker, elements.inputOrigin, elements.inputTopic, elements.inputSong].forEach((input) => {
  input.addEventListener('input', () => {
    lapsManager.updateCurrent({
      speaker: elements.inputSpeaker.value.trim(),
      origin: elements.inputOrigin.value.trim(),
      topic: elements.inputTopic.value.trim(),
      song: elements.inputSong.value.trim()
    });

    if (isPlaqueActive) {
      updateLocalPlaqueContent();
    }
    syncToPresentation();
  });
});

// Control de minutos: si se borra o es 0, llega a cero sin forzar 10
elements.inputMinutes.addEventListener('input', () => {
  const val = elements.inputMinutes.value.trim();
  const mins = val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0);

  lapsManager.updateCurrent({ minutes: mins });

  if (!timer.running && timer.getElapsed() === 0) {
    timer.setTime(mins);
  }

  syncToPresentation();
});

// 6. Placa única
elements.btnTogglePlaque.addEventListener('click', togglePlaqueProjection);
elements.btnCloseLocalPlaque.addEventListener('click', togglePlaqueProjection);

// 7. Acciones de historial
elements.btnCopyHistory.addEventListener('click', () => {
  const text = historyManager.generateTextReport();
  if (!text) {
    showToast('No hay registros en el historial para copiar.');
    return;
  }
  navigator.clipboard.writeText(text)
    .then(() => showToast('📋 Resumen copiado al portapapeles'))
    .catch(() => showToast('Error al copiar al portapapeles'));
});

elements.btnClearHistory.addEventListener('click', () => {
  if (historyManager.getRecords().length === 0) return;
  const ok = confirm('¿Deseas limpiar el registro de tiempos?');
  if (ok) {
    historyManager.clear();
    showToast('Registro limpiado');
  }
});

// 8. Atajos de teclado intuitivos
document.addEventListener('keydown', (e) => {
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

  if (e.code === 'Space') {
    e.preventDefault();
    if (timer.running) {
      handlePauseTimer();
    } else {
      handleStartTimer();
    }
  } else if (e.code === 'Enter') {
    e.preventDefault();
    handleNextOrFinish();
  }
});

// ================= INICIALIZACIÓN =================
syncCurrentPartToUI();
elements.meetingBadge.textContent = lapsManager.getActiveDayName();
renderPartsList(lapsManager.getAll(), lapsManager.getCurrentIndex());
renderHistoryUI(historyManager.getRecords(), historyManager.getSummary());
updateNextButtonUI();
syncToPresentation();
