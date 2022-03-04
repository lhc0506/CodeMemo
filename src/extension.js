const vscode = require("vscode");
const path = require("path");
const ReactPanel = require("./newMemoWebview");
const MemoEditorProvider = require("./memoEditor");
const { getMemos, setDecorationToCode, deleteMemoInCode } = require("./utils");

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
    }),
    vscode.commands.registerCommand("codememo.delete", async () => {
      deleteMemoInCode(vscode.window.activeTextEditor);
    }),
    MemoEditorProvider.register(context),
    vscode.commands.registerCommand("codememo.setDecoration", async () => {
      const memos = await getMemos();
      setDecorationToCode(memos, textDecoration);
    }),
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
