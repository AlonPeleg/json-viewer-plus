import * as vscode from 'vscode';

let panel: vscode.WebviewPanel | undefined;

export function activate(context: vscode.ExtensionContext) {
    // 1. Create and show Status Bar Item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.command = 'json-viewer-plus.open';
    statusBarItem.text = `$(json) JSON Viewer`;
    statusBarItem.tooltip = 'Click to open JSON Viewer';
    statusBarItem.show();

    // 2. Register Open Command
    let disposable = vscode.commands.registerCommand('json-viewer-plus.open', () => {
        if (panel) {
            panel.reveal(vscode.ViewColumn.One);
        } else {
            panel = vscode.window.createWebviewPanel(
                'jsonViewer',
                'JSON Viewer',
                vscode.ViewColumn.One,
                { 
                    enableScripts: true, 
                    retainContextWhenHidden: true 
                }
            );

            panel.onDidDispose(() => { panel = undefined; }, null, context.subscriptions);
            panel.webview.html = getWebviewContent();
            
            panel.webview.onDidReceiveMessage(message => {
                if (message.command === 'pinTab') {
                    vscode.commands.executeCommand('workbench.action.keepEditor');
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
            .btn { border: none; padding: 4px 10px; cursor: pointer; border-radius: 2px; font-size: 12px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
            .input-box { width: 100%; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); padding: 8px; margin-bottom: 15px; font-family: monospace; border-radius: 4px; box-sizing: border-box; outline: none; }
            .input-box:focus { border-color: var(--vscode-focusBorder); }
            
            .entry { border: 1px solid var(--vscode-panel-border); margin-bottom: 15px; border-radius: 4px; overflow: hidden; background: var(--vscode-editor-background); }
            .header { background: var(--vscode-editor-lineHighlightBackground); padding: 6px 12px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid var(--vscode-panel-border); }
            
            .search-container { flex-grow: 1; display: flex; align-items: center; background: var(--vscode-input-background); border: 1px solid var(--vscode-input-border); border-radius: 2px; }
            .search-inline { width: 100%; background: transparent; color: var(--vscode-input-foreground); border: none; font-size: 12px; padding: 3px 8px; outline: none; }
            .search-counter { font-size: 11px; padding: 0 8px; opacity: 0.7; font-family: monospace; white-space: nowrap; }

            .btn-delete { color: var(--vscode-errorForeground); cursor: pointer; font-weight: bold; font-size: 18px; line-height: 1; padding: 0 5px; opacity: 0.6; }
            .content { padding: 12px; font-family: "Cascadia Code", "Consolas", monospace; font-size: 13px; overflow-x: auto; line-height: 1.5; }
            
            .json-node { margin: 0; position: relative; }
            .json-tree { padding-left: 18px; border-left: 1px solid #404040; margin-left: 6px; }
            .toggle { cursor: pointer; width: 14px; display: inline-block; text-align: center; font-size: 10px; color: #808080; }
            .toggle::before { content: '▼'; }
            .collapsed > .toggle::before { content: '▶'; }
            .collapsed > .json-tree, .collapsed > .footer { display: none; }

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
            <h3 style="margin:0">JSON Viewer Plus</h3>
            <div style="display:flex; gap:8px;">
                <button class="btn" onclick="vscode.postMessage({command:'pinTab'})">Keep Open</button>
                <button class="btn" style="background: var(--vscode-button-secondaryBackground);" onclick="document.getElementById('container').innerHTML=''">Clear All</button>
            </div>
        </div>
        <input type="text" class="input-box" id="jsonInput" placeholder="Paste JSON and press Enter..." autofocus />
        <div id="container"></div>

        <script>
            const vscode = acquireVsCodeApi();
            let activeMatchIndex = -1;
            let currentMatches = [];

            document.getElementById('jsonInput').addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
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
                entry.innerHTML = \`
                    <div class="header">
                        <div class="search-container">
                            <input type="text" class="search-inline" placeholder="Find..." oninput="initSearch(this)" onkeydown="navigateSearch(event, this)">
                            <span class="search-counter">0/0</span>
                        </div>
                        <div class="btn-delete" onclick="this.closest('.entry').remove()">×</div>
                    </div>
                    <div class="content"></div>\`;
                entry.querySelector('.content').appendChild(renderTree(obj));
                document.getElementById('container').prepend(entry);
            }

            function renderTree(data, key = null) {
                const node = document.createElement('div');
                node.className = 'json-node';
                const isObj = data !== null && typeof data === 'object';
                const isArray = Array.isArray(data);
                const line = document.createElement('div');

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
                    if (isArray) {
                        data.forEach(item => tree.appendChild(renderTree(item, null)));
                    } else {
                        Object.keys(data).forEach(k => tree.appendChild(renderTree(data[k], k)));
                    }
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
                
                // Clear old matches and NORMALIZE to fix the "one letter" issue
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
                
                let p = current.closest('.json-node.collapsed');
                while(p) { p.classList.remove('collapsed'); p = p.parentElement.closest('.json-node.collapsed'); }

                current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                counter.textContent = (activeMatchIndex + 1) + "/" + currentMatches.length;
            }
        </script>
    </body>
    </html>`;
}