// Coggnify X - Main Application Logic
let currentStep = 1;
let capturedImages = {};
let ownerData = {};
let horses = [];

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Coggnify X initialized');
    setupEventListeners();
    loadSavedData();
});

function setupEventListeners() {
    // Camera controls
    document.getElementById('start-camera').addEventListener('click', startCamera);
    document.getElementById('capture-front').addEventListener('click', () => captureImage('front'));
    document.getElementById('capture-back').addEventListener('click', () => captureImage('back'));
    document.getElementById('process-id').addEventListener('click', processLicense);
    
    // Forms
    document.getElementById('owner-form').addEventListener('submit', createOwnerAccount);
    document.getElementById('horse-form').addEventListener('submit', addHorse);
    
    // Verification
    document.getElementById('refresh-code').addEventListener('click', generateVerificationCode);
}

async function startCamera() {
    try {
        const video = document.getElementById('camera');
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } // Use back camera if available
        });
        
        video.srcObject = stream;
        
        // Show capture buttons
        document.getElementById('start-camera').style.display = 'none';
        document.getElementById('capture-front').style.display = 'inline-block';
        document.getElementById('capture-back').style.display = 'inline-block';
        
        console.log('Camera started successfully');
    } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Could not access camera. Please check permissions.');
    }
}

function captureImage(side) {
    const video = document.getElementById('camera');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0);
    
    // Convert to image
    const imageData = canvas.toDataURL('image/jpeg');
    capturedImages[side] = imageData;
    
    // Show preview
    const preview = document.getElementById(`${side}-preview`);
    preview.innerHTML = `
        <img src="${imageData}" alt="${side} of license">
        <p>${side === 'front' ? 'Front' : 'Back'} Captured ✓</p>
    `;
    
    // Check if both images captured
    if (capturedImages.front && capturedImages.back) {
        document.getElementById('process-id').style.display = 'inline-block';
    }
    
    console.log(`${side} image captured`);
}

function processLicense() {
    // For now, we'll simulate OCR processing
    // In production, this would use actual OCR
    
    console.log('Processing license images...');
    
    // Simulate processing delay
    document.getElementById('process-id').textContent = 'Processing...';
    
    setTimeout(() => {
        // Simulate extracted data
        const extractedData = {
            name: "JOHN DOE", // This would come from OCR
            licenseNumber: "123456789",
            state: "TX",
            address: "123 MAIN ST DALLAS TX"
        };
        
        // Pre-fill the form
        document.getElementById('owner-name').value = extractedData.name;
        document.getElementById('owner-address').value = extractedData.address;
        
        // Move to next step
        nextStep();
        
        alert('License processed successfully! Please verify the information.');
    }, 2000);
}

function createOwnerAccount(event) {
    event.preventDefault();
    
    // Get form data
    ownerData = {
        id: generateOwnerID(),
        name: document.getElementById('owner-name').value,
        phone: document.getElementById('owner-phone').value,
        address: document.getElementById('owner-address').value,
        createdAt: new Date().toISOString()
    };
    
    // Save to localStorage (in production, this would go to a database)
    localStorage.setItem('coggnify_owner', JSON.stringify(ownerData));
    
    console.log('Owner account created:', ownerData);
    
    // Move to next step
    nextStep();
}

function addHorse(event) {
    event.preventDefault();
    
    const horse = {
        id: generateHorseID(),
        name: document.getElementById('horse-form').querySelector('#horse-name').value,
        breed: document.getElementById('horse-form').querySelector('#horse-breed').value,
        color: document.getElementById('horse-form').querySelector('#horse-color').value,
        microchipId: document.getElementById('horse-form').querySelector('#microchip-id').value,
        ownerId: ownerData.id,
        addedAt: new Date().toISOString()
    };
    
    horses.push(horse);
    localStorage.setItem('coggnify_horses', JSON.stringify(horses));
    
    // Clear form
    document.getElementById('horse-form').reset();
    
    // Update display
    displayHorses();
    
    console.log('Horse added:', horse);
}

function displayHorses() {
    const horsesContainer = document.getElementById('horses');
    horsesContainer.innerHTML = '';
    
    horses.forEach(horse => {
        const horseElement = document.createElement('div');
        horseElement.className = 'horse-item';
        horseElement.innerHTML = `
            <h4>${horse.name}</h4>
            <p><strong>Breed:</strong> ${horse.breed}</p>
            <p><strong>Color:</strong> ${horse.color}</p>
            ${horse.microchipId ? `<p><strong>Microchip:</strong> ${horse.microchipId}</p>` : ''}
        `;
        horsesContainer.appendChild(horseElement);
    });
}

function generateVerificationCode() {
    // Generate 6-digit time-based code (simplified TOTP)
    const timestamp = Math.floor(Date.now() / 30000); // 30-second intervals
    const code = ((timestamp * 12345) % 900000 + 100000).toString();
    
    document.getElementById('current-code').textContent = code;
    
    console.log('Verification code generated:', code);
}

function generateOwnerID() {
    const timestamp = Date.now().toString().slice(-6);
    return `CR-${timestamp}`;
}

function generateHorseID() {
    return `H-${Date.now().toString().slice(-6)}`;
}

function nextStep() {
    // Hide current step
    document.querySelector('.step.active').classList.remove('active');
    
    // Show next step
    currentStep++;
    const nextStepElement = document.querySelectorAll('.step')[currentStep - 1];
    if (nextStepElement) {
        nextStepElement.classList.add('active');
        
        // Special handling for final step
        if (currentStep === 4) {
            displayOwnerDashboard();
        }
    }
}

function displayOwnerDashboard() {
    const ownerInfo = document.getElementById('owner-info');
    ownerInfo.innerHTML = `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h3>Owner ID: ${ownerData.id}</h3>
            <p><strong>Name:</strong> ${ownerData.name}</p>
            <p><strong>Phone:</strong> ${ownerData.phone}</p>
            <p><strong>Horses Registered:</strong> ${horses.length}</p>
        </div>
    `;
    
    generateVerificationCode();
    displayHorses();
}

function loadSavedData() {
    // Load saved owner data
    const savedOwner = localStorage.getItem('coggnify_owner');
    if (savedOwner) {
        ownerData = JSON.parse(savedOwner);
    }
    
    // Load saved horses
    const savedHorses = localStorage.getItem('coggnify_horses');
    if (savedHorses) {
        horses = JSON.parse(savedHorses);
    }
    
    // If user has account, skip to dashboard
    if (ownerData.id && horses.length > 0) {
        currentStep = 4;
        document.querySelector('.step.active').classList.remove('active');
        document.querySelectorAll('.step')[3].classList.add('active');
        displayOwnerDashboard();
    }
}