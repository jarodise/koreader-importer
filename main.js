const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const fengari = require('fengari');
const lua = fengari.lua;
const lauxlib = fengari.lauxlib;
const lualib = fengari.lualib;
const { marked } = require('marked');

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
    try {
      // Fetch the annotation files from the default folder
      const annotationFiles = await fetchAnnotationFiles(folderPath);

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
          const finalOutputPath = await saveMarkdownOutput(markdownOutput, outputPath, file.bookTitle);
          allAnnotations.push({book: file.bookTitle, path: finalOutputPath})
      }


      return { success: true, message: `Successfully imported annotations and saved to ${allAnnotations.map(item => `${item.book}: ${item.path}`).join(', ')}.`, annotations: allAnnotations };
    } catch (error) {
      return { success: false, message: `Error importing annotations: ${error.message}` };
    }
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

async function fetchAnnotationFiles(folderPath) {
    try {
        const files = await fs.readdir(folderPath);
        const annotationFiles = [];

        for (const file of files) {
            const filePath = path.join(folderPath, file);
            const stat = await fs.stat(filePath);
            let bookTitle = '';

            if (stat.isDirectory() && file.endsWith('.sdr')) {
                bookTitle = file.replace(/\.sdr$/, '');
                const luaFiles = await fs.readdir(filePath);
                for (const luaFile of luaFiles) {
                    if (luaFile === 'metadata.epub.lua' || luaFile === 'metadata.pdf.lua') {
                        const luaFilePath = path.join(filePath, luaFile);
                        const content = await fs.readFile(luaFilePath, 'utf-8');
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
  const finalOutputPath = path.join(outputPath, `${bookTitle.replace(/[^a-z0-9]/gi, '_')}.md`);
  await fs.writeFile(finalOutputPath, markdownOutput, 'utf-8');
  return finalOutputPath;
}