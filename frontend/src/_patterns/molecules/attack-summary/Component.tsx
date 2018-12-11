import * as React from 'react';

interface IAttackSummaryProps {
  attackSucceeded: number;
  successfulAttackInBlocks: number | null;
  probabilityOfSuccessfulAttack: number;
  maximumSafeTransactionValue: number;
  hashRate: number | null;
  confirmations: number | null;
  B: number | null;
  o: number | null;
  alpha: number | null;
  k: number | null;
  goodBlockchainLength: number;
  maliciousBlockchainLength: number;
}

export default class AttackSummary extends React.Component<IAttackSummaryProps, {}> {
  public render() {

    const {
        attackSucceeded,
        successfulAttackInBlocks,
        probabilityOfSuccessfulAttack,
        maximumSafeTransactionValue,
        hashRate,
        confirmations,
        B,
        o,
        alpha,
        k,
        goodBlockchainLength,
        maliciousBlockchainLength,
    } = this.props;

    return (
            <div className="attack-summary">
                <ul className="attack-summary__list">

                    <li className="attack-summary__list-item">
                        <div className="attack-summary__text">
                            The simulated attack
                        </div>
                        <div className="attack-summary__result">
                            {(() => {
                              if (confirmations === 0) {
                                return 'was successful';
                              }
                              switch (attackSucceeded) {
                                case -1:    return 'failed';
                                case 0:     return 'not yet decided';
                                case 1:     return 'was successful';
                                default:    return '';
                              }
                            })()}
                        </div>
                    </li>
                    {(() => {
                      switch (attackSucceeded) {
                        case -1:
                          return '';
                        case 0:
                          return '';
                        case 1:
                          return <li className="attack-summary__list-item">
                                    <div className="attack-summary__text">
                                        The Attacker is successful at block
                                    </div>
                                    <div className="attack-summary__result">
                                        {successfulAttackInBlocks}
                                    </div>
                                </li>;
                        default:
                          return '';
                      }
                    })()}

                    <li className="attack-summary__list-item">
                        <div className="attack-summary__text">
                            Attacker's percentage of the total hash rate
                        </div>
                        <div className="attack-summary__result">
                            {hashRate}%
                        </div>
                    </li>

                    <li className="attack-summary__list-item">
                        <div className="attack-summary__text">
                            Merchants wait for
                        </div>
                        <div className="attack-summary__result">
                            {confirmations} confirmations
                        </div>
                    </li>

                    <li className="attack-summary__list-item">
                        <div className="attack-summary__text">
                            Probability of an successful attack
                        </div>
                        <div className="attack-summary__result">
                            {probabilityOfSuccessfulAttack} %
                        </div>
                    </li>

                    <li className="attack-summary__list-item">
                        <div className="attack-summary__text">
                            Attack duration
                        </div>
                        <div className="attack-summary__result">
                            {o} Blocks
                        </div>
                    </li>

                    <li className="attack-summary__list-item">
                        <div className="attack-summary__text">
                            Discount on stolen goods
                        </div>
                        <div className="attack-summary__result">
                            {alpha}
                        </div>
                    </li>

                    <li className="attack-summary__list-item">
                        <div className="attack-summary__text">
                            Attacked merchants
                        </div>
                        <div className="attack-summary__result">
                            {k}
                        </div>
                    </li>

                    <li className="attack-summary__list-item">
                        <div className="attack-summary__text">
                            Block reward
                        </div>
                        <div className="attack-summary__result">
                            {B} BTC
                        </div>
                    </li>

                    <li className="attack-summary__list-item">
                        <div className="attack-summary__text">
                            Maximal safe transaction value
                        </div>
                        <div className="attack-summary__result">
                            {maximumSafeTransactionValue === 2147483647 ? '∞' : maximumSafeTransactionValue} BTC
                        </div>
                    </li>

                    {(() => {
                      if (goodBlockchainLength > maliciousBlockchainLength) {
                        return <li className="attack-summary__list-item">
                                <div className="attack-summary__text">
                                    Wasted blocks due to attack (at least)
                                </div>
                                <div className="attack-summary__result">
                                    {maliciousBlockchainLength - 1} Blocks
                                </div>
                            </li>;
                      }
                      return <li className="attack-summary__list-item">
                                <div className="attack-summary__text">
                                    Wasted blocks due to attack (at least)
                                </div>
                                <div className="attack-summary__result">
                                    {goodBlockchainLength - 1} Blocks
                                </div>
                            </li>;

                    })()}

                </ul>
            </div>
    );
  }
}
