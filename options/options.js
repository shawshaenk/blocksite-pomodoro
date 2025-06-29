document.addEventListener('DOMContentLoaded', () => {
    //Initialize Options Page
    const blockInput = document.getElementById('block-url-input');
    const whitelistInput = document.getElementById('whitelist-url-input');
    const exceptionInput = document.getElementById('exceptions-url-input');
    const workValue = document.getElementById('work-time');
    const shortBreakValue = document.getElementById('short-break-time');
    const longBreakValue = document.getElementById('long-break-time');
    const blockSwitch = document.getElementById('block-switch');
    const whitelistSwitch = document.getElementById('whitelist-switch');

    let strictBlocking;
    let whitelistMode;
    let workTime;
    let shortBreakTime;
    let longBreakTime;

    chrome.storage.local.get(['blockedUrls', 'whitelistedUrls', 'exceptedUrls', 'workTime', 'shortBreakTime', 'longBreakTime', 'whitelistMode', 'strictBlocking'], function(result) {
        let blockedUrls = result.blockedUrls;
        for (let i = 0; i < blockedUrls.length; i++) {
            addBlockedSite(blockedUrls[i]);
        }

        let whitelistedUrls = result.whitelistedUrls;
        for (let i = 0; i < whitelistedUrls.length; i++) {
            addWhitelistedSite(whitelistedUrls[i]);
        }

        let exceptedUrls = result.exceptedUrls;
        for (let i = 0; i < exceptedUrls.length; i++) {
            addExceptedSite(exceptedUrls[i]);
        }

        workValue.value = result.workTime / 60;
        shortBreakValue.value = result.shortBreakTime / 60;
        longBreakValue.value = result.longBreakTime / 60;

        strictBlocking = result.strictBlocking;
        whitelistMode = result.whitelistMode;
    });

    //Block Sites Code
    document.getElementById('block-form').addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent the form from submitting the traditional way

        const blockValue = blockInput.value.trim();

        if (blockValue !== "") {
            chrome.storage.local.get('blockedUrls', function(result) {
                let blockedUrls = result.blockedUrls;
                let matchFound = false;
                for (let i = 0; i < blockedUrls.length; i++) {
                    if (blockedUrls[i] === blockValue) {
                        matchFound = true;
                        break;
                    }
                }

                if (!matchFound) {
                    addBlockedSite(blockValue);
                    blockedUrls.push(blockValue);
                    chrome.storage.local.set({ blockedUrls });
                }
            });
            blockInput.value = ""; // Clear the input field
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
            chrome.storage.local.get('blockedUrls', function(result) {
                let blockedUrls = result.blockedUrls;
                for (let i = 0; i < blockedUrls.length; i++) {
                    if (blockedUrls[i] === url) {
                        blockedUrls.splice(i, 1);
                        break;
                    }
                }
                chrome.storage.local.set({ blockedUrls });
            });
            return true;
        });

        siteDiv.appendChild(siteText);
        siteDiv.appendChild(deleteButton);
        blockedSites.appendChild(siteDiv);     
    }

    // Whitelist Sites Code
    document.getElementById('whitelist-form').addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent the form from submitting the traditional way

        const whitelistValue = whitelistInput.value.trim();

        if (whitelistValue !== "") {
            chrome.storage.local.get('whitelistedUrls', function(result) {
                let whitelistedUrls = result.whitelistedUrls;
                let matchFound = false;
                for (let i = 0; i < whitelistedUrls.length; i++) {
                    if (whitelistedUrls[i] === whitelistValue) {
                        matchFound = true;
                        break;
                    }
                }

                if (!matchFound) {
                    addWhitelistedSite(whitelistValue);
                    whitelistedUrls.push(whitelistValue);
                    chrome.storage.local.set({ whitelistedUrls });
                }
            });
            whitelistInput.value = ""; // Clear the input field
            chrome.runtime.sendMessage({ action: 'checkTabs' });
        }
    });
    
    function addWhitelistedSite(url) {
        const whitelistedSites = document.getElementById('whitelisted-sites');

        const siteDiv = document.createElement('div');
        siteDiv.className = 'whitelisted-site';

        const siteText = document.createElement('span');
        siteText.textContent = url;

        const deleteButton = document.createElement('button');
        deleteButton.textContent = '✕';
        deleteButton.addEventListener('click', () => {
            whitelistedSites.removeChild(siteDiv);
            chrome.storage.local.get('whitelistedUrls', function(result) {
                let whitelistedUrls = result.whitelistedUrls;
                for (let i = 0; i < whitelistedUrls.length; i++) {
                    if (whitelistedUrls[i] === url) {
                        whitelistedUrls.splice(i, 1);
                        break;
                    }
                }
                chrome.storage.local.set({ whitelistedUrls });
            });
            return true;
        });

        siteDiv.appendChild(siteText);
        siteDiv.appendChild(deleteButton);
        whitelistedSites.appendChild(siteDiv);     
    }

    document.getElementById('exceptions-form').addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent the form from submitting the traditional way

        const exceptionValue = exceptionInput.value.trim();

        if (exceptionValue !== "") {
            chrome.storage.local.get('exceptedUrls', function(result) {
                let exceptedUrls = result.exceptedUrls;
                let matchFound = false;
                for (let i = 0; i < exceptedUrls.length; i++) {
                    if (exceptedUrls[i] === exceptionValue) {
                        matchFound = true;
                        break;
                    }
                }

                if (!matchFound) {
                    addExceptedSite(exceptionValue);
                    exceptedUrls.push(exceptionValue);
                    chrome.storage.local.set({ exceptedUrls });
                }
            });
            exceptionInput.value = ""; // Clear the input field
            chrome.runtime.sendMessage({ action: 'checkTabs' });
        }
    });

    function addExceptedSite(url) {
        const exceptedSites = document.getElementById('excepted-sites');

        const siteDiv = document.createElement('div');
        siteDiv.className = 'excepted-site';

        const siteText = document.createElement('span');
        siteText.textContent = url;

        const deleteButton = document.createElement('button');
        deleteButton.textContent = '✕';
        deleteButton.addEventListener('click', () => {
            exceptedSites.removeChild(siteDiv);
            chrome.storage.local.get('exceptedUrls', function(result) {
                let exceptedUrls = result.exceptedUrls;
                for (let i = 0; i < exceptedUrls.length; i++) {
                    if (exceptedUrls[i] === url) {
                        exceptedUrls.splice(i, 1);
                        break;
                    }
                }
                chrome.storage.local.set({ exceptedUrls });
            });
            return true;
        });

        siteDiv.appendChild(siteText);
        siteDiv.appendChild(deleteButton);
        exceptedSites.appendChild(siteDiv);     
    }

    // Timings Customization Code
    workValue.addEventListener("blur", function() {
        chrome.storage.local.get('workTime', function(result) {
            workTime = result.workTime;
            let value = workValue.value;
            if (value > 180 || value.includes('.') || value <= 0) {
                workValue.value = 20;
                value = 20;
            }
            workTime = value * 60;
        });
    })

    shortBreakValue.addEventListener("blur", function() {
        chrome.storage.local.get('shortBreakTime', function(result) {
            shortBreakTime = result.shortBreakTime;
            let value = shortBreakValue.value;
            if (value.includes('.') || value <= 0) {
                shortBreakValue.value = 5;
                value = 5;
            }
            shortBreakTime = value * 60;
        });
    })

    longBreakValue.addEventListener("blur", function() {
        chrome.storage.local.get('longBreakTime', function(result) {
            longBreakTime = result.longBreakTime;
            let value = longBreakValue.value;
            if (value.includes('.') || value <= 0) {
                longBreakValue.value = 15;
                value = 15;
            }
            longBreakTime = value * 60;
        });
    });

    // Other Settings Code
    chrome.storage.local.get(['strictBlocking', 'whitelistMode'], function(result) {
        if (result) {
            if (result.strictBlocking) {
                blockSwitch.checked = true;
            }
            if (result.whitelistMode) {
                whitelistSwitch.checked = true;
            }
        }
    });

    blockSwitch.addEventListener('change', function() {
        if (this.checked) {
            strictBlocking = true;
        } else {
            strictBlocking = false;
        }
    });

    whitelistSwitch.addEventListener('change', function() {
        if (this.checked) {
            whitelistMode = true;
        } else {
            whitelistMode = false;
        }
    });

    document.getElementById("apply-settings-button").addEventListener("click", function () {
        chrome.storage.local.set({ strictBlocking, whitelistMode, workTime, shortBreakTime, longBreakTime }, () => {
            chrome.runtime.sendMessage({ action: "reset" });
            chrome.runtime.sendMessage({ action: "checkTabs" });
        
            const button = this;
            button.textContent = "Apply Settings and Timings  ✔";
            setTimeout(() => {
                button.textContent = "Apply Settings and Timings";
            }, 2000);
        });
    });

    chrome.runtime.sendMessage({ action: 'checkTabs' });
});