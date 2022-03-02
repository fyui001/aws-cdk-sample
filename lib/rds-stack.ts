import { Duration, RemovalPolicy, SecretValue, Stack } from 'aws-cdk-lib'
import { InstanceClass, InstanceSize, InstanceType, Port, SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2'
import {
  AuroraMysqlEngineVersion,
  Credentials,
  DatabaseCluster,
  DatabaseClusterEngine,
  ParameterGroup,
} from 'aws-cdk-lib/aws-rds'
import { Construct } from 'constructs'
import config from '../config/config'

export default class RdsStack {
  public constructor(scope: Construct, id: string, rdsName: string, vpc: Vpc) {
    const stack = new Stack(scope, id, { stackName: id })

    const credentials = Credentials.fromPassword(config('DB_USER'), new SecretValue(config('DB_PASSWD')))

    const parameterGroup = new ParameterGroup(stack, `${id}-RDS-PARAMS`, {
      engine: DatabaseClusterEngine.auroraMysql({ version: AuroraMysqlEngineVersion.VER_2_08_1 }),
      parameters: {
        time_zone: 'Asia/Tokyo',
        character_set_server: 'utf8mb4',
        collation_server: 'utf8mb4_unicode_ci',
      }
    })

    const cluster = new DatabaseCluster(stack, `${rdsName}-cluster`, {
      backup: {
        retention: Duration.days(14),
        preferredWindow: '14:30-15:00',
      },
      cloudwatchLogsExports: ['error', 'general', 'slowquery'],
      credentials,
      defaultDatabaseName: config('DB_DATABASE'),
      deletionProtection: true,
      engine: DatabaseClusterEngine.auroraMysql({ version: AuroraMysqlEngineVersion.VER_2_08_1 }),
      instanceIdentifierBase: rdsName,
      instanceProps: {
        // optional , defaults to t3.medium
        instanceType: InstanceType.of(InstanceClass.BURSTABLE2, InstanceSize.SMALL),
        vpcSubnets: {
          subnetType: SubnetType.PRIVATE,
        },
        vpc,
      },
      monitoringInterval: Duration.seconds(60),
      port: Number(config('DB_PORT')),
      parameterGroup,
      removalPolicy: RemovalPolicy.DESTROY,
    })

    const rdsSg = new SecurityGroup(stack, rdsName, {
      vpc,
      allowAllOutbound: true,
      description: 'Allow access to RDS for security group'
    })

    cluster.connections.allowFrom(rdsSg, Port.tcp(Number(config('DB_PORT'))))
  }
}
