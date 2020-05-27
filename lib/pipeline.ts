import * as cdk from "@aws-cdk/core";
import * as codePipeline from '@aws-cdk/aws-codepipeline'
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as codeCommit from '@aws-cdk/aws-codecommit';
import * as codeBuild from '@aws-cdk/aws-codebuild';

export interface PipelineProps {
    codeCommitRepoName: string,
    lambdaBuildSpecFile: string
    lambdaPreHookBuildSpecFile?: string
    cdkBuildSpecFile: string
}

export class Pipeline extends cdk.Construct {

    constructor(scope: cdk.Construct, id: string, props: PipelineProps) {
        super(scope, id)

        const code = codeCommit.Repository.fromRepositoryName(this, 'ImportedRepo',
            props.codeCommitRepoName);

        const lambdaBuild = new codeBuild.PipelineProject(this, 'LambdaBuild', {
            buildSpec: codeBuild.BuildSpec.fromSourceFilename(props.lambdaBuildSpecFile),
            environment: {
                buildImage: codeBuild.LinuxBuildImage.STANDARD_2_0,
            },
        });

        let lambdaTestBuild;
        if (props.lambdaPreHookBuildSpecFile) {
            lambdaTestBuild = new codeBuild.PipelineProject(this, 'LambdaTestBuild', {
                buildSpec: codeBuild.BuildSpec.fromSourceFilename(props.lambdaPreHookBuildSpecFile),
                environment: {
                    buildImage: codeBuild.LinuxBuildImage.STANDARD_2_0,
                },
            });
        }

        const cdkBuild = new codeBuild.PipelineProject(this, 'CdkBuild', {
            buildSpec: codeBuild.BuildSpec.fromSourceFilename(props.cdkBuildSpecFile),
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
                }
            ]
        });
    }
}