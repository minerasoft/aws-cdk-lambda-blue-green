import * as cdk from '@aws-cdk/core';
import '@aws-cdk/assert/jest';
import {AwsCdkLambdaBlueGreen} from "../lib";

describe('Lambda Blue Green Construct', () => {
    let app: cdk.App;
    let myStack: cdk.Stack;
    let myLambda;

    beforeEach(() => {
        app = new cdk.App();
        myStack = new cdk.Stack(app, "TestStack");
        myLambda = new AwsCdkLambdaBlueGreen(myStack, 'CreateUser');
    })

    it('should define a lambda function', () => {
        expect(app.synth().getStackByName("TestStack")).toHaveResourceLike("AWS::Lambda::Function", {
            Handler: "index.handler",
            Runtime: "nodejs12.x"
        });
    });
});
