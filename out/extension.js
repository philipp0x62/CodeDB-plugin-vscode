"use strict";
// /*---------------------------------------------------------
//  * Copyright (C) Microsoft Corporation. All rights reserved.
//  *--------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode_1 = require("vscode");
const appdata_path_1 = require("appdata-path");
const vscode = require("vscode");
const codeDb_service_1 = require("./services/codeDb-service");
const fs = require("fs");
const codeIdMapping = new Map();
const hits = [];
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
const tokenFileLocation = (0, appdata_path_1.default)("CODEDB/CodeDbKey.txt");
async function getCodeDbToken() {
    const searchQuery = await vscode.window.showInputBox({
        placeHolder: "Add CodeDB access token ",
        prompt: "Search my snippets on CodeDB",
    });
    if (!fs.existsSync((0, appdata_path_1.default)("CODEDB"))) {
        fs.mkdirSync((0, appdata_path_1.default)("CODEDB"));
    }
    fs.writeFileSync(tokenFileLocation, searchQuery, function (err) {
        if (err) {
            return console.log("error");
        }
    });
    return searchQuery;
}
function activate(context) {
    const disposable = vscode.commands.registerCommand('extension.codeDBplugin', async () => {
        if (fs.existsSync(tokenFileLocation)) {
            // File exists in path
            let token = "";
            let httpClient = new codeDb_service_1.default();
            fs.readFile(tokenFileLocation, 'utf8', async function (_err, data) {
                token = data;
                let results = await httpClient.getFavourites(token);
                results.hits.forEach(function (item) {
                    if (hits.includes(item['shortcut']) == false) {
                        hits.push(item['shortcut']);
                        codeIdMapping.set(item['shortcut'], item['code_id']);
                    }
                });
                console.log(results);
            });
        }
        else {
            console.log(getCodeDbToken());
        }
    });
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider('*', {
        async provideCompletionItems(document, position, _token, _context) {
            const linePrefix = document.lineAt(position).text.substr(0, position.character);
            let httpClient = new codeDb_service_1.default();
            if (linePrefix.endsWith('(')) {
                let main = linePrefix.split(' ').slice(-1)[0];
                let id = main.split('(')[0];
                if (codeIdMapping.get(id)) {
                    let code_id = codeIdMapping.get(id) || '';
                    let results = await httpClient.getCode(code_id);
                    var all = new vscode.Range(new vscode.Position(position.line, (position.character - 1) - id.length), new vscode.Position(position.line, position.character + 1));
                    const editor = vscode_1.window.activeTextEditor;
                    if (editor) {
                        editor.edit(eb => eb.replace(all, results));
                    }
                }
            }
            let completionText = [];
            hits.forEach(function (item) {
                completionText.push(new vscode.CompletionItem(item, vscode.CompletionItemKind.Method));
            });
            // return all completion items as array
            return completionText;
        }
    }, '('));
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider('plaintext', {
        provideCompletionItems(_document, _position, _token, _context) {
            let completionText = [];
            hits.forEach(function (item) {
                completionText.push(new vscode.CompletionItem(item, vscode.CompletionItemKind.Method));
            });
            // return all completion items as array
            return completionText;
        },
        resolveCompletionItem(_item, _token) {
            return null;
        }
    }));
    const addToken = vscode.commands.registerCommand('extension.codeDBAccessToken', async () => {
        if (fs.existsSync(tokenFileLocation)) {
            fs.unlinkSync(tokenFileLocation);
        }
        getCodeDbToken();
    });
    context.subscriptions.push(disposable, addToken);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map