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

    return {
      folderPath,
      outputPath,
      importResult,
      handleSelectDirectory,
      handleSelectOutputDirectory,
      handleImportAnnotations
    };
  },
  template: `
    <div style="padding: 20px;">
      <h1>Koreader Importer</h1>
      <div style="margin-bottom: 20px;">
        <label htmlFor="folderPath" style="display: block; margin-bottom: 5px;">
          Koreader Annotation Folder:
        </label>
        <input
          type="text"
          id="folderPath"
          v-model="folderPath"
          style="padding: 10px; width: 400px; margin-bottom: 10px;"
          placeholder="Enter folder path"
        />
        <button @click="handleSelectDirectory" style="padding: 10px; margin-right: 10px;">
          Select Directory
        </button>
      </div>
      <div style="margin-bottom: 20px;">
        <label htmlFor="outputPath" style="display: block; margin-bottom: 5px;">
          Output Folder:
        </label>
        <input
          type="text"
          id="outputPath"
          v-model="outputPath"
          style="padding: 10px; width: 400px; margin-bottom: 10px;"
          placeholder="Enter output path"
        />
        <button @click="handleSelectOutputDirectory" style="padding: 10px; margin-right: 10px;">
          Select Output Directory
        </button>
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