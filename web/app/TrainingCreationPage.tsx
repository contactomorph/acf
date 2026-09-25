import cstyles from './TrainingPage.module.css';
import styles from './TrainingCreationPage.module.css';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Speed, fromKmPerHour } from './data/units';
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
import { ExpandableTagSet } from './components/TagSet';
import { CALENDAR, CHECK_BOX, COMMENT, PIN, SHOES, getIcon } from './components/icons';
import { SharedLink } from './components/SharedLink';
import { DateTimeBox, DEFAULT_HOUR, DEFAULT_MINUTE } from './components/DateTimeBox';

const MIN_REF_SPEED = 5;
const MAX_REF_SPEED = 25;
const DEC_COUNT_REF_SPEED = 1;
const DEFAULT_REF_SPEED = 15;
const SPEED_URI_ARG = "speed";
const ID_URI_ARG = "id";
const DATE_URI_ARG = "date";
const DEFAULT_PLACE = "Stade Alain Mimoun";

function parseDayKeyAtDefaultTime(dayKeyText: string | undefined): Date | null {
  if (!dayKeyText) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKeyText);
  if (!match) {
    return null;
  }
  const [, yearText, monthText, dayText] = match;
  const year = Number.parseInt(yearText, 10);
  const month = Number.parseInt(monthText, 10);
  const day = Number.parseInt(dayText, 10);
  return new Date(year, month - 1, day, DEFAULT_HOUR, DEFAULT_MINUTE);
}

function retrieveValuesFromModel(
  id: string | undefined,
  model: Model,
  placeInput: HTMLInputElement | null,
  commentInput: HTMLInputElement | null,
  setFormulaText: (formulaText: string) => void,
  setDate: (date: Date | null) => void,
  activeTags: Set<string>,
  initialDateText: string | undefined,
): void {
  let place = DEFAULT_PLACE;
  let comment = "";
  let date = parseDayKeyAtDefaultTime(initialDateText);
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
  props: { client: RouterClient, model: Model, visible: boolean, touched: boolean, }
): JSX.Element {
  const { client, model, visible, touched } = props;
  const [refSpeed, setRefSpeed] = useState<number>(DEFAULT_REF_SPEED);
  const [formulaText, setFormulaText] = useState<string>("");
  const [date, setDate] = useState<Date | null>(null);
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
  const reloadFromModel = useCallback(() => {
    const id = client.getUriParam(ID_URI_ARG);
    const initialDateText = client.getUriParam(DATE_URI_ARG);
    retrieveValuesFromModel(
      id,
      model,
      placeRefObj.current,
      commentRefObj.current,
      setFormulaText,
      setDate,
      activeTags,
      initialDateText);
  }, [client, model, activeTags]);

  // A real navigation (goTo) reveals this page as touched, so it reloads its
  // data. Merely becoming visible again — for instance when returning from the
  // help page via goToUntouched — leaves the current input untouched.
  useMemo(() => {
    if (visible && touched) {
      reloadFromModel();
    }
  }, [visible, touched, reloadFromModel]);

  // The model may load its data asynchronously after the first entry.
  useMemo(() => {
    if (visible) {
      reloadFromModel();
    }
  }, [version, reloadFromModel]); // eslint-disable-line react-hooks/exhaustive-deps
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
    return toColoredSpans(processFormula(text).firstToken);
  }, []);

  const data = useMemo(() => {
    const speedSpecifier = (speedPercentage: number): Speed => {
      const ratio = speedPercentage / 100;
      return fromKmPerHour(ratio * refSpeed);
    };
    const training = processFormula(formulaText).training;
    const intervals = computeIntervals(training, speedSpecifier);

    return { intervals };
  }, [refSpeed, formulaText]);

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
      const training = processFormula(formula).training ?? null;
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
        <input
          type="button"
          className={cstyles.Command}
          onClick={() => client.goTo('history', {})}
          value={`Revenir`}
        />
        <span>&nbsp;</span>
        <input
          type="button"
          className={cstyles.Command}
          onClick={() => deleteSession()}
          value={`Supprimer la séance`}
        />
        <span>&nbsp;</span>
        <input
          type="button"
          className={cstyles.Command}
          onClick={() => upsertSession(formulaText, activeTags, date)}
          value={`Enregistrer les modifications`}
        />
      </div>
      <div className={cstyles.BoxText}>
        <table style={{width: "100%"}}>
          <tbody>
            <tr>
              <td className={cstyles.Label}>
                {getIcon(false)}&nbsp;Programme&nbsp;
                <span
                  className={styles.HelpIcon}
                  onClick={() => client.goToUntouched('help')}
                  role='help'
                >&#x2753;</span>
              </td>
              <td><ColorBox colorizer={colorizer} value={formulaText} onChange={setFormulaText} /></td>
            </tr>
            <tr>
              <td className={cstyles.Label}>{CALENDAR}&nbsp;Date&nbsp;</td>
              <td><DateTimeBox date={date} onDateChange={setDate} /></td>
            </tr>
            <tr>
              <td className={cstyles.Label}>{PIN}&nbsp;Lieu&nbsp;</td>
              <td><input type='text' className={styles.TextField} ref={placeRefObj} role='placeText' /></td>
            </tr>
            <tr>
              <td className={cstyles.Label}>{CHECK_BOX}&nbsp;Catégories&nbsp;</td>
              <td className={cstyles.TagsCell}>
                <ExpandableTagSet allTags={allTags} activeTags={activeTags} />
              </td>
            </tr>
            <tr>
              <td className={cstyles.Label}>{COMMENT}&nbsp;Notes&nbsp;</td>
              <td><input type='text' className={styles.TextField} ref={commentRefObj} role='commentText' /></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className={cstyles.BoxText}><SharedLink url={displayUrl} /></div>
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

