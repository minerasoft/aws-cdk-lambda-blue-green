import * as cdk from '@aws-cdk/core';
import '@aws-cdk/assert/jest';
import {LambdaBlueGreen} from "../lib";
import {LambdaPreHook} from "../lib/lambda-pre-hook";

describe('Lambda Pre Hook Construct', () => {
    let testApp: cdk.App;
    let testStack: cdk.Stack;

    beforeEach(() => {
        testApp = new cdk.App();
        testStack = new cdk.Stack(testApp, "TestStack");

        new LambdaPreHook(testStack, 'ValidateCreateUser', {
            handlerName: 'index.handler',
        });
    })

    it('should define a lambda function', () => {
        expect(testStack).toHaveResourceLike("AWS::Lambda::Function", {
            Handler: "index.handler",
            Runtime: "nodejs12.x"
        });
    });

    test('handler name cannot be empty', () => {
        expect(() => {
            new LambdaBlueGreen(new cdk.Stack(), 'CreateUser', {
                handlerName: '',
                lambdaAliasName: 'live',
            });
        }).toThrowError(/handler name cannot be empty/);
    })
});
