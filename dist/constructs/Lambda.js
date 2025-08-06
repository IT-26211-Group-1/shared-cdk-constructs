"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaFunction = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const constructs_1 = require("constructs");
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
        const dbSecretArn = aws_cdk_lib_1.aws_ssm.StringParameter.valueForStringParameter(this, "/adultna/secrets/db-credentials-secret-arn");
        const dbSecret = aws_cdk_lib_1.aws_secretsmanager.Secret.fromSecretCompleteArn(this, "DbSecret", dbSecretArn);
        // Get DB hostname
        const dbHost = aws_cdk_lib_1.aws_ssm.StringParameter.valueForStringParameter(this, "/adultna/database/endpoint");
        const lambdaSG = props.securityGroups?.[0] ??
            new aws_cdk_lib_1.aws_ec2.SecurityGroup(this, "LambdaSecurityGroup", {
                vpc: props.vpc,
                description: `SG for ${props.lambdaName}`,
                allowAllOutbound: true,
            });
        const lambdaRole = props.role ??
            new aws_cdk_lib_1.aws_iam.Role(this, "LambdaRole", {
                assumedBy: new aws_cdk_lib_1.aws_iam.ServicePrincipal("lambda.amazonaws.com"),
                managedPolicies: [
                    aws_cdk_lib_1.aws_iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
                    aws_cdk_lib_1.aws_iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaVPCAccessExecutionRole"),
                    aws_cdk_lib_1.aws_iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMReadOnlyAccess"),
                    aws_cdk_lib_1.aws_iam.ManagedPolicy.fromAwsManagedPolicyName("SecretsManagerReadWrite"),
                ],
            });
        if (props.kmsKey) {
            props.kmsKey.grantDecrypt(lambdaRole);
        }
        this.lambdaFn = new aws_cdk_lib_1.aws_lambda_nodejs.NodejsFunction(this, props.lambdaName, {
            functionName: props.lambdaName,
            runtime: aws_cdk_lib_1.aws_lambda.Runtime.NODEJS_22_X,
            entry: props.entryPath,
            handler: "handler",
            vpc: props.vpc,
            vpcSubnets: props.vpcSubnets,
            securityGroups: [lambdaSG],
            role: lambdaRole,
            timeout: props.timeout ?? aws_cdk_lib_1.Duration.seconds(60),
            bundling: props.bundling ?? { minify: true },
            environment: {
                DB_SECRET_NAME: dbSecret.secretName,
                DB_HOST: dbHost,
                DB_NAME: "AdultnaDb",
                ...props.environment,
            },
        });
        dbSecret.grantRead(this.lambdaFn);
    }
}
exports.LambdaFunction = LambdaFunction;
