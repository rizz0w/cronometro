// js/plaque.js - Gestión de la placa de información del discursante
import { elements } from './dom.js';
import { escapeHtml } from './utils.js';
import { showToast } from './toast.js';

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
    elements.plaqueSongBox.innerHTML = song ? `<span>Cántico ${escapeHtml(song)}</span>` : '';
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
    showToast('📺 Información proyectada en TV y Pantalla Principal');
  } else {
    showToast('Información ocultada');
  }

  if (typeof onSync === 'function') {
    onSync();
  }
}

export function getIsPlaqueActive() {
  return isPlaqueActive;
}
