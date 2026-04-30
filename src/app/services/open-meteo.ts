import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, switchMap } from 'rxjs';

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  timezone?: string;
}

export interface GeocodingResponse {
  results?: GeocodingResult[];
}

export interface OpenMeteoForecastResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  hourly: {
    time: string[];
    temperature_2m?: number[];
    apparent_temperature?: number[];
    relative_humidity_2m?: number[];
    precipitation?: number[];
    precipitation_probability?: number[];
    rain?: number[];
    showers?: number[];
    wind_speed_10m?: number[];
    wind_gusts_10m?: number[];
    wind_direction_10m?: number[];
    cloud_cover?: number[];
    uv_index?: number[];
    visibility?: number[];
    soil_moisture_0_to_1cm?: number[];
    soil_moisture_1_to_3cm?: number[];
    soil_temperature_0cm?: number[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class OpenMeteo {
  private readonly http = inject(HttpClient);

  searchLocation(query: string) {
    const params = new HttpParams()
      .set('name', query)
      .set('count', 5)
      .set('language', 'en')
      .set('format', 'json');

    return this.http
      .get<GeocodingResponse>('https://geocoding-api.open-meteo.com/v1/search', { params })
      .pipe(map(response => response.results ?? []));
  }

  getDiscGolfForecast(location: GeocodingResult) {
    const hourlyVariables = [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'precipitation',
      'precipitation_probability',
      'rain',
      'showers',
      'wind_speed_10m',
      'wind_gusts_10m',
      'wind_direction_10m',
      'cloud_cover',
      'uv_index',
      'visibility',
      'soil_moisture_0_to_1cm',
      'soil_moisture_1_to_3cm',
      'soil_temperature_0cm',
    ].join(',');

    const params = new HttpParams()
      .set('latitude', location.latitude)
      .set('longitude', location.longitude)
      .set('hourly', hourlyVariables)
      .set('temperature_unit', 'fahrenheit')
      .set('wind_speed_unit', 'mph')
      .set('precipitation_unit', 'inch')
      .set('timezone', 'auto')
      .set('forecast_days', 7)
      .set('past_days', 3);

    return this.http.get<OpenMeteoForecastResponse>(
      'https://api.open-meteo.com/v1/forecast',
      { params }
    );
  }

  searchAndForecast(query: string) {
    return this.searchLocation(query).pipe(
      map(results => {
        const first = results[0];

        if (!first) {
          throw new Error(`No location found for "${query}".`);
        }

        return first;
      }),
      switchMap(location =>
        this.getDiscGolfForecast(location).pipe(
          map(forecast => ({
            location,
            forecast,
          }))
        )
      )
    );
  }
}