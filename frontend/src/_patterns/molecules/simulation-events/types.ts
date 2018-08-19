export enum EventTypes {
  IBlockMine = 'MinedBlock',
  IBlockTransfer = 'TransferBlock',
}

export interface INode {
  id: string;
  lat: number;
  long: number;
}

export interface IBlockMine {
  eventType: EventTypes.IBlockMine;
  timestamp: Date;
  origin: INode;
  transactionPoolSize: number;
  level: number;
  isMalicious: boolean;
}

export interface IBlockTransfer {
  eventType: EventTypes.IBlockTransfer;
  timestamp: Date;
  fromNode: INode;
  toNode: INode;
}

export interface ITransaction {
  transactionFee: number;
  confirmation: boolean;
  confirmationLevel: number;
  creationLevel: number;
  isFloodAttack: boolean;
}
