// block site in current tab
const findURL = function changeURL(urls) {
    let current = window.location.hostname;
    chrome.storage.local.get('working', function(result) {
        let workStatus = result.working;
        if (workStatus) {
            for (let i = 0; i < urls.length; i++) {
                if (current.includes(urls[i])) {
                    window.location.replace(chrome.runtime.getURL("blocked/blocked.html"));
                }
            }
        }
    });
};

chrome.storage.local.get('urls', function(result) {
    findURL(result.urls);
});