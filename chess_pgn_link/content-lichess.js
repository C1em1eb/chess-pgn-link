// Content script for Lichess.org
// Automatically pastes PGN and prepares analysis

(function() {
  'use strict';

  // Avoid multiple executions
  if (window.lichessImportInitialized) return;
  window.lichessImportInitialized = true;

  console.log('[Lichess Import] Script initialized');

  const MAX_AGE_MS = 60000; // PGN expires after 1 minute

  /**
   * Waits for page to be fully loaded
   */
  function waitForPage() {
    return new Promise((resolve) => {
      // Wait for textarea to exist
      const checkTextarea = () => {
        const textarea = document.querySelector('#form3-pgn, textarea[name="pgn"]');
        if (textarea) {
          console.log('[Lichess Import] Textarea found');
          resolve(textarea);
        } else {
          setTimeout(checkTextarea, 100);
        }
      };
      checkTextarea();
    });
  }

  /**
   * Pastes PGN into form
   */
  async function pastePGN(pgn) {
    console.log('[Lichess Import] Pasting PGN...');

    // Find textarea
    const textarea = document.querySelector('#form3-pgn') ||
                     document.querySelector('textarea[name="pgn"]') ||
                     document.querySelector('textarea.form-control');

    if (!textarea) {
      console.error('[Lichess Import] Textarea not found');
      showNotification('Error: Text area not found', 'error');
      return false;
    }

    // Clear first
    textarea.value = '';

    // Small delay
    await new Promise(r => setTimeout(r, 50));

    // Paste PGN
    textarea.value = pgn;

    // Focus
    textarea.focus();

    // Trigger events so Lichess detects the change
    // Use native events
    textarea.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    textarea.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

    console.log('[Lichess Import] PGN pasted, length:', pgn.length);

    // Check "Request computer analysis"
    const analyseCheckbox = document.querySelector('#form3-analyse') ||
                            document.querySelector('input[name="analyse"]');
    if (analyseCheckbox && !analyseCheckbox.checked) {
      analyseCheckbox.click();
      console.log('[Lichess Import] Analysis checkbox checked');
    }

    // Wait a bit for Lichess to process the PGN
    await new Promise(r => setTimeout(r, 300));

    // Automatically click "Import" button
    const submitButton = document.querySelector('button.submit') ||
                         document.querySelector('button[type="submit"]') ||
                         document.querySelector('.form-actions button');

    if (submitButton) {
      submitButton.click();
      console.log('[Lichess Import] Import button clicked automatically');
      showNotification('PGN imported and analysis started automatically!', 'success');
    } else {
      console.error('[Lichess Import] Submit button not found');
      showNotification('PGN imported from Chess.com! Click "Import" to analyze.', 'success');
    }

    return true;
  }

  /**
   * Displays notification
   */
  function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.chess-export-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `chess-export-notification ${type}`;

    const colors = {
      success: '#629924',
      error: '#cc3333',
      info: '#3893e8'
    };

    Object.assign(notification.style, {
      position: 'fixed',
      top: '60px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '12px 24px',
      borderRadius: '4px',
      backgroundColor: colors[type] || colors.info,
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '14px',
      fontWeight: '500',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      zIndex: '999999',
      animation: 'lichessNotifIn 0.3s ease-out'
    });

    notification.textContent = message;

    // Add animation
    if (!document.querySelector('#lichess-import-styles')) {
      const style = document.createElement('style');
      style.id = 'lichess-import-styles';
      style.textContent = `
        @keyframes lichessNotifIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes lichessNotifOut {
          from { opacity: 1; transform: translateX(-50%) translateY(0); }
          to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      notification.style.animation = 'lichessNotifOut 0.3s ease-in forwards';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  /**
   * Checks and pastes pending PGN
   */
  async function checkAndPastePGN() {
    console.log('[Lichess Import] Checking for pending PGN...');

    try {
      // Wait for page to be ready
      await waitForPage();

      // Additional delay to be sure
      await new Promise(r => setTimeout(r, 300));

      // Get PGN from storage
      const result = await chrome.storage.local.get(['pendingPGN', 'pendingTimestamp']);

      if (!result.pendingPGN) {
        console.log('[Lichess Import] No pending PGN');
        return;
      }

      // Check age
      const age = Date.now() - (result.pendingTimestamp || 0);
      if (age > MAX_AGE_MS) {
        console.log('[Lichess Import] PGN expired');
        await chrome.storage.local.remove(['pendingPGN', 'pendingTimestamp']);
        return;
      }

      console.log('[Lichess Import] PGN found, age:', Math.round(age/1000), 'seconds');

      // Paste PGN
      const success = await pastePGN(result.pendingPGN);

      if (success) {
        // Clean up storage
        await chrome.storage.local.remove(['pendingPGN', 'pendingTimestamp']);
        console.log('[Lichess Import] Completed successfully');
      }

    } catch (error) {
      console.error('[Lichess Import] Error:', error);
    }
  }

  // Initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(checkAndPastePGN, 500);
    });
  } else {
    setTimeout(checkAndPastePGN, 500);
  }
})();
