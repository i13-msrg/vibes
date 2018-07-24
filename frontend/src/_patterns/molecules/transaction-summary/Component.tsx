import * as React from 'react';

interface ITransactionSummaryProps {
  isSegWitEnabled: boolean;
  segWitTheoreticalMaxBlockSize: number | null;
  segWitMaxBlockWeight: number | null;
  segWitMaxTransactionsPerBlock: number | null;
  segWitMaxTPS: number;
  nonSegWitMaxBlockSize: number | null;
  nonSegWitMaxTransactionsPerBlock: number;
  nonSegWitMaxTPS: number;
  actualTPS: number;
  blockchainSize: number;
  totalNumberOfProcessedTransactions: number;
  blockchainLength: number;
}

export default class TransactionSummary extends React.Component<ITransactionSummaryProps, {}> {
  public render() {

    const {
        isSegWitEnabled,
        segWitTheoreticalMaxBlockSize,
        segWitMaxBlockWeight,
        segWitMaxTransactionsPerBlock,
        segWitMaxTPS,
        nonSegWitMaxBlockSize,
        nonSegWitMaxTransactionsPerBlock,
        nonSegWitMaxTPS,
        actualTPS,
        blockchainSize,
        totalNumberOfProcessedTransactions,
        blockchainLength,
    } = this.props;

    return (
            <div className="transaction-summary">
                <ul className="transaction-summary__list">

                    <li className="transaction-summary__list-item">
                        <div className="transaction-summary__text">
                            SegWit is
                        </div>
                        <div className="transaction-summary__result">
                            <b>{isSegWitEnabled ? 'enabled' : 'disabled'}</b>
                        </div>
                    </li>
                    {isSegWitEnabled ?
                    <li className="transaction-summary__list-item">
                            <div className="transaction-summary__text">
                        SegWit theoretical block weight limit
                        </div>
                        <div className="transaction-summary__result">
                            {segWitTheoreticalMaxBlockSize !== null ?  segWitTheoreticalMaxBlockSize.toLocaleString() : 0} B
                        </div>
                    </li>
                    : '' }
                    {isSegWitEnabled ?
                        <li className="transaction-summary__list-item">
                            <div className="transaction-summary__text">
                                SegWit maximal block weight
                            </div>
                            <div className="transaction-summary__result">
                                {segWitMaxBlockWeight !== null ?  segWitMaxBlockWeight.toLocaleString() : 0} B
                            </div>
                        </li>
                        : '' }
                    <li className="transaction-summary__list-item">
                        <div className="transaction-summary__text">
                            Non-SegWit maximal block size
                        </div>
                        <div className="transaction-summary__result">
                            {nonSegWitMaxBlockSize !== null ?  (nonSegWitMaxBlockSize * 1000).toLocaleString() : 0} B
                        </div>
                    </li>
                    <li className="simulation-summary__list-item">
                        <div className="simulation-summary__text">
                            Average block size
                        </div>
                        <div className="simulation-summary__result">
                            {Math.round(blockchainSize / blockchainLength * 1000).toLocaleString()} B
                        </div>
                    </li>
                    {isSegWitEnabled ?
                        <li className="transaction-summary__list-item">
                            <div className="transaction-summary__text">
                                SegWit maximal transactions per block
                            </div>
                            <div className="transaction-summary__result">
                                {segWitMaxTransactionsPerBlock}
                            </div>
                        </li>
                        : '' }
                    <li className="transaction-summary__list-item">
                        <div className="transaction-summary__text">
                            Non-SegWit maximal transactions per block
                        </div>
                        <div className="transaction-summary__result">
                            {nonSegWitMaxTransactionsPerBlock}
                        </div>
                    </li>
                    {isSegWitEnabled ?
                        <li className="transaction-summary__list-item">
                            <div className="transaction-summary__text">
                                SegWit maximal transactions per second
                            </div>
                            <div className="transaction-summary__result">
                                {segWitMaxTPS}
                            </div>
                        </li>
                        : '' }
                    <li className="transaction-summary__list-item">
                        <div className="transaction-summary__text">
                            Non-SegWit maximal transactions per second
                        </div>
                        <div className="transaction-summary__result">
                            {nonSegWitMaxTPS}
                        </div>
                    </li>
                    <li className="simulation-summary__list-item">
                        <div className="simulation-summary__text">
                            Average transactions per second
                        </div>
                        <div className="simulation-summary__result">
                            {actualTPS}
                        </div>
                    </li>
                    <li className="simulation-summary__list-item">
                        <div className="simulation-summary__text">
                            Blockchain size
                        </div>
                        <div className="simulation-summary__result">
                            {blockchainSize} KB
                        </div>
                    </li>
                    <li className="simulation-summary__list-item">
                        <div className="simulation-summary__text">
                            Total number of processed transactions
                        </div>
                        <div className="simulation-summary__result">
                            {totalNumberOfProcessedTransactions.toLocaleString()}
                        </div>
                    </li>
                </ul>
            </div>
    );
  }
}
