/*
    FeatureFlip - Orientation-Based Mobile Web Application
    =====================================================
    
    This JavaScript file contains the core application logic for the FeatureFlip app.
    It handles orientation detection, feature switching, and all functionality for
    the four main features: Alarm Clock, Stopwatch, Timer, and Weather.
    
    Key Features:
    - Real-time orientation detection and feature switching
    - Alarm clock with multiple alarms and notifications
    - Precision stopwatch with lap functionality
    - Countdown timer with preset options
    - Weather integration with location detection
    - Haptic feedback and custom notifications
    - Local storage for data persistence
    
    Author: AI-Assisted Development
    Version: 2.0 (Enhanced UI/UX)
    Last Updated: 2024
*/

/* ==========================================================================
   MAIN APPLICATION CLASS
   ========================================================================== */

/**
 * FeatureFlipApp - Main application class that manages all functionality
 * 
 * This class serves as the central controller for the entire application,
 * handling orientation detection, feature switching, and all user interactions.
 * It uses a modular approach with separate methods for each feature.
 */
class FeatureFlipApp {
    /**
     * Constructor - Initializes the application and sets up all necessary properties
     * 
     * Sets up the initial state for all features and starts the application
     * by calling the init() method.
     */
    constructor() {
        // Orientation tracking
        this.currentOrientation = null;
        
        // Alarm clock properties
        this.alarms = [];
        
        // Stopwatch properties
        this.stopwatchRunning = false;
        this.stopwatchTime = 0; // Time in milliseconds
        this.stopwatchInterval = null;
        this.lapTimes = [];
        
        // Timer properties
        this.timerRunning = false;
        this.timerTime = 0; // Time in milliseconds
        this.timerInterval = null;
        
        // Weather API configuration
        this.weatherApiKey = 'afd6ff1d57591910c082b29be10a877b'; // Replace with your OpenWeatherMap API key
        
        // Initialize the application
        this.init();
    }

    /**
     * init() - Initializes all application components and starts background processes
     * 
     * This method sets up all event listeners, initializes features, and starts
     * background processes like time updates and alarm checking. It's called
     * automatically when the application starts.
     */
    init() {
        // Set up orientation detection system
        this.setupOrientationDetection();
        
        // Initialize all feature modules
        this.setupAlarmClock();
        this.setupStopwatch();
        this.setupTimer();
        this.setupWeather();
        
        // Initialize current time display
        this.updateCurrentTime();
        
        // Start background processes
        // Update current time display every second
        setInterval(() => this.updateCurrentTime(), 1000);
        
        // Check for alarm triggers every second
        setInterval(() => this.checkAlarms(), 1000);
    }

    /**
     * setupOrientationDetection() - Sets up event listeners for orientation changes
     * 
     * This method configures the orientation detection system by setting up
     * event listeners for both mobile orientation changes and desktop resize events.
     * It ensures the application can detect orientation changes across all devices.
     */
    setupOrientationDetection() {
        // Listen for mobile device orientation changes
        // Uses setTimeout to allow the browser to complete the orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.detectOrientation(), 100);
        });

        // Listen for window resize events (useful for desktop testing)
        // Allows testing orientation features by resizing the browser window
        window.addEventListener('resize', () => {
            this.detectOrientation();
        });

        // Perform initial orientation detection when the app loads
        this.detectOrientation();
    }

    /**
     * detectOrientation() - Determines the current device orientation
     * 
     * This method uses a combination of screen dimensions and device orientation
     * to accurately determine which of the four orientations the device is in.
     * It uses a multi-layered approach for maximum compatibility across devices.
     * 
     * @returns {void} Updates the current orientation and triggers feature switching
     */
    detectOrientation() {
        // Get current screen dimensions
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Get device orientation (0, 90, 180, 270 degrees)
        // Falls back to 0 if not supported
        const orientation = window.orientation || 0;
        
        let newOrientation = null;
        
        // Determine orientation using multi-layered detection approach
        if (width > height) {
            // Device is in landscape mode (width > height)
            if (orientation === 90 || (width > height && width > 800)) {
                newOrientation = 'landscape-right'; // Landscape right-side up
            } else {
                newOrientation = 'landscape-left'; // Landscape left-side up
            }
        } else {
            // Device is in portrait mode (height > width)
            if (orientation === 0 || (height > width && height > 800)) {
                newOrientation = 'portrait-upright'; // Portrait upright
            } else {
                newOrientation = 'portrait-upside-down'; // Portrait upside down
            }
        }

        // Only update if orientation has actually changed
        if (newOrientation !== this.currentOrientation) {
            this.currentOrientation = newOrientation;
            this.switchFeature(newOrientation);
            this.updateOrientationIndicator(newOrientation);
        }
    }

    /**
     * switchFeature(orientation) - Switches to the appropriate feature based on orientation
     * 
     * This method manages the visual switching between different features by
     * adding/removing the 'active' class on feature containers. It also triggers
     * any necessary initialization for the newly activated feature.
     * 
     * @param {string} orientation - The detected orientation ('portrait-upright', 'landscape-right', etc.)
     * @returns {void} Updates the UI to show the appropriate feature
     */
    switchFeature(orientation) {
        // Get all feature container IDs
        const features = ['alarm-clock', 'stopwatch', 'timer', 'weather'];
        
        // Hide all features by removing the 'active' class
        features.forEach(feature => {
            document.getElementById(feature).classList.remove('active');
        });

        // Show the appropriate feature based on orientation
        switch (orientation) {
            case 'portrait-upright':
                // Show alarm clock when device is held normally
                document.getElementById('alarm-clock').classList.add('active');
                break;
                
            case 'landscape-right':
                // Show stopwatch when device is rotated 90° clockwise
                document.getElementById('stopwatch').classList.add('active');
                break;
                
            case 'portrait-upside-down':
                // Show timer when device is flipped upside down
                document.getElementById('timer').classList.add('active');
                break;
                
            case 'landscape-left':
                // Show weather when device is rotated 90° counter-clockwise
                document.getElementById('weather').classList.add('active');
                // Automatically load weather data when this feature is activated
                this.loadWeather();
                break;
        }
    }

    /**
     * updateOrientationIndicator(orientation) - Updates the orientation indicator display
     * 
     * This method updates the floating orientation indicator that shows users
     * which orientation they're currently in and which feature is active.
     * It provides helpful feedback for understanding the orientation system.
     * The indicator is positioned in the top-right corner to avoid blocking content.
     * 
     * @param {string} orientation - The current orientation ('portrait-upright', 'landscape-right', etc.)
     * @returns {void} Updates the orientation indicator text and manages visibility
     */
    updateOrientationIndicator(orientation) {
        // Get the orientation indicator elements
        const orientationIndicator = document.getElementById('orientation-indicator');
        const orientationText = document.getElementById('orientation-text');
        
        // Map orientations to user-friendly labels with feature names
        const orientationLabels = {
            'portrait-upright': 'Portrait Upright - Alarm Clock',
            'landscape-right': 'Landscape Right - Stopwatch',
            'portrait-upside-down': 'Portrait Upside Down - Timer',
            'landscape-left': 'Landscape Left - Weather'
        };
        
        // Update the indicator text, with fallback for unknown orientations
        orientationText.textContent = orientationLabels[orientation] || 'Detecting orientation...';
        
        // Show the indicator with full opacity
        orientationIndicator.style.opacity = '0.7';
        
        // Auto-hide the indicator after 3 seconds to avoid blocking content
        clearTimeout(this.orientationIndicatorTimeout);
        this.orientationIndicatorTimeout = setTimeout(() => {
            orientationIndicator.style.opacity = '0.3';
        }, 3000);
        
        // Add click-to-hide functionality
        if (!this.orientationIndicatorClickHandler) {
            this.orientationIndicatorClickHandler = () => {
                orientationIndicator.style.opacity = '0.1';
                // Show again after 5 seconds
                setTimeout(() => {
                    orientationIndicator.style.opacity = '0.7';
                }, 5000);
            };
            orientationIndicator.addEventListener('click', this.orientationIndicatorClickHandler);
        }
    }

    /* ==========================================================================
       ALARM CLOCK FUNCTIONALITY
       ========================================================================== */

    /**
     * setupAlarmClock() - Initializes the alarm clock feature
     * 
     * This method sets up all event listeners and functionality for the alarm clock,
     * including the set alarm button, time input, and loading previously saved alarms.
     * It's called during application initialization.
     * 
     * @returns {void} Sets up alarm clock event listeners and loads saved alarms
     */
    setupAlarmClock() {
        // Get DOM elements for alarm functionality
        const setAlarmBtn = document.getElementById('set-alarm');
        const alarmTimeInput = document.getElementById('alarm-time');

        // Set up event listener for the "Set Alarm" button
        setAlarmBtn.addEventListener('click', () => {
            const time = alarmTimeInput.value;
            if (time) {
                // Add the alarm if a valid time is selected
                this.addAlarm(time);
                // Reset the input to default time for convenience
                alarmTimeInput.value = '07:00';
            }
        });

        // Load any previously saved alarms from local storage
        this.loadAlarms();
    }

    /**
     * addAlarm(time) - Adds a new alarm to the alarm list
     * 
     * This method creates a new alarm object with a unique ID and adds it to
     * the alarms array. It then saves the alarms to local storage, updates
     * the display, and provides visual feedback to the user.
     * 
     * @param {string} time - The alarm time in HH:MM format (e.g., "07:00")
     * @returns {void} Adds alarm to list and updates UI
     */
    addAlarm(time) {
        // Create a new alarm object with unique properties
        const alarm = {
            id: Date.now(),        // Unique identifier based on current timestamp
            time: time,            // Alarm time in HH:MM format
            active: true           // Whether the alarm is currently active
        };
        
        // Add the alarm to the alarms array
        this.alarms.push(alarm);
        
        // Persist alarms to local storage for data persistence
        this.saveAlarms();
        
        // Update the alarm list display
        this.renderAlarms();
        
        // Provide visual feedback with success animation
        const setAlarmBtn = document.getElementById('set-alarm');
        setAlarmBtn.classList.add('success-pulse');
        setTimeout(() => setAlarmBtn.classList.remove('success-pulse'), 600);
        
        // Show success notification to user
        this.showNotification('Alarm set successfully!', 'success');
    }

    deleteAlarm(id) {
        this.alarms = this.alarms.filter(alarm => alarm.id !== id);
        this.saveAlarms();
        this.renderAlarms();
    }

    renderAlarms() {
        const alarmList = document.getElementById('alarm-list');
        alarmList.innerHTML = '';

        this.alarms.forEach(alarm => {
            const alarmItem = document.createElement('div');
            alarmItem.className = 'alarm-item';
            alarmItem.innerHTML = `
                <span class="time">${alarm.time}</span>
                <button class="delete-btn" onclick="app.deleteAlarm(${alarm.id})">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            alarmList.appendChild(alarmItem);
        });
    }

    checkAlarms() {
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5);
        
        this.alarms.forEach(alarm => {
            if (alarm.active && alarm.time === currentTime) {
                this.triggerAlarm();
                alarm.active = false; // Prevent multiple triggers
            }
        });
    }

    triggerAlarm() {
        // Create notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Alarm!', {
                body: 'Time to wake up!',
                icon: '/favicon.ico'
            });
        }

        // Play sound (if supported)
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
            audio.play();
        } catch (e) {
            console.log('Audio not supported');
        }

        // Enhanced visual alert
        document.body.style.animation = 'flash 0.5s ease-in-out 5';
        
        // Add shake animation to alarm container
        const alarmContainer = document.getElementById('alarm-clock');
        alarmContainer.classList.add('alarm-triggered');
        
        // Vibrate device if supported
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 200]);
        }
        
        setTimeout(() => {
            document.body.style.animation = '';
            alarmContainer.classList.remove('alarm-triggered');
        }, 2500);
    }

    saveAlarms() {
        localStorage.setItem('alarms', JSON.stringify(this.alarms));
    }

    loadAlarms() {
        const saved = localStorage.getItem('alarms');
        if (saved) {
            this.alarms = JSON.parse(saved);
            this.renderAlarms();
        }
    }

    /* ==========================================================================
       STOPWATCH FUNCTIONALITY
       ========================================================================== */

    /**
     * setupStopwatch() - Initializes the stopwatch feature
     * 
     * This method sets up all event listeners for the stopwatch controls,
     * including start, pause, reset buttons, and double-click lap functionality.
     * It's called during application initialization.
     * 
     * @returns {void} Sets up stopwatch event listeners
     */
    setupStopwatch() {
        // Get DOM elements for stopwatch controls
        const startBtn = document.getElementById('start-stopwatch');
        const pauseBtn = document.getElementById('pause-stopwatch');
        const resetBtn = document.getElementById('reset-stopwatch');

        // Set up event listeners for main stopwatch controls
        startBtn.addEventListener('click', () => this.startStopwatch());
        pauseBtn.addEventListener('click', () => this.pauseStopwatch());
        resetBtn.addEventListener('click', () => this.resetStopwatch());

        // Add lap functionality - double-click the start button to add a lap
        startBtn.addEventListener('dblclick', () => this.addLap());
    }

    /**
     * startStopwatch() - Starts the stopwatch timer
     * 
     * This method starts the stopwatch by setting up an interval that updates
     * the stopwatch time every 10 milliseconds for precision timing. It also
     * provides haptic feedback and user notifications.
     * 
     * @returns {void} Starts the stopwatch timer and updates display
     */
    startStopwatch() {
        // Only start if the stopwatch isn't already running
        if (!this.stopwatchRunning) {
            // Set running state to true
            this.stopwatchRunning = true;
            
            // Create interval that updates every 10ms for precision timing
            this.stopwatchInterval = setInterval(() => {
                this.stopwatchTime += 10; // Increment by 10 milliseconds
                this.updateStopwatchDisplay(); // Update the display
            }, 10);
            
            // Provide haptic feedback if device supports vibration
            if (navigator.vibrate) {
                navigator.vibrate(50); // Short vibration for button press
            }
            
            // Show success notification to user
            this.showNotification('Stopwatch started!', 'success');
        }
    }

    pauseStopwatch() {
        this.stopwatchRunning = false;
        clearInterval(this.stopwatchInterval);
    }

    resetStopwatch() {
        this.pauseStopwatch();
        this.stopwatchTime = 0;
        this.lapTimes = [];
        this.updateStopwatchDisplay();
        this.renderLapTimes();
    }

    addLap() {
        if (this.stopwatchRunning) {
            this.lapTimes.push(this.stopwatchTime);
            this.renderLapTimes();
        }
    }

    updateStopwatchDisplay() {
        const display = document.getElementById('stopwatch-display');
        const time = this.stopwatchTime;
        const hours = Math.floor(time / 3600000);
        const minutes = Math.floor((time % 3600000) / 60000);
        const seconds = Math.floor((time % 60000) / 1000);
        const centiseconds = Math.floor((time % 1000) / 10);
        
        display.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    }

    renderLapTimes() {
        const lapContainer = document.getElementById('lap-times');
        lapContainer.innerHTML = '';

        this.lapTimes.forEach((lapTime, index) => {
            const hours = Math.floor(lapTime / 3600000);
            const minutes = Math.floor((lapTime % 3600000) / 60000);
            const seconds = Math.floor((lapTime % 60000) / 1000);
            const centiseconds = Math.floor((lapTime % 1000) / 10);
            
            const lapItem = document.createElement('div');
            lapItem.className = 'lap-item';
            lapItem.innerHTML = `
                <span>Lap ${index + 1}</span>
                <span>${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}</span>
            `;
            lapContainer.appendChild(lapItem);
        });
    }

    // Timer Functions
    setupTimer() {
        const startBtn = document.getElementById('start-timer');
        const pauseBtn = document.getElementById('pause-timer');
        const resetBtn = document.getElementById('reset-timer');
        const presetBtns = document.querySelectorAll('.preset-btn');

        startBtn.addEventListener('click', () => this.startTimer());
        pauseBtn.addEventListener('click', () => this.pauseTimer());
        resetBtn.addEventListener('click', () => this.resetTimer());

        presetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const minutes = parseInt(btn.dataset.minutes);
                document.getElementById('minutes').value = minutes;
                document.getElementById('seconds').value = 0;
                this.updateTimerDisplay();
            });
        });

        // Update display when inputs change
        document.getElementById('minutes').addEventListener('input', () => this.updateTimerDisplay());
        document.getElementById('seconds').addEventListener('input', () => this.updateTimerDisplay());
    }

    startTimer() {
        if (!this.timerRunning && this.timerTime > 0) {
            this.timerRunning = true;
            this.timerInterval = setInterval(() => {
                this.timerTime -= 1000;
                this.updateTimerDisplay();
                
                if (this.timerTime <= 0) {
                    this.timerComplete();
                }
            }, 1000);
            
            // Add haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
            
            // Show notification
            this.showNotification('Timer started!', 'success');
        } else if (this.timerTime <= 0) {
            this.showNotification('Please set a timer first!', 'warning');
        }
    }

    pauseTimer() {
        this.timerRunning = false;
        clearInterval(this.timerInterval);
    }

    resetTimer() {
        this.pauseTimer();
        const minutes = parseInt(document.getElementById('minutes').value) || 0;
        const seconds = parseInt(document.getElementById('seconds').value) || 0;
        this.timerTime = (minutes * 60 + seconds) * 1000;
        this.updateTimerDisplay();
    }

    timerComplete() {
        this.pauseTimer();
        
        // Notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Timer Complete!', {
                body: 'Your timer has finished!',
                icon: '/favicon.ico'
            });
        }

        // Enhanced visual alert
        document.body.style.animation = 'flash 0.5s ease-in-out 5';
        
        // Add glow animation to timer container
        const timerContainer = document.getElementById('timer');
        timerContainer.classList.add('timer-complete');
        
        // Vibrate device if supported
        if (navigator.vibrate) {
            navigator.vibrate([300, 100, 300, 100, 300]);
        }
        
        setTimeout(() => {
            document.body.style.animation = '';
            timerContainer.classList.remove('timer-complete');
        }, 2500);
    }

    updateTimerDisplay() {
        const display = document.getElementById('timer-display');
        const minutes = Math.floor(this.timerTime / 60000);
        const seconds = Math.floor((this.timerTime % 60000) / 1000);
        
        display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Weather Functions
    setupWeather() {
        const refreshBtn = document.getElementById('refresh-weather');
        refreshBtn.addEventListener('click', () => this.loadWeather());
        
        // Request notification permission
        if ('Notification' in window) {
            Notification.requestPermission();
        }
    }

    async loadWeather() {
        try {
            // Show loading state
            const refreshBtn = document.getElementById('refresh-weather');
            const originalText = refreshBtn.innerHTML;
            refreshBtn.innerHTML = '<span class="loading-spinner"></span> Loading...';
            refreshBtn.disabled = true;
            
            const position = await this.getCurrentPosition();
            const weather = await this.fetchWeather(position.coords.latitude, position.coords.longitude);
            this.displayWeather(weather);
            
            // Show success message
            this.showNotification('Weather updated successfully!', 'success');
            
        } catch (error) {
            console.error('Error loading weather:', error);
            this.displayWeatherError();
            this.showNotification('Failed to load weather data', 'error');
        } finally {
            // Restore button state
            const refreshBtn = document.getElementById('refresh-weather');
            refreshBtn.innerHTML = originalText;
            refreshBtn.disabled = false;
        }
    }

    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 10000,
                enableHighAccuracy: false
            });
        });
    }

    async fetchWeather(lat, lon) {
        // Using OpenWeatherMap API (free tier)
        // You need to sign up at https://openweathermap.org/api and get an API key
        const apiKey = this.weatherApiKey;
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Weather API request failed');
        }
        
        return await response.json();
    }

    displayWeather(weather) {
        document.getElementById('location').textContent = weather.name + ', ' + weather.sys.country;
        document.getElementById('temperature').textContent = Math.round(weather.main.temp) + '°C';
        document.getElementById('weather-description').textContent = weather.weather[0].description;
        document.getElementById('humidity').textContent = weather.main.humidity + '%';
        document.getElementById('wind-speed').textContent = Math.round(weather.wind.speed * 3.6) + ' km/h'; // Convert m/s to km/h
        document.getElementById('feels-like').textContent = Math.round(weather.main.feels_like) + '°C';
        
        // Update weather icon
        const iconElement = document.getElementById('weather-icon');
        const weatherCode = weather.weather[0].id;
        iconElement.innerHTML = this.getWeatherIcon(weatherCode);
    }

    displayWeatherError() {
        document.getElementById('location').textContent = 'Location unavailable';
        document.getElementById('temperature').textContent = '--°C';
        document.getElementById('weather-description').textContent = 'Unable to load weather';
        document.getElementById('humidity').textContent = '--%';
        document.getElementById('wind-speed').textContent = '-- km/h';
        document.getElementById('feels-like').textContent = '--°C';
    }

    getWeatherIcon(code) {
        // Map weather codes to Font Awesome icons
        const iconMap = {
            200: 'fa-bolt',
            201: 'fa-bolt',
            202: 'fa-bolt',
            210: 'fa-bolt',
            211: 'fa-bolt',
            212: 'fa-bolt',
            221: 'fa-bolt',
            230: 'fa-bolt',
            231: 'fa-bolt',
            232: 'fa-bolt',
            300: 'fa-cloud-rain',
            301: 'fa-cloud-rain',
            302: 'fa-cloud-rain',
            310: 'fa-cloud-rain',
            311: 'fa-cloud-rain',
            312: 'fa-cloud-rain',
            313: 'fa-cloud-rain',
            314: 'fa-cloud-rain',
            321: 'fa-cloud-rain',
            500: 'fa-cloud-rain',
            501: 'fa-cloud-rain',
            502: 'fa-cloud-rain',
            503: 'fa-cloud-rain',
            504: 'fa-cloud-rain',
            511: 'fa-cloud-rain',
            520: 'fa-cloud-rain',
            521: 'fa-cloud-rain',
            522: 'fa-cloud-rain',
            531: 'fa-cloud-rain',
            600: 'fa-snowflake',
            601: 'fa-snowflake',
            602: 'fa-snowflake',
            611: 'fa-snowflake',
            612: 'fa-snowflake',
            613: 'fa-snowflake',
            615: 'fa-snowflake',
            616: 'fa-snowflake',
            620: 'fa-snowflake',
            621: 'fa-snowflake',
            622: 'fa-snowflake',
            701: 'fa-cloud',
            711: 'fa-smog',
            721: 'fa-smog',
            731: 'fa-smog',
            741: 'fa-smog',
            751: 'fa-smog',
            761: 'fa-smog',
            762: 'fa-smog',
            771: 'fa-wind',
            781: 'fa-tornado',
            800: 'fa-sun',
            801: 'fa-cloud-sun',
            802: 'fa-cloud',
            803: 'fa-cloud',
            804: 'fa-cloud'
        };
        
        const iconClass = iconMap[code] || 'fa-cloud';
        return `<i class="fas ${iconClass}"></i>`;
    }

    // Utility Functions
    updateCurrentTime() {
        const now = new Date();
        const timeString = now.toTimeString().slice(0, 8);
        const dateString = now.toDateString();
        
        const timeElement = document.getElementById('current-time');
        const dateElement = document.getElementById('current-date');
        
        if (timeElement) timeElement.textContent = timeString;
        if (dateElement) dateElement.textContent = dateString;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            font-weight: 600;
            max-width: 300px;
            text-align: center;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(-50%) translateY(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    getNotificationColor(type) {
        const colors = {
            success: 'linear-gradient(135deg, #28a745, #20c997)',
            error: 'linear-gradient(135deg, #dc3545, #e83e8c)',
            warning: 'linear-gradient(135deg, #ffc107, #fd7e14)',
            info: 'linear-gradient(135deg, #667eea, #764ba2)'
        };
        return colors[type] || colors.info;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FeatureFlipApp();
});

    // Add enhanced CSS animations for better UX
    const style = document.createElement('style');
    style.textContent = `
        @keyframes flash {
            0%, 100% { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%); 
                transform: scale(1);
            }
            50% { 
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 50%, #ff8e53 100%); 
                transform: scale(1.02);
            }
        }
        
        @keyframes bounce {
            0%, 20%, 53%, 80%, 100% {
                transform: translate3d(0,0,0);
            }
            40%, 43% {
                transform: translate3d(0, -30px, 0);
            }
            70% {
                transform: translate3d(0, -15px, 0);
            }
            90% {
                transform: translate3d(0, -4px, 0);
            }
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
            20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
        
        @keyframes glow {
            0%, 100% { box-shadow: 0 0 5px rgba(102, 126, 234, 0.5); }
            50% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.8), 0 0 30px rgba(102, 126, 234, 0.6); }
        }
        
        .feature-container.active {
            animation: fadeInUp 0.6s ease-out;
        }
        
        .btn:active {
            animation: bounce 0.6s ease;
        }
        
        .alarm-triggered {
            animation: shake 0.5s ease-in-out;
        }
        
        .timer-complete {
            animation: glow 1s ease-in-out infinite;
        }
        
        .success-pulse {
            animation: successPulse 0.6s ease-out;
        }
        
        @keyframes successPulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        .loading-spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
