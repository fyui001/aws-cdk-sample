import 'source-map-support/register'
import { App } from 'aws-cdk-lib'
import Stack from '../lib/stack'
import config from '../config/config'

const app = new App()
new Stack(app, config('APPLICATION_NAMESPACE'))
