# CookWise
- **Seminar:** Webtechnologien (SS26), Michael Achmann-Denkler & Clara Helmig
- **Projektmitglieder:** Andreas Baierl, Alvaro Dill, Sofia Sapronova, Tai Nguyen

## Projektbeschreibung
**CookWise** ist eine webbasierte Rezeptplattform, die Rezepte über eine externe API bereitstellt. Die Anwendung ermöglicht das Durchsuchen, Filtern und Anzeigen von Rezepten sowie das Verwalten einer Einkaufsliste und die Nutzung eines KI-Assistenten. Die Anwendung basiert auf HTML, CSS und JavaScript und setzt auf eine modulare Struktur mit wiederverwendbaren Seitenkomponenten.

Link zur gehosteten Seite: https://itsthetai.github.io/webapp_cookwise/

# Kernfunktionen
- **Rezeptübersicht**
  - Abruf aller Rezepte über eine externe API
  - Anzeige als Rezeptkarten
  - zufälliges Rezept-Karussell auf der Startseite

- **Suche und Filter**
  - Volltextsuche
  - Filter nach verschiedenen Rezeptmerkmalen
  - Dynamische Aktualisierung der Rezeptliste

- **Rezeptdetailseite:** Anzeige sämtlicher Rezeptinformationen
  - Rezeptbild
  - deskriptive Rezepinfos: Kochdauer, Länderküche, Schwierigkeit, Gerichttyp
  - Zutaten
  - Zubereitung
  - Mengenangaben
  - Möglichkeit der Rezeptfavorisierung, Hinzufügen von Zutaten zu Einkaufsliste, Hinzufügen von Rezepten zum AI-Kochplaner

- **Favoriten:** Speichern und Verwalten von Rezepten

- **Einkaufsliste:** Erstellen und Verwalten einer persönlichen Einkaufsliste

- **KI-Kochplander:** Unterstützung bei Rezeptfragen bzw. der Rezeptsuche. Der KI-Kochplaner nutzt eine externe KI-API, um Nutzeranfragen zu Rezepten und Kochthemen zu beantworten. Da für den Zugriff auf diese API ein persönlicher API-Key erforderlich ist, ist ein Feld implementiert, in dem man einen gültigen API-Key eingeben kann.

- **Dark-/Light-Mode:** Umschalten zwischen verschiedenen Designs

# Projektstruktur

Das Projekt ist in die drei Hauptordner **html**, **css** und **js** gegliedert. Für das Hosting der Anwendung über GitHub Pages befindet sich im Root-Projektverzeichnis zusätzlich eine `index.html`. Diese dient als Einstiegspunkt der Website, da GitHub Pages standardmäßig nach einer Datei mit diesem Namen sucht. Die `index.html` fungiert dabei als Weiterleitung auf die eigentliche Startseite der Anwendung (`landing.html`). Dadurch kann das Projekt ohne weitere Konfiguration über GitHub Pages bereitgestellt werden, während die eigentliche Seitenstruktur im Ordner `html/` organisiert bleibt.

## html/

Enthält sämtliche Seiten der Webanwendung.

Beispiele:
- `landing.html` – Startseite
- `favoriten.html`
- `shoppinglist.html`
- `rezeptkarte_2.html`
- `ai_assistant.html`

Zusätzlich befindet sich hier der Ordner
```
html/components/
```

Dieser enthält wiederverwendbare HTML-Komponenten:
- `navbar_api.html`
- `carousel.html`
- `recipes_api.html`

Diese Komponenten werden dynamisch in die Seiten eingebunden und müssen daher nicht mehrfach gepflegt werden.

## css/
Enthält sämtliche Stylesheets.
Beispiele:
- `style.css` – allgemeines Layout
- `shoppinglist.css`
- `rezeptkarte.css`
- `ai.css`

Durch die Aufteilung können seitenübergreifende und seitenbezogene Styles getrennt verwaltet werden.

## js/
Enthält die gesamte Anwendungslogik.
Wichtige Dateien:
- `load_components.js`
- `recipe_card.js`
- `shoppinglist.js`
- `toggle_theme.js`
- `ai_logic.js`

Zusätzlich existiert der Unterordner
```
js/api/
```
mit allen Modulen für die Kommunikation mit der Rezept-API.
Beispiele:
- `api_access.js`
- `api_navbar.js`
- `api_filter_search.js`
- `api_carousel.js`
- `api_landing.js`
- `api_rezeptkarte.js`


# Dynamische Einbindung von Seitenkomponenten
Um redundanten HTML-Code zu vermeiden, verwendet CookWise wiederverwendbare Komponenten.
Die Datei
```
js/load_components.js
```

stellt hierfür die Funktion

```javascript
includeHTML(selector, file)
```

bereit.

Diese lädt HTML-Dateien per `fetch()` und fügt sie an der gewünschten Stelle in das DOM ein.

Beispielsweise werden beim Laden einer Seite automatisch folgende Komponenten eingebunden:

- Navigation (`navbar_api.html`)
- Rezept-Karussell (`carousel.html`)
- Rezeptübersicht (`recipes_api.html`)

Dadurch muss beispielsweise die Navigation nur einmal gepflegt werden und steht auf allen Seiten in derselben Version zur Verfügung.

# Seitenübergreifende API-Einbindung
Die Kommunikation mit der Rezeptdatenbank erfolgt zentral über JavaScript.
Die Datei

```
js/api/api_access.js
```

bildet den Einstiegspunkt für den API-Zugriff.

Sie
- verbindet sich mit der API,
- lädt sämtliche Rezeptseiten,
- führt alle Ergebnisse in einer gemeinsamen Datenstruktur zusammen,
- stellt diese anschließend den übrigen Komponenten zur Verfügung.

Nach dem vollständigen Laden werden automatisch
- die Rezeptübersicht erzeugt,
- Such- und Filteroptionen aufgebaut,
- das Karussell mit zufälligen Rezepten aktualisiert.

Weitere API-Module übernehmen spezielle Aufgaben, beispielsweise:
- Darstellung der Navigation
- Filterlogik
- Rezeptkarten
- Startseiteninhalte

Dadurch bleibt der API-Code modular aufgebaut und einzelne Funktionen können unabhängig voneinander erweitert oder angepasst werden.
