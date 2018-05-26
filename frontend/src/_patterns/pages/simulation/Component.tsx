import * as React from 'react';
import {IConfiguration, Strategies} from '../../../common/types';
import DataMap from '../../organisms/datamap/Component';
import SimulationSummary from '../../molecules/simulation-summary/Component';
import SimulationEvents from '../../molecules/simulation-events/Component';
import Button from '../../atoms/button/Component';
import fetchEvents, {ISimulationPayload} from './fetchSimulationPayload';
import EventsRange from '../../molecules/events-range/Component';
import {Chart} from 'react-google-charts';
import {EventTypes} from "../../molecules/simulation-events/types";

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
    constructor(props: ISimulationProps) {
        super(props);

        this.state = {moveIntoViewPort: false, isFetching: false};
        this.handleSelectIndex = this.handleSelectIndex.bind(this);
        this.fetchEvents = this.fetchEvents.bind(this);
    }

    public render() {
        const {simulationPayload, selectedIndex, moveIntoViewPort, isFetching} = this.state;
        if (this.props.strategy == 'BITCOIN_LIKE_BLOCKCHAIN') {
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

                    <div className="simulation-time-between-blocks u-plate">
                        <div className="simulation-time-between-blocks__title">
                            time between blocks
                        </div>
                        {simulationPayload && (
                            <div className={'time-between-blocks-chart-container'}>
                                <Chart
                                    chartType="LineChart"
                                    data={this.timeBetweenBlocks(simulationPayload)}
                                    options={{
                                        hAxis: {
                                            title: 'Blocks',
                                            gridlines: {count: -1}
                                        },
                                        vAxis: {
                                            title: 'Time'
                                        },
                                        series: {
                                            1: {curveType: 'function'}
                                        },
                                        legend: 'none',
                                        tooltip: {}
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
                            Pending Transactions
                        </div>
                        {simulationPayload && (
                            <div className={'pending-transactions-chart-container'}>
                                <Chart
                                    chartType="AreaChart"
                                    //data={data}
                                    data={this.pendingTransactions(simulationPayload)}
                                    //data={[['Blocks', 'Pending Transactions'], simulationPayload ? ]}
                                    options={{
                                        hAxis: {
                                            title: 'Blocks',
                                            gridlines: {count: -1}
                                        },
                                        vAxis: {
                                            title: 'Pending Transactions'
                                        },
                                        series: {
                                            1: {curveType: 'function'}
                                        },
                                        legend: 'none',
                                        tooltip: {}
                                    }}
                                    graph_id="Pending Transactions AreaChart"
                                    width="100%"
                                    height="264px"
                                    //legend_toggle
                                />
                            </div>
                        )}
                    </div>

                    <div className="simulation-processed-transactions u-plate">
                        <div className="simulation-processed-transactions__title">
                            Processed Transactions
                        </div>
                        {simulationPayload && (
                            <div className={'processed-transactions-chart-container'}>
                                <Chart
                                    chartType="LineChart"
                                    data={this.processedTransactions(simulationPayload)}
                                    options={{
                                        hAxis: {
                                            title: 'Blocks',
                                            gridlines: {count: -1}
                                        },
                                        vAxis: {
                                            title: 'Processed Transactions'
                                        },
                                        series: {
                                            1: {curveType: 'function'}
                                        },
                                        legend: {position: 'bottom'},
                                        focusTarget: 'category',
                                        tooltip: {}
                                    }}
                                    graph_id="Processed Transactions LineChart"
                                    width="100%"
                                    height="264px"
                                />
                            </div>
                        )}
                    </div>

                    <div className="simulation-transaction-count-grouped-by-fees u-plate">
                        <div className="simulation-transaction-count-grouped-by-fees__title">
                            transaction confirmation status
                        </div>
                        {simulationPayload && (
                            <div className={'transaction-count-grouped-by-fees-chart-container'}>
                                <Chart
                                    chartType="ColumnChart"
                                    data={this.transactionCountGroupedByFees(simulationPayload)}
                                    options={{
                                        hAxis: {
                                            title: 'Transaction Fees (in Satoshis)',
                                            gridlines: {count: -1},
                                            minValue: 0,
                                        },
                                        vAxis: {
                                            title: 'Transactions',
                                        },
                                        series: {
                                            1: {curveType: 'function'}
                                        },
                                        focusTarget: 'category',
                                        tooltip: {},
                                        legend: {position: "bottom"},
                                        colors: ['#9ACD32', '#FF0000']
                                    }}
                                    graph_id="Transaction Fee ColumnChart"
                                    width="100%"
                                    height="264px"
                                />
                            </div>
                        )}
                    </div>

                    <div className="confirmation-time-grouped-by-fees u-plate">
                        <div className="confirmation-time-grouped-by-fees__title">
                            Transaction confirmation time
                        </div>
                        {simulationPayload && (
                            <div className={'confirmation-time-grouped-by-fees-chart-container'}>
                                <Chart
                                    chartType="ColumnChart"
                                    data={this.confirmationTime(simulationPayload)}
                                    options={{
                                        hAxis: {
                                            title: 'Transaction Fees (in Satoshis)',
                                            gridlines: {count: -1},
                                            minValue: 0
                                        },
                                        vAxis: {
                                            title: 'Confirmation Time (in Blocks)',
                                        },
                                        series: {
                                            1: {curveType: 'function'}
                                        },
                                        focusTarget: 'category',
                                        tooltip: {},
                                        legend: {position: "none"}
                                    }}
                                    graph_id="Confirmation Time ColumnChart"
                                    width="100%"
                                    height="264px"
                                />
                            </div>
                        )}
                    </div>

                    <div className="simulation__buttons">
                        <div>
                            <Button
                                className="simulation__button"
                                title="New Simulation"
                                onClick={() => {
                                    this.setState({simulationPayload: undefined});
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
        else {
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

                    <div className="simulation-time-between-blocks u-plate">
                        <div className="simulation-time-between-blocks__title">
                            time between blocks
                        </div>
                        {simulationPayload && (
                            <div className={'time-between-blocks-chart-container'}>
                                <Chart
                                    chartType="LineChart"
                                    data={this.timeBetweenBlocks(simulationPayload)}
                                    options={{
                                        hAxis: {
                                            title: 'Blocks',
                                            gridlines: {count: -1}
                                        },
                                        vAxis: {
                                            title: 'Time'
                                        },
                                        series: {
                                            1: {curveType: 'function'}
                                        },
                                        legend: 'none',
                                        tooltip: {}
                                    }}
                                    graph_id="Time Between Blocks LineChart"
                                    width="100%"
                                    height="264px"
                                />
                            </div>
                        )}
                    </div>

                    <div className="simulation-processed-transactions u-plate">
                        <div className="simulation-processed-transactions__title">
                            Processed Transactions
                        </div>
                        {simulationPayload && (
                            <div className={'processed-transactions-chart-container'}>
                                <Chart
                                    chartType="LineChart"
                                    data={this.processedTransactions(simulationPayload)}
                                    options={{
                                        hAxis: {
                                            title: 'Blocks',
                                            gridlines: {count: -1}
                                        },
                                        vAxis: {
                                            title: 'Processed Transactions'
                                        },
                                        series: {
                                            1: {curveType: 'function'}
                                        },
                                        legend: {position: 'bottom'},
                                        focusTarget: 'category',
                                        tooltip: {}
                                    }}
                                    graph_id="Processed Transactions LineChart"
                                    width="100%"
                                    height="264px"
                                />
                            </div>
                        )}
                    </div>

                    <div className="simulation__buttons">
                        <div>
                            <Button
                                className="simulation__button"
                                title="New Simulation"
                                onClick={() => {
                                    this.setState({simulationPayload: undefined});
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

    }

    private fetchEvents() {
        this.setState({isFetching: true});
        fetchEvents(this.props)
            .then(simulationPayload => this.setState({simulationPayload, isFetching: false, selectedIndex: 0}));
    }

    private handleSelectIndex(selectedIndex: number, moveIntoViewPort: boolean) {
        this.setState({selectedIndex, moveIntoViewPort});
    }

    private pendingTransactions(simulationPayload: any) {
        var multi: any[][] = [['Blocks', 'Pending Transactions']];

        for (let i = 0; i < simulationPayload.events.length; i++) {
            if (simulationPayload.events[i].eventType == EventTypes.IBlockMine) {
                multi.push(new Array(simulationPayload.events[i].level, simulationPayload.events[i].transactionPoolSize))
            }
        }

        return multi;
    }

    private processedTransactions(simulationPayload: any) {
        var multi: any[][] = [];
        if (this.props.strategy == Strategies.BITCOIN_LIKE_BLOCKCHAIN) {
            multi = [['Blocks', 'Processed Transactions', 'Maximum Possible Transactions']];

            // I think it is better to have only one calculation of max processed transactions,
            // therefore this value is not calculated here, but instead uses a value from the server.
            // This makes it easier to change the implementation in just one place.

            for (let i = 0; i < simulationPayload.events.length; i++) {
                if (simulationPayload.events[i].eventType == EventTypes.IBlockMine) {
                    multi.push(new Array(simulationPayload.events[i].level, simulationPayload.events[i].processedTransactions, simulationPayload.maxProcessedTransactions))
                }
            }
        } else if (this.props.strategy == Strategies.GENERIC_SIMULATION) {
            multi = [['Blocks', 'Processed Transactions']];

            for (let i = 0; i < simulationPayload.events.length; i++) {
                if (simulationPayload.events[i].eventType == EventTypes.IBlockMine) {
                    multi.push(new Array(simulationPayload.events[i].level, simulationPayload.events[i].processedTransactions))
                }
            }
        }

        return multi;
    }

    private transactionCountGroupedByFees(simulationPayload: ISimulationPayload) {
        var multi: any[][] = [['Transaction Fees (in Satoshis)', 'Confirmed Transactions', 'Unconfirmed Transactions']];

        for (let i = 0; i < simulationPayload.transactions.length; i++) {
            for (let j = 0; j < multi.length; j++) {
                if( multi[j][0] == this.makeCategory(simulationPayload.transactions[i].transactionFee)) {
                    if(simulationPayload.transactions[i].confirmation) {
                        multi[j][1]++;
                    } else {
                        multi[j][2]++;
                    }
                    break;
                } else if (j == multi.length - 1) {
                    if(simulationPayload.transactions[i].confirmation) {
                        multi.push([this.makeCategory(simulationPayload.transactions[i].transactionFee),1,0]);
                    } else {
                        multi.push([this.makeCategory(simulationPayload.transactions[i].transactionFee),0,1]);
                    }
                }
            }
        }

        return multi;
    }

    private confirmationTime(simulationPayload: ISimulationPayload) {
        var multi: number[][] = [[]];

        for (let i = 0; i < simulationPayload.transactions.length; i++) {
            for (let j = 0; j < multi.length; j++) {
                if( multi[j][0] == this.makeCategory(simulationPayload.transactions[i].transactionFee)) {
                    if(simulationPayload.transactions[i].confirmation) {
                        multi[j][1]++;
                        multi[j][2] = multi[j][2] + simulationPayload.transactions[i].confirmationLevel - simulationPayload.transactions[i].creationLevel;
                    }
                    break;
                } else if (j == multi.length - 1) {
                    multi.push([this.makeCategory(simulationPayload.transactions[i].transactionFee),1,0]);
                }
            }
        }

        var multi2: any[][] = [['Transaction Fees (in Satoshis)', 'Confirmation Time (in Blocks)']];
        for (let j = 0; j < multi.length; j++) {
            multi2.push([multi[j][0], Math.round(multi[j][2] / multi[j][1]*100) /100]);
        }

        return multi2;
    }

    private makeCategory(number: number) {
        var test: number = Math.floor(number / 10)*10;

        return test;
    }

    private timeBetweenBlocks(simulationPayload: any) {
        var multi: any[][] = [['Blocks', 'Time (in mins)'],[0,0]];

        for (let i = 1; i < simulationPayload.events.length; i++) {
            if (simulationPayload.events[i].eventType == EventTypes.IBlockMine) {
                multi.push(new Array(simulationPayload.events[i].level, (new Date(simulationPayload.events[i].timestamp).getTime() - new Date(simulationPayload.events[i-1].timestamp).getTime()) / 1000 / 60))
            }
        }
        return multi;
    }
}