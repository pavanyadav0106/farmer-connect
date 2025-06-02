// Use the key from config.js
import { CONFIG } from './config.js';

const apiKey = CONFIG.WEATHER_API_KEY;

// Use apiKey in your weather API calls
document.addEventListener('DOMContentLoaded', () => {
    const weatherButton = document.getElementById("weatherButton");
    const weatherPopup = document.getElementById("weatherPopup");
    const closeBtn = document.querySelector(".close-btn");
    const getWeatherBtn = document.getElementById("getWeatherBtn");
    const locationInput = document.getElementById("locationInput");
    const suggestionBox = document.getElementById("suggestionBox");
    const weatherData = document.getElementById("weatherData");
    const overlay = document.querySelector(".overlay");
    const loading = document.getElementById("loading");

    // Open weather popup
    weatherButton.addEventListener('click', () => {
        weatherPopup.classList.add("active");
        overlay.classList.add("active");
    });

    // Close popup
    closeBtn.addEventListener('click', closePopup);
    overlay.addEventListener('click', closePopup);

    // Location input autocomplete
    locationInput.addEventListener('input', debounce(handleLocationInput, 500));

    // Get weather button
    getWeatherBtn.addEventListener('click', fetchWeatherData);

    function closePopup() {
    weatherPopup.classList.remove("active");
    overlay.classList.remove("active");

    // Clear input field and data attributes
    locationInput.value = "";
    locationInput.removeAttribute("data-lat");
    locationInput.removeAttribute("data-lon");

    // Clear suggestion box and weather data
    suggestionBox.style.display = "none";
    suggestionBox.innerHTML = "";
    weatherData.innerHTML = "";

    // Hide loading spinner if still showing
    loading.style.display = "none";
}


    async function handleLocationInput() {
        const query = this.value.trim();
        if (query.length < 2) {
            suggestionBox.style.display = "none";
            return;
        }

        try {
            const response = await fetch(
                `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${apiKey}`
            );
            
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const data = await response.json();
            displaySuggestions(data);
        } catch (error) {
            console.error("Autocomplete error:", error);
            suggestionBox.style.display = "none";
        }
    }

    function displaySuggestions(cities) {
        suggestionBox.innerHTML = "";
        
        if (!cities || cities.length === 0) {
            suggestionBox.style.display = "none";
            return;
        }

        cities.forEach(city => {
            const suggestion = document.createElement("div");
            suggestion.className = "suggestion";
            suggestion.textContent = `${city.name}, ${city.country}`;
            suggestion.addEventListener('click', () => {
                locationInput.value = `${city.name}, ${city.country}`;
                locationInput.setAttribute("data-lat", city.lat);
                locationInput.setAttribute("data-lon", city.lon);
                suggestionBox.style.display = "none";
            });
            suggestionBox.appendChild(suggestion);
        });

        suggestionBox.style.display = "block";
    }

    async function fetchWeatherData() {
        const lat = locationInput.getAttribute("data-lat");
        const lon = locationInput.getAttribute("data-lon");

        if (!lat || !lon) {
            alert("Please select a valid location from the suggestions");
            return;
        }

        loading.style.display = "block";
        weatherData.innerHTML = "";

        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
            );

            if (!response.ok) {
                throw new Error(`Weather API request failed with status ${response.status}`);
            }

            const data = await response.json();
            displayWeather(data);
        } catch (error) {
            console.error("Weather fetch error:", error);
            weatherData.innerHTML = `
                <p class="error">Failed to fetch weather data. Please try again later.</p>
                <p>Error: ${error.message}</p>
            `;
        } finally {
            loading.style.display = "none";
        }
    }

    function displayWeather(weatherData) {
        const dailyForecast = weatherData.list.filter(forecast => 
            forecast.dt_txt.includes("12:00:00")
        );

        const weatherHTML = dailyForecast.map(day => {
            const date = new Date(day.dt * 1000).toLocaleDateString("en-US", {
                weekday: 'long',
                month: 'short',
                day: 'numeric'
            });
            
            return `
                <div class="weather-card">
                    <h3>${date}</h3>
                    <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" 
                         alt="${day.weather[0].description}">
                    <p>${Math.round(day.main.temp)}°C</p>
                    <p>${day.weather[0].main}</p>
                    <p>Humidity: ${day.main.humidity}%</p>
                </div>
            `;
        }).join('');

        document.getElementById("weatherData").innerHTML = `
            <div class="weather-cards">${weatherHTML}</div>
        `;
    }

    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this, args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }
});