import * as React from 'react';

import { Strategies } from '../../../common/types';
import Button from '../../atoms/button/Component';
import StrategyPlate from '../../organisms/strategy-plate/Component';


interface IHomeProps {
  onStrategyChange: (strategy: Strategies) => void;
  onHomeNextClick: () => void;
  strategy: Strategies | null;
}

export default class Home extends React.Component<IHomeProps, {}> {
  constructor(props: IHomeProps) {
    super(props);

    this.handleNextClick = this.handleNextClick.bind(this);
  }

  public render() {
    const { strategy } = this.props;

    return (
      <div className="home">
        <StrategyPlate
          onStrategyChange={newStrategy => this.props.onStrategyChange(newStrategy)}
          selectedStrategy={strategy}
        />
        <Button
          className="home__next"
          title="Next"
          onClick={this.handleNextClick}
          active={strategy === Strategies.GENERIC_SIMULATION}
        />
      </div>
    );
  }

  private handleNextClick() {
    const { strategy } = this.props;

    if (strategy === Strategies.GENERIC_SIMULATION) {
      this.props.onHomeNextClick();
    }
  }
}
