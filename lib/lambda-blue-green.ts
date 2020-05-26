import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda'

interface LambdaBlueGreenProps {
    /**
     * Name of the Lambda handler in the codebase.
     * Example: index.handler
     */
    handlerName: string,
    /**
     * Name of the Alias used for the deployment of the lambda function.
     * Example: Prod
     */
    lambdaAliasName: string
}

export class LambdaBlueGreen extends cdk.Construct {
    private readonly lambdaName = 'InternalFunction'

    constructor(scope: cdk.Construct, id: string, props: LambdaBlueGreenProps) {
        super(scope, id);

        let lambdaCode = lambda.Code.fromCfnParameters();

        let internalLambda = new lambda.Function(this, `${this.lambdaName}`, {
            code: lambdaCode,
            handler:  props.handlerName ,
            runtime: lambda.Runtime.NODEJS_12_X,
        });

        new lambda.Alias(this, `${this.lambdaName}-Alias`, {
            aliasName: props.lambdaAliasName,
            version: internalLambda.currentVersion,
        });
    }
}
