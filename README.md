# JSON/XML Viewer Plus 🚀

**JSON/XML Viewer Plus** is a powerful, developer-centric visualization tool for VS Code. Unlike standard viewers that replace your current file, this extension provides a dedicated, persistent dashboard to manage, compare, and manipulate multiple JSON and XML snippets simultaneously.

---

## ✨ Key Features

### 📂 Multi-Entry Management
Don't lose your previous work. Every time you paste a new snippet, it creates a new **Entry Card**. 
* **Name your entries:** Keep track of different API responses by giving them custom titles.
* **Timestamped logs:** Automatic timestamps tell you exactly when you inspected the data.
* **Cleanup:** Clear the entire dashboard or remove specific entries with a single click.

### 🔍 Deep Search & Auto-Expand
Finding nested data in massive structures is effortless. The built-in search allows you to:
* **Highlight all matches** within a specific entry.
* **Auto-Expand:** The viewer automatically opens collapsed tree nodes to reveal the results.
* **Smart Navigation:** Cycle through results with `Enter`; the view scrolls to the active match automatically.

### 📍 Intelligent Breadcrumbs
As you hover over any key or tag, the **Breadcrumb Bar** dynamically updates to show the full path (e.g., `root.orders[5].items[0].price`). 
* **Right-Click Power:** Use the custom context menu to **Copy Path** instantly for use in your code.

### 🛠️ Developer Toolkit
* **One-Click Minify:** Instantly copy a compact, single-line version of your data.
* **One-Click Save:** Export snippets directly to your PC with auto-generated, timestamped filenames.
* **Stay Open:** Use the "Keep Open" button to pin the viewer tab so it doesn't close when you navigate to other files.

---

## 🚀 How to Use

1. **Open the Viewer:** Click the `JSON/XML Viewer` icon in the **Status Bar** (bottom-left) or run `Open JSON Viewer` from the Command Palette (`Ctrl+Shift+P`).
2. **Paste & Parse:** Paste your raw JSON or XML into the top input box and hit **Enter**.
3. **Interact:** - Click `▼` to collapse or expand sections.
   - Hover over nodes to see the data path in the breadcrumb bar.
   - Use the **Find** box to locate specific values within a card.
   - Click the **Save** icon to download the snippet as a file.

---

## 🎨 Professional UI
* **VS Code Native Theming:** The interface automatically matches your active theme (Dark, Light, or High Contrast).
* **Cascadia Code Support:** Uses modern, readable monospaced fonts for clear data inspection.
* **Visual Cues:** Smooth flash animations on copy and color-coded badges for easy format identification.

---

## 📦 Installation

1. Open **VS Code**.
2. Go to the **Extensions** view (`Ctrl+Shift+X`).
3. Search for `json-viewer-plus`.
4. Click **Install**.

### Requirements
* VS Code version `^1.109.0`

---

## 🛠 Extension Settings & Commands

This extension contributes the following:

* `json-viewer-plus.open`: Opens the main viewer panel.
* **Status Bar Item**: A permanent shortcut in the bottom bar for quick access.

---

**Happy Debugging!** Made by [alonpe](https://github.com/alonpe).