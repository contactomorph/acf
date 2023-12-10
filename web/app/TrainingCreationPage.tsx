import styles from './TrainingCreationPage.module.css';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Speed, fromKmPerHour } from './data/units';
import { Training } from './data/trainings';
import { processFormula } from './model/FormulaProcessor';
import { computeIntervals } from './model/interval_computation';
import { toDistanceBlocks, toDurationBlocks } from './controllers/interval_translation';
import { toColoredSpans } from './controllers/grammar_coloration';
import { RunningBar } from './components/RunningBar';
import { Program } from './components/Program';
import { ColorBox, Colorizer } from './components/ColorBox';
import { DecimalBox } from './components/DecimalBox';
import { RouterClient } from './routing/primitives';

const DISTANCE = '\uD83D\uDCCF Distance';
const DURATION = '\u23F1\uFE0F Durée';
const MIN_REF_SPEED = 5;
const MAX_REF_SPEED = 25;
const DEC_COUNT_REF_SPEED = 1;
const DEFAULT_REF_SPEED = 15;
const SPEED_URI_ARG = "speed";
const FORMULA_URI_ARG = "formula";

function retrieveValuesFromUri(
  client: RouterClient,
  setRefSpeed: (speed: number) => void,
  setFormulaText: (formulaText: string) => void,
) {
  const speedText = client.getUriParam(SPEED_URI_ARG);
  if (speedText) {
    let speed = Number.parseFloat(speedText);
    if (Number.isFinite(speed)) {
      speed = Math.max(Math.min(speed, MAX_REF_SPEED), MIN_REF_SPEED);
      setRefSpeed(speed);
    }
  }
  const formulaText = client.getUriParam(FORMULA_URI_ARG);
  if (formulaText) {
    setFormulaText(formulaText);
  }
}

function toStringOrUndefined(s: string): string | undefined {
  return s === "" ? undefined : s;
}

function toText(s: number): string | undefined {
  return s === DEFAULT_REF_SPEED ? undefined : s.toFixed(DEC_COUNT_REF_SPEED);
}

export default function TrainingCreationPage(
  props: { client: RouterClient, visible: boolean, }
): JSX.Element {
  const [refSpeed, setRefSpeed] = useState<number>(DEFAULT_REF_SPEED);
  const [formulaText, setFormulaText] = useState<string>("");
  const trainingWrapper = useMemo(() => {
    return { training: undefined as Training | undefined };
  }, []);
  
  const client = props.client;

  useMemo(() => {
    if (props.visible) {
      retrieveValuesFromUri(client, setRefSpeed, setFormulaText);
    }
  }, [props.visible]);
  useEffect(() => {
    if (props.visible) {
      client.setUriParam(SPEED_URI_ARG, toText(refSpeed));
    }
  }, [refSpeed, props.visible]);
  useEffect(() => {
    if (props.visible) {
      client.setUriParam(FORMULA_URI_ARG, toStringOrUndefined(formulaText));
    }
  }, [formulaText, props.visible]);

  const colorizer: Colorizer = useCallback((text: string) => {
    const formula = processFormula(text);
    trainingWrapper.training = formula.training;
    setFormulaText(text);
    return toColoredSpans(formula.firstToken);
  }, []);

  const data = useMemo(() => {
    const speedSpecifier = (speedPercentage: number): Speed => {
      const ratio = speedPercentage / 100;
      return fromKmPerHour(ratio * (refSpeed ?? DEFAULT_REF_SPEED));
    };
    const intervals = computeIntervals(trainingWrapper.training, speedSpecifier);

    const [distanceBlocks, totalDistance] = toDistanceBlocks(intervals);
    const [durationBlocks, totalDuration] = toDurationBlocks(intervals);
  
    const distanceTitle = totalDistance === "" ? DISTANCE : `${DISTANCE}: ${totalDistance}`;
    const durationTitle = totalDuration === "" ? DURATION : `${DURATION}: ${totalDuration}`;

    return { intervals, distanceTitle, distanceBlocks, durationTitle, durationBlocks, };
  }, [refSpeed, formulaText]);

  const { intervals, distanceTitle, distanceBlocks, durationTitle, durationBlocks, } = data;

  return (
    <div className={styles.Page}>
      <div><input type="button" onClick={() => client.goTo('history', {})} value={`Revenir`} /></div>
      <ColorBox colorizer={colorizer} text={formulaText} />
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
    </div>
  )
}

