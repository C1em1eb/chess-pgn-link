// Content script for Chess.com
// Injects "Analyze on Lichess" button and handles PGN export

(function() {
  'use strict';

  // Cross-browser API compatibility
  const api = typeof browser !== 'undefined' ? browser : chrome;

  // Avoid multiple injections
  if (window.chessExportInitialized) return;
  window.chessExportInitialized = true;

  // Configuration
  const LICHESS_PASTE_URL = 'https://lichess.org/paste';
  const BUTTON_ID = 'lichess-export-btn';

  console.log('[Chess Export] Script initialized on:', window.location.href);

  /**
   * Extracts PGN from page - main method
   */
  function extractPGN() {
    console.log('[Chess Export] Searching for PGN...');

    // Method 1: Share menu textarea (most reliable)
    const textareaSelectors = [
      'textarea.share-menu-tab-pgn-textarea',
      'textarea[name="pgn"]',
      'textarea[aria-label="PGN"]',
      '.share-menu-tab-pgn-textarea',
      'textarea.cc-textarea-component'
    ];

    for (const selector of textareaSelectors) {
      const textareas = document.querySelectorAll(selector);
      for (const textarea of textareas) {
        const pgn = textarea.value || textarea.getAttribute('value') || textarea.textContent;
        if (pgn && pgn.includes('[Event')) {
          console.log('[Chess Export] PGN found via:', selector);
          return cleanPGN(pgn);
        }
      }
    }

    // Method 2: Search entire DOM for textarea with PGN
    const allTextareas = document.querySelectorAll('textarea');
    for (const textarea of allTextareas) {
      const pgn = textarea.value || textarea.getAttribute('value');
      if (pgn && pgn.includes('[Event') && pgn.includes('[Site')) {
        console.log('[Chess Export] PGN found in generic textarea');
        return cleanPGN(pgn);
      }
    }

    console.log('[Chess Export] PGN not found directly');
    return null;
  }

  /**
   * Cleans PGN (decodes HTML entities, etc.)
   */
  function cleanPGN(pgn) {
    // Decode HTML entities
    const textarea = document.createElement('textarea');
    textarea.innerHTML = pgn;
    let cleaned = textarea.value;

    // Replace common entities
    cleaned = cleaned.replace(/&quot;/g, '"');
    cleaned = cleaned.replace(/&amp;/g, '&');
    cleaned = cleaned.replace(/&lt;/g, '<');
    cleaned = cleaned.replace(/&gt;/g, '>');

    return cleaned;
  }

  /**
   * Clicks PGN button in share menu if needed
   */
  async function clickPGNTab() {
    return new Promise((resolve) => {
      // Look for PGN tab
      const pgnTabSelectors = [
        '.share-menu-tab-selector-component[data-tab="pgn"]',
        '[data-cy="share-tab-pgn"]',
        '.share-menu-tab-selector-pgn',
        // Search by "PGN" text
      ];

      // Search all buttons/tabs containing "PGN"
      const allButtons = document.querySelectorAll('button, [role="tab"], .share-menu-tab-selector-component');
      for (const btn of allButtons) {
        if (btn.textContent?.includes('PGN') || btn.getAttribute('data-tab') === 'pgn') {
          console.log('[Chess Export] Clicking PGN tab');
          btn.click();
          setTimeout(resolve, 300);
          return;
        }
      }

      // Try direct selectors
      for (const selector of pgnTabSelectors) {
        const tab = document.querySelector(selector);
        if (tab) {
          console.log('[Chess Export] Clicking:', selector);
          tab.click();
          setTimeout(resolve, 300);
          return;
        }
      }

      resolve();
    });
  }

  /**
   * Opens share menu
   */
  async function openShareMenu() {
    return new Promise((resolve) => {
      const shareButtonSelectors = [
        '.share-game-button',
        '[data-cy="share-button"]',
        'button[aria-label*="Share"]',
        'button[aria-label*="Partager"]',
        '.game-over-share-button',
        '.share-button-component',
        // Look for button with share icon
      ];

      // Also search by text (support English and French)
      const allButtons = document.querySelectorAll('button');
      for (const btn of allButtons) {
        const text = btn.textContent?.toLowerCase() || '';
        const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
        if (text.includes('share') || text.includes('partager') ||
            ariaLabel.includes('share') || ariaLabel.includes('partager')) {
          console.log('[Chess Export] Clicking share button (by text)');
          btn.click();
          setTimeout(resolve, 500);
          return;
        }
      }

      for (const selector of shareButtonSelectors) {
        const btn = document.querySelector(selector);
        if (btn) {
          console.log('[Chess Export] Clicking:', selector);
          btn.click();
          setTimeout(resolve, 500);
          return;
        }
      }

      console.log('[Chess Export] Share button not found');
      resolve();
    });
  }

  /**
   * Gets PGN, opens menu if necessary
   */
  async function getPGN() {
    // Try directly first
    let pgn = extractPGN();
    if (pgn) return pgn;

    // Share menu might already be open but not on PGN
    await clickPGNTab();
    pgn = extractPGN();
    if (pgn) return pgn;

    // Open share menu
    await openShareMenu();

    // Wait and click on PGN
    await new Promise(r => setTimeout(r, 300));
    await clickPGNTab();

    // Retry
    await new Promise(r => setTimeout(r, 300));
    pgn = extractPGN();

    return pgn;
  }

  /**
   * Parses PGN headers
   */
  function parsePGNHeaders(pgn) {
    const headers = {};
    const headerRegex = /\[(\w+)\s+"([^"]+)"\]/g;
    let match;
    while ((match = headerRegex.exec(pgn)) !== null) {
      headers[match[1]] = match[2];
    }
    return headers;
  }

  /**
   * Saves to history
   */
  function saveToHistory(pgn) {
    const gameInfo = parsePGNHeaders(pgn);
    const historyEntry = {
      id: Date.now(),
      date: new Date().toISOString(),
      pgn: pgn,
      white: gameInfo.White || 'Unknown',
      black: gameInfo.Black || 'Unknown',
      result: gameInfo.Result || '*',
      site: 'Chess.com',
      event: gameInfo.Event || 'Game',
      url: window.location.href
    };

    api.storage.local.get(['gameHistory'], (result) => {
      const history = result.gameHistory || [];
      history.unshift(historyEntry);
      api.storage.local.set({ gameHistory: history.slice(0, 50) });
      console.log('[Chess Export] Saved to history');
    });
  }

  /**
   * Handles export button click
   */
  async function handleExport(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const button = document.getElementById(BUTTON_ID);
    if (!button || button.disabled) return;

    const originalHTML = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<span class="loading-spinner"></span> Extracting...';

    try {
      const pgn = await getPGN();

      if (!pgn) {
        throw new Error('PGN not found');
      }

      console.log('[Chess Export] PGN extracted, length:', pgn.length);

      // Save
      saveToHistory(pgn);

      // Send to Lichess
      await api.storage.local.set({
        pendingPGN: pgn,
        pendingTimestamp: Date.now()
      });

      // Open Lichess
      window.open(LICHESS_PASTE_URL, '_blank');

      button.innerHTML = '✓ Exported!';
      button.classList.add('success');

      setTimeout(() => {
        button.innerHTML = originalHTML;
        button.classList.remove('success');
        button.disabled = false;
      }, 2000);

    } catch (error) {
      console.error('[Chess Export] Error:', error);
      button.innerHTML = '✗ Error';
      button.classList.add('error');

      setTimeout(() => {
        button.innerHTML = originalHTML;
        button.classList.remove('error');
        button.disabled = false;
      }, 2000);
    }
  }

  /**
   * Creates floating button
   */
  function createButton() {
    if (document.getElementById(BUTTON_ID)) return;

    console.log('[Chess Export] Creating button');

    const button = document.createElement('button');
    button.id = BUTTON_ID;
    button.innerHTML = `
      <svg viewBox="0 0 50 50" width="18" height="18" style="margin-right: 6px; vertical-align: middle;">
        <path fill="currentColor" d="M25 2C12.3 2 2 12.3 2 25s10.3 23 23 23 23-10.3 23-23S37.7 2 25 2zm0 42C14.5 44 6 35.5 6 25S14.5 6 25 6s19 8.5 19 19-8.5 19-19 19z"/>
        <path fill="currentColor" d="M25 10c-1.7 0-3.1 1.4-3.1 3.1 0 .8.3 1.5.8 2.1l-6.5 13c-.3-.1-.6-.1-.9-.1-1.7 0-3.1 1.4-3.1 3.1s1.4 3.1 3.1 3.1c1.4 0 2.6-.9 3-2.2h11.4c.4 1.3 1.6 2.2 3 2.2 1.7 0 3.1-1.4 3.1-3.1s-1.4-3.1-3.1-3.1c-.3 0-.6 0-.9.1l-6.5-13c.5-.6.8-1.3.8-2.1 0-1.7-1.4-3.1-3.1-3.1z"/>
      </svg>
      Analyze on Lichess
    `;

    // Click handler with capture
    button.addEventListener('click', handleExport, true);

    document.body.appendChild(button);
    console.log('[Chess Export] Button created');
  }

  /**
   * Removes the button
   */
  function removeButton() {
    const button = document.getElementById(BUTTON_ID);
    if (button) {
      button.remove();
      console.log('[Chess Export] Button removed');
    }
  }

  /**
   * Checks if button should be shown
   */
  function shouldShowButton() {
    const url = window.location.href;

    // Finished game pages (any game URL)
    if (url.includes('/game/')) {
      // Check for game-over elements
      const gameOverIndicators = [
        '.game-over-modal',
        '.game-over-modal-content',
        '.game-over-buttons',
        '.game-review-buttons',
        '[class*="game-over"]',
        '.share-menu-component'
      ];

      for (const selector of gameOverIndicators) {
        if (document.querySelector(selector)) {
          return true;
        }
      }

      // Also check if PGN is already available
      if (extractPGN()) {
        return true;
      }
    }

    // Analysis page
    if (url.includes('/analysis/')) {
      return true;
    }

    return false;
  }

  /**
   * Initialization with DOM observation
   */
  function init() {
    console.log('[Chess Export] Initializing...');

    // Initial check
    if (shouldShowButton()) {
      createButton();
    }

    // Observe changes
    const observer = new MutationObserver(() => {
      const buttonExists = !!document.getElementById(BUTTON_ID);
      const shouldShow = shouldShowButton();

      if (buttonExists && !shouldShow) {
        // Button exists but shouldn't be shown anymore - remove it
        removeButton();
      } else if (!buttonExists && shouldShow) {
        // Button doesn't exist but should be shown - create it
        createButton();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    // Periodic check (backup) - runs indefinitely
    const interval = setInterval(() => {
      const buttonExists = !!document.getElementById(BUTTON_ID);
      const shouldShow = shouldShowButton();

      if (buttonExists && !shouldShow) {
        // Button exists but shouldn't be shown anymore - remove it
        removeButton();
      } else if (!buttonExists && shouldShow) {
        // Button doesn't exist but should be shown - create it
        createButton();
      }
    }, 1000);
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
