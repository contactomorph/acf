import chroma from 'chroma-js';
import { Block, RunningBar } from './components/RunningBar';
import styles from './page.module.css';

const DISTANCE = '\uD83D\uDCCF Distance';
const DURATION = '\u23F1\uFE0F Durée';

export default function Home(): JSX.Element {
  const distanceBlocks: Block[] = [
    { color: chroma('yellow'), icon: "X", texts: [], width: 40 },
    { color: chroma('purple'), icon: "Y", texts: ["Paf"], width: 30 },
  ];
  const durationBlocks: Block[] = [
    { color: chroma('red'), icon: "Z", texts: ["Coing"], width: 30 },
  ];

  const distanceTitle = `${DISTANCE}: beaucoup`;
  const durationTitle = `${DURATION}: longtemps`;
  return (
    <main className={styles.Home}>
      <RunningBar blocks={distanceBlocks} title={distanceTitle} />
      <RunningBar blocks={durationBlocks} title={durationTitle} />
    </main>
  )
}
