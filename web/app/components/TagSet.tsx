import styles from './TagSet.module.css';
import React, { useMemo, useState } from "react";

function MutableTag(props: {
    name: string,
    active: boolean,
    onClick: () => void,
}) : JSX.Element {
    const { name, active, onClick } = props;
    const className = active ? `${styles.ActiveTag} ${styles.Clickable}` : styles.InactiveTag;
    return (<span className={className} onClick={() => onClick()}>
        &nbsp;{name}&nbsp;
    </span>)
}

function ImmutableTag(props: {
    name: string,
}) : JSX.Element {
    const { name } = props;
    return (<span className={styles.ActiveTag}>&nbsp;{name}&nbsp;</span>)
}

interface TagInfo {name: string, active: boolean};

class TagStorage {
    private readonly _allTags: ReadonlySet<string>;
    private readonly _activeTags: Set<string>;
    private readonly _onChange: () => void;

    public constructor(
        allTags: ReadonlySet<string>,
        activeTags: Set<string>,
        onChange: () => void,
    ) {
        this._onChange = onChange;
        this._allTags = new Set<string>(allTags);
        this._activeTags = activeTags;
    }

    public toggle(tag: string): void {
        if (!this._activeTags.delete(tag)) {
            this._activeTags.add(tag);
        }
        this._onChange();
    }

    public get infos(): TagInfo[] {
        const infos: Array<TagInfo> = [];
        for (const tag of this._allTags) {
            const active = this._activeTags.has(tag);
            infos.push({ name: tag, active, });
        }
        for (const tag of this._activeTags) {
            if (!this._allTags.has(tag)) {
                infos.push({ name: tag, active: true, });
            }
        }
        return infos;
    }
}

function toTagDiv(
    tags: Array<JSX.Element>,
    prefix: JSX.Element | undefined = undefined
) : JSX.Element {
    const items: Array<JSX.Element> = prefix ? [prefix] : [];
    let i = 0;
    for (const tag of tags) {
        if (0 === items.length) {
            items.push(tag);
        } else {
            items.push(<React.Fragment key={`space_${i}`}>&nbsp;</React.Fragment>, tag);
        }
        i += 1;
    }
    return (<div>{items}</div>);
}

function transfer(input: HTMLInputElement, store: TagStorage): void {
    const text = input.value.trim();
    input.value = "";
    if (0 < text.length) {
        store.toggle(text);
    }
}

export function ImmutableTagSet(props: { tags: ReadonlySet<string>, }) : JSX.Element {
    const tags = Array.from(props.tags).map(name => (<ImmutableTag
        name={name}
        key={`tag_${name}`}
    />));
    return toTagDiv(tags);
}

export function ActivableTagSet(props: {
    allTags: ReadonlySet<string>,
    activeTags: Set<string>,
    onChange: (() => void),
}) : JSX.Element {
    const [, setVersion] = useState({});
    const { allTags, activeTags, onChange } = props;
    const store = useMemo(
        () => new TagStorage(
            allTags,
            activeTags,
            () => { onChange(); setVersion({}) },
        ),
        [allTags, activeTags, onChange]
    );
    const tags = store.infos.map(i => (<MutableTag
        name={i.name}
        key={`tag_${i.name}`}
        active={i.active}
        onClick={() => store.toggle(i.name)}
    />));
    return toTagDiv(tags);
}

export function ExpandableTagSet(props: {
    allTags: ReadonlySet<string>,
    activeTags: Set<string>,
}) : JSX.Element {
    const [, setVersion] = useState({});
    const { allTags, activeTags } = props;
    const store = useMemo(
        () => new TagStorage(
            allTags,
            activeTags,
            () => setVersion({}),
        ),
        [allTags, activeTags]
    );
    const button = useMemo(
        () => (<input
            type='text'
            key="new_tag"
            style={{ border: "none" }}
            onBlur={e => transfer(e.target, store)}
        />),
        [store]
    );
    const tags = store.infos.map(i => (<MutableTag
        name={i.name}
        key={`tag_${i.name}`}
        active={i.active}
        onClick={() => store.toggle(i.name)}
    />));
    return toTagDiv(tags, button);
}
