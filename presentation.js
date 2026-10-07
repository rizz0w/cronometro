// presentation.js - Receptor para TV (Chromecast & Pantalla Secundaria)
(function () {
  'use strict';

  // Elementos del DOM
  const tvTimer = document.getElementById('tv-timer');
  const tvLapBadge = document.getElementById('tv-lap-badge');
  const tvLapText = document.getElementById('tv-lap-text');
  const tvStatusBadge = document.getElementById('tv-status-badge');
  const tvStatusText = document.getElementById('tv-status-text');
  const tvSpeakerOverlay = document.getElementById('tv-speaker-overlay');
  const tvSpeakerName = document.getElementById('tv-speaker-name');
  const tvSpeakerOrigin = document.getElementById('tv-speaker-origin');
  const tvSpeakerTopic = document.getElementById('tv-speaker-topic');
  const tvDivider = document.getElementById('tv-divider') || (tvSpeakerOverlay ? tvSpeakerOverlay.querySelector('.tv-divider') : null);
  const tvSpeakerSongWrap = document.getElementById('tv-speaker-song-wrap');
  const tvSpeakerSong = document.getElementById('tv-speaker-song');
  const tvStandby = document.getElementById('tv-standby');

  // Canal de sincronización local (BroadcastChannel)
  let broadcastChannel = null;
  try {
    broadcastChannel = new BroadcastChannel('cronometro_presentation_sync');
  } catch (e) {
    console.warn('BroadcastChannel no soportado en este entorno', e);
  }

  // Estado recibido
  let lastState = null;

  // Actualizar la interfaz con el estado recibido del controlador
  function applyState(data) {
    if (!data) return;
    lastState = data;

    // Si está en modo standby (ningún temporizador inicializado o cerrado)
    if (data.standby) {
      tvStandby.classList.remove('hidden');
      tvTimer.classList.add('hidden');
      tvLapBadge.classList.add('hidden');
      tvStatusBadge.classList.add('hidden');
      tvSpeakerOverlay.classList.add('hidden');
      return;
    } else {
      tvStandby.classList.add('hidden');
      tvTimer.classList.remove('hidden');
    }

    // Actualizar tiempo en el cronómetro
    if (data.formattedTime !== undefined) {
      tvTimer.textContent = data.formattedTime;
    }

    // Manejar estilo de tiempo negativo / tiempo cumplido
    if (data.isNegative) {
      tvTimer.classList.add('negative');
      tvStatusBadge.classList.remove('hidden');
      tvStatusText.textContent = data.overtimeText || 'TIEMPO EXCEDIDO';
    } else {
      tvTimer.classList.remove('negative');
      if (data.differenceMs !== undefined && data.differenceMs <= 60000 && data.differenceMs > 0 && data.running) {
        tvTimer.classList.add('warning'); // Último minuto
      } else {
        tvTimer.classList.remove('warning');
      }
      tvStatusBadge.classList.add('hidden');
    }

    // Etiqueta de la parte eliminada en pantalla de TV
    if (tvLapBadge) {
      tvLapBadge.classList.add('hidden');
    }

    // Modal / Placa de información del discursante
    if (data.showSpeakerModal && !data.hideSpeakerAlways) {
      if (data.speaker) {
        tvSpeakerName.textContent = data.speaker.toUpperCase();
        tvSpeakerName.classList.remove('hidden');
        tvSpeakerName.style.display = '';
      } else {
        tvSpeakerName.textContent = '';
        tvSpeakerName.classList.add('hidden');
        tvSpeakerName.style.display = 'none';
      }
      
      if (data.origin) {
        tvSpeakerOrigin.textContent = data.origin.toUpperCase();
        tvSpeakerOrigin.classList.remove('hidden');
        tvSpeakerOrigin.style.display = '';
      } else {
        tvSpeakerOrigin.textContent = '';
        tvSpeakerOrigin.classList.add('hidden');
        tvSpeakerOrigin.style.display = 'none';
      }

      if (data.topic) {
        tvSpeakerTopic.textContent = data.topic;
        tvSpeakerTopic.classList.remove('hidden');
        tvSpeakerTopic.style.display = '';
      } else {
        tvSpeakerTopic.textContent = '';
        tvSpeakerTopic.classList.add('hidden');
        tvSpeakerTopic.style.display = 'none';
      }

      // Línea divisora del tema: se mantiene siempre como elemento que marca el tema
      if (tvDivider) {
        tvDivider.classList.remove('hidden');
        tvDivider.style.display = '';
      }

      if (data.song) {
        tvSpeakerSong.textContent = `Cántico ${data.song}`;
        tvSpeakerSongWrap.classList.remove('hidden');
        tvSpeakerSongWrap.style.display = '';
      } else {
        tvSpeakerSong.textContent = '';
        tvSpeakerSongWrap.classList.add('hidden');
        tvSpeakerSongWrap.style.display = 'none';
      }

      tvSpeakerOverlay.classList.remove('hidden');
    } else {
      tvSpeakerOverlay.classList.add('hidden');
    }
  }

  // Configurar receptor de Presentation API nativa
  function initPresentationReceiver() {
    if (navigator.presentation && navigator.presentation.receiver) {
      navigator.presentation.receiver.connectionList
        .then((connectionList) => {
          connectionList.connections.forEach((connection) => {
            setupConnection(connection);
          });

          connectionList.addEventListener('connectionavailable', (event) => {
            setupConnection(event.connection);
          });
        })
        .catch((err) => {
          console.warn('Error accediendo a connectionList:', err);
        });
    }
  }

  function setupConnection(connection) {
    // Escuchar mensajes entrantes desde el controlador
    connection.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        applyState(data);
      } catch (err) {
        console.error('Error procesando mensaje en TV:', err);
      }
    });

    connection.addEventListener('close', () => {
      console.log('Conexión de presentación cerrada');
    });

    connection.addEventListener('terminate', () => {
      console.log('Conexión de presentación terminada');
    });

    // Notificar al controlador que la TV está lista
    try {
      connection.send(JSON.stringify({ type: 'RECEIVER_READY' }));
    } catch (e) {}
  }

  // Configurar canal de sincronización por BroadcastChannel
  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', (event) => {
      if (event.data) {
        applyState(event.data);
      }
    });

    // Solicitar estado actual inmediatamente
    broadcastChannel.postMessage({ type: 'RECEIVER_READY' });
  }

  // Sincronización secundaria por localStorage (útil entre ventanas)
  window.addEventListener('storage', (event) => {
    if (event.key === 'cronometro_sync_state' && event.newValue) {
      try {
        const data = JSON.parse(event.newValue);
        applyState(data);
      } catch (e) {}
    }
  });

  // Leer estado previo si ya existe en localStorage
  try {
    const cached = localStorage.getItem('cronometro_sync_state');
    if (cached) {
      applyState(JSON.parse(cached));
    }
  } catch (e) {}

  // Soporte de pantalla completa con doble clic o tecla 'F'
  document.addEventListener('keydown', (e) => {
    if (e.key === 'f' || e.key === 'F') {
      toggleFullscreen();
    }
  });

  document.addEventListener('dblclick', () => {
    toggleFullscreen();
  });

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }

  // Iniciar receptor
  initPresentationReceiver();
})();
