// Vastgelegde Open-Meteo-momentopname van Mount Emei, Sichuan.
// Opgenomen op 2026-07-14 om 20:15 lokale tijd (Asia/Shanghai).
// Actueel: 0,10 mm neerslag, WMO-code 51 (lichte motregen).
// Deze fixture is bewust statisch: tests moeten morgen hetzelfde resultaat geven.
export const emeiShanRainForecast = {
  date: '2026-07-14T20:15:00+08:00',
  maxTemp: 18.5,
  minTemp: 10.1,
  precipitationChance: 100,
  condition: 'Light drizzle',
  location: 'Mount Emei',
} as const;

