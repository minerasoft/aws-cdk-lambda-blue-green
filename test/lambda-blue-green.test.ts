import * as cdk from '@aws-cdk/core';
import '@aws-cdk/assert/jest';
import {LambdaBlueGreen} from "../lib";
import {LambdaDeploymentConfig} from "@aws-cdk/aws-codedeploy";

describe('Lambda Blue Green Construct', () => {
    let testApp: cdk.App;
    let testStack: cdk.Stack;

    beforeEach(() => {
        testApp = new cdk.App();
        testStack = new cdk.Stack(testApp, "TestStack");
    })

    describe('with default props values', () => {
        beforeEach(() => {
            new LambdaBlueGreen(testStack, 'CreateUser', {
                handlerName: 'index.handler',
                lambdaAliasName: 'live',
            });
        })

        it('should define a lambda function', () => {
            expect(testStack).toHaveResourceLike("AWS::Lambda::Function", {
                Handler: "index.handler",
                Runtime: "nodejs12.x"
            });
        });

        it(`should have the 'live' alias`, () => {
            expect(testStack).toHaveResource("AWS::Lambda::Alias", {
                Name: 'live'
            })
        });

        it('should perform canary deployment by default', () => {
            expect(testStack).toHaveResourceLike("AWS::CodeDeploy::DeploymentGroup", {
                DeploymentConfigName: "CodeDeployDefault.LambdaCanary10Percent5Minutes",
                DeploymentStyle: {
                    DeploymentType: "BLUE_GREEN"
                }
            })
        });

    })

    describe('with props values overridden', () => {
        beforeEach(() => {
            new LambdaBlueGreen(testStack, 'CreateUser', {
                handlerName: 'index.handler',
                lambdaAliasName: 'live',
                deploymentConfig: LambdaDeploymentConfig.LINEAR_10PERCENT_EVERY_10MINUTES
            });
        });

        it('should perform the blue/green deployment', () => {
            expect(testStack).toHaveResourceLike("AWS::CodeDeploy::DeploymentGroup", {
                DeploymentConfigName: "CodeDeployDefault.LambdaLinear10PercentEvery10Minutes",
                DeploymentStyle: {
                    DeploymentType: "BLUE_GREEN"
                }
            })
        });
    })

    test('handler name cannot be empty', () => {
        expect(() => {
            new LambdaBlueGreen(new cdk.Stack(), 'CreateUser', {
                handlerName: '',
                lambdaAliasName: 'live',
            });
        }).toThrowError(/handler name cannot be empty/);
    })

    test('alias name cannot be empty', () => {
        expect(() => {
            new LambdaBlueGreen(new cdk.Stack(), 'CreateUser', {
                handlerName: 'index.handler',
                lambdaAliasName: '',
            });
        }).toThrowError(/alias name cannot be empty/);
    })
});
