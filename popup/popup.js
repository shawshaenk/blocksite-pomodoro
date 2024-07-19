const timerElement = document.getElementById('timer');
const startPauseButton = document.getElementById('start-pause-button');
const resetButton = document.getElementById('reset-button');
const optionsButton = document.getElementById('options-button');
const activity = document.getElementById('activity');
const blockStatus = document.getElementById('block-status');
const cycleNum = document.getElementById('cycle-num');

function sendMessage(action) {
    chrome.runtime.sendMessage({ action }, (response, callback) => {
        if (response) {
            updateTimerDisplay(response.time);
            updateActivity(response.started, response.paused, response.working, response.breakCheck, response.cycle);
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
    runTimer(); // Initial run to update the UI immediately
    let timer = setInterval(runTimer, 1000);
});

function updateTimerDisplay(time) {
    let hours = Math.floor(time / 3600);
    let minutes = Math.floor(time / 60) - hours * 60;
    let seconds = time % 60;

    if (hours > 0) {
        timerElement.textContent = `${hours < 10 ? '0' : ''}${hours}:` +
                                   `${minutes < 10 ? '0' : ''}${minutes}:` +
                                   `${seconds < 10 ? '0' : ''}${seconds}`;
    } else {
        timerElement.textContent = `${minutes < 10 ? '0' : ''}${minutes}:` +
                                   `${seconds < 10 ? '0' : ''}${seconds}`;
    }
}

function updateActivity(started, paused, working, breakCheck, cycle) {
    resetButton.innerHTML = 'Reset';
    optionsButton.innerHTML = 'Options'
    cycleNum.innerHTML = 'Cycle ' + cycle
    
    if (paused || !started) {
        startPauseButton.innerHTML = 'Start';
    } else {
        startPauseButton.innerHTML = 'Pause';
    }

    if (paused) {
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
        if (working && !breakCheck) {
            chrome.runtime.sendMessage({ action: 'checkTabs' });
            blockStatus.innerHTML = 'Blocking On'
            if (started) {
                activity.innerHTML = 'Work ►';
            } else {
                activity.innerHTML = 'Work';
                console.log(breakCheck);
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
                    console.log(breakCheck);
                }
                chrome.runtime.sendMessage({ action: 'checkTabs' });
                blockStatus.innerHTML = 'Blocking On'
            }
        }
    }
}

// function buttonPressed() {
//     chrome.runtime.sendMessage({ action: 'getState' }, (response) => {
//         if (response) {
//             updateTimerDisplay(response.time)
//             updateActivity(response.started, response.paused, response.working, response.breakCheck, response.cycle);
//         }
//     });
// }

function startTimer() {
    sendMessage('start');
    startPauseButton.innerHTML = 'Pause';
}

function pauseTimer() {
    sendMessage('pause');
    startPauseButton.innerHTML = 'Start';
}

function resetTimer() {
    sendMessage('reset');
}

startPauseButton.addEventListener('click', function() {
    chrome.storage.local.get('started', function(result) {
        if (result.started) {
            pauseTimer();
        } else {
            startTimer();
        }
    });
});
resetButton.addEventListener('click', () => resetTimer());

document.querySelector('#options-button').addEventListener('click', function() {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  });