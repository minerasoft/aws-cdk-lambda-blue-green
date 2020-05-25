import * as cdk from '@aws-cdk/core';
import '@aws-cdk/assert/jest';
import {LambdaBlueGreen} from "../lib";

function getSynthesisedStack(testApp: cdk.App) {
    return testApp.synth().getStackByName("TestStack");
}

describe('Lambda Blue Green Construct', () => {
    let testApp: cdk.App;

    beforeEach(() => {
        testApp = new cdk.App();
        let testStack = new cdk.Stack(testApp, "TestStack");
        new LambdaBlueGreen(testStack, 'CreateUser', {
            lambdaAliasName: 'live'
        });
    })

    it('should define a lambda function', () => {
        expect(getSynthesisedStack(testApp)).toHaveResourceLike("AWS::Lambda::Function", {
            Handler: "index.handler",
            Runtime: "nodejs12.x"
        });
    });

    it(`should have the 'live' alias`, () => {
        expect(getSynthesisedStack(testApp)).toHaveResource("AWS::Lambda::Alias", {
            Name: 'live'
        })
    });
});
