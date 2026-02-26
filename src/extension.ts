import * as vscode from 'vscode';
import { getWebviewContent } from './webviewContent';

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