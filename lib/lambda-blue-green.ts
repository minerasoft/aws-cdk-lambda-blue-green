import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda'
import * as codeDeploy from '@aws-cdk/aws-codedeploy'
import {ILambdaDeploymentConfig} from "@aws-cdk/aws-codedeploy/lib/lambda/deployment-config";

export interface LambdaBlueGreenPropsInternal {
    lambdaBlueGreenProps: LambdaBlueGreenProps,
    readonly lambdaCode: lambda.CfnParametersCode;
}

export interface LambdaBlueGreenProps {

    readonly functionName?: string;
    /**
     * Name of the Lambda handler in the codebase.
     *
     * Example: index.handler
     */
    readonly handlerName: string;
    /**
     * Name of the Alias used for the deployment of the lambda function.
     *
     * Example: Prod | Stage
     */
    readonly lambdaAliasName: string;
    /**
     * The Deployment Configuration for the Lambda.
     *
     * @default LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES
     */
    readonly deploymentConfig?: ILambdaDeploymentConfig;
    /**
     * Name of the Lambda handler for validating the Lambda function being deployed.
     *
     * Example: index.handler
     */
    readonly preHookHandlerName: string;
}

export class LambdaBlueGreen extends cdk.Construct {
    private readonly lambdaName = 'InternalFunction'

    constructor(scope: cdk.Construct, id: string, props: LambdaBlueGreenPropsInternal) {
        super(scope, id);

        if (!props.lambdaBlueGreenProps.handlerName) {
            throw new Error('handler name cannot be empty')
        }

        if (!props.lambdaBlueGreenProps.lambdaAliasName) {
            throw new Error('alias name cannot be empty')
        }

        let internalLambda = new lambda.Function(this, `${this.lambdaName}`, {
            code: props.lambdaCode,
            handler: props.lambdaBlueGreenProps.handlerName,
            runtime: lambda.Runtime.NODEJS_12_X,
            description: `${new Date().toISOString()}`
        });

        let alias = new lambda.Alias(this, `${this.lambdaName}-Alias`, {
            aliasName: props.lambdaBlueGreenProps.lambdaAliasName,
            version: internalLambda.currentVersion,
        });

        let preHookLambda = new lambda.Function(this, `${this.lambdaName}-PreHook`, {
            code: props.lambdaCode,
            handler: props.lambdaBlueGreenProps.preHookHandlerName,
            runtime: lambda.Runtime.NODEJS_12_X,
        });

        let deploymentGroup = new codeDeploy.LambdaDeploymentGroup(this, `${this.lambdaName}-DeploymentGroup`, {
            alias,
            deploymentConfig: props.lambdaBlueGreenProps.deploymentConfig || codeDeploy.LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES,
            preHook: preHookLambda
        });

        // if (props.lambdaBlueGreenProps.preHookHandlerName) {
        //     let preHookLambda = new lambda.Function(this, `${this.lambdaName}-PreHook`, {
        //         code: props.lambdaCode,
        //         handler: props.lambdaBlueGreenProps.preHookHandlerName,
        //         runtime: lambda.Runtime.NODEJS_12_X,
        //     });
        //     deploymentGroup.addPreHook(preHookLambda);
        // }
    }
}
