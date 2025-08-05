import {
  Duration,
  aws_ec2 as ec2,
  aws_iam as iam,
  aws_ssm as ssm,
  aws_secretsmanager as secretsmanager,
} from "aws-cdk-lib";
import { IKey } from "aws-cdk-lib/aws-kms";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";

interface LambdaFunctionProps {
  lambdaName: string;
  entryPath: string;
  environment?: Record<string, string>;
  vpc: ec2.IVpc;
  securityGroups: ec2.ISecurityGroup[];
  vpcSubnets: ec2.SubnetSelection;
  role?: iam.IRole;
  bundling?: NodejsFunctionProps["bundling"];
  timeout?: Duration;
  kmsKey?: IKey;
}
export class LambdaFunction extends Construct {
  public readonly lambdaFn: NodejsFunction;

  constructor(scope: Construct, id: string, props: LambdaFunctionProps) {
    super(scope, id);

    const role =
      props.role ??
      new iam.Role(this, `${props.lambdaName}Role`, {
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            "service-role/AWSLambdaBasicExecutionRole"
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            "service-role/AWSLambdaVPCAccessExecutionRole"
          ),
        ],
      });

    if (props.kmsKey) {
      props.kmsKey.grantDecrypt(role);
    }

    this.lambdaFn = new NodejsFunction(this, props.lambdaName, {
      functionName: props.lambdaName,
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: props.entryPath,
      handler: "handler",
      timeout: props.timeout ?? Duration.seconds(60),
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
