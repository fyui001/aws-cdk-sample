import { Construct } from 'constructs'
import { Repository } from 'aws-cdk-lib/aws-ecr'
import { Stack } from 'aws-cdk-lib'

export default class EcrStack {
  public constructor(scope: Construct, id: string, imageIdPrefix: string) {
    const stack = new Stack(scope, id, { stackName: id })

    /** web container repository */
    new Repository(stack, 'WebImageRepository', {
      imageScanOnPush: true,
      repositoryName: `${imageIdPrefix}/web`
    })

    /** app container repository */
    new Repository(stack, 'AppImageRepository', {
      imageScanOnPush: true,
      repositoryName: `${imageIdPrefix}/app`
    })
  }
}
