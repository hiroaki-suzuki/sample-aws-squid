export interface EnvValues {
  readonly env: Env;
  readonly appVpcCidr: string;
  readonly proxyVpcCidr: string;
}

export type Env = 'dev';
