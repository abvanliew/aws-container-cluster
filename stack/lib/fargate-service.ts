import { Construct } from 'constructs';
import { Cluster, ContainerImage } from "aws-cdk-lib/aws-ecs";
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { ServiceProps } from './fargate-cluster';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { CfnOutput, Duration } from 'aws-cdk-lib';
import { AdjustmentType, MetricAggregationType } from 'aws-cdk-lib/aws-applicationautoscaling';

export interface ClusterServiceProps extends ServiceProps {
  cluster: Cluster
};

export default class FargateService extends Construct {
  constructor( scope: Construct, id: string, props: ClusterServiceProps ) {
    super( scope, id );

    const app = new ApplicationLoadBalancedFargateService( this, "AppService", {
      cluster: props.cluster, 
      taskImageOptions: { 
        image: ContainerImage.fromEcrRepository( 
          Repository.fromRepositoryName( this, "ElasticRepo", props.image ) 
      ) },
      desiredCount: props.count?? 1, 
      cpu: props.cpu?? 256, 
      memoryLimitMiB: props.memory?? 512, 
      publicLoadBalancer: true, 
    } );

    const scaler = app.service.autoScaleTaskCount( { 
      minCapacity: 0, 
      maxCapacity: 1, 
    } );

    const connectionMetric = app.loadBalancer.metric( 
      "ActiveConnectionCount", 
      { 
        statistic: "Sum", 
        period: Duration.seconds( 10 ),
      } );

    scaler.scaleOnMetric( "MetricScaling", {
      metric: connectionMetric,
      metricAggregationType: MetricAggregationType.AVERAGE, 
      cooldown: Duration.seconds( 30 ),
      adjustmentType: AdjustmentType.EXACT_CAPACITY, 
      scalingSteps: [
        { upper: 0, change: 0 },
        { lower: 1, change: 1 },
      ],
    } );

    // scaler.scaleOnRequestCount( "RequestScaling", {
    //   targetGroup: app.targetGroup,
    //   requestsPerTarget: 10, 
    //   scaleInCooldown: Duration.seconds( 4 ), 
    //   scaleOutCooldown: Duration.seconds( 64 ), 
    // } )
  }
}
