import * as React from 'react';

import { Strategies } from '../../../common/types';
import StrategyButton from '../../atoms/strategy-button/Component';

interface IStrategyPlateProps {
  onStrategyChange: (strategy: Strategies) => void;
  selectedStrategy: Strategies | null;
}

export default class StrategyPlate extends React.Component<IStrategyPlateProps, {}> {
  public render() {
    const { selectedStrategy } = this.props;

    return (
      <div className="strategy-plate u-plate">
        <div className="strategy-plate__title">
          Select Strategy
        </div>
        <div className="strategy-plate__content">
          <StrategyButton
            onClick={() => this.handleOnClickStrategy(Strategies.GENERIC_SIMULATION)}
            title="Generic Blockchain Simulation"
            selected={selectedStrategy === Strategies.GENERIC_SIMULATION}
          />
          <StrategyButton
            onClick={() => this.handleOnClickStrategy(Strategies.BITCOIN_LIKE_BLOCKCHAIN)}
            title="Bitcoin-like Blockchain Simulation"
            selected={selectedStrategy === Strategies.BITCOIN_LIKE_BLOCKCHAIN}
          />
          <StrategyButton
            onClick={() => this.handleOnClickStrategy(Strategies.PROOF_OF_STAKE)}
            title="Proof of Stake"
            selected={selectedStrategy === Strategies.PROOF_OF_STAKE}
          />
          <StrategyButton
            onClick={() => this.handleOnClickStrategy(Strategies.HYPERLEDGER)}
            title="Hyperledger"
            selected={selectedStrategy === Strategies.HYPERLEDGER}
          />
        </div>
      </div>
    );
  }

  private handleOnClickStrategy(strategy: Strategies) {
    this.props.onStrategyChange(strategy);
  }
}
