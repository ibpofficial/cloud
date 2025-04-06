// API Configuration
const API_KEY = '9923cba1c889851bd8a96808269a22a1';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/';

// DOM Elements
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const cityName = document.getElementById('city-name');
const currentDate = document.getElementById('current-date');
const weatherIcon = document.getElementById('weather-icon');
const weatherDescription = document.getElementById('weather-description');
const currentTemp = document.getElementById('current-temp');
const maxTemp = document.getElementById('max-temp');
const minTemp = document.getElementById('min-temp');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('wind-speed');
const pressure = document.getElementById('pressure');
const sunrise = document.getElementById('sunrise');
const sunset = document.getElementById('sunset');
const visibility = document.getElementById('visibility');
const forecastCards = document.getElementById('forecast-cards');
const celsiusBtn = document.getElementById('celsius-btn');
const fahrenheitBtn = document.getElementById('fahrenheit-btn');
const notification = document.getElementById('notification');

// Global Variables
let currentUnit = 'metric'; // Default to Celsius
let currentWeatherData = null;
let currentForecastData = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Check if there's a saved city in localStorage
    const savedCity = localStorage.getItem('lastSearchedCity');
    if (savedCity) {
        searchInput.value = savedCity;
        fetchWeatherData(savedCity);
    } else {
        // Default to London if no saved city
        fetchWeatherData('London');
    }

    // Set up event listeners
    searchBtn.addEventListener('click', handleSearch);
    locationBtn.addEventListener('click', handleLocation);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    celsiusBtn.addEventListener('click', () => switchUnit('metric'));
    fahrenheitBtn.addEventListener('click', () => switchUnit('imperial'));
});

// Handle search button click
function handleSearch() {
    const city = searchInput.value.trim();
    if (city) {
        fetchWeatherData(city);
    } else {
        showNotification('Please enter a city name');
    }
}

// Handle location button click
function handleLocation() {
    showLoadingState();
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeatherByCoords(latitude, longitude);
            },
            (error) => {
                console.error('Geolocation error:', error);
                showNotification('Unable to retrieve your location. Showing default city.');
                fetchWeatherData('London');
            }
        );
    } else {
        showNotification('Geolocation is not supported by your browser');
        fetchWeatherData('London');
    }
}

// Show loading state
function showLoadingState() {
    cityName.textContent = 'Loading...';
    currentTemp.textContent = '--';
    weatherDescription.textContent = '-- --';
    maxTemp.textContent = '--°';
    minTemp.textContent = '--°';
    humidity.textContent = '--%';
    windSpeed.textContent = '-- km/h';
    pressure.textContent = '-- hPa';
    sunrise.textContent = '--:--';
    sunset.textContent = '--:--';
    visibility.textContent = '-- km';
    forecastCards.innerHTML = '<div class="loading">Loading forecast...</div>';
}

// Fetch weather data by city name
async function fetchWeatherData(city) {
    showLoadingState();
    
    try {
        // Encode city name for URL
        const encodedCity = encodeURIComponent(city);
        
        // Fetch current weather
        const currentWeatherResponse = await fetch(
            `${BASE_URL}weather?q=${encodedCity}&units=${currentUnit}&appid=${API_KEY}`
        );
        
        if (!currentWeatherResponse.ok) {
            const errorData = await currentWeatherResponse.json();
            throw new Error(errorData.message || 'City not found');
        }
        
        const currentWeatherData = await currentWeatherResponse.json();
        
        // Fetch forecast
        const forecastResponse = await fetch(
            `${BASE_URL}forecast?q=${encodedCity}&units=${currentUnit}&appid=${API_KEY}`
        );
        
        if (!forecastResponse.ok) {
            throw new Error('Failed to fetch forecast data');
        }
        
        const forecastData = await forecastResponse.json();
        
        // Process and display data
        displayWeatherData(currentWeatherData);
        displayForecastData(forecastData);
        
        // Save to localStorage
        localStorage.setItem('lastSearchedCity', city);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showNotification(error.message || 'Failed to fetch weather data');
        // Reset to previous data if available
        if (currentWeatherData) {
            displayWeatherData(currentWeatherData);
            displayForecastData(currentForecastData);
        } else {
            // Fallback to default city
            fetchWeatherData('London');
        }
    }
}

// Fetch weather data by coordinates
async function fetchWeatherByCoords(lat, lon) {
    showLoadingState();
    
    try {
        // Fetch current weather
        const currentWeatherResponse = await fetch(
            `${BASE_URL}weather?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${API_KEY}`
        );
        
        if (!currentWeatherResponse.ok) {
            throw new Error('Failed to fetch current weather');
        }
        
        const currentWeatherData = await currentWeatherResponse.json();
        
        // Fetch forecast
        const forecastResponse = await fetch(
            `${BASE_URL}forecast?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${API_KEY}`
        );
        
        if (!forecastResponse.ok) {
            throw new Error('Failed to fetch forecast data');
        }
        
        const forecastData = await forecastResponse.json();
        
        // Process and display data
        displayWeatherData(currentWeatherData);
        displayForecastData(forecastData);
        
        // Update search input
        searchInput.value = currentWeatherData.name;
        
        // Save to localStorage
        localStorage.setItem('lastSearchedCity', currentWeatherData.name);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showNotification('Unable to fetch weather data. Showing default city.');
        fetchWeatherData('London');
    }
}

// Display weather data
function displayWeatherData(data) {
    currentWeatherData = data;
    
    // Update city and date
    cityName.textContent = `${data.name}, ${data.sys.country}`;
    const now = new Date();
    currentDate.textContent = formatDate(now);
    
    // Update weather icon and description
    const weather = data.weather[0];
    weatherIcon.innerHTML = getWeatherIcon(weather.icon);
    weatherDescription.textContent = weather.description;
    
    // Update temperatures
    currentTemp.textContent = Math.round(data.main.temp);
    maxTemp.textContent = `${Math.round(data.main.temp_max)}°`;
    minTemp.textContent = `${Math.round(data.main.temp_min)}°`;
    
    // Update additional info
    humidity.textContent = `${data.main.humidity}%`;
    windSpeed.textContent = `${Math.round(data.wind.speed)} ${currentUnit === 'metric' ? 'km/h' : 'mph'}`;
    pressure.textContent = `${data.main.pressure} hPa`;
    
    // Update sunrise and sunset times (convert Unix timestamp with timezone offset)
    sunrise.textContent = formatTime(data.sys.sunrise, data.timezone);
    sunset.textContent = formatTime(data.sys.sunset, data.timezone);
    
    // Update visibility (convert meters to km)
    visibility.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
    
    // Change background animation based on weather
    updateBackgroundAnimation(weather.main);
}

// Display forecast data
function displayForecastData(data) {
    currentForecastData = data;
    forecastCards.innerHTML = '';
    
    // Filter to get one forecast per day
    const dailyForecasts = [];
    const seenDays = new Set();
    
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.getDate();
        
        // Get forecast around noon (12 PM)
        if (!seenDays.has(day) && date.getHours() >= 11 && date.getHours() <= 14) {
            seenDays.add(day);
            dailyForecasts.push(item);
        }
    });
    
    // If we didn't get enough forecasts, fill with the next available
    if (dailyForecasts.length < 5) {
        const remainingItems = data.list.filter(item => {
            const date = new Date(item.dt * 1000);
            const day = date.getDate();
            return !seenDays.has(day);
        }).slice(0, 5 - dailyForecasts.length);
        
        dailyForecasts.push(...remainingItems);
    }
    
    // Display forecast cards (limit to 5 days)
    dailyForecasts.slice(0, 5).forEach(day => {
        const date = new Date(day.dt * 1000);
        const dayName = formatDay(date);
        
        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <div class="forecast-day">${dayName}</div>
            <div class="forecast-icon">${getWeatherIcon(day.weather[0].icon)}</div>
            <div class="forecast-temp">
                <span class="forecast-max">${Math.round(day.main.temp_max)}°</span>
                <span class="forecast-min">${Math.round(day.main.temp_min)}°</span>
            </div>
        `;
        
        forecastCards.appendChild(card);
    });
}

// Switch between Celsius and Fahrenheit
function switchUnit(unit) {
    if (currentUnit === unit) return;
    
    currentUnit = unit;
    
    // Update button states
    if (unit === 'metric') {
        celsiusBtn.classList.add('active');
        fahrenheitBtn.classList.remove('active');
    } else {
        fahrenheitBtn.classList.add('active');
        celsiusBtn.classList.remove('active');
    }
    
    // Refresh data with new units
    if (currentWeatherData) {
        fetchWeatherData(currentWeatherData.name);
    }
}

// Helper function to format date
function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Helper function to format day name
function formatDay(date) {
    const options = { weekday: 'short' };
    return date.toLocaleDateString('en-US', options);
}

// Helper function to format time with timezone offset
function formatTime(timestamp, timezoneOffset) {
    const date = new Date((timestamp + timezoneOffset) * 1000);
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true,
        timeZone: 'UTC' 
    });
}

// Helper function to get weather icon
function getWeatherIcon(iconCode) {
    const iconMap = {
        '01d': 'fas fa-sun',
        '01n': 'fas fa-moon',
        '02d': 'fas fa-cloud-sun',
        '02n': 'fas fa-cloud-moon',
        '03d': 'fas fa-cloud',
        '03n': 'fas fa-cloud',
        '04d': 'fas fa-cloud',
        '04n': 'fas fa-cloud',
        '09d': 'fas fa-cloud-rain',
        '09n': 'fas fa-cloud-rain',
        '10d': 'fas fa-cloud-sun-rain',
        '10n': 'fas fa-cloud-moon-rain',
        '11d': 'fas fa-bolt',
        '11n': 'fas fa-bolt',
        '13d': 'fas fa-snowflake',
        '13n': 'fas fa-snowflake',
        '50d': 'fas fa-smog',
        '50n': 'fas fa-smog'
    };
    
    return `<i class="${iconMap[iconCode] || 'fas fa-question'}"></i>`;
}

// Update background animation based on weather
function updateBackgroundAnimation(weatherMain) {
    const particles = document.querySelectorAll('.particles');
    
    // Reset all particles
    particles.forEach(particle => {
        particle.style.backgroundColor = '';
    });
    
    // Change colors based on weather
    switch (weatherMain.toLowerCase()) {
        case 'clear':
            particles[0].style.backgroundColor = '#FFD700'; // Gold for sun
            particles[1].style.backgroundColor = '#FFA500'; // Orange
            break;
        case 'clouds':
            particles[0].style.backgroundColor = '#CCCCCC'; // Light gray
            particles[1].style.backgroundColor = '#999999'; // Medium gray
            break;
        case 'rain':
            particles[0].style.backgroundColor = '#4682B4'; // Steel blue
            particles[1].style.backgroundColor = '#1E90FF'; // Dodger blue
            break;
        case 'snow':
            particles[0].style.backgroundColor = '#FFFFFF'; // White
            particles[1].style.backgroundColor = '#E0FFFF'; // Light cyan
            break;
        case 'thunderstorm':
            particles[0].style.backgroundColor = '#4B0082'; // Indigo
            particles[1].style.backgroundColor = '#800080'; // Purple
            break;
        default:
            particles[0].style.backgroundColor = '#4CC9F0'; // Default accent color
            particles[1].style.backgroundColor = '#4361EE'; // Default primary color
    }
}

// Show notification
function showNotification(message) {
    notification.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Toggle theme manually
function toggleTheme() {
    manualTheme = true;
    document.body.classList.toggle('night');
    document.body.classList.toggle('day');
    document.body.classList.toggle('evening');
    
    // Update theme button icon
    if (document.body.classList.contains('night')) {
        themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
    } else if (document.body.classList.contains('evening')) {
        themeBtn.innerHTML = '<i class="fas fa-moon"></i>';
    } else {
        themeBtn.innerHTML = '<i class="fas fa-adjust"></i>';
    }
}

// Set theme based on time of day
function setThemeBasedOnTime(timezoneOffset, sunriseTime, sunsetTime) {
    const now = new Date();
    const localTime = new Date(now.getTime() + timezoneOffset * 1000);
    const sunrise = new Date(sunriseTime * 1000);
    const sunset = new Date(sunsetTime * 1000);
    
    // Reset all theme classes
    document.body.classList.remove('day', 'evening', 'night');
    
    // Determine time of day
    if (localTime < sunrise || localTime > sunset) {
        // Night time
        document.body.classList.add('night');
        themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
    } else if (localTime >= sunrise && localTime < sunrise + 3600000 * 2) {
        // Morning (2 hours after sunrise)
        document.body.classList.add('day');
        themeBtn.innerHTML = '<i class="fas fa-adjust"></i>';
    } else if (localTime >= sunset - 3600000 * 2 && localTime <= sunset) {
        // Evening (2 hours before sunset)
        document.body.classList.add('evening');
        themeBtn.innerHTML = '<i class="fas fa-moon"></i>';
    } else {
        // Day time
        document.body.classList.add('day');
        themeBtn.innerHTML = '<i class="fas fa-adjust"></i>';
    }
}

// Update sun animation based on temperature
function updateSunAnimation(temp) {
    if (currentUnit === 'fahrenheit') {
        // Convert to Celsius for calculation
        temp = (temp - 32) * 5/9;
    }
    
    // Adjust sun size and intensity based on temperature
    let size = 150;
    let intensity = 0.8;
    
    if (temp > 30) {
        // Very hot
        size = 200;
        intensity = 1;
        sunElement.style.boxShadow = '0 0 80px #ff6600';
    } else if (temp > 20) {
        // Warm
        size = 180;
        intensity = 0.9;
        sunElement.style.boxShadow = '0 0 60px #ff9900';
    } else if (temp > 10) {
        // Mild
        size = 160;
        intensity = 0.85;
        sunElement.style.boxShadow = '0 0 50px #ffcc00';
    } else if (temp > 0) {
        // Cool
        size = 140;
        intensity = 0.75;
        sunElement.style.boxShadow = '0 0 40px #ffff00';
    } else {
        // Cold
        size = 120;
        intensity = 0.7;
        sunElement.style.boxShadow = '0 0 30px #ffffff';
    }
    
    sunElement.style.width = `${size}px`;
    sunElement.style.height = `${size}px`;
    sunElement.style.opacity = intensity;
}

// Set UV index level and color
function setUvIndexLevel(uvIndex) {
    uvLabel.className = 'uv-label';
    
    if (uvIndex <= 2) {
        uvLabel.textContent = 'Low';
        uvLabel.classList.add('uv-low');
    } else if (uvIndex <= 5) {
        uvLabel.textContent = 'Moderate';
        uvLabel.classList.add('uv-moderate');
    } else if (uvIndex <= 7) {
        uvLabel.textContent = 'High';
        uvLabel.classList.add('uv-high');
    } else if (uvIndex <= 10) {
        uvLabel.textContent = 'Very High';
        uvLabel.classList.add('uv-very-high');
    } else {
        uvLabel.textContent = 'Extreme';
        uvLabel.classList.add('uv-extreme');
    }
}

// Helper function to format date with timezone
function formatDate(date, timezoneOffset) {
    const localDate = new Date(date.getTime() + timezoneOffset * 1000);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return localDate.toLocaleDateString('en-US', options);
}

// Helper function to format day name with timezone
function formatDay(date, timezoneOffset) {
    const localDate = new Date(date.getTime() + timezoneOffset * 1000);
    const options = { weekday: 'short' };
    return localDate.toLocaleDateString('en-US', options);
}

// Helper function to format time with timezone
function formatTime(timestamp, timezoneOffset) {
    const date = new Date((timestamp + timezoneOffset) * 1000);
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true,
        timeZone: 'UTC'
    });
}

// Helper function to format hour
function formatHour(date, timezoneOffset) {
    const localDate = new Date(date.getTime() + timezoneOffset * 1000);
    return localDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        hour12: true,
        timeZone: 'UTC'
    });
}

// Helper function to get wind direction
function getWindDirection(degrees) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
}

// Helper function to get weather icon
function getWeatherIcon(iconCode) {
    const iconMap = {
        '01d': 'fas fa-sun',
        '01n': 'fas fa-moon',
        '02d': 'fas fa-cloud-sun',
        '02n': 'fas fa-cloud-moon',
        '03d': 'fas fa-cloud',
        '03n': 'fas fa-cloud',
        '04d': 'fas fa-cloud',
        '04n': 'fas fa-cloud',
        '09d': 'fas fa-cloud-rain',
        '09n': 'fas fa-cloud-rain',
        '10d': 'fas fa-cloud-sun-rain',
        '10n': 'fas fa-cloud-moon-rain',
        '11d': 'fas fa-bolt',
        '11n': 'fas fa-bolt',
        '13d': 'fas fa-snowflake',
        '13n': 'fas fa-snowflake',
        '50d': 'fas fa-smog',
        '50n': 'fas fa-smog'
    };
    
    return `<i class="${iconMap[iconCode] || 'fas fa-question'}"></i>`;
}

// Update background animation based on weather
function updateBackgroundAnimation(weatherMain) {
    const particles = document.querySelectorAll('.particles');
    
    // Reset all particles
    particles.forEach(particle => {
        particle.style.backgroundColor = '';
    });
    
    // Change colors based on weather
    switch (weatherMain.toLowerCase()) {
        case 'clear':
            particles[0].style.backgroundColor = '#FFD700';
            particles[1].style.backgroundColor = '#FFA500';
            break;
        case 'clouds':
            particles[0].style.backgroundColor = '#CCCCCC';
            particles[1].style.backgroundColor = '#999999';
            break;
        case 'rain':
            particles[0].style.backgroundColor = '#4682B4';
            particles[1].style.backgroundColor = '#1E90FF';
            break;
        case 'snow':
            particles[0].style.backgroundColor = '#FFFFFF';
            particles[1].style.backgroundColor = '#E0FFFF';
            break;
        case 'thunderstorm':
            particles[0].style.backgroundColor = '#4B0082';
            particles[1].style.backgroundColor = '#800080';
            break;
        default:
            particles[0].style.backgroundColor = '#4CC9F0';
            particles[1].style.backgroundColor = '#4361EE';
    }
}

// Show notification
function showNotification(message) {
    notification.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}