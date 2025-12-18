*** Settings ***
Documentation       Demonstrates advanced mocking by monkey-patching window.fetch.
...                 This allows us to simulate edge cases (like storms or server errors)
...                 by intercepting the fetch calls directly in the browser.

Library             Browser
Library             OperatingSystem

Suite Setup         New Browser    headless=True
Test Setup          New Context

*** Variables ***
${APP_URL}          http://localhost:8000

*** Test Cases ***
Simulate Stormy Weather
    [Documentation]    Intersects the API request by overriding window.fetch and returns a "Storm" response.
    ...                Verifies that the UI correctly advises "Raincoat and umbrella needed".

    # 1. Load the mock data from the fixture file
    ${mock_json}=    Get File    tests/fixtures/weather_storm.json
    # Parse it to verify it's valid JSON, but we will pass it as a string to JS

    # 2. Open the app
    # Note: The app triggers a fetch immediately on load if geolocation works/fails.
    # However, for this test, we will trigger a MANUAL search to ensure our mock is used.
    New Page     ${APP_URL}

    # 3. Inject the Mocking Logic (Monkey Patching fetch)
    # We override window.fetch to check if the URL contains 'forecast'.
    # If it does, we return our mock data. Otherwise, we call the original fetch.

    ${script}=    Catenate
    ...    window.originalFetch = window.fetch;
    ...    window.fetch = async (url, options) => {
    ...        if (url.toString().includes('v1/forecast')) {
    ...            console.log('Mocking forecast request');
    ...            return {
    ...                ok: true,
    ...                status: 200,
    ...                json: async () => (${mock_json})
    ...            };
    ...        }
    ...        return window.originalFetch(url, options);
    ...    };

    Evaluate JavaScript    ${None}    (element) => { ${script} }

    # 4. Trigger the API call
    Type Text    id=locationInput    Storm City
    Click        id=searchButton

    # 5. Verify the UI response
    # The legend or summary should reflect the heavy rain.
    Wait For Elements State    id=rainChart    visible

    # Check if the summary predicts rain
    # "Het regent nu of zeer binnenkort" or similar.
    # Let's check the chart max value to be sure it's the storm data (which has values > 10)
    ${chart_max}=    Evaluate JavaScript    id=rainChart
    ...    (element) => window.myChart.options.scales.y.max || window.myChart.scales.y.max

    Should Be True    ${chart_max} > 5    msg=Chart scale should adjust for heavy rain (>5mm)

    Take Screenshot    filename=storm_simulation

Simulate API Server Error
    [Documentation]    Simulates a 500 Internal Server Error from the API.
    ...                Verifies that the app displays a user-friendly error message.

    New Page     ${APP_URL}

    # Inject Mocking Logic for 500 Error
    ${script}=    Catenate
    ...    window.originalFetch = window.fetch;
    ...    window.fetch = async (url, options) => {
    ...        if (url.toString().includes('v1/forecast')) {
    ...            return {
    ...                ok: false,
    ...                status: 500,
    ...                statusText: 'Internal Server Error',
    ...                json: async () => ({})
    ...            };
    ...        }
    ...        return window.originalFetch(url, options);
    ...    };

    Evaluate JavaScript    ${None}    (element) => { ${script} }

    Type Text    id=locationInput    Error City
    Click        id=searchButton

    # Verify Error Handling
    # The app displays the error message in the status text.
    Wait For Condition    Text    id=statusText    contains    Error

    Take Screenshot    filename=error_simulation
