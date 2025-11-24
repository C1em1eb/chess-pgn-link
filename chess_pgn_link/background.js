// Background Service Worker
// Manages communication between content scripts and storage

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'openLichess':
      openLichessWithPGN(request.pgn);
      sendResponse({ success: true });
      break;
      
    case 'getHistory':
      getGameHistory().then(history => sendResponse({ history }));
      return true; // Async response

    case 'clearHistory':
      clearGameHistory().then(() => sendResponse({ success: true }));
      return true;

    case 'deleteGame':
      deleteGameFromHistory(request.id).then(() => sendResponse({ success: true }));
      return true;
      
    case 'exportGame':
      exportGameToLichess(request.pgn);
      sendResponse({ success: true });
      break;
  }
});

/**
 * Opens Lichess with the PGN
 */
async function openLichessWithPGN(pgn) {
  // Store the PGN
  await chrome.storage.local.set({
    pendingPGN: pgn,
    pendingTimestamp: Date.now()
  });

  // Open Lichess tab
  chrome.tabs.create({
    url: 'https://lichess.org/paste',
    active: true
  });
}

/**
 * Retrieves game history
 */
async function getGameHistory() {
  const result = await chrome.storage.local.get(['gameHistory']);
  return result.gameHistory || [];
}

/**
 * Clears history
 */
async function clearGameHistory() {
  await chrome.storage.local.set({ gameHistory: [] });
}

/**
 * Deletes a game from history
 */
async function deleteGameFromHistory(id) {
  const history = await getGameHistory();
  const filtered = history.filter(game => game.id !== id);
  await chrome.storage.local.set({ gameHistory: filtered });
}

/**
 * Exports a game to Lichess from history
 */
function exportGameToLichess(pgn) {
  openLichessWithPGN(pgn);
}

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[Chess Export] Extension installed');
    // Initialize storage
    chrome.storage.local.set({
      gameHistory: [],
      settings: {
        autoAnalyse: true,
        showNotifications: true
      }
    });
  }
});

// Periodically clean up expired PGNs
chrome.alarms.create('cleanupPGN', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanupPGN') {
    chrome.storage.local.get(['pendingTimestamp'], (result) => {
      if (result.pendingTimestamp) {
        const age = Date.now() - result.pendingTimestamp;
        if (age > 60000) { // More than one minute
          chrome.storage.local.remove(['pendingPGN', 'pendingTimestamp']);
        }
      }
    });
  }
});

console.log('[Chess Export] Service worker started');
