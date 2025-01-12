## Current Objectives

-   Address the issue with the `README.md` file, specifically the accuracy of the app usage instructions.
-   Implement a feature to support importing annotations from multiple books within a directory.
-   Implement a feature to allow users to set a custom output destination for the generated markdown files.
-   Test the application with various scenarios.
-   Write comprehensive documentation.

## Context

-   The user wants to build a cross-platform desktop application that can import Koreader annotations using Electron.
-   The project directory is located at `/Users/jarodise/Documents/GitHub/koreader-importer`.
-   The `cline_docs` folder contains the following documentation files: `projectRoadmap.md`, `techStack.md`, and `codebaseSummary.md`.
-   The Koreader annotation file format has been researched, and a sample file is available at `/Users/jarodise/Desktop/ebooks/Understanding Media/metadata.epub.lua`.
-   The previous plan to create a native macOS application has been abandoned in favor of an Electron-based application.
-   A basic Electron project structure has been created with the following files: `package.json`, `main.js`, `index.html`, `renderer.js`, and `preload.js`.
-   The annotation parsing logic has been implemented in the main process.
-   The core import functionality has been implemented, including Markdown conversion and file saving.
-   The user interface has been created, including components for selecting the annotation directory, triggering the import process, and displaying the results.
-   The markdown file is now named with the book title extracted from the first line of the .lua file.
-   The timestamp is now included in each annotation as a wiki link.
-   The user expressed concern about the accuracy of the app usage instructions in `README.md`, as they were based on assumptions rather than actual knowledge of the app's functionality.

## Next Steps

-   Address the `README.md` issue by either removing the usage instructions section entirely or working with the user to gather accurate information (referencing the "Address the issue with the `README.md` file" task in `currentTask.md`).
-   Implement a feature to support importing annotations from multiple books within a directory (referencing the "Implement a feature to support importing annotations from multiple books within a directory" task in `projectRoadmap.md`). This involves modifying the existing codebase to handle multiple book directories, identify annotation files, and process them accordingly.
-   Implement a feature to allow users to set a custom output destination for the generated markdown files (referencing the "Implement a feature to allow users to set a custom output destination for the generated markdown files" task in `projectRoadmap.md`). This involves modifying the existing codebase to handle a user-defined output path.
-   Test the application with various scenarios (referencing the "Test the application with various scenarios" task in `projectRoadmap.md`). This involves testing the application with different annotation files, directory structures, and user inputs to ensure it functions correctly and handles errors gracefully.
-   Write comprehensive documentation (referencing the "Write comprehensive documentation" task in `projectRoadmap.md`). This involves creating documentation for the application, including instructions on how to use it, explanations of its features, and any relevant technical details.
-   Always prompt the user to run the app after each change.
