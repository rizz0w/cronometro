// js/timer-view.js - Actualizaciones visuales del cronómetro, controles, historial y transmisión
import { elements } from './dom.js';
import { formatTime, escapeHtml } from './utils.js';

export const ICONS = {
  PLAY: '<polygon points="5 3 19 12 5 21 5 3"></polygon>',
  PAUSE: '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>',
  NEXT: '<polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line>',
  FINISH: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line>'
};

/**
 * Actualiza los displays del cronómetro con el tiempo actual y estilos de advertencia/exceso
 */
export function updateTimerLiveUI(state) {
  if (elements.timerDisplay)
    elements.timerDisplay.textContent = state.formattedTime;

  if (elements.miniTimerDisplay)
    elements.miniTimerDisplay.textContent = state.formattedTime;

  [elements.timerDisplay, elements.miniTimerDisplay].forEach(display => {
    if (!display) return;
    display.classList.toggle('negative', state.isNegative);
    display.classList.toggle('warning', state.isWarning && !state.isNegative);
  });
}

/**
 * Actualiza el estado visual de los botones Iniciar y Pausar
 */
export function updateTimerControlsUI(isRunning) {
  if (elements.btnStart) {
    elements.btnStart.disabled = false;
    elements.btnStart.style.cursor = 'pointer';
    elements.btnStart.style.opacity = '1';

    // Alternar entre estilos y etiquetas de INICIAR y PAUSAR
    elements.btnStart.classList.toggle('btn-action-start', !isRunning);
    elements.btnStart.classList.toggle('btn-action-pause', isRunning);

    if (elements.btnStartLabel) {
      elements.btnStartLabel.textContent = isRunning ? 'PAUSAR' : 'INICIAR';
    }

    if (elements.iconBtnStart) {
      elements.iconBtnStart.innerHTML = isRunning ? ICONS.PAUSE : ICONS.PLAY;
    }

    elements.btnStart.title = isRunning ? 'Pausar cronómetro (Espacio)' : 'Iniciar conteo (Espacio)';
  }

  if (elements.iconMiniToggle) {
    elements.iconMiniToggle.innerHTML = isRunning ? ICONS.PAUSE : ICONS.PLAY;
  }
}

/**
 * Actualiza los botones de avance (Normal y Mini) según si es la última parte o no
 */
export function updateNextButtonUI(isLast) {
  const btnLabel = isLast ? 'FINALIZAR REUNIÓN' : 'SIGUIENTE PARTICIPACIÓN';
  const miniLabel = isLast ? 'FINALIZAR REUNIÓN' : 'Pasar participación';
  const iconMarkup = isLast ? ICONS.FINISH : ICONS.NEXT;

  // Botón Principal
  if (elements.btnNext && elements.btnNextLabel && elements.iconBtnNext) {
    elements.btnNext.classList.toggle('btn-action-finish', isLast);
    elements.btnNext.classList.toggle('btn-action-next', !isLast);
    elements.btnNextLabel.textContent = btnLabel;
    elements.iconBtnNext.innerHTML = iconMarkup;
  }

  // Botón Mini
  if (elements.btnMiniNext && elements.btnMiniNextLabel) {
    elements.btnMiniNext.classList.toggle('btn-action-finish', isLast);
    elements.btnMiniNext.classList.toggle('btn-mini-next', !isLast);
    elements.btnMiniNextLabel.textContent = miniLabel;
    if (elements.iconMiniNext) {
      elements.iconMiniNext.innerHTML = iconMarkup;
    }
  }
}

/**
 * Actualiza el modo de vista (Normal vs Mini) y sincroniza los campos de entrada
 */
export function updateViewModeUI({ isMini, activePart, viewedPart, viewedIndex, totalParts, timerFormattedTime, isRunning }) {
  if (elements.timerHeroPanel) {
    elements.timerHeroPanel.classList.toggle('is-mini', isMini);
  }

  if (isMini && elements.miniActiveTitle) {
    elements.miniActiveTitle.textContent = activePart?.title || 'Participación activa';
    if (elements.miniTimerDisplay && timerFormattedTime) {
      elements.miniTimerDisplay.textContent = timerFormattedTime;
    }
    if (elements.iconMiniToggle) {
      elements.iconMiniToggle.innerHTML = isRunning ? ICONS.PAUSE : ICONS.PLAY;
    }
  }

  if (elements.activePartTitle) {
    elements.activePartTitle.textContent = viewedPart?.title || `Participación ${viewedIndex + 1}`;
  }

  if (elements.activePartBadge) {
    elements.activePartBadge.textContent = `Parte ${viewedIndex + 1} de ${totalParts}`;
  }

  if (elements.inputMinutes) {
    elements.inputMinutes.value = viewedPart?.minutes !== undefined ? viewedPart.minutes : 10;
  }
  if (elements.inputSpeaker) {
    elements.inputSpeaker.value = viewedPart?.speaker || '';
  }
  if (elements.inputOrigin) {
    elements.inputOrigin.value = viewedPart?.origin || '';
  }
  if (elements.inputTopic) {
    elements.inputTopic.value = viewedPart?.topic || viewedPart?.title || '';
  }
  if (elements.inputSong) {
    elements.inputSong.value = viewedPart?.song || '';
  }
}

function renderHistoryTarget(
  { listEl, emptyEl, bannerEl, mainLabelEl, assignedEl, usedEl },
  records,
  summary
) {
  if (!listEl) return;
  listEl.innerHTML = '';

  if (records.length === 0) {
    if (emptyEl) emptyEl.classList.remove('hidden');
    if (bannerEl) bannerEl.className = 'balance-banner surplus';
    if (mainLabelEl) mainLabelEl.textContent = 'Sobró 00:00';
    if (assignedEl) assignedEl.textContent = '00:00';
    if (usedEl) usedEl.textContent = '00:00';
    return;
  }

  if (emptyEl) emptyEl.classList.add('hidden');

  records.forEach(record => {
    const isSurplus = record.differenceMs >= 0;
    const diffFormatted = formatTime(Math.abs(record.differenceMs));
    const label = `${isSurplus ? 'Sobró' : 'Se pasó'} ${diffFormatted}`;
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
    listEl.appendChild(li);
  });

  if (assignedEl) assignedEl.textContent = summary.formattedAssigned;
  if (usedEl) usedEl.textContent = summary.formattedUsed;
  if (bannerEl) bannerEl.className = `balance-banner ${summary.isSurplus ? 'surplus' : 'deficit'}`;
  if (mainLabelEl) mainLabelEl.textContent = `${summary.isSurplus ? 'Sobró' : 'Se pasó'} ${summary.formattedDifference}`;
}

/**
 * Renderiza el historial de participaciones concluidas y el balance de tiempo
 */
export function renderHistoryUI(records, summary) {
  renderHistoryTarget(
    {
      listEl: elements.historyItemsList,
      emptyEl: elements.historyEmpty,
      bannerEl: elements.balanceBanner,
      mainLabelEl: elements.balanceMainLabel,
      assignedEl: elements.balanceTotalAssigned,
      usedEl: elements.balanceTotalUsed
    },
    records,
    summary
  );

  renderHistoryTarget(
    {
      listEl: elements.modalHistoryItemsList,
      emptyEl: elements.modalHistoryEmpty,
      bannerEl: elements.modalBalanceBanner,
      mainLabelEl: elements.modalBalanceMainLabel,
      assignedEl: elements.modalBalanceTotalAssigned,
      usedEl: elements.modalBalanceTotalUsed
    },
    records,
    summary
  );
}

/**
 * Actualiza el botón y estado de conexión Chromecast / TV
 */
export function updateCastUI(status, isConnected) {
  if (!elements.btnCast) return;
  elements.btnCast.classList.toggle('connected', isConnected);
  if (elements.castStatusText) {
    elements.castStatusText.textContent = isConnected ? 'Transmitiendo en TV' : 'Transmitir a TV';
  }

  if (elements.castStatusPill) {
    if (isConnected) {
      elements.castStatusPill.textContent = 'Conectado';
      elements.castStatusPill.className = 'status-pill online';
    } else {
      elements.castStatusPill.textContent = (status === 'available') ? 'Disponible' : 'Desconectado';
      elements.castStatusPill.className = `status-pill ${(status === 'available') ? 'seeking' : 'offline'}`;
    }
  }
}

/**
 * Actualiza el botón de modo de conteo (Descendente / Ascendente)
 * @param {"descending"|"ascending"} mode 
 */
export function updateTimerModeUI(mode) {
  if (!elements.btnModeToggle) return;
  const isAsc = mode === "ascending";
  elements.btnModeToggle.classList.toggle("mode-ascending", isAsc);
  
  const label = document.getElementById("btn-mode-label");
  if (label) {
    label.textContent = isAsc ? "ASCENDENTE" : "DESCENDENTE";
  }

  const iconDesc = document.getElementById("icon-mode-desc");
  const iconAsc = document.getElementById("icon-mode-asc");
  if (iconDesc && iconAsc) {
    iconDesc.classList.toggle("hidden", isAsc);
    iconAsc.classList.toggle("hidden", !isAsc);
  }
}
