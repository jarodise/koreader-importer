## Project Goals

-   Develop a cross-platform desktop application to import Koreader annotations using Electron.
-   Enable users to seamlessly transfer their annotations from Koreader to their preferred note-taking or knowledge management system.
-   Provide a user-friendly interface for selecting the Koreader annotations directory and customizing the import settings.

## Key Features

-   Automatically detect and parse Koreader annotation files from a user-specified directory.
-   Convert Koreader annotations into various formats (e.g., Markdown, JSON, CSV).
-   Allow users to customize the output format and structure of the imported annotations.
-   Provide options for integrating with popular note-taking and knowledge management systems (e.g., Logseq, Obsidian, Roam Research).
-   Handle potential errors gracefully (e.g., invalid annotation file, directory not found).
-   Allow users to set a custom output destination for the generated markdown files.
-   Support importing annotations from multiple books within a directory.

## Completion Criteria

-   The application can successfully import annotations from valid Koreader annotation files.
-   Imported annotations are accurately represented in the chosen output format.
-   The application handles various edge cases and potential errors.
-   The application is thoroughly tested and documented.
-   The application allows users to set a custom output destination for the generated markdown files.
-   The application supports importing annotations from multiple books within a directory.

## Progress Tracker

### Completed Tasks

-   [x] Research Koreader annotation file format.
-   [x] Determine the new project direction (Electron-based cross-platform application).
-   [x] Upload the mac app to GitHub repo as a release.

### Pending Tasks

-   [ ] Design the application architecture and data flow.
-   [ ] Choose the appropriate technologies and frameworks for Electron development.
-   [ ] Implement the annotation parsing logic.
-   [ ] Develop the core import functionality.
-   [ ] Create the user interface.
-   [ ] Implement error handling and user feedback mechanisms.
-   [ ] Test the application with various scenarios.
-   [ ] Write comprehensive documentation.
-   [ ] Implement a feature to allow users to set a custom output destination for the generated markdown files.
-   [ ] Implement a feature to support importing annotations from multiple books within a directory.

## Scalability Considerations

-   Design the application to handle large annotation files efficiently.
-   Consider potential future integrations with other e-reader platforms or file formats.
-   Ensure the codebase is modular and maintainable for future updates and feature additions.
