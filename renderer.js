const { createApp, ref } = Vue;

createApp({
  setup() {
    const folderPath = ref('');
    const importResult = ref(null);

    const handleSelectDirectory = async () => {
      console.log('select directory clicked');
      const path = await window.electronAPI.selectDirectory();
      console.log('selected path:', path);
      if (path) {
        folderPath.value = path;
      }
    };

    const handleImportAnnotations = async () => {
      if (!folderPath.value) {
        importResult.value = { success: false, message: 'Please select a directory first.' };
        return;
      }
      const result = await window.electronAPI.importAnnotations(folderPath.value);
      importResult.value = result;
    };

    return {
      folderPath,
      importResult,
      handleSelectDirectory,
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
        <button @click="handleImportAnnotations" :disabled="!folderPath" style="padding: 10px;">
          Import Annotations
        </button>
      </div>
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