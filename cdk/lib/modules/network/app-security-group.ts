import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Peer, SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import { BaseSecurityGroup } from '../base/base-security-group';

export interface AppSecurityGroupProps {
  readonly namePrefix: string;
  readonly vpc: Vpc;
}

export class AppSecurityGroup extends Construct {
  public readonly bastionSecurityGroup: BaseSecurityGroup;
  public readonly vpcEndpointSecurityGroup: BaseSecurityGroup;

  constructor(scope: Construct, id: string, props: AppSecurityGroupProps) {
    super(scope, id);

    const { namePrefix, vpc } = props;

    // 踏み台用EC2のセキュリティグループを作成
    const bastionSecurityGroup = this.createBastionSecurityGroup(namePrefix, vpc);

    // VPCエンドポイント用セキュリティグループを作成
    const vpcEndpointSecurityGroup = this.createVpcEndpointSecurityGroup(
      namePrefix,
      vpc,
      bastionSecurityGroup,
    );

    this.bastionSecurityGroup = bastionSecurityGroup;
    this.vpcEndpointSecurityGroup = vpcEndpointSecurityGroup;
  }

  private createBastionSecurityGroup(namePrefix: string, vpc: Vpc): SecurityGroup {
    const securityGroup = new BaseSecurityGroup(this, 'BastionSecurityGroup', {
      vpc: vpc,
      securityGroupName: `${namePrefix}-bastion-ec2-sg`,
    });

    return securityGroup;
  }

  private createVpcEndpointSecurityGroup(
    namePrefix: string,
    vpc: Vpc,
    bastionSecurityGroup: SecurityGroup,
  ): SecurityGroup {
    const securityGroup = new BaseSecurityGroup(this, 'VpcEndpointSecurityGroup', {
      vpc: vpc,
      securityGroupName: `${namePrefix}-vpc-endpoint-sg`,
    });
    securityGroup.addIngressRule(
      Peer.securityGroupId(bastionSecurityGroup.securityGroupId),
      ec2.Port.tcp(443),
    );

    return securityGroup;
  }
}
