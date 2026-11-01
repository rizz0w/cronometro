// js/sidebar-view.js - Renderizado de la lista de participaciones y Drag & Drop
import { elements } from './dom.js';
import { escapeHtml } from './utils.js';

let draggedItemIndex = null;

/**
 * Renderiza la lista de participaciones con soporte de Drag & Drop y selección.
 * No incluye focos verdes ni etiquetas distractoras para mantener la interfaz clara.
 */
export function renderPartsList({ parts, currentViewedIdx, onSelectPart, onReorderParts, onDeletePart }) {
  if (!elements.partsDragList) return;
  elements.partsDragList.innerHTML = '';

  parts.forEach((part, idx) => {
    const isViewing = idx === currentViewedIdx;

    const li = document.createElement('li');
    let classes = 'part-drag-item';
    if (isViewing) classes += ' active viewing';
    if (part.completed) classes += ' completed';

    li.className = classes;
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

    // Selección de participación al hacer clic
    li.addEventListener('click', (e) => {
      if (e.target.closest('.btn-delete-item')) return;
      if (typeof onSelectPart === 'function') {
        onSelectPart(idx);
      }
    });

    // Eliminación al hacer clic en el botón de borrar
    const deleteBtn = li.querySelector('.btn-delete-item');
    if (deleteBtn && typeof onDeletePart === 'function') {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onDeletePart(idx);
      });
    }

    // Drag & Drop
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
      if (draggedItemIndex !== idx) li.classList.add('drag-over');
    });

    li.addEventListener('dragleave', () => {
      li.classList.remove('drag-over');
    });

    li.addEventListener('drop', (e) => {
      e.preventDefault();
      li.classList.remove('drag-over');
      if (draggedItemIndex !== null && draggedItemIndex !== idx) {
        const fromIdx = draggedItemIndex;
        const toIdx = idx;
        draggedItemIndex = null;
        if (typeof onReorderParts === 'function') {
          onReorderParts(fromIdx, toIdx);
        }
      }
    });

    li.addEventListener('dragend', () => {
      li.classList.remove('dragging');
      draggedItemIndex = null;
    });

    elements.partsDragList.appendChild(li);
  });
}
