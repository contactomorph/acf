import cstyles from './TrainingPage.module.css';
import styles from './TrainingCreationPage.module.css';
import { useState, useMemo, useEffect } from 'react';
import { Speed, fromKmPerHour } from './data/units';
import { processFormula } from './model/FormulaProcessor';
import { computeIntervals } from './model/interval_computation';
import { encodeGarminWorkout } from './model/GarminWorkoutEncoder';
import { Program } from './components/Program';
import { DecimalBox } from './components/DecimalBox';
import { RouterClient } from './routing/primitives';
import Model from './model/Model';
import { Session } from './data/sessions';
import { SessionBar } from './components/SessionBar';
import { SHOES } from './components/icons';

const MIN_REF_SPEED = 5;
const MAX_REF_SPEED = 25;
const DEC_COUNT_REF_SPEED = 1;
const DEFAULT_REF_SPEED = 15;
const SPEED_URI_ARG = "speed";
const ID_URI_ARG = "id";

function toText(s: number): string | undefined {
  return s === DEFAULT_REF_SPEED ? undefined : s.toFixed(DEC_COUNT_REF_SPEED);
}

function sanitizeFileName(name: string): string {
  const cleaned = name.trim().replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '');
  return cleaned.length === 0 ? 'seance' : cleaned;
}

function pad2(value: number): string {
  return value.toString().padStart(2, '0');
}

function formatSessionDateTime(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}_${pad2(date.getHours())}h${pad2(date.getMinutes())}`;
}

function downloadFitWorkout(session: Session, intervals: ReturnType<typeof computeIntervals>): void {
  if (intervals.length === 0) return;

  const workoutName = formatSessionDateTime(session.date);
  const bytes = encodeGarminWorkout(workoutName, intervals);
  const blob = new Blob([bytes as BlobPart], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = `acf_${sanitizeFileName(workoutName)}.fit`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
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

    return { intervals };
  }, [refSpeed, session.formula]);

  const { intervals } = data;

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
      <Program steps={intervals} />
      <div className={cstyles.BoxText}>
        <input
          type="button"
          className={cstyles.Command}
          onClick={() => downloadFitWorkout(session, intervals)}
          disabled={intervals.length === 0}
          value={`⌚ Exporter un fichier .fit (compatible Garmin/COROS)`}
        />
      </div>
    </div>
  )
}

