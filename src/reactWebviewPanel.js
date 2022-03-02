const vscode = require("vscode");
const path = require("path");

class ReactPanel {
  static currentPanel;
  static VIEW_TYPE = "codeMemo";
  _disposables = [];
  static _panel;

  constructor(extensionPath, column) {
    this._extensionPath = extensionPath;

    this._panel = vscode.window.createWebviewPanel(
      ReactPanel.VIEW_TYPE,
      "Code Memo",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(this._extensionPath, "dist", "app")),
          vscode.Uri.file(path.join(this._extensionPath, "app")),
        ],
      },
    );

    const onDiskPath = vscode.Uri.file(
      path.join(extensionPath, "dist", "app", "bundle.js"),
    );

    const bundleUri = this._panel.webview.asWebviewUri(onDiskPath);

    this._panel.webview.html = this._getWebviewContent(bundleUri);

    this._panel.webview.onDidReceiveMessage(message =>
      this.receiveMessage(message),
    );

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    const workspaceFolders = vscode.workspace.workspaceFolders ?? [undefined];
    const workspacePath = workspaceFolders[0]?.uri.fsPath;
    const saveUri = vscode.Uri.file(
      path.join(workspacePath, ".vscode", "new.memo"),
    );

    loadFile.call(this, saveUri);
  }

  static createAndShow(extensionPath) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (ReactPanel.currentPanel) {
      ReactPanel.currentPanel._panel.reveal(column);
      return;
    }

    ReactPanel.currentPanel = new ReactPanel(
      extensionPath,
      column || vscode.ViewColumn.One,
    );
  }

  dispose() {
    ReactPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  _getWebviewContent(bundleScriptUri) {
    const nonce = getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cat Coding</title>
    </head>
    <body>
      <div id="root"></div>
      <script>
        const vscode = acquireVsCodeApi();
      </script>
      <script nonce="${nonce}" src="${bundleScriptUri}"></script>
    </body>
  </html>`;
  }

  async receiveMessage(message) {}
}

async function loadFile(saveUri) {
  let fileData = null;
  try {
    const buffer = await vscode.workspace.fs.readFile(saveUri);
    fileData = JSON.parse(buffer.toString());
    this._panel.webview.postMessage({ command: "load", data: fileData });
  } catch (error) {
    console.log("error", error);
  }
}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

module.exports = ReactPanel;
