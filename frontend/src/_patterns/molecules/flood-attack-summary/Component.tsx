import * as React from 'react';

interface IFloodAttackSummaryProps {
  confirmedFloodAttackTransactions: number;
  floodAttackSpentTransactionFees: number;
  confirmedTransactionsBelowTargetTransactionFee: number;
}

export default class FloodAttackSummary extends React.Component<IFloodAttackSummaryProps, {}> {
  public render() {

    const {
            confirmedFloodAttackTransactions,
            floodAttackSpentTransactionFees,
            confirmedTransactionsBelowTargetTransactionFee,
        } = this.props;

    return (
            <div className="flood-attack-summary">
                <ul className="flood-attack-summary__list">

                    <li className="flood-attack-summary__list-item">
                        <div className="flood-attack-summary__text">
                            Confirmed flood attack transactions
                        </div>
                        <div className="flood-attack-summary__result">
                            <b>{confirmedFloodAttackTransactions}</b>
                        </div>
                    </li>
                    <li className="flood-attack-summary__list-item">
                        <div className="flood-attack-summary__text">
                            Flood attacker spent
                        </div>
                        <div className="flood-attack-summary__result">
                            {floodAttackSpentTransactionFees} Satoshi
                        </div>
                    </li>
                    <li className="flood-attack-summary__list-item">
                        <div className="flood-attack-summary__text">
                            Confirmed transactions below target
                        </div>
                        <div className="flood-attack-summary__result">
                            {confirmedTransactionsBelowTargetTransactionFee}
                        </div>
                    </li>
                </ul>
            </div>
    );
  }
}
