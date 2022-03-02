import {App, Stack as BaseStack, StackProps} from 'aws-cdk-lib'
import { Construct } from 'constructs'
import RdsStack from './rds-stack'
import VpcStack from './vpc-stack'
import EcrStack from './ecr-stack'
import EcsStack from './ecs-stack'
import S3Stack from './s3-stack'
import config from '../config/config'

export default class Stack extends BaseStack {
    public constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props)
        const app = new App()
        new S3Stack(app, 'S3Stack', id)
        new EcrStack(app, 'EcrStack', id)
        const vpc = new VpcStack(app, 'VpcStack', id, config('AWS_VPC_CIDR'), Number(config('AWS_VPC_MAX_AZS')))
        new RdsStack(app, 'RdsStack', id, vpc.getVpc())
        new EcsStack(app, 'EcsStack', id, vpc.getVpc())
    }
}
