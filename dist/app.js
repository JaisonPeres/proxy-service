"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv/config');
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const axios_1 = __importDefault(require("axios"));
const app = express_1.default();
const apiUrl = process.env.API_URL || 'http://api.example.com';
const credentials = process.env.API_TOKEN || 'token_example';
const apiName = process.env.API_NAME;
const apiCrm = axios_1.default.create({
    baseURL: apiUrl,
    headers: {
        'Cache-Control': 'no-cache'
    }
});
function getCrmToken() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { data: { nmToken } } = yield apiCrm.post('/kernel/security/Token', {
                dsCredentials: credentials
            });
            return nmToken;
        }
        catch (error) {
            console.log(`Error on try request a token on ${apiName} api.`);
            console.log('Error::: ', error);
        }
    });
}
const port = 3000;
const token = 'hk290120';
const corsOptions = {
    exposedHeaders: ['Content-Type', 'Cache-Control'],
    methods: ['GET', 'POST']
};
app.use(cors_1.default(corsOptions));
app.use('*', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate allowed methods
    if (!corsOptions.methods.includes(req.method)) {
        res.sendStatus(405);
        return;
    }
    // Validate proxy authorization token
    if (!req.headers.authorization || req.headers.authorization !== token) {
        res.sendStatus(403);
        return;
    }
    // Get CRM api token
    const crmToken = yield getCrmToken();
    console.log(crmToken);
    // Parse proxy parameters to request CRM Api
    const { headers, method, body, originalUrl } = req;
    console.log('request params: ', { headers, originalUrl, method, body });
    try {
        const response = yield apiCrm[method.toLowerCase()](originalUrl, body, {
            withCredentials: true,
            headers: {
                'Cookie': `crmAuthToken=${crmToken}`
            }
        });
        console.log(response);
        res.send(response);
    }
    catch (err) {
        const error = {
            status: err.response.status,
            message: err.message
        };
        res.status(error.status).send(error);
        console.log(`Error on try request on ${apiName}: ${error.message}`);
        console.log(err);
    }
}));
app.listen(port, () => {
    return console.log(`Serving ${apiName} proxy to url ${apiUrl}`);
});
//# sourceMappingURL=app.js.map