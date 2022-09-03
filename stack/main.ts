import FargateStack from './lib/fargate-cluster';
import { App } from 'aws-cdk-lib';

const app = new App();
let stack = new FargateStack( app, "RelicCluster" );
stack.AddService( { name: "RelicHtml", image: "relic-html" } )