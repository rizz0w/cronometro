// app.js - Punto de entrada / re-exportación modular
// Toda la lógica ha sido desacoplada en módulos individuales dentro de /js:
// - js/timer.js                (Motor del cronómetro sin deriva)
// - js/laps.js                 (Gestor de cola de vueltas y parser masivo)
// - js/history.js              (Registro de balances y exportaciones)
// - js/audio.js                (Sintetizador Web Audio API)
// - js/presentation-manager.js (Presentation API y Chromecast)
// - js/main.js                 (Coordinador de interfaz)
// - js/utils.js                (Utilidades comunes)

import './js/main.js';
