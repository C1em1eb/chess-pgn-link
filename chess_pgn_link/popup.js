// Popup Script - Game history management

// Cross-browser API compatibility
const api = typeof browser !== 'undefined' ? browser : chrome;

document.addEventListener('DOMContentLoaded', () => {
  loadHistory();
  setupEventListeners();
});

/**
 * Sets up event listeners
 */
function setupEventListeners() {
  // Clear history button
  document.getElementById('clearHistory').addEventListener('click', async () => {
    if (confirm('Do you really want to clear all history?')) {
      await api.storage.local.set({ gameHistory: [] });
      loadHistory();
      showToast('History cleared', 'success');
    }
  });
}

/**
 * Loads and displays game history
 */
async function loadHistory() {
  const historyList = document.getElementById('historyList');
  const emptyState = document.getElementById('emptyState');

  try {
    const result = await api.storage.local.get(['gameHistory']);
    const history = result.gameHistory || [];

    historyList.innerHTML = '';

    if (history.length === 0) {
      historyList.classList.add('hidden');
      emptyState.classList.remove('hidden');
      return;
    }

    historyList.classList.remove('hidden');
    emptyState.classList.add('hidden');

    const template = document.getElementById('historyItemTemplate');

    history.forEach(game => {
      const item = template.content.cloneNode(true);

      // Fill data
      item.querySelector('.white-player').textContent = truncate(game.white, 15);
      item.querySelector('.black-player').textContent = truncate(game.black, 15);

      const resultEl = item.querySelector('.result');
      const indicator = getResultIndicator(game.result);
      resultEl.textContent = indicator ? `${indicator} ${game.result}` : game.result;

      item.querySelector('.date').textContent = formatDate(game.date);

      // Set up buttons
      const historyItem = item.querySelector('.history-item');
      historyItem.dataset.id = game.id;

      item.querySelector('.btn-analyse').addEventListener('click', () => {
        analyseGame(game.pgn);
      });

      item.querySelector('.btn-copy').addEventListener('click', () => {
        copyPGN(game.pgn);
      });

      item.querySelector('.btn-delete').addEventListener('click', () => {
        deleteGame(game.id);
      });

      historyList.appendChild(item);
    });

  } catch (error) {
    console.error('History loading error:', error);
    historyList.innerHTML = '<div class="loading">Loading error</div>';
  }
}

/**
 * Analyzes a game on Lichess
 */
async function analyseGame(pgn) {
  await api.storage.local.set({
    pendingPGN: pgn,
    pendingTimestamp: Date.now()
  });

  api.tabs.create({
    url: 'https://lichess.org/paste',
    active: true
  });

  showToast('Opening Lichess...', 'success');
}

/**
 * Copies PGN to clipboard
 */
async function copyPGN(pgn) {
  try {
    await navigator.clipboard.writeText(pgn);
    showToast('PGN copied!', 'success');
  } catch (error) {
    console.error('Copy error:', error);
    showToast('Copy error', 'error');
  }
}

/**
 * Deletes a game from history
 */
async function deleteGame(id) {
  const result = await api.storage.local.get(['gameHistory']);
  const history = result.gameHistory || [];
  const filtered = history.filter(game => game.id !== id);

  await api.storage.local.set({ gameHistory: filtered });

  // Delete animation
  const item = document.querySelector(`.history-item[data-id="${id}"]`);
  if (item) {
    item.style.animation = 'slideOut 0.3s ease-in forwards';
    setTimeout(() => {
      loadHistory();
    }, 300);
  } else {
    loadHistory();
  }

  showToast('Game deleted', 'success');
}

/**
 * Formats a date
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;

  // Less than one hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return minutes <= 1 ? 'Just now' : `${minutes} min ago`;
  }

  // Less than one day
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }

  // Less than one week
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return days === 1 ? 'Yesterday' : `${days}d ago`;
  }

  // Full date format
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short'
  });
}

/**
 * Truncates text
 */
function truncate(text, maxLength) {
  if (!text) return 'Unknown';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

/**
 * Returns indicator (pastille) for result
 */
function getResultIndicator(result) {
  if (result === '1-0') return '⚪';      // White wins
  if (result === '0-1') return '⚫';      // Black wins
  if (result === '1/2-1/2') return '◐';  // Draw
  return '';
}

/**
 * Shows toast notification
 */
function showToast(message, type = 'info') {
  // Remove existing toasts
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideUp 0.3s ease-in reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// Add delete animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideOut {
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
