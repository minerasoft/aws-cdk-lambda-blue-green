import * as cdk from "@aws-cdk/core";
import {LambdaBlueGreen, LambdaBlueGreenProps} from "./lambda-blue-green";
import {Pipeline, PipelineProps} from "./pipeline";

class LambdaStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, lambdas: LambdaBlueGreenProps[]) {
        super(scope, id);

        lambdas.forEach(props => {
            new LambdaBlueGreen(this, props.functionName || 'func', props);
        });
    }
}

class PipelineStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props: PipelineProps) {
        super(scope, id);

        new Pipeline(this, 'CreateUserPipeline', props);
    }
}

export interface AppBuilderProps {
    appName: string,
    pipelineProps: PipelineProps
}

export class AppBuilder extends cdk.App {
    private props?: AppBuilderProps;
    private readonly lambdaProps: LambdaBlueGreenProps[];

    constructor(props: AppBuilderProps) {
        super()
        this.props = props;
        this.lambdaProps = []

        new PipelineStack(this, `${props?.appName}-PipelineStack`, props.pipelineProps);
    }

    addFunction(lambdaBlueGreenProps: LambdaBlueGreenProps): AppBuilder {
        this.lambdaProps.push(lambdaBlueGreenProps);
        return this;
    }

    build() {
        new LambdaStack(this, `${this.props?.appName}-LambdasStack`, this.lambdaProps)
    }
}