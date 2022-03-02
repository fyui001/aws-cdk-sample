import { RemovalPolicy, Stack } from 'aws-cdk-lib'
import { Peer, Port, Vpc } from 'aws-cdk-lib/aws-ec2'
import { Cluster, ContainerImage, FargateTaskDefinition, LogDriver, Protocol } from 'aws-cdk-lib/aws-ecs'
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns'
import { Effect, ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'
import { Construct } from 'constructs'
import config from '../config/config'

export default class EcsStack {
  public constructor(scope: Construct, id: string, applicationNameSpace: string, vpc: Vpc) {
    const accountId = config('AWS_ACCOUNT_ID')
    const stack = new Stack(scope, id, { stackName: id })
    const cluster = new Cluster(stack, id, {
      clusterName: `${applicationNameSpace}-ecs-cluster`,
      vpc,
    })

    const ecsPrinciple = new ServicePrincipal('ecs-tasks.amazonaws.com')
    const executionRole = new Role(stack, 'execution-role', {
      assumedBy: ecsPrinciple,
    })
    const taskRole = new Role(stack, 'task-role', {
      assumedBy: ecsPrinciple,
    })

    executionRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        'AmazonEC2ContainerRegistryReadOnly'
      )
    )
    taskRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AmazonECSTaskExecutionRolePolicy'
      )
    )


    /* log group */
    const logGroup = new LogGroup(
      stack,
      '/ecs/colorteller',
      {
        retention: RetentionDays.ONE_DAY,
        removalPolicy: RemovalPolicy.DESTROY,
      }
    )

    const webEcsLogs = LogDriver.awsLogs({
      logGroup: logGroup,
      streamPrefix: `${applicationNameSpace}-web`,
    })

    const appEcsLogs = LogDriver.awsLogs({
      logGroup: logGroup,
      streamPrefix: `${applicationNameSpace}-app`,
    })

    /* task definitions */
    const taskdef = new FargateTaskDefinition(
      stack,
      `${applicationNameSpace}_task`,
      {
        executionRole: executionRole,
        taskRole: taskRole,
      }
    )

    /* web container */
    taskdef.addContainer(
      'web',
      {
        logging: webEcsLogs,
        image: ContainerImage.fromRegistry(
          `${accountId}.dkr.ecr.ap-northeast-1.amazonaws.com/${applicationNameSpace}/web`,
        )
      }
    ).addPortMappings(
      {
        containerPort: 80,
        protocol: Protocol.TCP
      }
    )

    /* app container */
    taskdef.addContainer(
      'app',
      {
        logging: appEcsLogs,
        image: ContainerImage.fromRegistry(
          `${accountId}.dkr.ecr.ap-northeast-1.amazonaws.com/${applicationNameSpace}/app`
        )
      }
    ).addPortMappings(
      {
        containerPort: 9000,
        protocol: Protocol.TCP
      }
    )

    /* service */
    const fargateService = new ApplicationLoadBalancedFargateService(
      stack,
      applicationNameSpace,
      {
        cluster: cluster,
        cpu: 1024,
        memoryLimitMiB: 2048,
        desiredCount: 1,
        taskDefinition: taskdef
      }
    )

    /* service auto scaling*/
    fargateService.service.connections.securityGroups[0].addIngressRule(
      Peer.ipv4(vpc.vpcCidrBlock),
      Port.tcp(Number(config('DB_PORT'))),
      'Allow MySQL access from ECS'
    )

    taskdef.addToTaskRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: ['*'],
        actions: ['ssm:GetParameter']
      })
    )

    taskdef.addToTaskRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: ['*'],
        actions: [
          's3:GetObject',
          's3:PutObject',
          's3:ListBucket',
          's3:ListAllMyBuckets',
        ]
      })
    )
  }

}
