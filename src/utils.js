const vscode = require("vscode");

async function getMemos() {
  try {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const memoFileUri = vscode.Uri.joinPath(
      workspaceFolders[0].uri,
      ".vscode",
      "new.memo",
    );
    const buffer = await vscode.workspace.fs.readFile(memoFileUri);
    const memos = await JSON.parse(buffer.toString());

    return memos;
  } catch {
    return;
  }
}

function setDecorationToCode(memos, textDecoration) {
  const opendFilePath = vscode.window.activeTextEditor.document.fileName;

  const label = [];
  memos.forEach(memo => {
    if (memo.path === opendFilePath) {
      const myContent = new vscode.MarkdownString(
        "[goToMemo](command:codememo.goToMemo)",
      );
      myContent.isTrusted = true;
      const pos = new vscode.Position(memo.line, 0);
      label.push({
        range: new vscode.Range(pos, pos),
        hoverMessage: memo.contents,
      });
      label.push({
        range: new vscode.Range(pos, pos),
        hoverMessage: myContent,
      });
    }
    vscode.window.activeTextEditor.setDecorations(textDecoration, label);
  });
}

async function deleteMemoInCode(textEditor) {
  const memos = await getMemos();
  const path = textEditor.document.fileName;
  const selection = textEditor.selection;

  const newMemos = memos.filter(memo => {
    return memo.path !== path || memo.line !== selection.active.line;
  });

  const workspaceFolders = vscode.workspace.workspaceFolders;
  const memoFileUri = vscode.Uri.joinPath(
    workspaceFolders[0].uri,
    ".vscode",
    "new.memo",
  );
  const writeData = Buffer.from(JSON.stringify(newMemos), "utf8");

  await vscode.workspace.fs.writeFile(memoFileUri, writeData);

  vscode.commands.executeCommand("codememo.setDecoration");
}

module.exports = { getMemos, setDecorationToCode, deleteMemoInCode };
