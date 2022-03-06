const vscode = require("vscode");
const path = require("path");
const ReactPanel = require("./newMemoWebview");
const MemoEditorProvider = require("./memoEditor");
const { getMemos, setDecorationToCode, deleteMemoInCode, addGitIgnore } = require("./utils");

/**
 * @param {vscode.ExtensionContext} context
 */

function activate(context) {
  console.log("Congratulations, your extension 'codememo' is now active!");
  const gutterIconPath = vscode.Uri.file(
    path.join(context.extensionPath, "src", "memo.svg"),
  );
  const textDecoration = vscode.window.createTextEditorDecorationType({
    gutterIconPath,
    isWholeLine: true,
  });

  vscode.workspace.onDidOpenTextDocument(async doc => {
    if (doc?.uri.scheme !== "file") {
      return;
    }

    vscode.commands.executeCommand("codememo.setDecoration");
  });

  vscode.window.onDidChangeActiveTextEditor(async doc => {
    if (doc?.document.uri.scheme !== "file") {
      return;
    }

    vscode.commands.executeCommand("codememo.setDecoration");
  });

  context.subscriptions.push(
    vscode.commands.registerCommand("codememo.create", () => {
      ReactPanel.createAndShow(context.extensionPath);

      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) return;

      const workspacePath = workspaceFolders[0].uri.path;

      addGitIgnore(workspacePath);
    }),
    vscode.commands.registerCommand("codememo.delete", async () => {
      deleteMemoInCode(vscode.window.activeTextEditor);
    }),
    vscode.commands.registerCommand("codememo.setDecoration", async () => {
      const memos = await getMemos();
      if (!memos) {
        return;
      }
      setDecorationToCode(memos.memos, textDecoration);
    }),
    vscode.commands.registerCommand("codememo.goToMemo", async () => {
      const data = await getMemos();
      if (!data) {
        vscode.window.showInformationMessage("There is no memo in this code.");
      }
      const path = vscode.window.activeTextEditor.document.fileName;
      const selection = vscode.window.activeTextEditor.selection;
      const index = data.memos.findIndex(
        memo => memo.path === path && memo.line === selection.active.line,
      );
      data.focus = index;
      const workspaceFolders = vscode.workspace.workspaceFolders;
      const memoFileUri = vscode.Uri.joinPath(
        workspaceFolders[0].uri,
        ".vscode",
        "new.memo",
      );
      const writeData = Buffer.from(JSON.stringify(data), "utf8");

      await vscode.workspace.fs.writeFile(memoFileUri, writeData);
      vscode.commands.executeCommand(
        "vscode.openWith",
        memoFileUri,
        "memoCustoms.memo",
      );
    }),
    MemoEditorProvider.register(context),
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
