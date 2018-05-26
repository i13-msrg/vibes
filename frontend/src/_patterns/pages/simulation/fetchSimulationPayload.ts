import _fetch from '../../../common/fetch';
import { IConfiguration} from '../../../common/types';
import {IBlockMine, IBlockTransfer, ITransaction} from '../../molecules/simulation-events/types';

export interface ISimulationPayload {
  events: (IBlockMine | IBlockTransfer)[];
  duration: number;
  longestChainLength: number;
  longestChainSize: number;
  longestChainNumberTransactions: number;
  timesWithOutliers10: number | null;
  timesWithOutliers50: number | null;
  timesWithOutliers90: number | null;
  timesNoOutliers10: number | null;
  timesNoOutliers50: number | null;
  timesNoOutliers90: number | null;
  firstBlockNumberOfRecipients: number;
  lastBlockNumberOfRecipients: number;
  transactions: (ITransaction)[];
  totalNumberOfNodes: number;
}

export default function fetchSimulationPayload(configuration: IConfiguration): Promise<ISimulationPayload> {
  let params = '';

  const { onNewSimulation, ...rest } = configuration;

  if (configuration) {
    params = Object.entries(rest).map(([key, value]) => key + '=' + value).join('&');
  }

  return _fetch(`http://localhost:8082/vibe?${params}`);
}
