import cstyles from './TrainingPage.module.css';
import styles from './TrainingCreationPage.module.css';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Speed, fromKmPerHour } from './data/units';
import { Training } from './data/trainings';
import { processFormula } from './model/FormulaProcessor';
import { computeIntervals } from './model/interval_computation';
import { toColoredSpans } from './controllers/grammar_coloration';
import { Program } from './components/Program';
import { ColorBox, Colorizer } from './components/ColorBox';
import { DecimalBox } from './components/DecimalBox';
import { RouterClient } from './routing/primitives';
import Model from './model/Model';
import { Session } from './data/sessions';
import { validate } from 'uuid';
import { Future } from './tools/Future';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import frLocale from "date-fns/locale/fr";
import { ExpandableTagSet } from './components/TagSet';
import { CALENDAR, CHECK_BOX, COMMENT, PIN, SHOES, getIcon } from './components/icons';
import { SharedLink } from './components/SharedLink';

const MIN_REF_SPEED = 5;
const MAX_REF_SPEED = 25;
const DEC_COUNT_REF_SPEED = 1;
const DEFAULT_REF_SPEED = 15;
const SPEED_URI_ARG = "speed";
const ID_URI_ARG = "id";

interface TrainingRef { training: Training | undefined };

function retrieveValuesFromModel(
  id: string | undefined,
  model: Model,
  placeInput: HTMLInputElement | null,
  commentInput: HTMLInputElement | null,
  setFormulaText: (formulaText: string) => void,
  setDate: (date: Date | null) => void,
  activeTags: Set<string>,
  trainingRef: TrainingRef,
): void {
  let place = "";
  let comment = "";
  let date = null;
  let formulaText = "";
  activeTags.clear();
  if (id) {
    const session = model.getSession(id);
    if (session) {
      place = session.place;
      comment = session.comment;
      formulaText = session.formula;
      date = session.date;
      session.tags.forEach(t => activeTags.add(t));
    }
  }
  if (placeInput) {
    placeInput.value = place;
  }
  if (commentInput) {
    commentInput.value = comment;
  }
  const formula = processFormula(formulaText);
  trainingRef.training = formula.training;
  setFormulaText(formulaText);
  setDate(date);
}

function toText(s: number): string | undefined {
  return s === DEFAULT_REF_SPEED ? undefined : s.toFixed(DEC_COUNT_REF_SPEED);
}

function createDisplayUrl(): string {
  const params = new URLSearchParams(window.location.search);
  params.set('page', 'display');
  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

export default function TrainingCreationPage(
  props: { client: RouterClient, model: Model, visible: boolean, }
): JSX.Element {
  const { client, model, visible } = props;
  const [refSpeed, setRefSpeed] = useState<number>(DEFAULT_REF_SPEED);
  const [formulaText, setFormulaText] = useState<string>("");
  const [date, setDate] = useState<Date | null>(null);
  const trainingRef = useMemo<TrainingRef>(() => { return { training: undefined }; }, []);
  const placeRefObj = useRef<HTMLInputElement>(null);
  const commentRefObj = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const displayUrl = useMemo<string>(() => createDisplayUrl(), [visible]);
  
  const [version, setVersion] = useState({});

  const { allTags, activeTags } = useMemo(() => {
    return {
      allTags: model.getTags() as ReadonlySet<string>,
      activeTags: new Set<string>(),
    };
  }, [model, version]); // eslint-disable-line react-hooks/exhaustive-deps

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
      retrieveValuesFromModel(
        id,
        model,
        placeRefObj.current,
        commentRefObj.current,
        setFormulaText,
        setDate,
        activeTags,
        trainingRef);
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

  const colorizer: Colorizer = useCallback((text: string) => {
    const formula = processFormula(text);
    trainingRef.training = formula.training;
    setFormulaText(text);
    return toColoredSpans(formula.firstToken);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const data = useMemo(() => {
    const speedSpecifier = (speedPercentage: number): Speed => {
      const ratio = speedPercentage / 100;
      return fromKmPerHour(ratio * refSpeed);
    };
    const intervals = computeIntervals(trainingRef.training, speedSpecifier);

    return { intervals };
  }, [refSpeed, formulaText]); // eslint-disable-line react-hooks/exhaustive-deps

  const { intervals } = data;

  const upsertSession = useCallback((formula: string, tags: Set<string>, date: Date | null) => {
    const id = client.getUriParam(ID_URI_ARG);
    if (id !== undefined && validate(id))
    {
      if (!date) {
        date = new Date();
        date.setUTCDate(date.getUTCDate() + 4 * 365);
      }
      const place = placeRefObj.current?.value ?? "";
      const comment = commentRefObj.current?.value ?? "";
      const training = trainingRef.training ?? null;
      const session: Session = {
        id,
        comment,
        date,
        formula,
        place,
        tags: Array.from(tags),
        training,
      };
      const promise = model.upsertSession(session);
      Future.forget(promise);
    }
    client.goTo('history', {});
  }, [model, client]); // eslint-disable-line react-hooks/exhaustive-deps

  const deleteSession = useCallback(() => {
    const id = client.getUriParam(ID_URI_ARG);
    if (id !== undefined && validate(id))
    {
      const promise = model
        .deleteSession(id)
        .then(() => client.goTo('history', {}));
      Future.forget(promise);
    }
  }, [model, client]);

  return (
    <div className={styles.Page}>
      <div className={cstyles.BoxText}>
        <input type="button" onClick={() => client.goTo('history', {})} value={`Revenir`} />
        <span>&nbsp;</span>
        <input type="button" onClick={() => deleteSession()} value={`Supprimer la séance`} />
        <span>&nbsp;</span>
        <input type="button" onClick={() => upsertSession(formulaText, activeTags, date)} value={`Enregistrer les modifications`} />
        <table style={{width: "100%"}}>
          <tbody>
            <tr>
              <td className={cstyles.Label}>{getIcon(false)}&nbsp;Programme&nbsp;</td>
              <td><ColorBox colorizer={colorizer} text={formulaText} /></td>
            </tr>
            <tr>
              <td className={cstyles.Label}>{CALENDAR}&nbsp;Date&nbsp;</td>
              <td>
                <DatePicker
                  locale={frLocale}
                  dateFormat="dd/MM/yyyy kk:mm"
                  onChange={setDate}
                  selected={date}
                  showTimeSelect
                />
              </td>
            </tr>
            <tr>
              <td className={cstyles.Label}>{PIN}&nbsp;Lieu&nbsp;</td>
              <td><input type='text' style={{width: "100%"}} ref={placeRefObj} role='placeText' /></td>
            </tr>
            <tr>
              <td className={cstyles.Label}>{CHECK_BOX}&nbsp;Catégories&nbsp;</td>
              <td style={{ height: "30px", verticalAlign: "middle" }}>
                <ExpandableTagSet allTags={allTags} activeTags={activeTags} />
              </td>
            </tr>
            <tr>
              <td className={cstyles.Label}>{COMMENT}&nbsp;Notes&nbsp;</td>
              <td><input type='text' style={{width: "100%"}} ref={commentRefObj} role='commentText' /></td>
            </tr>
          </tbody>
        </table>
        <SharedLink url={displayUrl} />
      </div>
      <DecimalBox
        onValueChange={setRefSpeed}
        value={refSpeed}
        minValue={MIN_REF_SPEED}
        maxValue={MAX_REF_SPEED}
        decimalCount={DEC_COUNT_REF_SPEED}
        label={`${SHOES}VMA`}
      />
      <Program steps={intervals} />
    </div>
  )
}

