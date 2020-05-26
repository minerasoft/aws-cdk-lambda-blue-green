import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda'
import * as codeDeploy from '@aws-cdk/aws-codedeploy'
import {ILambdaDeploymentConfig} from "@aws-cdk/aws-codedeploy/lib/lambda/deployment-config";

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
    lambdaAliasName: string,
    /**
     * The Deployment Configuration for the Lambda.
     *
     * @default LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES
     */
    readonly deploymentConfig?: ILambdaDeploymentConfig;
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

        let alias = new lambda.Alias(this, `${this.lambdaName}-Alias`, {
            aliasName: props.lambdaAliasName,
            version: internalLambda.currentVersion,
        });

        new codeDeploy.LambdaDeploymentGroup(this, `${this.lambdaName}-DeploymentGroup`, {
            alias,
            deploymentConfig: props.deploymentConfig || codeDeploy.LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES,
        });
    }
}
