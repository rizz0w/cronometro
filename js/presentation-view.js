// js/presentation-view.js - Vista del receptor en TV / Chromecast
(function () {
  'use strict';

  // Elementos DOM
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

  let broadcastChannel = null;

  function applyState(data) {
    if (!data) return;

    if (data.standby) {
      tvStandby.classList.remove('hidden');
      tvTimer.classList.add('hidden');
      tvLapBadge.classList.add('hidden');
      tvStatusBadge.classList.add('hidden');
      tvSpeakerOverlay.classList.add('hidden');
      return;
    }

    tvStandby.classList.add('hidden');
    tvTimer.classList.remove('hidden');

    // Tiempo formateado
    if (data.formattedTime !== undefined) {
      tvTimer.textContent = data.formattedTime;
    }

    // Estados visuales (negativo / último minuto)
    if (data.isNegative) {
      tvTimer.classList.add('negative');
      tvTimer.classList.remove('warning');
      tvStatusBadge.classList.remove('hidden');
      tvStatusText.textContent = data.overtimeText || 'SE PASÓ';
    } else {
      tvTimer.classList.remove('negative');
      if (data.differenceMs !== undefined && data.differenceMs <= 60000 && data.differenceMs > 0 && data.running) {
        tvTimer.classList.add('warning');
      } else {
        tvTimer.classList.remove('warning');
      }
      tvStatusBadge.classList.add('hidden');
    }

    // Etiqueta de la parte eliminada en pantalla de TV
    if (tvLapBadge) {
      tvLapBadge.classList.add('hidden');
    }

    // Placa de información del discursante y tema
    if (data.showSpeakerModal) {
      // Discursante: si no hay nada en el campo, no mostrar nada
      if (data.speaker) {
        tvSpeakerName.textContent = data.speaker.toUpperCase();
        tvSpeakerName.classList.remove('hidden');
        tvSpeakerName.style.display = '';
      } else {
        tvSpeakerName.textContent = '';
        tvSpeakerName.classList.add('hidden');
        tvSpeakerName.style.display = 'none';
      }

      // Congregación: si no hay nada en el campo, no mostrar nada
      if (data.origin) {
        tvSpeakerOrigin.textContent = data.origin.toUpperCase();
        tvSpeakerOrigin.classList.remove('hidden');
        tvSpeakerOrigin.style.display = '';
      } else {
        tvSpeakerOrigin.textContent = '';
        tvSpeakerOrigin.classList.add('hidden');
        tvSpeakerOrigin.style.display = 'none';
      }

      // Tema: si no hay nada en el campo, no mostrar nada
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

      // Canción: si no hay nada en el campo, no mostrar nada
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

  // 1. Receptor de Presentation API
  function initPresentationReceiver() {
    if (navigator.presentation && navigator.presentation.receiver) {
      navigator.presentation.receiver.connectionList
        .then((list) => {
          list.connections.forEach(setupConnection);
          list.addEventListener('connectionavailable', (event) => {
            setupConnection(event.connection);
          });
        })
        .catch((err) => {
          console.warn('Error en connectionList de presentación:', err);
        });
    }
  }

  function setupConnection(connection) {
    connection.addEventListener('message', (event) => {
      try {
        const payload = JSON.parse(event.data);
        applyState(payload);
      } catch (err) {
        console.error('Error parseando mensaje en TV:', err);
      }
    });

    try {
      connection.send(JSON.stringify({ type: 'RECEIVER_READY' }));
    } catch (e) {}
  }

  // 2. Receptor de BroadcastChannel
  try {
    broadcastChannel = new BroadcastChannel('cronometro_presentation_sync');
    broadcastChannel.addEventListener('message', (event) => {
      if (event.data) {
        applyState(event.data);
      }
    });
    broadcastChannel.postMessage({ type: 'RECEIVER_READY' });
  } catch (e) {}

  // 3. Receptor de localStorage
  window.addEventListener('storage', (event) => {
    if (event.key === 'cronometro_sync_state' && event.newValue) {
      try {
        applyState(JSON.parse(event.newValue));
      } catch (e) {}
    }
  });

  try {
    const cached = localStorage.getItem('cronometro_sync_state');
    if (cached) {
      applyState(JSON.parse(cached));
    }
  } catch (e) {}

  // Controles de pantalla completa con tecla F o doble clic
  document.addEventListener('keydown', (e) => {
    if (e.key === 'f' || e.key === 'F') {
      toggleFullscreen();
    }
  });

  document.addEventListener('dblclick', toggleFullscreen);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }

  initPresentationReceiver();
})();
