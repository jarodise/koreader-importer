## Frameworks and Libraries

-   Electron: For building a cross-platform desktop application using web technologies.
-   Node.js: As the runtime environment for the application.
-   Vue.js: For building the user interface.
-   JavaScript: As the primary programming language.
-   HTML/CSS: For the user interface.
-   Fengari: A Lua VM for the browser, written in JavaScript, to parse the Koreader annotation files.
-   marked: A Markdown parser built for speed, to convert Markdown to HTML.

## Build Tools

-   npm: For managing project dependencies.
-   Electron Builder or similar: For packaging and distributing the application.

## Architecture

-   The application will follow a typical Electron project structure, with separate processes for the main process, renderer process, and potentially worker processes.

## Data Storage

-   The application will likely use a file-based storage mechanism (e.g., JSON files) to store user preferences and settings.

## External Dependencies

-   Fengari: For handling the Koreader annotation file format.
-   marked: For converting Markdown to HTML.

## Notes

-   The decision has been made to use Electron for building the application.
-   Vue.js will be used for the user interface.
-   Fengari will be used for parsing Lua code.
-   marked will be used for Markdown conversion.