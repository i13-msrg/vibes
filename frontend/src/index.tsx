// Externals A-z
import * as React from 'react';
import * as ReactDOM from 'react-dom';

// Internals A-z
import Header from './_patterns/atoms/header/Component';
import Configuration from './_patterns/pages/configuration/Component';
import Home from './_patterns/pages/home/Component';
import convertTimestampToDate from './common/convertTimestampToDate';
import convertToDisplayTime from './common/convertToDisplayTime';
import { IConfiguration, Strategies } from './common/types';
import './styles/vibes.css';
import Simulation from './_patterns/pages/simulation/Component';


interface IVibesState {
  strategy: Strategies | null;
  configuration: IConfiguration;
  page: Pages;
  show: boolean;
}

enum Pages {
  HOME,
  CONFIGURATION,
  SIMULATION,
}

class Vibes extends React.Component<{}, IVibesState> {
  constructor(props: {}) {
    super(props);

    this.state = {
      strategy: Strategies.GENERIC_SIMULATION,
      page: Pages.HOME,
      show: false,
      configuration: {
        blockTime: 600, // seconds
        numberOfNeighbours: 4,
        numberOfNodes: 10,
        simulateUntil: Date.now() + 3 * 3600000, // 3 hours from now
        transactionSize: 250, // KB
        throughput:  10,  // average number of transactions per blockTime
        latency: 900, // ms (latency + transfer + verification time),
        neighboursDiscoveryInterval: 3000, // seconds
        maxBlockSize: 1000, // KB
        maxBlockWeight: 4000, // KB
        networkBandwidth: 1, // MB per second
        strategy: Strategies.GENERIC_SIMULATION.toString()
      },
    };
    this.handleStrategyChange = this.handleStrategyChange.bind(this);
    this.handleConfigurationNextClick = this.handleConfigurationNextClick.bind(this);
    this.handleConfigurationBackClick = this.handleConfigurationBackClick.bind(this);
    this.handleConfigurationChange = this.handleConfigurationChange.bind(this);
    this.handleHomeNextClick = this.handleHomeNextClick.bind(this);
  }

  public componentDidMount() {
    // prevent FOUC without much effort. IKR...
    setTimeout(() => {
      this.setState({ show: true });
    }, 300);
  }

  public render() {
    const {
      page,
      show,
      configuration,
      strategy,
    } = this.state;

    return (
      <div>
        {show && (
          <div className="vibes">
            <div className="vibes__header">
              <Header />
            </div>
              <div className="vibes__content">
                {page === Pages.HOME && (
                  <Home
                    onStrategyChange={this.handleStrategyChange}
                    onHomeNextClick={this.handleHomeNextClick}
                    strategy={strategy}
                  />
                )}
                {page === Pages.CONFIGURATION && (
                  <Configuration
                    onConfigurationNextClick={this.handleConfigurationNextClick}
                    onConfigurationBackClick={this.handleConfigurationBackClick}
                    onConfigurationChange={this.handleConfigurationChange}
                    configuration={configuration}
                  />
                )}
                {page === Pages.SIMULATION && (
                  <Simulation
                    {...this.state.configuration}
                    onNewSimulation={() => this.setState({ page: Pages.HOME })}
                  />
                )}
              </div>
          </div>
        )}
      </div>
    );
  }

  private handleStrategyChange(strategy: Strategies) {
    if (strategy == Strategies.BITCOIN_LIKE_BLOCKCHAIN) {
        var configuration: IConfiguration = {
                blockTime: 567, // seconds
                numberOfNeighbours: 4,
                numberOfNodes: 104,
                simulateUntil: Date.now() + 2 * 3600000, // 3 hours from now
                transactionSize: 5, // KB
                throughput:  195,  // average number of transactions per blockTime
                latency: 900, // ms (latency + transfer + verification time),
                neighboursDiscoveryInterval: 3000, // seconds
                maxBlockSize: 1000, // KB
                maxBlockWeight: 4000, // KB
                networkBandwidth: 1, // MB per second
                strategy: strategy.toString()
        };
        this.setState({configuration});
        this.setState({strategy});
    }    else if (strategy == Strategies.GENERIC_SIMULATION) {
          var configuration: IConfiguration =        {
            blockTime: 600, // seconds
                numberOfNeighbours: 4,
                numberOfNodes: 10,
                simulateUntil: Date.now() + 3 * 3600000, // 3 hours from now
                transactionSize: 250, // KB
                throughput:  10,  // average number of transactions per blockTime
                latency: 900, // ms (latency + transfer + verification time),
                neighboursDiscoveryInterval: 3000, // seconds
                maxBlockSize: 1000, // KB
                maxBlockWeight: 4000, // KB
                networkBandwidth: 1, // MB per second
                strategy: Strategies.GENERIC_SIMULATION.toString()
        };
          this.setState({configuration});
          this.setState({strategy});
      }
  }

  private handleHomeNextClick() {
    this.setState({ page: Pages.CONFIGURATION  });
  }

  private handleConfigurationChange(configuration: IConfiguration) {
    this.setState({ configuration });
  }

  private handleConfigurationNextClick() {
    this.setState({ page: Pages.SIMULATION });
  }

  private handleConfigurationBackClick() {
    this.setState({ page: Pages.HOME });
  }
}

ReactDOM.render(
  <Vibes />,
  document.getElementById('app'),
);
