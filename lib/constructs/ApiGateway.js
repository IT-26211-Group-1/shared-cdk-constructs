"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpApiGateway = void 0;
const constructs_1 = require("constructs");
const apigatewayv2 = __importStar(require("aws-cdk-lib/aws-apigatewayv2"));
const integrations = __importStar(require("aws-cdk-lib/aws-apigatewayv2-integrations"));
class HttpApiGateway extends constructs_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        this.httpApi = new apigatewayv2.HttpApi(this, props.apiName, {
            apiName: props.apiName,
            description: props.description,
            corsPreflight: {
                allowHeaders: ["Content-Type"],
                allowMethods: props.corsMethods ?? [apigatewayv2.CorsHttpMethod.POST],
                allowOrigins: ["*"],
            },
        });
        this.httpApi.addRoutes({
            path: props.path,
            methods: props.httpMethods,
            integration: new integrations.HttpLambdaIntegration(`${props.apiName}Integration`, props.lambdaFn),
        });
    }
}
exports.HttpApiGateway = HttpApiGateway;
