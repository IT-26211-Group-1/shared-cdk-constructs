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
const path = __importStar(require("path"));
const constructs_1 = require("constructs");
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const lambdaNodejs = __importStar(require("aws-cdk-lib/aws-lambda-nodejs"));
class LambdaFunction extends constructs_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        const vpc = aws_cdk_lib_1.aws_ec2.Vpc.fromLookup(this, "AdultnaVpc", {
            tags: {
                Name: "AdultnaVpc",
            },
        });
        const dbSecurityGroupId = aws_cdk_lib_1.aws_ssm.StringParameter.valueForStringParameter(this, "/adultna/database/db-security-group-id");
        const dbSecurityGroup = aws_cdk_lib_1.aws_ec2.SecurityGroup.fromSecurityGroupId(this, "DbSecurityGroup", dbSecurityGroupId);
        this.lambdaSecurityGroup = new aws_cdk_lib_1.aws_ec2.SecurityGroup(this, "LambdaSecurityGroup", {
            vpc,
            description: "Security group for Lambda to access RDS",
            allowAllOutbound: true,
        });
        dbSecurityGroup.addIngressRule(this.lambdaSecurityGroup, aws_cdk_lib_1.aws_ec2.Port.tcp(3306), "Allow Lambda access to MySQL");
        // Get DB credentials secret ARN
        const dbSecretArn = aws_cdk_lib_1.aws_ssm.StringParameter.valueForStringParameter(this, "/adultna/secrets/db-credentials-arn");
        const dbSecret = aws_cdk_lib_1.aws_secretsmanager.Secret.fromSecretCompleteArn(this, "DbSecret", dbSecretArn);
        // Get DB hostname
        const dbHost = aws_cdk_lib_1.aws_ssm.StringParameter.valueForStringParameter(this, "/adultna/database/endpoint");
        // IAM Role for Lambda
        const lambdaExecutionRole = new aws_cdk_lib_1.aws_iam.Role(this, "RegisterUserLambdaRole", {
            assumedBy: new aws_cdk_lib_1.aws_iam.ServicePrincipal("lambda.amazonaws.com"),
            managedPolicies: [
                aws_cdk_lib_1.aws_iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
                aws_cdk_lib_1.aws_iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMReadOnlyAccess"),
                aws_cdk_lib_1.aws_iam.ManagedPolicy.fromAwsManagedPolicyName("SecretsManagerReadWrite"),
                aws_cdk_lib_1.aws_iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaVPCAccessExecutionRole"),
            ],
        });
        this.lambdaFn = new lambdaNodejs.NodejsFunction(this, props.lambdaName, {
            runtime: lambda.Runtime.NODEJS_22_X,
            entry: path.join(__dirname, props.entryPath),
            handler: "handler",
            vpc,
            vpcSubnets: { subnetType: aws_cdk_lib_1.aws_ec2.SubnetType.PRIVATE_WITH_EGRESS },
            securityGroups: [this.lambdaSecurityGroup],
            role: lambdaExecutionRole,
            environment: {
                DB_SECRET_NAME: dbSecret.secretName,
                DB_HOST: dbHost,
                DB_NAME: "AdultnaDb",
                ...props.environment,
            },
            timeout: aws_cdk_lib_1.Duration.seconds(60),
            bundling: { minify: true },
        });
        dbSecret.grantRead(this.lambdaFn);
    }
}
exports.LambdaFunction = LambdaFunction;
