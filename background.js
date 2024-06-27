let timerInterval;
let time;
let started;
let paused;
let working;
let breakCheck;
let urls;

chrome.storage.local.get(null, function(items) {
    if (Object.keys(items).length === 0) {
        time = 20 * 60;
        started = false;
        paused = false;
        working = true;
        breakCheck = false;
        urls = ["instagram.com", "tiktok.com", "youtube.com"];
        chrome.storage.local.set({ time, started, paused, working, breakCheck, urls });
    } else {
        chrome.storage.local.get(['time', 'started', 'paused', 'working', 'breakCheck', 'urls'], function(result) {
            time = result.time;
            started = result.started;
            paused = result.paused;
            working = result.working;
            breakCheck = result.breakCheck;
            urls = result.urls;
        });
    }
});

if (working) {
    checkTabs();
}

function updateTimer() {
    if (time > 0) {
        time--;
        chrome.storage.local.set({ time });
    } else {
        clearInterval(timerInterval);
        started = false;
        paused = false;
        if (working) {
            breakCheck = true;
            time = 5 * 60;
        } else {
            working = true;
            breakCheck = false;
            time = 20 * 60;
        }
        chrome.storage.local.set({ time, started, paused, working, breakCheck });
        sendNotification();
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'start') {
        if (!started) {
            timerInterval = setInterval(updateTimer, 1000);
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
            started = false;
            paused = true;
            chrome.storage.local.set({ started, paused });
        }
    } else if (request.action === 'reset') {
        clearInterval(timerInterval);
        time = 20 * 60;
        started = false;
        paused = false;
        working = true;
        breakCheck = false;
        chrome.storage.local.set({ time, started, paused, working, breakCheck });
    } else if (request.action === 'workingOn') {
        working = true;
        breakCheck = true;
        chrome.storage.local.set( { working, breakCheck } );
    } else if (request.action === 'workingOff') {
        working = false;
        breakCheck = true;
        chrome.storage.local.set( { working, breakCheck } );
    } else if (request.action === 'getState') {
        sendResponse({ time, started, paused, working, breakCheck });
    } else if (request.action === "checkTabs") {
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
        let pausedValue = '';
        if (paused) {
            pausedValue = '⏸';
        }
        if (time >= 60) {
            const minutes = Math.floor(time / 60);
            chrome.action.setBadgeText({ text: `${minutes < 10 ? '0' : ''}${minutes}${pausedValue}` });
        } else {
            const seconds = time % 60;
            chrome.action.setBadgeText({ text: `:${seconds < 10 ? '0' : ''}${seconds}${pausedValue}` });
        }
        if (working) {
            chrome.action.setBadgeBackgroundColor({ color: [255, 99, 71, 255] });
        } else {
            chrome.action.setBadgeBackgroundColor({ color: [127, 255, 212, 255] });
        }
    } else {
        chrome.action.setBadgeText({ text: '' });
    }
}

let badgeUpdater = setInterval(updateBadge, 1000);

// block sites in all tabs
function checkTab(tab) {
    const blockPage = chrome.runtime.getURL("blocked/blocked.html");
    for (let i = 0; i < urls.length; i++) {
        if (tab.url && tab.url.includes(urls[i])) {
            chrome.tabs.update(tab.id, { url: blockPage });
        }
    }
}

function checkTabs() {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        checkTab(tab);
      });
    });
}