import { Injectable } from '@angular/core';
import { DiscGolfWeatherSettings } from '../models/scoring-settings.model';
import { OpenMeteoForecastResponse } from './open-meteo';

export interface DiscGolfScoreBreakdown {
  totalScore: number;
  label: string;
  windScore: number;
  precipitationScore: number;
  mudScore: number;
  temperatureScore: number;
  visibilityScore: number;
  humidityScore: number;
  notes: string[];
}

@Injectable({
  providedIn: 'root',
})
export class DiscGolfScore {
  scoreCurrentConditions(
    forecast: OpenMeteoForecastResponse,
    settings: DiscGolfWeatherSettings
  ): DiscGolfScoreBreakdown {
    const hourly = forecast.hourly;
    const nowIndex = this.findClosestCurrentHourIndex(hourly.time);

    const temp = hourly.apparent_temperature?.[nowIndex] ?? hourly.temperature_2m?.[nowIndex] ?? 70;
    const humidity = hourly.relative_humidity_2m?.[nowIndex] ?? 50;
    const wind = hourly.wind_speed_10m?.[nowIndex] ?? 0;
    const gust = hourly.wind_gusts_10m?.[nowIndex] ?? wind;
    const precipProbability = hourly.precipitation_probability?.[nowIndex] ?? 0;
    const visibilityMeters = hourly.visibility?.[nowIndex] ?? 16093;
    const soilMoisture = hourly.soil_moisture_0_to_1cm?.[nowIndex]
      ?? hourly.soil_moisture_1_to_3cm?.[nowIndex]
      ?? 0.2;

    const recentRain = this.sumRecentPrecipitation(hourly, nowIndex, 72);
    const nextSixHourRain = this.sumFuturePrecipitation(hourly, nowIndex, 6);

    const windScore = this.scoreWind(wind, gust, settings);
    const precipitationScore = this.scorePrecipitation(precipProbability, nextSixHourRain, settings);
    const mudScore = this.scoreMud(recentRain, soilMoisture, settings);
    const temperatureScore = this.scoreTemperature(temp, settings);
    const visibilityScore = this.scoreVisibility(visibilityMeters, settings);
    const humidityScore = this.scoreHumidity(humidity, settings);

    const weightedTotal =
      windScore * settings.weights.wind +
      precipitationScore * settings.weights.precipitation +
      mudScore * settings.weights.mud +
      temperatureScore * settings.weights.temperature +
      visibilityScore * settings.weights.visibility +
      humidityScore * settings.weights.humidity;

    const totalWeight =
      settings.weights.wind +
      settings.weights.precipitation +
      settings.weights.mud +
      settings.weights.temperature +
      settings.weights.visibility +
      settings.weights.humidity;

    const totalScore = this.clamp(Math.round((weightedTotal / totalWeight) * 10) / 10, 1, 10);

    return {
      totalScore,
      label: this.getLabel(totalScore),
      windScore,
      precipitationScore,
      mudScore,
      temperatureScore,
      visibilityScore,
      humidityScore,
      notes: this.buildNotes({
        temp,
        humidity,
        wind,
        gust,
        precipProbability,
        nextSixHourRain,
        recentRain,
        soilMoisture,
        totalScore,
      }),
    };
  }

  private findClosestCurrentHourIndex(times: string[]): number {
    const now = Date.now();

    let bestIndex = 0;
    let bestDifference = Number.MAX_SAFE_INTEGER;

    times.forEach((time, index) => {
      const difference = Math.abs(new Date(time).getTime() - now);

      if (difference < bestDifference) {
        bestDifference = difference;
        bestIndex = index;
      }
    });

    return bestIndex;
  }

  private sumRecentPrecipitation(
    hourly: OpenMeteoForecastResponse['hourly'],
    nowIndex: number,
    hoursBack: number
  ): number {
    const precipitation = hourly.precipitation ?? [];
    const start = Math.max(0, nowIndex - hoursBack);

    return precipitation
      .slice(start, nowIndex + 1)
      .reduce((total, value) => total + (value ?? 0), 0);
  }

  private sumFuturePrecipitation(
    hourly: OpenMeteoForecastResponse['hourly'],
    nowIndex: number,
    hoursForward: number
  ): number {
    const precipitation = hourly.precipitation ?? [];
    const end = Math.min(precipitation.length, nowIndex + hoursForward + 1);

    return precipitation
      .slice(nowIndex, end)
      .reduce((total, value) => total + (value ?? 0), 0);
  }

  private scoreWind(windMph: number, gustMph: number, settings: DiscGolfWeatherSettings): number {
    const { idealWindMph, badWindMph, terribleWindMph, maxGoodGustMph, terribleGustMph } =
      settings.thresholds;

    const steadyWindScore = this.inverseLinearScore(windMph, idealWindMph, terribleWindMph);
    const gustScore = this.inverseLinearScore(gustMph, maxGoodGustMph, terribleGustMph);

    const combined = steadyWindScore * 0.65 + gustScore * 0.35;

    if (windMph >= badWindMph || gustMph >= terribleGustMph) {
      return Math.min(combined, 5);
    }

    return combined;
  }

  private scorePrecipitation(
    precipProbability: number,
    nextSixHourRain: number,
    settings: DiscGolfWeatherSettings
  ): number {
    const probabilityScore = this.inverseLinearScore(
      precipProbability,
      settings.thresholds.goodPrecipProbability,
      settings.thresholds.badPrecipProbability
    );

    const rainScore = this.inverseLinearScore(nextSixHourRain, 0, 0.25);

    return probabilityScore * 0.7 + rainScore * 0.3;
  }

  private scoreMud(
    recentRainInches: number,
    soilMoisture: number,
    settings: DiscGolfWeatherSettings
  ): number {
    const rainMudScore = this.inverseLinearScore(
      recentRainInches,
      settings.thresholds.recentRainGoodInches,
      settings.thresholds.recentRainBadInches
    );

    const soilScore = this.inverseLinearScore(
      soilMoisture,
      settings.thresholds.soilMoistureGood,
      settings.thresholds.soilMoistureBad
    );

    return rainMudScore * 0.6 + soilScore * 0.4;
  }

  private scoreTemperature(tempF: number, settings: DiscGolfWeatherSettings): number {
    const t = settings.thresholds;

    if (tempF >= t.idealTempMinF && tempF <= t.idealTempMaxF) {
      return 10;
    }

    if (tempF < t.playableTempMinF || tempF > t.playableTempMaxF) {
      return 1;
    }

    if (tempF < t.idealTempMinF) {
      return this.linearScore(tempF, t.playableTempMinF, t.idealTempMinF);
    }

    return this.inverseLinearScore(tempF, t.idealTempMaxF, t.playableTempMaxF);
  }

  private scoreVisibility(visibilityMeters: number, settings: DiscGolfWeatherSettings): number {
    const miles = visibilityMeters / 1609.344;

    return this.linearScore(
      miles,
      settings.thresholds.badVisibilityMiles,
      settings.thresholds.goodVisibilityMiles
    );
  }

  private scoreHumidity(humidity: number, settings: DiscGolfWeatherSettings): number {
    return this.inverseLinearScore(
      humidity,
      settings.thresholds.comfortableHumidityMax,
      settings.thresholds.muggyHumidity
    );
  }

  private linearScore(value: number, bad: number, good: number): number {
    if (value <= bad) return 1;
    if (value >= good) return 10;

    return 1 + ((value - bad) / (good - bad)) * 9;
  }

  private inverseLinearScore(value: number, good: number, bad: number): number {
    if (value <= good) return 10;
    if (value >= bad) return 1;

    return 10 - ((value - good) / (bad - good)) * 9;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  private getLabel(score: number): string {
    if (score >= 9) return 'Perfect disc golf weather';
    if (score >= 8) return 'Great disc golf weather';
    if (score >= 6.5) return 'Good enough to play';
    if (score >= 5) return 'Playable, but not ideal';
    if (score >= 3.5) return 'Rough conditions';
    return 'Probably skip it';
  }

  private buildNotes(values: {
    temp: number;
    humidity: number;
    wind: number;
    gust: number;
    precipProbability: number;
    nextSixHourRain: number;
    recentRain: number;
    soilMoisture: number;
    totalScore: number;
  }): string[] {
    const notes: string[] = [];

    if (values.wind >= 18) {
      notes.push(`Wind is a major factor at ${Math.round(values.wind)} mph.`);
    }

    if (values.gust >= 25) {
      notes.push(`Gusts could mess with drives and putts: ${Math.round(values.gust)} mph.`);
    }

    if (values.recentRain >= 0.5) {
      notes.push(`Recent rain may make the course muddy: ${values.recentRain.toFixed(2)} inches in the last 72 hours.`);
    }

    if (values.nextSixHourRain > 0.05 || values.precipProbability >= 50) {
      notes.push(`Rain risk is meaningful over the next few hours.`);
    }

    if (values.temp < 45) {
      notes.push(`Cold hands could affect grip and putting feel.`);
    }

    if (values.temp > 88) {
      notes.push(`Heat could make walking the course uncomfortable.`);
    }

    if (values.humidity >= 85) {
      notes.push(`High humidity may make it feel muggy and slow course drying.`);
    }

    if (!notes.length) {
      notes.push(`Conditions look pretty clean for disc golf.`);
    }

    return notes;
  }
}