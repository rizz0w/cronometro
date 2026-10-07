// js/utils.js - Funciones de utilidad comunes

/**
 * Formatea milisegundos a formato MM:SS o -MM:SS (o HH:MM:SS si supera 1 hora)
 * @param {number} ms 
 * @returns {string}
 */
export function formatTime(ms) {
  const isNegative = ms < 0;
  const absMs = Math.abs(ms);
  const totalSeconds = Math.floor(absMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (num) => String(num).padStart(2, '0');

  if (hours > 0) {
    return `${isNegative ? '-' : ''}${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${isNegative ? '-' : ''}${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Genera un identificador único seguro
 * @param {string} prefix 
 * @returns {string}
 */
export function generateId(prefix = 'item') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 6)}`;
}

/**
 * Sanitiza texto para evitar inyecciones HTML en renderizado
 * @param {string} text 
 * @returns {string}
 */
export function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Obtiene la URL absoluta para la página de presentación
 * Crucial para GitHub Pages y Chromecast
 * @param {string} relativePath 
 * @returns {string}
 */
export function getAbsolutePresentationUrl(relativePath = 'presentation.html') {
  return new URL(relativePath, window.location.href).href;
}
