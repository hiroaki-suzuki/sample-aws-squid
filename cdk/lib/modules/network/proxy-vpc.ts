import { Construct } from 'constructs';
import { EnvValues } from '../type/EnvValues';
import {
  CfnInternetGateway,
  CfnRouteTable,
  IpAddresses,
  SubnetType,
  Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { Tags } from 'aws-cdk-lib';

export interface AppVpcProps {
  readonly namePrefix: string;
  readonly envValues: EnvValues;
}

export class ProxyVpc extends Construct {
  public readonly vpc: Vpc;

  constructor(scope: Construct, id: string, props: AppVpcProps) {
    super(scope, id);

    const { namePrefix, envValues } = props;

    // VPCの作成
    const vpc = this.createVpc(namePrefix, envValues);

    // サブネットの名称変更
    this.renameSubnet(namePrefix, vpc);

    // IGWの名称変更
    this.renameIGW(namePrefix, vpc);

    this.vpc = vpc;
  }

  private createVpc(namePrefix: string, envValues: EnvValues): Vpc {
    return new Vpc(this, 'Vpc', {
      vpcName: `${namePrefix}-proxy-vpc`,
      ipAddresses: IpAddresses.cidr(envValues.proxyVpcCidr),
      maxAzs: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: SubnetType.PUBLIC,
        },
      ],
    });
  }

  private renameSubnet(namePrefix: string, vpc: Vpc) {
    vpc.publicSubnets.forEach((subnet, index) => {
      const no = index + 1;
      Tags.of(subnet).add('Name', `${namePrefix}-public-subnet-${no}`);

      const rtb = subnet.node.findChild('RouteTable') as CfnRouteTable;
      Tags.of(rtb).add('Name', `${namePrefix}-public-rtb-${no}`);
    });
  }

  private renameIGW(namePrefix: string, vpc: Vpc) {
    const igw = vpc.node.findChild('IGW') as CfnInternetGateway;
    Tags.of(igw).add('Name', `${namePrefix}-igw`);
  }
}
