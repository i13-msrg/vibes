import * as React from 'react';

interface IAttackSummaryProps {
  attackSuccessful: boolean;
  successfulAttackInBlocks: number | null;
  probabilityOfSuccessfulAttack: number;
  maximumSafeTransactionValue: number;
  hashrate: number | null;
  confirmations: number | null;
}

export default class AttackSummary extends React.Component<IAttackSummaryProps, {}> {
  public render() {

    const {
        attackSuccessful,
        successfulAttackInBlocks,
        probabilityOfSuccessfulAttack,
        maximumSafeTransactionValue,
        hashrate,
        confirmations,
    } = this.props;

        return (
            <div className="attack-summary">
                <ul className="attack-summary__list">
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
                            The simulated attack
                        </div>
                        <div className="attack-summary__result">
                            {attackSuccessful ? 'was successful.' : 'failed.'}
                        </div>
                    </li>
                    {attackSuccessful ?
                    <li className="attack-summary__list-item">
                        <div className="attack-summary__text">
                            The attacker had to mine
                        </div>
                        <div className="attack-summary__result">
                            {successfulAttackInBlocks} Blocks
                        </div>
                    </li>
                    : '' }
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
