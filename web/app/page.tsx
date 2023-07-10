"use client";
import styles from './page.module.css';
import { useState, useMemo, useEffect, useRef } from 'react';
import { Speed, fromKmPerHour } from './data/units';
import { Training } from './data/training';
import { processFormula } from './model/FormulaProcessor';
import { computeIntervals } from './model/interval_computation';
import { toDistanceBlocks, toDurationBlocks } from './controllers/interval_translation';
import { toColoredSpans } from './controllers/grammar_coloration';
import { RunningBar } from './components/RunningBar';
import { Program } from './components/Program';
import { ColorBox, ColoredSpan } from './components/ColorBox';
import { DecimalBox } from './components/DecimalBox';
import { UriQueryConnector } from './tools/UriQueryConnector';
import { FbServer } from './backend/FbServer';

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
const STEP_REF_SPEED = 0.1;
const DEFAULT_REF_SPEED = 15;
const SPEED_URI_ARG = "speed";

function maySetRefSpeed(text: string | undefined, setRefSpeed: (s: number) => void) {
  if (text !== undefined) {
    let speed = Number.parseFloat(text);
    if (Number.isFinite(speed)) {
      speed = Math.max(Math.min(speed, MAX_REF_SPEED), MIN_REF_SPEED);
      setRefSpeed(speed);
    }
  }
}

function getRefSpeed(s: number): string {
  return s === DEFAULT_REF_SPEED ? "" : `${s}`;
}


const DEF = {
  "categories":[],
  "date":"2023-07-22 22:00:00Z",
  "place":"Stade Alain Mimoun",
  "training":"100m à vma"
};

function BasicForm(): JSX.Element {
  const [dbContent, setDbContent] = useState<string>("");
  var server = useMemo(() => new FbServer(), []);
  useEffect(() => {
    server.subscribe(data => setDbContent(JSON.stringify(data)));
  }, []);

  return (<div>
    <div>Content: {dbContent}</div>
    Training: <input type='text' /><br/>
    Post: <input type='text' /><br/>
    <input type='button' value='Ajouter' onClick={() => server.post(DEF)} />
  </div>);
}

const CONNECTOR = new UriQueryConnector(() => globalThis.window);

export default function Home(): JSX.Element { 
  const [training, setTraining] = useState<Training | undefined>(undefined);
  const [refSpeed, setRefSpeed] = useState<number>(DEFAULT_REF_SPEED);

  useEffect(() => {
    CONNECTOR.extractFromUri([SPEED_URI_ARG, t => maySetRefSpeed(t, setRefSpeed)]);
  }, []);

  useEffect(
    () => CONNECTOR.injectInUri([SPEED_URI_ARG, getRefSpeed(refSpeed)]),
    [refSpeed],
  );

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
    <main className={styles.Home}>
      <ColorBox
        colorizer={t => colorize(t, setTraining)}
      />
      <DecimalBox
        onValueChange={setRefSpeed}
        value={refSpeed ?? DEFAULT_REF_SPEED}
        minValue={MIN_REF_SPEED}
        maxValue={MAX_REF_SPEED}
        step={STEP_REF_SPEED}
      />
      <RunningBar blocks={distanceBlocks} title={distanceTitle} />
      <RunningBar blocks={durationBlocks} title={durationTitle} />
      <Program steps={intervals} />
      <BasicForm />
    </main>
  )
}

