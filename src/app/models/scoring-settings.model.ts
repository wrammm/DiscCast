export interface DiscGolfWeatherSettings {
  weights: {
    wind: number;
    precipitation: number;
    mud: number;
    temperature: number;
    visibility: number;
    humidity: number;
  };

  thresholds: {
    idealTempMinF: number;
    idealTempMaxF: number;
    playableTempMinF: number;
    playableTempMaxF: number;

    idealWindMph: number;
    badWindMph: number;
    terribleWindMph: number;

    maxGoodGustMph: number;
    terribleGustMph: number;

    goodPrecipProbability: number;
    badPrecipProbability: number;

    recentRainGoodInches: number;
    recentRainBadInches: number;

    soilMoistureGood: number;
    soilMoistureBad: number;

    goodVisibilityMiles: number;
    badVisibilityMiles: number;

    comfortableHumidityMax: number;
    muggyHumidity: number;
  };
}

export const DEFAULT_DISC_GOLF_SETTINGS: DiscGolfWeatherSettings = {
  weights: {
    wind: 35,
    precipitation: 20,
    mud: 20,
    temperature: 15,
    visibility: 5,
    humidity: 5,
  },

  thresholds: {
    idealTempMinF: 55,
    idealTempMaxF: 78,
    playableTempMinF: 35,
    playableTempMaxF: 95,

    idealWindMph: 8,
    badWindMph: 18,
    terribleWindMph: 28,

    maxGoodGustMph: 15,
    terribleGustMph: 35,

    goodPrecipProbability: 20,
    badPrecipProbability: 60,

    recentRainGoodInches: 0.15,
    recentRainBadInches: 1.0,

    soilMoistureGood: 0.25,
    soilMoistureBad: 0.45,

    goodVisibilityMiles: 8,
    badVisibilityMiles: 3,

    comfortableHumidityMax: 65,
    muggyHumidity: 85,
  },
};