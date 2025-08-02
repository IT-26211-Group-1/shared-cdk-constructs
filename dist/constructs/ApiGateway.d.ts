import { Construct } from "constructs";
import * as apigatewayv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as lambda from "aws-cdk-lib/aws-lambda";
interface ApiGatewayProps {
    lambdaFn: lambda.IFunction;
    apiName: string;
    description: string;
    path: string;
    httpMethods: apigatewayv2.HttpMethod[];
    corsMethods?: apigatewayv2.CorsHttpMethod[];
}
export declare class HttpApiGateway extends Construct {
    readonly httpApi: apigatewayv2.HttpApi;
    constructor(scope: Construct, id: string, props: ApiGatewayProps);
}
export {};
