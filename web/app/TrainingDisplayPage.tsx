import styles from './TrainingCreationPage.module.css';
import { useState, useMemo, useEffect } from 'react';
import { Speed, fromKmPerHour } from './data/units';
import { processFormula } from './model/FormulaProcessor';
import { computeIntervals } from './model/interval_computation';
import { toDistanceBlocks, toDurationBlocks } from './controllers/interval_translation';
import { RunningBar } from './components/RunningBar';
import { Program } from './components/Program';
import { DecimalBox } from './components/DecimalBox';
import { RouterClient } from './routing/primitives';
import Model from './model/Model';
import { Session } from './data/sessions';
import { SessionBar } from './components/SessionBar';
import { SHOES } from './components/icons';

const DISTANCE = '\uD83D\uDCCF Distance';
const DURATION = '\u23F1\uFE0F Durée';
const MIN_REF_SPEED = 5;
const MAX_REF_SPEED = 25;
const DEC_COUNT_REF_SPEED = 1;
const DEFAULT_REF_SPEED = 15;
const SPEED_URI_ARG = "speed";
const ID_URI_ARG = "id";

function toText(s: number): string | undefined {
  return s === DEFAULT_REF_SPEED ? undefined : s.toFixed(DEC_COUNT_REF_SPEED);
}

function getDefaultSession(): Session {
  return {
    id: "",
    date: new Date(),
    place: "",
    tags: [],
    comment: "",
    training: null,
    formula: "",
  };
}

export default function TrainingDisplayPage(
  props: { client: RouterClient, model: Model, visible: boolean, }
): JSX.Element {
  const { client, model, visible} = props;
  const [refSpeed, setRefSpeed] = useState<number>(DEFAULT_REF_SPEED);
  const [session, setSession] = useState<Session>(getDefaultSession);
  const [version, setVersion] = useState({});

  useMemo(() => {
    if (visible) {
      const speedText = client.getUriParam(SPEED_URI_ARG);
      if (speedText != undefined) {
        let speed = Number.parseFloat(speedText);
        if (Number.isFinite(speed)) {
          speed = Math.max(Math.min(speed, MAX_REF_SPEED), MIN_REF_SPEED);
          setRefSpeed(speed);
        }
      }
    }
  }, [client, visible]);
  useMemo(() => {
    if (visible) {
      const id = client.getUriParam(ID_URI_ARG);
      if (id) {
        const session = model.getSession(id);
        if (session) {
          setSession(session);
        }
      }
    }
  }, [client, model, visible, version]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (visible) {
      client.setUriParam(SPEED_URI_ARG, toText(refSpeed));
    }
  }, [client, refSpeed]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    setVersion({});
    const lambda = () => setVersion({});
    model.subscribeToChange(lambda);
    return () => model.unsubscribe(lambda);
  }, [model]);

  const data = useMemo(() => {
    const speedSpecifier = (speedPercentage: number): Speed => {
      const ratio = speedPercentage / 100;
      return fromKmPerHour(ratio * refSpeed);
    };
    
    const formula = processFormula(session.formula);
    const intervals = computeIntervals(formula.training, speedSpecifier);

    const [distanceBlocks, totalDistance] = toDistanceBlocks(intervals);
    const [durationBlocks, totalDuration] = toDurationBlocks(intervals);
  
    const distanceTitle = totalDistance === "" ? DISTANCE : `${DISTANCE}: ${totalDistance}`;
    const durationTitle = totalDuration === "" ? DURATION : `${DURATION}: ${totalDuration}`;

    return { intervals, distanceTitle, distanceBlocks, durationTitle, durationBlocks, };
  }, [refSpeed, session.formula]);

  const { intervals, distanceTitle, distanceBlocks, durationTitle, durationBlocks, } = data;

  return (
    <div className={styles.Page}>
      <SessionBar
        session={session}
        onClick={undefined}
        footer={undefined}
        includesText={false}
      />
      <DecimalBox
        onValueChange={setRefSpeed}
        value={refSpeed}
        minValue={MIN_REF_SPEED}
        maxValue={MAX_REF_SPEED}
        decimalCount={DEC_COUNT_REF_SPEED}
        label={`${SHOES}VMA`}
      />
      <RunningBar blocks={distanceBlocks} title={distanceTitle} />
      <RunningBar blocks={durationBlocks} title={durationTitle} />
      <Program steps={intervals} />
    </div>
  )
}

