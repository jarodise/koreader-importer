const { createApp, ref } = Vue;

createApp({
  setup() {
    const folderPath = ref('');
    const outputPath = ref('');
    const importResult = ref(null);

    const handleSelectDirectory = async () => {
      console.log('select directory clicked');
      const path = await window.electronAPI.selectDirectory();
      console.log('selected path:', path);
      if (path) {
        folderPath.value = path;
      }
    };

    const handleSelectOutputDirectory = async () => {
        console.log('select output directory clicked');
        const path = await window.electronAPI.selectDirectory();
        console.log('selected output path:', path);
        if (path) {
          outputPath.value = path;
        }
      };

    const handleImportAnnotations = async () => {
      if (!folderPath.value) {
        importResult.value = { success: false, message: 'Please select a directory first.' };
        return;
      }
      if (!outputPath.value) {
        importResult.value = { success: false, message: 'Please select an output directory first.' };
        return;
      }
      const result = await window.electronAPI.importAnnotations(folderPath.value, outputPath.value);
      importResult.value = result;
    };

    const handleSetDefaultDirectory = async () => {
      try {
        await window.electronAPI.saveSettings({ annotationFolderPath: folderPath.value });
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    };

    const handleSetDefaultOutputDirectory = async () => {
      try {
        await window.electronAPI.saveSettings({ outputFolderPath: outputPath.value });
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    };

     const handleLoadSettings = async () => {
      try {
        const loadedSettings = await window.electronAPI.loadSettings();
         if (loadedSettings.annotationFolderPath) {
          folderPath.value = loadedSettings.annotationFolderPath;
        }
        if (loadedSettings.outputFolderPath) {
          outputPath.value = loadedSettings.outputFolderPath;
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    handleLoadSettings();

    return {
      folderPath,
      outputPath,
      importResult,
      handleSelectDirectory,
      handleSelectOutputDirectory,
      handleImportAnnotations,
      handleSetDefaultDirectory,
      handleSetDefaultOutputDirectory,
      handleLoadSettings
    };
  },
  template: `
    <div style="padding: 20px;">
      <h1>Koreader Importer</h1>
      <div style="margin-bottom: 20px;">
        <label htmlFor="folderPath" style="display: block; margin-bottom: 5px;">
          Koreader Annotation Folder:
        </label>
        <div style="display: flex; align-items: center;">
          <input
            type="text"
            id="folderPath"
            v-model="folderPath"
            style="padding: 10px; width: 400px; margin-bottom: 10px;"
            placeholder="Enter folder path"
          />
          <button @click="handleSelectDirectory" style="padding: 10px; margin-left: 10px; margin-right: 10px;">
            Select Directory
          </button>
          <button @click="handleSetDefaultDirectory" style="padding: 10px;">
            Set as Default
          </button>
        </div>
      </div>
      <div style="margin-bottom: 20px;">
        <label htmlFor="outputPath" style="display: block; margin-bottom: 5px;">
          Output Folder:
        </label>
        <div style="display: flex; align-items: center;">
          <input
            type="text"
            id="outputPath"
            v-model="outputPath"
            style="padding: 10px; width: 400px; margin-bottom: 10px;"
            placeholder="Enter output path"
          />
          <button @click="handleSelectOutputDirectory" style="padding: 10px; margin-left: 10px; margin-right: 10px;">
            Select Output Directory
          </button>
           <button @click="handleSetDefaultOutputDirectory" style="padding: 10px;">
            Set as Default
          </button>
        </div>
      </div>
      <button @click="handleImportAnnotations" :disabled="!folderPath || !outputPath" style="padding: 10px;">
        Import Annotations
      </button>
      <div v-if="importResult" style="margin-top: 20px;">
        <p :style="{ color: importResult.success ? 'green' : 'red' }">
          {{ importResult.message }}
        </p>
        <ul v-if="importResult.annotations" style="list-style-type: none; padding: 0;">
          <li v-for="(annotation, index) in importResult.annotations" :key="index" style="border: 1px solid #ccc; padding: 10px; margin-bottom: 10px;">
            <p><strong>Text:</strong> {{ annotation.text }}</p>
            <p v-if="annotation.note"><strong>Note:</strong> {{ annotation.note }}</p>
          </li>
        </ul>
      </div>
    </div>
  `
}).mount('#app');