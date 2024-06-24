let time = 20 * 60; // 20 minutes in seconds
let timerInterval;
let started = false;
let paused = false;

function updateTimer() {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    timerElement.textContent = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    
    if (time > 0) {
        time--;
    } else {
        clearInterval(timerInterval);
    }
}

function startTimer() {
    if(!started) {
        timerInterval = setInterval(updateTimer, 1000); // Start the interval
        started = true;
        paused = false;
        startButton.innerHTML = 'Start';
        activity.innerHTML = 'Work';
    }
}

function pauseTimer() {
    if(!paused && started) {
        clearInterval(timerInterval);
        activity.innerHTML += '⏸';
        startButton.innerHTML = 'Resume';
        started = false;
        paused = true;
    }
}

function resetTimer() {
    clearInterval(timerInterval); // Clear any existing intervals
    time = 20 * 60; // Reset time to 20 minutes
    updateTimer(); // Immediately update the timer display
    started = false;
    paused = false;
    startButton.innerHTML = 'Start';
    activity.innerHTML = 'Work';
}

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.command === "start") {
        startTimer();
    } else if (message.command === "pause") {
        pauseTimer();
    } else if (message.command === "reset") {
        resetTimer();
    }
});

// Restore timer state from local storage if exists
chrome.storage.local.get("timerTime", function(data) {
    if (data.timerTime) {
        time = data.timerTime;
        if (time > 0 && started) {
            timerInterval = setInterval(updateTimer, 1000);
        }
    }
});