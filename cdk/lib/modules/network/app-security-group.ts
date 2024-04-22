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
  public readonly proxySecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: AppSecurityGroupProps) {
    super(scope, id);

    const { namePrefix, vpc } = props;

    // 踏み台用EC2のセキュリティグループを作成
    const bastionSecurityGroup = this.createBastionSecurityGroup(namePrefix, vpc);

    // プロキシ用EC2のセキュリティグループを作成
    const proxySecurityGroup = this.createProxySecurityGroup(namePrefix, vpc);

    // VPCエンドポイント用セキュリティグループを作成
    const vpcEndpointSecurityGroup = this.createVpcEndpointSecurityGroup(namePrefix, vpc, [
      bastionSecurityGroup,
      proxySecurityGroup,
    ]);

    this.bastionSecurityGroup = bastionSecurityGroup;
    this.vpcEndpointSecurityGroup = vpcEndpointSecurityGroup;
    this.proxySecurityGroup = proxySecurityGroup;
  }

  private createBastionSecurityGroup(namePrefix: string, vpc: Vpc): SecurityGroup {
    const securityGroup = new BaseSecurityGroup(this, 'BastionSecurityGroup', {
      vpc: vpc,
      securityGroupName: `${namePrefix}-app-bastion-ec2-sg`,
    });

    return securityGroup;
  }

  private createProxySecurityGroup(namePrefix: string, vpc: Vpc): SecurityGroup {
    const securityGroup = new SecurityGroup(this, 'SquidEc2SecurityGroup', {
      vpc: vpc,
      securityGroupName: `${namePrefix}-app-squid-ec2-sg`,
    });
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(3128));

    return securityGroup;
  }

  private createVpcEndpointSecurityGroup(
    namePrefix: string,
    vpc: Vpc,
    SecurityGroups: SecurityGroup[],
  ): SecurityGroup {
    const securityGroup = new BaseSecurityGroup(this, 'VpcEndpointSecurityGroup', {
      vpc: vpc,
      securityGroupName: `${namePrefix}-app-vpc-endpoint-sg`,
    });
    SecurityGroups.forEach((sg) => {
      securityGroup.addIngressRule(Peer.securityGroupId(sg.securityGroupId), ec2.Port.tcp(443));
    });

    return securityGroup;
  }
}
