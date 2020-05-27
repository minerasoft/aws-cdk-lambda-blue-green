#!/usr/bin/env node
import 'source-map-support/register';
import {AppBuilder} from "../lib/app-builder";


new AppBuilder({
    appName: "UserService",
    pipelineProps: {
        codeCommitRepoName: 'pipeline-blue-green-test1',
        codeCommitRepoBranchName: 'pipeline-blue-green-test1',
        lambdaBuildSpecFile: 'sample/config/lambda-buildspec.yml',
        cdkBuildSpecFile: 'sample/config/cdk-buildspec.yml'
    }
})
    .addFunction({
        functionName: "UserCreate",
        preHookHandlerName: "userCreateValidatorPreHook.handler",
        handlerName: "userCreate.handler",
        lambdaAliasName: 'live'
    })
    .addFunction({
        functionName: "UserGet",
        preHookHandlerName: "userGetValidatorPreHook.handler",
        handlerName: "userGet.handler",
        lambdaAliasName: 'live'
    })
    .build()


