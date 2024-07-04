document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('url-input');

    document.getElementById('block-form').addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent the form from submitting the traditional way

        const urlValue = urlInput.value.trim();
        console.log("Form submitted with URL:", urlValue);

        if (urlValue !== "") {
            addBlockedSite(urlValue);
            chrome.storage.local.get('urls', function(result) {
                if (chrome.runtime.lastError) {
                    console.error("Error retrieving urls:", chrome.runtime.lastError.message);
                    return;
                }

                let urls = result.urls || [];
                let matchFound = false;
                for (let i = 0; i < urls.length; i++) {
                    if (urls[i] === urlValue) {
                        matchFound = true;
                        break;
                    }
                }

                if (!matchFound) {
                    console.log("URL not found in the list, adding:", urlValue);
                    urls.push(urlValue);
                    chrome.storage.local.set({ urls }, function() {
                        if (chrome.runtime.lastError) {
                            console.error("Error setting urls:", chrome.runtime.lastError.message);
                        } else {
                            console.log("URLs list updated successfully:", urls);
                            console.log(urls);
                        }
                    });
                } else {
                    console.log("URL already exists in the list:", urlValue);
                }
                console.log("Updated URLs list:", urls);
            });

            urlInput.value = ""; // Clear the input field
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
                let urls = result.urls || [];
                for (let i = 0; i < urls.length; i++) {
                    if (urls[i] === url) {
                        urls.splice(i, 1);
                        break;
                    }
                }
                chrome.storage.local.set({ urls });
            });            
        });

        siteDiv.appendChild(siteText);
        siteDiv.appendChild(deleteButton);
        blockedSites.appendChild(siteDiv);
    }

    chrome.storage.local.get('urls', function(result) {
        let urls = result.urls || [];
        for (let i = 0; i < urls.length; i++) {
            addBlockedSite(urls[i]);
            console.log(urls[i]);
        }
    });
});