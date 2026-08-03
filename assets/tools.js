const Tools = {
  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024, sizes = ['B','KB','MB','GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  },

  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  readAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  },

  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  downloadDataURL(dataURL, filename) {
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  setupDropZone(element, onFile) {
    ['dragenter','dragover'].forEach(e => element.addEventListener(e, ev => {
      ev.preventDefault();
      element.classList.add('dragover');
    }));
    ['dragleave','drop'].forEach(e => element.addEventListener(e, ev => {
      ev.preventDefault();
      element.classList.remove('dragover');
    }));
    element.addEventListener('drop', ev => {
      const file = ev.dataTransfer.files[0];
      if (file) onFile(file);
    });
    element.addEventListener('click', () => {
      const input = element.querySelector('input[type="file"]');
      if (input) input.click();
    });
  },

  showPreview(area) {
    area.style.display = 'block';
  },

  showControls(area) {
    area.style.display = 'block';
  },

  setStatus(el, msg, type) {
    el.style.display = 'block';
    el.textContent = msg;
    el.className = 'status ' + (type || '');
  }
};