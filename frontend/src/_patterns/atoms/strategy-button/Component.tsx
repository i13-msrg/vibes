import * as React from 'react';

interface IStrategyButtonProps {
  selected: boolean;
  title: string;
  onClick: () => void;
}

export default class StrategyButton extends React.Component<IStrategyButtonProps, {}> {
  public render() {
    const { selected, title, onClick } = this.props;
    let classNameButton = 'strategy-button__button ';

    if (selected) {
      classNameButton += 'strategy-button__button--selected';
    }

    return (
      <div onClick={onClick} className="strategy-button">
        <div className={classNameButton}>
          {title}
        </div>
        <div className="strategy-button__badge" />
      </div>
    );
  }
}
