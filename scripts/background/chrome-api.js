var ChromeAPI;

(function() {
  ChromeAPI = function() {}

  ChromeAPI.prototype = {
    getTabsForDomain: function(domain, callback) {
      var index = 0,
          filteredTabs = [];

      chrome.windows.getAll(function(windows) {
        windows.forEach(function(window) {
          chrome.tabs.query({windowId: window.id}, function(tabs) {
            index = index + 1;

            var foundTabs = tabs.filter(function(tab) {
              return tab.url.includes(domain);
            });

            filteredTabs = filteredTabs.concat(foundTabs);

            if(windows.length == index) {
              callback(filteredTabs);
            }
          });
        });
      });
    },

    orderTabsByLastFocus: function(tabs, callback) {
      var out = tabs;
      chrome.storage.local.get('tabMap', function(data) {
        tabs.forEach(function(tab, i) {
          var tabData = data.tabMap[tab.id];
          if(tabData) {
            out[i].lastFocusedAt = new Date(tabData.lastFocusedAt);
          } else {
            out[i].lastFocusedAt = new Date(new Date().getTime() - (60 * 60));
          }
        });

        out.sort(function(a,b) {
          if (a.lastFocusedAt.getTime() > b.lastFocusedAt.getTime())
            return -1;
          if (a.lastFocusedAt.getTime() < b.lastFocusedAt.getTime())
            return 1;
          return 0;
        });

        callback(out);
      });
    },

    getSimilarTabsForTab: function(tabId, callback) {
      chrome.tabs.get(tabId, function(tab) {
        var hostname = tab.url.match(/\w+:\/\/(.*?)\//)[0];
        this.getTabsForDomain(hostname, callback);
      }.bind(this));
    },

    highlightTab: function(tabId) {
      chrome.tabs.get(tabId, function(tab) {
        chrome.tabs.highlight({
          tabs: tab.index,
          windowId: tab.windowId
        });
      });
    },

    sendMessageToActiveTab: function(data) {
      chrome.tabs.query({active: true}, function(tabs) {
        if(tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, data, function(response) {});
        }
      });
    },

    requestFile: function(file, callback) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', chrome.extension.getURL(file), true);
      xhr.onload = function(e) {
        callback(this.status, this.response);
      };
      xhr.send();
    }
  };
})();
