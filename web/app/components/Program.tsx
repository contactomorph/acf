"use client";
import styles from './Program.module.css';
import { ARROW, CHRONO, NBS, RULER, SHOES, getIcon } from './icons';
import { Distance, Pace, Speed, TimeSpan } from '../data/units';
import { DISTANCE_COLOR_NAME, DURATION_COLOR_NAME, colorizeSpeed, stringifyDistance, stringifyPace, stringifySpeed, stringifyTimeSpan } from './unit_display';
import chroma from 'chroma-js';

export type ProgramStep = {
  readonly isRecovery: boolean,
  readonly speedPercentage: number,
  readonly speed: Speed,
  readonly pace: Pace,
  readonly from: "distance" | "duration",
  readonly distance: Distance,
  readonly cumulativeDistance: Distance,
  readonly timeSpan: TimeSpan,
  readonly cumulativeTimeSpan: TimeSpan,
};

const SPEED_COLOR_SCALE = chroma.scale(['lightgrey', 'grey']);
const DISTANCE_COLOR_SCALE = chroma.scale(['lightgrey', DISTANCE_COLOR_NAME]);
const DURATION_COLOR_SCALE = chroma.scale(['lightgrey', DURATION_COLOR_NAME]);

const COLOR_SCALES: ReadonlyArray<(value: number) => string> = [
  () => "lightgrey",
  (v) => SPEED_COLOR_SCALE(v).hex(),
  (v) => DISTANCE_COLOR_SCALE(v).hex(),
  (v) => DURATION_COLOR_SCALE(v).hex(),
  (v) => SPEED_COLOR_SCALE(v).hex(),
  (v) => DISTANCE_COLOR_SCALE(v).hex(),
  (v) => DURATION_COLOR_SCALE(v).hex(),
];

function Step(props: { step: ProgramStep, index: number }): JSX.Element {
  const step = props.step;
  const index: number = props.index;
  const proportion = index % 2 === 0 ? 0.1 : 0.2;
  const speedColor = colorizeSpeed(step.speedPercentage);
  const texts = [
    getIcon(step.isRecovery),
    stringifySpeed(step.speed),
    stringifyDistance(step.distance),
    stringifyTimeSpan(step.timeSpan),
    stringifyPace(step.pace),
    ARROW + NBS + stringifyDistance(step.cumulativeDistance),
    ARROW + NBS + stringifyTimeSpan(step.cumulativeTimeSpan),
  ];
  const tds = texts.map((t, i) => {
    if (i === 0 ) {
      const backgroundColor = speedColor.desaturate().hex();
      const borderColor = speedColor.darken(2).hex();
      const style: React.CSSProperties = { backgroundColor, borderColor };
      const title = step.isRecovery ? "Récupération" : "Course";
      return (<td>
        <div className={styles.ProgLeftBox} style={style} title={title}>{t}</div>
      </td>);
    } else {
      const style: React.CSSProperties = {
        color: speedColor.darken(2).hex(),
        backgroundColor: COLOR_SCALES[i](proportion),
      };
      return (<td style={style}>{NBS + t + NBS}</td>);
    }
  });
  return (<tr key={index}>{tds}</tr>)
}

export function Program(props: { steps: ReadonlyArray<ProgramStep> }): JSX.Element {
    const texts = [getIcon(false), SHOES, RULER, CHRONO, SHOES, ARROW + RULER, ARROW + CHRONO, ];

    const ths = texts.map((t, i) => {
      const style = {
        backgroundColor: COLOR_SCALES[i](0.2),
        width: i === 0 ? "10%" : "15%",
      };
      return (<th style={style} key={i}>{t}</th>);
    });
    
    const steps = props.steps.map((s, i) => (<Step step={s} index={i} key={i} />));

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
