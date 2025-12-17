*** Settings ***
Library    Browser
Library    RequestsLibrary
Library    Collections
Library    String

*** Variables ***
${BASE_URL}     https://api.open-meteo.com/v1
${APP_URL}      file://${CURDIR}/index.html

*** Test Cases ***
CloudCtrl Hybrid Test
    [Documentation]    E2E test combining API verification and Frontend visualization check.

    # --- DEEL 1: UI SETUP & LOCATIE BEPALING ---
    New Browser    chromium    headless=True
    New Context    viewport={'width': 1280, 'height': 720}
    New Page       ${APP_URL}

    # Zoek naar Amsterdam om de app in een bekende staat te krijgen
    Type Text      id=locationInput    Amsterdam
    Click          id=searchButton

    # Wacht tot de locatie details gevuld zijn.
    # Dit is een robuustere check dan wachten op 'Laden...' tekst die taalafhankelijk is.
    Wait For Condition    Text    id=locationDetails    contains    :
    Wait For Elements State    id=rainChart    visible

    # Haal de exacte coordinaten op die de UI gebruikt
    ${location_details}=    Get Text    id=locationDetails
    Log    UI Location Details: ${location_details}

    # De tekst format is "Label: 52.1234, 4.1234 | ..."
    # Regex die werkt voor zowel "Coördinaten" als "Coordinates" door te kijken naar de dubbele punt en komma.
    ${matches}=    Get Regexp Matches    ${location_details}    :\\s*([0-9.]+),\\s*([0-9.]+)    1    2

    # matches[0] is de eerste match group (hele set), daarin zitten de subgroups.
    # Get Regexp Matches retourneert een lijst van matches. Elke match is een tuple/lijst van groups als er groups zijn.
    # Als er 1 match is: matches = [('52.37', '4.90')]

    ${lat}=    Set Variable    ${matches}[0][0]
    ${lon}=    Set Variable    ${matches}[0][1]

    Log    Gebruikte Lat: ${lat}, Lon: ${lon}

    # --- DEEL 2: API VERIFICATIE (Source of Truth) ---
    Create Session    meteo    ${BASE_URL}
    ${resp}=    GET On Session    meteo    /forecast    params=latitude=${lat}&longitude=${lon}&hourly=precipitation,precipitation_probability
    Should Be Equal As Strings    ${resp.status_code}    200

    # JSON Parsing
    ${json}=    Set Variable    ${resp.json()}
    ${neerslag_lijst}=    Set Variable    ${json['hourly']['precipitation']}

    # Check data integriteit
    Should Be True    len(${neerslag_lijst}) > 0

    # Pak de neerslag van het 1e uur (index 0)
    ${api_neerslag}=    Set Variable    ${neerslag_lijst}[0]
    Log    API Neerslag (index 0): ${api_neerslag}

    # --- DEEL 3: UI DATA MATCHING (The Hack) ---
    # We halen de data op uit het Chart object in de browser
    # Browser library gebruikt 'Evaluate JavaScript' ipv 'Execute JavaScript'
    # 'let myChart' staat niet op window object, dus we gebruiken Chart.getChart()
    ${ui_data}=    Evaluate JavaScript    body    Chart.getChart('rainChart').data.datasets[0].data[0]
    ${ui_data}=    Convert To Number    ${ui_data}

    # Vergelijking
    Should Be Equal    ${ui_data}    ${api_neerslag}

    # --- DEEL 4: SLIDER INTERACTIE (Extra Challenge) ---
    # Verplaats de slider naar een waarde waarbij we zeker weten dat sommige punten transparant worden.
    # We zetten de drempelwaarde (threshold) op 0.5 (standaard is 0.1)

    # Hover en verander value (simulatie van user action kan lastig zijn met pure drag,
    # maar we kunnen value zetten en event triggeren of fill gebruiken)
    Fill Text    id=amountThresholdSlider    0.5
    # Trigger input event zodat de chart update
    Evaluate JavaScript    id=amountThresholdSlider    (e) => e.dispatchEvent(new Event('input'))

    # Wacht even op chart update (hoewel Chart.js meestal synchroon update na de call, een kleine sleep kan geen kwaad)
    Sleep    500ms

    # We checken nu of de chart kleuren correct zijn aangepast.
    # Logic in app:
    # if (amount >= amountThreshold && prob >= probThreshold) -> color blue
    # else -> color transparent (rgba(56, 189, 248, 0))

    # We moeten een datapunt vinden dat < 0.5 is (maar > 0 bij voorkeur, om te zien dat het 'verdwijnt')
    # Of we checken gewoon index 0 weer.

    ${chart_colors}=    Evaluate JavaScript    body    Chart.getChart('rainChart').data.datasets[0].backgroundColor
    ${first_color}=     Set Variable    ${chart_colors}[0]

    Log    Kleur op index 0 met threshold 0.5: ${first_color}

    # Als API neerslag < 0.5, moet de kleur transparant zijn.
    # Als API neerslag >= 0.5 (en probability hoog genoeg), moet hij blauw zijn.

    # We checken de logica:
    # Default prob threshold is 30.
    ${prob_lijst}=    Set Variable    ${json['hourly']['precipitation_probability']}
    ${api_prob}=      Set Variable    ${prob_lijst}[0]

    IF    ${api_neerslag} < 0.5 or ${api_prob} < 30
        Should Contain    ${first_color}    rgba(56, 189, 248, 0)
    ELSE
        Should Contain    ${first_color}    rgba(56, 189, 248,
        Should Not Contain    ${first_color}    rgba(56, 189, 248, 0)
    END
