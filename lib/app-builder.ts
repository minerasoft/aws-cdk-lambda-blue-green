import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import {LambdaBlueGreen, LambdaBlueGreenProps} from "./lambda-blue-green";
import {Pipeline, PipelineInternalProps, PipelineProps} from "./pipeline";

//Pass CfnParametersCode to a Lambda Function before accessing the bucketNameParam property

class LambdaStack extends cdk.Stack {
    public readonly lambdaCode: lambda.CfnParametersCode;
    constructor(scope: cdk.App, id: string, lambdas: LambdaBlueGreenProps[]) {
        super(scope, id);

        this.lambdaCode = lambda.Code.fromCfnParameters();

        lambdas.forEach(props => {
            new LambdaBlueGreen(this, props.functionName, {
                lambdaBlueGreenProps: props,
                lambdaCode: this.lambdaCode
            });
        });
    }
}

class PipelineStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props: PipelineProps, lambdaStack: LambdaStack) {
        super(scope, id);

        new Pipeline(this, 'CreateUserPipeline', {
            pipelineProps: props,
            lambdaCode: lambdaStack.lambdaCode
        });
    }
}

export interface AppBuilderProps {
    appName: string,
    pipelineProps: PipelineProps
}

export class AppBuilder extends cdk.App {
    private props: AppBuilderProps;
    private readonly lambdaProps: LambdaBlueGreenProps[];

    constructor(props: AppBuilderProps) {
        super()
        this.props = props;
        this.lambdaProps = []
    }

    addFunction(lambdaBlueGreenProps: LambdaBlueGreenProps): AppBuilder {
        this.lambdaProps.push(lambdaBlueGreenProps);
        return this;
    }

    build() {
        let lambdaStack = new LambdaStack(this, `${this.props.appName}-LambdasStack`, this.lambdaProps)
        new PipelineStack(this, `${this.props.appName}-PipelineStack`, this.props.pipelineProps, lambdaStack);
    }
}