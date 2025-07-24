```sh
# CloudCtrl

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

CloudCtrl is a Proof of Concept (POC) web app that visualizes precipitation forecasts from the Open-Meteo API. Its unique feature is the ability to filter the forecast based on a **double threshold**: both the minimum amount of precipitation and the minimum probability of rain.

![Screenshot of the CloudCtrl app](https://imgur.com/yKbldK0)

---

## Table of Contents
- [Concept](#concept)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [How to Use](#how-to-use)
- [Changelog](#changelog)
- [License](#license)

## Concept

Traditional weather apps often show all predicted precipitation, which can lead to alerts for drizzle you'd barely notice. CloudCtrl aims to make forecasts more useful by letting the user define what "rain" actually means to them.

By adjusting sliders for both **amount (mm/h)** and **probability (%)**, you effectively take control of your cloud forecast, ensuring you only get alerted for weather you care about.

## Features

* **Automatic Geolocation:** Fetches the user's location on load for an instant local forecast.
* **Manual Search:** Look up any city or address to get a forecast for that specific location.
* **Interactive Chart:** A clean chart (using Chart.js) that visualizes the filtered precipitation forecast.
* **Dynamic Summary:** A human-readable summary that explains if and when rain is expected based on your custom thresholds.
* **Double Threshold Filtering:** Use sliders to adjust the minimum amount (mm/h) and probability (%) of rain to dynamically filter the chart and summary.
* **Detail & Overview Modes:** Switch between a 6-hour detailed view (per 15 min) and a 24-hour overview (per hour).
* **Dark Mode Interface:** A sleek and modern interface built with Tailwind CSS.

## Tech Stack

* **Frontend:** HTML5, Tailwind CSS, vanilla JavaScript (ES6+).
* **Visualization:** [Chart.js](https://www.chartjs.org/) for the precipitation chart.
* **APIs:**
    * **Weather Data:** [Open-Meteo Forecast API](https://open-meteo.com/)
    * **Geocoding:** [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api) & [Nominatim (OpenStreetMap)](https://nominatim.org/)

## How to Use

As this is a self-contained webpage with no build process, you can use the project locally by simply opening the `index.html` file in any modern web browser. For online deployment, a static hosting service like GitHub Pages, Netlify, or Vercel can be used.

## Changelog

* **Initial Release**
* Implementation of all core features: location detection, chart visualization, and double threshold filtering.
* User interface setup with Tailwind CSS.
* Added Detail (6h) and Overview (24h) modes.

## License

This project is released under the MIT License. See the `LICENSE` file for more details.
```