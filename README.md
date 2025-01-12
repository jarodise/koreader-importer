# KOReader Importer

KOReader Importer is a desktop application designed to simplify the process of importing annotations from your KOReader device into your preferred note-taking or knowledge management system.

## How to Use

1. **Launch the App:**
    -   Open KOReader Importer from your applications menu.

2. **Select Annotation Folder:**
    -   In the "Koreader Annotation Folder" section, click the "Select Directory" button.
    -   Choose the folder containing your Koreader annotations (e.g., `/path/to/koreader/annotations`).
    -   The selected path will appear in the text field.

3. **Select Output Folder:**
    -   In the "Output Folder" section, click the "Select Output Directory" button.
    -   Choose the folder where you want to save the exported Markdown files (e.g., `/path/to/output/folder`).
    -   The selected path will appear in the text field.

4. **Import Annotations:**
    -   Click the "Import Annotations" button.
    -   The app will process the annotations and export them as Markdown files to the specified output folder. Each book's annotations will be saved in a separate file.

5. **(Optional) Set Default Paths:**
    -   If you want to save the selected input and output paths for future use, click the "Set as Default" button next to each path.
    -   The next time you open the app, these paths will be automatically filled in.

## Important Notes

-   **Annotation Location:** This app only works if your KOReader annotations are saved in the same directory as your book files within the KOReader application.
-   **File Overwriting:** Each time you import annotations, the existing Markdown files in the output directory will be overwritten. **Do not make direct changes to these files.** Instead, use block references in apps like Logseq or Obsidian to refer to the content without modifying the original files.

*Note: The "Features," "Troubleshooting," and "Contributing" sections will be updated later with accurate information.*
