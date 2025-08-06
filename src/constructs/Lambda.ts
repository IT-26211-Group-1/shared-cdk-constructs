import {
  Duration,
  aws_ec2 as ec2,
  aws_iam as iam,
  aws_ssm as ssm,
  aws_secretsmanager as secretsmanager,
  aws_lambda_nodejs as lambdaNodejs,
  aws_lambda as lambda,
} from "aws-cdk-lib";
import { IKey } from "aws-cdk-lib/aws-kms";
import { Construct } from "constructs";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";

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
export class LambdaFunction extends Construct {
  public readonly lambdaFn: lambdaNodejs.NodejsFunction;
  public readonly securityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: LambdaFunctionProps) {
    super(scope, id);

    const vpc = props.vpc;

    const dbSecurityGroupId = ssm.StringParameter.valueForStringParameter(
      this,
      "/adultna/database/db-security-group-id"
    );

    const dbSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(
      this,
      "DbSecurityGroup",
      dbSecurityGroupId
    );

    // Get DB credentials secret ARN
    const dbSecretArn = ssm.StringParameter.valueForStringParameter(
      this,
      "/adultna/secrets/db-credentials-secret-arn"
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

    this.securityGroup = new ec2.SecurityGroup(this, "LambdaSecurityGroup", {
      vpc,
      description: `Security Group for ${props.lambdaName}`,
      allowAllOutbound: true,
    });

    dbSecurityGroup.addIngressRule(
      this.securityGroup,
      ec2.Port.tcp(3306),
      "Allow Lambda to access MySQL"
    );

    const lambdaRole =
      props.role ??
      new iam.Role(this, "LambdaRole", {
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            "service-role/AWSLambdaBasicExecutionRole"
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            "service-role/AWSLambdaVPCAccessExecutionRole"
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMReadOnlyAccess"),
          iam.ManagedPolicy.fromAwsManagedPolicyName("SecretsManagerReadWrite"),
        ],
      });

    if (props.kmsKey) {
      props.kmsKey.grantDecrypt(lambdaRole);
    }

    this.lambdaFn = new lambdaNodejs.NodejsFunction(this, props.lambdaName, {
      functionName: props.lambdaName,
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: props.entryPath,
      handler: "handler",
      vpc: vpc,
      vpcSubnets: props.vpcSubnets,
      securityGroups: [this.securityGroup],
      role: lambdaRole,
      timeout: props.timeout ?? Duration.seconds(60),
      bundling: props.bundling ?? { minify: true },
      environment: {
        DB_SECRET_NAME: "adultna-db-credentials",
        DB_HOST: dbHost,
        DB_NAME: "AdultnaDb",
        ...props.environment,
      },
    });

    dbSecret.grantRead(this.lambdaFn);
  }
}
