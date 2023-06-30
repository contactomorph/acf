"use client";
import styles from './page.module.css';
import { useState, useMemo } from 'react';
import { Speed, fromKmPerHour } from './data/units';
import { Training } from './data/training';
import { processFormula } from './model/FormulaProcessor';
import { computeIntervals } from './model/interval_computation';
import { toDistanceBlocks, toDurationBlocks } from './controllers/interval_translation';
import { toColoredSpans } from './controllers/grammar_coloration';
import { RunningBar } from './components/RunningBar';
import { Program } from './components/Program';
import { ColorBox, ColoredSpan } from './components/ColorBox';
import { DecimalBox, DecimalBoxConfig } from './components/DecimalBox';

async function colorize(text: string, setter: (t: Training | undefined) => void) : Promise<ReadonlyArray<ColoredSpan>> {
  const formula = await processFormula(text);
  await new Promise<void>(resolve => setTimeout(resolve, 0));
  setter(formula.training);
  return toColoredSpans(formula.firstToken);
}

const DISTANCE = '\uD83D\uDCCF Distance';
const DURATION = '\u23F1\uFE0F Durée';

const CONFIG: DecimalBoxConfig = {
  min: 5,
  max: 25,
  step: 0.1,
};

export default function Home(): JSX.Element {
  const [training, setTraining] = useState<Training | undefined>(undefined);
  const [refSpeed, setRefSpeed] = useState(15);

  const intervals = useMemo(() => {
    const speedSpecifier = (speedPercentage: number): Speed => {
      const ratio = speedPercentage / 100;
      return fromKmPerHour(ratio * refSpeed);
    };
    return computeIntervals(training, speedSpecifier);
  }, [refSpeed, training]);

  const [distanceBlocks, totalDistance] = toDistanceBlocks(intervals);
  const [durationBlocks, totalDuration] = toDurationBlocks(intervals);

  const distanceTitle = totalDistance === "" ? DISTANCE : `${DISTANCE}: ${totalDistance}`;
  const durationTitle = totalDuration === "" ? DURATION : `${DURATION}: ${totalDuration}`;

  return (
    <main className={styles.Home}>
      <ColorBox colorizer={t => colorize(t, setTraining)} />
      <DecimalBox updater={setRefSpeed} value={refSpeed} config={CONFIG} />
      <RunningBar blocks={distanceBlocks} title={distanceTitle} />
      <RunningBar blocks={durationBlocks} title={durationTitle} />
      <Program steps={intervals} />
    </main>
  )
}

