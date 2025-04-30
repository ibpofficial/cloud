// API Configuration
const API_KEY = '9923cba1c889851bd8a96808269a22a1';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/';
const AIR_QUALITY_URL = 'http://api.openweathermap.org/data/2.5/air_pollution';

// DOM Elements
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const cityName = document.getElementById('city-name');
const currentDate = document.getElementById('current-date');
const currentTime = document.getElementById('current-time');
const weatherIcon = document.getElementById('weather-icon');
const weatherDescription = document.getElementById('weather-description');
const currentTemp = document.getElementById('current-temp');
const maxTemp = document.getElementById('max-temp');
const minTemp = document.getElementById('min-temp');
const feelsLike = document.getElementById('feels-like');
const humidity = document.getElementById('humidity');
const humidityBar = document.getElementById('humidity-bar');
const windSpeed = document.getElementById('wind-speed');
const windDirectionIndicator = document.getElementById('wind-direction-indicator');
const pressure = document.getElementById('pressure');
const pressureGauge = document.getElementById('pressure-gauge');
const precipitation = document.getElementById('precipitation');
const precipitationDrops = document.getElementById('precipitation-drops');
const airQuality = document.getElementById('air-quality');
const aqiValue = document.querySelector('.aqi-value');
const aqiLevel = document.querySelector('.aqi-level');
const forecastCards = document.getElementById('forecast-cards');
const dailyBtn = document.getElementById('daily-btn');
const hourlyBtn = document.getElementById('hourly-btn');
const sunrise = document.getElementById('sunrise');
const sunset = document.getElementById('sunset');
const sunriseMarker = document.getElementById('sunrise-marker');
const sunsetMarker = document.getElementById('sunset-marker');
const sunPosition = document.getElementById('sun-position');
const daylightDuration = document.getElementById('daylight-duration');
const uvValue = document.getElementById('uv-value');
const uvLabel = document.getElementById('uv-label');
const uvLevel = document.getElementById('uv-level');
const visibility = document.getElementById('visibility');
const visibilityBar = document.getElementById('visibility-bar');
const dewPoint = document.getElementById('dew-point');
const comfortLevel = document.getElementById('comfort-level');
const celsiusBtn = document.getElementById('celsius-btn');
const fahrenheitBtn = document.getElementById('fahrenheit-btn');
const themeBtn = document.getElementById('theme-btn');
const notification = document.getElementById('notification');
const weatherAnimation = document.getElementById('weather-animation');
const particlesContainer = document.querySelector('.particles-container');
const mapContainer = document.getElementById('map-container');

// Global Variables
let currentUnit = 'metric'; // Default to Celsius
let currentWeatherData = null;
let currentForecastData = null;
let currentAirQualityData = null;
let manualTheme = false;
let isHourlyForecast = false;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Set initial theme
    document.body.classList.add('day');
    
    // Check if there's a saved city in localStorage
    const savedCity = localStorage.getItem('lastSearchedCity');
    if (savedCity) {
        searchInput.value = savedCity;
        fetchWeatherData(savedCity);
    } else {
        // Default to London if no saved city
        fetchWeatherData('London');
    }
    
    // Update current time every second
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    
    // Set up event listeners
    searchBtn.addEventListener('click', handleSearch);
    locationBtn.addEventListener('click', handleLocation);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    searchInput.addEventListener('input', handleInput);
    celsiusBtn.addEventListener('click', () => switchUnit('metric'));
    fahrenheitBtn.addEventListener('click', () => switchUnit('imperial'));
    themeBtn.addEventListener('click', toggleTheme);
    dailyBtn.addEventListener('click', () => toggleForecastView(false));
    hourlyBtn.addEventListener('click', () => toggleForecastView(true));
});

// Update current time
function updateCurrentTime() {
    const now = new Date();
    currentTime.textContent = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

// Handle search input
function handleInput() {
    // TODO: Implement autocomplete suggestions
}

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
    currentDate.textContent = '-- -- ----';
    currentTemp.textContent = '--';
    weatherDescription.textContent = '-- --';
    maxTemp.textContent = '--°';
    minTemp.textContent = '--°';
    feelsLike.textContent = '--°';
    humidity.textContent = '--%';
    windSpeed.textContent = '-- km/h';
    pressure.textContent = '-- hPa';
    precipitation.textContent = '-- mm';
    sunrise.textContent = '--:--';
    sunset.textContent = '--:--';
    uvValue.textContent = '--';
    uvLabel.textContent = 'Low';
    visibility.textContent = '-- km';
    dewPoint.textContent = '--°';
    comfortLevel.textContent = '--';
    forecastCards.innerHTML = '<div class="loading">Loading forecast...</div>';
    mapContainer.innerHTML = '<div class="loading">Loading weather map...</div>';
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
        
        // Fetch air quality
        const airQualityResponse = await fetch(
            `${AIR_QUALITY_URL}?lat=${currentWeatherData.coord.lat}&lon=${currentWeatherData.coord.lon}&appid=${API_KEY}`
        );
        
        if (!airQualityResponse.ok) {
            throw new Error('Failed to fetch air quality data');
        }
        
        const airQualityData = await airQualityResponse.json();
        
        // Process and display data
        displayWeatherData(currentWeatherData);
        displayForecastData(forecastData);
        displayAirQualityData(airQualityData);
        
        // Save to localStorage
        localStorage.setItem('lastSearchedCity', city);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showNotification(error.message || 'Failed to fetch weather data');
        // Reset to previous data if available
        if (currentWeatherData) {
            displayWeatherData(currentWeatherData);
            displayForecastData(currentForecastData);
            if (currentAirQualityData) {
                displayAirQualityData(currentAirQualityData);
            }
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
        
        // Fetch air quality
        const airQualityResponse = await fetch(
            `${AIR_QUALITY_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}`
        );
        
        if (!airQualityResponse.ok) {
            throw new Error('Failed to fetch air quality data');
        }
        
        const airQualityData = await airQualityResponse.json();
        
        // Process and display data
        displayWeatherData(currentWeatherData);
        displayForecastData(forecastData);
        displayAirQualityData(airQualityData);
        
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
    currentDate.textContent = formatDate(now, data.timezone);
    
    // Update weather icon and description
    const weather = data.weather[0];
    weatherIcon.innerHTML = getWeatherIcon(weather.icon);
    weatherDescription.textContent = weather.description;
    
    // Update temperatures
    currentTemp.textContent = Math.round(data.main.temp);
    maxTemp.textContent = `${Math.round(data.main.temp_max)}°`;
    minTemp.textContent = `${Math.round(data.main.temp_min)}°`;
    feelsLike.textContent = `${Math.round(data.main.feels_like)}°`;
    
    // Update additional info
    humidity.textContent = `${data.main.humidity}%`;
    updateHumidityBar(data.main.humidity);
    
    windSpeed.textContent = `${Math.round(data.wind.speed)} ${currentUnit === 'metric' ? 'km/h' : 'mph'}`;
    updateWindDirectionIndicator(data.wind.deg);
    
    pressure.textContent = `${data.main.pressure} hPa`;
    updatePressureGauge(data.main.pressure);
    
    // Precipitation (rain or snow)
    const precipitationValue = data.rain ? data.rain['1h'] || 0 : data.snow ? data.snow['1h'] || 0 : 0;
    precipitation.textContent = `${precipitationValue.toFixed(1)} mm`;
    updatePrecipitationDrops(precipitationValue);
    
    // Update sunrise and sunset times (convert Unix timestamp with timezone offset)
    const sunriseTime = formatTime(data.sys.sunrise, data.timezone);
    const sunsetTime = formatTime(data.sys.sunset, data.timezone);
    sunrise.textContent = sunriseTime;
    sunset.textContent = sunsetTime;
    
    // Update sun position animation
    updateSunPosition(data.sys.sunrise, data.sys.sunset, data.timezone);
    
    // Update daylight duration
    updateDaylightDuration(data.sys.sunrise, data.sys.sunset);
    
    // Change background animation based on weather
    updateBackgroundAnimation(weather.main, data.main.temp);
    
    // Set theme based on time of day if not manually set
    if (!manualTheme) {
        setThemeBasedOnTime(data.timezone, data.sys.sunrise, data.sys.sunset);
    }
}

// Display forecast data
function displayForecastData(data) {
    currentForecastData = data;
    
    if (isHourlyForecast) {
        displayHourlyForecast(data);
    } else {
        displayDailyForecast(data);
    }
}

// Display daily forecast
function displayDailyForecast(data) {
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
        const dayName = formatDay(date, currentWeatherData.timezone);
        
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

// Display hourly forecast
function displayHourlyForecast(data) {
    forecastCards.innerHTML = '';
    
    // Get next 24 hours of forecast
    const now = new Date();
    const hourlyForecasts = data.list.filter(item => {
        const forecastTime = new Date(item.dt * 1000);
        return forecastTime > now && forecastTime <= new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }).slice(0, 8); // Limit to 8 hours for display
    
    hourlyForecasts.forEach(hour => {
        const date = new Date(hour.dt * 1000);
        const hourName = formatHour(date, currentWeatherData.timezone);
        
        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <div class="forecast-day">${hourName}</div>
            <div class="forecast-icon">${getWeatherIcon(hour.weather[0].icon)}</div>
            <div class="forecast-temp">
                <span>${Math.round(hour.main.temp)}°</span>
            </div>
            <div class="forecast-precipitation">
                <i class="fas fa-tint"></i>
                <span>${hour.pop ? Math.round(hour.pop * 100) : 0}%</span>
            </div>
        `;
        
        forecastCards.appendChild(card);
    });
}

// Display air quality data
function displayAirQualityData(data) {
    currentAirQualityData = data;
    const aqi = data.list[0].main.aqi;
    aqiValue.textContent = aqi;
    
    let aqiText, aqiColor;
    switch (aqi) {
        case 1:
            aqiText = 'Good';
            aqiColor = '#4CAF50';
            break;
        case 2:
            aqiText = 'Fair';
            aqiColor = '#8BC34A';
            break;
        case 3:
            aqiText = 'Moderate';
            aqiColor = '#FFEB3B';
            break;
        case 4:
            aqiText = 'Poor';
            aqiColor = '#FF9800';
            break;
        case 5:
            aqiText = 'Very Poor';
            aqiColor = '#F44336';
            break;
        default:
            aqiText = 'Unknown';
            aqiColor = '#9E9E9E';
    }
    
    aqiLevel.textContent = `(${aqiText})`;
    airQuality.style.background = `rgba(${hexToRgb(aqiColor)}, 0.2)`;
    airQuality.style.color = aqiColor;
}

// Helper function to convert hex to rgb
function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
}

// Toggle between daily and hourly forecast
function toggleForecastView(hourly) {
    isHourlyForecast = hourly;
    
    if (hourly) {
        dailyBtn.classList.remove('active');
        hourlyBtn.classList.add('active');
        displayHourlyForecast(currentForecastData);
    } else {
        hourlyBtn.classList.remove('active');
        dailyBtn.classList.add('active');
        displayDailyForecast(currentForecastData);
    }
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

// Toggle theme manually
function toggleTheme() {
    manualTheme = true;
    
    if (document.body.classList.contains('day')) {
        document.body.classList.remove('day');
        document.body.classList.add('evening');
        themeBtn.innerHTML = '<i class="fas fa-moon"></i>';
    } else if (document.body.classList.contains('evening')) {
        document.body.classList.remove('evening');
        document.body.classList.add('night');
        themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.body.classList.remove('night');
        document.body.classList.add('day');
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

// Update humidity bar visualization
function updateHumidityBar(humidity) {
    const angle = (humidity / 100) * 360;
    humidityBar.style.transform = `rotate(${angle}deg)`;
}

// Update wind direction indicator
function updateWindDirectionIndicator(degrees) {
    windDirectionIndicator.style.transform = `rotate(${degrees}deg)`;
}

// Update pressure gauge visualization
function updatePressureGauge(pressure) {
    // Normalize pressure between 950 and 1050 hPa
    const normalized = Math.min(Math.max((pressure - 950) / (1050 - 950), 0), 1);
    const angle = normalized * 360;
    pressureGauge.style.transform = `rotate(${angle}deg)`;
}

// Update precipitation drops visualization
function updatePrecipitationDrops(amount) {
    // Adjust the number of drops based on precipitation amount
    const drops = Math.min(Math.floor(amount / 5), 5);
    
    // Clear existing drops
    precipitationDrops.innerHTML = '';
    
    // Add new drops
    for (let i = 0; i < drops; i++) {
        const drop = document.createElement('div');
        drop.className = 'precipitation-drop';
        drop.style.left = `${10 + i * 20}%`;
        drop.style.animationDelay = `${i * 0.2}s`;
        precipitationDrops.appendChild(drop);
    }
}

// Update sun position on the sun path
function updateSunPosition(sunriseTime, sunsetTime, timezoneOffset) {
    const now = new Date();
    const localNow = new Date(now.getTime() + timezoneOffset * 1000);
    const sunrise = new Date(sunriseTime * 1000);
    const sunset = new Date(sunsetTime * 1000);
    
    // Calculate percentage of day passed
    const dayLength = sunset - sunrise;
    const timeSinceSunrise = localNow - sunrise;
    const percent = Math.min(Math.max(timeSinceSunrise / dayLength, 0), 1);
    
    // Position sun along the path (quadratic curve for more natural arc)
    const x = percent * 80 + 10; // 10% to 90% of container width
    const y = 50 - 40 * Math.sin(percent * Math.PI); // Arc height
    
    sunPosition.style.left = `${x}%`;
    sunPosition.style.top = `${y}%`;
    
    // Position sunrise and sunset markers
    sunriseMarker.style.left = '10%';
    sunsetMarker.style.left = '90%';
}

// Update daylight duration
function updateDaylightDuration(sunriseTime, sunsetTime) {
    const daylightMs = (sunsetTime - sunriseTime) * 1000;
    const hours = Math.floor(daylightMs / (1000 * 60 * 60));
    const minutes = Math.floor((daylightMs % (1000 * 60 * 60)) / (1000 * 60));
    daylightDuration.textContent = `${hours}h ${minutes}m`;
}

// Update UV index visualization
function updateUvIndex(uvIndex) {
    uvValue.textContent = uvIndex.toFixed(1);
    
    // Position the UV level indicator
    const position = Math.min(uvIndex / 12, 1) * 100;
    uvLevel.style.left = `${position}%`;
    
    // Set UV level label and color
    let label, color;
    if (uvIndex <= 2) {
        label = 'Low';
        color = '#4CAF50';
    } else if (uvIndex <= 5) {
        label = 'Moderate';
        color = '#FFEB3B';
    } else if (uvIndex <= 7) {
        label = 'High';
        color = '#FF9800';
    } else if (uvIndex <= 10) {
        label = 'Very High';
        color = '#F44336';
    } else {
        label = 'Extreme';
        color = '#9C27B0';
    }
    
    uvLabel.textContent = label;
    uvLevel.style.backgroundColor = color;
}

// Update visibility bar
function updateVisibilityBar(visibilityKm) {
    // Normalize visibility between 0 and 20 km
    const normalized = Math.min(visibilityKm / 20, 1);
    visibilityBar.style.width = `${normalized * 100}%`;
    
    // Change color based on visibility
    if (normalized < 0.3) {
        visibilityBar.style.background = '#F44336'; // Red for poor visibility
    } else if (normalized < 0.6) {
        visibilityBar.style.background = '#FF9800'; // Orange for moderate visibility
    } else {
        visibilityBar.style.background = '#4CAF50'; // Green for good visibility
    }
}

// Update dew point and comfort level
function updateDewPoint(temp, humidity) {
    // Calculate dew point (approximation)
    const dewPointTemp = temp - (100 - humidity) / 5;
    dewPoint.textContent = `${Math.round(dewPointTemp)}°`;
    
    // Determine comfort level
    let comfort;
    if (dewPointTemp < 10) {
        comfort = 'Dry';
    } else if (dewPointTemp < 16) {
        comfort = 'Comfortable';
    } else if (dewPointTemp < 21) {
        comfort = 'Slightly humid';
    } else if (dewPointTemp < 26) {
        comfort = 'Humid';
    } else {
        comfort = 'Muggy';
    }
    
    comfortLevel.textContent = comfort;
}

// Update background animation based on weather and temperature
function updateBackgroundAnimation(weatherMain, temp) {
    // Clear existing weather animations
    weatherAnimation.innerHTML = '';
    particlesContainer.innerHTML = '';
    
    // Set background based on weather
    let backgroundClass, particleColor1, particleColor2;
    
    switch (weatherMain.toLowerCase()) {
        case 'clear':
            backgroundClass = 'clear-sky';
            particleColor1 = '#FFD700';
            particleColor2 = '#FFA500';
            break;
        case 'clouds':
            backgroundClass = 'cloudy';
            particleColor1 = '#CCCCCC';
            particleColor2 = '#999999';
            break;
        case 'rain':
            backgroundClass = 'rainy';
            particleColor1 = '#4682B4';
            particleColor2 = '#1E90FF';
            // Add rain animation
            const rain = document.createElement('div');
            rain.className = 'rain';
            weatherAnimation.appendChild(rain);
            break;
        case 'snow':
            backgroundClass = 'snowy';
            particleColor1 = '#FFFFFF';
            particleColor2 = '#E0FFFF';
            // Add snow animation
            const snow = document.createElement('div');
            snow.className = 'snow';
            weatherAnimation.appendChild(snow);
            break;
        case 'thunderstorm':
            backgroundClass = 'stormy';
            particleColor1 = '#4B0082';
            particleColor2 = '#800080';
            break;
        case 'fog':
        case 'mist':
        case 'haze':
            backgroundClass = 'foggy';
            particleColor1 = '#B0C4DE';
            particleColor2 = '#778899';
            // Add fog animation
            const fog = document.createElement('div');
            fog.className = 'fog';
            weatherAnimation.appendChild(fog);
            break;
        default:
            backgroundClass = 'default';
            particleColor1 = '#4CC9F0';
            particleColor2 = '#4361EE';
    }
    
    // Adjust particle colors based on temperature
    if (currentUnit === 'fahrenheit') {
        temp = (temp - 32) * 5/9;
    }
    
    if (temp < 0) {
        // Very cold - blue tones
        particleColor1 = '#E0FFFF';
        particleColor2 = '#ADD8E6';
    } else if (temp > 30) {
        // Very hot - red/orange tones
        particleColor1 = '#FF4500';
        particleColor2 = '#FF8C00';
    }
    
    // Create particles
    createParticles(particleColor1, particleColor2);
    
    // Update sun animation based on temperature
    updateSunAnimation(temp);
}

// Create floating particles
function createParticles(color1, color2) {
    const particleCount = 10;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random size between 5 and 20px
        const size = Math.random() * 15 + 5;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Random position
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        
        // Random color
        particle.style.background = Math.random() > 0.5 ? color1 : color2;
        
        // Random animation duration and delay
        const duration = Math.random() * 20 + 10;
        const delay = Math.random() * 10;
        particle.style.animationDuration = `${duration}s`;
        particle.style.animationDelay = `-${delay}s`;
        
        particlesContainer.appendChild(particle);
    }
}

/* Also update the sun animation function in script.js */
function updateSunAnimation(temp) {
    let size, intensity, color;
    
    if (temp < 0) {
        // Cold - smaller, paler sun
        size = 60;  // Reduced sizes throughout
        intensity = 0.6;
        color = '#FFFFFF';
    } else if (temp < 10) {
        // Cool - medium sun
        size = 80;
        intensity = 0.7;
        color = '#FFFF00';
    } else if (temp < 20) {
        // Mild - normal sun
        size = 100;
        intensity = 0.8;
        color = '#FFD700';
    } else if (temp < 30) {
        // Warm - bright sun
        size = 120;
        intensity = 0.9;
        color = '#FFA500';
    } else {
        // Hot - large, intense sun
        size = 40;
        intensity = 1;
        color = '#FF4500';
    }
    
    sunPosition.style.width = `${size}px`;
    sunPosition.style.height = `${size}px`;
    sunPosition.style.background = color;
    sunPosition.style.boxShadow = `0 0 ${size/2}px ${color}`;  // Reduced glow
    sunPosition.style.opacity = intensity;
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

// Show notification
function showNotification(message) {
    notification.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}