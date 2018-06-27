import * as React from 'react';
import convertTimestampToDate from '../../../common/convertTimestampToDate';
import { ConfigurationKey, ISvg } from '../../../common/types';


interface IConfigurationInputProps {
  placeholder: string;
  onConfigurationChange: (configurationKey: ConfigurationKey, value: number | string) => void;
  className?: string;
  icon: ISvg;
  type: 'number' | 'datetime-local';
  configurationKey: ConfigurationKey;
  value: number | null;
  title: string;
}

export default class ConfigurationInput extends React.Component<IConfigurationInputProps, {}> {
  constructor(props: IConfigurationInputProps) {
    super(props);

    this.handleInputChange = this.handleInputChange.bind(this);
  }

  public render() {
    const {
      icon,
      placeholder,
      className,
      type,
      value,
      title,
    } = this.props;

    let classNames = 'configuration-input ';

    if (className) {
      classNames += className;
    }

    return (
      <div className={classNames} title={title}>
        <input
          className="configuration-input__input"
          placeholder={placeholder}
          onChange={this.handleInputChange}
          type={type}
          value={this.convertValue(value)}
        />
        <svg
          viewBox={icon.viewBox}
          className="configuration-input__icon"
        >
          <use xlinkHref={`#${icon.id}`} />
        </svg>
      </div>
    );
  }

  private convertValue(value: number | null): string {
    if (value === null) {
      return '';
    }

    // if timestamp, don't judge me, other methods throw warnings
    if (value > 10000000) {
      return convertTimestampToDate(value);
    }

    return String(value);
  }

  private handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    const { configurationKey, onConfigurationChange, type } = this.props;

    if (type === 'datetime-local') {
      return onConfigurationChange(configurationKey, new Date(value).getTime());
    }

    return onConfigurationChange(configurationKey, Number(value));
  }
}
