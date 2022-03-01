const vscode = require("vscode");

class MemoEditorProvider {
  static register(context) {
    // let createMemo = vscode.commands.registerCommand(
    //   "codememo.create",
    //   async function () {
    //     const workspaceFolders = vscode.workspace.workspaceFolders;

    //     if (!workspaceFolders) {
    //       vscode.window.showErrorMessage("Creating new Paw Draw files currently requires opening a workspace");
    //       return;
    //     }

    //     // this.addNewScratch(document);

    //     const uri = vscode.Uri.joinPath(workspaceFolders[0].uri, ".vscode", "new.memo");
    //     // vscode.commands.executeCommand('vscode.open', uri);
    //     console.log("activeTextEditor.document 입니다아", vscode.window.activeTextEditor.document.fileName);
    //     const selection = vscode.window.activeTextEditor.selection;
    //     console.log(selection.active);

    //     // loadFile(uri);
    //     const memos = await loadFile(uri);
    //     memos.push({
    //       "id": "id1",
    //       "path": vscode.window.activeTextEditor.document.fileName,
    //       "line": selection.active.line,
    //       "contents": "",
    //       "x": 1,
    //       "y": 2
    //     });
    //     console.log("memos!!", JSON.stringify(JSON.parse(memos)));
    //     // var JsonToArray = function (json) {
    //     //   var str = JSON.stringify(json, null, 0);
    //     //   var ret = new Uint8Array(str.length);
    //     //   for (var i = 0; i < str.length; i++) {
    //     //     ret[i] = str.charCodeAt(i);
    //     //   }
    //     //   return ret
    //     // };

    //     // const writeData = Buffer.from(JSON.stringify(JSON.parse(memos)), 'utf8');
    //     // vscode.workspace.fs.writeFile(uri, writeData);

    //     async function loadFile(saveUri) {
    //       let fileData = null;
    //       const buffer = await vscode.workspace.fs.readFile(saveUri);
    //       fileData = JSON.parse(buffer.toString());

    //       fileData.push({
    //         "id": "id1",
    //         "path": vscode.window.activeTextEditor.document.fileName,
    //         "line": selection.active.line,
    //         "contents": "",
    //         "x": 1,
    //         "y": 2
    //       });

    //       const document = await vscode.workspace.openTextDocument(saveUri);

    //       const writeData = Buffer.from(JSON.stringify(fileData), 'utf8');

    //       await vscode.workspace.fs.writeFile(saveUri, writeData);
    //       let text = JSON.parse(document.getText());
    //       return text;
    //     }
    //   },
    // );

    // context.subscriptions.push(createMemo);

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
