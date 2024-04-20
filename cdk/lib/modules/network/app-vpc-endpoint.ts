import { Construct } from 'constructs';
import {
  InterfaceVpcEndpoint,
  InterfaceVpcEndpointAwsService,
  SecurityGroup,
  Vpc,
} from 'aws-cdk-lib/aws-ec2';

export interface AppVpcEndpointProps {
  readonly namePrefix: string;
  readonly vpc: Vpc;
  readonly securityGroup: SecurityGroup;
}

export class AppVpcEndpoint extends Construct {
  constructor(scope: Construct, id: string, props: AppVpcEndpointProps) {
    super(scope, id);

    const { vpc, securityGroup } = props;

    // SSMのインターフェースエンドポイントを作成する
    this.createInterfaceEndpoint('Ssm', InterfaceVpcEndpointAwsService.SSM, vpc, securityGroup);

    // SSMとのメッセージのインターフェースエンドポイントを作成する
    this.createInterfaceEndpoint(
      'SsmMessages',
      InterfaceVpcEndpointAwsService.SSM_MESSAGES,
      vpc,
      securityGroup,
    );

    // EC2とのメッセージのインターフェースエンドポイントを作成する
    this.createInterfaceEndpoint(
      'Ec2Messages',
      InterfaceVpcEndpointAwsService.EC2_MESSAGES,
      vpc,
      securityGroup,
    );
  }

  private createInterfaceEndpoint(
    id: string,
    service: InterfaceVpcEndpointAwsService,
    vpc: Vpc,
    securityGroup: SecurityGroup,
  ): InterfaceVpcEndpoint {
    return vpc.addInterfaceEndpoint(`${id}Endpoint`, {
      service: service,
      subnets: { subnets: vpc.isolatedSubnets },
      securityGroups: [securityGroup],
    });
  }
}
