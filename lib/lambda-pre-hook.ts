import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda'

interface LambdaPreHookProps {
    /**
     * Name of the Lambda handler in the codebase.
     *
     * Example: index.handler
     */
    readonly handlerName: string;
}

export class LambdaPreHook extends cdk.Construct {
    private readonly lambdaName = 'BlueGreenPreHookFunction'

    constructor(scope: cdk.Construct, id: string, props: LambdaPreHookProps) {
        super(scope, id);

        if (!props.handlerName) {
            throw new Error('handler name cannot be empty')
        }

        let lambdaCode = lambda.Code.fromCfnParameters();

        new lambda.Function(this, `${this.lambdaName}`, {
            code: lambdaCode,
            handler: props.handlerName,
            runtime: lambda.Runtime.NODEJS_12_X,
        });

    }
}
