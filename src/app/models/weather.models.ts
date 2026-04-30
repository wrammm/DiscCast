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