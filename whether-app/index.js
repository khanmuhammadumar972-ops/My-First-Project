async function getWeather(){
  const city = document.getElementById("city").value.trim();
  const result = document.getElementById("result");

  if(city === ""){
    result.innerHTML = "Please enter a city name.";
    return;
  }

  result.innerHTML = "Loading...";

  try{
    // Step 1: city -> coordinates
    const geo = await fetch(
      "https://geocoding-api.open-meteo.com/v1/search?name=" + city
    );

    const geoData = await geo.json();

    if(!geoData.results){
      result.innerHTML = "City not found.";
      return;
    }

    const lat = geoData.results[0].latitude;
    const lon = geoData.results[0].longitude;
    const cityName = geoData.results[0].name;

    // Step 2: coordinates -> weather
    const weather = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
    );

    const weatherData = await weather.json();

    const temp = weatherData.current_weather.temperature;
    const wind = weatherData.current_weather.windspeed;

    result.innerHTML =
      `<h2>${cityName}</h2>
       <p>🌡 Temperature: ${temp}°C</p>
       <p>💨 Wind: ${wind} km/h</p>`;
  }
  catch(error){
    result.innerHTML = "Something went wrong.";
  }
}