let timerInterval;
let time;
let started;
let paused;
let working;
let blocking;
let strictBlocking;
let whitelistMode;
let blockedUrls;
let whitelistedUrls;
let exceptedUrls;
let urls;
let badgeUpdater;
let cycle;
let workTime;
let shortBreakTime;
let longBreakTime;

function initializeVariables(callback) {
    chrome.storage.local.get(['time', 'started', 'paused', 'working', 'blocking', 'strictBlocking', 'whitelistMode', 'blockedUrls', 'whitelistedUrls', 'exceptedUrls', 'urls', 'cycle', 'workTime', 'shortBreakTime', 'longBreakTime'], function(items) {
        workTime = items.workTime ?? 20 * 60;
        shortBreakTime = items.shortBreakTime ?? 5 * 60;
        longBreakTime = items.longBreakTime ?? 15 * 60;
        
        time = items.time ?? workTime;
        started = items.started ?? false;
        paused = items.paused ?? false;
        working = items.working ?? true;
        blocking = items.blocking ?? false;
        strictBlocking = items.strictBlocking ?? false;
        whitelistMode = items.whitelistMode ?? false;
        cycle = items.cycle ?? 1;
        blockedUrls = items.blockedUrls ?? items.urls ?? [];
        whitelistedUrls = items.whitelistedUrls ?? [];
        exceptedUrls = items.exceptedUrls ?? [];
        chrome.storage.local.set({ time, started, paused, working, blocking, strictBlocking, whitelistMode, blockedUrls, whitelistedUrls, exceptedUrls, urls, cycle, workTime, shortBreakTime, longBreakTime });
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
                sendNotification();
            }
            chrome.storage.local.set({ time, started, paused, working, blocking, cycle });
            checkTabs();
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
    chrome.storage.local.get(['whitelistMode', 'blockedUrls', 'whitelistedUrls', 'exceptedUrls'], function(result) {
        let exceptedUrls = result.exceptedUrls;
        let excepted = false;
        for (let i = 0; i < exceptedUrls.length; i++) {
            if (tab.url.includes(exceptedUrls[i])) {
                excepted = true;
                break;
            }
        }

        if (!result.whitelistMode) {
            let blockedUrls = result.blockedUrls;
            const blockPage = chrome.runtime.getURL("blocked/blocked.html");
            for (let i = 0; i < blockedUrls.length; i++) {
                if (tab.url.includes(blockedUrls[i]) && !excepted) {
                    chrome.tabs.update(tab.id, { url: blockPage });
                    break;
                }
            }
        } else {
            let whitelistedUrls = result.whitelistedUrls;
            let blockTab = true;
            const blockPage = chrome.runtime.getURL("blocked/blocked.html");
            for (let i = 0; i < whitelistedUrls.length; i++) {
                if (tab.url.includes(whitelistedUrls[i])) {
                    blockTab = false;
                }
            }
            if (blockTab && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://') && !excepted) {
                chrome.tabs.update(tab.id, { url: blockPage });
            }
        }
    })
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