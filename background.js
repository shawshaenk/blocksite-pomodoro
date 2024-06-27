let timerInterval;
let time;
let started;
let paused;
let working;
let breakCheck;
let urls;
let badgeUpdater;
let workTime = 20 * 60;
let breakTime = 5 * 60;

function initializeVariables(callback) {
    chrome.storage.local.get(['time', 'started', 'paused', 'working', 'breakCheck', 'urls'], function(items) {
        if (Object.keys(items).length === 0) {
            time = workTime;
            started = false;
            paused = false;
            working = true;
            breakCheck = false;
            urls = ["instagram.com", "tiktok.com", "youtube.com"];
            chrome.storage.local.set({ time, started, paused, working, breakCheck, urls });
        } else {
            time = items.time;
            started = items.started;
            paused = items.paused;
            working = items.working;
            breakCheck = items.breakCheck;
            urls = items.urls;
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
        clearInterval(timerInterval);
        timerInterval = null;
        started = false;
        paused = false;
        if (working) {
            breakCheck = true;
            time = breakTime;
        } else {
            working = true;
            breakCheck = false;
            time = workTime;
        }
        chrome.storage.local.set({ time, started, paused, working, breakCheck });
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
        if (!paused) {
            clearInterval(timerInterval);
            timerInterval = null;
            started = false;
            paused = true;
            chrome.storage.local.set({ started, paused });
        }
    } else if (request.action === 'reset') {
        clearInterval(timerInterval);
        timerInterval = null;
        time = workTime;
        started = false;
        paused = false;
        working = true;
        breakCheck = false;
        chrome.storage.local.set({ time, started, paused, working, breakCheck });
    } else if (request.action === 'workingOn') {
        working = true;
        breakCheck = true;
        chrome.storage.local.set({ working, breakCheck });
    } else if (request.action === 'workingOff') {
        working = false;
        breakCheck = true;
        chrome.storage.local.set({ working, breakCheck });
    } else if (request.action === 'getState') {
        sendResponse({ time, started, paused, working, breakCheck });
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

// Block sites in all tabs
function checkTab(tab) {
    chrome.storage.local.get('urls', function(result) {
        const blockPage = chrome.runtime.getURL("blocked/blocked.html");
        for (let i = 0; i < result.urls.length; i++) {
            if (tab.url && tab.url.includes(result.urls[i])) {
                chrome.tabs.update(tab.id, { url: blockPage });
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


function initializeScript() {
    initializeVariables(() => {
        if (started) {
            fireTimer();
        }
    });
}

initializeScript();

chrome.runtime.onStartup.addListener(() => {
    initializeScript();
});
