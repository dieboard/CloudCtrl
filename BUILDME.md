# CloudCtrl Build-Me Guide

This document provides a step-by-step guide to building the CloudCtrl application from scratch using a series of prompts. You can use these prompts with an AI assistant or as a guide for your own development.

---

### **Step 1: Project Setup and Basic HTML Structure**

This initial step lays the foundation of the web page.

**Prompt for this step:**
"Create an HTML file named `index.html`. Set up the basic structure with a `<head>` and `<body>`. In the head, include:
1.  Meta tags for charset and viewport.
2.  A title: 'CloudCtrl'.
3.  CDN links for Tailwind CSS, Chart.js, and the Chart.js zoom plugin.
4.  Links to Google Fonts for the 'Inter' font family.
5.  A `<style>` block for some basic custom styles: a loader animation, styling for range input thumbs, and styling for a toggle switch."

---

### **Step 2: Building the User Interface (UI) with HTML and Tailwind CSS**

This step focuses on creating the visual layout and all the interactive elements of the application.

**Prompt for this step:**
"Using Tailwind CSS classes, build the UI inside the `<body>` of `index.html`. The layout should be a single card on a dark background. The card should contain the following elements:
1.  **Header:** A title 'CloudCtrl', a paragraph for the location (e.g., 'Requesting location...'), and a status indicator.
2.  **Search Form:** An input field to search for a location and a 'Search' button.
3.  **Forecast Summary:** A text area to display a human-readable summary of the forecast.
4.  **View Toggle:** Two buttons, 'Detail (6h)' and 'Overview (24h)'.
5.  **Chart Area:** A `<canvas>` element for the chart and a `<div>` for a loading spinner.
6.  **Filter Controls:**
    *   A toggle switch for 'Filter Mode' vs. 'Overlay Mode'.
    *   Two range sliders: one for 'Min. amount (mm/u)' and one for 'Min. probability (%)', each with labels to display their current value."

---

### **Step 3: Initializing the Application with JavaScript**

This step adds the initial JavaScript logic to make the page dynamic.

**Prompt for this step:**
"Add a `<script>` tag at the end of the `<body>`. Inside it, write the initial JavaScript to:
1.  **Cache DOM Elements:** Create an object to hold references to all the important DOM elements (the chart canvas, buttons, sliders, etc.).
2.  **Global State:** Declare variables to hold the chart instance, the fetched weather data, the current view ('detail' or 'overview'), and the user's current location (latitude/longitude).
3.  **`DOMContentLoaded` Event Listener:** When the page loads, it should:
    *   Check for the browser's geolocation capabilities.
    *   If available, call `navigator.geolocation.getCurrentPosition()` to get the user's location. Define two callback functions: `onGeoSuccess` and `onGeoError`.
    *   If geolocation fails or is unavailable, default to a fallback location (e.g., 'Utrecht').
    *   Attach event listeners to the search form, view toggle buttons, and sliders."

---

### **Step 4: Fetching and Displaying Weather Data**

This step implements the core functionality of fetching data from the Open-Meteo API and displaying it.

**Prompt for this step:**
"Implement the API logic in the script.
1.  **`geocodeAndFetchWeather(locationName)` function:**
    *   Takes a location name as input.
    *   Uses the Open-Meteo Geocoding API to find the latitude and longitude.
    *   Updates the location display with the found city name.
    *   Calls `fetchWeatherData` with the coordinates.
2.  **`fetchWeatherData(latitude, longitude)` function:**
    *   Takes latitude and longitude.
    *   Constructs the URL for the Open-Meteo Forecast API, requesting hourly and 15-minutely precipitation, probability, temperature, and weather code.
    *   Fetches the data and stores it in the `fullWeatherData` global variable.
    *   Calls a new function, `updateChartView()`, to trigger a chart render.
3.  **`updateChartView()` and `processAndDisplayChart()` functions:**
    *   `updateChartView` should select the correct data (hourly or 15-minutely) based on the `currentView` state.
    *   `processAndDisplayChart` should take the data, destroy any existing chart, and create a new Chart.js bar chart showing precipitation amount over time."

---

### **Step 5: Implementing the Core Filtering Logic**

This step adds the app's signature feature: the double-threshold filter.

**Prompt for this step:**
"Enhance the charting logic to implement the 'Filter Mode'.
1.  In the `processAndDisplayChart` function, check if the filter toggle is active.
2.  If it is, read the current values from the 'amount' and 'probability' sliders.
3.  Before rendering the chart, process the weather data: create a new array for the chart's dataset where precipitation is set to 0 unless it meets **both** the minimum amount and minimum probability thresholds.
4.  Use Chart.js's ability to set different colors for each data point. Make the bar color's opacity dependent on the precipitation probability (higher probability = more opaque color).
5.  Update the slider event listeners to call `updateChartView()` whenever they are moved."

---

### **Step 6: Adding Advanced Features and UI Polish**

This step adds the remaining functionality to make the app complete and more user-friendly.

**Prompt for this step:**
"Implement the following features:
1.  **Overlay Mode:** In `processAndDisplayChart`, if the filter toggle is off, implement the 'Overlay Mode'. The chart should show two datasets: one for the raw precipitation amount ('Potential') and another for the 'Expected' amount (calculated as `amount * probability / 100`).
2.  **View Switching:** Implement the `switchView(view)` function. It should update the `currentView` state, change the styling of the 'Detail'/'Overview' buttons, and call `updateChartView()` to re-render the chart with the appropriate data resolution (15-minutely or hourly).
3.  **Forecast Summary:** Create a `createForecastSummary()` function. It should analyze the upcoming forecast based on the filter settings and generate a human-readable string like 'It will remain dry' or 'Rain is expected around 10:00'.
4.  **UI Polish:** Add a loading spinner that shows while fetching data and a refresh button to re-fetch data for the current location."

---

### **Step 7: Adding Internationalization (i18n)**

This final step makes the application accessible to a broader audience by adding multi-language support.

**Prompt for this step:**
"Refactor the UI text to support both English and Dutch.
1.  Create a `translations` object with `en` and `nl` keys. Inside each, store all UI strings (e.g., 'Search', 'Loading...', 'Min. amount:'). For dynamic strings, use functions.
2.  Detect the user's browser language to set the default language.
3.  Create a helper function `t(key, ...args)` that retrieves the correct string from the `translations` object.
4.  Create an `applyTranslations()` function that is called on page load to set all the initial text content.
5.  Replace all hardcoded strings in the HTML and JavaScript with calls to `applyTranslations()` or the `t()` function."

---

### **Step 8: Creating the README file**

This step is to create a `README.md` file for the project.

**Prompt for this step:**
"Create a `README.md` file for the project. The file should include:
- A title 'CloudCtrl'.
- Badges for version and license.
- A screenshot of the application.
- Sections for: Concept, Features, Tech Stack, How to Use, and License."
