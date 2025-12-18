# Learning Tutorial: Hybrid API & E2E Testing with Robot Framework

This tutorial will guide you through using the CloudCtrl application as a playground for learning **Hybrid Testing**.

## What is Hybrid Testing?

Hybrid testing combines **API testing** (backend) and **E2E testing** (frontend/UI) in a single test case.
- **API Testing** acts as the "Source of Truth". You fetch the data directly from the provider (e.g., Open-Meteo).
- **E2E Testing** verifies the User Experience. You check if the application correctly visualizes that data.

Instead of just checking if "some bars appear on the chart", we check if "the *correct* bars appear based on the actual data".

## Prerequisites

*   **Postman** (for independent API exploration)
*   **Python 3.8+**
*   **Node.js 18+** (required for Robot Framework Browser library)

## Installation

1.  **Clone this repository** (if you haven't already).
2.  **Create a virtual environment** (recommended):
    ```bash
    python3 -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
3.  **Install Robot Framework and libraries**:
    ```bash
    pip install robotframework robotframework-browser robotframework-requests
    ```
4.  **Initialize the Browser library**:
    This downloads the necessary browser binaries (Chromium, Firefox, WebKit).
    ```bash
    rfbrowser init
    ```

## Step 1: Independent API Testing with Postman

Before diving into complex E2E tests, it's best practice to ensure the backend APIs are behaving as expected. We can use Postman for this.

1.  **Open Postman** and click **Import**.
2.  Select the file `tests/CloudCtrl.postman_collection.json` from this repository.
3.  You will see a collection named **CloudCtrl Weather APIs**.
4.  Run the requests:
    *   **Geocoding (Search for City):** Verifies that searching for "Utrecht" returns valid coordinates.
    *   **Forecast (Precipitation):** Uses the coordinates to fetch the rain forecast.

This step confirms that our "Source of Truth" (the Open-Meteo API) is available and returning the data structure we expect.

## Step 2: Automating E2E & Hybrid Flows

Now that we know the API works, we can move to the automated Hybrid Test using Robot Framework.

### Running the Application

Since CloudCtrl is a static web application, you need to serve it locally so the test automation can access it via a URL (e.g., `http://localhost:8000`).

You can use Python's built-in HTTP server:

```bash
# Run this in a separate terminal window
python3 -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000) in your browser to manually verify it's working.

### The Robot Framework Test Case

We have included a sample test in `tests/test_weather_app.robot`. Here is a breakdown of what it does:

#### 1. Fetch Source of Truth
We use `RequestsLibrary` to call the Open-Meteo API directly. This gives us the raw weather data that the app *should* be displaying.

```robot
${api_data}=    Get Weather Data From API    ${LOCATION}
```

#### 2. Drive the UI
We use `Browser` library to open the app and search for a location.

```robot
New Page    ${APP_URL}
Type Text   id=locationInput    ${LOCATION}
Click       id=searchButton
```

#### 3. Inspect Internal State (The "White-Box" Magic)
This is the key part of hybrid testing. Instead of trying to count pixels on a canvas (which is flaky), we access the internal JavaScript state of the application. The CloudCtrl app exposes its chart instance globally as `window.myChart`.

We use `Evaluate JavaScript` to extract the data directly from the chart object.

```robot
${ui_chart_data}=    Evaluate JavaScript    id=rainChart
...    (element) => window.myChart.data.datasets[0].data
```

#### 4. Verify
Finally, we compare the data from the API with the data extracted from the Chart.js instance.

### Running the Test

With your local server running in one terminal, run the test in another:

```bash
robot tests/test_weather_app.robot
```

You should see the browser open (headless by default, remove `headless=True` in the robot file to see it), perform the actions, and pass the test.

## Next Steps / Challenges

Try extending the test suite:
1.  **Verify Filtering:** Add a test that changes the sliders in the UI and asserts that the `ui_chart_data` updates correctly to filter out low precipitation values.
2.  **Overlay Mode:** Switch the toggle to "Overlay Mode" and verify that the chart displays two datasets (Potential vs Expected).
3.  **Mocking:** Use the `Browser` library's features to mock the API response. This allows you to test edge cases (e.g., a massive storm) without waiting for bad weather!

## Step 3: Advanced Mocking with Playwright

Sometimes you want to test scenarios that are hard to find in real life, like a massive storm or an API server failure. This is where **Mocking** comes in.

Instead of hitting the real Open-Meteo API, we intercept the network request within the browser and return our own custom response. This is "Advanced" because it allows for deterministic testing of edge cases.

### The Mocking Test Case (`tests/test_mocking.robot`)

This test suite demonstrates two scenarios:

1.  **Simulate Stormy Weather:** We load a JSON fixture (`tests/fixtures/weather_storm.json`) that contains fake data with very high precipitation. We tell the browser: "When you see a request for the forecast, don't go to the internet. Give back this JSON instead."
2.  **Simulate API Failure:** We tell the browser to simulate a 500 Internal Server Error, allowing us to verify the app's error handling.

### The Mocking Strategy: Monkey Patching `window.fetch`

Since we want to control exactly what the browser receives, we can use a technique called **Monkey Patching**. We replace the browser's built-in `fetch` function with our own version.

1.  **Original Fetch:** We save `window.originalFetch = window.fetch`.
2.  **Mock Fetch:** We overwrite `window.fetch` with a function that checks the URL.
3.  **Intercept:** If the URL matches our API (`v1/forecast`), we return a fake response object constructed from our JSON fixture.
4.  **Passthrough:** If it's any other URL (like OpenStreetMap), we call the original fetch so the map still loads.

This is implemented using the `Evaluate JavaScript` keyword in Robot Framework to inject the mock logic directly into the running browser page.

### Running the Test

With your local server running in one terminal, run the test in another:

```bash
robot tests/test_mocking.robot
```
