const searchInput = document.getElementById('search');
const countryList = document.getElementById('countryList');
const clockElement = document.getElementById('clock');
const ampmElement = document.getElementById('ampm');
const dateElement = document.getElementById('date');
const countryNameElement = document.getElementById('countryName');
const toggleFormatBtn = document.getElementById('toggleFormat');
const celestialBody = document.getElementById('celestial-body');
const starsContainer = document.getElementById('stars');

let is24HourFormat = false;
let currentCountry = { name: "Local Time", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone };

// Initialization
function init() {
    renderCountryList(countries);
    setupEventListeners();
    generateStars();
    updateClock();
    setupToolbox();
    setInterval(updateClock, 1000);
}

function renderCountryList(list) {
    countryList.innerHTML = '';
    list.forEach(country => {
        const li = document.createElement('li');
        li.textContent = country.name;
        li.dataset.timezone = country.timezone;
        li.addEventListener('click', () => {
            currentCountry = country;
            searchInput.value = country.name;
            countryList.classList.add('hidden');
            updateClock();
        });
        countryList.appendChild(li);
    });
}

function setupEventListeners() {
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = countries.filter(c => c.name.toLowerCase().includes(term));
        renderCountryList(filtered);
        if (filtered.length > 0) {
            countryList.classList.remove('hidden');
        } else {
            countryList.classList.add('hidden');
        }
    });

    searchInput.addEventListener('focus', () => {
        // Show dropdown on focus if input is empty it shows all, otherwise current filter
        countryList.classList.remove('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            countryList.classList.add('hidden');
        }
    });

    toggleFormatBtn.addEventListener('click', () => {
        is24HourFormat = !is24HourFormat;
        toggleFormatBtn.textContent = is24HourFormat ? "Switch to 12H" : "Switch to 24H";
        updateClock();
    });
}

function updateClock() {
    const now = new Date();
    
    // Time formatting options based on selected format
    const timeOptions = {
        timeZone: currentCountry.timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: !is24HourFormat
    };
    
    const timeFormatter = new Intl.DateTimeFormat('en-US', timeOptions);
    const timeParts = timeFormatter.formatToParts(now);
    
    let hour = '', minute = '', second = '', ampm = '';
    
    // We need the absolute 24-hour hour for the sky calculations regardless of the display format
    const hour24Formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: currentCountry.timezone,
        hour: 'numeric',
        hour12: false
    });
    // Fallback parsing just in case
    let hour24ForSky = parseInt(hour24Formatter.format(now));
    if (isNaN(hour24ForSky)) {
        // Safe fallback logic if Intl parsing fails depending on browser
        const isoString = now.toLocaleString('en-US', { timeZone: currentCountry.timezone, hour12: false });
        hour24ForSky = new Date(isoString).getHours() || now.getUTCHours();
    }
    
    timeParts.forEach(({ type, value }) => {
        if (type === 'hour') hour = value;
        if (type === 'minute') minute = value;
        if (type === 'second') second = value;
        if (type === 'dayPeriod') ampm = value;
    });
    
    clockElement.textContent = `${hour}:${minute}:${second}`;
    ampmElement.textContent = is24HourFormat ? '' : ampm;
    
    // Formatting Date
    const dateOptions = {
        timeZone: currentCountry.timezone,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    const dateFormatter = new Intl.DateTimeFormat('en-US', dateOptions);
    dateElement.textContent = dateFormatter.format(now);
    
    countryNameElement.textContent = currentCountry.name;
    
    // Update Sky Graphics
    updateSky(hour24ForSky, parseInt(minute));
}

function updateSky(hour, minute) {
    // 0 to 24 value
    const timeValue = hour + minute / 60;
    
    // Determine the theme
    let theme = 'night';
    if (timeValue >= 5 && timeValue < 8) theme = 'dawn';
    else if (timeValue >= 8 && timeValue < 17) theme = 'day';
    else if (timeValue >= 17 && timeValue < 19) theme = 'evening';
    
    document.body.className = theme;
    
    // Determine Celestial Body Position (West to East -> Left to Right on screen)
    // Sun is visible approx 6:00 to 18:00
    // Moon is visible 18:00 to 6:00
    let isDay = timeValue >= 6 && timeValue < 18;
    let progress = 0;
    
    if (isDay) {
        // Map 6:00-18:00 to 0.0-1.0
        progress = (timeValue - 6) / 12;
        celestialBody.className = 'sun';
    } else {
        // Map 18:00-6:00 to 0.0-1.0
        if (timeValue >= 18) {
            progress = (timeValue - 18) / 12;
        } else {
            progress = (timeValue + 6) / 12;
        }
        celestialBody.className = 'moon';
    }
    
    // Clamp progress
    progress = Math.max(0, Math.min(1, progress));
    
    // Parabolic arc for realistic motion across the sky
    // left: 0% (West edge) to 100% (East edge)
    // top: Starts low (60%), peaks at high noon/midnight (10%), ends low (60%)
    const leftPos = progress * 100;
    const topPos = 60 - Math.sin(progress * Math.PI) * 50; 
    
    celestialBody.style.left = `${leftPos}%`;
    celestialBody.style.top = `${topPos}%`;
    
    // Toggle stars
    if (theme === 'night' || theme === 'evening' || theme === 'dawn') {
        const opacity = theme === 'night' ? 1 : 0.4;
        starsContainer.style.opacity = opacity;
    } else {
        starsContainer.style.opacity = 0;
    }
}

function generateStars() {
    starsContainer.innerHTML = '';
    for (let i = 0; i < 150; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        const size = Math.random() * 3 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 5}s`;
        starsContainer.appendChild(star);
    }
}

// Ensure countries array is loaded before init
if (typeof countries !== 'undefined') {
    init();
} else {
    console.error("Countries data is not loaded!");
}

function setupToolbox() {
    const toggleToolboxBtn = document.getElementById('toggleToolbox');
    if(toggleToolboxBtn) {
        toggleToolboxBtn.addEventListener('click', () => {
            document.querySelector('.time-events-toolbox').classList.toggle('collapsed');
        });
    }
    
    updateToolbox();
    setInterval(updateToolbox, 60000);
}

function updateToolbox() {
    const categories = {
        dawn: [],
        noon: [],
        afternoon: [],
        evening: [],
        night: []
    };
    
    const now = new Date();
    
    countries.forEach(country => {
        try {
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: country.timezone,
                hour: 'numeric',
                hour12: false
            });
            let hour = parseInt(formatter.format(now));
            
            if (isNaN(hour)) {
                const isoString = now.toLocaleString('en-US', { timeZone: country.timezone, hour12: false });
                hour = new Date(isoString).getHours() || now.getUTCHours();
            }
            
            if (hour >= 5 && hour < 9) {
                categories.dawn.push(country);
            } else if (hour >= 9 && hour < 13) {
                categories.noon.push(country);
            } else if (hour >= 13 && hour < 17) {
                categories.afternoon.push(country);
            } else if (hour >= 17 && hour < 20) {
                categories.evening.push(country);
            } else if (hour >= 20 || hour < 5) {
                categories.night.push(country);
            }
        } catch (e) {
            console.error("Error formatting timezone for", country.name, e);
        }
    });
    
    const renderCategory = (id, list) => {
        const ul = document.querySelector(`#event-${id} .country-list`);
        if(ul) {
            ul.innerHTML = '';
            list.forEach(c => {
                const li = document.createElement('li');
                li.textContent = c.name;
                li.addEventListener('click', () => {
                    currentCountry = c;
                    searchInput.value = c.name;
                    updateClock();
                    if (window.innerWidth <= 1000) {
                        document.querySelector('.time-events-toolbox').classList.add('collapsed');
                    }
                });
                ul.appendChild(li);
            });
        }
    };
    
    renderCategory('dawn', categories.dawn);
    renderCategory('noon', categories.noon);
    renderCategory('afternoon', categories.afternoon);
    renderCategory('evening', categories.evening);
    renderCategory('night', categories.night);
}