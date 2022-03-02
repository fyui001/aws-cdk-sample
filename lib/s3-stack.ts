import { Construct } from 'constructs'
import { Bucket } from 'aws-cdk-lib/aws-s3'
import { Stack } from 'aws-cdk-lib'

export default class S3Stack {
  public constructor(scope: Construct, id: string, bucketName: string) {
    const stack = new Stack(scope, id, { stackName: id })

    new Bucket(stack, id, {
      bucketName
    })
  }
}
