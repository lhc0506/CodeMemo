const vscode = require("vscode");

async function getMemos() {
  try {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const memoFileUri = vscode.Uri.joinPath(
      workspaceFolders[0].uri,
      ".vscode",
      "memoBoard.memo",
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
  if (memos || memos.lenght === 0) {
    editor.setDecorations(textDecoration, []);
  }

  const opendFilePath = editor.document.uri.path;

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
    editor.setDecorations(textDecoration, label);
  });
}

async function checkAndSetDecoration(tempMemos, textDecoration) {
  const data = await getMemos();

  if (!data) {
    return;
  }
  const path = vscode.window.activeTextEditor?.document.uri.path;

  if (tempMemos[path]) {
    setDecorationToCode(
      tempMemos[path],
      textDecoration,
      vscode.window.activeTextEditor,
    );
  } else {
    setDecorationToCode(
      data.memos,
      textDecoration,
      vscode.window.activeTextEditor,
    );
  }
}

async function deleteMemoInCode(textEditor, tempMemos) {
  const path = textEditor.document.uri.path;
  const selection = textEditor.selection;
  const tempMemosInFile = tempMemos[path];
  const memoFileUri = vscode.Uri.joinPath(
    vscode.workspace.workspaceFolders[0].uri,
    ".vscode",
    "memoBoard.memo",
  );

  const data = await getMemos();
  let deletedMemo;
  let updatedMemos;

  if (!data) {
    vscode.window.showInformationMessage("There is no memo in this code.");
    return;
  }

  if (tempMemosInFile) {
    const memoIndex = tempMemosInFile.findIndex(
      memo => memo.line === selection.active.line,
    );
    if (memoIndex === -1) {
      vscode.window.showInformationMessage("There is no memo in this line.");
      return;
    }
    updatedMemos = data.memos.filter(
      memo => memo.path !== path || memo.id !== tempMemosInFile[memoIndex].id,
    );
    deletedMemo = tempMemosInFile[memoIndex];
    tempMemosInFile.splice(memoIndex, 1);
    if (tempMemosInFile.length === 0) {
      delete tempMemos[path];
    } else {
      tempMemos[path] = tempMemosInFile;
    }
  } else {
    updatedMemos = data.memos.filter(memo => {
      if (memo.path === path && memo.line === selection.active.line) {
        deletedMemo = memo;
        return false;
      }
      return true;
    });
  }
  if (!deletedMemo) {
    vscode.window.showInformationMessage("There is no memo in this line.");
    return;
  }
  data.memos = updatedMemos;
  const memoFile = await vscode.workspace.openTextDocument(memoFileUri);
  await memoFile.save();
  await updateMemo(data);
  vscode.commands.executeCommand("codememo.updateDeletedMemo", deletedMemo);
}

async function updateMemo(data) {
  const memoFileUri = vscode.Uri.joinPath(
    vscode.workspace.workspaceFolders[0].uri,
    ".vscode",
    "memoBoard.memo",
  );

  const memoFile = await vscode.workspace.openTextDocument(memoFileUri);
  await memoFile.save();

  const writeData = Buffer.from(JSON.stringify(data), "utf8");

  await vscode.workspace.fs.writeFile(memoFileUri, writeData);
}

function openMemo(column) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  const memoFileUri = vscode.Uri.joinPath(
    workspaceFolders[0].uri,
    ".vscode",
    "memoBoard.memo",
  );

  vscode.commands.executeCommand(
    "vscode.openWith",
    memoFileUri,
    "memoCustoms.memo",
    column,
  );
}

function addDocContent({ document }, docContent) {
  const matchedIndex = docContent.findIndex(
    doc => doc.name === document.uri.path,
  );

  if (matchedIndex !== -1) {
    docContent.splice(matchedIndex, 1);
  }

  docContent.push({
    name: document.uri.path,
    content: document.getText(),
  });
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

async function checkMemoIsAvail(memos) {
  const path = vscode.window.activeTextEditor?.document.uri.path;
  const selectedLine = vscode.window.activeTextEditor.selection.active.line;

  if (!memos || !memos[path]) {
    const data = await getMemos();
    return data?.memos.find(
      memo => memo.path === path && memo.line === selectedLine,
    );
  }

  return memos[path].find(memo => memo.line === selectedLine);
}

module.exports = {
  getMemos,
  setDecorationToCode,
  deleteMemoInCode,
  updateMemo,
  openMemo,
  addDocContent,
  checkAndSetDecoration,
  getNonce,
  checkMemoIsAvail,
};
