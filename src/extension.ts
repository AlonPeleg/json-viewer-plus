import * as vscode from 'vscode';

let panel: vscode.WebviewPanel | undefined;

export function activate(context: vscode.ExtensionContext) {
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.command = 'json-viewer-plus.open';
    statusBarItem.text = `$(json) JSON/XML Viewer`;
    statusBarItem.color = '#FFFFFF';
    statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    statusBarItem.tooltip = 'Click to open JSON/XML Viewer';
    statusBarItem.show();

    let disposable = vscode.commands.registerCommand('json-viewer-plus.open', () => {
        if (panel) {
            panel.reveal(vscode.ViewColumn.Beside);
        } else {
            panel = vscode.window.createWebviewPanel(
                'jsonViewer',
                'JSON/XML Viewer',
                vscode.ViewColumn.Beside,
                { enableScripts: true, retainContextWhenHidden: true }
            );

            panel.onDidDispose(() => { panel = undefined; }, null, context.subscriptions);
            panel.webview.html = getWebviewContent();

            panel.webview.onDidReceiveMessage(async message => {
                if (message.command === 'pinTab') {
                    vscode.commands.executeCommand('workbench.action.keepEditor');
                }

                if (message.command === 'saveFile') {
                    let { data, fileName, extension } = message;

                    if (!fileName || fileName.trim() === '') {
                        const now = new Date();
                        const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
                        const timeStr = now.getHours().toString().padStart(2, '0') +
                            now.getMinutes().toString().padStart(2, '0') +
                            now.getSeconds().toString().padStart(2, '0');
                        fileName = `Export_${dateStr}_${timeStr}`;
                    }

                    const path = require('path');
                    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
                    const defaultPath = vscode.Uri.file(path.join(homeDir, 'Desktop', fileName + '.' + extension));

                    const uri = await vscode.window.showSaveDialog({
                        defaultUri: defaultPath,
                        filters: { 'Files': [extension] }
                    });

                    if (uri) {
                        const content = extension === 'json' ? JSON.stringify(data, null, 4) : data;
                        await vscode.workspace.fs.writeFile(uri, Buffer.from(content));
                        vscode.window.showInformationMessage(`Saved: ${fileName}.${extension}`);
                    }
                }
            });
        }
    });

    context.subscriptions.push(statusBarItem, disposable);
}

function getWebviewContent() {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: var(--vscode-editor-font-family); color: var(--vscode-editor-foreground); background: var(--vscode-editor-background); padding: 0; margin: 0; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
            
            /* Tabs Styling */
            .tabs-header { display: flex; background: var(--vscode-editorGroupHeader-tabsBackground); border-bottom: 1px solid var(--vscode-panel-border); flex-shrink: 0; }
            .tab-link { padding: 8px 16px; cursor: pointer; color: var(--vscode-tab-inactiveForeground); border-right: 1px solid var(--vscode-panel-border); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
            .tab-link:hover { background: var(--vscode-tab-hoverBackground); }
            .tab-link.active { background: var(--vscode-tab-activeBackground); color: var(--vscode-tab-activeForeground); border-bottom: 1px solid var(--vscode-tab-activeBorder); }
            
            /* Content Containers */
            .tab-viewport { flex-grow: 1; overflow: hidden; position: relative; }
            .tab-pane { display: none; height: 100%; width: 100%; overflow-y: auto; padding: 15px; box-sizing: border-box; }
            .tab-pane.active { display: block; }

            /* Existing Styles */
            .toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
            .btn-group { display: flex; gap: 6px; align-items: center; }
            .btn { border: none; padding: 4px 10px; cursor: pointer; border-radius: 2px; font-size: 12px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
            .btn-secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
            .btn:hover { filter: brightness(1.2); }
            .btn-global-icon { background: transparent; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center; border-radius: 3px; opacity: 0.8; }
            .btn-global-icon:hover { background: var(--vscode-toolbar-hoverBackground); opacity: 1; }
            .btn-global-icon svg { width: 16px; height: 16px; fill: var(--vscode-foreground); }
            .input-box { width: 100%; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); padding: 10px; margin-bottom: 15px; font-family: monospace; border-radius: 4px; box-sizing: border-box; outline: none; }
            .entry { border: 1px solid var(--vscode-panel-border); margin-bottom: 15px; border-radius: 4px; overflow: hidden; background: var(--vscode-editor-background); display: flex; flex-direction: column; max-height: 80vh; }
            .header { background: var(--vscode-editor-lineHighlightBackground); padding: 4px 10px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--vscode-panel-border); flex-shrink: 0; }
            .master-toggle { cursor: pointer; font-size: 10px; width: 14px; display: inline-flex; justify-content: center; opacity: 0.7; user-select: none; }
            .entry.collapsed-entry .master-toggle { transform: rotate(-90deg); }
            .entry.collapsed-entry .content, .entry.collapsed-entry .breadcrumb-bar { display: none; }
            .time-tag { font-size: 10px; opacity: 0.6; font-family: monospace; white-space: nowrap; }
            .type-badge { font-size: 9px; padding: 1px 4px; border-radius: 3px; background: #569cd6; color: white; text-transform: uppercase; font-weight: bold; }
            .name-input { background: transparent; border: 1px solid transparent; color: var(--vscode-foreground); font-size: 11px; font-weight: bold; padding: 2px 4px; width: 150px; border-radius: 2px; }
            .name-input:hover { border-color: var(--vscode-input-border); }
            .name-input:focus { background: var(--vscode-input-background); border-color: var(--vscode-focusBorder); outline: none; }
            .actions { margin-left: auto; display: flex; align-items: center; gap: 6px; }
            .btn-icon { cursor: pointer; display: flex; align-items: center; padding: 4px; border-radius: 3px; opacity: 0.7; }
            .btn-icon:hover { background: var(--vscode-toolbar-hoverBackground); opacity: 1; }
            .btn-save svg { width: 16px; height: 16px; fill: #3794ef; }
            .btn-copy svg { width: 15px; height: 15px; fill: #cccccc; }
            .btn-minify svg { width: 16px; height: 16px; fill: #dcdcaa; }
            .search-container { display: flex; align-items: center; background: var(--vscode-input-background); border: 1px solid var(--vscode-input-border); border-radius: 2px; width: 180px; }
            .search-inline { width: 100%; background: transparent; color: var(--vscode-input-foreground); border: none; font-size: 11px; padding: 2px 6px; outline: none; }
            .search-counter { font-size: 10px; padding: 0 5px; opacity: 0.7; font-family: monospace; }
            .btn-delete { color: var(--vscode-errorForeground); cursor: pointer; font-weight: bold; font-size: 16px; line-height: 1; padding: 0 4px; opacity: 0.6; }
            .btn-delete:hover { opacity: 1; }
            .breadcrumb-bar { position: sticky; top: 0; z-index: 20; background: var(--vscode-editor-background); border-bottom: 1px solid var(--vscode-panel-border); padding: 4px 12px; font-size: 10px; font-family: monospace; color: var(--vscode-textLink-foreground); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
            .breadcrumb-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .content { padding: 12px; font-family: "Cascadia Code", "Consolas", monospace; font-size: 13px; overflow: auto; line-height: 1.4; transition: background-color 0.2s; flex-grow: 1; }
            @keyframes flash-pulse { 0% { background-color: rgba(55, 148, 239, 0.4); } 100% { background-color: transparent; } }
            .flash-active { animation: flash-pulse 0.6s ease-out; }
            .json-node { margin: 0; position: relative; }
            .json-tree { padding-left: 18px; border-left: 1px solid #404040; margin-left: 6px; }
            .toggle { cursor: pointer; width: 14px; height: 14px; display: inline-flex; align-items: center; justify-content: center; font-size: 9px; color: #808080; }
            .toggle::before { content: '▼'; }
            .collapsed > .header-line > .toggle::before { content: '▶'; }
            .collapsed > .json-tree, .collapsed > .footer { display: none; }
            .collapsed > .header-line::after { content: ' ... }'; color: #808080; }
            .collapsed.is-array > .header-line::after { content: ' ... ]'; }
            .key { color: #9cdcfe; } .string { color: #ce9178; } .number { color: #b5cea8; } .boolean, .null { color: #569cd6; }
            .match { background-color: rgba(151, 121, 0, 0.4); border-radius: 1px; }
            .match.current { background-color: #f7d75c; color: #000; border: 1px solid #ffaa00; font-weight: bold; }
            #custom-context-menu { position: fixed; z-index: 10000; background: var(--vscode-menu-background); color: var(--vscode-menu-foreground); border: 1px solid var(--vscode-menu-border); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4); border-radius: 5px; padding: 4px 0; display: none; min-width: 160px; font-size: 12px; user-select: none; }
            .ctx-item { padding: 6px 12px; cursor: pointer; display: flex; justify-content: space-between; }
            .ctx-item:hover { background: var(--vscode-menu-selectionBackground); color: var(--vscode-menu-selectionForeground); }
            .ctx-divider { height: 1px; background: var(--vscode-menu-separatorBackground); margin: 4px 0; }
            .ctx-shortcut { opacity: 0.5; font-size: 11px; margin-left: 20px; }
            .xml-tag { color: #569cd6; } .xml-attr { color: #9cdcfe; } .xml-text { color: var(--vscode-foreground); }
            
            /* Compare Specific Styles */
            .compare-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; height: 250px; flex-shrink: 0; }
            .diff-output { margin-top: 15px; border: 1px solid var(--vscode-panel-border); padding: 10px; background: var(--vscode-editor-background); font-family: monospace; font-size: 12px; border-radius: 4px; overflow: auto; }
            .diff-line { padding: 2px 4px; border-radius: 2px; margin-bottom: 2px; }
            .diff-added { background: rgba(78, 201, 176, 0.15); color: #4ec9b0; }
            .diff-removed { background: rgba(244, 135, 113, 0.15); color: #f48771; }
        </style>
    </head>
    <body>
        <div class="tabs-header">
            <div class="tab-link active" onclick="switchTab('viewer-pane', this)">Viewer</div>
            <div class="tab-link" onclick="switchTab('compare-pane', this)">Compare JSON</div>
        </div>

        <div class="tab-viewport">
            <div id="viewer-pane" class="tab-pane active">
                <div id="custom-context-menu">
                    <div class="ctx-item" onclick="execCommand('cut')">Cut <span class="ctx-shortcut">Ctrl+X</span></div>
                    <div class="ctx-item" onclick="execCommand('copy')">Copy <span class="ctx-shortcut">Ctrl+C</span></div>
                    <div class="ctx-item" onclick="execCommand('paste')">Paste <span class="ctx-shortcut">Ctrl+V</span></div>
                    <div class="ctx-divider"></div>
                    <div class="ctx-item" id="ctx-copy-path">Copy Path</div>
                </div>
                <div class="toolbar">
                    <h3 style="margin:0">JSON/XML Viewer</h3>
                    <div class="btn-group">
                        <button class="btn-global-icon" title="Collapse All" onclick="setAllCollapse(true)">
                            <svg viewBox="0 0 16 16"><path d="M9 9H5V5h4v4zm5-7H2v12h12V2zM3 13V3h10v10H3z"/></svg>
                        </button>
                        <button class="btn-global-icon" title="Expand All" onclick="setAllCollapse(false)">
                            <svg viewBox="0 0 16 16"><path d="M11 11H5V5h6v6zm3-9H2v12h12V2zM3 13V3h10v10H3z"/></svg>
                        </button>
                        <button class="btn" onclick="vscode.postMessage({command:'pinTab'})">Keep Open</button>
                        <button class="btn btn-secondary" onclick="document.getElementById('container').innerHTML=''">Clear All</button>
                    </div>
                </div>
                <textarea class="input-box" id="jsonInput" rows="3" placeholder="Paste JSON or XML here and press Enter..." autofocus></textarea>
                <div id="container"></div>
            </div>

            <div id="compare-pane" class="tab-pane">
                <div class="toolbar">
                    <h3 style="margin:0">Object Compare</h3>
                    <button class="btn" onclick="runCompare()">Compare Now</button>
                </div>
                <div class="compare-grid">
                    <textarea id="compareLeft" class="input-box" placeholder="Original JSON..."></textarea>
                    <textarea id="compareRight" class="input-box" placeholder="Modified JSON..."></textarea>
                </div>
                <div id="compareResults" class="diff-output">Paste two JSON objects above to see differences.</div>
            </div>
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            
            // Tab Switching Logic
            function switchTab(paneId, element) {
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                document.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
                document.getElementById(paneId).classList.add('active');
                element.classList.add('active');
            }

            // Existing Icons
            const saveIconSvg = \`<svg viewBox="0 0 16 16"><path d="M14 0H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zM4 1h8v4H4V1zm10 13H2V2h1v4h10V2h1v12zM5 10h6v3H5v-3z"/></svg>\`;
            const copyIconSvg = \`<svg viewBox="0 0 16 16"><path d="M4 4V1h11v11h-3v3H1V4h3zm10-2H5v9h9V2zM2 14h9V5H2v9z"/></svg>\`;
            const minifyIconSvg = \`<svg viewBox="0 0 16 16"><path d="M9 9h5v1H9V9zM2 9h5v1H2V9zM5 4h6v1H5V4zM2 12h12v1H2v-1zM2 6h12v1H2V6z"/></svg>\`;

            let currentMatches = [];
            let activeMatchIndex = -1;
            let lastRightClickPath = "";

            // --- EXISTING VIEWER LOGIC ---
            function setAllCollapse(collapsed) {
                document.querySelectorAll('.entry').forEach(entry => {
                    collapsed ? entry.classList.add('collapsed-entry') : entry.classList.remove('collapsed-entry');
                });
            }

            document.getElementById('jsonInput').addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey && e.target.value.trim()) {
                    e.preventDefault();
                    processInput(e.target.value.trim());
                    e.target.value = '';
                }
            });

            function processInput(raw) {
                if (raw.startsWith('{') || raw.startsWith('[')) {
                    try {
                        addEntry(JSON.parse(raw), 'json', raw);
                        return;
                    } catch (e) {}
                }
                try {
                    const xmlDoc = new DOMParser().parseFromString(raw, "text/xml");
                    if (xmlDoc.getElementsByTagName("parsererror").length > 0) throw new Error("XML Parse Error");
                    addEntry(xmlDoc, 'xml', raw);
                } catch (err) { alert('Invalid Format: ' + err.message); }
            }

            function addEntry(data, type, rawString) {
                const entry = document.createElement('div');
                entry.className = 'entry';
                const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                
                entry.innerHTML = \`
                    <div class="header">
                        <span class="master-toggle" onclick="this.closest('.entry').classList.toggle('collapsed-entry')">▼</span>
                        <span class="time-tag">\${time}</span>
                        <span class="type-badge" style="background:\${type === 'json' ? '#4ec9b0' : '#569cd6'}">\${type}</span>
                        <input type="text" class="name-input" placeholder="Name this entry...">
                        <div class="actions">
                            <div class="btn-icon btn-minify" title="Copy Minified (Unbeautified)">\${minifyIconSvg}</div>
                            <div class="btn-icon btn-copy" title="Copy Raw">\${copyIconSvg}</div>
                            <div class="btn-icon btn-save" title="Save to PC">\${saveIconSvg}</div>
                        </div>
                        <div class="search-container">
                            <input type="text" class="search-inline" placeholder="Find..." oninput="initSearch(this)" onkeydown="navigateSearch(event, this)">
                            <span class="search-counter">0/0</span>
                        </div>
                        <div class="btn-delete" title="Remove" onclick="this.closest('.entry').remove()">×</div>
                    </div>
                    <div class="breadcrumb-bar"><span class="breadcrumb-text">root</span></div>
                    <div class="content"></div>\`;

                const copyBtn = entry.querySelector('.btn-copy');
                copyBtn.onclick = () => {
                    const text = type === 'json' ? JSON.stringify(data, null, 4) : rawString;
                    navigator.clipboard.writeText(text).then(() => {
                        const originalSvg = copyBtn.innerHTML;
                        copyBtn.innerHTML = '<span style="color:#89d185; font-size:11px; font-weight:bold;">✓</span>';
                        const contentBox = entry.querySelector('.content');
                        contentBox.classList.add('flash-active');
                        setTimeout(() => {
                            copyBtn.innerHTML = originalSvg;
                            contentBox.classList.remove('flash-active');
                        }, 600);
                    });
                };

                const minifyBtn = entry.querySelector('.btn-minify');
                minifyBtn.onclick = () => {
                    let text = type === 'json' ? JSON.stringify(data) : rawString.replace(/>\\s+</g, '><').trim();
                    navigator.clipboard.writeText(text).then(() => {
                        const originalSvg = minifyBtn.innerHTML;
                        minifyBtn.innerHTML = '<span style="color:#89d185; font-size:11px; font-weight:bold;">✓</span>';
                        const contentBox = entry.querySelector('.content');
                        contentBox.classList.add('flash-active');
                        setTimeout(() => {
                            minifyBtn.innerHTML = originalSvg;
                            contentBox.classList.remove('flash-active');
                        }, 600);
                    });
                };

                entry.querySelector('.btn-save').onclick = () => {
                    const name = entry.querySelector('.name-input').value.trim();
                    let dataToSave = type === 'json' ? data : new XMLSerializer().serializeToString(data);
                    vscode.postMessage({ command: 'saveFile', data: dataToSave, fileName: name, extension: type });
                };

                const contentArea = entry.querySelector('.content');
                contentArea.appendChild(type === 'json' ? renderTree(data, null, 'root') : renderXmlTree(data.documentElement, 'root'));
                document.getElementById('container').prepend(entry);
            }

            function renderTree(data, key = null, path = '') {
                const node = document.createElement('div');
                node.className = 'json-node';
                const isObj = data !== null && typeof data === 'object';
                const isArray = Array.isArray(data);
                const line = document.createElement('div');
                line.className = 'header-line';

                line.oncontextmenu = (e) => { e.preventDefault(); e.stopPropagation(); showMenu(e, path); };
                line.onmouseenter = (e) => {
                    e.stopPropagation();
                    const b = line.closest('.entry').querySelector('.breadcrumb-text');
                    if (b) b.textContent = path;
                };

                const toggleSpan = document.createElement('span');
                if (isObj) {
                    node.classList.add(isArray ? 'is-array' : 'is-object');
                    toggleSpan.className = 'toggle';
                    toggleSpan.onclick = () => node.classList.toggle('collapsed');
                } else {
                    toggleSpan.style.display = 'inline-block'; toggleSpan.style.width = '14px';
                }
                line.appendChild(toggleSpan);

                if (key !== null) {
                    const k = document.createElement('span');
                    k.className = 'key'; k.textContent = '"' + key + '": ';
                    line.appendChild(k);
                }

                if (isObj) {
                    line.append(isArray ? '[' : '{');
                    node.appendChild(line);
                    const tree = document.createElement('div');
                    tree.className = 'json-tree';
                    if (isArray) data.forEach((item, i) => tree.appendChild(renderTree(item, null, path + '[' + i + ']')));
                    else Object.keys(data).forEach(k => tree.appendChild(renderTree(data[k], k, path + '.' + k)));
                    node.appendChild(tree);
                    const f = document.createElement('div');
                    f.className = 'footer'; f.style.paddingLeft = '18px';
                    f.textContent = isArray ? ']' : '}';
                    node.appendChild(f);
                } else {
                    const v = document.createElement('span');
                    v.className = data === null ? 'null' : typeof data;
                    v.textContent = typeof data === 'string' ? '"' + data + '"' : String(data);
                    line.appendChild(v);
                    node.appendChild(line);
                }
                return node;
            }

            function renderXmlTree(node, path) {
                const div = document.createElement('div');
                div.className = 'json-node';
                const line = document.createElement('div');
                line.className = 'header-line';

                line.oncontextmenu = (e) => { e.preventDefault(); e.stopPropagation(); showMenu(e, path); };
                line.onmouseenter = (e) => {
                    e.stopPropagation();
                    const b = line.closest('.entry').querySelector('.breadcrumb-text');
                    if (b) b.textContent = path;
                };

                const hasChildren = node.children.length > 0;
                const toggleSpan = document.createElement('span');
                if (hasChildren) {
                    toggleSpan.className = 'toggle';
                    toggleSpan.onclick = () => div.classList.toggle('collapsed');
                } else {
                    toggleSpan.style.display = 'inline-block'; toggleSpan.style.width = '14px';
                }
                line.appendChild(toggleSpan);

                const tagOpen = document.createElement('span');
                tagOpen.className = 'xml-tag';
                tagOpen.textContent = '<' + node.tagName;
                line.appendChild(tagOpen);

                Array.from(node.attributes).forEach(attr => {
                    const a = document.createElement('span');
                    a.innerHTML = \` <span class="xml-attr">\${attr.name}</span>="<span class="string">\${attr.value}</span>"\`;
                    line.appendChild(a);
                });
                line.append('>');

                if (!hasChildren && node.textContent) {
                    const txt = document.createElement('span');
                    txt.className = 'xml-text'; txt.textContent = node.textContent;
                    line.appendChild(txt);
                    const tagClose = document.createElement('span');
                    tagClose.className = 'xml-tag'; tagClose.textContent = '</' + node.tagName + '>';
                    line.appendChild(tagClose);
                    div.appendChild(line);
                } else if (hasChildren) {
                    div.appendChild(line);
                    const tree = document.createElement('div');
                    tree.className = 'json-tree';
                    Array.from(node.children).forEach(child => tree.appendChild(renderXmlTree(child, path + '.' + child.tagName)));
                    div.appendChild(tree);
                    const footer = document.createElement('div');
                    footer.className = 'footer'; footer.style.paddingLeft = '18px';
                    footer.innerHTML = \`<span class="xml-tag">&lt;/\${node.tagName}&gt;</span>\`;
                    div.appendChild(footer);
                } else {
                    div.appendChild(line);
                }
                return div;
            }

            function initSearch(input) {
                const query = input.value.toLowerCase();
                const container = input.closest('.entry');
                const content = container.querySelector('.content');
                const counter = container.querySelector('.search-counter');
                
                content.querySelectorAll('.match').forEach(m => m.replaceWith(document.createTextNode(m.textContent)));
                content.normalize(); 
                currentMatches = [];
                activeMatchIndex = -1;

                if (!query) { counter.textContent = "0/0"; return; }

                const walk = document.createTreeWalker(content, NodeFilter.SHOW_TEXT, null, false);
                let n, nodes = [];
                while(n = walk.nextNode()) nodes.push(n);

                nodes.forEach(node => {
                    let val = node.nodeValue;
                    let lowerVal = val.toLowerCase();
                    let index, startPos = 0;
                    while ((index = lowerVal.indexOf(query, startPos)) !== -1) {
                        const span = document.createElement('span');
                        span.className = 'match';
                        span.textContent = val.substring(index, index + query.length);
                        const remainingText = node.splitText(index);
                        remainingText.nodeValue = remainingText.nodeValue.substring(query.length);
                        node.parentNode.insertBefore(span, remainingText);
                        currentMatches.push(span);
                        node = remainingText;
                        val = node.nodeValue;
                        lowerVal = val.toLowerCase();
                    }
                });

                if (currentMatches.length > 0) {
                    activeMatchIndex = 0;
                    updateMatchHighlight(counter);
                } else { counter.textContent = "0/0"; }
            }

            function navigateSearch(e, input) {
                if (e.key === 'Enter' && currentMatches.length > 0) {
                    activeMatchIndex = (activeMatchIndex + 1) % currentMatches.length;
                    updateMatchHighlight(input.closest('.entry').querySelector('.search-counter'));
                }
            }

            function updateMatchHighlight(counter) {
                currentMatches.forEach(m => m.classList.remove('current'));
                const current = currentMatches[activeMatchIndex];
                if (!current) return;
                current.classList.add('current');
                const entry = current.closest('.entry');
                if (entry.classList.contains('collapsed-entry')) entry.classList.remove('collapsed-entry');
                let p = current.closest('.json-node.collapsed');
                while(p) { p.classList.remove('collapsed'); p = p.parentElement.closest('.json-node.collapsed'); }
                current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                counter.textContent = (activeMatchIndex + 1) + "/" + currentMatches.length;
            }

            function showMenu(e, path) {
                const menu = document.getElementById('custom-context-menu');
                lastRightClickPath = path;
                menu.style.display = 'block';
                menu.style.left = e.pageX + 'px';
                let top = e.pageY;
                if (top + menu.offsetHeight > window.innerHeight) top -= menu.offsetHeight;
                menu.style.top = top + 'px';
                const hide = () => { menu.style.display = 'none'; document.removeEventListener('click', hide); };
                setTimeout(() => document.addEventListener('click', hide), 0);
            }

            document.getElementById('ctx-copy-path').onclick = () => navigator.clipboard.writeText(lastRightClickPath);
            function execCommand(cmd) { document.execCommand(cmd); }

            // --- COMPARE LOGIC ---
            function runCompare() {
                const results = document.getElementById('compareResults');
                try {
                    const left = JSON.parse(document.getElementById('compareLeft').value);
                    const right = JSON.parse(document.getElementById('compareRight').value);
                    results.innerHTML = "";
                    
                    const diffs = findDiffs(left, right);
                    if (diffs.length === 0) {
                        results.innerHTML = "✅ Objects are identical.";
                    } else {
                        diffs.forEach(d => {
                            const div = document.createElement('div');
                            div.className = 'diff-line ' + (d.type === 'added' ? 'diff-added' : 'diff-removed');
                            div.textContent = \`[\${d.type.toUpperCase()}] \${d.path}: \${JSON.stringify(d.val)}\`;
                            results.appendChild(div);
                        });
                    }
                } catch (e) { results.innerHTML = "❌ Error: " + e.message; }
            }

            function findDiffs(obj1, obj2, path = "root") {
                let diffs = [];
                for (let key in obj1) {
                    const curPath = path + "." + key;
                    if (!(key in obj2)) diffs.push({type: 'removed', path: curPath, val: obj1[key]});
                    else if (typeof obj1[key] === 'object' && obj1[key] !== null) {
                        diffs = diffs.concat(findDiffs(obj1[key], obj2[key], curPath));
                    } else if (obj1[key] !== obj2[key]) {
                        diffs.push({type: 'changed', path: curPath, val: obj2[key]});
                    }
                }
                for (let key in obj2) {
                    if (!(key in obj1)) diffs.push({type: 'added', path: path + "." + key, val: obj2[key]});
                }
                return diffs;
            }
        </script>
    </body>
    </html>`;
}