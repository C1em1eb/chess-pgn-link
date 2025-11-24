// Background Service Worker
// Manages communication between content scripts and storage

// Cross-browser API compatibility
const api = typeof browser !== 'undefined' ? browser : chrome;

// Listen for messages from content scripts
api.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
  await api.storage.local.set({
    pendingPGN: pgn,
    pendingTimestamp: Date.now()
  });

  // Open Lichess tab
  api.tabs.create({
    url: 'https://lichess.org/paste',
    active: true
  });
}

/**
 * Retrieves game history
 */
async function getGameHistory() {
  const result = await api.storage.local.get(['gameHistory']);
  return result.gameHistory || [];
}

/**
 * Clears history
 */
async function clearGameHistory() {
  await api.storage.local.set({ gameHistory: [] });
}

/**
 * Deletes a game from history
 */
async function deleteGameFromHistory(id) {
  const history = await getGameHistory();
  const filtered = history.filter(game => game.id !== id);
  await api.storage.local.set({ gameHistory: filtered });
}

/**
 * Exports a game to Lichess from history
 */
function exportGameToLichess(pgn) {
  openLichessWithPGN(pgn);
}

// Listen for extension installation
api.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[Chess Export] Extension installed');
    // Initialize storage
    api.storage.local.set({
      gameHistory: [],
      settings: {
        autoAnalyse: true,
        showNotifications: true
      }
    });
  }
});

// Periodically clean up expired PGNs (Firefox-compatible)
setInterval(() => {
  api.storage.local.get(['pendingTimestamp'], (result) => {
    if (result.pendingTimestamp) {
      const age = Date.now() - result.pendingTimestamp;
      if (age > 60000) { // More than one minute
        api.storage.local.remove(['pendingPGN', 'pendingTimestamp']);
      }
    }
  });
}, 5 * 60 * 1000); // 5 minutes

console.log('[Chess Export] Service worker started');
