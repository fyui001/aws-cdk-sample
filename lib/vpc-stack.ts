import { Stack } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { Vpc } from 'aws-cdk-lib/aws-ec2'

export default class VpcStack {
  private readonly vpc: Vpc

  public constructor(scope: Construct, id: string, vpcNamePrefix: string, cidr: string, maxAzs: number) {
    const stack = new Stack(scope, id, { stackName: id })

    this.vpc = new Vpc(stack, `${vpcNamePrefix}-VPC`, {
      cidr,
      maxAzs,
    })
  }

  public getVpc(): Vpc {
    return this.vpc
  }
}
