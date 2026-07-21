import data from './data.js';
import { init, showLockScreen, updateDropZoneVisibility } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
  if (data.hasEncryptedData()) {
    init(data);
    showLockScreen();
    updateDropZoneVisibility();
  } else {
    init(data);
    updateDropZoneVisibility();
  }
});
