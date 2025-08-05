import {
  Duration,
  aws_ec2 as ec2,
  aws_iam as iam,
  aws_ssm as ssm,
  aws_secretsmanager as secretsmanager,
} from "aws-cdk-lib";
import * as path from "path";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";

interface LambdaFunctionProps {
  lambdaName: string;
  entryPath: string;
  environment?: Record<string, string>;
  vpc?: ec2.IVpc;
  vpcSubnets?: ec2.SubnetSelection;
  securityGroups?: ec2.ISecurityGroup[];
}

export class LambdaFunction extends Construct {
  public readonly lambdaFn: lambdaNodejs.NodejsFunction;

  constructor(scope: Construct, id: string, props: LambdaFunctionProps) {
    super(scope, id);

    const lambdaExecutionRole = new iam.Role(this, `${props.lambdaName}Role`, {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
      ],
    });

    if (props.vpc) {
      lambdaExecutionRole.addManagedPolicy(
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaVPCAccessExecutionRole"
        )
      );
    }

    this.lambdaFn = new lambdaNodejs.NodejsFunction(this, props.lambdaName, {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: props.entryPath,
      handler: "handler",
      timeout: Duration.seconds(60),
      bundling: { minify: true, forceDockerBundling: false },
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: props.securityGroups,
      role: lambdaExecutionRole,
      environment: props.environment,
    });
  }
}
