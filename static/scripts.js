const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Set canvas width and height accounting for devicePixelRatio
const devicePixelRatio = window.devicePixelRatio || 1;
canvas.width = canvas.clientWidth * devicePixelRatio;
canvas.height = canvas.clientHeight * devicePixelRatio;

// Scale the context back to the desired drawing area size
ctx.scale(devicePixelRatio, devicePixelRatio);

// Function to get canvas-relative coordinates
function getCanvasCoordinates(event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

let isDrawing = false;
let isErasing = false;
let lastX = 0;
let lastY = 0;

canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    const coordinates = getCanvasCoordinates(e);
    [lastX, lastY] = [coordinates.x, coordinates.y];
});

window.addEventListener('mouseup', () => {
    isDrawing = false;
    ctx.beginPath(); // End the ongoing path
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;

    const coordinates = getCanvasCoordinates(e);
    const x = coordinates.x;
    const y = coordinates.y;

    if (isErasing) {
        drawSmoothEraser(lastX, lastY, x, y); // Erase smoothly
    } else {
        drawSmoothLine(lastX, lastY, x, y); // Draw smoothly
    }

    [lastX, lastY] = [x, y];
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'e') {
        isErasing = true; // Activate erasing mode on "e" key press
    } else if (e.key === 'd') {
        isErasing = false; // Deactivate erasing mode on "d" key press
    }
});

document.getElementById('drawButton').addEventListener('click', () => {
    isErasing = false; // Deactivate erasing mode
});

document.getElementById('eraseButton').addEventListener('click', () => {
    isErasing = true; // Activate erasing mode
});

const sizeSlider = document.getElementById('sizeSlider');
ctx.lineWidth = 5; // Adjust the default width as needed

sizeSlider.addEventListener('input', () => {
    const size = parseInt(sizeSlider.value);
    ctx.lineWidth = size;

    // Update cursor size based on brush size
    canvas.style.setProperty('--cursor-size', `${size}px`);
  
    if (isErasing) {
        ctx.lineWidth = size;
    }
});

function drawSmoothLine(x1, y1, x2, y2) {
    const numSteps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    const deltaX = (x2 - x1) / numSteps;
    const deltaY = (y2 - y1) / numSteps;

    for (let i = 0; i <= numSteps; i++) {
        const x = x1 + i * deltaX;
        const y = y1 + i * deltaY;
        
        ctx.beginPath();
        ctx.arc(x, y, ctx.lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawSmoothEraser(x1, y1, x2, y2) {
    const numSteps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    const deltaX = (x2 - x1) / numSteps;
    const deltaY = (y2 - y1) / numSteps;

    for (let i = 0; i <= numSteps; i++) {
        const x = x1 + i * deltaX;
        const y = y1 + i * deltaY;
        
        ctx.clearRect(x - ctx.lineWidth / 2, y - ctx.lineWidth / 2, ctx.lineWidth, ctx.lineWidth);
    }
}

// Clear the canvas
const clearButton = document.getElementById('clearButton');

clearButton.addEventListener('click', () => {
    clearCanvas();
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'c') {
        clearCanvas();
    }
});

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the entire canvas
}

const saveButton = document.getElementById('saveButton');
const saveMessage = document.getElementById('saveMessage');

saveButton.addEventListener('click', () => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Set white background on the temporary canvas
    tempCtx.fillStyle = '#ffffff'; // White color
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw the existing content on the temporary canvas
    tempCtx.drawImage(canvas, 0, 0);

    const image = tempCanvas.toDataURL('image/jpeg'); // Change to 'image/jpeg'
    const blob = dataURItoBlob(image);
    saveCanvas(blob);
});

function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
}

// function saveCanvas(blobData) {
//     const formData = new FormData();
//     formData.append('image_data', blobData);

//     fetch('/save_canvas', {
//         method: 'POST',
//         body: formData,
//     })
//     .then(response => response.text())
//     .then(message => {
//         showSaveMessage(message);
//     })
//     .catch(error => {
//         console.error('Error saving canvas:', error);
//     });
// }


function saveCanvas(blobData) {
    const formData = new FormData();
    formData.append('image_data', blobData);

    // Show loading indicator
    const loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.innerHTML = "<p>Thinking... (゜-゜)</p>"

    // Clear the render container content
    const renderContainer = document.getElementById('renderContainer');
    renderContainer.innerHTML = '';

    fetch('/save_canvas', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.text())
    .then(templateName => {
        // Hide loading indicator
        loadingIndicator.innerHTML = '<p></p>';
        console.log("templateName---", templateName);

        // Update renderContainer content
        renderContainer.innerHTML = templateName;

        // Call speakText function with the desired text and predictions
        var predictions = document.getElementById('prediction_paragraph').textContent;
        predictions = predictions.replace(/ \([\s\S]*?\)/g, "");
        predictions = predictions.replace(/(\r\n|\n|\r)/gm, "");
        // console.log(predictions)
        speakText(predictions);
    })
    .catch(error => {
        // Hide loading indicator
        loadingIndicator.innerHTML = '<p></p>';
        console.error('Error saving canvas:', error);
    });
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'g' || e.key === 'G') {
        e.preventDefault(); // Prevent the default action (e.g., scrolling)
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Set white background on the temporary canvas
        tempCtx.fillStyle = '#ffffff'; // White color
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
        // Draw the existing content on the temporary canvas
        tempCtx.drawImage(canvas, 0, 0);
    
        const image = tempCanvas.toDataURL('image/jpeg'); // Change to 'image/jpeg'
        const blob = dataURItoBlob(image);
        saveCanvas(blob);
    }
});

drawButton.addEventListener('click', () => {
    drawButton.classList.add('btn-dark');
    eraseButton.classList.remove('btn-dark');
});

eraseButton.addEventListener('click', () => {
    eraseButton.classList.add('btn-dark');
    drawButton.classList.remove('btn-dark');
});

// Trigger a click event on the "Draw" button to apply the initial selection
drawButton.click();

document.addEventListener('keydown', (event) => {
    if (event.key === 'd') {
        drawButton.click(); // Trigger the click event
    } else if (event.key === 'e') {
        eraseButton.click(); // Trigger the click event
    }
});


/* Set the width of the sidebar to 250px (show it) */
function openNav() {
  document.getElementById("mySidepanel").style.width = "250px";
}

/* Set the width of the sidebar to 0 (hide it) */
function closeNav() {
  document.getElementById("mySidepanel").style.width = "0";
}

function speakText(text) {
    // Check if SpeechSynthesis is supported
    if ('speechSynthesis' in window) {
        const synthesis = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);

        // Choose a voice if available
        const voices = synthesis.getVoices();
        if (voices.length > 0) {
            utterance.voice = voices[0];
        }
        synthesis.rate = 10
        // Start speaking
        synthesis.speak(utterance);
    } else {
        console.log('Text-to-speech is not supported in this browser.');
    }
}

const randomWordDisplay = document.getElementById("randomWordDisplay")

function randomWord(){
  words = ["baseball", "baseball bat", "bat", "bicycle", "bowtie", "canoe", "carrot", "coffee cup", "crab", "donut", "dragon", "envelope", "fan", "fish", "giraffe", "hurricane", "leaf", "moon", "parrot", "pencil", "sailboat", "skull", "snail", "snowflake", "sock", "star", "syringe", "triangle", "umbrella", "wheel"]
  // console.log(words.length)
  randomInt = Math.floor(Math.random() * 30)
  // console.log(words[randomInt])
  randomWordDisplay.innerHTML = `Try drawing a ${words[randomInt]}!`
}

function checkSidebars() {
  var masthead = document.querySelector('.masthead');
  var position = masthead.getBoundingClientRect();
  var elements = document.getElementsByClassName('sidebtn')
  
  // Checking whether the specified sections are visible
  // If visible, then show the content. Else, hide it.
  if (position.top < window.innerHeight && position.bottom >= 200) {
    
    //Show the floating elements
      for(let i = 0; i < elements.length; i++){
        elements[i].style.display = "block";
      }
    
    return;
  } else {
    for(let i = 0; i < elements.length; i++){
      elements[i].style.display = "none";
    }
  }
}

// Run the function on scroll
window.addEventListener("scroll", checkSidebars);
// Run on load
window.addEventListener("load", checkSidebars);