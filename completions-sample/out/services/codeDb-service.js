"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_client_1 = require("./http-client");
class CodeDb extends http_client_1.HttpClient {
    constructor() {
        super('https://codedb.de/v1/plugin/');
        this.getFavourites = (token) => this.instance.get(`/favourites/${token}`).then(response => {
            return response;
        });
        this.getCode = (id) => this.instance.get(`/code/${id}`);
    }
}
exports.default = CodeDb;
//# sourceMappingURL=codeDb-service.js.map