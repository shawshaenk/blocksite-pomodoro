document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('url-input');
    const workValue = document.getElementById('work-time');
    const shortBreakValue = document.getElementById('short-break-time');
    const longBreakValue = document.getElementById('long-break-time');
    const blockSwitch = document.getElementById('block-switch');
    
    document.getElementById('block-form').addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent the form from submitting the traditional way

        const urlValue = urlInput.value.trim();

        if (urlValue !== "") {
            chrome.storage.local.get('urls', function(result) {
                let urls = result.urls;
                let matchFound = false;
                for (let i = 0; i < urls.length; i++) {
                    if (urls[i] === urlValue) {
                        matchFound = true;
                        break;
                    }
                }

                if (!matchFound) {
                    addBlockedSite(urlValue);
                    urls.push(urlValue);
                    chrome.storage.local.set({ urls });
                }
            });
            urlInput.value = ""; // Clear the input field
            chrome.runtime.sendMessage({ action: 'checkTabs' });
        }
    });
    
    function addBlockedSite(url) {
        const blockedSites = document.getElementById('blocked-sites');

        const siteDiv = document.createElement('div');
        siteDiv.className = 'blocked-site';

        const siteText = document.createElement('span');
        siteText.textContent = url;

        const deleteButton = document.createElement('button');
        deleteButton.textContent = '✕';
        deleteButton.addEventListener('click', () => {
            blockedSites.removeChild(siteDiv);
            chrome.storage.local.get('urls', function(result) {
                let urls = result.urls;
                for (let i = 0; i < urls.length; i++) {
                    if (urls[i] === url) {
                        urls.splice(i, 1);
                        break;
                    }
                }
                chrome.storage.local.set({ urls });
            });
            return true;
        });

        siteDiv.appendChild(siteText);
        siteDiv.appendChild(deleteButton);
        blockedSites.appendChild(siteDiv);     
    }

    chrome.storage.local.get(['urls', 'workTime', 'shortBreakTime', 'longBreakTime'], function(result) {
        let urls = result.urls;
        for (let i = 0; i < urls.length; i++) {
            addBlockedSite(urls[i]);
        }

        workValue.value = result.workTime / 60;
        shortBreakValue.value = result.shortBreakTime / 60;
        longBreakValue.value = result.longBreakTime / 60;
    });

    workValue.addEventListener("blur", function() {
        chrome.storage.local.get('workTime', function(result) {
            let workTime = result.workTime;
            let value = workValue.value;
            if (value.includes('.') || value <= 0) {
                workValue.value = 20;
                value = 20;
            }
            workTime = value * 60;
            chrome.storage.local.set({ workTime });
        });
    })

    shortBreakValue.addEventListener("blur", function() {
        chrome.storage.local.get('shortBreakTime', function(result) {
            let shortBreakTime = result.shortBreakTime;
            let value = shortBreakValue.value;
            if (value.includes('.') || value <= 0) {
                shortBreakValue.value = 5;
                value = 5;
            }
            shortBreakTime = value * 60;
            chrome.storage.local.set({ shortBreakTime });
        });
    })

    longBreakValue.addEventListener("blur", function() {
        chrome.storage.local.get('longBreakTime', function(result) {
            let longBreakTime = result.longBreakTime;
            let value = longBreakValue.value;
            if (value.includes('.') || value <= 0) {
                longBreakValue.value = 15;
                value = 15;
            }
            longBreakTime = value * 60;
            chrome.storage.local.set({ longBreakTime });
        });
    });

    chrome.runtime.sendMessage({ action: 'checkTabs' });

    chrome.storage.local.get('strictBlocking', function(result) {
        if (result) {
            if (result.strictBlocking) {
                blockSwitch.checked = true;
            }
        }
    });

    blockSwitch.addEventListener('change', function() {
        if (this.checked) {
            let strictBlocking = true;
            chrome.storage.local.set({ strictBlocking });
        } else {
            let strictBlocking = false;
            chrome.storage.local.set({ strictBlocking });
        }
    });
});