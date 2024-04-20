import { Construct } from 'constructs';
import { CfnRoute, CfnVPCPeeringConnection, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Tags } from 'aws-cdk-lib';
import { ISubnet } from 'aws-cdk-lib/aws-ec2/lib/vpc';

export interface VpcPeeringProps {
  readonly namePrefix: string;
  readonly appVpc: Vpc;
  readonly proxyVpc: Vpc;
}

export class VpcPeering extends Construct {
  constructor(scope: Construct, id: string, props: VpcPeeringProps) {
    super(scope, id);

    const { namePrefix, appVpc, proxyVpc } = props;

    const vpcPeeringConnection = new CfnVPCPeeringConnection(this, 'VpcPeeringConnection', {
      vpcId: appVpc.vpcId,
      peerVpcId: proxyVpc.vpcId,
      peerRegion: 'ap-northeast-1',
    });
    Tags.of(vpcPeeringConnection).add('Name', `${namePrefix}-peering-pcx`);

    // AppVPCのルートテーブルに、プロキシVPCからのルートを追加
    this.addVpcPeeringRoute(
      'App',
      appVpc.isolatedSubnets,
      proxyVpc.vpcCidrBlock,
      vpcPeeringConnection.ref,
    );
    // ProxyVPCのルートテーブルに、AppVPCからのルートを追加
    this.addVpcPeeringRoute(
      'Proxy',
      proxyVpc.publicSubnets,
      appVpc.vpcCidrBlock,
      vpcPeeringConnection.ref,
    );
  }

  private addVpcPeeringRoute(
    idPrefix: string,
    subnets: ISubnet[],
    destinationCidrBlock: string,
    vpcPeeringConnectionId: string,
  ) {
    subnets.map((subnet: ISubnet, index: number) => {
      new CfnRoute(this, `${idPrefix}VpcPeeringRoute${index}`, {
        routeTableId: subnet.routeTable.routeTableId,
        destinationCidrBlock: destinationCidrBlock,
        vpcPeeringConnectionId: vpcPeeringConnectionId,
      });
    });
  }
}
