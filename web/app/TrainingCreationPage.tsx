"use client";
import styles from './TrainingCreationPage.module.css';
import { useState, useMemo, useEffect } from 'react';
import { Speed, fromKmPerHour } from './data/units';
import { Training } from './data/trainings';
import { processFormula } from './model/FormulaProcessor';
import { computeIntervals } from './model/interval_computation';
import { toDistanceBlocks, toDurationBlocks } from './controllers/interval_translation';
import { toColoredSpans } from './controllers/grammar_coloration';
import { RunningBar } from './components/RunningBar';
import { Program } from './components/Program';
import { ColorBox, ColoredSpan } from './components/ColorBox';
import { DecimalBox } from './components/DecimalBox';
import { RouterClient } from './routing/primitives';

async function colorize(
  text: string,
  setTraining: (t: Training | undefined) => void,
) : Promise<ReadonlyArray<ColoredSpan>> {
  const formula = await processFormula(text);
  await new Promise<void>(resolve => setTimeout(resolve, 0));
  setTraining(formula.training);
  return toColoredSpans(formula.firstToken);
}

const DISTANCE = '\uD83D\uDCCF Distance';
const DURATION = '\u23F1\uFE0F Durée';

const MIN_REF_SPEED = 5;
const MAX_REF_SPEED = 25;
const DEC_COUNT_REF_SPEED = 1;
const DEFAULT_REF_SPEED = 15;
const SPEED_URI_ARG = "speed";

function mayInitRefSpeed(text: string | undefined, setRefSpeed: (s: number) => void) {
  if (text !== undefined) {
    let speed = Number.parseFloat(text);
    if (Number.isFinite(speed)) {
      speed = Math.max(Math.min(speed, MAX_REF_SPEED), MIN_REF_SPEED);
      setRefSpeed(speed);
    }
  }
}

function toText(s: number): string | undefined {
  return s === DEFAULT_REF_SPEED ? undefined : s.toFixed(DEC_COUNT_REF_SPEED);
}

export default function TrainingCreationPage(props: { client: RouterClient }): JSX.Element {
  const [training, setTraining] = useState<Training | undefined>(undefined);
  const [refSpeed, setRefSpeed] = useState<number>(DEFAULT_REF_SPEED);
  
  const client = props.client;

  let buttons: JSX.Element[] = client.routes.map((r, i) => {
    const p = r === client.route ? { disabled: true }: {};
    return (<input type="button" onClick={() => client.goTo(r, {})} key={i} value={`To ${r}`} {...p}/>);
  });

  useMemo(() => mayInitRefSpeed(client.getUriParam(SPEED_URI_ARG), setRefSpeed), []);

  useEffect(() => client.setUriParam(SPEED_URI_ARG, toText(refSpeed)), [refSpeed]);

  const data = useMemo(() => {
    const speedSpecifier = (speedPercentage: number): Speed => {
      const ratio = speedPercentage / 100;
      return fromKmPerHour(ratio * (refSpeed ?? DEFAULT_REF_SPEED));
    };
    const intervals = computeIntervals(training, speedSpecifier);

    const [distanceBlocks, totalDistance] = toDistanceBlocks(intervals);
    const [durationBlocks, totalDuration] = toDurationBlocks(intervals);
  
    const distanceTitle = totalDistance === "" ? DISTANCE : `${DISTANCE}: ${totalDistance}`;
    const durationTitle = totalDuration === "" ? DURATION : `${DURATION}: ${totalDuration}`;

    return { intervals, distanceTitle, distanceBlocks, durationTitle, durationBlocks, };
  }, [refSpeed, training]);

  const { intervals, distanceTitle, distanceBlocks, durationTitle, durationBlocks, } = data;

  return (
    <div className={styles.Page}>
      <ColorBox
        colorizer={t => colorize(t, setTraining)}
      />
      <DecimalBox
        onValueChange={setRefSpeed}
        value={refSpeed}
        minValue={MIN_REF_SPEED}
        maxValue={MAX_REF_SPEED}
        decimalCount={DEC_COUNT_REF_SPEED}
      />
      <RunningBar blocks={distanceBlocks} title={distanceTitle} />
      <RunningBar blocks={durationBlocks} title={durationTitle} />
      <Program steps={intervals} />
      <div>{buttons}</div>
    </div>
  )
}

