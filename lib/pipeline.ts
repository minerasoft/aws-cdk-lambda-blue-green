import * as cdk from "@aws-cdk/core";
import * as codePipeline from '@aws-cdk/aws-codepipeline'
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as codeCommit from '@aws-cdk/aws-codecommit';
import * as codeBuild from '@aws-cdk/aws-codebuild';
import * as lambda from '@aws-cdk/aws-lambda';

export interface PipelineProps {
    codeCommitRepoName: string,
    lambdaBuildSpecFile: string
    lambdaPreHookBuildSpecFile?: string
    cdkBuildSpecFile: string,
}

export interface PipelineInternalProps {
    pipelineProps: PipelineProps,
    readonly lambdaCode: lambda.CfnParametersCode;
}

export class Pipeline extends cdk.Construct {

    constructor(scope: cdk.Construct, id: string, props: PipelineInternalProps) {
        super(scope, id)

        const code = codeCommit.Repository.fromRepositoryName(this, 'ImportedRepo',
            props.pipelineProps.codeCommitRepoName);

        const lambdaBuild = new codeBuild.PipelineProject(this, 'LambdaBuild', {
            buildSpec: codeBuild.BuildSpec.fromSourceFilename(props.pipelineProps.lambdaBuildSpecFile),
            environment: {
                buildImage: codeBuild.LinuxBuildImage.STANDARD_2_0,
            },
        });

        let lambdaTestBuild;
        if (props.pipelineProps.lambdaPreHookBuildSpecFile) {
            lambdaTestBuild = new codeBuild.PipelineProject(this, 'LambdaTestBuild', {
                buildSpec: codeBuild.BuildSpec.fromSourceFilename(props.pipelineProps.lambdaPreHookBuildSpecFile),
                environment: {
                    buildImage: codeBuild.LinuxBuildImage.STANDARD_2_0,
                },
            });
        }

        const cdkBuild = new codeBuild.PipelineProject(this, 'CdkBuild', {
            buildSpec: codeBuild.BuildSpec.fromSourceFilename(props.pipelineProps.cdkBuildSpecFile),
            environment: {
                buildImage: codeBuild.LinuxBuildImage.STANDARD_2_0,
            },
        });

        const sourceOutput = new codePipeline.Artifact();
        const lambdaBuildOutput = new codePipeline.Artifact('LambdaBuildOutput');
        const lambdaTestBuildOutput = new codePipeline.Artifact('LambdaTestBuildOutput');
        const cdkBuildOutput = new codePipeline.Artifact('CdkBuildOutput');

        let buildActions = [
            new codepipeline_actions.CodeBuildAction({
                actionName: 'Lambda_Build',
                project: lambdaBuild,
                input: sourceOutput,
                outputs: [lambdaBuildOutput],
            }),
            new codepipeline_actions.CodeBuildAction({
                actionName: 'CDK_Build',
                project: cdkBuild,
                input: sourceOutput,
                outputs: [cdkBuildOutput],
            })
        ];
        if (lambdaTestBuild) {
            buildActions.push(new codepipeline_actions.CodeBuildAction({
                actionName: 'Lambda_Test_Build',
                project: lambdaTestBuild,
                input: sourceOutput,
                outputs: [lambdaTestBuildOutput],
            }));
        }

        new codePipeline.Pipeline(this, 'InternalPipeline', {
            stages: [
                {
                    stageName: 'Source',
                    actions: [
                        new codepipeline_actions.CodeCommitSourceAction({
                            actionName: 'CodeCommit_Source',
                            repository: code,
                            output: sourceOutput,
                            branch: 'pipeline-blue-green-test1' //FIXME
                        }),
                    ],
                },
                {
                    stageName: 'Build',
                    actions: buildActions,
                },
                {
                    stageName: 'Deploy',
                    actions: [
                        new FixedStackAction({
                            actionName: 'Lambda_CFN_Deploy',
                            templatePath: cdkBuildOutput.atPath('UserService-LambdasStack.template.json'),
                            stackName: 'LambdaDeploymentStack',
                            adminPermissions: true,
                            parameterOverrides: {
                                ...props.lambdaCode.assign(lambdaBuildOutput.s3Location),
                            },
                            extraInputs: [lambdaBuildOutput],
                        }),
                    ],
                },
            ]
        });
    }

}

//https://github.com/aws/aws-cdk/issues/5183
class FixedStackAction extends codepipeline_actions.CloudFormationCreateUpdateStackAction {
    bound(scope: any, stage: any, options: any): any {
        const result = super.bound(scope, stage, options);
        options.bucket.grantRead((this as any)._deploymentRole);
        return result;
    }
}