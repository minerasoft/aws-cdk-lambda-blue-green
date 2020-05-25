#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { LambdaBlueGreen } from '../lib';

class SampleStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        new LambdaBlueGreen(this, 'CreateUser');
    }
}

let app = new cdk.App();
new SampleStack(app, 'SampleApp');
app.synth();
