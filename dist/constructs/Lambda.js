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
exports.LambdaFunction = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const constructs_1 = require("constructs");
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const aws_lambda_nodejs_1 = require("aws-cdk-lib/aws-lambda-nodejs");
class LambdaFunction extends constructs_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        const role = props.role ??
            new aws_cdk_lib_1.aws_iam.Role(this, `${props.lambdaName}Role`, {
                assumedBy: new aws_cdk_lib_1.aws_iam.ServicePrincipal("lambda.amazonaws.com"),
                managedPolicies: [
                    aws_cdk_lib_1.aws_iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
                    aws_cdk_lib_1.aws_iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaVPCAccessExecutionRole"),
                ],
            });
        if (props.kmsKey) {
            props.kmsKey.grantDecrypt(role);
        }
        this.lambdaFn = new aws_lambda_nodejs_1.NodejsFunction(this, props.lambdaName, {
            functionName: props.lambdaName,
            runtime: lambda.Runtime.NODEJS_22_X,
            entry: props.entryPath,
            handler: "handler",
            timeout: props.timeout ?? aws_cdk_lib_1.Duration.seconds(60),
            bundling: {
                minify: true,
                forceDockerBundling: false,
                ...props.bundling,
            },
            vpc: props.vpc,
            vpcSubnets: props.vpcSubnets,
            securityGroups: props.securityGroups,
            role,
            environment: props.environment,
        });
    }
}
exports.LambdaFunction = LambdaFunction;
