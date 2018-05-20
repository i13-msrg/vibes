import * as React from 'react';
import {IConfiguration} from '../../../common/types';
import DataMap from '../../organisms/datamap/Component';
import SimulationSummary from '../../molecules/simulation-summary/Component';
import SimulationEvents from '../../molecules/simulation-events/Component';
import Button from '../../atoms/button/Component';
import fetchEvents, {ISimulationPayload} from './fetchSimulationPayload';
import EventsRange from '../../molecules/events-range/Component';
import {Chart} from 'react-google-charts';
import {EventTypes} from "../../molecules/simulation-events/types";

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

    this.state = { moveIntoViewPort: false, isFetching: false };
    this.handleSelectIndex = this.handleSelectIndex.bind(this);
    this.fetchEvents = this.fetchEvents.bind(this);
  }

  public render() {
    const { simulationPayload, selectedIndex, moveIntoViewPort, isFetching} = this.state;

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
                          // todo add processed transactions?
                          //data={[['Blocks', 'Pending Transactions'], simulationPayload ? ]}
                          options={{
                              hAxis: {
                                  title: 'Blocks',
                                  gridlines: { count: -1}
                              },
                              vAxis: {
                                  title: 'Pending Transactions'
                              },
                              series: {
                                  1: {curveType: 'function'}
                              },
                              legend: 'none'
                          }}
                          graph_id="AreaChart"
                          width="100%"
                          height="264px"
                          //legend_toggle
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

  private pendingTransactions(simulationPayload: any) {
      var multi:any[][] =[['Blocks', 'Pending Transactions']];

      for (let i = 0; i < simulationPayload.events.length; i++) {
          if (simulationPayload.events[i].eventType == EventTypes.IBlockMine) {
              multi.push(new Array(simulationPayload.events[i].level, simulationPayload.events[i].transactionPoolSize))
          }
      }

      return multi;
  }
}
