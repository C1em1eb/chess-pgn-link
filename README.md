# ♟️ Chess PGN Link

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue.svg)](https://developer.chrome.com/docs/extensions/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Chess.com](https://img.shields.io/badge/Chess.com-Add%20Friend-green.svg)](https://www.chess.com/member/clemleb)
[![Lichess](https://img.shields.io/badge/Lichess-Follow-black.svg)](https://lichess.org/@/clemleb)

> Chrome extension to automatically export your Chess.com games to Lichess with instant analysis

Play on Chess.com, analyze on Lichess - in one click! This extension completely automates the process of exporting games between the two most popular chess platforms.

## ✨ Features

- 🎯 **One-click export**: "Analyze on Lichess" button appears automatically after each game
- 🚀 **Automatic import**: PGN is pasted and submitted automatically on Lichess
- 🤖 **Instant analysis**: Computer analysis starts automatically
- 📚 **Local history**: Saves your last 50 exported games
- 🎨 **Modern interface**: Elegant popup with dark theme
- 🔒 **Privacy**: All data stays local, no external servers

## 📸 Screenshots

### Button on Chess.com
After a finished game, a floating button appears in the bottom right:

```
┌──────────────────────────────┐
│  ⚡ Analyze on Lichess       │
└──────────────────────────────┘
```

### History Interface
Click the extension icon to see your recent games:

```
┌─────────────────────────────────────┐
│  Chess PGN Link - History          │
├─────────────────────────────────────┤
│  👤 clemleb vs Opponent             │
│  ✅ 1-0 • 5 minutes ago             │
│  [Analyze] [Copy PGN] [Delete]     │
├─────────────────────────────────────┤
│  👤 Player2 vs clemleb              │
│  ❌ 0-1 • 1 hour ago                │
│  [Analyze] [Copy PGN] [Delete]     │
└─────────────────────────────────────┘
```

## 📦 Installation

### Option 1: Developer Mode (Manual Installation)

1. **Download the extension**
   ```bash
   git clone https://github.com/C1em1eb/chess-pgn-link.git
   cd chess-pgn-link
   ```

2. **Open Chrome** and navigate to the extensions page:
   ```
   chrome://extensions/
   ```

3. **Enable Developer Mode**
   - Toggle in the top right of the page

4. **Load the extension**
   - Click "Load unpacked"
   - Select the `chess_pgn_link` folder

5. **You're ready!** 🎉
   - The extension icon appears in the Chrome toolbar

### Option 2: Chrome Web Store (Coming Soon)

_The extension will soon be available on the Chrome Web Store for one-click installation._

## 🎮 Usage

### Complete Workflow

1. **Play on Chess.com**
   - Rapid, blitz, bullet, or daily games
   - Also works on the analysis page

2. **Export to Lichess**
   - After the game, click the green "Analyze on Lichess" button
   - A new Lichess tab opens automatically

3. **Enjoy the analysis**
   - PGN is pasted automatically
   - Analysis starts instantly
   - No manual action required!

### History Management

1. **Access history**
   - Click the extension icon in the Chrome toolbar
   - View your last 50 games

2. **Available actions**
   - **Analyze**: Re-export a game to Lichess
   - **Copy PGN**: Copy PGN to clipboard
   - **Delete**: Remove a game from history

3. **Clear all**
   - "Clear history" button to delete everything

## 🏗️ Technical Architecture

### Project Structure

```
chess-pgn-link/
├── chess_pgn_link/            # Extension folder
│   ├── manifest.json          # Manifest V3 configuration
│   ├── background.js          # Service Worker (message hub)
│   ├── content-chess.js       # Chess.com script (PGN extraction)
│   ├── content-lichess.js     # Lichess script (automatic import)
│   ├── popup.html             # Popup interface
│   ├── popup.js               # History logic
│   ├── popup.css              # Popup styles (dark theme)
│   ├── styles.css             # Chess.com button styles
│   └── icons/                 # Visual resources
│       ├── icon16.png
│       ├── icon48.png
│       ├── icon128.png
│       └── generate-icons.js  # Icon generation script
├── LICENSE                    # MIT License
└── README.md                  # Documentation
```

### Technologies Used

| Technology | Usage |
|------------|-------|
| **Manifest V3** | Modern Chrome extension standard |
| **Service Worker** | Background management and communication |
| **Content Scripts** | Injection into Chess.com and Lichess |
| **Chrome Storage API** | Local data persistence |
| **MutationObserver** | Dynamic game detection |
| **Vanilla JavaScript** | No external dependencies |

### Data Flow

```
┌─────────────┐
│  Chess.com  │
│    (Game)   │
└──────┬──────┘
       │ 1. PGN Extraction
       ▼
┌─────────────┐
│   Content   │
│   Script    │──── 2. Message ────▶ ┌──────────────┐
│  Chess.com  │                      │   Service    │
└─────────────┘                      │   Worker     │
                                     └──────┬───────┘
                                            │ 3. Storage
                                            ▼
                                     ┌──────────────┐
                                     │ Chrome.local │
                                     │   Storage    │
                                     └──────┬───────┘
                                            │ 4. Retrieval
                                            ▼
┌─────────────┐                      ┌──────────────┐
│  Lichess    │◀──── 5. Paste ────── │   Content    │
│  (Analysis) │       Auto-submit    │   Script     │
└─────────────┘                      │  Lichess.org │
                                     └──────────────┘
```

## 🔧 Development

### Prerequisites

- Google Chrome (version 88+)
- JavaScript ES6+ knowledge
- Familiarity with Chrome extensions

### Development Installation

```bash
# Clone the repo
git clone https://github.com/C1em1eb/chess-pgn-link.git
cd chess-pgn-link

# No dependencies to install (vanilla JS)
# Load directly into Chrome
```

### Debugging

#### Background Service Worker
```
1. Go to chrome://extensions/
2. Find "Chess PGN Link"
3. Click "Inspect views: service worker"
4. Console with [Chess Export] logs
```

#### Content Scripts
```
Chess.com:
1. F12 on a Chess.com game page
2. Console > Filter: "[Chess Export]"

Lichess:
1. F12 on lichess.org/paste
2. Console > Filter: "[Lichess Import]"
```

#### Popup
```
1. Right-click the extension icon
2. "Inspect popup"
3. DevTools opens for the popup
```

### Key Code Points

#### 1. PGN Extraction (content-chess.js)

```javascript
// Multi-strategy to find PGN
function extractPGN() {
  // Method 1: Share menu textarea
  const textarea = document.querySelector('.share-menu-tab-pgn-textarea');

  // Method 2: Open menu automatically
  openShareMenu() → clickPGNTab() → extractPGN();

  // Method 3: Global DOM search
  document.querySelectorAll('textarea');
}
```

#### 2. Automatic Import (content-lichess.js)

```javascript
async function pastePGN(pgn) {
  // 1. Fill the textarea
  textarea.value = pgn;
  textarea.dispatchEvent(new Event('input'));

  // 2. Check "Request computer analysis"
  document.querySelector('#form3-analyse').click();

  // 3. Submit automatically
  document.querySelector('button.submit').click();
}
```

#### 3. Communication (background.js)

```javascript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'openLichess':
      chrome.storage.local.set({ pendingPGN: request.pgn });
      chrome.tabs.create({ url: 'https://lichess.org/paste' });
      break;
  }
});
```

## 🐛 Known Issues and Solutions

### Button doesn't appear on Chess.com

**Possible causes:**
- Game is not finished
- DOM is not fully loaded

**Solution:**
- Wait for the game to end
- Refresh the page (F5)
- Check console: `[Chess Export] Script initialized`

### PGN not pasted on Lichess

**Possible causes:**
- Expired PGN (> 60 seconds)
- Navigation too slow

**Solution:**
- Click "Analyze on Lichess" again
- Check chrome://extensions/ that the extension has permissions

### Analysis doesn't start automatically

**Possible causes:**
- Submit button not found
- Lichess changed its HTML structure

**Solution:**
- Check console: `[Lichess Import] Submit button clicked`
- Report the issue in GitHub Issues

## 🚀 Future Improvements

### Short term
- [ ] Support for Chess.com mobile mode
- [ ] Configuration options (delays, notifications)
- [ ] Export to FEN format
- [ ] Badge with daily game counter

### Medium term
- [ ] Multi-platform support (Chess24, ICC)
- [ ] Comparative engine analysis
- [ ] Personal opening statistics
- [ ] Cross-device synchronization

### Long term
- [ ] Firefox and Edge extensions
- [ ] Official Lichess API integration
- [ ] Offline mode with IndexedDB storage
- [ ] Game sharing via short URLs

## 🤝 Contributing

Contributions are welcome! Here's how to participate:

1. **Fork** the project
2. **Create** a branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add: Amazing Feature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Guidelines

- Code in vanilla JavaScript (no frameworks)
- Comments in English
- Variable names in English
- Respect existing structure
- Test on Chess.com and Lichess before PR

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Chess PGN Link

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

[...]
```

## 🙏 Acknowledgments

- **Chess.com** for their gaming platform
- **Lichess.org** for their open-source analysis engine
- **Stockfish** for the chess engine
- **Chrome DevRel** for Manifest V3 documentation
- **Claude Code** for AI-assisted development and debugging

## 📞 Support

- 🐛 **Bugs**: [Open an issue](https://github.com/C1em1eb/chess-pgn-link/issues)
- 💡 **Suggestions**: [GitHub Discussions](https://github.com/C1em1eb/chess-pgn-link/discussions)

## 📊 Statistics

![GitHub stars](https://img.shields.io/github/stars/C1em1eb/chess-pgn-link?style=social)
![GitHub forks](https://img.shields.io/github/forks/C1em1eb/chess-pgn-link?style=social)
![GitHub issues](https://img.shields.io/github/issues/C1em1eb/chess-pgn-link)

---

<div align="center">

**Made with ❤️ for the chess community**

[⬆ Back to top](#-chess-pgn-link)

</div>
