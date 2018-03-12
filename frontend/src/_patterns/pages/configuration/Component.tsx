import * as React from 'react';

import { IConfiguration } from '../../../common/types';
import Button from '../../atoms/button/Component';
import ConfigurationPlate from '../../organisms/configuration-plate/Component';


interface IConfigurationProps {
  onConfigurationNextClick: () => void;
  onConfigurationBackClick: () => void;
  onConfigurationChange: (configuration: IConfiguration) => void;
  configuration: IConfiguration;
}

export default class Configuration extends React.Component<IConfigurationProps, {}> {
  public render() {
    const {
      configuration,
      onConfigurationNextClick,
      onConfigurationBackClick,
      onConfigurationChange,
    } = this.props;

    return (
      <div className="configuration">
        <ConfigurationPlate
          onConfigurationChange={onConfigurationChange}
          configuration={configuration}
        />
        <Button
          className="configuration__back"
          title="Back"
          onClick={() => onConfigurationBackClick()}
          active={true}
        />
        <Button
          className="configuration__next"
          title="Next"
          onClick={() => {
            if (this.isConfigurationComplete()) {
              onConfigurationNextClick();
            }
          }}
          active={this.isConfigurationComplete()}
        />
      </div>
    );
  }

  private isConfigurationComplete(): boolean {
    const { configuration } = this.props;
    for (const key in configuration) {
      if (configuration.hasOwnProperty(key) && configuration[key] === null) {
        return false;
      }
    }

    return true;
  }
}
