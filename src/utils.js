const vscode = require("vscode");
const docContent = [];

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

function setDecorationToCode(memos, textDecoration, editor) {
  if (!editor) {
    return;
  }
  const opendFilePath = editor.document.fileName;

  const label = [];
  memos?.forEach(memo => {
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
    editor.setDecorations(textDecoration, label);
  });
}

async function deleteMemoInCode(textEditor) {
  const data = await getMemos();
  if (!data) {
    vscode.window.showInformationMessage("There is no memo in this code.");
    return;
  }

  const path = textEditor.document.fileName;
  const selection = textEditor.selection;

  const newMemos = data.memos.filter(memo => {
    return memo.path !== path || memo.line !== selection.active.line;
  });
  data.memos = newMemos;
  const workspaceFolders = vscode.workspace.workspaceFolders;
  const memoFileUri = vscode.Uri.joinPath(
    workspaceFolders[0].uri,
    ".vscode",
    "new.memo",
  );
  const writeData = Buffer.from(JSON.stringify(data), "utf8");

  await vscode.workspace.fs.writeFile(memoFileUri, writeData);

  vscode.commands.executeCommand("codememo.setDecoration");
}

async function updateMemo(data) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  const memoFileUri = vscode.Uri.joinPath(
    workspaceFolders[0].uri,
    ".vscode",
    "new.memo",
  );
  const writeData = Buffer.from(JSON.stringify(data), "utf8");

  await vscode.workspace.fs.writeFile(memoFileUri, writeData);
}

function openMemo() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  const memoFileUri = vscode.Uri.joinPath(
    workspaceFolders[0].uri,
    ".vscode",
    "new.memo",
  );

  vscode.commands.executeCommand(
    "vscode.openWith",
    memoFileUri,
    "memoCustoms.memo",
  );
}

async function initDocArray({ document }) {
  docContent.push({
    name: document.uri.path,
    content: document.getText(),
  });
}

module.exports = {
  docContent,
  getMemos,
  setDecorationToCode,
  deleteMemoInCode,
  updateMemo,
  openMemo,
  initDocArray,
};
