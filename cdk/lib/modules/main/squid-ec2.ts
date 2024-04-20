import { Construct } from 'constructs';
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import {
  CloudFormationInit,
  InitCommand,
  InitConfig,
  InitFile,
  Instance,
  InstanceClass,
  InstanceSize,
  MachineImage,
  SecurityGroup,
  Vpc,
} from 'aws-cdk-lib/aws-ec2';

export interface SquidEc2Props {
  readonly namePrefix: string;
  readonly vpc: Vpc;
  readonly securityGroup: SecurityGroup;
}

export class SquidEc2 extends Construct {
  constructor(scope: Construct, id: string, props: SquidEc2Props) {
    super(scope, id);

    const { namePrefix, vpc, securityGroup } = props;

    const role = new Role(this, 'Role', {
      roleName: `${namePrefix}-squid-ec2-role`,
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        {
          managedPolicyArn: 'arn:aws:iam::aws:policy/EC2InstanceConnect',
        },
      ],
    });

    new Instance(this, 'Instance', {
      instanceName: `${namePrefix}-squid-ec2`,
      vpc: vpc,
      machineImage: MachineImage.latestAmazonLinux2(),
      instanceType: ec2.InstanceType.of(InstanceClass.T2, InstanceSize.MICRO),
      role: role,
      securityGroup: securityGroup,
      userDataCausesReplacement: true,
      init: CloudFormationInit.fromConfigSets({
        configSets: {
          default: ['config'],
        },
        configs: {
          config: new InitConfig([
            InitCommand.shellCommand('yum update -y'),
            InitCommand.shellCommand('yum -y install squid'),
            InitFile.fromFileInline('/etc/squid/squid.conf', './lib/files/squid/squid.conf'),
            InitFile.fromFileInline('/etc/squid/whitelist', './lib/files/squid/whitelist'),
            InitCommand.shellCommand('systemctl start squid'),
            InitCommand.shellCommand('systemctl enable squid'),
          ]),
        },
      }),
    });
  }
}
