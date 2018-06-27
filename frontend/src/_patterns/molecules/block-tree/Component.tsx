import * as React from 'react';
import validBlockIcon from '../../../styles/svg/valid-block.svg';
import {ConfigurationKey, ISvg} from "../../../common/types";

interface IBlockTreeProps {
  maliciousBlockchainLength: number;
  goodBlockchainLength: number;
  attackDuration: number;
  successfulAttackInBlocks: number;
  attackSucceeded: number;
}

export default class BlockTree extends React.Component<IBlockTreeProps, {}> {
  public render() {

    const {
            maliciousBlockchainLength,
            goodBlockchainLength,
            attackDuration,
            successfulAttackInBlocks,
            attackSucceeded,
        } = this.props;

    let i;
    const buffer = [];
    const icon: ISvg = validBlockIcon;


    let longerLength = Math.max(maliciousBlockchainLength, goodBlockchainLength);
    if (successfulAttackInBlocks > 0) {
      longerLength = Math.min(longerLength, attackDuration + 1, successfulAttackInBlocks + 1);
    } else {
      longerLength = Math.min(longerLength, attackDuration + 1);
    }

    for (i = 1; i < longerLength; i++) {
      if (attackSucceeded !== 1) {
        if (goodBlockchainLength > i && maliciousBlockchainLength > i) {
          if (i === 1) {
            const arrow = <tr>
                            <td>
                                <svg width="12" height="12" viewBox="0 0 1200 1120" xmlns="http://www.w3.org/2000/svg">
                                    <g transform="translate(-56.764 111.32)">
                                        <path
                                            d="m331.54 92.12l-161.94 161.31 504.59 506.55-206.47 205.67 582.19-153.6m-718.36-719.91l161.94-161.31 504.59 506.55 206.47-205.67-168.67 594.11"
                                            fill="none" stroke="#000000" strokeWidth="40"/>
                                    </g>
                                </svg>

                            </td>
                            <td>
                                <svg width="12" height="12" viewBox="0 0 1200 1120" xmlns="http://www.w3.org/2000/svg">
                                    <g transform="translate(-56.764 101.44)">
                                        <path
                                            d="m1041.2 100.71l-161.31-161.94-506.55 504.59-205.67-206.47 153.6 582.19m719.91-718.36l161.31 161.94-506.55 504.59 205.67 206.47-594.11-168.67"
                                            fill="none" stroke="#000000" strokeWidth="40"/>
                                    </g>
                                </svg>
                            </td>
                            <td/>
                        </tr>;
            buffer.unshift(arrow);
          } else {
            const arrow = <tr>
                            <td>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" version="1.0"
                                     viewBox="0 0 1200 1120">
                                    <g transform="translate(-56.764 113.32)">
                                        <path
                                            d="m657.81-46.617l-228.57-0.4437-1.3883 714.98-291.43-0.56586 520.28 303.06m1.0934-1017l228.57 0.444-1.3881 714.98 291.43 0.56583-539.37 300.83"
                                            fill="none" stroke="#000000" strokeWidth="40"/>
                                    </g>
                                </svg>
                            </td>
                            <td>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" version="1.0"
                                     viewBox="0 0 1200 1120">
                                    <g transform="translate(-56.764 113.32)">
                                        <path
                                            d="m657.81-46.617l-228.57-0.4437-1.3883 714.98-291.43-0.56586 520.28 303.06m1.0934-1017l228.57 0.444-1.3881 714.98 291.43 0.56583-539.37 300.83"
                                            fill="none" stroke="#000000" strokeWidth="40"/>
                                    </g>
                                </svg>
                            </td>
                            <td/>
                        </tr>;
            buffer.unshift(arrow);
          }

          const row = <tr>
                        <td>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                 fill="none"
                                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                 className="feather feather-box">
                                <rect id="black" width="24" height="24" fill="#000000"/>
                            </svg>
                        </td>
                        <td>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                 fill="none"
                                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                 className="feather feather-box">
                                <rect width="24" height="24"/>
                            </svg>
                        </td>
                        <td>{i + 1}</td>
                    </tr>;
          buffer.unshift(row);
        } else if (maliciousBlockchainLength > i) {
          const arrow = <tr>
                        <td>
                        </td>
                        <td>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" version="1.0"
                                 viewBox="0 0 1200 1120">
                                <g transform="translate(-56.764 113.32)">
                                    <path
                                        d="m657.81-46.617l-228.57-0.4437-1.3883 714.98-291.43-0.56586 520.28 303.06m1.0934-1017l228.57 0.444-1.3881 714.98 291.43 0.56583-539.37 300.83"
                                        fill="none" stroke="#000000" strokeWidth="40"/>
                                </g>
                            </svg>
                        </td>
                        <td/>
                    </tr>;
          buffer.unshift(arrow);

          const row = <tr>
                        <td/>
                        <td>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                 fill="none"
                                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                 className="feather feather-box">
                                <rect width="24" height="24"/>
                            </svg>
                        </td>
                        <td>{i + 1}</td>
                    </tr>;
          buffer.unshift(row);
        }  else if (goodBlockchainLength > i) {
          const arrow = <tr>
              <td>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" version="1.0"
                       viewBox="0 0 1200 1120">
                      <g transform="translate(-56.764 113.32)">
                          <path
                              d="m657.81-46.617l-228.57-0.4437-1.3883 714.98-291.43-0.56586 520.28 303.06m1.0934-1017l228.57 0.444-1.3881 714.98 291.43 0.56583-539.37 300.83"
                              fill="none" stroke="#000000" strokeWidth="40"/>
                      </g>
                  </svg>
              </td>
              <td/>
              <td/>
          </tr>;
          buffer.unshift(arrow);

          const row = <tr>
              <td>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                       fill="none"
                       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                       className="feather feather-box">
                      <rect id="black" width="24" height="24" fill="#000000"/>
                  </svg>
              </td>
              <td/>
              <td>{i + 1}</td>
          </tr>;
          buffer.unshift(row);
        }
      } else {
        if (goodBlockchainLength > i && maliciousBlockchainLength > i) {
          if (i == 1) {
            const arrow = <tr>
                            <td>
                                <svg width="12" height="12" viewBox="0 0 1200 1120" xmlns="http://www.w3.org/2000/svg">
                                    <g transform="translate(-56.764 111.32)">
                                        <path
                                            d="m331.54 92.12l-161.94 161.31 504.59 506.55-206.47 205.67 582.19-153.6m-718.36-719.91l161.94-161.31 504.59 506.55 206.47-205.67-168.67 594.11"
                                            fill="none" stroke="#000000" strokeWidth="40"/>
                                    </g>
                                </svg>

                            </td>
                            <td>
                                <svg width="12" height="12" viewBox="0 0 1200 1120" xmlns="http://www.w3.org/2000/svg">
                                    <g transform="translate(-56.764 101.44)">
                                        <path
                                            d="m1041.2 100.71l-161.31-161.94-506.55 504.59-205.67-206.47 153.6 582.19m719.91-718.36l161.31 161.94-506.55 504.59 205.67 206.47-594.11-168.67"
                                            fill="none" stroke="#000000" strokeWidth="40"/>
                                    </g>
                                </svg>
                            </td>
                            <td/>
                        </tr>;
            buffer.unshift(arrow);
          } else {
            const arrow = <tr>
                            <td>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" version="1.0"
                                     viewBox="0 0 1200 1120">
                                    <g transform="translate(-56.764 113.32)">
                                        <path
                                            d="m657.81-46.617l-228.57-0.4437-1.3883 714.98-291.43-0.56586 520.28 303.06m1.0934-1017l228.57 0.444-1.3881 714.98 291.43 0.56583-539.37 300.83"
                                            fill="none" stroke="#000000" strokeWidth="40"/>
                                    </g>
                                </svg>
                            </td>
                            <td>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" version="1.0"
                                     viewBox="0 0 1200 1120">
                                    <g transform="translate(-56.764 113.32)">
                                        <path
                                            d="m657.81-46.617l-228.57-0.4437-1.3883 714.98-291.43-0.56586 520.28 303.06m1.0934-1017l228.57 0.444-1.3881 714.98 291.43 0.56583-539.37 300.83"
                                            fill="none" stroke="#000000" strokeWidth="40"/>
                                    </g>
                                </svg>
                            </td>
                            <td/>
                        </tr>;
            buffer.unshift(arrow);
          }
          const row = <tr>
                        <td>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                 fill="none"
                                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                 className="feather feather-box">
                                <rect width="24" height="24"/>
                            </svg>
                        </td>
                        <td>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                 fill="none"
                                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                 className="feather feather-box">
                                <rect id="black" width="24" height="24" fill="#000000"/>
                            </svg>
                        </td>
                        <td>{i + 1}</td>
                    </tr>;
          buffer.unshift(row);
        } else {
          const arrow = <tr>
                        <td/>
                        <td>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" version="1.0"
                                 viewBox="0 0 1200 1120">
                                <g transform="translate(-56.764 113.32)">
                                    <path
                                        d="m657.81-46.617l-228.57-0.4437-1.3883 714.98-291.43-0.56586 520.28 303.06m1.0934-1017l228.57 0.444-1.3881 714.98 291.43 0.56583-539.37 300.83"
                                        fill="none" stroke="#000000" strokeWidth="40"/>
                                </g>
                            </svg>
                        </td>
                        <td/>
                    </tr>;
          buffer.unshift(arrow);

          const row = <tr>
                        <td/>
                        <td>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                 fill="none"
                                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                 className="feather feather-box">
                                <rect id="black" width="24" height="24" fill="#000000"/>
                            </svg>
                        </td>
                        <td>{i + 1}</td>
                    </tr>;
          buffer.unshift(row);
        }
      }
    }

    return (
            <div className="block-tree">

                <table className="block-tree__table">
                    <tbody>

                    <tr>
                        <td>Public Branch</td>
                        <td>Attacker's Branch</td>
                        <td>Block Level</td>
                    </tr>
                    {buffer}
                    <tr>
                        <td colSpan={2}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                 fill="none" stroke="currentColor"
                                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                 className="feather feather-box">
                                <rect id="black" width="24" height="24" fill="#000000"/>
                            </svg>
                        </td>
                        <td>1<br/>(Genesis Block)</td>
                    </tr>

                    </tbody>
                </table>

                <div className="block-tree__legend">
                    <div className="block-tree__legend-svg">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"
                             fill="none" stroke="currentColor"
                             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                             className="feather feather-box">
                            <rect id="black" width="12" height="12" fill="#000000"/>
                        </svg>
                    </div>
                    <div className="block-tree__legend-text">
                        Valid Blocks
                    </div>
                    <div className="block-tree__legend-svg">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"
                             fill="none" stroke="currentColor"
                             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                             className="feather feather-box">
                            <rect width="12" height="12"/>
                        </svg>
                    </div>
                    <div className="block-tree__legend-text">
                        Invalid Blocks
                    </div>
                </div>

            </div>
    );
  }
}