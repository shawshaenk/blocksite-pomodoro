// const timerElement = document.getElementById('timer');

// const startButton = document.getElementById('start-button');
// const resetButton = document.getElementById('reset-button');
// const pauseButton = document.getElementById('pause-button');
// const activity = document.getElementById('activity');

// let time = 20 * 60; // 20 minutes in seconds
// let timerInterval;
// let started = false;
// paused = false;

// function updateTimer() {
//     const minutes = Math.floor(time / 60);
//     const seconds = time % 60;
//     timerElement.textContent = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    
//     if (time > 0) {
//         time--;
//     } else {
//         clearInterval(timerInterval);
//     }
// }

// function startTimer() {
//     if(!started) {
//         timerInterval = setInterval(updateTimer, 1000); // Start the interval
//         started = true;
//         paused = false;
//         startButton.innerHTML = 'Start';
//         activity.innerHTML = 'Work';
//     }
// }

// function pauseTimer() {
//     if(!paused && started) {
//         clearInterval(timerInterval);
//         activity.innerHTML += '⏸';
//         startButton.innerHTML = 'Resume';
//         started = false;
//         paused = true;
//     }
// }

// function resetTimer() {
//     clearInterval(timerInterval); // Clear any existing intervals
//     time = 20 * 60; // Reset time to 20 minutes
//     updateTimer(); // Immediately update the timer display
//     started = false;
//     paused = false;
//     startButton.innerHTML = 'Start';
//     activity.innerHTML = 'Work';
// }

// startButton.addEventListener('click', startTimer);
// pauseButton.addEventListener('click', pauseTimer);
// resetButton.addEventListener('click', resetTimer);

const timerElement = document.getElementById('timer');
const startButton = document.getElementById('start-button');
const resetButton = document.getElementById('reset-button');
const pauseButton = document.getElementById('pause-button');
const activity = document.getElementById('activity');

function sendMessageToBackground(command) {
    chrome.runtime.sendMessage({ command: command });
}

startButton.addEventListener('click', function() {
    sendMessageToBackground("start");
});

pauseButton.addEventListener('click', function() {
    sendMessageToBackground("pause");
});

resetButton.addEventListener('click', function() {
    sendMessageToBackground("reset");
});

// Update UI based on messages from background script
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.timerTime) {
        const minutes = Math.floor(message.timerTime / 60);
        const seconds = message.timerTime % 60;
        timerElement.textContent = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
});