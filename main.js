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

  ipcMain.handle('import-annotations', async (event, folderPath) => {
    try {
      // Fetch the annotation files from the default folder
      const annotationFiles = await fetchAnnotationFiles(folderPath);

      if (annotationFiles.length === 0) {
        return { success: false, message: 'No Koreader annotation files found in the specified folder.' };
      }

      // Parse the annotation files
      const annotations = await parseAnnotationFiles(annotationFiles);

      // Convert the parsed data to Markdown
      const markdownOutput = convertToMarkdown(annotations);

      // Save the Markdown output to a file
      const outputPath = await saveMarkdownOutput(markdownOutput, folderPath, annotations.length > 0 ? annotations[0].book : 'koreader-annotations');

      return { success: true, message: `Successfully imported ${annotations.length} annotations and saved to ${outputPath}.`, annotations };
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
    const luaFiles = files.filter(file => path.extname(file) === '.lua');

    const filePromises = luaFiles.map(async file => {
      const filePath = path.join(folderPath, file);
      const content = await fs.readFile(filePath, 'utf-8');
      let bookTitle = '';
      const firstLine = content.split('\n')[0];
      if (firstLine) {
        const match = firstLine.match(/.*\/(.*)\.sdr\/.*/);
        if (match) {
          bookTitle = match[1];
        }
      }
      return { path: filePath, content, bookTitle };
    });

    return Promise.all(filePromises);
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

async function saveMarkdownOutput(markdownOutput, folderPath, bookTitle) {
  const outputPath = path.join(folderPath, `${bookTitle.replace(/[^a-z0-9]/gi, '_')}.md`);
  await fs.writeFile(outputPath, markdownOutput, 'utf-8');
  return outputPath;
}