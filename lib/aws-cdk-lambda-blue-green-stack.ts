import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda'

export class AwsCdkLambdaBlueGreenStack extends cdk.Construct {
    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);

      let lambdaCode = lambda.Code.fromCfnParameters();

        new lambda.Function(this, `InternalFunction`, {
            code: lambdaCode,
            handler: 'index.handler',
            runtime: lambda.Runtime.NODEJS_12_X,
        });
    }
}
