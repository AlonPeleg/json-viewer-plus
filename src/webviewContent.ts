export function getWebviewContent() {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: var(--vscode-editor-font-family); color: var(--vscode-editor-foreground); background: var(--vscode-editor-background); padding: 0; margin: 0; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
            
            .tabs-header { display: flex; background: var(--vscode-editorGroupHeader-tabsBackground); border-bottom: 1px solid var(--vscode-panel-border); flex-shrink: 0; }
            .tab-link { padding: 8px 16px; cursor: pointer; color: var(--vscode-tab-inactiveForeground); border-right: 1px solid var(--vscode-panel-border); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
            .tab-link:hover { background: var(--vscode-tab-hoverBackground); }
            .tab-link.active { background: var(--vscode-tab-activeBackground); color: var(--vscode-tab-activeForeground); border-bottom: 1px solid var(--vscode-tab-activeBorder); }
            
            .tab-viewport { flex-grow: 1; overflow: hidden; position: relative; }
            .tab-pane { display: none; height: 100%; width: 100%; overflow-y: auto; padding: 15px; box-sizing: border-box; }
            .tab-pane.active { display: block; }

            .toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
            .btn-group { display: flex; gap: 10px; align-items: center; }
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
            .btn-convert svg { width: 16px; height: 16px; }
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
            @keyframes diff-flash { 0% { background: var(--vscode-editor-findMatchHighlightBackground); } 100% { background: transparent; } }
            .highlight-flash { animation: diff-flash 1.2s ease-out; }

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
            
            .compare-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; height: 300px; flex-shrink: 0; }
            .compare-col { display: flex; flex-direction: column; gap: 4px; }
            .compare-header { display: flex; justify-content: space-between; align-items: center; padding: 2px 4px; }
            .compare-label { font-size: 10px; text-transform: uppercase; opacity: 0.7; font-weight: bold; }
            
            .diff-output { margin-top: 15px; border: 1px solid var(--vscode-panel-border); padding: 10px; background: var(--vscode-editor-background); font-family: monospace; font-size: 12px; border-radius: 4px; overflow: auto; }
            .diff-line { padding: 4px 8px; border-radius: 2px; margin-bottom: 2px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 10px; transition: background 0.1s; }
            .diff-line:hover { background: var(--vscode-list-hoverBackground); }
            .diff-content-box { display: flex; align-items: center; gap: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .diff-icon { font-weight: bold; width: 12px; text-align: center; flex-shrink: 0; }
            
            .diff-added { background: rgba(78, 201, 176, 0.1); color: #4ec9b0; border-left: 3px solid #4ec9b0; }
            .diff-removed { background: rgba(244, 135, 113, 0.1); color: #f48771; border-left: 3px solid #f48771; }
            .diff-changed { background: rgba(220, 220, 170, 0.1); color: #dcdcaa; border-left: 3px solid #dcdcaa; }
            
            .diff-tag { font-size: 9px; font-weight: bold; text-transform: uppercase; opacity: 0.8; flex-shrink: 0; }
            .side-diff-container { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

            .switch-container { display: flex; align-items: center; gap: 6px; font-size: 11px; opacity: 0.8; cursor: pointer; user-select: none; }
            .switch { position: relative; display: inline-block; width: 28px; height: 16px; }
            .switch input { opacity: 0; width: 0; height: 0; }
            .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #444; transition: .2s; border-radius: 16px; }
            .slider:before { position: absolute; content: ""; height: 12px; width: 12px; left: 2px; bottom: 2px; background-color: white; transition: .2s; border-radius: 50%; }
            input:checked + .slider { background-color: #007acc; }
            input:checked + .slider:before { transform: translateX(12px); }
        </style>
    </head>
    <body>
        <div class="tabs-header">
            <div class="tab-link active" onclick="switchTab('viewer-pane', this)">Viewer</div>
            <div class="tab-link" onclick="switchTab('compare-pane', this)">Compare</div>
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
                    <div class="btn-group">
                        <label class="switch-container">
                            <span>Sync Scroll</span>
                            <div class="switch">
                                <input type="checkbox" id="syncScrollToggle" checked>
                                <span class="slider"></span>
                            </div>
                        </label>
                        <button id="toggleDiffView" class="btn btn-secondary" onclick="toggleDiffMode()">View: List</button>
                        <button class="btn" onclick="runCompare()">Compare Now</button>
                    </div>
                </div>
                <div class="compare-grid">
                    <div class="compare-col">
                        <div class="compare-header">
                            <span class="compare-label">Left Side</span>
                            <button class="btn btn-secondary" style="font-size: 9px; padding: 2px 6px;" onclick="beautifyCompare('compareLeft')">Beautify</button>
                        </div>
                        <textarea id="compareLeft" class="input-box" style="height: 100%;" placeholder="Original JSON..."></textarea>
                    </div>
                    <div class="compare-col">
                        <div class="compare-header">
                            <span class="compare-label">Right Side</span>
                            <button class="btn btn-secondary" style="font-size: 9px; padding: 2px 6px;" onclick="beautifyCompare('compareRight')">Beautify</button>
                        </div>
                        <textarea id="compareRight" class="input-box" style="height: 100%;" placeholder="Modified JSON..."></textarea>
                    </div>
                </div>
                <div id="compareResults" class="diff-output">Paste two JSON objects above and click Compare.</div>
            </div>
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            let isSideMode = false;

            // --- SYNC SCROLL ENGINE ---
            const leftScroll = document.getElementById('compareLeft');
            const rightScroll = document.getElementById('compareRight');
            let isSyncing = false;

            function handleSyncScroll(source, target) {
                if (!document.getElementById('syncScrollToggle').checked || isSyncing) return;
                isSyncing = true;
                const percentage = source.scrollTop / (source.scrollHeight - source.clientHeight);
                target.scrollTop = percentage * (target.scrollHeight - target.clientHeight);
                setTimeout(() => { isSyncing = false; }, 20);
            }

            leftScroll.addEventListener('scroll', () => handleSyncScroll(leftScroll, rightScroll));
            rightScroll.addEventListener('scroll', () => handleSyncScroll(rightScroll, leftScroll));

            function toggleDiffMode() {
                isSideMode = !isSideMode;
                const btn = document.getElementById('toggleDiffView');
                btn.textContent = isSideMode ? "View: Side-by-Side" : "View: List";
                runCompare();
            }

            function switchTab(paneId, element) {
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                document.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
                document.getElementById(paneId).classList.add('active');
                element.classList.add('active');
            }

            const saveIconSvg = \`<svg viewBox="0 0 16 16"><path d="M14 0H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zM4 1h8v4H4V1zm10 13H2V2h1v4h10V2h1v12zM5 10h6v3H5v-3z"/></svg>\`;
            const copyIconSvg = \`<svg viewBox="0 0 16 16"><path d="M4 4V1h11v11h-3v3H1V4h3zm10-2H5v9h9V2zM2 14h9V5H2v9z"/></svg>\`;
            const minifyIconSvg = \`<svg viewBox="0 0 16 16"><path d="M9 9h5v1H9V9zM2 9h5v1H2V9zM5 4h6v1H5V4zM2 12h12v1H2v-1zM2 6h12v1H2V6z"/></svg>\`;
            
            // --- CONVERSION ICONS ---
            const jsonIconSvg = \`<svg viewBox="0 0 24 24" fill="none" stroke="#f1c40f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3c-1.5 0-2 1-2 2v4.5c0 1.5-1 2-1 2.5 0 .5 1 1 1 2.5V19c0 1 1 2 2 2M16 3c1.5 0 2 1 2 2v4.5c0 1.5 1 2 1 2.5 0 .5-1 1-1 2.5V19c0 1-1 2-2 2" /></svg>\`;
            const xmlIconSvg = \`<svg viewBox="0 0 24 24" fill="none" stroke="#3498db" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m7 8-5 4 5 4M17 8l5 4-5 4" /></svg>\`;

            let currentMatches = [];
            let activeMatchIndex = -1;
            let lastRightClickPath = "";

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

            // --- IMPROVED DATA CONVERTERS ---
            function sanitizeXmlKey(key) {
                return key.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/^(\\d)/, '_$1');
            }

            function jsonToXml(obj, rootName = "root") {
                let xml = "";
                if (rootName === "root") xml = '<?xml version="1.0" encoding="UTF-8"?>\\n';
                
                const safeRoot = sanitizeXmlKey(rootName);
                xml += \`<\${safeRoot}>\`;

                if (Array.isArray(obj)) {
                    obj.forEach(item => {
                        xml += jsonToXml(item, "item").replace('<?xml version="1.0" encoding="UTF-8"?>\\n', '');
                    });
                } else if (typeof obj === "object" && obj !== null) {
                    for (let prop in obj) {
                        if (obj.hasOwnProperty(prop)) {
                            const safeProp = sanitizeXmlKey(prop);
                            if (Array.isArray(obj[prop])) {
                                obj[prop].forEach(item => {
                                    xml += jsonToXml(item, safeProp).replace('<?xml version="1.0" encoding="UTF-8"?>\\n', '');
                                });
                            } else if (typeof obj[prop] === "object" && obj[prop] !== null) {
                                xml += jsonToXml(obj[prop], safeProp).replace('<?xml version="1.0" encoding="UTF-8"?>\\n', '');
                            } else {
                                const val = String(obj[prop]).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                                xml += \`<\${safeProp}>\${val}</\${safeProp}>\`;
                            }
                        }
                    }
                } else {
                    xml += String(obj).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                }
                
                return xml + \`</\${safeRoot}>\`;
            }

            function xmlToJson(xml) {
                let obj = {};
                if (xml.nodeType === 1) { 
                    if (xml.attributes.length > 0) {
                        for (let j = 0; j < xml.attributes.length; j++) {
                            const attr = xml.attributes.item(j);
                            obj["@" + attr.nodeName] = attr.nodeValue;
                        }
                    }
                } else if (xml.nodeType === 3) { obj = xml.nodeValue; }
                if (xml.hasChildNodes()) {
                    for (let i = 0; i < xml.childNodes.length; i++) {
                        const item = xml.childNodes.item(i);
                        const nodeName = item.nodeName;
                        if (nodeName === "#text") {
                            const val = item.nodeValue.trim();
                            if (val) obj = val;
                            continue;
                        }
                        if (typeof(obj[nodeName]) === "undefined") {
                            obj[nodeName] = xmlToJson(item);
                        } else {
                            if (typeof(obj[nodeName].push) === "undefined") {
                                const old = obj[nodeName];
                                obj[nodeName] = [];
                                obj[nodeName].push(old);
                            }
                            obj[nodeName].push(xmlToJson(item));
                        }
                    }
                }
                return obj;
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
                            <div class="btn-icon btn-convert" title="Copy as \${type === 'json' ? 'XML' : 'JSON'}">\${type === 'json' ? xmlIconSvg : jsonIconSvg}</div>
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

                const convertBtn = entry.querySelector('.btn-convert');
                convertBtn.onclick = () => {
                    let result = "";
                    try {
                        if (type === 'json') {
                            result = jsonToXml(data);
                        } else {
                            const jsonObj = xmlToJson(data.documentElement);
                            result = JSON.stringify(jsonObj, null, 4);
                        }
                        navigator.clipboard.writeText(result).then(() => {
                            const originalSvg = convertBtn.innerHTML;
                            convertBtn.innerHTML = '<span style="color:#89d185; font-size:11px; font-weight:bold;">✓</span>';
                            setTimeout(() => convertBtn.innerHTML = originalSvg, 800);
                        });
                    } catch (e) { alert("Conversion Error: " + e.message); }
                };

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

            function beautifyCompare(id) {
                const el = document.getElementById(id);
                try {
                    const obj = JSON.parse(el.value);
                    el.value = JSON.stringify(obj, null, 4);
                } catch (e) { alert("Invalid JSON for beautifying"); }
            }

            function createDiffRow(d) {
                const div = document.createElement('div');
                div.className = 'diff-line diff-' + d.type;
                const contentBox = document.createElement('div');
                contentBox.className = 'diff-content-box';
                let icon = d.type === 'added' ? '+' : (d.type === 'removed' ? '-' : 'Δ');
                let displayVal = d.type === 'changed' ? d.newVal : d.val;
                contentBox.innerHTML = \`<span class="diff-icon">\${icon}</span> <span><b>\${d.path}</b>: \${JSON.stringify(displayVal)}</span>\`;
                const tag = document.createElement('span');
                tag.className = 'diff-tag';
                tag.textContent = '[' + d.type.toUpperCase() + ']';
                div.appendChild(contentBox);
                div.appendChild(tag);
                div.onclick = () => {
                    if (d.type === 'removed') scrollToDiffKey(d.key, 'compareLeft');
                    else if (d.type === 'added') scrollToDiffKey(d.key, 'compareRight');
                    else if (d.type === 'changed') {
                        scrollToDiffKey(d.key, 'compareLeft');
                        scrollToDiffKey(d.key, 'compareRight');
                    }
                };
                return div;
            }

            function runCompare() {
                const results = document.getElementById('compareResults');
                try {
                    const lVal = document.getElementById('compareLeft').value;
                    const rVal = document.getElementById('compareRight').value;
                    if (!lVal || !rVal) throw new Error("Please provide JSON in both boxes.");
                    const left = JSON.parse(lVal);
                    const right = JSON.parse(rVal);
                    results.innerHTML = "";
                    const diffs = findDiffs(left, right);
                    if (diffs.length === 0) {
                        results.innerHTML = "<div style='color:#89d185'>✅ Objects are identical.</div>";
                        return;
                    }
                    const header = document.createElement('div');
                    header.style.marginBottom = '10px';
                    header.style.fontWeight = 'bold';
                    header.textContent = \`Found \${diffs.length} difference(s):\`;
                    results.appendChild(header);
                    if (isSideMode) {
                        const sideContainer = document.createElement('div');
                        sideContainer.className = 'side-diff-container';
                        const leftCol = document.createElement('div');
                        const rightCol = document.createElement('div');
                        diffs.forEach(d => {
                            if (d.type === 'removed') {
                                leftCol.appendChild(createDiffRow(d));
                                rightCol.appendChild(document.createElement('div')).style.height = '24px'; 
                            } else if (d.type === 'added') {
                                leftCol.appendChild(document.createElement('div')).style.height = '24px';
                                rightCol.appendChild(createDiffRow(d));
                            } else if (d.type === 'changed') {
                                leftCol.appendChild(createDiffRow({type: 'removed', path: d.path, key: d.key, val: d.oldVal}));
                                rightCol.appendChild(createDiffRow({type: 'added', path: d.path, key: d.key, val: d.newVal}));
                            }
                        });
                        sideContainer.appendChild(leftCol);
                        sideContainer.appendChild(rightCol);
                        results.appendChild(sideContainer);
                    } else {
                        diffs.forEach(d => results.appendChild(createDiffRow(d)));
                    }
                } catch (e) { results.innerHTML = "<div style='color:var(--vscode-errorForeground)'>❌ Error: " + e.message + "</div>"; }
            }

            function findDiffs(obj1, obj2, path = "root") {
                let diffs = [];
                for (let key in obj1) {
                    const curPath = path + "." + key;
                    if (!(key in obj2)) {
                        diffs.push({type: 'removed', path: curPath, key: key, val: obj1[key]});
                    } else if (typeof obj1[key] === 'object' && obj1[key] !== null && typeof obj2[key] === 'object' && obj2[key] !== null) {
                        diffs = diffs.concat(findDiffs(obj1[key], obj2[key], curPath));
                    } else if (obj1[key] !== obj2[key]) {
                        diffs.push({type: 'changed', path: curPath, key: key, oldVal: obj1[key], newVal: obj2[key]});
                    }
                }
                for (let key in obj2) {
                    if (!(key in obj1)) {
                        diffs.push({type: 'added', path: path + "." + key, key: key, val: obj2[key]});
                    }
                }
                return diffs;
            }

            function scrollToDiffKey(key, textareaId) {
                const el = document.getElementById(textareaId);
                const text = el.value;
                const pattern = '"' + key + '"';
                const index = text.indexOf(pattern);
                if (index !== -1) {
                    el.focus();
                    el.setSelectionRange(index, index + pattern.length);
                    const lines = text.substr(0, index).split('\\n').length;
                    el.scrollTop = (lines - 4) * 18; 
                    el.classList.add('highlight-flash');
                    setTimeout(() => el.classList.remove('highlight-flash'), 1200);
                }
            }
        </script>
    </body>
    </html>`;
}