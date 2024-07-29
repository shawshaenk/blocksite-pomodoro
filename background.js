let timerInterval;
let time;
let started;
let paused;
let working;
let blocking;
let strictBlocking;
let urls;
let badgeUpdater;
let cycle;
let workTime;
let shortBreakTime;
let longBreakTime;

function initializeVariables(callback) {
    chrome.storage.local.get(['time', 'started', 'paused', 'working', 'blocking', 'strictBlocking', 'urls', 'cycle', 'workTime', 'shortBreakTime', 'longBreakTime'], function(items) {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
            return;
        }
        if (Object.keys(items).length === 0) {
            started = false;
            paused = false;
            working = true;
            blocking = false;
            strictBlocking = false;
            urls = [];
            cycle = 1;
            workTime = 20 * 60;
            shortBreakTime = 5 * 60;
            longBreakTime = 15 * 60;
            time = workTime;
            chrome.storage.local.set({ time, started, paused, working, blocking, strictBlocking, urls, cycle, workTime, shortBreakTime, longBreakTime });
        } else {
            time = items.time;
            started = items.started;
            paused = items.paused;
            working = items.working;
            blocking = items.blocking;
            strictBlocking = items.strictBlocking;
            cycle = items.cycle;
            urls = items.urls;
            workTime = items.workTime;
            shortBreakTime = items.shortBreakTime;
            longBreakTime = items.longBreakTime;
        }
        callback();
    });
}

function fireTimer() {
    if (!timerInterval) {
        timerInterval = setInterval(updateTimer, 1000);
    }
    if (!badgeUpdater) {
        badgeUpdater = setInterval(updateBadge, 1000);
    }
}

function updateTimer() {
    chrome.storage.local.get(['workTime', 'shortBreakTime', 'longBreakTime'], function(result) {
        if (result) {
            if (time > 0) {
                time--;
            } else {
                clearIntervals();
                started = false;
                paused = false;
                if (working) {
                    if (cycle === 4) {
                        time = result.longBreakTime;
                    } else {
                        time = result.shortBreakTime;
                    }
                    working = false;
                } else {
                    if (cycle === 4) {
                        cycle = 1;
                    } else {
                        cycle += 1;
                    }
                    working = true;
                    blocking = true;
                    time = result.workTime;
                }
                checkTabs();
                sendNotification();
            }
            chrome.storage.local.set({ time, started, paused, working, blocking, cycle });
        }
    });
}

chrome.runtime.onMessage.addListener((request, sendResponse) => {
    if (request.action === 'start') {
        if (!started) {
            fireTimer();
            started = true;
            paused = false;
            // if (working && breakCheck && !paused) {
            //     working = false;
            // }
            chrome.storage.local.set({ started, paused });
        }
    } else if (request.action === 'pause') {
        if (!paused && started) {
            clearInterval(timerInterval);
            timerInterval = null;
            started = false;
            paused = true;
            chrome.storage.local.set({ started, paused });
        }
    } else if (request.action === 'reset') {
        chrome.storage.local.get(['workTime', 'strictBlocking'], function(result) {
            if (result) {
                clearIntervals();
                working = true;
                time = result.workTime;
                started = false;
                paused = false;
                cycle = 1;
                if (!result.strictBlocking) {
                    blocking = false;
                } else {
                    blocking = true;
                }
                chrome.storage.local.set({ time, started, paused, working, blocking, cycle });
            }
        });
        return true;
    } else if (request.action === 'blockingOn') {
        blocking = true;
        chrome.storage.local.set({ blocking });
    } else if (request.action === 'blockingOff') {
        blocking = false;
        chrome.storage.local.set({ blocking });
    } else if (request.action === 'workingOn') {
        working = true;
        chrome.storage.local.set({ working });
    } else if (request.action === 'workingOff') {
        working = false;
        chrome.storage.local.set({ working })
    } else if (request.action === 'checkTabs') {
        checkTabs();
    }
    return true;
});

function sendNotification() {
    if (working) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/tomatoshield128.png',
            title: 'Work',
            message: 'Your break is over! Press Start to work!'
        });
    } else {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/tomatoshield128.png',
            title: 'Break',
            message: 'Press Start to start your break!'
        });
    }
}

function updateBadge() {
    if (started || paused) {
        if (time >= 60) {
            const minutes = Math.floor(time / 60);
            chrome.action.setBadgeText({ text: `${minutes < 10 ? '0' : ''}${minutes}` });
        } else {
            const seconds = time % 60;
            chrome.action.setBadgeText({ text: `:${seconds < 10 ? '0' : ''}${seconds}` });
        }
        if (paused) {
            chrome.action.setBadgeBackgroundColor({ color: [30, 30, 30, 255] });
        } else if (working) {
            chrome.action.setBadgeBackgroundColor({ color: [255, 99, 71, 255] });
        } else {
            chrome.action.setBadgeBackgroundColor({ color: [127, 255, 212, 255] });
        }
    } else {
        chrome.action.setBadgeText({ text: '' });
    }
}

function clearIntervals() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    if (badgeUpdater) {
        clearInterval(badgeUpdater);
        badgeUpdater = null;
    }
    chrome.action.setBadgeText({ text: '' });
}

// Block sites in all tabs
function checkTab(tab) {
    if (!tab.url) return;
    chrome.storage.local.get('urls', function(result) {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
            return;
        }
        let urls = result.urls;
        const blockPage = chrome.runtime.getURL("blocked/blocked.html");
        for (let i = 0; i < urls.length; i++) {
            if (tab.url.includes(urls[i])) {
                chrome.tabs.update(tab.id, { url: blockPage });
                break;
            }
        }
    });
}

function checkTabs() {
    chrome.storage.local.get('blocking', function(result) {
        if (result.blocking) {
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach((tab) => {
                    checkTab(tab);
                });
            });
        }
    });
}

checkTabs();

function initializeScript() {
    initializeVariables(() => {
        if (started) {
            fireTimer();
        }
        if (!badgeUpdater) {
            badgeUpdater = setInterval(updateBadge, 1000);
        }
    });
}

initializeScript();

chrome.tabs.onUpdated.addListener(function() {
    checkTabs();
  });

chrome.runtime.onSuspend.addListener(function() {
    clearIntervals();
});

chrome.runtime.onStartup.addListener(() => {
    initializeScript();
});

chrome.runtime.onInstalled.addListener(function (object) {
    if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
    } else {
    window.open(chrome.runtime.getURL('options.html'));
    }
});