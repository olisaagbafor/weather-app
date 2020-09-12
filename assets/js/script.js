const api = {
    key: "c1f17d2c6af9a54093738206d012bab8",
    baseurl: "https://api.openweathermap.org/data/2.5/"
}

const search = document.querySelector('.search-city');
search.addEventListener('keypress', setQuery);

function setQuery(event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        if (search.value == "") {
            showMessage(`City name cannot be empty... `);
            return;
        }
        getResults(search.value.trim());
    }
}

function showMessage(message) {
    document.querySelector('#message').innerHTML = message;
}

function getResults(query) {
    showMessage(`Fetching weather forecast for <b style="color: #ff8e12">${query}...</b>`)
    fetch(`${api.baseurl}weather?q=${query}&units=metric&APPID=${api.key}`)
        .then(weather => weather.json(),
            error => {
                showMessage(`Error occurred!. Check your connection & try again...`)
            })
        .then(displayResults);

    //call service worker here
    getWeatherFromCache(query);
}

function displayResults(weather) {
    if (weather.name === undefined) {
        showMessage(`<b style="color: #ff8e12">'${search.value}'</b> could not be found in the Open Weather Map API database, Please try another.`);
        search.value = "";
        return;
    }
    showMessage(`Showing result for <b style="color: #ff8e12">'${search.value}'</b> Weather forecast.`);
    search.value = "";
    document.querySelector('.location .city').innerText = `${weather.name}, ${weather.sys.country}`;

    let now = new Date();
    document.querySelector('.location .date').innerText = dateBuilder(now);

    document.querySelector('.current .temperature').innerHTML = `${Math.round(weather.main.temp)}<span>&#x2103;</span>`

    document.querySelector('.current .weather').textContent = weather.weather[0].main;

    document.querySelector('.hi-low').innerHTML = `<span>${weather.main.temp_min}&#x2103; / ${weather.main.temp_max}&#x2103;</span>`

    //Use longitude and latitude obtained from user's query/search for fetch forecast data
    fetch(`${api.baseurl}onecall?lat=${weather.coord.lat}&lon=${weather.coord.lon}&exclude=hourly&units=metric&appid=${api.key}`)
    .then(forecast => forecast.json()).then(displayForecast);
}

function displayForecast(forecast) {

    let unix_time = forecast.current.dt * 1000;
    let date = new Date(unix_time);

    document.querySelector('#weather_icon').src = `https://openweathermap.org/img/wn/${forecast.current.weather[0].icon}@2x.png`; //remove @2x to get a smaller img

    const days = document.querySelectorAll('.daily__date');
    days.forEach( (day, index) => {
        unix_time = forecast.daily[index].dt * 1000;
        date = new Date(unix_time);
        day.innerHTML = date.toDateString();
    });

    const daily_temp = document.querySelectorAll('.daily__temp');
    daily_temp.forEach(function (temp, index) {
        temp.innerHTML = `Min ${Math.round(forecast.daily[index].temp.min)}°c | ${Math.round(forecast.daily[index].temp.max)}°c Max`;
    });

    const daily_icon = document.querySelectorAll('.small-icon');
    daily_icon.forEach(function (icon, index) {
        icon.src = `https://openweathermap.org/img/wn/${forecast.daily[index].weather[0].icon}@2x.png`; //remove @2x to get a smaller img
    });

    const daily_weather = document.querySelectorAll('.daily__weather');
    daily_weather.forEach(function (weather, index) {
        weather.innerHTML = forecast.daily[index].weather[0].main;
    });

    const daily_humidity = document.querySelectorAll('.daily__humidity');
    daily_humidity.forEach(function (humidity, index) {
        humidity.innerHTML = `Humidity ${Math.round(forecast.daily[index].humidity)}%`;
    });

    const daily_wind = document.querySelectorAll('.daily__wind');
    daily_wind.forEach(function (wind, index) {
        wind.innerHTML = `Wind (speed) ${Math.round(forecast.daily[index].wind_speed)}m/s`;
    });

    /*--------------------------------------------
    Implement localstorage.setItem() here - others
    ---------------------------------------------*/
    storeForecastInLocalStorage();

}

function dateBuilder(d) {
    let months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];
    let days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
    ];

    let day = days[d.getDay()];
    let date = d.getDate();
    let month = months[d.getMonth()];
    let year = d.getFullYear();

    return `${day} ${date} ${month} ${year}`;
}

//Add function for service worker
function getWeatherFromCache(query) {
    if (!('caches' in window)) {
        return null;
    }

    const url = `${window.location.origin}/${api.baseurl}weather?q=${query}&units=metric&APPID=${api.key}`;
    return caches.match(url)
        .then((weather) => {
            if (weather) {
                return weather.json();
            }
            return null;
        })
        .catch((err) => {
            console.error('Error getting data from cache', err);
            return null;
        });
}


function storeForecastInLocalStorage() {
    let storedCity = document.querySelector('.city').textContent;
    localStorage.setItem('city', storedCity);

    let storedDay = document.querySelector('.date').textContent;
    localStorage.setItem('day', storedDay);

    let storedTemp = document.querySelector('.temperature').textContent;
    localStorage.setItem('temperature', storedTemp);

    let storedIcon = document.querySelector('#weather_icon').src;
    localStorage.setItem('icon', storedIcon);

    let storedWeather = document.querySelector('.weather').textContent;
    localStorage.setItem('weather', storedWeather);

    let stored_days = document.querySelectorAll('.daily__date');
    stored_days.forEach(function (day, index) {

        let stored_day = day.textContent;
        localStorage.setItem(`daily-day-${index}`, stored_day);

    });

    let stored_daily_temp = document.querySelectorAll('.daily__temp');
    stored_daily_temp.forEach(function (temp, index) {

        let stored_temp = temp.textContent;
        localStorage.setItem(`daily-temp-${index}`, stored_temp);

    });

    let stored_daily_icon = document.querySelectorAll('.small-icon');
    stored_daily_icon.forEach(function (icon, index) {

        let stored_icon = icon.src;
        localStorage.setItem(`daily-icon-${index}`, stored_icon);

    });

    let stored_daily_weather = document.querySelectorAll('.daily__weather');
    stored_daily_weather.forEach(function (weather, index) {

        let stored_weather = weather.textContent;
        localStorage.setItem(`daily-weather-${index}`, stored_weather);

    });

    let stored_daily_humidity = document.querySelectorAll('.daily__humidity');
    stored_daily_humidity.forEach(function (humidity, index) {

        let stored_humidity = humidity.textContent;
        localStorage.setItem(`daily-humidity-${index}`, stored_humidity);

    });

    let stored_daily_wind = document.querySelectorAll('.daily__wind');
    stored_daily_wind.forEach(function (wind, index) {

        let stored_wind = wind.textContent;
        localStorage.setItem(`daily-wind-${index}`, stored_wind);

    });

}

function displayLocalStorageToScreen() {
    let getCity = localStorage.getItem('city');
    document.querySelector('.city').textContent = getCity;

    let getDay = localStorage.getItem('day');
    document.querySelector('.date').textContent = getDay;

    let getTemp = localStorage.getItem('temperature');
    document.querySelector('.temperature').textContent = getTemp;

    let getIcon = localStorage.getItem('icon');
    document.querySelector('#weather_icon').src = getIcon;

    let getWeather = localStorage.getItem('weather');
    document.querySelector('.weather').textContent = getWeather;

    let get_days = document.querySelectorAll('.daily__date');
    get_days.forEach(function (day, index) {

        let get_day = localStorage.getItem(`daily-day-${index}`);
        day.textContent = get_day;

    });

    let get_daily_temp = document.querySelectorAll('.daily__temp');
    get_daily_temp.forEach(function (temp, index) {

        let get_temp = localStorage.getItem(`daily-temp-${index}`);
        temp.textContent = get_temp;

    });

    let get_daily_icon = document.querySelectorAll('.small-icon');
    get_daily_icon.forEach(function (icon, index) {

        let get_icon = localStorage.getItem(`daily-icon-${index}`);
        icon.src = get_icon;

    });

    let get_daily_weather = document.querySelectorAll('.daily__weather');
    get_daily_weather.forEach(function (weather, index) {

        let get_weather = localStorage.getItem(`daily-weather-${index}`);
        weather.textContent = get_weather;

    });

    let get_daily_humidity = document.querySelectorAll('.daily__humidity');
    get_daily_humidity.forEach(function (humidity, index) {

        let get_humidity = localStorage.getItem(`daily-humidity-${index}`);
        humidity.textContent = get_humidity;

    });

    let get_daily_wind = document.querySelectorAll('.daily__wind');
    get_daily_wind.forEach(function (wind, index) {

        let get_wind = localStorage.getItem(`daily-wind-${index}`);
        wind.textContent = get_wind;

    });
}

window.onload = function () {
    if (localStorage.getItem('city') === null) {
        showMessage(`Enter a city to get the weather forecast...`);
    }else {
        showMessage(`Fetching recently searched weather forecast...`);
        displayLocalStorageToScreen();
        showMessage(`Showing result for <b style="color: #ff8e12">'${localStorage.getItem('city')}'</b> Weather forecast.`);
    }
}