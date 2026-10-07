# Cronómetro de Reuniones con Presentation API (Chromecast)

Sistema intuitivo y profesional de cronometraje para reuniones y asambleas. Permite transmitir el temporizador a una TV con Chromecast mediante la **Presentation API nativa** y controlar la reunión desde una consola limpia, responsiva y accesible para usuarios de todas las edades.

---

## 🚀 Características Principales

### 1. 📋 Panel Lateral de Participaciones con Drag & Drop
- **Detección Automática del Día**:
  - Sin botones manuales: el sistema detecta si hoy es **Martes / Entre semana** o **Domingo / Fin de semana** al cargar:
    - **Martes (Entre semana)**: Tesoros de la Biblia (10m), Perlas Escondidas (10m), Lectura de la Biblia (4m), Empiece Conversaciones (3m), Haga Revisitas (3m), Haga Discípulos (4m).
    - **Domingo (Fin de semana)**: Discurso Público (30m), Estudio de La Atalaya (60m).
- **Reordenación por Arrastre (Drag & Drop nativo)**:
  - Toma cualquier participación desde su ícono `⋮⋮` y arrástrala hacia arriba o hacia abajo para cambiar el orden de inmediato.
- **Sin palomitas (`✓`) distractoras**: Diseño limpio y enfocado.
- **Botón `+ Añadir`**: Para sumar cualquier intervención adicional en cualquier momento.

### 2. ⏱️ Cronómetro Inteligente y Adaptable
- **Llega a Cero al Borrar**: Si borras o pones en cero el campo de minutos asignados, el cronómetro marca `00:00` limpiamente sin forzar valores por defecto de 10 minutos.
- **4 Botones de Acción Universales**:
  - 🟢 **INICIAR**: Inicia el conteo regresivo.
  - 🟡 **PAUSAR**: Botón dedicado para pausar en cualquier instante.
  - 🔵 **SIGUIENTE PARTICIPACIÓN**: Guarda el tiempo de la parte actual (calculando si *Sobró* o *Se pasó*), carga la siguiente parte con sus minutos asignados y **se mantiene en pausa** (no arranca automáticamente hasta que le des a Iniciar).
  - 🏁 **FINALIZAR REUNIÓN**: Si estás en la última participación, el botón se convierte automáticamente en **"FINALIZAR REUNIÓN"** para cerrar el programa.
  - ⚪ **REINICIAR**: Restablece el tiempo de la parte actual.
- **Ajustes Rápidos**: `-1 min`, `-30 seg`, `+30 seg`, `+1 min`.

### 3. 📺 Transmisión a TV con Chromecast
- **Presentation API Nativa**: Se conecta a tu Chromecast físico o proyector compatible con un solo clic en **"Transmitir a TV"**.
- **Vista de TV dedicada (`presentation.html`)**:
  - Dígitos gigantes de alta legibilidad, fondo oscuro con ambient glow, y alerta cuando el tiempo se cumple (`SE PASÓ +MM:SS`).
- **Placa Única (TV y Control simultáneo)**:
  - Botón *"Mostrar Placa en Pantallas"*: proyecta la tarjeta del discursante (nombre, congregación, tema y cántico) en ambas pantallas a la vez.

### 4. 📊 Registro de Tiempos y Balance General
- Registro compacto para no quitar espacio innecesario:
  - Muestra si **`Sobró MM:SS`** (en verde) o **`Se pasó MM:SS`** (en rojo).
  - Balance global de la reunión (tiempo acumulado a favor o retraso general).
  - Botón **"📋 Copiar Resumen"** para WhatsApp/Notas y **"Limpiar"**.

### 5. 📱 100% Responsivo
- Diseñado para funcionar fluidamente en cualquier tamaño de pantalla: desde ventanas pequeñas de 400px (móviles/widgets de escritorio) hasta monitores grandes de 1440px+.

---

## 🛠️ Cómo Ejecutar

```bash
npm start
# o con python:
python -m http.server 8080
```
Abre en Chrome o Edge: `http://localhost:8080/index.html` (o directamente desde tu **GitHub Pages**).

### ⌨️ Atajos de Teclado
* <kbd>Espacio</kbd>: Iniciar / Pausar.
* <kbd>Enter</kbd>: Siguiente Participación / Finalizar.
* <kbd>F</kbd> (en la pantalla de TV): Pantalla Completa.