import axios from "axios";

const WEATHER_API_KEY = process.env["OPENWEATHER_API_KEY"] || "cfb18895da0d8bf04a8307cc8550fe0d";
const WEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";

export interface WeatherData {
  city: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  sunrise: number;
  sunset: number;
}

export interface ForecastDay {
  date: string;
  minTemp: number;
  maxTemp: number;
  description: string;
  icon: string;
}

export function getWeatherEmoji(icon: string): string {
  const code = icon.slice(0, 2);
  const isDay = icon.endsWith("d");

  switch (code) {
    case "01":
      return isDay ? "☀️" : "🌙";
    case "02":
      return "⛅";
    case "03":
      return "🌤️";
    case "04":
      return "☁️";
    case "09":
      return "🌧️";
    case "10":
      return isDay ? "🌦️" : "🌧️";
    case "11":
      return "⛈️";
    case "12":
      return "🌨️";
    case "13":
      return "❄️";
    case "50":
      return "🌫️";
    default:
      return "🌡️";
  }
}

export function getWindEmoji(speed: number): string {
  if (speed < 5) return "🍃";
  if (speed < 10) return "💨";
  return "🌬️";
}

export async function getCurrentWeather(cityName: string): Promise<WeatherData> {
  const response = await axios.get(`${WEATHER_BASE_URL}/weather`, {
    params: {
      q: cityName,
      appid: WEATHER_API_KEY,
      units: "metric",
      lang: "uz",
    },
  });

  const data = response.data;
  return {
    city: data.name,
    temp: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    humidity: data.main.humidity,
    windSpeed: data.wind.speed,
    description: data.weather[0].description,
    icon: data.weather[0].icon,
    sunrise: data.sys.sunrise,
    sunset: data.sys.sunset,
  };
}

export async function getWeatherByCoords(lat: number, lon: number): Promise<WeatherData> {
  const response = await axios.get(`${WEATHER_BASE_URL}/weather`, {
    params: {
      lat,
      lon,
      appid: WEATHER_API_KEY,
      units: "metric",
      lang: "uz",
    },
  });

  const data = response.data;
  return {
    city: data.name,
    temp: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    humidity: data.main.humidity,
    windSpeed: data.wind.speed,
    description: data.weather[0].description,
    icon: data.weather[0].icon,
    sunrise: data.sys.sunrise,
    sunset: data.sys.sunset,
  };
}

export async function getForecast(cityName: string): Promise<ForecastDay[]> {
  const response = await axios.get(`${WEATHER_BASE_URL}/forecast`, {
    params: {
      q: cityName,
      appid: WEATHER_API_KEY,
      units: "metric",
      lang: "uz",
      cnt: 40,
    },
  });

  const list = response.data.list;
  const dailyMap = new Map<string, { temps: number[]; descriptions: string[]; icons: string[] }>();

  for (const item of list) {
    const date = item.dt_txt.split(" ")[0];
    if (!dailyMap.has(date)) {
      dailyMap.set(date, { temps: [], descriptions: [], icons: [] });
    }
    const day = dailyMap.get(date)!;
    day.temps.push(item.main.temp);
    day.descriptions.push(item.weather[0].description);
    day.icons.push(item.weather[0].icon);
  }

  const result: ForecastDay[] = [];
  for (const [date, data] of dailyMap.entries()) {
    const minTemp = Math.round(Math.min(...data.temps));
    const maxTemp = Math.round(Math.max(...data.temps));
    const midIndex = Math.floor(data.descriptions.length / 2);
    result.push({
      date,
      minTemp,
      maxTemp,
      description: data.descriptions[midIndex],
      icon: data.icons[midIndex],
    });
  }

  return result.slice(1, 6);
}

export function formatWeatherMessage(weather: WeatherData, cityLabel: string): string {
  const emoji = getWeatherEmoji(weather.icon);
  const windEmoji = getWindEmoji(weather.windSpeed);
  const now = new Date();
  const timeStr = now.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("uz-UZ", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    `${emoji} <b>${cityLabel} hozirgi ob-havo</b>\n` +
    `📅 ${dateStr} | 🕐 ${timeStr}\n\n` +
    `🌡️ <b>Harorat:</b> ${weather.temp}°C\n` +
    `🤔 <b>His qilinish:</b> ${weather.feelsLike}°C\n` +
    `📝 <b>Holat:</b> ${weather.description}\n` +
    `💧 <b>Namlik:</b> ${weather.humidity}%\n` +
    `${windEmoji} <b>Shamol:</b> ${weather.windSpeed} m/s\n`
  );
}

export function formatForecastMessage(forecast: ForecastDay[], cityLabel: string): string {
  let msg = `📅 <b>${cityLabel} - 5 kunlik ob-havo</b>\n\n`;

  for (const day of forecast) {
    const date = new Date(day.date);
    const dayName = date.toLocaleDateString("uz-UZ", { weekday: "long", day: "numeric", month: "short" });
    const emoji = getWeatherEmoji(day.icon);
    msg += `${emoji} <b>${dayName}</b>\n`;
    msg += `   🌡️ ${day.minTemp}°C - ${day.maxTemp}°C | ${day.description}\n\n`;
  }

  return msg;
}

export function formatDailyReport(weather: WeatherData, cityLabel: string, isEvening = false): string {
  const emoji = getWeatherEmoji(weather.icon);
  const windEmoji = getWindEmoji(weather.windSpeed);

  if (isEvening) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toLocaleDateString("uz-UZ", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return (
      `🌙 <b>${cityLabel} - Ertangi kun ob-havo bashorati</b>\n` +
      `📅 ${tomorrowStr}\n\n` +
      `${emoji} <b>Holat:</b> ${weather.description}\n` +
      `🌡️ <b>Harorat:</b> ~${weather.temp}°C\n` +
      `💧 <b>Namlik:</b> ${weather.humidity}%\n` +
      `${windEmoji} <b>Shamol:</b> ${weather.windSpeed} m/s\n\n` +
      `🌙 Yaxshi tunlar! Ertangi kunga tayyorlanib qo'ying.`
    );
  }

  const today = new Date();
  const dateStr = today.toLocaleDateString("uz-UZ", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    `☀️ <b>${cityLabel} - Bugungi ob-havo</b>\n` +
    `📅 ${dateStr}\n\n` +
    `${emoji} <b>Holat:</b> ${weather.description}\n` +
    `🌡️ <b>Harorat:</b> ${weather.temp}°C (his: ${weather.feelsLike}°C)\n` +
    `💧 <b>Namlik:</b> ${weather.humidity}%\n` +
    `${windEmoji} <b>Shamol:</b> ${weather.windSpeed} m/s\n\n` +
    `🌅 Xayrli kun! Bugungi kuningiz yaxshi o'tsin!`
  );
}
