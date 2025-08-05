import { aws_ec2 as ec2 } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
interface LambdaFunctionProps {
    lambdaName: string;
    entryPath: string;
    environment?: Record<string, string>;
    vpc?: ec2.IVpc;
    vpcSubnets?: ec2.SubnetSelection;
    securityGroups?: ec2.ISecurityGroup[];
}
export declare class LambdaFunction extends Construct {
    readonly lambdaFn: lambdaNodejs.NodejsFunction;
    constructor(scope: Construct, id: string, props: LambdaFunctionProps);
}
export {};
