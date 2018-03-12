import * as React from 'react';

interface IButtonProps {
  title: string;
  onClick: () => void;
  className?: string;
  active: boolean;
}

export default class Button extends React.Component<IButtonProps, {}> {
  public render() {
    const { title, onClick, className, active } = this.props;
    let classNames = 'button ';

    if (className) {
      classNames += className;
    }

    if (!active) {
      classNames += ' button--inactive';
    }

    return (
      <div onClick={onClick} className={classNames}>
        {title}
      </div>
    );
  }
}
