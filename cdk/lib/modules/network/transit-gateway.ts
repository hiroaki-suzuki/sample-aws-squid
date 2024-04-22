import { Construct } from 'constructs';
import { CfnRoute, CfnTransitGateway, CfnTransitGatewayAttachment, Vpc } from 'aws-cdk-lib/aws-ec2';
import { ISubnet } from 'aws-cdk-lib/aws-ec2/lib/vpc';

export interface TransitGatewayProps {
  readonly namePrefix: string;
  readonly appVpc: Vpc;
  readonly proxyVpc: Vpc;
}

export class TransitGateway extends Construct {
  constructor(scope: Construct, id: string, props: TransitGatewayProps) {
    super(scope, id);

    const { namePrefix, appVpc, proxyVpc } = props;

    const transitGateway = new CfnTransitGateway(this, 'TransitGateway', {
      autoAcceptSharedAttachments: 'enable',
      defaultRouteTableAssociation: 'enable',
      defaultRouteTablePropagation: 'enable',
      dnsSupport: 'enable',
    });

    new CfnTransitGatewayAttachment(this, 'AppTransitGatewayAttachment', {
      transitGatewayId: transitGateway.ref,
      vpcId: appVpc.vpcId,
      subnetIds: appVpc.isolatedSubnets.map((subnet) => subnet.subnetId),
    });

    new CfnTransitGatewayAttachment(this, 'ProxyTransitGatewayAttachment', {
      transitGatewayId: transitGateway.ref,
      vpcId: proxyVpc.vpcId,
      subnetIds: proxyVpc.publicSubnets.map((subnet) => subnet.subnetId),
    });

    // this.addVpcRoute('App', appVpc.isolatedSubnets, proxyVpc.vpcCidrBlock, transitGateway);
    // this.addVpcRoute('Proxy', proxyVpc.publicSubnets, appVpc.vpcCidrBlock, transitGateway);
  }

  private addVpcRoute(
    idPrefix: string,
    subnets: ISubnet[],
    destinationCidrBlock: string,
    transitGateway: CfnTransitGateway,
  ) {
    subnets.map((subnet: ISubnet, index: number) => {
      const route = new CfnRoute(this, `${idPrefix}TransitGatewayRoute${index}`, {
        routeTableId: subnet.routeTable.routeTableId,
        destinationCidrBlock: destinationCidrBlock,
        transitGatewayId: transitGateway.ref,
      });
      route.addDependency(transitGateway);
    });
  }
}
