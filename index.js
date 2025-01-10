import { fengari } from 'fengari';
import { to_luastring } from 'fengari/src/fengaricore.js';
import { lua } from 'fengari/src/lua.js';
import { lauxlib } from 'fengari/src/lauxlib.js';
import { lualib } from 'fengari/src/lualib.js';
import fs from 'fs/promises';
import path from 'path';

function main() {
  console.log('Koreader Importer plugin loaded');

  // Get the UI elements
  const defaultFolderInput = document.getElementById('defaultFolder');
  const importButton = document.getElementById('importButton');

  // Load the saved default folder from local storage
  const savedDefaultFolder = localStorage.getItem('koreaderDefaultFolder');
  if (savedDefaultFolder) {
    defaultFolderInput.value = savedDefaultFolder;
  }

  // Handle the import button click
  importButton.addEventListener('click', async () => {
    const defaultFolder = defaultFolderInput.value;

    // Save the default folder to local storage
    localStorage.setItem('koreaderDefaultFolder', defaultFolder);

    console.log(`Importing annotations from: ${defaultFolder}`);

    if (!defaultFolder) {
      logseq.App.showMsg('Please specify the default Koreader annotation folder.', 'error');
      return;
    }

    try {
      // Fetch the annotation files from the default folder
      const annotationFiles = await fetchAnnotationFiles(defaultFolder);

      if (annotationFiles.length === 0) {
        logseq.App.showMsg('No Koreader annotation files found in the specified folder.', 'warning');
        return;
      }

      // Parse the annotation files
      const annotations = await parseAnnotationFiles(annotationFiles);

      // TODO: Convert the parsed data to Logseq format
      // TODO: Send the data to Logseq via the API

      logseq.App.showMsg(`Successfully imported ${annotations.length} annotations.`, 'success');
    } catch (error) {
      logseq.App.showMsg(`Error importing annotations: ${error.message}`, 'error');
    }
  });
}

async function fetchAnnotationFiles(folderPath) {
  try {
    const files = await fs.readdir(folderPath);
    const luaFiles = files.filter(file => path.extname(file) === '.lua');

    const filePromises = luaFiles.map(async file => {
      const filePath = path.join(folderPath, file);
      const content = await fs.readFile(filePath, 'utf-8');
      return { path: filePath, content };
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

  const luaCode = to_luastring(content);
  const status = lauxlib.luaL_dostring(L, luaCode);

  if (status !== lua.LUA_OK) {
    const errorMsg = fengari.lua_tojsstring(L, -1);
    throw new Error(`Lua parsing error: ${errorMsg}`);
  }

  const annotations = [];
  const returnedTable = fengari.lua_getglobal(L, to_luastring('annotations'));

  if (!fengari.lua_istable(L, -1)) {
    // Try getting the table from the return value of luaL_dostring
    fengari.lua_pop(L, 1); // Remove the global 'annotations' from the stack
    fengari.lua_pushvalue(L, -1); // Duplicate the top of the stack (result of luaL_dostring)
  }

  if (fengari.lua_istable(L, -1)) {
    const annotationsTableRef = fengari.luaL_ref(L, lua.LUA_REGISTRYINDEX); // Create a reference to the table
    fengari.lua_rawgeti(L, lua.LUA_REGISTRYINDEX, annotationsTableRef); // Push the table onto the stack using the reference

    fengari.lua_pushnil(L);
    while (fengari.lua_next(L, -2) !== 0) {
      const annotation = {};
      fengari.lua_pushnil(L);
      while (fengari.lua_next(L, -2) !== 0) {
        const key = fengari.lua_tojsstring(L, -2);
        const value = fengari.lua_tojsstring(L, -1);
        annotation[key] = value;
        fengari.lua_pop(L, 1);
      }
      annotations.push(annotation);
      fengari.lua_pop(L, 1);
    }

    fengari.luaL_unref(L, lua.LUA_REGISTRYINDEX, annotationsTableRef); // Unreference the table
  }

  return annotations;
}

// Register the plugin
logseq.ready(main).catch(console.error);