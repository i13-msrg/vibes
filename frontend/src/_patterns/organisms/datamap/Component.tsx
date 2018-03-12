import * as React from 'react';
import { EventTypes, IBlockMine, IBlockTransfer } from '../../molecules/simmulation-events/types';


interface IDataMapProps {
  event?: IBlockMine | IBlockTransfer;
}

export default class DataMap extends React.Component<IDataMapProps, {}> {
  private map: Datamap;

  public componentDidMount() {
    const element = document.getElementById('datamap-container');

    if (element) {
      this.map = new Datamap({ element,  fills: {
        defaultFill: '#abdda4',
        BLUE: '#4083DB',
      }});
    }
  }

  public componentWillReceiveProps(nextProps: IDataMapProps) {
    if (nextProps.event === this.props.event) {
      return;
    }

    if (nextProps.event) {
      switch (nextProps.event.eventType) {
        case EventTypes.IBlockTransfer:
          this.map.bubbles([]);

          this.map.arc([{
            origin: {
              latitude: nextProps.event.fromNode.lat,
              longitude: nextProps.event.fromNode.long,
            },
            destination: {
              latitude: nextProps.event.toNode.lat,
              longitude: nextProps.event.toNode.long,
            },
          }],  { strokeWidth: 3, strokeColor: '#4083DB' });
          return;

        case EventTypes.IBlockMine:
          this.map.arc([]);

          this.map.bubbles([{
            name: `${nextProps.event.origin.id}`,
            radius: 13,
            fillKey: 'BLUE',
            latitude: nextProps.event.origin.lat,
            longitude: nextProps.event.origin.long,
          }]);
          return;
      }
    }


  }


  public render() {

    return (
      <div id="datamap-container" className="simulation__datamap-container" />
    );
  }
}
