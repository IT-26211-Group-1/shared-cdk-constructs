import { aws_ec2 as ec2 } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
interface LambdaFunctionProps {
    lambdaName: string;
    entryPath: string;
    environment?: Record<string, string>;
}
export declare class LambdaFunction extends Construct {
    readonly lambdaFn: lambdaNodejs.NodejsFunction;
    readonly lambdaSecurityGroup: ec2.SecurityGroup;
    constructor(scope: Construct, id: string, props: LambdaFunctionProps);
}
export {};
