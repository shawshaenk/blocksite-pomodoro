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
                    chrome.storage.local.set({ urls }, () => {
                        sendMessage({ urls });
                    });
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
                chrome.storage.local.set({ urls }, () => {
                    sendMessage({ urls });
                });
            });
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

    workValue.addEventListener("input", function() {
        chrome.storage.local.get('workTime', function(result) {
            let workTime = result.workTime;
            workTime = workValue.value * 60;
            chrome.storage.local.set({ workTime });
        });
    })

    shortBreakValue.addEventListener("input", function() {
        chrome.storage.local.get('shortBreakTime', function(result) {
            let shortBreakTime = result.shortBreakTime;
            shortBreakTime = shortBreakValue.value * 60;
            chrome.storage.local.set({ shortBreakTime });
        });
    })

    longBreakValue.addEventListener("input", function() {
        chrome.storage.local.get('longBreakTime', function(result) {
            let longBreakTime = result.longBreakTime;
            longBreakTime = longBreakValue.value * 60;
            chrome.storage.local.set({ longBreakTime });
        });
    })

    chrome.runtime.sendMessage({ action: 'checkTabs' });

    checkbox.addEventListener('change', function() {
        if (this.checked) {
            strictBlocking = true;
        } else {
            strictBlocking = false;
        }
        chrome.storage.local.set({ strictBlocking })
    });
});