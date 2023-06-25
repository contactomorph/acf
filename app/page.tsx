"use client";
import { RunningBar } from './components/RunningBar';
import styles from './page.module.css';
import { Program } from './components/Program';
import { ColorBox, ColoredSpan } from './components/ColorBox';
import { processFormula } from './grammar/FormulaProcessor';
import { Training } from './data/training';
import { useState } from 'react';
import { Speed } from './data/units';
import { computeIntervals } from './model/interval_computation';
import { toDistanceBlocks, toDurationBlocks } from './controllers/intervals';
import { toColoredSpans } from './controllers/grammar';

async function colorize(text: string, setter: (t: Training | undefined) => void) : Promise<ReadonlyArray<ColoredSpan>> {
  const formula = await processFormula(text);
  await new Promise<void>(resolve => setTimeout(resolve, 0));
  setter(formula.training);
  return toColoredSpans(formula.firstToken);
}

const DISTANCE = '\uD83D\uDCCF Distance';
const DURATION = '\u23F1\uFE0F Durée';

export default function Home(): JSX.Element {
  const [training, setTraining] = useState<Training | undefined>(undefined);

  function speedSpecifier(speedPercentage: number): Speed {
    return { in_meter_per_sec: 4.1 * speedPercentage / 100 };
  }
  const intervals = computeIntervals(training, speedSpecifier);
  const [distanceBlocks, totalDistance] = toDistanceBlocks(intervals);
  const [durationBlocks, totalDuration] = toDurationBlocks(intervals);

  const distanceTitle = totalDistance === "" ? DISTANCE : `${DISTANCE}: ${totalDistance}`;
  const durationTitle = totalDuration === "" ? DURATION : `${DURATION}: ${totalDuration}`;

  return (
    <main className={styles.Home}>
      <ColorBox colorizer={t => colorize(t, setTraining)} />
      <RunningBar blocks={distanceBlocks} title={distanceTitle} />
      <RunningBar blocks={durationBlocks} title={durationTitle} />
      <Program steps={intervals} />
    </main>
  )
}

