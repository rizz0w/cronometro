// js/plaque.js - Gestión de la placa de información del discursante
import { elements } from './dom.js';
import { escapeHtml } from './utils.js';

let isPlaqueActive = false;

function setFieldVisibility(el, text, transform = (t) => t) {
  if (!el) return;
  const hasText = Boolean(text);
  el.textContent = hasText ? transform(text) : '';
  el.classList.toggle('hidden', !hasText);
  el.style.display = hasText ? '' : 'none';
}

export function updateLocalPlaqueContent() {
  const speaker = elements.inputSpeaker ? elements.inputSpeaker.value.trim() : '';
  const origin = elements.inputOrigin ? elements.inputOrigin.value.trim() : '';
  const topic = elements.inputTopic ? elements.inputTopic.value.trim() : '';
  const song = elements.inputSong ? elements.inputSong.value.trim() : '';

  setFieldVisibility(elements.plaqueSpeaker, speaker, s => s.toUpperCase());
  setFieldVisibility(elements.plaqueOrigin, origin, o => o.toUpperCase());
  setFieldVisibility(elements.plaqueTopic, topic);

  if (elements.plaqueSongBox) {
    elements.plaqueSongBox.innerHTML = song
      ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg><span>Cántico ${escapeHtml(song)}</span>`
      : '';
    elements.plaqueSongBox.classList.toggle('hidden', !song);
    elements.plaqueSongBox.style.display = song ? '' : 'none';
  }
}

export function togglePlaqueProjection(onSync) {
  isPlaqueActive = !isPlaqueActive;
  if (elements.localPlaqueOverlay) elements.localPlaqueOverlay.classList.toggle('hidden', !isPlaqueActive);
  if (elements.btnTogglePlaque) elements.btnTogglePlaque.classList.toggle('active', isPlaqueActive);
  if (elements.btnPlaqueText) {
    elements.btnPlaqueText.textContent = isPlaqueActive ? 'Ocultar información' : 'Mostrar información';
  }

  if (isPlaqueActive) {
    updateLocalPlaqueContent();
  }

  if (typeof onSync === 'function') {
    onSync();
  }
}

export function getIsPlaqueActive() {
  return isPlaqueActive;
}
