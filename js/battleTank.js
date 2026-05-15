// Elementos del DOM
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const livesElement = document.getElementById('lives');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const finalScoreElement = document.getElementById('finalScore');

// Controles de audio
const musicToggle = document.getElementById('musicToggle');
const sfxToggle = document.getElementById('sfxToggle');
const musicVolume = document.getElementById('musicVolume');
const sfxVolume = document.getElementById('sfxVolume');
const musicVolumeValue = document.getElementById('musicVolumeValue');
const sfxVolumeValue = document.getElementById('sfxVolumeValue');
const testAudioBtn = document.getElementById('testAudio');

// Configuración del canvas
canvas.width = canvas.parentElement.offsetWidth;
canvas.height = canvas.parentElement.offsetHeight;

// Variables del juego
let gameRunning = false;
let player = {};
let enemies = [];
let bullets = [];
let powerUps = [];
let walls = [];
let score = 0;
let lives = 3;
let level = 1;
let keys = {};
let lastTime = 0;
let enemySpawnTimer = 0;
let powerUpTimer = 0;
let isMoving = false;

// Configuración del juego - VELOCIDAD REDUCIDA 50%
const config = {
    playerSpeed: 2.5,        // Reducido de 5 a 2.5 (50%)
    bulletSpeed: 4,          // Reducido de 8 a 4 (50%)
    enemySpeed: 1,           // Reducido de 2 a 1 (50%)
    enemyFireRate: 0.005,    // Reducido de 0.01 a 0.005 (50%)
    enemySpawnRate: 4000,    // Aumentado de 2000 a 4000 ms
    powerUpSpawnRate: 20000, // Aumentado de 10000 a 20000 ms
    maxEnemies: 5,
    baseSize: 30
};

// Configuración de audio
let musicEnabled = true;
let sfxEnabled = true;
let musicVolumeLevel = 0.5;
let sfxVolumeLevel = 0.7;

// Sistema de audio mejorado
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.musicSource = null;
        this.isMusicPlaying = false;
        this.sfxGainNode = null;
        this.musicGainNode = null;
        this.initialized = false;
        this.musicBuffer = null;
    }

    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.sfxGainNode = this.audioContext.createGain();
            this.musicGainNode = this.audioContext.createGain();
            
            this.sfxGainNode.connect(this.audioContext.destination);
            this.musicGainNode.connect(this.audioContext.destination);
            
            this.sfxGainNode.gain.value = sfxEnabled ? sfxVolumeLevel : 0;
            this.musicGainNode.gain.value = musicEnabled ? musicVolumeLevel : 0;
            
            this.initialized = true;
            console.log("✅ AudioManager inicializado correctamente");
            
            // Precargar música Erika
            await this.preloadErikaMusic();
            
        } catch (error) {
            console.error("❌ Error inicializando AudioManager:", error);
            this.initialized = false;
        }
    }

    // Precargar música Erika
    async preloadErikaMusic() {
        try {
            const response = await fetch('assets/audio/erika.mp3');
            if (!response.ok) throw new Error('Archivo no encontrado');
            
            const arrayBuffer = await response.arrayBuffer();
            this.musicBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            console.log("✅ Música Erika precargada correctamente");
        } catch (error) {
            console.warn("⚠️ No se pudo cargar erika.mp3, se usará música generada");
            this.musicBuffer = null;
        }
    }

    // Reproducir música Erika
    playErikaMusic() {
        if (!this.initialized || !musicEnabled) return;

        try {
            // Si tenemos el buffer del archivo MP3, usarlo
            if (this.musicBuffer) {
                this.musicSource = this.audioContext.createBufferSource();
                this.musicSource.buffer = this.musicBuffer;
                this.musicSource.connect(this.musicGainNode);
                this.musicSource.loop = true;
                this.musicSource.start();
                this.isMusicPlaying = true;
                console.log("🎵 Reproduciendo Erika desde archivo MP3");
            } else {
                // Fallback a música generada
                this.playGeneratedErika();
            }
        } catch (error) {
            console.error("❌ Error reproduciendo Erika:", error);
            this.playGeneratedErika();
        }
    }

    // Música Erika generada programáticamente
    playGeneratedErika() {
        if (!this.initialized) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'sine';
            gainNode.gain.value = musicVolumeLevel * 0.3;
            
            oscillator.connect(gainNode);
            gainNode.connect(this.musicGainNode);
            
            // Melodía característica de Erika
            const melody = [
                { freq: 392, duration: 0.8 },  // G4
                { freq: 440, duration: 0.8 },  // A4  
                { freq: 494, duration: 0.8 },  // B4
                { freq: 392, duration: 0.8 },  // G4
                { freq: 523, duration: 0.8 },  // C5
                { freq: 494, duration: 0.8 },  // B4
                { freq: 440, duration: 0.8 },  // A4
                { freq: 392, duration: 0.8 }   // G4
            ];
            
            const startTime = this.audioContext.currentTime + 0.1;
            let currentTime = startTime;
            
            // Programar la melodía
            melody.forEach((note) => {
                oscillator.frequency.setValueAtTime(note.freq, currentTime);
                currentTime += note.duration;
            });
            
            this.musicSource = oscillator;
            this.musicSource.start(startTime);
            this.musicSource.stop(currentTime);
            
            // Repetir la melodía
            const totalDuration = melody.reduce((sum, note) => sum + note.duration, 0);
            this.musicSource.onended = () => {
                if (musicEnabled && this.isMusicPlaying) {
                    this.playGeneratedErika();
                }
            };
            
            this.isMusicPlaying = true;
            console.log("🎵 Reproduciendo Erika generada");
            
        } catch (error) {
            console.error("❌ Error en música generada:", error);
        }
    }

    stopMusic() {
        if (this.musicSource) {
            try {
                this.musicSource.stop();
            } catch (e) {
                // Ignorar error si ya estaba detenido
            }
            this.musicSource = null;
        }
        this.isMusicPlaying = false;
    }

    setMusicVolume(volume) {
        if (this.musicGainNode) {
            this.musicGainNode.gain.value = musicEnabled ? volume : 0;
        }
    }

    setSfxVolume(volume) {
        if (this.sfxGainNode) {
            this.sfxGainNode.gain.value = sfxEnabled ? volume : 0;
        }
    }

    // Efectos de sonido
    playShootSound() {
        if (!sfxEnabled || !this.initialized) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
            gainNode.gain.setValueAtTime(sfxVolumeLevel * 0.4, this.audioContext.currentTime);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.sfxGainNode);
            
            // Decaimiento rápido
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.2);
            
        } catch (error) {
            console.error("❌ Error en sonido de disparo:", error);
        }
    }

    playExplosionSound() {
        if (!sfxEnabled || !this.initialized) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
            gainNode.gain.setValueAtTime(sfxVolumeLevel * 0.6, this.audioContext.currentTime);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.sfxGainNode);
            
            // Decaimiento más lento para explosión
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.8);
            oscillator.frequency.exponentialRampToValueAtTime(40, this.audioContext.currentTime + 0.8);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.8);
            
        } catch (error) {
            console.error("❌ Error en sonido de explosión:", error);
        }
    }

    playPowerUpSound() {
        if (!sfxEnabled || !this.initialized) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(sfxVolumeLevel * 0.4, this.audioContext.currentTime);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.sfxGainNode);
            
            // Arpegio ascendente alegre
            oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659.25, this.audioContext.currentTime + 0.1); // E5
            oscillator.frequency.setValueAtTime(783.99, this.audioContext.currentTime + 0.2); // G5
            oscillator.frequency.setValueAtTime(1046.50, this.audioContext.currentTime + 0.3); // C6
            
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.4);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.4);
            
        } catch (error) {
            console.error("❌ Error en sonido de power-up:", error);
        }
    }

    playGameOverSound() {
        if (!sfxEnabled || !this.initialized) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(sfxVolumeLevel * 0.5, this.audioContext.currentTime);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.sfxGainNode);
            
            // Descenso triste
            oscillator.frequency.setValueAtTime(392, this.audioContext.currentTime);   // G4
            oscillator.frequency.setValueAtTime(349.23, this.audioContext.currentTime + 0.3); // F4
            oscillator.frequency.setValueAtTime(293.66, this.audioContext.currentTime + 0.6); // D4
            oscillator.frequency.setValueAtTime(261.63, this.audioContext.currentTime + 0.9); // C4
            
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1.2);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 1.2);
            
        } catch (error) {
            console.error("❌ Error en sonido de game over:", error);
        }
    }

    playTankMoveSound() {
        if (!sfxEnabled || !this.initialized) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(80, this.audioContext.currentTime);
            gainNode.gain.setValueAtTime(sfxVolumeLevel * 0.2, this.audioContext.currentTime);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.sfxGainNode);
            
            // Modulación para sonido de motor
            const startTime = this.audioContext.currentTime;
            for (let i = 0; i < 10; i++) {
                const time = startTime + i * 0.1;
                const freq = 80 + Math.random() * 30;
                oscillator.frequency.setValueAtTime(freq, time);
            }
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 1.0);
            
        } catch (error) {
            console.error("❌ Error en sonido de motor:", error);
        }
    }

    // Probar todos los sonidos
    playTestSound() {
        if (!this.initialized) {
            console.log("⚠️ Audio no inicializado");
            return;
        }
        
        console.log("🔊 Probando sonidos...");
        this.playShootSound();
        setTimeout(() => this.playExplosionSound(), 300);
        setTimeout(() => this.playPowerUpSound(), 600);
        setTimeout(() => this.playTankMoveSound(), 900);
    }

    // Verificar estado del audio
    getStatus() {
        return {
            initialized: this.initialized,
            musicPlaying: this.isMusicPlaying,
            musicEnabled: musicEnabled,
            sfxEnabled: sfxEnabled,
            musicVolume: musicVolumeLevel,
            sfxVolume: sfxVolumeLevel
        };
    }
}

// Instancia global del administrador de audio
const audioManager = new AudioManager();

// Inicializar controles de audio
function initAudioControls() {
    // Actualizar valores visuales iniciales
    musicVolumeValue.textContent = `${musicVolume.value}%`;
    sfxVolumeValue.textContent = `${sfxVolume.value}%`;
    
    // Control de música - ON/OFF
    musicToggle.addEventListener('click', () => {
        musicEnabled = !musicEnabled;
        musicToggle.textContent = `Música: ${musicEnabled ? 'ON' : 'OFF'}`;
        musicToggle.classList.toggle('active', musicEnabled);
        
        if (musicEnabled) {
            audioManager.setMusicVolume(musicVolumeLevel);
            if (gameRunning && !audioManager.isMusicPlaying) {
                audioManager.playErikaMusic();
            }
        } else {
            audioManager.setMusicVolume(0);
            audioManager.stopMusic();
        }
        
        console.log("🎵 Música:", musicEnabled ? "ACTIVADA" : "DESACTIVADA");
    });
    
    // Control de efectos - ON/OFF
    sfxToggle.addEventListener('click', () => {
        sfxEnabled = !sfxEnabled;
        sfxToggle.textContent = `EFX: ${sfxEnabled ? 'ON' : 'OFF'}`;
        sfxToggle.classList.toggle('active', sfxEnabled);
        audioManager.setSfxVolume(sfxEnabled ? sfxVolumeLevel : 0);
        console.log("🔊 Efectos:", sfxEnabled ? "ACTIVADOS" : "DESACTIVADOS");
    });
    
    // Control de volumen de música
    musicVolume.addEventListener('input', (e) => {
        musicVolumeLevel = e.target.value / 100;
        musicVolumeValue.textContent = `${e.target.value}%`;
        audioManager.setMusicVolume(musicVolumeLevel);
        console.log("🎵 Volumen música:", Math.round(musicVolumeLevel * 100) + "%");
    });
    
    // Control de volumen de efectos
    sfxVolume.addEventListener('input', (e) => {
        sfxVolumeLevel = e.target.value / 100;
        sfxVolumeValue.textContent = `${e.target.value}%`;
        audioManager.setSfxVolume(sfxVolumeLevel);
        console.log("🔊 Volumen efectos:", Math.round(sfxVolumeLevel * 100) + "%");
    });
    
    // Botón de prueba de audio
    testAudioBtn.addEventListener('click', () => {
        console.log("🎵 Estado audio:", audioManager.getStatus());
        audioManager.playTestSound();
    });
    
    console.log("✅ Controles de audio inicializados");
}

// Clases del juego
class Tank {
    constructor(x, y, color, isPlayer = false) {
        this.x = x;
        this.y = y;
        this.width = config.baseSize;
        this.height = config.baseSize;
        this.color = color;
        this.direction = 0; // 0: up, 1: right, 2: down, 3: left
        this.isPlayer = isPlayer;
        this.speed = isPlayer ? config.playerSpeed : config.enemySpeed;
        this.cooldown = 0;
        this.health = 1;
        this.lastMoveSound = 0;
    }
    
    update(deltaTime) {
        // Movimiento del jugador
        if (this.isPlayer) {
            const wasMoving = isMoving;
            isMoving = keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight;
            
            if (keys.ArrowUp) {
                this.direction = 0;
                this.y -= this.speed;
            }
            if (keys.ArrowRight) {
                this.direction = 1;
                this.x += this.speed;
            }
            if (keys.ArrowDown) {
                this.direction = 2;
                this.y += this.speed;
            }
            if (keys.ArrowLeft) {
                this.direction = 3;
                this.x -= this.speed;
            }
            
            // Sonido de motor cuando empieza a moverse
            if (isMoving && !wasMoving) {
                audioManager.playTankMoveSound();
                this.lastMoveSound = Date.now();
            }
            
            // Repetir sonido de motor cada segundo mientras se mueve
            if (isMoving && Date.now() - this.lastMoveSound > 1000) {
                audioManager.playTankMoveSound();
                this.lastMoveSound = Date.now();
            }
            
            // Mantener dentro de los límites
            this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
            this.y = Math.max(0, Math.min(canvas.height - this.height, this.y));
            
            // Enfriamiento de disparo
            if (this.cooldown > 0) {
                this.cooldown -= deltaTime;
            }
        } else {
            // Comportamiento del enemigo
            // Movimiento aleatorio simple
            if (Math.random() < 0.01) {
                this.direction = Math.floor(Math.random() * 4);
            }
            
            switch (this.direction) {
                case 0: this.y -= this.speed; break;
                case 1: this.x += this.speed; break;
                case 2: this.y += this.speed; break;
                case 3: this.x -= this.speed; break;
            }
            
            // Mantener dentro de los límites
            if (this.x < 0) this.direction = 1;
            if (this.x > canvas.width - this.width) this.direction = 3;
            if (this.y < 0) this.direction = 2;
            if (this.y > canvas.height - this.height) this.direction = 0;
            
            // Disparo aleatorio
            if (Math.random() < config.enemyFireRate) {
                this.fire();
            }
        }
    }
    
    fire() {
        if (this.cooldown > 0) return;
        
        let bulletX, bulletY;
        
        switch (this.direction) {
            case 0: // up
                bulletX = this.x + this.width / 2 - 2;
                bulletY = this.y;
                break;
            case 1: // right
                bulletX = this.x + this.width;
                bulletY = this.y + this.height / 2 - 2;
                break;
            case 2: // down
                bulletX = this.x + this.width / 2 - 2;
                bulletY = this.y + this.height;
                break;
            case 3: // left
                bulletX = this.x;
                bulletY = this.y + this.height / 2 - 2;
                break;
        }
        
        bullets.push(new Bullet(bulletX, bulletY, this.direction, this.isPlayer));
        
        if (this.isPlayer) {
            audioManager.playShootSound();
            this.cooldown = 600; // Cooldown aumentado por velocidad reducida
        }
    }
    
    draw() {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.direction * Math.PI / 2);
        
        // Cuerpo del tanque
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // Detalles del tanque
        ctx.fillStyle = '#333';
        ctx.fillRect(-this.width / 4, -this.height / 4, this.width / 2, this.height / 2);
        
        // Cañón del tanque
        ctx.fillStyle = '#555';
        ctx.fillRect(0, -3, this.width / 2 + 5, 6);
        
        // Efecto de luz en el tanque del jugador
        if (this.isPlayer) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(-this.width / 4, -this.height / 4, this.width / 8, this.height / 2);
        }
        
        ctx.restore();
    }
}

class Bullet {
    constructor(x, y, direction, isPlayer) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 4;
        this.direction = direction;
        this.speed = config.bulletSpeed;
        this.isPlayer = isPlayer;
        this.color = isPlayer ? '#ffcc00' : '#ff3333';
    }
    
    update() {
        switch (this.direction) {
            case 0: this.y -= this.speed; break;
            case 1: this.x += this.speed; break;
            case 2: this.y += this.speed; break;
            case 3: this.x -= this.speed; break;
        }
    }
    
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Efecto de brillo en la bala
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x + 1, this.y + 1, 2, 2);
        
        // Estela de la bala
        ctx.fillStyle = this.isPlayer ? 'rgba(255, 204, 0, 0.3)' : 'rgba(255, 51, 51, 0.3)';
        switch (this.direction) {
            case 0: ctx.fillRect(this.x, this.y + 4, 4, 8); break;
            case 1: ctx.fillRect(this.x - 8, this.y, 8, 4); break;
            case 2: ctx.fillRect(this.x, this.y - 8, 4, 8); break;
            case 3: ctx.fillRect(this.x + 4, this.y, 8, 4); break;
        }
    }
    
    isOutOfBounds() {
        return this.x < -10 || this.x > canvas.width + 10 || this.y < -10 || this.y > canvas.height + 10;
    }
}

class PowerUp {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.type = Math.floor(Math.random() * 3); // 0: vida, 1: velocidad, 2: poder
        this.colors = ['#ff3333', '#33ff33', '#3333ff'];
        this.pulse = 0;
    }
    
    update() {
        this.pulse += 0.1;
    }
    
    draw() {
        const pulseSize = Math.sin(this.pulse) * 2;
        
        ctx.fillStyle = this.colors[this.type];
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2 + pulseSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Efecto de brillo pulsante
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2 - 3, this.y + this.height / 2 - 3, 3 + pulseSize/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Símbolo según el tipo
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const symbols = ['♥', '⚡', '✦'];
        ctx.fillText(symbols[this.type], this.x + this.width / 2, this.y + this.height / 2);
    }
}

class Wall {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    
    draw() {
        // Base del muro
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Textura de ladrillo
        ctx.strokeStyle = '#5D2906';
        ctx.lineWidth = 1;
        
        // Líneas verticales
        for (let i = 5; i < this.width; i += 10) {
            ctx.beginPath();
            ctx.moveTo(this.x + i, this.y);
            ctx.lineTo(this.x + i, this.y + this.height);
            ctx.stroke();
        }
        
        // Líneas horizontales
        for (let i = 5; i < this.height; i += 10) {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + i);
            ctx.lineTo(this.x + this.width, this.y + i);
            ctx.stroke();
        }
        
        // Sombra
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}

// Funciones del juego
function initGame() {
    // Reiniciar variables del juego
    player = new Tank(canvas.width / 2, canvas.height - 100, '#4CAF50', true);
    enemies = [];
    bullets = [];
    powerUps = [];
    walls = [];
    score = 0;
    lives = 3;
    level = 1;
    
    // Crear muros
    createWalls();
    
    // Actualizar UI
    updateUI();
    
    // Iniciar música si está habilitada
    if (musicEnabled) {
        setTimeout(() => {
            audioManager.playErikaMusic();
        }, 500);
    }
    
    console.log("🎮 Juego inicializado - Nivel", level);
}

function createWalls() {
    // Muros en las esquinas
    walls.push(new Wall(50, 50, 100, 30));
    walls.push(new Wall(canvas.width - 150, 50, 100, 30));
    walls.push(new Wall(50, canvas.height - 80, 100, 30));
    walls.push(new Wall(canvas.width - 150, canvas.height - 80, 100, 30));
    
    // Muros centrales
    walls.push(new Wall(canvas.width / 2 - 150, canvas.height / 2 - 15, 100, 30));
    walls.push(new Wall(canvas.width / 2 + 50, canvas.height / 2 - 15, 100, 30));
    
    // Muros adicionales para más estrategia
    walls.push(new Wall(200, 200, 30, 100));
    walls.push(new Wall(canvas.width - 230, 200, 30, 100));
}

function spawnEnemy() {
    if (enemies.length >= config.maxEnemies) return;
    
    let x, y;
    const side = Math.floor(Math.random() * 4);
    
    switch (side) {
        case 0: // top
            x = Math.random() * (canvas.width - config.baseSize);
            y = 0;
            break;
        case 1: // right
            x = canvas.width - config.baseSize;
            y = Math.random() * (canvas.height - config.baseSize);
            break;
        case 2: // bottom
            x = Math.random() * (canvas.width - config.baseSize);
            y = canvas.height - config.baseSize;
            break;
        case 3: // left
            x = 0;
            y = Math.random() * (canvas.height - config.baseSize);
            break;
    }
    
    // Verificar que no aparezca encima del jugador
    const minDistance = 150;
    const distance = Math.sqrt((x - player.x) ** 2 + (y - player.y) ** 2);
    if (distance < minDistance) {
        return spawnEnemy(); // Reintentar
    }
    
    enemies.push(new Tank(x, y, '#FF5252'));
    console.log("🎯 Enemigo aparecido - Total:", enemies.length);
}

function spawnPowerUp() {
    if (powerUps.length >= 2) return; // Máximo 2 power-ups en pantalla
    
    const x = 50 + Math.random() * (canvas.width - 100);
    const y = 50 + Math.random() * (canvas.height - 100);
    
    // Verificar que no aparezca en un muro
    for (const wall of walls) {
        if (x < wall.x + wall.width && x + 20 > wall.x &&
            y < wall.y + wall.height && y + 20 > wall.y) {
            return spawnPowerUp(); // Reintentar
        }
    }
    
    powerUps.push(new PowerUp(x, y));
    console.log("✨ Power-up aparecido");
}

function checkCollisions() {
    // Colisiones de balas con tanques
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        // Colisión con jugador
        if (!bullet.isPlayer && 
            bullet.x < player.x + player.width &&
            bullet.x + bullet.width > player.x &&
            bullet.y < player.y + player.height &&
            bullet.y + bullet.height > player.y) {
            
            bullets.splice(i, 1);
            playerHit();
            continue;
        }
        
        // Colisión con enemigos
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            
            if (bullet.isPlayer && 
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y) {
                
                bullets.splice(i, 1);
                enemies.splice(j, 1);
                score += 100;
                audioManager.playExplosionSound();
                updateUI();
                
                console.log("💥 Enemigo destruido! Puntuación:", score);
                
                // Verificar si todos los enemigos fueron eliminados
                if (enemies.length === 0) {
                    nextLevel();
                }
                break;
            }
        }
        
        // Colisión con muros
        for (const wall of walls) {
            if (bullet.x < wall.x + wall.width &&
                bullet.x + bullet.width > wall.x &&
                bullet.y < wall.y + wall.height &&
                bullet.y + bullet.height > wall.y) {
                
                bullets.splice(i, 1);
                break;
            }
        }
        
        // Eliminar balas fuera de pantalla
        if (bullet.isOutOfBounds()) {
            bullets.splice(i, 1);
        }
    }
    
    // Colisiones de jugador con power-ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        
        if (player.x < powerUp.x + powerUp.width &&
            player.x + player.width > powerUp.x &&
            player.y < powerUp.y + powerUp.height &&
            player.y + player.height > powerUp.y) {
            
            applyPowerUp(powerUp.type);
            audioManager.playPowerUpSound();
            powerUps.splice(i, 1);
            console.log("🔮 Power-up recolectado! Tipo:", powerUp.type);
        }
    }
    
    // Colisiones de tanques con muros
    for (const wall of walls) {
        // Jugador con muros
        if (player.x < wall.x + wall.width &&
            player.x + player.width > wall.x &&
            player.y < wall.y + wall.height &&
            player.y + player.height > wall.y) {
            
            // Empujar al jugador fuera del muro
            if (player.direction === 0) player.y = wall.y + wall.height;
            if (player.direction === 1) player.x = wall.x - player.width;
            if (player.direction === 2) player.y = wall.y - player.height;
            if (player.direction === 3) player.x = wall.x + wall.width;
        }
        
        // Enemigos con muros
        for (const enemy of enemies) {
            if (enemy.x < wall.x + wall.width &&
                enemy.x + enemy.width > wall.x &&
                enemy.y < wall.y + wall.height &&
                enemy.y + enemy.height > wall.y) {
                
                // Cambiar dirección del enemigo
                enemy.direction = Math.floor(Math.random() * 4);
            }
        }
    }
}

function applyPowerUp(type) {
    switch (type) {
        case 0: // Vida
            lives = Math.min(lives + 1, 5);
            console.log("❤️ Vida extra! Total:", lives);
            break;
        case 1: // Velocidad
            player.speed += 1;
            console.log("⚡ Velocidad aumentada! Velocidad:", player.speed);
            setTimeout(() => {
                player.speed = config.playerSpeed;
                console.log("⚡ Velocidad normalizada");
            }, 5000);
            break;
        case 2: // Poder - Disparo triple
            const originalFire = player.fire;
            player.fire = function() {
                const directions = [
                    player.direction,
                    (player.direction - 1 + 4) % 4,
                    (player.direction + 1) % 4
                ];
                
                for (const dir of directions) {
                    let bulletX, bulletY;
                    
                    switch (dir) {
                        case 0: // up
                            bulletX = player.x + player.width / 2 - 2;
                            bulletY = player.y;
                            break;
                        case 1: // right
                            bulletX = player.x + player.width;
                            bulletY = player.y + player.height / 2 - 2;
                            break;
                        case 2: // down
                            bulletX = player.x + player.width / 2 - 2;
                            bulletY = player.y + player.height;
                            break;
                        case 3: // left
                            bulletX = player.x;
                            bulletY = player.y + player.height / 2 - 2;
                            break;
                    }
                    
                    bullets.push(new Bullet(bulletX, bulletY, dir, true));
                }
                
                audioManager.playShootSound();
                player.cooldown = 600;
            };
            
            console.log("✦ Disparo triple activado!");
            
            setTimeout(() => {
                player.fire = originalFire;
                console.log("✦ Disparo triple desactivado");
            }, 5000);
            break;
    }
    
    updateUI();
}

function playerHit() {
    lives--;
    audioManager.playExplosionSound();
    updateUI();
    
    console.log("💔 Vida perdida! Vidas restantes:", lives);
    
    // Efecto visual de daño
    player.color = '#FF6B6B';
    setTimeout(() => {
        player.color = '#4CAF50';
    }, 200);
    
    if (lives <= 0) {
        gameOver();
    }
}

function nextLevel() {
    level++;
    updateUI();
    
    // Aumentar dificultad de forma gradual
    config.enemySpeed += 0.25;
    config.enemyFireRate += 0.001;
    config.maxEnemies = Math.min(config.maxEnemies + 1, 8);
    
    console.log(`🎉 Nivel ${level}!
    Velocidad enemiga: ${config.enemySpeed}
    Frecuencia de disparo: ${config.enemyFireRate}
    Máx enemigos: ${config.maxEnemies}`);
    
    // Generar nuevos enemigos para el siguiente nivel
    for (let i = 0; i < 3 + level; i++) {
        setTimeout(() => {
            spawnEnemy();
        }, i * 1000);
    }
}

function gameOver() {
    gameRunning = false;
    finalScoreElement.textContent = score;
    audioManager.playGameOverSound();
    audioManager.stopMusic();
    gameOverScreen.classList.remove('hidden');
    
    console.log(`💀 Game Over!
    Puntuación final: ${score}
    Nivel alcanzado: ${level}`);
}

function updateUI() {
    livesElement.textContent = lives;
    scoreElement.textContent = score;
    levelElement.textContent = level;
}

function gameLoop(timestamp) {
    if (!gameRunning) return;
    
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar fondo con patrón de cuadrícula
    drawGrid();
    
    // Actualizar y dibujar elementos
    player.update(deltaTime);
    player.draw();
    
    for (const enemy of enemies) {
        enemy.update(deltaTime);
        enemy.draw();
    }
    
    for (const bullet of bullets) {
        bullet.update();
        bullet.draw();
    }
    
    for (const powerUp of powerUps) {
        powerUp.update();
        powerUp.draw();
    }
    
    for (const wall of walls) {
        wall.draw();
    }
    
    // Dibujar información de debug (solo en desarrollo)
    drawDebugInfo();
    
    // Generar enemigos
    enemySpawnTimer += deltaTime;
    if (enemySpawnTimer > config.enemySpawnRate) {
        enemySpawnTimer = 0;
        spawnEnemy();
    }
    
    // Generar power-ups
    powerUpTimer += deltaTime;
    if (powerUpTimer > config.powerUpSpawnRate) {
        powerUpTimer = 0;
        spawnPowerUp();
    }
    
    // Verificar colisiones
    checkCollisions();
    
    // Continuar el bucle del juego
    requestAnimationFrame(gameLoop);
}

function drawGrid() {
    // Fondo verde oscuro
    ctx.fillStyle = '#1a3a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Patrón de cuadrícula
    ctx.strokeStyle = '#2a5a2a';
    ctx.lineWidth = 1;
    
    for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function drawDebugInfo() {
    // Información de debug (opcional)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Enemigos: ${enemies.length}`, 10, 20);
    ctx.fillText(`Balas: ${bullets.length}`, 10, 35);
    ctx.fillText(`Power-ups: ${powerUps.length}`, 10, 50);
}

// Event Listeners del juego
startBtn.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    initGame();
    gameRunning = true;
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
    console.log("🚀 Juego iniciado!");
});

restartBtn.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    initGame();
    gameRunning = true;
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
    console.log("🔄 Juego reiniciado!");
});

// Controles de teclado
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if (e.key === ' ' && gameRunning) {
        player.fire();
        e.preventDefault();
    }
    
    // Debug: Tecla D para mostrar información
    if (e.key === 'd' || e.key === 'D') {
        console.log("🎵 Estado audio:", audioManager.getStatus());
        console.log("🎮 Estado juego:", {
            running: gameRunning,
            level: level,
            score: score,
            lives: lives,
            enemies: enemies.length,
            bullets: bullets.length
        });
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Controles táctiles
document.getElementById('up').addEventListener('touchstart', (e) => {
    e.preventDefault();
    keys.ArrowUp = true;
});

document.getElementById('up').addEventListener('touchend', (e) => {
    e.preventDefault();
    keys.ArrowUp = false;
});

document.getElementById('down').addEventListener('touchstart', (e) => {
    e.preventDefault();
    keys.ArrowDown = true;
});

document.getElementById('down').addEventListener('touchend', (e) => {
    e.preventDefault();
    keys.ArrowDown = false;
});

document.getElementById('left').addEventListener('touchstart', (e) => {
    e.preventDefault();
    keys.ArrowLeft = true;
});

document.getElementById('left').addEventListener('touchend', (e) => {
    e.preventDefault();
    keys.ArrowLeft = false;
});

document.getElementById('right').addEventListener('touchstart', (e) => {
    e.preventDefault();
    keys.ArrowRight = true;
});

document.getElementById('right').addEventListener('touchend', (e) => {
    e.preventDefault();
    keys.ArrowRight = false;
});

document.getElementById('fire').addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameRunning) player.fire();
});

// Ajustar tamaño del canvas al cambiar el tamaño de la ventana
window.addEventListener('resize', () => {
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;
    console.log("📐 Canvas redimensionado:", canvas.width, "x", canvas.height);
});

// Inicialización completa cuando se carga la página
window.addEventListener('load', async () => {
    console.log("🕹️ Battle Tank - Inicializando...");
    
    // Inicializar controles de audio
    initAudioControls();
    
    // Inicializar sistema de audio
    await audioManager.init();
    
    // Inicializar juego (pero no empezar hasta que el usuario haga clic)
    initGame();
    
    console.log("✅ Battle Tank listo! Haz clic en 'INICIAR JUEGO'");
    console.log("🎮 Controles: Flechas para mover, ESPACIO para disparar");
    console.log("🔊 Presiona 'Probar Audio' para verificar los sonidos");
    console.log("🐛 Presiona 'D' para información de debug");
});