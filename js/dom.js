// js/dom.js - Referencias centralizadas a elementos del DOM
export const elements = {
  // Sidebar
  meetingBadge: document.getElementById('meeting-badge'),
  btnAddPart: document.getElementById('btn-add-part'),
  partsDragList: document.getElementById('parts-drag-list'),

  // Barra superior
  activePartTitle: document.getElementById('active-part-title'),
  activePartBadge: document.getElementById('active-part-badge'),
  btnPrevPart: document.getElementById('btn-prev-part'),
  btnNextPart: document.getElementById('btn-next-part'),
  btnCast: document.getElementById('btn-cast'),
  castStatusText: document.getElementById('cast-status-text'),
  castStatusPill: document.getElementById('cast-status-pill'),

  // Paneles de cronómetro (Normal y Mini)
  timerHeroPanel: document.querySelector('.timer-hero-panel'),
  timerHeroNormal: document.getElementById('timer-hero-normal'),
  timerHeroMini: document.getElementById('timer-hero-mini'),
  timerDisplay: document.getElementById('timer'),
  miniTimerDisplay: document.getElementById('mini-timer'),
  miniActiveTitle: document.getElementById('mini-active-title'),
  btnMiniToggle: document.getElementById('btn-mini-toggle'),
  iconMiniToggle: document.getElementById('icon-mini-toggle'),
  btnMiniNext: document.getElementById('btn-mini-next'),
  btnMiniNextLabel: document.getElementById('btn-mini-next-label'),
  iconMiniNext: document.getElementById('icon-mini-next'),
  btnReturnActive: document.getElementById('btn-return-active'),

  // 4 Botones Maestros
  btnStart: document.getElementById('btn-start'),
  btnStartLabel: document.getElementById('btn-start-label'),
  iconBtnStart: document.getElementById('icon-btn-start'),
  btnPause: document.getElementById('btn-pause'),
  btnNext: document.getElementById('btn-next'),
  btnNextLabel: document.getElementById('btn-next-label'),
  iconBtnNext: document.getElementById('icon-btn-next'),
  btnReset: document.getElementById('btn-reset'),
  btnModeToggle: document.getElementById('btn-mode-toggle'),
  quickAdjustButtons: document.querySelectorAll('.btn-adjust[data-adjust]'),

  // Inputs del orador
  inputSpeaker: document.getElementById('input-speaker'),
  inputOrigin: document.getElementById('input-origin'),
  inputTopic: document.getElementById('input-topic'),
  inputSong: document.getElementById('input-song'),
  inputMinutes: document.getElementById('input-minutes'),

  // Placa de proyección
  btnTogglePlaque: document.getElementById('btn-toggle-plaque'),
  btnPlaqueText: document.getElementById('btn-plaque-text'),
  localPlaqueOverlay: document.getElementById('local-plaque-overlay'),
  btnCloseLocalPlaque: document.getElementById('btn-close-local-plaque'),
  plaqueSpeaker: document.getElementById('plaque-speaker'),
  plaqueOrigin: document.getElementById('plaque-origin'),
  plaqueTopic: document.getElementById('plaque-topic'),
  plaqueSongBox: document.getElementById('plaque-song-box'),

  // Historial & Balance
  balanceBanner: document.getElementById('balance-banner'),
  balanceMainLabel: document.getElementById('balance-main-label'),
  balanceTotalAssigned: document.getElementById('balance-total-assigned'),
  balanceTotalUsed: document.getElementById('balance-total-used'),
  historyItemsList: document.getElementById('history-items-list'),
  historyEmpty: document.getElementById('history-empty'),
  btnClearHistory: document.getElementById('btn-clear-history'),

  // Toast
  toast: document.getElementById('toast')
};
