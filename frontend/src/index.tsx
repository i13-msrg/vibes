// Externals A-z
import * as React from 'react';
import * as ReactDOM from 'react-dom';
// Internals A-z
import Header from './_patterns/atoms/header/Component';
import Configuration from './_patterns/pages/configuration/Component';
import Home from './_patterns/pages/home/Component';
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

        // todo strategy is redundant, move strategy solely to configuration,
      // since the strategy is needed on the server.
    this.state = {
      strategy: Strategies.GENERIC_SIMULATION,
      page: Pages.HOME,
      show: false,
      configuration: {
        blockTime: 600, // seconds
        numberOfNeighbours: 4,
        numberOfNodes: 10,
        simulateUntil: Date.now() + 3 * 3600000, // 3 hours from now
        transactionSize: 250000, // B
        throughput: 10,  // average number of transactions per blockTime
        latency: 900, // ms (latency + transfer + verification time),
        neighboursDiscoveryInterval: 3000, // seconds
        maxBlockSize: 1000, // KB
        maxBlockWeight: 0, // KB
        networkBandwidth: 1, // MB per second
        strategy: Strategies.GENERIC_SIMULATION.toString(),
        transactionPropagationDelay: 150, // ms
        hashRate: 0, // Percentage of total network
        confirmations: 0, // Blocks
        transactionFee: 0, // target transaction fee of an attacker in Satoshi
        transactionWeight: 0, // transaction weight of SegWit transaction
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
                            <Header/>
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
    if (strategy === Strategies.BITCOIN_LIKE_BLOCKCHAIN) {
      const configuration: IConfiguration = {
        blockTime: 567, // seconds
        numberOfNeighbours: 4,
        numberOfNodes: 20,
        simulateUntil: Date.now() + 6 * 3600000, // 6 hours from now
        transactionSize: 218, // B
        throughput: 105,  // average number of transactions per blockTime
        latency: 900, // ms (latency + transfer + verification time),
        neighboursDiscoveryInterval: 3000, // seconds
        maxBlockSize: 1000, // KB
        maxBlockWeight: 4000000, // weight
        networkBandwidth: 1, // MB per second
        strategy: strategy.toString(),
        transactionPropagationDelay: 150, // ms
        hashRate: 30, // Percentage of total network
        confirmations: 4, // Blocks
        transactionFee: 0, // target transaction fee of an attacker in Satoshi
        transactionWeight: 542, // transaction weight of SegWit transaction
      };
      this.setState({ configuration });
      this.setState({ strategy });
    } else if (strategy === Strategies.GENERIC_SIMULATION) {
      const configuration: IConfiguration = {
        blockTime: 600, // seconds
        numberOfNeighbours: 4,
        numberOfNodes: 10,
        simulateUntil: Date.now() + 3 * 3600000, // 3 hours from now
        transactionSize: 250000, // B
        throughput: 10,  // average number of transactions per blockTime
        latency: 900, // ms (latency + transfer + verification time),
        neighboursDiscoveryInterval: 3000, // seconds
        maxBlockSize: 0, // KB
        maxBlockWeight: 0, // weight
        networkBandwidth: 1, // MB per second
        strategy: strategy.toString(),
        transactionPropagationDelay: 150, // ms
        hashRate: 0, // Percentage of total network
        confirmations: 0, // Blocks
        transactionFee: 0, // target transaction fee of an attacker in Satoshi
        transactionWeight: 0, // transaction weight of SegWit transaction
      };
      this.setState({ configuration });
      this.setState({ strategy });
    }
  }

  private handleHomeNextClick() {
    this.setState({ page: Pages.CONFIGURATION });
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
    <Vibes/>,
    document.getElementById('app'),
);
