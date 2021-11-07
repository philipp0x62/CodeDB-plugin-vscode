"use strict";
// /*---------------------------------------------------------
//  * Copyright (C) Microsoft Corporation. All rights reserved.
//  *--------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
// 	const provider2 = vscode.languages.registerCompletionItemProvider(
// 		'plaintext',
// 		{
// 			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
// 				// get all text until the `position` and check if it reads `console.`
// 				// and if so then complete if `log`, `warn`, and `error`
// 				const linePrefix = document.lineAt(position).text.substr(0, position.character);
// 				if (!linePrefix.endsWith('console.')) {
// 					return undefined;
// 				}
// 				return [
// 					new vscode.CompletionItem('log', vscode.CompletionItemKind.Method),
// 					new vscode.CompletionItem('warn', vscode.CompletionItemKind.Method),
// 					new vscode.CompletionItem('error', vscode.CompletionItemKind.Method),
// 				];
// 			}
// 		},
// 		'.' // triggered whenever a '.' is being typed
// 	);
// 	const searchQuery = await vscode.window.showInputBox({
// 		placeHolder: "Search query",
// 		prompt: "Search my snippets on Codever",
// 	  });
// 	context.subscriptions.push(provider2);
// }
const vscode = require("vscode");
const codeDb_service_1 = require("./services/codeDb-service");
const fs = require("fs");
const codeIdMapping = [];
const hits = [];
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
const tokenFileLocation = "/var/tmp/CodeDbKey.txt";
async function getCodeDbToken() {
    const searchQuery = await vscode.window.showInputBox({
        placeHolder: "Add CodeDb ",
        prompt: "Search my snippets on Codever",
    });
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
            fs.readFile(tokenFileLocation, 'utf8', async function (err, data) {
                token = data;
                let results = await httpClient.getFavourites(token);
                results.hits.forEach(function (item) {
                    hits.push(item['shortcut']);
                    //codeIdMapping.push[{'title':item['title'], 'code':item['code_id']}]
                });
                console.log(results);
            });
        }
        else {
            console.log(getCodeDbToken());
        }
    });
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider('plaintext', {
        provideCompletionItems(document, position, token, context) {
            let completionText = [];
            hits.forEach(function (item) {
                completionText.push(new vscode.CompletionItem(item, vscode.CompletionItemKind.Method));
            });
            // return all completion items as array
            return completionText;
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