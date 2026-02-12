import * as vscode from 'vscode';

let panel: vscode.WebviewPanel | undefined;

export function activate(context: vscode.ExtensionContext) {
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.command = 'json-viewer-plus.open';
    statusBarItem.text = `$(json) JSON Viewer`;
    statusBarItem.color = '#FFFFFF';
    statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    statusBarItem.tooltip = 'Click to open JSON Viewer';
    statusBarItem.show();

    let disposable = vscode.commands.registerCommand('json-viewer-plus.open', () => {
        if (panel) {
            panel.reveal(vscode.ViewColumn.One);
        } else {
            panel = vscode.window.createWebviewPanel(
                'jsonViewer',
                'JSON Viewer',
                vscode.ViewColumn.One,
                { enableScripts: true, retainContextWhenHidden: true }
            );

            panel.onDidDispose(() => { panel = undefined; }, null, context.subscriptions);
            panel.webview.html = getWebviewContent();

            panel.webview.onDidReceiveMessage(async message => {
                if (message.command === 'pinTab') {
                    vscode.commands.executeCommand('workbench.action.keepEditor');
                }

                if (message.command === 'saveJson') {
                    let { data, fileName } = message;

                    // 1. If no name was entered, generate a timestamped one
                    if (!fileName || fileName.trim() === 'data') {
                        const now = new Date();
                        const dateStr = now.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
                        const timeStr = now.getHours().toString().padStart(2, '0') +
                            now.getMinutes().toString().padStart(2, '0')+
                            now.getSeconds().toString().padStart(2, '0');      // HHMMSS
                        fileName = `JSON_${dateStr}_${timeStr}`;
                    }

                    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
                    const desktopPath = vscode.Uri.file(require('path').join(homeDir, 'Desktop', fileName + '.json'));

                    const uri = await vscode.window.showSaveDialog({
                        defaultUri: desktopPath,
                        filters: { 'JSON files': ['json'] }
                    });

                    if (uri) {
                        await vscode.workspace.fs.writeFile(uri, Buffer.from(JSON.stringify(data, null, 4)));
                        vscode.window.showInformationMessage(`Saved: ${fileName}.json`);
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
            body { font-family: var(--vscode-editor-font-family); color: var(--vscode-editor-foreground); background: var(--vscode-editor-background); padding: 15px; }
            .toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
            
            /* Main Toolbar Buttons */
            .btn-group { display: flex; gap: 6px; align-items: center; }
            .btn { border: none; padding: 4px 10px; cursor: pointer; border-radius: 2px; font-size: 12px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
            .btn-secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
            .btn:hover { filter: brightness(1.2); }

            /* Global Icon Buttons */
            .btn-global-icon { 
                background: transparent; 
                border: none; 
                cursor: pointer; 
                padding: 4px; 
                display: flex; 
                align-items: center; 
                border-radius: 3px;
                opacity: 0.8;
            }
            .btn-global-icon:hover { background: var(--vscode-toolbar-hoverBackground); opacity: 1; }
            .btn-global-icon svg { width: 16px; height: 16px; fill: var(--vscode-foreground); }

            .input-box { width: 100%; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); padding: 10px; margin-bottom: 15px; font-family: monospace; border-radius: 4px; box-sizing: border-box; outline: none; }
            .entry { border: 1px solid var(--vscode-panel-border); margin-bottom: 15px; border-radius: 4px; overflow: hidden; background: var(--vscode-editor-background); }
            .header { background: var(--vscode-editor-lineHighlightBackground); padding: 4px 10px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--vscode-panel-border); }
            
            .master-toggle { cursor: pointer; font-size: 10px; width: 14px; display: inline-flex; justify-content: center; opacity: 0.7; user-select: none; }
            .entry.collapsed-entry .master-toggle { transform: rotate(-90deg); }
            .entry.collapsed-entry .content { display: none; }
            
            .time-tag { font-size: 10px; opacity: 0.6; font-family: monospace; white-space: nowrap; }
            .name-input { background: transparent; border: 1px solid transparent; color: var(--vscode-foreground); font-size: 11px; font-weight: bold; padding: 2px 4px; width: 150px; border-radius: 2px; }
            .name-input:hover { border-color: var(--vscode-input-border); }
            .name-input:focus { background: var(--vscode-input-background); border-color: var(--vscode-focusBorder); outline: none; }

            .actions { margin-left: auto; display: flex; align-items: center; gap: 6px; }
            .btn-icon { cursor: pointer; display: flex; align-items: center; padding: 4px; border-radius: 3px; opacity: 0.7; }
            .btn-icon:hover { background: var(--vscode-toolbar-hoverBackground); opacity: 1; }
            .btn-save svg { width: 16px; height: 16px; fill: #3794ef; }
            .btn-copy svg { width: 15px; height: 15px; fill: #cccccc; }

            .search-container { display: flex; align-items: center; background: var(--vscode-input-background); border: 1px solid var(--vscode-input-border); border-radius: 2px; width: 180px; }
            .search-inline { width: 100%; background: transparent; color: var(--vscode-input-foreground); border: none; font-size: 11px; padding: 2px 6px; outline: none; }
            .search-counter { font-size: 10px; padding: 0 5px; opacity: 0.7; font-family: monospace; }
            .btn-delete { color: var(--vscode-errorForeground); cursor: pointer; font-weight: bold; font-size: 16px; line-height: 1; padding: 0 4px; opacity: 0.6; }
            .btn-delete:hover { opacity: 1; }
            
            .content { padding: 12px; font-family: "Cascadia Code", "Consolas", monospace; font-size: 13px; overflow-x: auto; line-height: 1.4; }
            .json-node { margin: 0; position: relative; }
            .json-tree { padding-left: 18px; border-left: 1px solid #404040; margin-left: 6px; }
            .toggle { cursor: pointer; width: 14px; height: 14px; display: inline-flex; align-items: center; justify-content: center; font-size: 9px; color: #808080; }
            .toggle::before { content: '▼'; }
            .collapsed > .header-line > .toggle::before { content: '▶'; }
            .collapsed > .json-tree, .collapsed > .footer { display: none; }
            .collapsed > .header-line::after { content: ' ... }'; color: #808080; }
            .collapsed.is-array > .header-line::after { content: ' ... ]'; }
            .key { color: #9cdcfe; }
            .string { color: #ce9178; }
            .number { color: #b5cea8; }
            .boolean, .null { color: #569cd6; }
            .match { background-color: rgba(151, 121, 0, 0.4); border-radius: 1px; }
            .match.current { background-color: #f7d75c; color: #000; border: 1px solid #ffaa00; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="toolbar">
            <h3 style="margin:0">JSON Viewer</h3>
            <div class="btn-group">
                <button class="btn-global-icon" title="Collapse All Entries" onclick="setAllCollapse(true)">
                    <svg viewBox="0 0 16 16"><path d="M9 9H5V5h4v4zm5-7H2v12h12V2zM3 13V3h10v10H3z"/></svg>
                </button>
                <button class="btn-global-icon" title="Expand All Entries" onclick="setAllCollapse(false)">
                    <svg viewBox="0 0 16 16"><path d="M11 11H5V5h6v6zm3-9H2v12h12V2zM3 13V3h10v10H3z"/></svg>
                </button>
                
                <button class="btn" onclick="vscode.postMessage({command:'pinTab'})">Keep Open</button>
                <button class="btn btn-secondary" onclick="document.getElementById('container').innerHTML=''">Clear All</button>
            </div>
        </div>
        <textarea class="input-box" id="jsonInput" rows="3" placeholder="Paste JSON here and press Enter..." autofocus></textarea>
        <div id="container"></div>

        <script>
            const vscode = acquireVsCodeApi();
            
            const saveIconSvg = \`<svg viewBox="0 0 16 16"><path d="M14 0H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zM4 1h8v4H4V1zm10 13H2V2h1v4h10V2h1v12zM5 10h6v3H5v-3z"/></svg>\`;
            const copyIconSvg = \`<svg viewBox="0 0 16 16"><path d="M4 4V1h11v11h-3v3H1V4h3zm10-2H5v9h9V2zM2 14h9V5H2v9z"/></svg>\`;

            function setAllCollapse(collapsed) {
                document.querySelectorAll('.entry').forEach(entry => {
                    if (collapsed) entry.classList.add('collapsed-entry');
                    else entry.classList.remove('collapsed-entry');
                });
            }

            // ... (keep addJsonEntry and rest of script logic as before) ...

            document.getElementById('jsonInput').addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey && e.target.value.trim()) {
                    e.preventDefault();
                    try {
                        const obj = JSON.parse(e.target.value);
                        addJsonEntry(obj);
                        e.target.value = '';
                    } catch (err) { alert('Invalid JSON: ' + err.message); }
                }
            });

            function addJsonEntry(obj) {
                const entry = document.createElement('div');
                entry.className = 'entry';
                const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                
                entry.innerHTML = \`
                    <div class="header">
                        <span class="master-toggle" onclick="this.closest('.entry').classList.toggle('collapsed-entry')">▼</span>
                        <span class="time-tag">\${time}</span>
                        <input type="text" class="name-input" placeholder="Name this JSON...">
                        
                        <div class="actions">
                            <div class="btn-icon btn-copy" title="Copy JSON">\${copyIconSvg}</div>
                            <div class="btn-icon btn-save" title="Save JSON to PC">\${saveIconSvg}</div>
                        </div>

                        <div class="search-container">
                            <input type="text" class="search-inline" placeholder="Find..." oninput="initSearch(this)" onkeydown="navigateSearch(event, this)">
                            <span class="search-counter">0/0</span>
                        </div>
                        <div class="btn-delete" title="Remove" onclick="this.closest('.entry').remove()">×</div>
                    </div>
                    <div class="content"></div>\`;

                entry.querySelector('.btn-copy').onclick = function() {
                    const jsonString = JSON.stringify(obj, null, 4);
                    navigator.clipboard.writeText(jsonString).then(() => {
                        const originalSvg = this.innerHTML;
                        this.innerHTML = '<span style="color:#89d185; font-size:11px; font-weight:bold;">✓</span>';
                        setTimeout(() => { this.innerHTML = originalSvg; }, 1000);
                    });
                };

                entry.querySelector('.btn-save').onclick = () => {
                    const name = entry.querySelector('.name-input').value.trim();
                    vscode.postMessage({ command: 'saveJson', data: obj, fileName: name });
                };

                entry.querySelector('.content').appendChild(renderTree(obj));
                document.getElementById('container').prepend(entry);
            }

            function renderTree(data, key = null) {
                const node = document.createElement('div');
                node.className = 'json-node';
                const isObj = data !== null && typeof data === 'object';
                const isArray = Array.isArray(data);
                const line = document.createElement('div');
                line.className = 'header-line';
                if (isObj) {
                    node.classList.add(isArray ? 'is-array' : 'is-object');
                    const t = document.createElement('span');
                    t.className = 'toggle';
                    t.onclick = () => node.classList.toggle('collapsed');
                    line.appendChild(t);
                } else {
                    const s = document.createElement('span');
                    s.style.display = 'inline-block'; s.style.width = '14px';
                    line.appendChild(s);
                }
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
                    if (isArray) data.forEach(item => tree.appendChild(renderTree(item, null)));
                    else Object.keys(data).forEach(k => tree.appendChild(renderTree(data[k], k)));
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
                    let startPos = 0;
                    let index;
                    while ((index = lowerVal.indexOf(query, startPos)) !== -1) {
                        const matchText = val.substring(index, index + query.length);
                        const span = document.createElement('span');
                        span.className = 'match';
                        span.textContent = matchText;
                        const remainingText = node.splitText(index);
                        remainingText.nodeValue = remainingText.nodeValue.substring(query.length);
                        node.parentNode.insertBefore(span, remainingText);
                        currentMatches.push(span);
                        node = remainingText;
                        val = node.nodeValue;
                        lowerVal = val.toLowerCase();
                        startPos = 0;
                    }
                });
                if (currentMatches.length > 0) {
                    activeMatchIndex = 0;
                    updateMatchHighlight(counter);
                } else {
                    counter.textContent = "0/0";
                }
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
                current.classList.add('current');
                const masterEntry = current.closest('.entry');
                if (masterEntry) masterEntry.classList.remove('collapsed-entry');
                let p = current.closest('.json-node.collapsed');
                while(p) { p.classList.remove('collapsed'); p = p.parentElement.closest('.json-node.collapsed'); }
                current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                counter.textContent = (activeMatchIndex + 1) + "/" + currentMatches.length;
            }
        </script>
    </body>
    </html>`;
}