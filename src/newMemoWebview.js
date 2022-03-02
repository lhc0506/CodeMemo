const vscode = require("vscode");
const path = require("path");

class MemoEditorProvider {
  static currentPanel;
  static VIEW_TYPE = "codeMemo";
  _disposables = [];
  static _panel;

  constructor(extensionPath, column) {
    this._extensionPath = extensionPath;

    this._panel = vscode.window.createWebviewPanel(
      MemoEditorProvider.VIEW_TYPE,
      "Code Memo",
      // column || vscode.ViewColumn.One,
      { viewColumn: -2 },
      {
        enableScripts: true,
      },
    );

    this._panel.webview.html = this._getWebviewContent(this._panel.webview);

    this._panel.webview.onDidReceiveMessage(message =>
      this.receiveMessage(message),
    );

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._postCreateMessage();
  }

  static createAndShow(extensionPath) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (MemoEditorProvider.currentPanel) {
      MemoEditorProvider.currentPanel._panel.reveal(column);
      return;
    }

    MemoEditorProvider.currentPanel = new MemoEditorProvider(
      extensionPath,
      column || vscode.ViewColumn.One,
    );
  }

  dispose() {
    MemoEditorProvider.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  _getWebviewContent(webview) {
    const nonce = getNonce();

    const stylePath = vscode.Uri.file(
      path.join(this._extensionPath, "app", "memo.css"),
    );

    const styleUri = webview.asWebviewUri(stylePath);

    const scriptPath = vscode.Uri.file(
      path.join(this._extensionPath, "dist", "app", "bundle.js"),
    );

    const scriptUri = webview.asWebviewUri(scriptPath);

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="${styleUri}" rel="stylesheet">
          <title>Cat Coding</title>
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

  async receiveMessage(message) {
    const { command } = message;

    if (command === "save") {
      const {
        data: { id, path, line },
        contents,
      } = message;
      const workspaceFolders = vscode.workspace.workspaceFolders;
      const uri = vscode.Uri.joinPath(
        workspaceFolders[0].uri,
        ".vscode",
        "new.memo",
      );

      await saveFile(uri, id, path, line, contents);
      this.dispose();
    }
  }

  _postCreateMessage() {
    const selection = vscode.window.activeTextEditor.selection;

    const data = {
      id: "id1",
      path: vscode.window.activeTextEditor.document.fileName,
      line: selection.active.line,
    };

    this._panel.webview.postMessage({ command: "create", data });
  }
}

async function saveFile(uri, id, path, line, contents) {
  let fileData = null;
  try {
    let fileData = null;
    const buffer = await vscode.workspace.fs.readFile(uri);
    fileData = JSON.parse(buffer.toString());
    fileData.push({
      id,
      path,
      line,
      contents,
      x: 1,
      y: 2,
    });
    // const document = await vscode.workspace.openTextDocument(uri);

    const writeData = Buffer.from(JSON.stringify(fileData), "utf8");

    await vscode.workspace.fs.writeFile(uri, writeData);
  } catch (error) {
    /*
     * File not found.
     *
     * This is not actually ~exceptional~ since you can save
     * to the workspace rather than a discrete file. However, vscode's
     * filesystem api doesn't have a "check if the file exists" function.
     */
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

module.exports = MemoEditorProvider;
