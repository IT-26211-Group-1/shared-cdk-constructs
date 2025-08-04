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
}

export class LambdaFunction extends Construct {
  public readonly lambdaFn: lambdaNodejs.NodejsFunction;
  public readonly lambdaSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: LambdaFunctionProps) {
    super(scope, id);

    const vpc = ec2.Vpc.fromLookup(this, "AdultnaVpc", {
      tags: {
        Name: "AdultnaVpc",
      },
    });

    const dbSecurityGroupId = ssm.StringParameter.valueForStringParameter(
      this,
      "/adultna/database/db-security-group-id"
    );
    const dbSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(
      this,
      "DbSecurityGroup",
      dbSecurityGroupId
    );

    this.lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      "LambdaSecurityGroup",
      {
        vpc,
        description: "Security group for Lambda to access RDS",
        allowAllOutbound: true,
      }
    );

    dbSecurityGroup.addIngressRule(
      this.lambdaSecurityGroup,
      ec2.Port.tcp(3306),
      "Allow Lambda access to MySQL"
    );

    // Get DB credentials secret ARN
    const dbSecretArn = ssm.StringParameter.valueForStringParameter(
      this,
      "/adultna/secrets/db-credentials-arn"
    );
    const dbSecret = secretsmanager.Secret.fromSecretCompleteArn(
      this,
      "DbSecret",
      dbSecretArn
    );

    // Get DB hostname
    const dbHost = ssm.StringParameter.valueForStringParameter(
      this,
      "/adultna/database/endpoint"
    );

    // IAM Role for Lambda
    const lambdaExecutionRole = new iam.Role(this, "RegisterUserLambdaRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMReadOnlyAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("SecretsManagerReadWrite"),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaVPCAccessExecutionRole"
        ),
      ],
    });

    this.lambdaFn = new lambdaNodejs.NodejsFunction(this, props.lambdaName, {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: props.entryPath,
      handler: "handler",
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [this.lambdaSecurityGroup],
      role: lambdaExecutionRole,
      environment: {
        DB_SECRET_NAME: dbSecret.secretName,
        DB_HOST: dbHost,
        DB_NAME: "AdultnaDb",
        ...props.environment,
      },
      timeout: Duration.seconds(60),
      bundling: { minify: true, forceDockerBundling: false },
    });

    dbSecret.grantRead(this.lambdaFn);
  }
}
