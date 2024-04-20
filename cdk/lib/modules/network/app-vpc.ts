import { Construct } from 'constructs';
import { EnvValues } from '../type/EnvValues';
import { CfnRouteTable, IpAddresses, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Tags } from 'aws-cdk-lib';

export interface AppVpcProps {
  readonly namePrefix: string;
  readonly envValues: EnvValues;
}

export class AppVpc extends Construct {
  public readonly vpc: Vpc;

  constructor(scope: Construct, id: string, props: AppVpcProps) {
    super(scope, id);

    const { namePrefix, envValues } = props;

    // VPCの作成
    const vpc = this.createVpc(namePrefix, envValues);

    // サブネットの名称変更
    this.renameSubnet(namePrefix, vpc);

    this.vpc = vpc;
  }

  private createVpc(namePrefix: string, envValues: EnvValues): Vpc {
    return new Vpc(this, 'Vpc', {
      vpcName: `${namePrefix}-app-vpc`,
      ipAddresses: IpAddresses.cidr(envValues.appVpcCidr),
      maxAzs: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'private',
          subnetType: SubnetType.PRIVATE_ISOLATED,
        },
      ],
      createInternetGateway: false,
    });
  }

  private renameSubnet(namePrefix: string, vpc: Vpc) {
    vpc.isolatedSubnets.forEach((subnet, index) => {
      const no = index + 1;
      Tags.of(subnet).add('Name', `${namePrefix}-private-subnet-${no}`);

      const rtb = subnet.node.findChild('RouteTable') as CfnRouteTable;
      Tags.of(rtb).add('Name', `${namePrefix}-private-rtb-${no}`);
    });
  }
}
