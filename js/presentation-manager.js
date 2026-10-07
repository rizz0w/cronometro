// js/presentation-manager.js - Gestor de Presentation API (Chromecast) y sincronización multipantalla
import { getAbsolutePresentationUrl } from './utils.js';

export class PresentationManager {
  constructor({ channelName = 'cronometro_presentation_sync', onStatusChange = null, onRequestSync = null } = {}) {
    this.channelName = channelName;
    this.onStatusChange = onStatusChange;
    this.onRequestSync = onRequestSync;

    this.presentationRequest = null;
    this.presentationConnection = null;
    this.broadcastChannel = null;
    this.isSupported = false;
    this.status = 'offline'; // 'offline' | 'available' | 'connected'

    this.init();
  }

  init() {
    // 1. Iniciar canal BroadcastChannel para ventanas locales / monitores secundarios
    try {
      this.broadcastChannel = new BroadcastChannel(this.channelName);
      this.broadcastChannel.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'RECEIVER_READY') {
          if (typeof this.onRequestSync === 'function') {
            this.onRequestSync();
          }
        }
      });
    } catch (e) {
      console.warn('BroadcastChannel no soportado en este entorno', e);
    }

    // 2. Iniciar Presentation API nativa
    if ('PresentationRequest' in window) {
      this.isSupported = true;
      try {
        // En GitHub Pages y Chromecast es fundamental pasar la URL absoluta con protocolo HTTPS
        const targetUrl = getAbsolutePresentationUrl('presentation.html');
        this.presentationRequest = new PresentationRequest([targetUrl]);

        // Establecer como defaultRequest para que el botón de cast del navegador la detecte
        if (navigator.presentation) {
          navigator.presentation.defaultRequest = this.presentationRequest;
        }

        // Detectar si hay dispositivos Cast disponibles en la red
        this.presentationRequest
          .getAvailability()
          .then((availability) => {
            this._handleAvailability(availability.value);
            availability.onchange = () => {
              this._handleAvailability(availability.value);
            };
          })
          .catch((err) => {
            console.log('Presentation availability check:', err.message);
          });

        this.presentationRequest.addEventListener('connectionavailable', (event) => {
          this._setupConnection(event.connection);
        });
      } catch (e) {
        console.warn('Error inicializando PresentationRequest:', e);
      }
    }
  }

  _handleAvailability(available) {
    if (this.status !== 'connected') {
      this.status = available ? 'available' : 'offline';
      this._notifyStatus();
    }
  }

  _setupConnection(connection) {
    this.presentationConnection = connection;
    this.status = 'connected';
    this._notifyStatus();

    connection.addEventListener('connect', () => {
      this.status = 'connected';
      this._notifyStatus();
      if (typeof this.onRequestSync === 'function') {
        this.onRequestSync();
      }
    });

    connection.addEventListener('close', () => {
      this.status = 'offline';
      this.presentationConnection = null;
      this._notifyStatus();
    });

    connection.addEventListener('terminate', () => {
      this.status = 'offline';
      this.presentationConnection = null;
      this._notifyStatus();
    });

    connection.addEventListener('message', (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'RECEIVER_READY') {
          if (typeof this.onRequestSync === 'function') {
            this.onRequestSync();
          }
        }
      } catch (e) {}
    });

    if (typeof this.onRequestSync === 'function') {
      this.onRequestSync();
    }
  }

  /**
   * Inicia la transmisión a Chromecast o pantalla compatible
   */
  async startCast() {
    if (this.isConnected()) {
      const confirmDisconnect = confirm('¿Deseas desconectar la transmisión a la TV?');
      if (confirmDisconnect) {
        this.disconnect();
      }
      return;
    }

    if (!this.presentationRequest) {
      throw new Error('PRESENTATION_NOT_SUPPORTED');
    }

    try {
      const connection = await this.presentationRequest.start();
      this._setupConnection(connection);
      return connection;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Error en presentationRequest.start:', err);
        throw err;
      }
    }
  }

  /**
   * Desconecta la transmisión activa
   */
  disconnect() {
    if (this.presentationConnection) {
      try {
        this.presentationConnection.terminate();
      } catch (e) {}
      this.presentationConnection = null;
      this.status = 'offline';
      this._notifyStatus();
    }
  }

  isConnected() {
    return (
      this.presentationConnection !== null &&
      this.presentationConnection.state === 'connected'
    );
  }

  /**
   * Envía el estado del temporizador a la TV y a cualquier pantalla conectada
   * @param {Object} stateData 
   */
  broadcast(stateData) {
    const payload = {
      ...stateData,
      timestamp: Date.now()
    };

    // 1. Envío por Presentation API (Chromecast)
    if (this.isConnected()) {
      try {
        this.presentationConnection.send(JSON.stringify(payload));
      } catch (e) {
        console.warn('Error enviando por PresentationConnection', e);
      }
    }

    // 2. Envío por BroadcastChannel (Ventanas secundarias / Monitor 2)
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(payload);
      } catch (e) {}
    }

    // 3. Respaldo por localStorage
    try {
      localStorage.setItem('cronometro_sync_state', JSON.stringify(payload));
    } catch (e) {}
  }

  /**
   * Abre la vista de TV en una ventana secundaria (para monitores auxiliares o pruebas)
   */
  openSecondaryWindow() {
    const targetUrl = getAbsolutePresentationUrl('presentation.html');
    const width = 1200;
    const height = 800;
    const left = window.screen.width ? (window.screen.width - width) / 2 : 100;
    const top = window.screen.height ? (window.screen.height - height) / 2 : 100;

    const popup = window.open(
      targetUrl,
      'CronometroTV',
      `width=${width},height=${height},top=${top},left=${left},toolbar=no,menubar=no,scrollbars=no,resizable=yes`
    );

    if (popup) {
      setTimeout(() => {
        if (typeof this.onRequestSync === 'function') {
          this.onRequestSync();
        }
      }, 500);
      return popup;
    }
    return null;
  }

  _notifyStatus() {
    if (typeof this.onStatusChange === 'function') {
      this.onStatusChange(this.status, this.isConnected());
    }
  }
}
