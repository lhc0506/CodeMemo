const vscode = require("vscode");

async function setMemoInCode(textDecoration) {
  try {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const memoFileUri = vscode.Uri.joinPath(
      workspaceFolders[0].uri,
      ".vscode",
      "new.memo",
    );
    const buffer = await vscode.workspace.fs.readFile(memoFileUri);
    const memos = JSON.parse(buffer.toString());

    setDecorationToCode(memos, textDecoration);
  } catch {
    return;
  }
}

function setDecorationToCode(memos, textDecoration) {
  const opendFilePath = vscode.window.activeTextEditor.document.fileName;

  memos.forEach(memo => {
    if (memo.path === opendFilePath) {
      const pos = new vscode.Position(memo.line, 0);
      const label = [
        {
          range: new vscode.Range(pos, pos),
          hoverMessage: memo.contents,
        },
      ];

      vscode.window.activeTextEditor.setDecorations(textDecoration, label);
    }
  });
}

module.exports = setMemoInCode;
