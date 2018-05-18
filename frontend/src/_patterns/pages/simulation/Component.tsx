import * as React from 'react';
import { IConfiguration } from '../../../common/types';
import DataMap from '../../organisms/datamap/Component';
import SimulationSummary from '../../molecules/simulation-summary/Component';
import SimulationEvents from '../../molecules/simulation-events/Component';
import Button from '../../atoms/button/Component';
import fetchEvents, { ISimulationPayload } from './fetchSimulationPayload';
import EventsRange from '../../molecules/events-range/Component';

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
    const { simulationPayload, selectedIndex, moveIntoViewPort, isFetching } = this.state;

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
        <div className="simulation__pending_transactions">
              asdfasdfasdf
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
}
