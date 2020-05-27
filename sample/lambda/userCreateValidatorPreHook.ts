const AWS = require('aws-sdk');
const codedeploy = new AWS.CodeDeploy();

export async function handler(event: any) {
    console.log("request:", JSON.stringify(event, undefined, 2));

    //Read the DeploymentId from the event payload.
    var deploymentId = event.DeploymentId;

    //Read the LifecycleEventHookExecutionId from the event payload
    var lifecycleEventHookExecutionId = event.LifecycleEventHookExecutionId;

    /*
     Enter validation tests here.
    */

    // Prepare the validation test results with the deploymentId and
    // the lifecycleEventHookExecutionId for AWS CodeDeploy.
    var params = {
        deploymentId: deploymentId,
        lifecycleEventHookExecutionId: lifecycleEventHookExecutionId,
        status: 'Succeeded' // status can be 'Succeeded' or 'Failed'
    };

    // Pass AWS CodeDeploy the prepared validation test results.
    await codedeploy.putLifecycleEventHookExecutionStatus(params).promise()

    return {
        statusCode: 200,
        headers: { "Content-Type": "text/plain" },
        body: `User Create Validator v3 - Validation test succeeded`
    };
}