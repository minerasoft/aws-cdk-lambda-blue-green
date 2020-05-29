import * as cdk from "@aws-cdk/core";
import * as codePipeline from '@aws-cdk/aws-codepipeline'
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as codeCommit from '@aws-cdk/aws-codecommit';
import * as codeBuild from '@aws-cdk/aws-codebuild';
import * as lambda from '@aws-cdk/aws-lambda';

export interface PipelineProps {
    /**
     * Props required for the configuration of the pipeline.
     */
    readonly pipelineConfig: PipelineConfig,

    /**
     * Lambda code as cloud formation parameters. The value is supplied to this stack during the code deploy as
     * parameter override.
     */
    readonly lambdaCode: lambda.CfnParametersCode;
}

export interface PipelineConfig {
    /**
     * Name of the code-commit repo for which a commit triggers the build.
     */
    codeCommitRepoName: string,

    /**
     * Name of the code-commit repo branch for which a commit triggers the build.
     */
    codeCommitRepoBranchName?: string,

    /**
     * Path to the file with build instructions for the lambda in the aws build spec format.
     */
    lambdaBuildSpecFile: string

    /**
     * Path to the file with build instructions for the cdk synth in the aws build spec format.
     */
    cdkBuildSpecFile: string,
}

export class Pipeline extends cdk.Construct {

    constructor(scope: cdk.Construct, id: string, props: PipelineProps) {
        super(scope, id)

        const code = codeCommit.Repository.fromRepositoryName(this, 'CodeCommitRepo',
            props.pipelineConfig.codeCommitRepoName);

        const lambdaBuild = new codeBuild.PipelineProject(this, 'LambdaBuild', {
            buildSpec: codeBuild.BuildSpec.fromSourceFilename(props.pipelineConfig.lambdaBuildSpecFile),
            environment: {
                buildImage: codeBuild.LinuxBuildImage.STANDARD_2_0,
            },
        });

        const cdkBuild = new codeBuild.PipelineProject(this, 'CdkBuild', {
            buildSpec: codeBuild.BuildSpec.fromSourceFilename(props.pipelineConfig.cdkBuildSpecFile),
            environment: {
                buildImage: codeBuild.LinuxBuildImage.STANDARD_2_0,
            },
        });

        const sourceOutput = new codePipeline.Artifact();
        const lambdaBuildOutput = new codePipeline.Artifact('LambdaBuildOutput');
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

        new codePipeline.Pipeline(this, 'InternalPipeline', {
            stages: [
                {
                    stageName: 'Source',
                    actions: [
                        new codepipeline_actions.CodeCommitSourceAction({
                            actionName: 'CodeCommit_Source',
                            repository: code,
                            output: sourceOutput,
                            branch:  props.pipelineConfig.codeCommitRepoBranchName || 'master'
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
                            stackName: `UserService-LambdasStack`,
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
