// js/timer.js - Motor del cronómetro con cálculo de deriva por Date.now()
import { formatTime } from './utils.js';

export class TimerEngine {
  constructor({ onTick = null, onStateChange = null, mode = 'descending' } = {}) {
    this.totalTimeMs = 10 * 60 * 1000;
    this.startTime = 0;
    this.pausedTime = 0;
    this.running = false;
    this.intervalId = null;
    this.tickRateMs = 100;
    this.mode = mode; // 'descending' | 'ascending'

    this.onTick = onTick;
    this.onStateChange = onStateChange;
  }

  /**
   * Cambia el modo de conteo (descendente o ascendente)
   * @param {'descending'|'ascending'} newMode 
   */
  setMode(newMode) {
    if (newMode === 'ascending' || newMode === 'descending') {
      this.mode = newMode;
      this._notifyTick();
      this._notifyState();
    }
  }

  getMode() {
    return this.mode;
  }

  /**
   * Configura el tiempo base del cronómetro
   * @param {number} minutes 
   * @param {number} seconds 
   */
  setTime(minutes, seconds = 0) {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.running = false;
    this.pausedTime = 0;
    this.startTime = 0;
    const safeMins = isNaN(minutes) || minutes === '' ? 0 : Math.max(0, parseInt(minutes, 10) || 0);
    const safeSecs = isNaN(seconds) || seconds === '' ? 0 : Math.max(0, parseInt(seconds, 10) || 0);
    this.totalTimeMs = (safeMins * 60 + safeSecs) * 1000;
    this._notifyTick();
    this._notifyState();
  }

  /**
   * Ajusta el tiempo total en caliente sumando o restando segundos
   * @param {number} deltaSeconds 
   */
  adjustTime(deltaSeconds) {
    const deltaMs = deltaSeconds * 1000;
    this.totalTimeMs = Math.max(0, this.totalTimeMs + deltaMs);
    this._notifyTick();
    this._notifyState();
  }

  /**
   * Inicia o reanuda el cronómetro
   */
  start() {
    if (this.running) return;

    this.startTime = Date.now();
    this.running = true;

    this.intervalId = setInterval(() => {
      this._notifyTick();
    }, this.tickRateMs);

    this._notifyState();
    this._notifyTick();
  }

  /**
   * Pausa el cronómetro conservando el tiempo transcurrido
   */
  pause() {
    if (!this.running) return;

    clearInterval(this.intervalId);
    this.intervalId = null;
    this.running = false;
    this.pausedTime += Date.now() - this.startTime;

    this._notifyState();
    this._notifyTick();
  }

  /**
   * Alterna entre iniciar y pausar
   */
  toggle() {
    if (this.running) {
      this.pause();
    } else {
      this.start();
    }
  }

  /**
   * Reinicia el cronómetro al tiempo base asignado
   */
  reset() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.running = false;
    this.pausedTime = 0;
    this.startTime = 0;

    this._notifyState();
    this._notifyTick();
  }

  /**
   * Calcula el tiempo restante o excedido (diferencia con signo)
   * @returns {number} milisegundos restantes (o negativos si excedió)
   */
  getDifference() {
    const elapsed = this.getElapsed();
    return this.totalTimeMs - elapsed;
  }

  /**
   * Calcula el tiempo real consumido en milisegundos
   * @returns {number}
   */
  getElapsed() {
    if (!this.running) {
      return this.pausedTime;
    }
    return (Date.now() - this.startTime) + this.pausedTime;
  }

  /**
   * Porcentaje de tiempo restante (100% a 0%)
   * @returns {number}
   */
  getProgressPercent() {
    if (this.totalTimeMs <= 0) return 0;
    const diff = this.getDifference();
    return Math.max(0, Math.min(100, (diff / this.totalTimeMs) * 100));
  }

  /**
   * Obtiene una instantánea completa del estado del cronómetro
   */
  getState() {
    const difference = this.getDifference();
    const elapsed = this.getElapsed();
    const isAscending = this.mode === 'ascending';
    
    // Si es ascendente, el tiempo negativo (excedido) ocurre cuando el tiempo transcurrido supera el tiempo asignado
    const isNegative = isAscending ? (elapsed > this.totalTimeMs && this.totalTimeMs > 0) : (difference < 0);
    // Advertencia en el último minuto antes de completar el tiempo asignado
    const isWarning = difference <= 60000 && difference > 0 && this.running;

    // En modo ascendente mostramos el tiempo transcurrido (elapsedMs).
    // En modo descendente mostramos el tiempo restante o el tiempo excedido negativo (difference).
    const displayMs = isAscending ? elapsed : difference;

    return {
      running: this.running,
      mode: this.mode,
      totalTimeMs: this.totalTimeMs,
      differenceMs: difference,
      elapsedMs: elapsed,
      displayMs: displayMs,
      formattedTime: formatTime(displayMs),
      isNegative: isNegative,
      isWarning: isWarning,
      progressPercent: this.getProgressPercent()
    };
  }

  _notifyTick() {
    if (typeof this.onTick === 'function') {
      this.onTick(this.getState());
    }
  }

  _notifyState() {
    if (typeof this.onStateChange === 'function') {
      this.onStateChange(this.getState());
    }
  }
}
