const timerElement = document.getElementById('timer');
const startButton = document.getElementById('start-button');
const resetButton = document.getElementById('reset-button');
const pauseButton = document.getElementById('pause-button');
const activity = document.getElementById('activity');
const blockStatus = document.getElementById('block-status');
const cycleNum = document.getElementById('cycle-num');

function sendMessage(action) {
    chrome.runtime.sendMessage({ action }, (response) => {
        if (response) {
            updateTimerDisplay(response.time);
            updateActivity(result.started, result.paused, result.working, result.breakCheck, result.cycle);
        }
    });
}

async function runTimer() {
    chrome.storage.local.get(['time', 'started', 'paused', 'working', 'breakCheck', 'cycle'], function(result) {
        updateTimerDisplay(result.time);
        updateActivity(result.started, result.paused, result.working, result.breakCheck, result.cycle);
    });
}

document.addEventListener('DOMContentLoaded', (event) => {
    let timer = setInterval(runTimer, 1000);
});

function updateTimerDisplay(time) {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    timerElement.textContent = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function updateActivity(started, paused, working, breakCheck, cycle) {
    pauseButton.innerHTML = 'Pause';
    resetButton.innerHTML = 'Reset';
    cycleNum.innerHTML = 'Cycle ' + cycle;
    if (paused) {
        startButton.innerHTML = 'Resume';
        chrome.runtime.sendMessage({ action: 'checkTabs' });
        blockStatus.innerHTML = 'Blocking On'
        if (working && !breakCheck) {
            activity.innerHTML = 'Work ⏸';
        } else {
            sendMessage('workingOn');
            if (cycle === 4) {
                activity.innerHTML = 'Long Break ⏸';
            } else {
                activity.innerHTML = 'Short Break ⏸';
            }
        }
    } else {
        startButton.innerHTML = 'Start';
        if (working && !breakCheck) {
            chrome.runtime.sendMessage({ action: 'checkTabs' });
            blockStatus.innerHTML = 'Blocking On'
            if (started) {
                activity.innerHTML = 'Work ►';
            } else {
                activity.innerHTML = 'Work';
            }
        } else {
            if (started) {
                sendMessage('workingOff');
                if (cycle === 4) {
                    activity.innerHTML = 'Long Break ►';
                } else {
                    activity.innerHTML = 'Short Break ►';
                }
                blockStatus.innerHTML = 'Blocking Off'
            } else {
                if (cycle === 4) {
                    activity.innerHTML = 'Long Break';
                } else {
                    activity.innerHTML = 'Short Break';
                }
                chrome.runtime.sendMessage({ action: 'checkTabs' });
                blockStatus.innerHTML = 'Blocking On'
            }
        }
    }
}

function buttonPressed() {
    chrome.runtime.sendMessage({ action: 'getState' }, (response) => {
        if (response) {
            updateActivity(response.started, response.paused, response.working, response.breakCheck, response.cycle);
        }
    });
}

function startTimer() {
    sendMessage('start');
    buttonPressed();
}

function pauseTimer() {
    sendMessage('pause');
    buttonPressed();
}

function resetTimer() {
    sendMessage('reset');
    buttonPressed();
}

startButton.addEventListener('click', () => startTimer());
pauseButton.addEventListener('click', () => pauseTimer());
resetButton.addEventListener('click', () => resetTimer());

document.querySelector('#go-to-options').addEventListener('click', function() {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  });