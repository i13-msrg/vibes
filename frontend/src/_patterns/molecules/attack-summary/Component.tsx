import * as React from 'react';

interface IAttackSummaryProps {
  attackSucceeded: number;
  successfulAttackInBlocks: number | null;
  probabilityOfSuccessfulAttack: number;
  maximumSafeTransactionValue: number;
  hashrate: number | null;
  confirmations: number | null;
  B: number | null;
  o: number | null;
  α: number | null;
  k: number | null;
}

export default class AttackSummary extends React.Component<IAttackSummaryProps, {}> {
  public render() {

    const {
        attackSucceeded,
        successfulAttackInBlocks,
        probabilityOfSuccessfulAttack,
        maximumSafeTransactionValue,
        hashrate,
        confirmations,
        B,
        o,
        α,
        k,
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
                              switch (attackSucceeded) {
                                case -1:    return 'failed';
                                case 0:     return 'neither failed nor succeeded';
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
                            Attacker's percentage of the total hashrate
                        </div>
                        <div className="attack-summary__result">
                            {hashrate}%
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
                            {α}
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
                            Maximum safe transaction value
                        </div>
                        <div className="attack-summary__result">
                            {maximumSafeTransactionValue} BTC
                        </div>
                    </li>

                </ul>
            </div>
    );
  }
}
