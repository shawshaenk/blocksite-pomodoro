const timerElement = document.getElementById('timer');
const startPauseButton = document.getElementById('start-pause-button');
const resetButton = document.getElementById('reset-button');
const optionsButton = document.getElementById('options-button');
const activity = document.getElementById('activity');
const blockStatus = document.getElementById('block-status');
const cycleNum = document.getElementById('cycle-num');

async function runTimer() {
    chrome.storage.local.get(['time', 'started', 'paused', 'working', 'blocking', 'strictBlocking', 'cycle'], function(result) {
        if (result) {
            updateTimerDisplay(result.time);
            updateActivity(result.started, result.paused, result.working, result.blocking, result.strictBlocking, result.cycle);
        }
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

function updateActivity(started, paused, working, blocking, strictBlocking, cycle) {
    resetButton.innerHTML = 'Reset';
    optionsButton.innerHTML = 'Options'
    cycleNum.innerHTML = 'Cycle ' + cycle
    
    if (paused || !started) {
        startPauseButton.innerHTML = 'Start';
    } else {
        startPauseButton.innerHTML = 'Pause';
    }

    if (working) {
        if (!started && !paused) {
            activity.innerHTML = 'Work';
            if (strictBlocking) {
                chrome.runtime.sendMessage({ action: 'blockingOn' });
            }
        } else if (started) {
            activity.innerHTML = 'Work ►';
            chrome.runtime.sendMessage({ action: 'blockingOn' });
        } else if (paused) {
            activity.innerHTML = 'Work ⏸';
            if (!strictBlocking) {
                chrome.runtime.sendMessage({ action: 'blockingOff' });
            }
        }
    } else if (!working) {
        if (cycle === 4) {
            if (!started && !paused) {
                activity.innerHTML = 'Long Break';
            } else if (started) {
                activity.innerHTML = 'Long Break ►';
                chrome.runtime.sendMessage({ action: 'blockingOff' });
            } else if (paused) {
                activity.innerHTML = 'Long Break ⏸';
                if (strictBlocking) {
                    chrome.runtime.sendMessage({ action: 'blockingOn' });
                }
            }
        } else {
            if (!started && !paused) {
                activity.innerHTML = 'Short Break';
            } else if (started) {
                activity.innerHTML = 'Short Break ►';
                chrome.runtime.sendMessage({ action: 'blockingOff' });
            } else if (paused) {
                activity.innerHTML = 'Short Break ⏸';
                if (strictBlocking) {
                    chrome.runtime.sendMessage({ action: 'blockingOn' });
                }
            }
        }
    }

    if (blocking) {
        blockStatus.innerHTML = 'Blocking On'
        chrome.runtime.sendMessage({ action: 'checkTabs' });
    } else {
        blockStatus.innerHTML = 'Blocking Off'
    }
    console.log(blocking);
}

function startTimer() {
    chrome.runtime.sendMessage({ action: 'start' });
    startPauseButton.innerHTML = 'Pause';
}

function pauseTimer() {
    chrome.runtime.sendMessage({ action: 'pause' });
    startPauseButton.innerHTML = 'Start';
}

function resetTimer() {
    chrome.runtime.sendMessage({ action: 'reset' });
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