import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import {
  Instance,
  InstanceClass,
  InstanceSize,
  MachineImage,
  SecurityGroup,
  Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

export interface BastionEc2Props {
  readonly namePrefix: string;
  readonly vpc: Vpc;
  readonly securityGroup: SecurityGroup;
}

export class BastionEc2 extends Construct {
  constructor(scope: Construct, id: string, props: BastionEc2Props) {
    super(scope, id);

    const { namePrefix, vpc, securityGroup } = props;

    const role = new Role(this, 'Role', {
      roleName: `${namePrefix}-bastion-ec2-role`,
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        {
          managedPolicyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
        },
      ],
    });

    new Instance(this, 'Instance', {
      instanceName: `${namePrefix}-bastion-ec2`,
      vpc: vpc,
      machineImage: MachineImage.latestAmazonLinux2(),
      instanceType: ec2.InstanceType.of(InstanceClass.T2, InstanceSize.MICRO),
      role: role,
      securityGroup: securityGroup,
    });
  }
}
