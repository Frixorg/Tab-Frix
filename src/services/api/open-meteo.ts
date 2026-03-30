import type {
	FetchedForecast,
	FetchedWeather,
} from '@/layouts/widgets/weather/weather.interface'

const WMO_CODE_MAP: Record<number, { text: string; icon: string }> = {
	0: { text: 'Clear sky', icon: '01' },
	1: { text: 'Mainly clear', icon: '01' },
	2: { text: 'Partly cloudy', icon: '02' },
	3: { text: 'Overcast', icon: '03' },
	45: { text: 'Fog', icon: '50' },
	48: { text: 'Depositing rime fog', icon: '50' },
	51: { text: 'Drizzle: Light', icon: '09' },
	53: { text: 'Drizzle: Moderate', icon: '09' },
	55: { text: 'Drizzle: Dense intensity', icon: '09' },
	61: { text: 'Rain: Slight', icon: '10' },
	63: { text: 'Rain: Moderate', icon: '10' },
	65: { text: 'Rain: Heavy intensity', icon: '10' },
	71: { text: 'Snow fall: Slight', icon: '13' },
	73: { text: 'Snow fall: Moderate', icon: '13' },
	75: { text: 'Snow fall: Heavy intensity', icon: '13' },
	77: { text: 'Snow grains', icon: '13' },
	80: { text: 'Rain showers: Slight', icon: '09' },
	81: { text: 'Rain showers: Moderate', icon: '09' },
	82: { text: 'Rain showers: Violent', icon: '09' },
	85: { text: 'Snow showers: Slight', icon: '13' },
	86: { text: 'Snow showers: Heavy', icon: '13' },
	95: { text: 'Thunderstorm: Slight or moderate', icon: '11' },
	96: { text: 'Thunderstorm with slight hail', icon: '11' },
	99: { text: 'Thunderstorm with heavy hail', icon: '11' },
}

function getIconUrl(iconCode: string, isDay: boolean = true) {
	return `https://openweathermap.org/img/wn/${iconCode}${isDay ? 'd' : 'n'}@2x.png`
}

export async function fetchOpenMeteoWeather(
	lat: number,
	lon: number,
	units: 'metric' | 'imperial' = 'metric'
): Promise<FetchedWeather> {
	const response = await fetch(
		`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&temperature_unit=${
			units === 'imperial' ? 'fahrenheit' : 'celsius'
		}`
	)

	if (!response.ok) throw new Error('Failed to fetch weather from Open-Meteo')

	const data = await response.json()
	const current = data.current
	const daily = data.daily
	const weatherInfo = WMO_CODE_MAP[current.weather_code] || { text: 'Unknown', icon: '01' }

	const fetchedWeather: FetchedWeather = {
		city: {
			en: 'Current Location', // We don't have city name from coordinates alone here easily
			fa: 'موقعیت فعلی',
		},
		weather: {
			statusBanner: null,
			label: weatherInfo.text,
			icon: {
				url: getIconUrl(weatherInfo.icon, current.is_day === 1),
				width: 80,
				height: 80,
			},
			description: {
				text: weatherInfo.text,
				emoji: '', // We could map this too if needed
			},
			temperature: {
				clouds: current.cloud_cover,
				humidity: current.relative_humidity_2m,
				pressure: current.surface_pressure,
				temp: current.temperature_2m,
				temp_description: `Feels like ${current.apparent_temperature}°`,
				temp_max: daily.temperature_2m_max[0],
				temp_min: daily.temperature_2m_min[0],
				wind_speed: current.wind_speed_10m,
				wind_deg: current.wind_direction_10m,
				wind_gus: 0,
			},
			airPollution: {
				aqi: 0,
				components: {},
			},
		},
		forecast: daily.time.map((time: string, index: number) => {
			const forecastInfo = WMO_CODE_MAP[daily.weather_code[index]] || {
				text: 'Unknown',
				icon: '01',
			}
			return {
				temp: Math.round(
					(daily.temperature_2m_max[index] + daily.temperature_2m_min[index]) / 2
				),
				icon: getIconUrl(forecastInfo.icon, true),
				date: time,
				description: forecastInfo.text,
			}
		}),
	}

	return fetchedWeather
}
