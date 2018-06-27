import * as React from 'react';
import { IConfiguration, Strategies } from '../../../common/types';
import DataMap from '../../organisms/datamap/Component';
import SimulationSummary from '../../molecules/simulation-summary/Component';
import AttackSummary from '../../molecules/attack-summary/Component';
import BlockTree from '../../molecules/block-tree/Component';
import SimulationEvents from '../../molecules/simulation-events/Component';
import Button from '../../atoms/button/Component';
import fetchEvents, { ISimulationPayload } from './fetchSimulationPayload';
import EventsRange from '../../molecules/events-range/Component';
import { Chart } from 'react-google-charts';
import { EventTypes } from '../../molecules/simulation-events/types';

// Uncaught Error: Google Charts loader.js can only be loaded once.
// This error seems to be on the side of the package.
// https://github.com/rakannimer/react-google-charts/issues/195

interface ISimulationState {
  selectedIndex?: number;
  moveIntoViewPort: boolean;
  simulationPayload?: ISimulationPayload;
  isFetching: boolean;
}

interface ISimulationProps extends IConfiguration {
  [index: string]: any;

  onNewSimulation: () => void;
}

export default class Simulation extends React.Component<ISimulationProps, ISimulationState> {
  private static transactionConfirmationStatusPerFee(simulationPayload: ISimulationPayload) {
    const multi: any[][] = [['Transaction Fees', 'Confirmed Transactions', 'Unconfirmed Transactions']];

    for (const transaction of simulationPayload.transactions) {
      for (let j = 0; j < multi.length; j += 1) {
        if (multi[j][0] === transaction.transactionFee) {
          if (transaction.confirmation) {
            multi[j][1] += 1;
          } else {
            multi[j][2] += 1;
          }
          break;
        } else if (j === multi.length - 1) {
          if (transaction.confirmation) {
            multi.push([transaction.transactionFee, 1, 0]);
          } else {
            multi.push([transaction.transactionFee, 0, 1]);
          }
        }
      }
    }

    return multi;
  }

  private static confirmationTime(simulationPayload: ISimulationPayload) {
    const multi: number[][] = [[]];
    for (const transaction of simulationPayload.transactions) {
      for (let j = 0; j < multi.length; j += 1) {
        if (multi[j][0] === transaction.transactionFee) {
          if (transaction.confirmation) {
            multi[j][1] += 1;
            multi[j][2] = multi[j][2]
                            + transaction.confirmationLevel
                            - transaction.creationLevel;
          }
          break;
        } else if (j === multi.length - 1) {
          multi.push([transaction.transactionFee, 1, 0]);
        }
      }
    }

    const multi2: any[][] = [['Transaction Fees', 'Confirmation Time']];
    for (const item of multi) {
      multi2.push([item[0], Math.round(item[2] / item[1] * 100) / 100]);
    }

    return multi2;
  }

  private static timeBetweenBlocks(simulationPayload: any) {
    const multi: any[][] = [['Blocks', 'Time (in minute)'], [1, 0]];

    for (let i = 1; i < simulationPayload.events.length; i += 1) {
      if (simulationPayload.events[i].eventType === EventTypes.IBlockMine) {
        multi.push([simulationPayload.events[i].level + 1,
          (new Date(simulationPayload.events[i].timestamp).getTime()
                        - new Date(simulationPayload.events[i - 1].timestamp).getTime()) / 1000 / 60]);
      }
    }
    return multi;
  }

  private static pendingTransactions(simulationPayload: any) {
    const multi: any[][] = [['Blocks', 'Pending Transactions']];

    for (const event of simulationPayload.events) {
      if (event.eventType === EventTypes.IBlockMine) {
        multi.push([event.level + 1, event.transactionPoolSize]);
      }
    }

    return multi;
  }

  constructor(props: ISimulationProps) {
    super(props);

    this.state = { moveIntoViewPort: false, isFetching: false };
    this.handleSelectIndex = this.handleSelectIndex.bind(this);
    this.fetchEvents = this.fetchEvents.bind(this);
  }

  public render() {
    const { simulationPayload, selectedIndex, moveIntoViewPort, isFetching } = this.state;
    if (this.props.strategy === 'BITCOIN_LIKE_BLOCKCHAIN') {
      return (
                <div className="simulation">

                    <div className="simulation__grid">
                        <div className="simulation__map u-plate">
                            <div className="simulation__title">
                                Simulation
                            </div>
                            <DataMap
                                event={(simulationPayload && selectedIndex !== undefined)
                                    ? simulationPayload.events[selectedIndex]
                                    : undefined}
                            />
                            <EventsRange
                                events={simulationPayload ? simulationPayload.events : undefined}
                                selectedIndex={selectedIndex}
                                onSelectIndex={this.handleSelectIndex}
                            />
                        </div>

                        <div className="simulation__summary u-plate">
                            <div className="simulation-summary__title">
                                Summary
                            </div>
                            {simulationPayload && (
                                <SimulationSummary
                                    duration={simulationPayload.duration}
                                    longestChainLength={simulationPayload.longestChainLength}
                                    longestChainSize={simulationPayload.longestChainSize}
                                    longestChainNumberTransactions={simulationPayload.longestChainNumberTransactions}
                                    timesWithOutliers10={simulationPayload.timesWithOutliers10}
                                    timesWithOutliers50={simulationPayload.timesWithOutliers50}
                                    timesWithOutliers90={simulationPayload.timesWithOutliers90}
                                    timesNoOutliers10={simulationPayload.timesNoOutliers10}
                                    timesNoOutliers50={simulationPayload.timesNoOutliers50}
                                    timesNoOutliers90={simulationPayload.timesNoOutliers90}
                                    firstBlockNumberOfRecipients={simulationPayload.firstBlockNumberOfRecipients}
                                    lastBlockNumberOfRecipients={simulationPayload.lastBlockNumberOfRecipients}
                                    totalNumberOfNodes={simulationPayload.totalNumberOfNodes}
                                    orphans={simulationPayload.orphans}
                                />
                            )}
                        </div>
                        <div className="simulation__events u-plate">
                            <SimulationEvents
                                events={simulationPayload ? simulationPayload.events : undefined}
                                selectedIndex={selectedIndex}
                                onSelectIndex={this.handleSelectIndex}
                                moveIntoViewPort={moveIntoViewPort}
                            />
                        </div>
                    </div>

                    <div className="simulation__buttons">
                        <div>
                            <Button
                                className="simulation__button"
                                title="New Simulation"
                                onClick={() => {
                                  this.setState({ simulationPayload: undefined });
                                  this.props.onNewSimulation();
                                }}
                                active={true}
                            />
                        </div>
                        {!isFetching && (
                            <div>
                                <Button
                                    className="simulation__button"
                                    title="START"
                                    onClick={this.fetchEvents}
                                    active={true}
                                />
                            </div>
                        )}
                        {isFetching && (
                            <div>
                                <div className="u-loader">Loading...</div>
                            </div>
                        )}
                    </div>

                    {this.props.hashrate > 0 ?
                        <div className="attack__grid">
                            <div className="attack__summary u-plate">
                                <div className="attack-summary__title">
                                    Attack Summary
                                </div>
                                {simulationPayload && (
                                    <AttackSummary
                                        attackSucceeded={simulationPayload.attackSucceeded}
                                        successfulAttackInBlocks={simulationPayload.successfulAttackInBlocks}
                                        probabilityOfSuccessfulAttack={simulationPayload.probabilityOfSuccessfulAttack}
                                        maximumSafeTransactionValue={simulationPayload.maximumSafeTransactionValue}
                                        hashrate={this.props.hashrate}
                                        confirmations={this.props.confirmations}
                                        B={simulationPayload.B}
                                        o={simulationPayload.o}
                                        α={simulationPayload.α}
                                        k={simulationPayload.k}
                                    />
                                )}
                            </div>

                            <div className="block__tree u-plate">
                                <div className="block-tree__title">
                                    Block Tree and Branch Selection
                                </div>
                                {simulationPayload && (
                                    <BlockTree
                                        maliciousBlockchainLength={simulationPayload.maliciousBlockchainLength}
                                        goodBlockchainLength={simulationPayload.goodBlockchainLength}
                                        attackDuration={simulationPayload.attackDuration}
                                        successfulAttackInBlocks={simulationPayload.successfulAttackInBlocks}
                                        attackSucceeded={simulationPayload.attackSucceeded}
                                    />
                                )}
                            </div>
                        </div>
                    : '' }

                    <div className="simulation-time-between-blocks u-plate">
                        <div className="simulation-time-between-blocks__title">
                            time between blocks
                        </div>
                        {simulationPayload && (
                            <div className={'time-between-blocks-chart-container'}>
                                <Chart
                                    chartType="LineChart"
                                    data={Simulation.timeBetweenBlocks(simulationPayload)}
                                    options={{
                                      hAxis: {
                                        title: 'Blocks',
                                        gridlines: { count: -1 },
                                        minValue: 1,
                                        viewWindow: {
                                          min: 1,
                                        },
                                      },
                                      vAxis: {
                                        title: 'Time',
                                      },
                                      series: {
                                        1: { curveType: 'function' },
                                      },
                                      legend: 'none',
                                      tooltip: {},
                                    }}
                                    graph_id="Time Between Blocks LineChart"
                                    width="100%"
                                    height="264px"
                                />
                            </div>
                        )}
                    </div>

                    <div className="simulation-pending-transactions u-plate">
                        <div className="simulation-pending-transactions__title">
                            Pending Transactions Per Block
                        </div>
                        {simulationPayload && (
                            <div className={'pending-transactions-chart-container'}>
                                <Chart
                                    chartType="AreaChart"
                                    data={Simulation.pendingTransactions(simulationPayload)}
                                    options={{
                                      hAxis: {
                                        title: 'Blocks',
                                        gridlines: { count: -1 },
                                        minValue: 1,
                                        viewWindow: {
                                          min: 1,
                                        },
                                      },
                                      vAxis: {
                                        title: 'Pending Transactions',
                                      },
                                      series: {
                                        1: { curveType: 'function' },
                                      },
                                      legend: 'none',
                                      tooltip: {},
                                    }}
                                    graph_id="Pending Transactions AreaChart"
                                    width="100%"
                                    height="264px"
                                />
                            </div>
                        )}
                    </div>

                    <div className="simulation-processed-transactions u-plate">
                        <div className="simulation-processed-transactions__title">
                            Processed Transactions Per Block
                        </div>
                        {simulationPayload && (
                            <div className={'processed-transactions-chart-container'}>
                                <Chart
                                    chartType="LineChart"
                                    data={this.processedTransactions(simulationPayload)}
                                    options={{
                                      hAxis: {
                                        title: 'Blocks',
                                        gridlines: { count: -1 },
                                        minValue: 1,
                                        viewWindow: {
                                          min: 1,
                                        },
                                      },
                                      vAxis: {
                                        title: 'Processed Transactions',
                                      },
                                      series: {
                                        1: { curveType: 'function' },
                                      },
                                      legend: { position: 'bottom' },
                                      focusTarget: 'category',
                                      tooltip: {},
                                    }}
                                    graph_id="Processed Transactions LineChart"
                                    width="100%"
                                    height="264px"
                                />
                            </div>
                        )}
                    </div>

                    <div className="simulation-transaction-count-per-fee u-plate">
                        <div className="simulation-transaction-count-per-fee__title">
                            Transaction Confirmation Status Per Transaction Fee
                        </div>
                        {simulationPayload && (
                            <div className={'transaction-count-per-fee-chart-container'}>
                                <Chart
                                    chartType="AreaChart"
                                    data={Simulation.transactionConfirmationStatusPerFee(simulationPayload)}
                                    options={{
                                      hAxis: {
                                        title: 'Transaction Fees (in Satoshi)',
                                        gridlines: { count: -1 },
                                      },
                                      vAxis: {
                                        title: 'Transactions',
                                      },
                                      series: {
                                        1: { curveType: 'function' },
                                      },
                                      focusTarget: 'category',
                                      tooltip: {},
                                      legend: { position: 'bottom' },
                                      colors: ['#9ACD32', '#FF0000'],
                                    }}
                                    graph_id="Confirmation Status AreaChart"
                                    width="100%"
                                    height="264px"
                                />
                            </div>
                        )}
                    </div>

                    <div className="confirmation-time-per-fee u-plate">
                        <div className="confirmation-time-per-fee__title">
                            Average Transaction Confirmation Time per Transaction Fee
                        </div>
                        {simulationPayload && (
                            <div className={'confirmation-time-per-fee-chart-container'}>
                                <Chart
                                    chartType="AreaChart"
                                    data={Simulation.confirmationTime(simulationPayload)}
                                    options={{
                                      hAxis: {
                                        title: 'Transaction Fees (in Satoshi)',
                                        gridlines: { count: -1 },
                                      },
                                      vAxis: {
                                        title: 'Confirmation Time (in Blocks)',
                                      },
                                      series: {
                                        1: { curveType: 'function' },
                                      },
                                      focusTarget: 'category',
                                      tooltip: {},
                                      legend: { position: 'none' },
                                    }}
                                    graph_id="Confirmation Time AreaChart"
                                    width="100%"
                                    height="264px"
                                />
                            </div>
                        )}
                    </div>

                </div>
      );
    }
    return (
            <div className="simulation">
                <div className="simulation__grid">
                    <div className="simulation__map u-plate">
                        <div className="simulation__title">
                            Simulation
                        </div>
                        <DataMap
                            event={(simulationPayload && selectedIndex !== undefined)
                                ? simulationPayload.events[selectedIndex]
                                : undefined}
                        />
                        <EventsRange
                            events={simulationPayload ? simulationPayload.events : undefined}
                            selectedIndex={selectedIndex}
                            onSelectIndex={this.handleSelectIndex}
                        />
                    </div>

                    <div className="simulation__summary u-plate">
                        <div className="simulation-summary__title">
                            Summary
                        </div>
                        {simulationPayload && (
                            <SimulationSummary
                                duration={simulationPayload.duration}
                                longestChainLength={simulationPayload.longestChainLength}
                                longestChainSize={simulationPayload.longestChainSize}
                                longestChainNumberTransactions={simulationPayload.longestChainNumberTransactions}
                                timesWithOutliers10={simulationPayload.timesWithOutliers10}
                                timesWithOutliers50={simulationPayload.timesWithOutliers50}
                                timesWithOutliers90={simulationPayload.timesWithOutliers90}
                                timesNoOutliers10={simulationPayload.timesNoOutliers10}
                                timesNoOutliers50={simulationPayload.timesNoOutliers50}
                                timesNoOutliers90={simulationPayload.timesNoOutliers90}
                                firstBlockNumberOfRecipients={simulationPayload.firstBlockNumberOfRecipients}
                                lastBlockNumberOfRecipients={simulationPayload.lastBlockNumberOfRecipients}
                                totalNumberOfNodes={simulationPayload.totalNumberOfNodes}
                                orphans={simulationPayload.orphans}
                            />
                        )}
                    </div>
                    <div className="simulation__events u-plate">
                        <SimulationEvents
                            events={simulationPayload ? simulationPayload.events : undefined}
                            selectedIndex={selectedIndex}
                            onSelectIndex={this.handleSelectIndex}
                            moveIntoViewPort={moveIntoViewPort}
                        />
                    </div>
                </div>

                <div className="simulation__buttons">
                    <div>
                        <Button
                            className="simulation__button"
                            title="New Simulation"
                            onClick={() => {
                              this.setState({ simulationPayload: undefined });
                              this.props.onNewSimulation();
                            }}
                            active={true}
                        />
                    </div>
                    {!isFetching && (
                        <div>
                            <Button
                                className="simulation__button"
                                title="START"
                                onClick={this.fetchEvents}
                                active={true}
                            />
                        </div>
                    )}
                    {isFetching && (
                        <div>
                            <div className="u-loader">Loading...</div>
                        </div>
                    )}
                </div>
            </div>
    );
  }

  private fetchEvents() {
    this.setState({ isFetching: true });
    fetchEvents(this.props)
            .then(simulationPayload => this.setState({ simulationPayload, isFetching: false, selectedIndex: 0 }));
  }

  private handleSelectIndex(selectedIndex: number, moveIntoViewPort: boolean) {
    this.setState({ selectedIndex, moveIntoViewPort });
  }

  private processedTransactions(simulationPayload: any) {
    let multi: any[][] = [];
    if (this.props.strategy === Strategies.BITCOIN_LIKE_BLOCKCHAIN) {
      multi = [['Blocks', 'Processed Transactions', 'Maximum Possible Transactions']];

            // I think it is better to have only one calculation of max processed transactions,
            // therefore this value is not calculated here, but instead uses a value from the server.
            // This makes it easier to change the implementation in just one place.

      for (const event of simulationPayload.events) {
        if (event.eventType === EventTypes.IBlockMine) {
          multi.push([event.level + 1, event.processedTransactions, simulationPayload.maxProcessedTransactions]);
        }
      }
    } else if (this.props.strategy === Strategies.GENERIC_SIMULATION) {
      multi = [['Blocks', 'Processed Transactions']];

      for (const event of simulationPayload.events) {
        if (event.eventType === EventTypes.IBlockMine) {
          multi.push([event.level + 1, event.processedTransactions]);
        }
      }
    }

    return multi;
  }
}
