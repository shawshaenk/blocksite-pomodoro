let timerInterval;
let time = 20 * 60;
let started = false;
let paused = false;
let working = true;
let breakCheck = false;
let urls = ["instagram.com", "tiktok.com"];
chrome.storage.local.set({ time, started, paused, working, breakCheck, urls });

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

// block sites in all tabs
function checkTab(tab) {
    const blockPage = chrome.runtime.getURL("blocked/blocked.html");
    chrome.storage.local.get('urls', function(result) {
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