const vscode = require("vscode");
const path = require("path");
const { openMemo, getNonce } = require("./utils");

class MemoEditorProvider {
  static currentPanel;
  static VIEW_TYPE = "codeMemo";
  _disposables = [];
  static _panel;

  static createAndShow(extensionPath) {
    if (MemoEditorProvider.currentPanel) {
      MemoEditorProvider.currentPanel.dispose();
    }
    MemoEditorProvider.currentPanel = new MemoEditorProvider(extensionPath);
  }

  constructor(extensionPath) {
    this._extensionPath = extensionPath;

    this._panel = vscode.window.createWebviewPanel(
      MemoEditorProvider.VIEW_TYPE,
      "Code Memo",
      { viewColumn: -2 },
      {
        enableScripts: true,
      },
    );

    this._panel.webview.html = this._getWebviewContent(this._panel.webview);

    this._panel.webview.onDidReceiveMessage(message =>
      this._receiveMessage(message),
    );

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._postCreateMessage();
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
          <title>New Memo</title>
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

  async _receiveMessage(message) {
    const { command } = message;

    if (command === "save") {
      const {
        data: { id, path, line },
        contents,
      } = message;
      const memoFileUri = vscode.Uri.joinPath(
        vscode.workspace.workspaceFolders[0].uri,
        ".vscode",
        "memoBoard.memo",
      );

      await saveFile(memoFileUri, id, path, line, contents);

      vscode.commands.executeCommand("codememo.updateCreatedMemo");
      openMemo(vscode.ViewColumn.Active);
      this.dispose();
    }
  }

  _postCreateMessage() {
    const selection = vscode.window.activeTextEditor.selection;
    const data = {
      id: Date.now(),
      path: vscode.window.activeTextEditor.document.uri.path,
      line: selection.active.line,
    };

    this._panel.webview.postMessage({ command: "create", data });
  }

  _updateDecorations(line, contents) {
    const pos = new vscode.Position(line, 0);
    const label = [
      {
        range: new vscode.Range(pos, pos),
        hoverMessage: contents,
      },
    ];

    const textDecoration = vscode.window.createTextEditorDecorationType({
      gutterIconPath: vscode.Uri.file(
        path.join(this._extensionPath, "src", "memo.svg"),
      ),
    });

    vscode.window.activeTextEditor.setDecorations(textDecoration, label);
  }
}

async function saveFile(uri, id, path, line, contents) {
  const { tempMemos } = require("./extension");
  const status = tempMemos[path] ? "created" : "saved";
  try {
    const memoFile = await vscode.workspace.openTextDocument(uri);
    await memoFile.save();
    const buffer = await vscode.workspace.fs.readFile(uri);
    const fileData = JSON.parse(buffer.toString());
    let maxZIndex = 0;
    fileData.memos.forEach(memo => {
      maxZIndex = Math.max(memo.zIndex, maxZIndex);
    });
    fileData.memos.push({
      id,
      path,
      line,
      contents,
      color: "#ffffff",
      x: 0,
      y: 0,
      width: "180px",
      height: "150px",
      zIndex: maxZIndex + 1,
      status,
    });

    const writeData = Buffer.from(JSON.stringify(fileData), "utf8");

    await vscode.workspace.fs.writeFile(uri, writeData);
  } catch (error) {
    const fileData = {
      memos: [
        {
          id,
          path,
          line,
          contents,
          color: "#ffffff",
          x: 0,
          y: 0,
          width: "180px",
          height: "150px",
          zIndex: 0,
          status,
        },
      ],
      focus: 0,
    };
    const writeData = Buffer.from(JSON.stringify(fileData), "utf8");
    await vscode.workspace.fs.writeFile(uri, writeData);
  }
}

module.exports = MemoEditorProvider;
