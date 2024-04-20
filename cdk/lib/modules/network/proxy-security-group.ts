import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import { BaseSecurityGroup } from '../base/base-security-group';

export interface AppSecurityGroupProps {
  readonly namePrefix: string;
  readonly vpc: Vpc;
}

export class ProxySecurityGroup extends Construct {
  public readonly proxySecurityGroup: BaseSecurityGroup;

  constructor(scope: Construct, id: string, props: AppSecurityGroupProps) {
    super(scope, id);

    const { namePrefix, vpc } = props;

    this.proxySecurityGroup = this.createProxySecurityGroup(namePrefix, vpc);
  }

  private createProxySecurityGroup(namePrefix: string, vpc: Vpc): SecurityGroup {
    const securityGroup = new SecurityGroup(this, 'SquidEc2SecurityGroup', {
      vpc: vpc,
      securityGroupName: `${namePrefix}-squid-ec2-sg`,
    });
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22));
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(3128));

    return securityGroup;
  }
}
