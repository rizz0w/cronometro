// js/toast.js - Notificaciones flotantes temporales
import { elements } from './dom.js';

let toastTimer = null;

export function showToast(msg) {
  if (!elements.toast) return;
  elements.toast.textContent = msg;
  elements.toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    if (elements.toast) {
      elements.toast.classList.add('hidden');
    }
  }, 2600);
}
