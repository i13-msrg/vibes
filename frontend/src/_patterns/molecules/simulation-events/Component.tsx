import * as React from 'react';
import { IBlockMine, IBlockTransfer, EventTypes } from './types';
import blockIcon from '../../../styles/svg/box.svg';
import transferIcon from '../../../styles/svg/send.svg';

interface ISimulationEventsProps {
  events?: (IBlockMine | IBlockTransfer)[];
  onSelectIndex: (selectedIndex: number, moveIntoViewPort: boolean) => void;
  selectedIndex?: number;
  moveIntoViewPort: boolean;
}

const renderEvent = (
  event: (IBlockMine | IBlockTransfer),
  key: number,
  onSelectIndex: (index: number) => void,
  moveElementWithinViewport: (element: HTMLElement | null) => void,
  selectedIndex?: number,
) => {
  let className = 'simulation-events__list-item ';

  if (selectedIndex === key) {
    className += 'simulation-events__list-item--active';
  }

  switch (event.eventType) {
    case EventTypes.IBlockTransfer:
      return (
        <li
          ref={el => (selectedIndex === key) ? moveElementWithinViewport(el) : undefined}
          className={className}
          key={key}
          onClick={() => onSelectIndex(key)}
        >
          <span className="simulation-events__list-text">
            <svg
              viewBox={transferIcon.viewBox}
              className="simulation-events__list-icon simulation-events__list-icon--transfer"
            >
              <use xlinkHref={`#${transferIcon.id}`} />
            </svg>
            <span>
              Block transferred from node {event.fromNode.id.slice(0, 8)} to node {event.toNode.id.slice(0, 8)}
            </span>
          </span>
          <div className="simulation-events__list-time">
            {new Date(event.timestamp).toISOString().slice(-13).slice(0, -1)}
          </div>
        </li>
      );

    case EventTypes.IBlockMine:
      return (
        <li
          ref={el => (selectedIndex === key) ? moveElementWithinViewport(el) : undefined}
          className={className}
          key={key}
          onClick={() => onSelectIndex(key)}
        >
          <span className="simulation-events__list-text">
            <svg
              viewBox={blockIcon.viewBox}
              className="simulation-events__list-icon"
            >
              <use xlinkHref={`#${blockIcon.id}`} />
            </svg>
            <span>
              Block mined from node {event.origin.id.slice(0, 8)}
            </span>
          </span>
          <div className="simulation-events__list-time">
            {new Date(event.timestamp).toISOString().slice(-13).slice(0, -1)}
          </div>
        </li>
      );
  }
};


export default class SimulationEvents extends React.Component<ISimulationEventsProps, {}> {
  constructor(props: ISimulationEventsProps) {
    super(props);
    this.state = {};
    this.selectIndex = this.selectIndex.bind(this);
    this.moveElementWithinViewport = this.moveElementWithinViewport.bind(this);
  }

  public render() {
    const { events, selectedIndex } = this.props;

    let date = null;

    if (events && selectedIndex !== undefined) {
      date = new Date(events[selectedIndex].timestamp).toLocaleDateString();
    }

    return (
      <div className="simulation-events">
        <div className="simulation-events__header">
          <div className="simulation-events__title"> Events </div>
          <div className="simulation-events__date"> {date} </div>
        </div>

        <ul className="simulation-events__list">
          {events && events.map((event, index) =>
            renderEvent(event, index, this.selectIndex, this.moveElementWithinViewport, selectedIndex))
          }
        </ul>

      </div>
    );
  }

  private selectIndex(selectedIndex: number) {
    this.setState({ selectedIndex });
    this.props.onSelectIndex(selectedIndex, false);
  }

  private moveElementWithinViewport(element: HTMLElement | null) {
    if (element && this.props.moveIntoViewPort) {
      element.scrollIntoView(false);
    }
  }
}
