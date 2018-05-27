import * as React from 'react';
import convertToDisplayTime from '../../../common/convertToDisplayTime';

interface ISimulationSummaryProps {
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
  totalNumberOfNodes: number;
  orphans: number;
}

export default class SimulationSummary extends React.Component<ISimulationSummaryProps, {}> {
  public render() {

    const {
      duration,
      longestChainLength,
      orphans,
      longestChainSize,
      longestChainNumberTransactions,
      firstBlockNumberOfRecipients,
      lastBlockNumberOfRecipients,
      totalNumberOfNodes,
      timesWithOutliers10,
      timesWithOutliers50,
      timesWithOutliers90,
      timesNoOutliers10,
      timesNoOutliers50,
      timesNoOutliers90,
    } = this.props;

    // map(() => ... yep)
    return (
      <div className="simulation-summary">
        <ul className="simulation-summary__list">
          <li className="simulation-summary__list-item">
            <div className="simulation-summary__text">
              Simulation duration
            </div>
            <div className="simulation-summary__result">
              {convertToDisplayTime(duration)}
            </div>
          </li>
          <li className="simulation-summary__list-item">
            <div className="simulation-summary__text">
              Blockchain length
            </div>
            <div className="simulation-summary__result">
              {longestChainLength} Blocks
            </div>
          </li>
            <li className="simulation-summary__list-item">
                <div className="simulation-summary__text">
                    Total number of orphan blocks
                </div>
                <div className="simulation-summary__result">
                    {orphans}
                </div>
            </li>
          <li className="simulation-summary__list-item">
            <div className="simulation-summary__text">
              Blockchain size
            </div>
            <div className="simulation-summary__result">
              {longestChainSize} KB
            </div>
          </li>
          <li className="simulation-summary__list-item">
            <div className="simulation-summary__text">
              Total number of nodes
            </div>
            <div className="simulation-summary__result">
              {totalNumberOfNodes}
            </div>
          </li>
            <li className="simulation-summary__list-item">
                <div className="simulation-summary__text">
                    Total number of transactions
                </div>
                <div className="simulation-summary__result">
                    {longestChainNumberTransactions}
                </div>
            </li>
          <li className="simulation-summary__list-item">
            <div className="simulation-summary__text">
              First block received by
            </div>
            <div className="simulation-summary__result">
              {firstBlockNumberOfRecipients} nodes
            </div>
          </li>
          <li className="simulation-summary__list-item">
            <div className="simulation-summary__text">
              Last block received by
            </div>
            <div className="simulation-summary__result">
              {lastBlockNumberOfRecipients} nodes
            </div>
          </li>
          <li className="simulation-summary__list-item">
            <div className="simulation-summary__text">
              Propagation delay 10%
            </div>
            <div className="simulation-summary__result">
              {convertToDisplayTime(timesWithOutliers10)}
            </div>
          </li>
          <li className="simulation-summary__list-item">
            <div className="simulation-summary__text">
              Propagation delay 50%
            </div>
            <div className="simulation-summary__result">
              {convertToDisplayTime(timesWithOutliers50)}
            </div>
          </li>
          <li className="simulation-summary__list-item">
            <div className="simulation-summary__text">
              Propagation delay 90%
            </div>
            <div className="simulation-summary__result">
              {convertToDisplayTime(timesWithOutliers90)}
            </div>
          </li>

          <li className="simulation-summary__list-item">
            <div className="simulation-summary__text">
              Propagation delay (NOOUTL.) 10%
            </div>
            <div className="simulation-summary__result">
              {convertToDisplayTime(timesNoOutliers10)}
            </div>
          </li>
          <li className="simulation-summary__list-item">
            <div className="simulation-summary__text">
              Propagation delay (NOOUTL.) 50%
            </div>
            <div className="simulation-summary__result">
              {convertToDisplayTime(timesNoOutliers50)}
            </div>
          </li>
          <li className="simulation-summary__list-item">
            <div className="simulation-summary__text">
              Propagation delay (NOOUTL.) 90%
            </div>
            <div className="simulation-summary__result">
              {convertToDisplayTime(timesNoOutliers90)}
            </div>
          </li>
        </ul>
      </div>
    );
  }
}
