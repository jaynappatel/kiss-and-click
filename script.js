const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const snapBtn = document.getElementById('snapBtn');
const statusMessage = document.getElementById('status-message');
const storageBtn = document.getElementById('storageBtn');
const storageModal = document.getElementById('storage-modal');
const closeBtn = document.querySelector('.close-btn');
const storedPhotosGrid = document.getElementById('stored-photos-grid');
const noPhotosMessage = document.getElementById('no-photos-message');

let stream = null;
let photoCount = 0;
let storedPhotos = []; // Array to store all captured photos

// Initialize camera when page loads
document.addEventListener('DOMContentLoaded', () => {
  initializeCamera();
  initializeStorage();
});

async function initializeCamera() {
  try {
    // Show loading state
    video.classList.add('loading');
    showStatus('Starting camera...', 'success');
    
    // Request camera access
    stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        width: { ideal: 640 }, 
        height: { ideal: 480 } 
      } 
    });
    
    video.srcObject = stream;
    video.classList.remove('loading');
    showStatus('Camera ready! 📸', 'success');
    
    // Enable the snap button
    snapBtn.disabled = false;
    
  } catch (error) {
    console.error('Error accessing camera:', error);
    showStatus('Camera access denied. Please check permissions.', 'error');
    
    // Show placeholder in video element
    video.style.background = '#333';
    video.style.display = 'flex';
    video.style.alignItems = 'center';
    video.style.justifyContent = 'center';
    video.innerHTML = '<span style="color: #999;">Camera not available</span>';
  }
}

// Initialize storage functionality
function initializeStorage() {
  storageBtn.addEventListener('click', () => {
    showStorageModal();
  });
  
  closeBtn.addEventListener('click', () => {
    hideStorageModal();
  });
  
  // Close modal when clicking outside
  storageModal.addEventListener('click', (e) => {
    if (e.target === storageModal) {
      hideStorageModal();
    }
  });
  
  // Close modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && storageModal.style.display === 'block') {
      hideStorageModal();
    }
  });
}

// Capture photo function
snapBtn.addEventListener('click', () => {
  if (!stream) {
    showStatus('Camera not available', 'error');
    return;
  }
  
  // Set canvas dimensions to match video
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  // Draw video frame to canvas
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  
  // Convert to image data
  const imageData = canvas.toDataURL('image/png');
  
  // Show flash effect
  showFlashEffect();
  
  // Add to stored photos array
  const photoData = {
    id: Date.now(),
    data: imageData,
    timestamp: new Date().toLocaleString()
  };
  storedPhotos.push(photoData);
  photoCount++;
  
  // Save to file system (if Electron API is available)
  if (window.electronAPI) {
    window.electronAPI.saveImage(imageData);
    showStatus('Photo saved! 📷✨', 'success');
  } else {
    showStatus('Photo captured! 📸✨', 'success');
  }
});

function showStorageModal() {
  updateStoredPhotosGrid();
  storageModal.style.display = 'block';
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function hideStorageModal() {
  storageModal.style.display = 'none';
  document.body.style.overflow = 'auto'; // Restore scrolling
}

function updateStoredPhotosGrid() {
  storedPhotosGrid.innerHTML = '';
  
  if (storedPhotos.length === 0) {
    noPhotosMessage.style.display = 'block';
    return;
  }
  
  noPhotosMessage.style.display = 'none';
  
  // Show photos in reverse order (newest first)
  storedPhotos.slice().reverse().forEach((photo, index) => {
    const photoContainer = document.createElement('div');
    photoContainer.className = 'photo-container';
    
    const img = document.createElement('img');
    img.src = photo.data;
    img.className = 'stored-photo';
    img.alt = `Photo ${storedPhotos.length - index}`;
    img.title = `Taken on ${photo.timestamp}`;
    
    // Add click handler to view full size
    img.addEventListener('click', () => {
      viewFullSizePhoto(photo.data, photo.timestamp);
    });
    
    // Create action buttons container
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'photo-actions';
    
    // Download button
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'action-btn download-btn';
    downloadBtn.innerHTML = '⬇️ Download';
    downloadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      downloadPhoto(photo.data, photo.id);
    });
    
    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-btn delete-btn';
    deleteBtn.innerHTML = '🗑️ Delete';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deletePhoto(photo.id);
    });
    
    actionsDiv.appendChild(downloadBtn);
    actionsDiv.appendChild(deleteBtn);
    
    photoContainer.appendChild(img);
    photoContainer.appendChild(actionsDiv);
    storedPhotosGrid.appendChild(photoContainer);
  });
}

function downloadPhoto(imageData, photoId) {
  const link = document.createElement('a');
  link.download = `Kiss&Click-Photo-${photoId}.png`;
  link.href = imageData;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showStatus('Photo downloaded! 💾', 'success');
}

function deletePhoto(photoId) {
  // Show confirmation
  if (confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
    // Remove from stored photos array
    storedPhotos = storedPhotos.filter(photo => photo.id !== photoId);
    
    // Update the grid
    updateStoredPhotosGrid();
    
    showStatus('Photo deleted! 🗑️', 'success');
  }
}

function viewFullSizePhoto(imageData, timestamp) {
  const newWindow = window.open('', '_blank');
  newWindow.document.write(`
    <html>
      <head>
        <title>Photo - ${timestamp}</title>
        <style>
          body {
            margin: 0;
            background: #000;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            font-family: Arial, sans-serif;
          }
          img {
            max-width: 90%;
            max-height: 90vh;
            object-fit: contain;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(255,255,255,0.1);
          }
          .info {
            position: absolute;
            top: 20px;
            left: 20px;
            color: white;
            background: rgba(0,0,0,0.7);
            padding: 10px 15px;
            border-radius: 8px;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="info">📅 ${timestamp}</div>
        <img src="${imageData}" alt="Full size photo">
      </body>
    </html>
  `);
}

function showFlashEffect() {
  const flash = document.createElement('div');
  flash.className = 'flash-effect active';
  document.body.appendChild(flash);
  
  setTimeout(() => {
    flash.classList.remove('active');
    setTimeout(() => {
      document.body.removeChild(flash);
    }, 150);
  }, 150);
}

function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `show ${type}`;
  
  setTimeout(() => {
    statusMessage.classList.remove('show');
  }, 3000);
}

// Clean up when window closes
window.addEventListener('beforeunload', () => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
});

// Handle camera permission changes
navigator.permissions.query({ name: 'camera' }).then(permission => {
  permission.addEventListener('change', () => {
    if (permission.state === 'denied') {
      showStatus('Camera permission denied', 'error');
    }
  });
});