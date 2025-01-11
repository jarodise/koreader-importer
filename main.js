const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const fengari = require('fengari');
const lua = fengari.lua;
const lauxlib = fengari.lauxlib;
const lualib = fengari.lualib;
const { marked } = require('marked');

let config = {
  annotationFolderPath: "",
  outputFolderPath: ""
};

try {
  const configData = fs.readFileSync(path.join(__dirname, 'config.json'));
  config = JSON.parse(configData);
} catch (error) {
  console.error('Error reading or parsing config.json:', error);
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  ipcMain.handle('select-directory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    if (canceled) {
      return;
    } else {
      return filePaths[0];
    }
  });

  ipcMain.handle('import-annotations', async (event, folderPath, outputPath) => {
    const annotationFolderPath = folderPath || config.annotationFolderPath;
    const outputFolderPath = outputPath || config.outputFolderPath;

    try {
      // Fetch the annotation files from the default folder
      const annotationFiles = await fetchAnnotationFiles(annotationFolderPath);

      if (annotationFiles.length === 0) {
        return { success: false, message: 'No Koreader annotation files found in the specified folder.' };
      }

      let allAnnotations = [];
      for (const file of annotationFiles) {
          // Parse the annotation files
          const annotations = await parseAnnotationFiles([file]);

          // Convert the parsed data to Markdown
          const markdownOutput = convertToMarkdown(annotations);

          // Save the Markdown output to a file
          const finalOutputPath = await saveMarkdownOutput(markdownOutput, outputFolderPath, file.bookTitle);
          allAnnotations.push({book: file.bookTitle, path: finalOutputPath})
      }


      return { success: true, message: `Successfully imported annotations and saved to ${allAnnotations.map(item => `${item.book}: ${item.path}`).join(', ')}.`, annotations: allAnnotations };
    } catch (error) {
      return { success: false, message: `Error importing annotations: ${error.message}` };
    }
  });

  ipcMain.handle('save-settings', async (event, settings) => {
    try {
      const updatedSettings = { ...config, ...settings };
      await fs.promises.writeFile(path.join(__dirname, 'config.json'), JSON.stringify(updatedSettings, null, 2));
      config = updatedSettings;
      return { success: true };
    } catch (error) {
      console.error('Error saving settings:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('load-settings', async () => {
    return config;
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

async function fetchAnnotationFiles(folderPath) {
    try {
        const files = await fs.promises.readdir(folderPath);
        const annotationFiles = [];

        for (const file of files) {
            const filePath = path.join(folderPath, file);
            const stat = await fs.promises.stat(filePath);
            let bookTitle = '';

            if (stat.isDirectory() && file.endsWith('.sdr')) {
                bookTitle = file.replace(/\.sdr$/, '');
                const luaFiles = await fs.promises.readdir(filePath);
                for (const luaFile of luaFiles) {
                    if (luaFile === 'metadata.epub.lua' || luaFile === 'metadata.pdf.lua') {
                        const luaFilePath = path.join(filePath, luaFile);
                        const content = await fs.promises.readFile(luaFilePath, 'utf-8');
                        annotationFiles.push({ path: luaFilePath, content, bookTitle });
                    }
                }
            }
        }
        return annotationFiles;
    } catch (error) {
        throw new Error(`Error fetching annotation files: ${error.message}`);
    }
}


async function parseAnnotationFiles(files) {
  const annotations = [];
  for (const file of files) {
    try {
      const parsedAnnotations = parseAnnotationFile(file.content);
       if (parsedAnnotations.length > 0) {
        parsedAnnotations[0].book = file.bookTitle;
      }
      annotations.push(...parsedAnnotations);
    } catch (error) {
      console.error(`Error parsing annotation file ${file.path}: ${error.message}`);
    }
  }
  return annotations;
}

function parseAnnotationFile(content) {
  const L = lauxlib.luaL_newstate();
  lualib.luaL_openlibs(L);

  const status = lauxlib.luaL_dostring(L, fengari.to_luastring(content));

  if (status !== lua.LUA_OK) {
    const errorMsg = lua.lua_tojsstring(L, -1);
    throw new Error(`Lua parsing error: ${errorMsg}`);
  }

  // Get the returned table from the stack
  if (!lua.lua_istable(L, -1)) {
    throw new Error('Invalid annotation file format: Root is not a table.');
  }

  // Get the 'annotations' table from the returned table
  lua.lua_getfield(L, -1, fengari.to_luastring('annotations'));
  if (!lua.lua_istable(L, -1)) {
    throw new Error('Invalid annotation file format: "annotations" table not found.');
  }

  const annotations = [];
  let bookTitle = '';
  lua.lua_pushnil(L);
  while (lua.lua_next(L, -2) !== 0) {
    const annotation = {};
    let timestamp = '';

    lua.lua_pushnil(L);
    while (lua.lua_next(L, -2) !== 0) {
      const key = lua.lua_tojsstring(L, -2);
      const value = lua.lua_tojsstring(L, -1);
      annotation[key] = value;
      if (key === 'book') {
        bookTitle = value;
      }
      if (key === 'datetime') {
        timestamp = value;
      }
      lua.lua_pop(L, 1);
    }
    annotation.timestamp = timestamp;
    annotations.push(annotation);
    lua.lua_pop(L, 1);
  }

  // Add the book title to the first annotation
  if (annotations.length > 0) {
    annotations[0].book = bookTitle;
  }

  return annotations;
}

function convertToMarkdown(annotations) {
  let markdownOutput = '';
  for (const annotation of annotations) {
    const timestamp = annotation.timestamp ? `[[${new Date(annotation.timestamp).toISOString().slice(0, 10)}]]` : '';
    markdownOutput += `- ${annotation.text} ${timestamp}\n`;
    if (annotation.note) {
      markdownOutput += `  ${annotation.note}\n`;
    }
    markdownOutput += '\n';
  }
  return markdownOutput;
}

async function saveMarkdownOutput(markdownOutput, outputPath, bookTitle) {
  const finalOutputPath = path.join(outputPath, `${bookTitle.replace(/[^a-zA-Z0-9\u4E00-\u9FFF]/g, '_')}.md`);
  await fs.promises.writeFile(finalOutputPath, markdownOutput, 'utf-8');
  return finalOutputPath;
}

function parseMarkdownAnnotations(markdown) {
    const tokens = marked.lexer(markdown);
    const annotations = [];
    let currentAnnotation = null;
    for (const token of tokens) {
        if (token.type === 'list_item_start') {
            currentAnnotation = { text: '', note: '' };
        } else if (token.type === 'text' && currentAnnotation) {
            currentAnnotation.text = token.text;
        } else if (token.type === 'space' && currentAnnotation) {
            // ignore
        } else if (token.type === 'paragraph' && currentAnnotation) {
            currentAnnotation.note = token.text;
            annotations.push(currentAnnotation);
            currentAnnotation = null;
        } else if (token.type === 'list_item_end') {
            if (currentAnnotation) {
                annotations.push(currentAnnotation);
                currentAnnotation = null;
            }
        }
    }
    return annotations;
}

function mergeAnnotations(existingAnnotations, newAnnotations) {
    const mergedAnnotations = [...existingAnnotations];
    for (const newAnnotation of newAnnotations) {
        const existingAnnotation = mergedAnnotations.find(annotation => annotation.text === newAnnotation.text);
        if (!existingAnnotation) {
            mergedAnnotations.push(newAnnotation);
        }
    }
    return mergedAnnotations;
}

function convertAnnotationsToMarkdown(annotations) {
    let markdownOutput = '';
    for (const annotation of annotations) {
        markdownOutput += `- ${annotation.text}\n`;
        if (annotation.note) {
            markdownOutput += `  ${annotation.note}\n`;
        }
        markdownOutput += '\n';
    }
    return markdownOutput;
}