import { Construct } from 'constructs';
import { DefaultStackSynthesizer, Stack, StackProps } from 'aws-cdk-lib';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { Cluster } from "aws-cdk-lib/aws-ecs";
import FargateService from './fargate-service';

export interface ServiceProps {
  name: string
  image: string
  private?: boolean
  count?: number
  cpu?: number // milicores
  memory?: number // in MB
}

export default class FargateStack extends Stack {
  readonly vpc: Vpc
  readonly cluster: Cluster

  constructor(scope: Construct, id: string, props?: StackProps) {
    let defaultedProps: StackProps = { 
      synthesizer: new DefaultStackSynthesizer( {
        generateBootstrapVersionRule: false
      } ),
      ...props
    }
    super( scope, id, defaultedProps );

    this.vpc = new Vpc( this, "FargateVPC", {
      maxAzs: 3
    } );

    const cluster = new Cluster( this, "FargateCluster", {
      vpc: this.vpc
    } );
  }

  AddService( props: ServiceProps ) {
    new FargateService( this, props.name, { ...props, cluster: this.cluster } )
  }
}
