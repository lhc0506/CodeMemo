const vscode = require("vscode");

const ReactPanel = require("./reactWebviewPanel");
const MemoEditorProvider = require("./memoEditor");
/**
 * @param {vscode.ExtensionContext} context
 */

function activate(context) {
  console.log("Congratulations, your extension 'codememo' is now active!");
  context.subscriptions.push(MemoEditorProvider.register(context));

  context.subscriptions.push(
    vscode.commands.registerCommand("codememo.create", () => {
      ReactPanel.createAndShow(context.extensionPath);
    }),
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
