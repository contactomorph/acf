"use client";
import chroma from 'chroma-js';
import { Block, RunningBar } from './components/RunningBar';
import styles from './page.module.css';
import { Program, ProgramStep } from './components/Program';
import { ColorBox, ColoredSpan } from './components/ColorBox';

const DISTANCE = '\uD83D\uDCCF Distance';
const DURATION = '\u23F1\uFE0F Durée';

async function colorize(_text: string): Promise<ReadonlyArray<ColoredSpan>> {
  await new Promise<void>(resolve => setTimeout(resolve, 0));
  return [];
}

export default function Home(): JSX.Element {
  const distanceBlocks: Block[] = [
    { color: chroma('yellow'), icon: "X", texts: [], width: 40 },
    { color: chroma('purple'), icon: "Y", texts: ["Paf"], width: 30 },
  ];
  const durationBlocks: Block[] = [
    { color: chroma('red'), icon: "Z", texts: ["Coing"], width: 30 },
  ];
  const s: ProgramStep = {
    isRecovery: false,
    speedPercentage: 100,
    speed: { in_meter_per_sec: 3 },
    pace: { in_time_per_km: { hr:0, min:0, sec: 30 } },
    from: "distance",
    distance: { in_meter: 20 },
    cumulativeDistance: { in_meter: 20 },
    timeSpan: { hr:0, min:1, sec: 30 },
    cumulativeTimeSpan: { hr:0, min:1, sec: 30 },
  };
  const steps: ProgramStep[] = [];
  for(let i=0; i < 20; ++i) {
    steps.push(s);
  }

  const distanceTitle = `${DISTANCE}: beaucoup`;
  const durationTitle = `${DURATION}: longtemps`;
  return (
    <main className={styles.Home}>
      <ColorBox colorizer={t => colorize(t)} />
      <RunningBar blocks={distanceBlocks} title={distanceTitle} />
      <RunningBar blocks={durationBlocks} title={durationTitle} />
      <Program steps={steps} />
    </main>
  )
}
