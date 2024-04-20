import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EnvValues } from './modules/type/EnvValues';
import { AppVpc } from './modules/network/app-vpc';
import { AppSecurityGroup } from './modules/network/app-security-group';
import { AppVpcEndpoint } from './modules/network/app-vpc-endpoint';
import { BastionEc2 } from './modules/main/bastion-ec2';
import { ProxyVpc } from './modules/network/proxy-vpc';
import { SquidEc2 } from './modules/main/squid-ec2';
import { ProxySecurityGroup } from './modules/network/proxy-security-group';

export interface CdkStackProps extends cdk.StackProps {
  readonly namePrefix: string;
  readonly envValues: EnvValues;
}

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CdkStackProps) {
    super(scope, id, props);

    const { namePrefix, envValues } = props;

    // =================================================================================
    // メインのリソースを作成
    // =================================================================================

    // VPCを作成
    const appVpc = new AppVpc(this, 'AppVpc', {
      namePrefix,
      envValues,
    });

    // セキュリティグループを作成
    const appSecurityGroup = new AppSecurityGroup(this, 'AppSecurityGroup', {
      namePrefix,
      vpc: appVpc.vpc,
    });

    // VPCエンドポイントを作成
    new AppVpcEndpoint(this, 'AppVpcEndpoint', {
      namePrefix,
      vpc: appVpc.vpc,
      securityGroup: appSecurityGroup.vpcEndpointSecurityGroup,
    });

    // Bastionサーバーを作成
    new BastionEc2(this, 'BastionEc2', {
      namePrefix,
      vpc: appVpc.vpc,
      securityGroup: appSecurityGroup.bastionSecurityGroup,
    });

    // =================================================================================
    // Proxy用のリソースを作成
    // =================================================================================

    // Proxy用VPCを作成
    const proxyVpc = new ProxyVpc(this, 'ProxyVpc', {
      namePrefix,
      envValues,
    });

    // Proxy用セキュリティグループを作成
    const proxySecurityGroup = new ProxySecurityGroup(this, 'ProxySecurityGroup', {
      namePrefix,
      vpc: proxyVpc.vpc,
    });

    // Squidサーバーを作成
    new SquidEc2(this, 'SquidEc2', {
      namePrefix,
      vpc: proxyVpc.vpc,
      securityGroup: proxySecurityGroup.proxySecurityGroup,
    });

    // // =================================================================================
    // // VPCの接続
    // // =================================================================================
    // // VPCPeeringは、Proxyの場合は上手くいかない
    // new VpcPeering(this, 'VpcPeering', {
    //   namePrefix,
    //   appVpc: appVpc.vpc,
    //   proxyVpc: proxyVpc.vpc,
    // });
    // Transit Gatewayを作成
  }
}
