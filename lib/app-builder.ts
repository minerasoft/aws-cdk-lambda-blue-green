import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import {LambdaBlueGreen, LambdaBlueGreenConfig} from "./lambda-blue-green";
import {Pipeline, PipelineConfig} from "./pipeline";

class LambdaStack extends cdk.Stack {
    public readonly lambdaCode: lambda.CfnParametersCode;
    constructor(scope: cdk.App, id: string, lambdas: LambdaBlueGreenConfig[]) {
        super(scope, id);

        //Pass CfnParametersCode to a Lambda Function before accessing the bucketNameParam property
        this.lambdaCode = lambda.Code.fromCfnParameters();

        lambdas.forEach(props => {
            new LambdaBlueGreen(this, props.functionName, {
                lambdaBlueGreenConfig: props,
                lambdaCode: this.lambdaCode
            });
        });
    }
}

class PipelineStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props: PipelineConfig, lambdaStack: LambdaStack) {
        super(scope, id);

        new Pipeline(this, `Pipeline`, {
            pipelineConfig: props,
            lambdaCode: lambdaStack.lambdaCode
        });
    }
}

export interface AppBuilderConfig {
    /**
     * Name of the application.
     *
     * Example: User Service
     */
    appName: string,

    /**
     * Configuration for the pipeline for building and deploying serverless resources.
     */
    pipelineConfig: PipelineConfig
}

export class AppBuilder extends cdk.App {
    private props: AppBuilderConfig;
    private readonly lambdaProps: LambdaBlueGreenConfig[];

    constructor(props: AppBuilderConfig) {
        super()
        this.props = props;
        this.lambdaProps = []
    }

    addFunction(lambdaBlueGreenProps: LambdaBlueGreenConfig): AppBuilder {
        this.lambdaProps.push(lambdaBlueGreenProps);
        return this;
    }

    build() {
        let lambdaStack = new LambdaStack(this, `${this.props.appName}-LambdasStack`, this.lambdaProps)
        new PipelineStack(this, `${this.props.appName}-PipelineStack`, this.props.pipelineConfig, lambdaStack);
    }
}