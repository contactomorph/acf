import cstyles from './TrainingPage.module.css';
import styles from './HelpPage.module.css';
import { RouterClient } from './routing/primitives';
import { colorizeSpeed } from './components/unit_display';

function speedStyle(percentage: number): React.CSSProperties {
    const color = colorizeSpeed(percentage);
    return {
        backgroundColor: color.brighten().hex(),
        color: color.darken(2).hex(),
        borderRadius: '3px',
    };
}

function Keyword(props: { children: string }): JSX.Element {
    return <span className={styles.Keyword}>{props.children}</span>;
}

function Distance(props: { children: string }): JSX.Element {
    return <span className={styles.Distance}>{props.children}</span>;
}

function Duration(props: { children: string }): JSX.Element {
    return <span className={styles.Duration}>{props.children}</span>;
}

function Speed(props: { percentage: number, children: string }): JSX.Element {
    return <span style={speedStyle(props.percentage)}>{props.children}</span>;
}

function Factor(props: { children: string }): JSX.Element {
    return <span className={styles.Factor}>{props.children}</span>;
}

export default function HelpPage(
    props: { client: RouterClient, visible: boolean }
): JSX.Element {
    const { client } = props;

    return (<div className={styles.Page}>
        <div className={cstyles.BoxText}>
            <input
                type="button"
                className={cstyles.Command}
                onClick={() => client.goToUntouched('creation')}
                value={`Revenir`}
            />
        </div>
        <div className={styles.Content}>
            <h1>Aide : grammaire des séances</h1>
            <p>
                Une séance se décrit avec une formule textuelle. La formule est
                colorée automatiquement pendant la saisie pour signaler les
                éléments reconnus.
            </p>

            <h2>Intervalles</h2>
            <p>
                Dans sa forme la plus simple une séance est une suite
                d'intervalles séparés par des <code>,</code> et chacun indiquant
                une vitesse à maintenir sur une durée ou une distance donnée&nbsp;:
            </p>
            <div className={styles.Example}><Distance>100m</Distance> <Keyword>à</Keyword> <Speed percentage={100}>vma</Speed><Keyword>,</Keyword> <Distance>200m</Distance> <Keyword>à</Keyword> <Speed percentage={88}>vsm</Speed><Keyword>,</Keyword> <Duration>3"2'</Duration> <Keyword>à</Keyword> <Speed percentage={80}>vm</Speed></div>
            <div className={styles.Example}><Duration>1h</Duration> <Keyword>à</Keyword> <Speed percentage={60}>60%</Speed><Keyword>,</Keyword> <Distance>1km</Distance> <Keyword>à</Keyword> <Speed percentage={78}>78%</Speed></div>

            <p>Les vitesses peuvent être spécifiées soit par un des mots clés&nbsp;:</p>
            <table className={styles.Reference}>
                <tbody>
                    <tr><td className={styles.Symbol}><Speed percentage={100}>vma</Speed></td><td>Vitesse maximale aérobie</td></tr>
                    <tr><td className={styles.Symbol}><Speed percentage={92}>v10</Speed></td><td>Vitesse pour un 10km (92% de la vma)</td></tr>
                    <tr><td className={styles.Symbol}><Speed percentage={88}>vsm</Speed></td><td>Vitesse pour un semi-marathon (88% de la vma)</td></tr>
                    <tr><td className={styles.Symbol}><Speed percentage={80}>vm</Speed></td><td>Vitesse pour un marathon (80% de la vma)</td></tr>
                    <tr><td className={styles.Symbol}><Speed percentage={65}>vf</Speed></td><td>Endurance fondamentale (65% de la vma)</td></tr>
                </tbody>
            </table>
            <p>
                soit par un pourcentage, correspondant directement à un
                pourcentage de vma.
            </p>

            <p>
                Les distances possibles peuvent se donner en <code>m</code> ou
                en <code>km</code>&nbsp;:
            </p>
            <div className={styles.Example}><Distance>200m</Distance> <Keyword>à</Keyword> <Speed percentage={100}>vma</Speed><Keyword>,</Keyword> <Distance>1km</Distance> <Keyword>à</Keyword> <Speed percentage={82}>82%</Speed></div>

            <p>
                Les durées peuvent mélanger les symboles <code>h</code> (heures),
                {' '}<code>min</code> / <code>'</code> (minutes) et <code>s</code>
                {' '}/ <code>"</code> (secondes)&nbsp;:
            </p>
            <div className={styles.Example}><Duration>2h23min</Duration> <Keyword>à</Keyword> <Speed percentage={80}>vm</Speed><Keyword>,</Keyword> <Duration>4'26"</Duration> <Keyword>à</Keyword> <Speed percentage={87}>87%</Speed></div>

            <h2>Récupération</h2>
            <p>
                Chaque intervalle de course peut être suivi d'un intervalle de
                récupération en utilisant le mot clé <Keyword>récup</Keyword>
                {' '}suivi d'une durée ou d'une distance&nbsp;:
            </p>
            <div className={styles.Example}><Duration>6min</Duration> <Keyword>à</Keyword> <Speed percentage={87}>87%</Speed> <Keyword>récup</Keyword> <Duration>3min</Duration><Keyword>,</Keyword> <Distance>400m</Distance> <Keyword>à</Keyword> <Speed percentage={78}>78%</Speed> <Keyword>récup</Keyword> <Duration>2min</Duration></div>
            <p>
                Par défaut la récupération se fait à la vitesse d'endurance
                fondamentale (<Speed percentage={65}>vf</Speed>) mais une vitesse
                explicite peut être incluse&nbsp;:
            </p>
            <div className={styles.Example}><Duration>6min</Duration> <Keyword>à</Keyword> <Speed percentage={87}>87%</Speed> <Keyword>récup</Keyword> <Duration>3min</Duration> <Keyword>à</Keyword> <Speed percentage={50}>50%</Speed><Keyword>,</Keyword> <Distance>400m</Distance> <Keyword>à</Keyword> <Speed percentage={78}>78%</Speed> <Keyword>récup</Keyword> <Duration>2min</Duration> <Keyword>à</Keyword> <Speed percentage={45}>45%</Speed></div>

            <h2>Répétition</h2>
            <p>
                Un intervalle ou une séquence d'intervalles peut être répété
                plusieurs fois en commençant par un nombre de répétitions suivi
                du symbole <Keyword>*</Keyword>. S'il faut répéter une séquence de
                plusieurs intervalles on les groupe en utilisant des
                parenthèses&nbsp;:
            </p>
            <div className={styles.Example}><Factor>4</Factor> <Keyword>*</Keyword> <Keyword>(</Keyword><Distance>100m</Distance> <Keyword>à</Keyword> <Speed percentage={92}>v10</Speed> <Keyword>récup</Keyword> <Distance>50m</Distance><Keyword>)</Keyword><Keyword>,</Keyword> <Factor>3</Factor> <Keyword>*</Keyword> <Keyword>(</Keyword><Distance>200m</Distance> <Keyword>à</Keyword> <Speed percentage={88}>vsm</Speed> <Keyword>récup</Keyword> <Distance>100m</Distance><Keyword>)</Keyword></div>
            <div className={styles.Example}><Factor>10</Factor> <Keyword>*</Keyword> <Keyword>(</Keyword><Duration>2'</Duration> <Keyword>à</Keyword> <Speed percentage={95}>95%</Speed><Keyword>,</Keyword> <Duration>3'</Duration> <Keyword>à</Keyword> <Speed percentage={80}>80%</Speed> <Keyword>récup</Keyword> <Duration>4'</Duration><Keyword>)</Keyword></div>
            <p>
                Si la séquence d'intervalles à répéter se termine par une
                récupération, cette dernière est automatiquement supprimée de la
                {' '}<em>dernière répétition</em> quand&nbsp;:
            </p>
            <p>— on est en fin de séance&nbsp;:</p>
            <div className={`${styles.Example} ${styles.Indented}`}><Factor>8</Factor> <Keyword>*</Keyword> <Keyword>(</Keyword><Duration>2'</Duration> <Keyword>à</Keyword> <Speed percentage={95}>95%</Speed> <Keyword>récup</Keyword> <Duration>2'</Duration><Keyword>,</Keyword> <Duration>3'</Duration> <Keyword>à</Keyword> <Speed percentage={80}>80%</Speed> <Keyword>récup</Keyword> <Duration>4'</Duration><Keyword>)</Keyword></div>
            <p className={`${styles.Note} ${styles.Indented}`}>
                La récupération de 4 minutes à la 8ème répétition est supprimée
                car c'est la fin de séance.
            </p>
            <p>— la séquence est suivie par un autre intervalle de récupération&nbsp;:</p>
            <div className={`${styles.Example} ${styles.Indented}`}><Factor>4</Factor> <Keyword>*</Keyword> <Keyword>(</Keyword><Duration>2'</Duration> <Keyword>à</Keyword> <Speed percentage={90}>90%</Speed> <Keyword>récup</Keyword> <Duration>4'</Duration><Keyword>)</Keyword> <Keyword>récup</Keyword> <Duration>5'</Duration><Keyword>,</Keyword> <Duration>1'</Duration> <Keyword>à</Keyword> <Speed percentage={100}>vma</Speed></div>
            <p className={`${styles.Note} ${styles.Indented}`}>
                La récupération de 4 minutes de la 4ème répétition du premier bloc
                est remplacée par la récupération de 5 minutes qui suit.
            </p>
            <p>
                Une limitation actuelle est qu'il n'est pas possible d'avoir
                plusieurs niveaux de répétitions imbriqués&nbsp;:
            </p>
            <div className={styles.Example}><Factor>3</Factor> <Keyword>*</Keyword> <Keyword>(</Keyword><Factor>4</Factor> <Keyword>*</Keyword> <Keyword>(</Keyword><Duration>2'</Duration> <Keyword>à</Keyword> <Speed percentage={90}>90%</Speed> <Keyword>récup</Keyword> <Duration>4'</Duration><Keyword>)</Keyword> <Keyword>récup</Keyword> <Duration>5'</Duration><Keyword>,</Keyword> <Duration>1'</Duration> <Keyword>à</Keyword> <Speed percentage={100}>vma</Speed><Keyword>)</Keyword></div>
            <p className={styles.Note}>Le programme ci-dessus est invalide.</p>

            <h2>Répétitions conditionnelles</h2>
            <p>
                Il est possible d'adapter le nombre de répétitions en fonction de
                la vma en utilisant les mots clés <Keyword>ou</Keyword> et
                {' '}<Keyword>dès</Keyword>&nbsp;:
            </p>
            <div className={styles.Example}><Factor>4</Factor> <Keyword>ou</Keyword> <Factor>5</Factor> <Keyword>dès</Keyword> <Factor>14</Factor> <Keyword>ou</Keyword> <Factor>6</Factor> <Keyword>dès</Keyword> <Factor>16</Factor> <Keyword>*</Keyword> <Keyword>(</Keyword><Duration>2'</Duration> <Keyword>à</Keyword> <Speed percentage={90}>90%</Speed> <Keyword>récup</Keyword> <Duration>4'</Duration><Keyword>)</Keyword></div>
            <p className={styles.Note}>
                Le programme ci-dessus implique 4 répétitions pour une vma
                inférieure à 14, 5 répétitions pour une vma de 14 à 16 et 6
                répétitions au-delà de 16.
            </p>
            <p>
                Cette méthode peut être utilisée pour créer des séquences qui ne
                s'appliquent que pour certaines gammes de vma&nbsp;:
            </p>
            <div className={styles.Example}><Distance>10km</Distance> <Keyword>à</Keyword> <Speed percentage={88}>vsm</Speed><Keyword>,</Keyword> <Factor>0</Factor> <Keyword>ou</Keyword> <Factor>1</Factor> <Keyword>dès</Keyword> <Factor>15</Factor> <Keyword>*</Keyword> <Distance>3km</Distance> <Keyword>à</Keyword> <Speed percentage={92}>v10</Speed></div>
            <p className={styles.Note}>
                L'intervalle final de 3km ne s'applique qu'aux vma à partir de 15.
            </p>
        </div>
    </div>);
}