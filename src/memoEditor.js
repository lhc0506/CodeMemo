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

    webviewPanel.webview.onDidReceiveMessage(message => {
      switch (message.command) {
        case "load":
          updateWebview();
          return;

        case "delete":
          this._deleteMemo(document, message.index);
          return;

        case "update":
          this._updateMemo(document, message.index, message.contents);
          return;

        case "link":
          console.log(message);
          return;
      }
    });
  }

  _getWebviewContent(webview) {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "app", "memo.css"),
    );

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "dist",
        "app",
        "bundle.js",
      ),
    );
    const nonce = getNonce();

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="${styleUri}" rel="stylesheet">
          <title>Memo Board</title>
        </head>
        <body>
          <div id="root"></div>
          <script>
            const vscode = acquireVsCodeApi();
          </script>
          <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }

  _deleteMemo(document, index) {
    const json = this._getDocumentAsJson(document);
    json.splice(index, 1);
    return this._updateTextDocument(document, json);
  }

  _updateMemo(document, index, contents) {
    const json = this._getDocumentAsJson(document);
    json[index].contents = contents;
    return this._updateTextDocument(document, json);
  }

  _getDocumentAsJson(document) {
    const text = document.getText();
    if (text.trim().length === 0) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error(
        "Could not get document as json. Content is not valid json",
      );
    }
  }

  _updateTextDocument(document, json) {
    const edit = new vscode.WorkspaceEdit();
    edit.replace(
      document.uri,
      new vscode.Range(0, 0, document.lineCount, 0),
      JSON.stringify(json, null, 2),
    );

    return vscode.workspace.applyEdit(edit);
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
