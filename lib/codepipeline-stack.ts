import * as core from '@aws-cdk/core'
import * as codepipeline from '@aws-cdk/aws-codepipeline'
import * as actions from '@aws-cdk/aws-codepipeline-actions'
import * as codebuild from '@aws-cdk/aws-codebuild'
import * as iam from '@aws-cdk/aws-iam'

export default class CodePipelineStack {

}

export async function codePipelineStack(
    scope: core.Construct,
    id: string,
    rdsEndpoint: string,
    s3BucketName: string,
    secretsManager: string,
    applicationName: string,
): Promise<void> {

  const stack = new core.Stack(scope, id, {
    stackName: id,
  })

  const pipeline = new codepipeline.Pipeline(stack, applicationName)
  const gitHubToken: string =  env('GIT_HUB_TOKEN')

  const appOutput = new codepipeline.Artifact()

  /* CodeCommit GitHubに認証と諸々の指定をここでやってる */
  const sourceAction = new actions.GitHubSourceAction({
    actionName: 'SourceAction',
    owner: env('GIT_HUB_ACCOUNT'),
    oauthToken: core.SecretValue.plainText(gitHubToken),
    repo: env('GIT_HUB_REPOSITORY'),
    branch: env('GIT_HUB_BRUNCH'),
    output: appOutput,
    runOrder: 1,
  })

  /* ビルドプロジェクトの定義 */
  const buildAction = new codebuild.PipelineProject(
    stack,
     `${applicationName}BuildActionProject`,
      {
      environment: {
        privileged: true,
      },
      environmentVariables: {
        DB_HOST: {
          type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
          value: rdsEndpoint,
        },
        DB_PORT: {
          type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
          value: env('DB_PORT'),
        },
        DB_DATABASE: {
          type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
          value: env('DB_DATABASE'),
        },
        DB_USERNAME: {
          type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
          value: env('DB_USERNAME'),
        },
        secretsManager: {
          type: codebuild.BuildEnvironmentVariableType.SECRETS_MANAGER,
          value: secretsManager,
        },
        PROJECT_NAMESPACE: {
          type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
          value: applicationName,
        },
        AWS_DEFAULT_REGION: {
          type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
          value: env('AWS_DEFAULT_REGION'),
        },
        AWS_BUCKET: {
          type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
          value: s3BucketName
        },
        ENVIRONMENT: {
          type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
          value: env('ENVIRONMENT'),
        }
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename('aws/buildspec.yml'),
    }
  )

  /* add to role policy */
  buildAction.addToRolePolicy(new iam.PolicyStatement({
    resources: ['*'],
    actions: [
      'ecr:*',
      'cloudtrail:LookupEvents',
      'secretsmanager:*',
    ],
  }))

  /* BuildAction */
  const applicationDeployAction = new actions.CodeBuildAction({
    actionName: 'CodeBuildAction',
    project: buildAction,
    input: appOutput,
    runOrder: 3,
  })

  /* pipelineのステージを定義 */
  pipeline.addStage({
    stageName: 'SourceAction',
    actions: [sourceAction],
  })

  pipeline.addStage({
    stageName: 'BuildAction',
    actions: [applicationDeployAction],
  })

}
