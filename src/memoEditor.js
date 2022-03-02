const vscode = require("vscode");

class MemoEditorProvider {
  static register(context) {
    const provider = new MemoEditorProvider(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      MemoEditorProvider.viewType,
      provider,
    );
    return providerRegistration;
  }

  static viewType = "memoCustoms.memo";
  constructor(context) {
    this.context = context;
  }

  async resolveCustomTextEditor(document, webviewPanel) {
    // Setup initial content for the webview
    webviewPanel.webview.options = {
      enableScripts: true,
    };

    webviewPanel.webview.html = this._getWebviewContent(webviewPanel.webview);

    function updateWebview() {
      webviewPanel.webview.postMessage({
        command: "update",
        data: JSON.parse(document.getText()),
      });
    }

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(
      event => {
        if (event.document.uri.toString() === document.uri.toString()) {
          updateWebview();
        }
      },
    );

    // Make sure we get rid of the listener when our editor is closed.
    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });

    webviewPanel.webview.onDidReceiveMessage(event => {
      switch (event.type) {
        case "load":
          updateWebview();
          return;

        case "delete":
          return;
      }
    });
  }

  _getWebviewContent(webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "dist",
        "app",
        "bundle.js",
      ),
    );
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
      <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>
  </html>`;
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

module.exports = MemoEditorProvider;
