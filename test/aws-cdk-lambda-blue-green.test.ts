import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as lambdaBlueGreen from '../lib/aws-cdk-lambda-blue-green-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new lambdaBlueGreen.AwsCdkLambdaBlueGreenStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
