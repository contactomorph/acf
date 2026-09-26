import { Future } from '../tools/Future';
import cstyles from '../TrainingPage.module.css';

function saveInClipboard(event: React.MouseEvent, text: string): void {
    event.preventDefault();
    Future.forget(navigator.clipboard.writeText(text));
}

export function SharedLink(props: { url: string }) : JSX.Element {
    const { url } = props;
    return (<div className={cstyles.CommandRow} onClick={e => e.stopPropagation()}>
        <a className={cstyles.Command} href={url} target="_blank" rel="noreferrer">🔗 Ouvrir le lien à partager</a>
        <a className={cstyles.Command} href={url} onClick={(evt) => saveInClipboard(evt, url)}>📋 Copier le lien à partager</a>
    </div>);
}