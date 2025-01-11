## Key Components and Their Interactions

-   **Annotation Fetcher (Main Process)**: Responsible for fetching Koreader annotation files from a user-specified directory. It recursively searches for `.sdr` directories and then looks for `metadata.epub.lua` or `metadata.pdf.lua` files within those directories. It extracts the book title from the name of the `.sdr` directory and associates it with each annotation file. It interacts with the **Annotation Parser** to process the files. This component runs in the main process of the Electron application.
-   **Annotation Parser (Main Process)**: Parses the Lua table structure of Koreader annotation files and extracts relevant information (e.g., highlighted text, notes, timestamps, location). It interacts with the **Data Converter** to transform the parsed data. This component runs in the main process of the Electron application.
-   **Data Converter (Main Process)**: Converts the parsed annotation data into various output formats (e.g., Markdown, JSON, CSV) based on user preferences. It interacts with the **Output Generator**. This component runs in the main process of the Electron application.
-   **Output Generator (Main Process)**: Generates the final output files in the chosen format and saves them to the user-specified location. This component runs in the main process of the Electron application.
-   **User Interface (Renderer Process)**: Provides a user-friendly way to configure import settings, select the annotation directory, choose the output format, and trigger the import process. It interacts with the **Annotation Fetcher** and **Output Generator** through inter-process communication (IPC). This component runs in the renderer process of the Electron application.

## Data Flow

1.  The user specifies the Koreader annotation directory and the output directory through the UI (Renderer Process).
2.  The user initiates the import process through the UI (Renderer Process).
3.  The UI sends a message to the Main Process to start the import, including the annotation directory and the output directory.
4.  The **Annotation Fetcher** (Main Process) recursively searches for `.sdr` directories within the specified directory and then looks for `metadata.epub.lua` or `metadata.pdf.lua` files within those directories. It extracts the book title from the name of the `.sdr` directory and associates it with each annotation file.
5.  For each annotation file, the **Annotation Parser** (Main Process) parses the file and extracts the annotation data.
6.  The parsed data is passed to the **Data Converter** (Main Process).
7.  The **Data Converter** transforms the data into the chosen output format.
8.  The **Output Generator** (Main Process) creates the output file(s) and saves them to the specified output location, using the book title as the file name.
9.  The Main Process sends a message to the Renderer Process to notify the user of the successful import or any errors encountered.

## External Dependencies

-   A Lua parsing library (e.g., fengari): To handle the Koreader annotation file format.
-   Potentially third-party libraries for Markdown conversion or integration with other note-taking systems.

## Recent Significant Changes

-   Changed the project direction from a native macOS application to an Electron-based cross-platform application for importing Koreader annotations.
-   Removed files related to the Logseq plugin (`package.json`, `index.html`, `index.js`).
-   Updated the documentation (`projectRoadmap.md`, `currentTask.md`, `techStack.md`, `codebaseSummary.md`) to reflect the new project direction.
-   Renamed the project folder from `logseq-koreader-importer` to `koreader-importer`.
-   Added a feature to allow users to set a custom output destination for the generated markdown files.
-   Added a feature to support importing annotations from multiple books within a directory.
-   Modified the `fetchAnnotationFiles` function to extract the book title from the name of the `.sdr` directory.
-   Modified the `ipcMain.handle('import-annotations')` function to process each book's annotations separately and save them to individual files.

## User Feedback Integration and Its Impact on Development

-   User feedback indicated that a standalone application would be more suitable than a Logseq plugin due to limitations in Logseq's API regarding file system access.
-   User feedback suggested using Electron for cross-platform compatibility.
-   The project direction was changed to an Electron-based application based on this feedback.