let timerInterval;
let time;
let started;
let paused;
let working;
let breakCheck;
let urls;
let badgeUpdater;
let cycle;
let workTime = 20 * 60;
let shortBreakTime = 5 * 60;
let longBreakTime = 15 * 60;

function initializeVariables(callback) {
    chrome.storage.local.get(['time', 'started', 'paused', 'working', 'breakCheck', 'urls', 'cycle'], function(items) {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
            return;
        }
        if (Object.keys(items).length === 0) {
            time = workTime;
            started = false;
            paused = false;
            working = true;
            breakCheck = false;
            urls = [];
            cycle = 1;
            chrome.storage.local.set({ time, started, paused, working, breakCheck, urls, cycle });
        } else {
            time = items.time;
            started = items.started;
            paused = items.paused;
            working = items.working;
            breakCheck = items.breakCheck;
            cycle = items.cycle;
            urls = items.urls || [];
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
    if (time > 0) {
        time--;
        chrome.storage.local.set({ time });
    } else {
        clearIntervals();
        started = false;
        paused = false;
        if (working) {
            breakCheck = true;
            if (cycle === 4) {
                time = longBreakTime;
            } else {
                time = shortBreakTime;
            }
        } else {
            if (cycle === 4) {
                cycle = 1;
            } else {
                cycle += 1;
            }
            working = true;
            breakCheck = false;
            time = workTime;
        }
        chrome.storage.local.set({ time, started, paused, working, breakCheck, cycle });
        chrome.storage.local.get('working', function(result) {
            if (result.working) {
                checkTabs();
            }
        });
        sendNotification();
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'start') {
        if (!started) {
            fireTimer();
            started = true;
            paused = false;
            if (working && breakCheck && !paused) {
                working = false;
            }
            chrome.storage.local.set({ started, paused, working, breakCheck });
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
        clearIntervals();
        time = workTime;
        started = false;
        paused = false;
        working = true;
        breakCheck = false;
        cycle = 1;
        chrome.storage.local.set({ time, started, paused, working, breakCheck, cycle });
    } else if (request.action === 'workingOn') {
        working = true;
        breakCheck = true;
        chrome.storage.local.set({ working, breakCheck });
    } else if (request.action === 'workingOff') {
        working = false;
        breakCheck = true;
        chrome.storage.local.set({ working, breakCheck });
    } else if (request.action === 'getState') {
        sendResponse({ time, started, paused, working, breakCheck, cycle });
    } else if (request.action === 'checkTabs') {
        checkTabs();
    }
    return true; // Keep the message channel open for asynchronous response
});

function sendNotification() {
    if (!breakCheck) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/target.png',
            title: 'Work',
            message: 'Your break is over! Press Start to work!'
        });
    } else {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/target.png',
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
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
            checkTab(tab);
        });
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