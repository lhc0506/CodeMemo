const vscode = require("vscode");

class ReactPanel {
  static currentPanel;
  static VIEW_TYPE = "codeMemo"
  _disposables = [];
  _panel;

  constructor(extensionPath, column) {
    this._extensionPath = extensionPath;

    this._panel = vscode.window.createWebviewPanel(
      ReactPanel.VIEW_TYPE,
      "Code Memo",
      column || vscode.ViewColumn.One,
      {},
    );

    this._panel.webview.html = this._getWebviewContent();

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
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

  _getWebviewContent() {
    return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cat Coding</title>
    </head>
    <body>
      <div>This is Webivew!</div>
    </body>
  </html>`;
  }
}

module.exports = ReactPanel;
