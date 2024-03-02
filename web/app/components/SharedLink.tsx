import { Future } from '../tools/Future';

function saveInClipboard(event: React.MouseEvent, text: string): void {
    event.preventDefault();
    Future.forget(navigator.clipboard.writeText(text));
}

export function SharedLink(props: { url: string }) : JSX.Element {
    const { url } = props;
    return (<div onClick={e => e.stopPropagation()} style={{ cursor: 'default' }}>
        <a href={url} target="_blank" rel="noreferrer">Ouvrir le lien à partager</a>
        <span>&nbsp;</span>
        (<a href={url} onClick={(evt) => saveInClipboard(evt, url)}>Copier le lien</a>)
    </div>);
}