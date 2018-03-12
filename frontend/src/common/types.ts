export enum Strategies {
  GENERIC_SIMULATION = 'GENERIC_SIMULATION',
  PROOF_OF_STAKE = 'PROOF_OF_STAKE',
  PROOF_OF_WORK = 'PROOF_OF_WORK',
  HYPERLEDGER = 'HYPERLEDGER',
}


export interface INumberOfNodesConfiguration {
  numberOfNodes: number | null;
}

export interface INumberOfNeighboursConfiguration {
  numberOfNeighbours: number | null;
}

export interface IBlockTime {
  blockTime: number | null;
}

export interface ITransactionSize {
  transactionSize: number | null;
}

export interface ISimulateUntil {
  simulateUntil: number | null;
}

export interface IThroughput {
  throughput: number | null;
}

export interface ILatency {
  latency: number | null;
}

export interface INeighboursDiscoveryInterval {
  neighboursDiscoveryInterval: number | null;
}

export interface IConfiguration extends
  INumberOfNodesConfiguration,
  INumberOfNeighboursConfiguration,
  IBlockTime,
  ITransactionSize,
  ISimulateUntil,
  IThroughput,
  ILatency,
  INeighboursDiscoveryInterval {
  [index: string]: number | null;
}

export type ConfigurationEntity =
  INumberOfNodesConfiguration |
  INumberOfNeighboursConfiguration |
  IBlockTime |
  ITransactionSize |
  ISimulateUntil |
  IThroughput |
  ILatency;

export type ConfigurationKey = keyof IConfiguration;

export interface ISvg {
  id: string;
  viewBox: string;
}
