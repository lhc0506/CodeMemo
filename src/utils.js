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
  const memos = await getMemos();

  if (!memos) {
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
      memos.memos,
      textDecoration,
      vscode.window.activeTextEditor,
    );
  }
}

async function deleteMemoInCode(textEditor, tempMemos) {
  const path = textEditor.document.uri.path;
  const selection = textEditor.selection;
  const tempMemosInFile = tempMemos[path];
  const data = await getMemos();
  let newMemos;

  if (tempMemosInFile) {
    const memoIndex = tempMemosInFile.findIndex(
      memo => memo.line === selection.active.line,
    );
    newMemos = data.memos.filter(memo => {
      return memo.path !== path || memo.id !== tempMemosInFile[memoIndex].id;
    });
    tempMemosInFile.splice(memoIndex, 1);
    if (tempMemosInFile.length === 0) {
      delete tempMemos[path];
    } else {
      tempMemos[path] = tempMemosInFile;
    }
  } else {
    if (!data) {
      vscode.window.showInformationMessage("There is no memo in this code.");
      return;
    }

    newMemos = data.memos.filter(memo => {
      return memo.path !== path || memo.line !== selection.active.line;
    });
  }

  data.memos = newMemos;
  const workspaceFolders = vscode.workspace.workspaceFolders;
  const memoFileUri = vscode.Uri.joinPath(
    workspaceFolders[0].uri,
    ".vscode",
    "new.memo",
  );
  const writeData = Buffer.from(JSON.stringify(data), "utf8");

  await vscode.workspace.fs.writeFile(memoFileUri, writeData);
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
    vscode.ViewColumn.Beside,
  );
}

function addDocArray({ document }, docContent) {
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

module.exports = {
  getMemos,
  setDecorationToCode,
  deleteMemoInCode,
  updateMemo,
  openMemo,
  addDocArray,
  checkAndSetDecoration,
};
