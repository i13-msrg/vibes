import * as React from 'react';
import { IBlockMine, IBlockTransfer } from '../simulation-events/types';


interface IEventsRangeProps {
  events?: (IBlockMine | IBlockTransfer)[];
  selectedIndex?: number;
  onSelectIndex: (selectedIndex: number, moveIntoViewPort: boolean) => void;
}


export default class EventsRange extends React.Component<IEventsRangeProps, {}> {

  public render() {
    const { events, selectedIndex, onSelectIndex } = this.props;

    return (
      <div className="events-range">
        {events && (
          <div>
            <div className="events-range__current-date">
              {(selectedIndex !== undefined) && (
                <span>
                  {new Date(events[selectedIndex].timestamp).toISOString().slice(0, -1).replace('T', ' ')}
                </span>
              )}
            </div>
            <input
              className="events-range__input"
              type="range"
              min="0"
              step="1"
              value={selectedIndex === undefined ? 0 : selectedIndex}
              max={events.length - 1}
              onChange={e => onSelectIndex(Number(e.target.value), true)}
            />
            <div className="events-range__min-date">
              {new Date(events[0].timestamp).toISOString().slice(0, -1).replace('T', ' ')}
            </div>
            <div className="events-range__max-date">
              {new Date(events[events.length - 1].timestamp).toISOString().slice(0, -1).replace('T', ' ')}
            </div>
          </div>
        )}
      </div>
    );
  }
}
