import { Duration, aws_ec2 as ec2, aws_iam as iam, aws_lambda_nodejs as lambdaNodejs } from "aws-cdk-lib";
import { IKey } from "aws-cdk-lib/aws-kms";
import { Construct } from "constructs";
import { NodejsFunctionProps } from "aws-cdk-lib/aws-lambda-nodejs";
interface LambdaFunctionProps {
    lambdaName: string;
    entryPath: string;
    vpc: ec2.IVpc;
    environment?: Record<string, string>;
    securityGroups?: ec2.ISecurityGroup[];
    vpcSubnets: ec2.SubnetSelection;
    role?: iam.IRole;
    bundling?: NodejsFunctionProps["bundling"];
    timeout?: Duration;
    kmsKey?: IKey;
}
export declare class LambdaFunction extends Construct {
    readonly lambdaFn: lambdaNodejs.NodejsFunction;
    readonly securityGroup: ec2.SecurityGroup;
    constructor(scope: Construct, id: string, props: LambdaFunctionProps);
}
export {};
