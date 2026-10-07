// js/history.js - Registro de participaciones con indicador "Sobró" o "Se pasó"
import { formatTime, generateId } from './utils.js';

export class HistoryManager {
  constructor({ storageKey = 'cronometro_history_list', dateKey = 'cronometro_history_date', onChange = null } = {}) {
    this.storageKey = storageKey;
    this.dateKey = dateKey;
    this.onChange = onChange;
    this.history = [];

    this.initDailyState();
  }

  getTodayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

    // Si cambió el día, inicia el historial fresco
    if (savedDate !== today || !savedData) {
      this.history = [];
      this.saveToStorage(today);
    } else {
      try {
        const parsed = JSON.parse(savedData);
        this.history = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        this.history = [];
      }
    }
  }

  getRecords() {
    return [...this.history];
  }

  recordLap({ lapNumber, title, speaker, assignedMs, usedMs }) {
    const differenceMs = assignedMs - usedMs;

    const record = {
      id: generateId('hist'),
      lapNumber: lapNumber,
      title: title || `Participación ${lapNumber}`,
      speaker: speaker || '',
      assignedMs: Math.max(0, assignedMs),
      usedMs: Math.max(0, usedMs),
      differenceMs: differenceMs,
      timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    this.history.push(record);
    this._saveAndNotify();
    return record;
  }

  getSummary() {
    let totalAssignedMs = 0;
    let totalUsedMs = 0;

    for (const item of this.history) {
      totalAssignedMs += item.assignedMs;
      totalUsedMs += item.usedMs;
    }

    const netDifferenceMs = totalAssignedMs - totalUsedMs;
    const isSurplus = netDifferenceMs >= 0;

    return {
      totalAssignedMs,
      totalUsedMs,
      netDifferenceMs,
      isSurplus,
      formattedAssigned: formatTime(totalAssignedMs),
      formattedUsed: formatTime(totalUsedMs),
      formattedDifference: formatTime(Math.abs(netDifferenceMs)),
      balanceText: isSurplus
        ? `Sobró ${formatTime(netDifferenceMs)}`
        : `Se pasó ${formatTime(Math.abs(netDifferenceMs))}`
    };
  }

  generateTextReport() {
    if (this.history.length === 0) return '';

    const summary = this.getSummary();

    let report = '📊 REPORTE DE TIEMPOS DE LA REUNIÓN\n';
    report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';

    this.history.forEach((item) => {
      const diff = item.differenceMs;
      const diffFormatted = formatTime(Math.abs(diff));
      const diffLabel = diff >= 0 ? `Sobró ${diffFormatted}` : `Se pasó ${diffFormatted}`;
      const speakerTxt = item.speaker ? ` (${item.speaker})` : '';

      report += `${item.lapNumber}. ${item.title}${speakerTxt}\n`;
      report += `   Asignado: ${formatTime(item.assignedMs)} | Usó: ${formatTime(item.usedMs)} | ${diffLabel}\n`;
    });

    report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    report += `Total Asignado: ${summary.formattedAssigned}\n`;
    report += `Total Usado:    ${summary.formattedUsed}\n`;
    report += `Balance Final:  ${summary.balanceText}\n`;
    report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

    return report;
  }

  clear() {
    this.history = [];
    this._saveAndNotify();
  }

  saveToStorage(dateStr = this.getTodayString()) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(this.history));
        localStorage.setItem(this.dateKey, dateStr);
      }
    } catch (e) {
      console.warn('Error guardando historial en localStorage', e);
    }
  }

  _saveAndNotify() {
    this.saveToStorage();
    if (typeof this.onChange === 'function') {
      this.onChange(this.getRecords(), this.getSummary());
    }
  }
}
