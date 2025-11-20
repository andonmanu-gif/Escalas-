// Configuración de escalas y opciones
const scales = [
    { name: 'Mayor', file: 'mayor.mp3' },
    { name: 'Menor Natural', file: 'menor-natural.mp3' },
    { name: 'Menor Armónica', file: 'menor-armonica.mp3' },
    { name: 'Menor Melódica', file: 'menor-melodica.mp3' },
    { name: 'Dórico', file: 'dorico.mp3' },
    { name: 'Frigio', file: 'frigio.mp3' },
    { name: 'Lidio', file: 'lidio.mp3' },
    { name: 'Mixolidio', file: 'mixolidio.mp3' },
    { name: 'Eólico', file: 'eolico.mp3' },
    { name: 'Locrio', file: 'locrio.mp3' }
];

// Estado de la aplicación
let currentScale = null;
let correctCount = 0;
let incorrectCount = 0;
let answered = false;
let audioContext = null;
let currentAudioBuffer = null;

// Elementos del DOM
const playBtn = document.getElementById('play-btn');
const optionsContainer = document.getElementById('options-container');
const feedback = document.getElementById('feedback');
const nextBtn = document.getElementById('next-btn');
const correctCountEl = document.getElementById('correct-count');
const incorrectCountEl = document.getElementById('incorrect-count');
const accuracyEl = document.getElementById('accuracy');
const audioFeedback = document.getElementById('audio-feedback');

// Inicializar la aplicación
function init() {
    // Crear contexto de audio
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Cargar primer ejercicio
    loadNewExercise();
    
    // Event listeners
    playBtn.addEventListener('click', playCurrentScale);
    nextBtn.addEventListener('click', loadNewExercise);
}

// Cargar nuevo ejercicio
function loadNewExercise() {
    // Resetear estado
    answered = false;
    feedback.classList.add('hidden');
    nextBtn.classList.add('hidden');
    audioFeedback.textContent = '';
    
    // Seleccionar escala aleatoria
    currentScale = scales[Math.floor(Math.random() * scales.length)];
    
    // Generar opciones (la correcta + 3 incorrectas aleatorias)
    const options = generateOptions(currentScale);
    
    // Renderizar opciones
    renderOptions(options);
    
    // Habilitar botón de reproducción
    playBtn.disabled = false;
}

// Generar opciones de respuesta
function generateOptions(correctScale) {
    const options = [correctScale];
    const availableScales = scales.filter(s => s.name !== correctScale.name);
    
    // Añadir 3 opciones incorrectas aleatorias
    while (options.length < 4) {
        const randomIndex = Math.floor(Math.random() * availableScales.length);
        const randomScale = availableScales[randomIndex];
        
        if (!options.includes(randomScale)) {
            options.push(randomScale);
        }
    }
    
    // Mezclar opciones
    return options.sort(() => Math.random() - 0.5);
}

// Renderizar opciones en el DOM
function renderOptions(options) {
    optionsContainer.innerHTML = '';
    
    options.forEach(scale => {
        const button = document.createElement('button');
        button.className = 'option-button';
        button.textContent = scale.name;
        button.addEventListener('click', () => checkAnswer(scale, button));
        optionsContainer.appendChild(button);
    });
}

// Reproducir escala actual
async function playCurrentScale() {
    if (!currentScale) return;
    
    playBtn.disabled = true;
    audioFeedback.textContent = 'Reproduciendo...';
    
    try {
        // Generar audio sintético de la escala
        await playScaleAudio(currentScale);
        audioFeedback.textContent = 'Puedes volver a escuchar';
    } catch (error) {
        console.error('Error al reproducir audio:', error);
        audioFeedback.textContent = 'Error al reproducir';
    } finally {
        playBtn.disabled = false;
    }
}

// Generar y reproducir audio sintético de escalas
async function playScaleAudio(scale) {
    const duration = 0.4; // Duración de cada nota
    const startTime = audioContext.currentTime;
    
    // Definir intervalos para cada tipo de escala (en semitonos desde la tónica)
    const scaleIntervals = {
        'Mayor': [0, 2, 4, 5, 7, 9, 11, 12],
        'Menor Natural': [0, 2, 3, 5, 7, 8, 10, 12],
        'Menor Armónica': [0, 2, 3, 5, 7, 8, 11, 12],
        'Menor Melódica': [0, 2, 3, 5, 7, 9, 11, 12],
        'Dórico': [0, 2, 3, 5, 7, 9, 10, 12],
        'Frigio': [0, 1, 3, 5, 7, 8, 10, 12],
        'Lidio': [0, 2, 4, 6, 7, 9, 11, 12],
        'Mixolidio': [0, 2, 4, 5, 7, 9, 10, 12],
        'Eólico': [0, 2, 3, 5, 7, 8, 10, 12],
        'Locrio': [0, 1, 3, 5, 6, 8, 10, 12]
    };
    
    const intervals = scaleIntervals[scale.name];
    const baseFreq = 261.63; // Do central (C4)
    
    intervals.forEach((interval, index) => {
        const freq = baseFreq * Math.pow(2, interval / 12);
        playNote(freq, startTime + (index * duration), duration);
    });
    
    // Esperar a que termine la reproducción
    return new Promise(resolve => {
        setTimeout(resolve, intervals.length * duration * 1000 + 100);
    });
}

// Reproducir una nota individual
function playNote(frequency, startTime, duration) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    // Envelope ADSR simple
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0.2, startTime + duration * 0.7);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
}

// Verificar respuesta
function checkAnswer(selectedScale, button) {
    if (answered) return;
    
    answered = true;
    const isCorrect = selectedScale.name === currentScale.name;
    
    // Actualizar estadísticas
    if (isCorrect) {
        correctCount++;
        correctCountEl.textContent = correctCount;
    } else {
        incorrectCount++;
        incorrectCountEl.textContent = incorrectCount;
    }
    
    updateAccuracy();
    
    // Mostrar feedback visual
    const allButtons = optionsContainer.querySelectorAll('.option-button');
    allButtons.forEach(btn => {
        btn.disabled = true;
        if (btn.textContent === currentScale.name) {
            btn.classList.add('correct');
        } else if (btn === button && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });
    
    // Mostrar mensaje de feedback
    feedback.classList.remove('hidden', 'correct', 'incorrect');
    if (isCorrect) {
        feedback.classList.add('correct');
        feedback.textContent = '✓ ¡Correcto! Es ' + currentScale.name;
    } else {
        feedback.classList.add('incorrect');
        feedback.textContent = '✗ Incorrecto. La escala correcta es ' + currentScale.name;
    }
    
    // Mostrar botón siguiente
    nextBtn.classList.remove('hidden');
}

// Actualizar precisión
function updateAccuracy() {
    const total = correctCount + incorrectCount;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    accuracyEl.textContent = accuracy + '%';
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
