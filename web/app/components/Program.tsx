import styles from './Program.module.css';
import { CHRONO, NBS, RULER, SHOES, getIcon } from './icons';
import { Distance, Pace, Speed, TimeSpan, toSeconds } from '../data/units';
import { colorizeSpeed, stringifyDistance, stringifySpeed, stringifyTimeSpan } from './unit_display';
import chroma from 'chroma-js';
import { Round } from '../data/intervals';

export interface ProgramStep {
  readonly isRecovery: boolean,
  readonly speedPercentage: number,
  readonly speed: Speed,
  readonly pace: Pace,
  readonly from: "distance" | "duration",
  readonly distance: Distance,
  readonly cumulativeDistance: Distance,
  readonly timeSpan: TimeSpan,
  readonly cumulativeTimeSpan: TimeSpan,
  readonly round: Round | undefined,
};

const WHITE = chroma("White"); 
const BLACK = chroma("Black");
const CA1 = chroma("Cyan"); 
const CA2 = CA1.darken();
const CB1 = chroma("Blue"); 
const CB2 = CB1.darken();
const LIGHT_GREY = chroma("lightgrey");
const GREY = chroma("lightgrey").darken(0.2);

function Step(props: { step: ProgramStep, classification: number }): JSX.Element {
  const { step, classification } = props;
  const speedColor = colorizeSpeed(step.speedPercentage);
  const texts = [
    stringifySpeed(step.speed),
    stringifyDistance(step.distance),
    stringifyTimeSpan(step.timeSpan),
  ];
  const padding =`${3 * classification}px`;

  const backgroundColor = speedColor.desaturate().hex();
  const title = step.isRecovery ? "Récupération" : "Course";

  const proportionalWidth = 100 / (texts.length + 1);
  let tds: JSX.Element[];
  let round = step.round;
  if (round === undefined) {
    const style: React.CSSProperties = {
      backgroundColor, 
      paddingTop: padding,
      paddingBottom: padding,
      width: `${proportionalWidth}%`,
    };
    tds = [<td key={0} colSpan={2} style={style} title={title}>&nbsp;</td>];
  }
  else if (round.sectionIndex === 0) {
    const text = `${(round.roundIndex + 1)} / ${round.roundCount}`;
    const leftStyle: React.CSSProperties = {
      backgroundColor,
      paddingTop: padding,
      paddingBottom: padding,
      width: `${3*proportionalWidth/4}%`,
    };
    const evenBlock = round.blockIndex % 2 === 0;
    const evenRound = round.roundIndex % 2 === 0;
    const roundColor = evenBlock ? (evenRound ? CA1 : CA2) : (evenRound ? CB1 : CB2);
    const color = evenBlock ? BLACK : WHITE;
    const rightStyle: React.CSSProperties = {
      color: color.hex(),
      backgroundColor: roundColor.hex(),
      paddingTop: padding,
      paddingBottom: padding,
      width: `${proportionalWidth/4}%`,
      textAlign: "center",
    };

    tds = [
      <td key={-1} style={rightStyle} title={text} rowSpan={round.sectionCount}>{text}</td>,
      <td key={0} style={leftStyle} title={title}>&nbsp;</td>,
    ];
  }
  else {
    const leftStyle: React.CSSProperties = {
      backgroundColor,
      paddingTop: padding,
      paddingBottom: padding,
      width: `${proportionalWidth/2}%`,
    };

    tds = [
      <td key={-1} style={leftStyle} title={title}>&nbsp;</td>,
    ];
  }

  let i = 1;
  for (const t of texts) {
    const columnColor = i % 2 === 0 ? LIGHT_GREY : GREY;
    const backgroundColor = chroma.scale([columnColor, speedColor])(0.15).hex();
    
    const style: React.CSSProperties = {
      color: speedColor.darken(2).hex(),
      backgroundColor,
      paddingTop: padding,
      paddingBottom: padding,
      width: `${proportionalWidth}%`,
    };
    tds.push(<td key={i} style={style}>{NBS + t + NBS}</td>);
    ++i;
  }
  return (<tr>{tds}</tr>)
}

export function Program(props: { steps: ReadonlyArray<ProgramStep> }): JSX.Element {
    const texts = [getIcon(false), SHOES, RULER, CHRONO];

    const ths = texts.map((t, i) => {
      const columnColor = i % 2 === 0 ? LIGHT_GREY : GREY;
      const style = {
        backgroundColor: columnColor.hex(),
      };
      return i === 0 ? (<th colSpan={2} key={i} style={style}>{t}</th>) : (<th key={i} style={style}>{t}</th>);
    });
    
    const classifications = classifySteps(props.steps);
    const steps = props.steps.map((s, i) => (<Step key={i} classification={classifications[i]} step={s} />));

    return (<div className={styles.Prog}>
        <div className={styles.ProgTitle}>{SHOES} Entraînement</div>
        <div className={styles.ProgInner}>
          <table className={styles.ProgTable}>
            <thead><tr>{ths}</tr></thead>
            <tbody>{steps}</tbody>
          </table>
        </div>
    </div>);
}

function classifySteps(steps: ReadonlyArray<ProgramStep>): number[] {
  let maxDuration: number = 0;
  let minDuration: number = Infinity;
  for (const step of steps) {
    const duration = toSeconds(step.timeSpan);
    maxDuration = Math.max(maxDuration, duration);
    minDuration = Math.min(minDuration, duration);
  }
  const classWidth = (maxDuration - minDuration) / 4;
  const classifications: number[] = [];
  
  for (const step of steps) {
    const duration = toSeconds(step.timeSpan);

    const x = 0.5 + (duration - minDuration) / classWidth; // 0.5 to 4.5 included
    classifications.push(Math.floor(x)); // 0 to 4 included
  }

  return classifications;
}