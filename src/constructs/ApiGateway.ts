import { Construct } from "constructs";
import * as apigatewayv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as lambda from "aws-cdk-lib/aws-lambda";

interface ApiGatewayProps {
  lambdaFn: lambda.IFunction;
  apiName: string;
  description: string;
  path: string;
  httpMethods: apigatewayv2.HttpMethod[];
  corsMethods?: apigatewayv2.CorsHttpMethod[];
}

export class HttpApiGateway extends Construct {
  public readonly httpApi: apigatewayv2.HttpApi;

  constructor(scope: Construct, id: string, props: ApiGatewayProps) {
    super(scope, id);

    this.httpApi = new apigatewayv2.HttpApi(this, props.apiName, {
      apiName: props.apiName,
      description: props.description,
      corsPreflight: {
        allowHeaders: ["Content-Type"],
        allowMethods: props.corsMethods ?? [apigatewayv2.CorsHttpMethod.POST],
        allowOrigins: ["*"],
      },
    });

    this.httpApi.addRoutes({
      path: props.path,
      methods: props.httpMethods,
      integration: new integrations.HttpLambdaIntegration(
        `${props.apiName}Integration`,
        props.lambdaFn
      ),
    });
  }
}
