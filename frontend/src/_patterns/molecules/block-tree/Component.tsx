import * as React from 'react';
import validBlockIcon from '../../../styles/svg/valid-block.svg';
import invalidBlockIcon from '../../../styles/svg/invalid-block.svg';
import downToRightArrowIcon from '../../../styles/svg/downToRightArrow.svg';
import downArrowIcon from '../../../styles/svg/downArrow.svg';
import downToLeftArrowIcon from '../../../styles/svg/downToLeftArrow.svg';

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

    const downToRightArrow = (
            <svg viewBox={downToRightArrowIcon.viewBox} className="block-tree__icon">
                <use xlinkHref={`#${downToRightArrowIcon.id}`}/>
            </svg>
        );
    const downToLeftArrow = (
            <svg viewBox={downToLeftArrowIcon.viewBox} className="block-tree__icon">
                <use xlinkHref={`#${downToLeftArrowIcon.id}`}/>
            </svg>
        );
    const downArrow = (
            <svg viewBox={downArrowIcon.viewBox} className="block-tree__icon">
                <use xlinkHref={`#${downArrowIcon.id}`}/>
            </svg>
        );
    const validBlock = (
            <svg viewBox={validBlockIcon.viewBox} className="block-tree__icon">
                <use xlinkHref={`#${validBlockIcon.id}`}/>
            </svg>
        );
    const invalidBlock = (
            <svg viewBox={invalidBlockIcon.viewBox} className="block-tree__icon">
                <use xlinkHref={`#${invalidBlockIcon.id}`}/>
            </svg>
        );
    const legendValidBlock = (
            <svg viewBox={validBlockIcon.viewBox} className="block-tree__legend-icon">
                <use xlinkHref={`#${validBlockIcon.id}`}/>
            </svg>
        );
    const legendInvalidBlock = (
            <svg viewBox={invalidBlockIcon.viewBox} className="block-tree__legend-icon">
                <use xlinkHref={`#${invalidBlockIcon.id}`}/>
            </svg>
        );

    let longerLength;
    if (successfulAttackInBlocks > 0) {
      longerLength = Math.min(
                Math.max(maliciousBlockchainLength, goodBlockchainLength),
                attackDuration + 1,
                successfulAttackInBlocks,
            );
    } else {
      longerLength = Math.min(
                Math.max(maliciousBlockchainLength, goodBlockchainLength),
                attackDuration + 1,
            );
    }

    const blockTreeBuffer = [];
    for (let i = 1; i < longerLength; i = i + 1) {
      if (attackSucceeded !== 1) {
        if (goodBlockchainLength > i && maliciousBlockchainLength > i) {
          if (i === 1) {
            const arrow = (
                            <tr key={i + '-arrow'}>
                                <td>{downToRightArrow}</td>
                                <td>{downToLeftArrow}</td>
                                <td/>
                            </tr>
                        );
            blockTreeBuffer.unshift(arrow);
          } else {
            const arrow = (
                            <tr key={i + '-arrow'}>
                                <td>{downArrow}</td>
                                <td>{downArrow}</td>
                                <td/>
                            </tr>
                        );
            blockTreeBuffer.unshift(arrow);
          }
          const row = (
                        <tr key={i + '-row'}>
                            <td>{validBlock}</td>
                            <td>{invalidBlock}</td>
                            <td>{i + 1}</td>
                        </tr>
                    );
          blockTreeBuffer.unshift(row);
        } else if (maliciousBlockchainLength > i) {
          if (i === 1) {
            const arrow = (
                            <tr key={i + '-arrow'}>
                                <td/>
                                <td>{downToLeftArrow}</td>
                                <td/>
                            </tr>
                        );
            blockTreeBuffer.unshift(arrow);
          } else {
            const arrow = (
                            <tr key={i + '-arrow'}>
                                <td/>
                                <td>{downArrow}</td>
                                <td/>
                            </tr>
                        );
            blockTreeBuffer.unshift(arrow);
          }
          const row = (
                        <tr key={i + '-row'}>
                            <td/>
                            <td>{invalidBlock}</td>
                            <td>{i + 1}</td>
                        </tr>
                    );
          blockTreeBuffer.unshift(row);
        } else if (goodBlockchainLength > i) {
          if (i === 1) {
            const arrow = (
                            <tr key={i + '-arrow'}>
                                <td>{downToRightArrow}</td>
                                <td/>
                                <td/>
                            </tr>
                        );
            blockTreeBuffer.unshift(arrow);
          } else {
            const arrow = (
                            <tr key={i + '-arrow'}>
                                <td>{downArrow}</td>
                                <td/>
                                <td/>
                            </tr>
                        );
            blockTreeBuffer.unshift(arrow);
          }

          const row = (
                        <tr key={i + '-row'}>
                            <td>{validBlock}</td>
                            <td/>
                            <td>{i + 1}</td>
                        </tr>
                    );
          blockTreeBuffer.unshift(row);
        }
      } else {
        if (goodBlockchainLength > i && maliciousBlockchainLength > i) {
          if (i === 1) {
            const arrow = (
                            <tr key={i + '-arrow'}>
                                <td>{downToRightArrow}</td>
                                <td>{downToLeftArrow}</td>
                                <td/>
                            </tr>
                        );
            blockTreeBuffer.unshift(arrow);
          } else {
            const arrow = (
                            <tr key={i + '-arrow'}>
                                <td>{downArrow}</td>
                                <td>{downArrow}</td>
                                <td/>
                            </tr>
                        );
            blockTreeBuffer.unshift(arrow);
          }
          const row = (
                        <tr key={i + '-row'}>
                            <td>{invalidBlock}</td>
                            <td>{validBlock}</td>
                            <td>{i + 1}</td>
                        </tr>
                    );
          blockTreeBuffer.unshift(row);
        } else {
          if (i === 1) {
            const arrow = (
                            <tr key={i + '-arrow'}>
                                <td/>
                                <td>{downToLeftArrow}</td>
                                <td/>
                            </tr>
                        );
            blockTreeBuffer.unshift(arrow);
          } else {
            const arrow = (
                            <tr key={i + '-arrow'}>
                                <td/>
                                <td>{downArrow}</td>
                                <td/>
                            </tr>
                        );
            blockTreeBuffer.unshift(arrow);
          }
          const row = (
                        <tr key={i + '-row'}>
                            <td/>
                            <td>{validBlock}</td>
                            <td>{i + 1}</td>
                        </tr>
                    );
          blockTreeBuffer.unshift(row);
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

                    {blockTreeBuffer}

                    <tr>
                        <td colSpan={2}>{validBlock}</td>
                        <td>1<br/>(Genesis Block)</td>
                    </tr>

                    </tbody>
                </table>

                <div className="block-tree__legend">
                    <div className="block-tree__legend-svg">{legendValidBlock}</div>
                    <div className="block-tree__legend-text">Valid Blocks</div>
                    <div className="block-tree__legend-svg">{legendInvalidBlock}</div>
                    <div className="block-tree__legend-text">Invalid Blocks</div>
                </div>

            </div>
    );
  }
}
