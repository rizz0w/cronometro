// js/laps.js - Gestor de participaciones con detección automática de día y reordenación Drag & Drop
import { generateId } from './utils.js';

export const MEETING_TEMPLATES = {
  MARTES: [
    {
      id: 'part_tesoros',
      title: 'Tesoros de la Biblia',
      minutes: 10,
      speaker: '',
      origin: '',
      topic: 'Tesoros de la Biblia',
      song: '',
      completed: false
    },
    {
      id: 'part_perlas',
      title: 'Perlas Escondidas',
      minutes: 10,
      speaker: '',
      origin: '',
      topic: 'Perlas Escondidas',
      song: '',
      completed: false
    },
    {
      id: 'part_lectura',
      title: 'Lectura de la Biblia',
      minutes: 4,
      speaker: '',
      origin: '',
      topic: 'Lectura de la Biblia',
      song: '',
      completed: false
    },
    {
      id: 'part_conversaciones',
      title: 'Empiece Conversaciones',
      minutes: 3,
      speaker: '',
      origin: '',
      topic: 'Empiece Conversaciones',
      song: '',
      completed: false
    },
    {
      id: 'part_revisitas',
      title: 'Haga Revisitas',
      minutes: 3,
      speaker: '',
      origin: '',
      topic: 'Haga Revisitas',
      song: '',
      completed: false
    },
    {
      id: 'part_discipulos',
      title: 'Haga Discípulos',
      minutes: 4,
      speaker: '',
      origin: '',
      topic: 'Haga Discípulos',
      song: '',
      completed: false
    }
  ],
  DOMINGO: [
    {
      id: 'part_discurso',
      title: 'Discurso Público',
      minutes: 30,
      speaker: '',
      origin: '',
      topic: 'Discurso Público',
      song: '',
      completed: false
    },
    {
      id: 'part_atalaya',
      title: 'Estudio de La Atalaya',
      minutes: 60,
      speaker: '',
      origin: '',
      topic: 'Estudio de La Atalaya',
      song: '',
      completed: false
    }
  ]
};

export class LapsManager {
  constructor({
    storageKey = 'cronometro_participaciones',
    dateKey = 'cronometro_session_date',
    onChange = null
  } = {}) {
    this.storageKey = storageKey;
    this.dateKey = dateKey;
    this.onChange = onChange;

    this.participaciones = [];
    this.currentIndex = 0;
    this.activeDayName = 'Martes (Entre semana)';

    this.initDailyState();
  }

  getTodayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Detecta automáticamente si hoy es Domingo (0) o Martes/Entre semana (1-6)
   */
  detectDayTemplate() {
    const day = new Date().getDay();
    if (day === 0) {
      this.activeDayName = 'Domingo (Fin de semana)';
      return 'DOMINGO';
    }
    this.activeDayName = 'Martes (Entre semana)';
    return 'MARTES';
  }

  getTemplateData(templateType) {
    const source = MEETING_TEMPLATES[templateType] || MEETING_TEMPLATES.MARTES;
    return source.map((item) => ({
      ...item,
      id: generateId('part'),
      completed: false
    }));
  }

  initDailyState() {
    const today = this.getTodayString();
    let savedDate = null;
    let savedData = null;

    try {
      if (typeof localStorage !== 'undefined') {
        savedDate = localStorage.getItem(this.dateKey);
        savedData = localStorage.getItem(this.storageKey);
      }
    } catch (e) {}

    const templateType = this.detectDayTemplate();

    // Si cambió el día o es primera vez
    if (savedDate !== today || !savedData) {
      this.participaciones = this.getTemplateData(templateType);
      this.currentIndex = 0;
      this.saveToStorage(today);
    } else {
      try {
        const parsed = JSON.parse(savedData);
        this.participaciones = Array.isArray(parsed) && parsed.length > 0
          ? parsed
          : this.getTemplateData(templateType);
      } catch (e) {
        this.participaciones = this.getTemplateData(templateType);
      }
    }
  }

  getActiveDayName() {
    return this.activeDayName;
  }

  getCurrent() {
    return this.participaciones[this.currentIndex] || this.participaciones[0] || null;
  }

  getCurrentIndex() {
    return this.currentIndex;
  }

  isLastParticipation() {
    return this.currentIndex >= this.participaciones.length - 1;
  }

  getAll() {
    return [...this.participaciones];
  }

  setCurrentIndex(index) {
    if (index >= 0 && index < this.participaciones.length) {
      this.currentIndex = index;
      this._saveAndNotify();
      return true;
    }
    return false;
  }

  updateCurrent(fields = {}) {
    const current = this.getCurrent();
    if (!current) return;

    Object.assign(current, fields);
    this._saveAndNotify();
  }

  markCurrentCompleted() {
    const current = this.getCurrent();
    if (current) {
      current.completed = true;
      this._saveAndNotify();
    }
  }

  advanceToNext() {
    this.markCurrentCompleted();

    if (this.currentIndex + 1 < this.participaciones.length) {
      this.currentIndex++;
    } else {
      // Si se acaba la última participación
      return null;
    }

    this._saveAndNotify();
    return this.getCurrent();
  }

  addParticipation(title, minutes = 10) {
    const nextNum = this.participaciones.length + 1;
    const newPart = {
      id: generateId('part'),
      title: title || `Participación ${nextNum}`,
      minutes: Math.max(0, parseInt(minutes, 10) || 0),
      speaker: '',
      origin: '',
      topic: '',
      song: '',
      completed: false
    };

    this.participaciones.push(newPart);
    this._saveAndNotify();
    return newPart;
  }

  removeParticipation(index) {
    if (this.participaciones.length <= 1) {
      return false; // Debe quedar al menos una
    }

    this.participaciones.splice(index, 1);
    if (this.currentIndex >= this.participaciones.length) {
      this.currentIndex = this.participaciones.length - 1;
    }

    this._saveAndNotify();
    return true;
  }

  /**
   * Reordena elementos con Drag & Drop
   * @param {number} fromIndex 
   * @param {number} toIndex 
   */
  reorder(fromIndex, toIndex) {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= this.participaciones.length ||
      toIndex >= this.participaciones.length
    ) {
      return false;
    }

    const currentId = this.getCurrent()?.id;
    const [movedItem] = this.participaciones.splice(fromIndex, 1);
    this.participaciones.splice(toIndex, 0, movedItem);

    // Ajustar currentIndex para seguir apuntando al mismo elemento
    const newCurrentIdx = this.participaciones.findIndex((p) => p.id === currentId);
    if (newCurrentIdx !== -1) {
      this.currentIndex = newCurrentIdx;
    }

    this._saveAndNotify();
    return true;
  }

  saveToStorage(dateStr = this.getTodayString()) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(this.participaciones));
        localStorage.setItem(this.dateKey, dateStr);
      }
    } catch (e) {
      console.warn('Error guardando en localStorage', e);
    }
  }

  _saveAndNotify() {
    this.saveToStorage();
    if (typeof this.onChange === 'function') {
      this.onChange(this.getAll(), this.currentIndex, this.activeDayName);
    }
  }
}
