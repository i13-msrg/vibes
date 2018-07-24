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
  strategy: string;
}

export default class ConfigurationInput extends React.Component<IConfigurationInputProps, {}> {
  private static convertValue(value: number | null): string {
    if (value === null) {
      return '';
    }

        // if timestamp, don't judge me, other methods throw warnings
    if (value > 10000000) {
      return convertTimestampToDate(value);
    }

    return String(value);
  }

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
      strategy,
    } = this.props;

    let classNames = 'configuration-input ';

    if (className) {
      classNames += className;
    }

    if (strategy === 'BITCOIN_LIKE_BLOCKCHAIN') {
      return (
            <div className={classNames} title={title}>
                <input
                    className="configuration-bitcoin-input__input"
                    onChange={this.handleInputChange}
                    placeholder={placeholder}
                    type={type}
                    value={ConfigurationInput.convertValue(value)}
                    name={placeholder}
                />
                <svg
                    viewBox={icon.viewBox}
                    className="configuration-bitcoin-input__icon"
                >
                    <use xlinkHref={`#${icon.id}`} />
                </svg>
                <div className="configuration-bitcoin-input__description">
                    {placeholder}
                </div>

            </div>
      );
    }

    return (
      <div className={classNames} title={title}>
        <input
          className="configuration-input__input"
          placeholder={placeholder}
          onChange={this.handleInputChange}
          type={type}
          value={ConfigurationInput.convertValue(value)}
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

  private handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    const { configurationKey, onConfigurationChange, type } = this.props;

    if (type === 'datetime-local') {
      return onConfigurationChange(configurationKey, new Date(value).getTime());
    }

    return onConfigurationChange(configurationKey, Number(value));
  }
}
