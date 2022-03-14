const vscode = require("vscode");
const { getNonce } = require("./utils");

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

    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });

    webviewPanel.webview.onDidReceiveMessage(message => {
      switch (message.command) {
        case "load":
          updateWebview();
          this._deleteFocus(document);
          return;

        case "delete":
          this._deleteMemo(document, message.index);
          return;

        case "update":
          this._updateMemo(document, message.index, message.contents);
          return;

        case "drag":
          this._dragMemo(document, message.index, message.x, message.y);
          return;

        case "link":
          this._openFile(message.path, message.line, message.id);
          return;

        case "changeColor":
          this._changeColor(document, message.index, message.color);
          return;

        case "resize":
          this._resize(document, message.index, message.width, message.height);
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

  async _openFile(path, line, id) {
    const memoSavedDocument = await vscode.workspace.openTextDocument(
      vscode.Uri.parse("file:" + path),
    );
    await vscode.window.showTextDocument(memoSavedDocument, {
      viewColumn: vscode.ViewColumn.One,
      preview: false,
    });

    const currentEditor = vscode.window.activeTextEditor;
    const { tempMemos } = require("./extension");
    const codeLine = tempMemos?.[path]
      ? tempMemos[path].find(memo => (memo.id = id)).line
      : line;
    const range = currentEditor.document.lineAt(codeLine).range;
    const linePosition = new vscode.Position(codeLine, 0);
    currentEditor.selection = new vscode.Selection(linePosition, linePosition);
    currentEditor.revealRange(range);
  }

  async _deleteFocus(document) {
    const json = this._getDocumentAsJson(document);
    json.focus = "";
    const writeData = Buffer.from(JSON.stringify(json), "utf8");
    await vscode.workspace.fs.writeFile(document.uri, writeData);
  }

  async _resize(document, index, width, height) {
    const json = this._getDocumentAsJson(document);
    json.memos[index].width = width;
    json.memos[index].height = height;
    return await this._updateTextDocument(document, json);
  }

  async _changeColor(document, index, color) {
    const json = this._getDocumentAsJson(document);
    json.memos[index].color = color;
    return await this._updateTextDocument(document, json);
  }

  async _dragMemo(document, index, x, y) {
    const json = this._getDocumentAsJson(document);
    let minZIndex = Number.MAX_SAFE_INTEGER;
    json.memos.forEach(memo => {
      minZIndex = Math.min(memo.zIndex, minZIndex);
    });
    let maxZIndex = 0;
    json.memos.forEach(memo => {
      memo.zIndex -= minZIndex - 1;
      maxZIndex = Math.max(memo.zIndex, maxZIndex);
    });
    json.memos[index].x = x;
    json.memos[index].y = y;
    json.memos[index].zIndex = maxZIndex + 1;
    return await this._updateTextDocument(document, json);
  }

  async _deleteMemo(document, index) {
    const json = this._getDocumentAsJson(document);
    const deletedMemo = json.memos[index];
    json.memos.splice(index, 1);
    await this._updateTextDocument(document, json);
    vscode.commands.executeCommand("codememo.updateDeletedMemo", deletedMemo);
  }

  async _updateMemo(document, index, contents) {
    const json = this._getDocumentAsJson(document);
    json.memos[index].contents = contents;
    return await this._updateTextDocument(document, json);
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

  async _updateTextDocument(document, json) {
    const edit = new vscode.WorkspaceEdit();
    edit.replace(
      document.uri,
      new vscode.Range(0, 0, document.lineCount, 0),
      JSON.stringify(json, null, 2),
    );

    await vscode.workspace.applyEdit(edit);
    const memoFile = await vscode.workspace.openTextDocument(document.uri.path);
    await memoFile.save();
  }
}

module.exports = MemoEditorProvider;
