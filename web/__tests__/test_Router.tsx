import { test, expect } from '@jest/globals';
import { render, act } from '@testing-library/react';
import { Router, RouterKedge } from '../app/routing/Router';
import { RouterClient, URLStore } from '@/app/routing/primitives';
import Ptr from '../app/tools/Ptr';
import { useMemo } from 'react';

class MockURLStore implements URLStore {
    public readonly paramsHistory: Array<URLSearchParams>;

    constructor() {
        this.paramsHistory = [];
    }

    get searchParams(): URLSearchParams {
        const params = this.paramsHistory.at(-1);
        return params ?? new URLSearchParams();
    }
    
    set searchParams(params: URLSearchParams) {
        this.paramsHistory.push(params);
    }
}

test('Router sends appropriate props to pages when navigating', () => {
    const pc1 = new Ptr<RouterClient>();
    const pv1 = new Ptr<boolean>();
    const pc2 = new Ptr<RouterClient>();
    const pv2 = new Ptr<boolean>();

    const store = new MockURLStore();
    const kedge = new RouterKedge(() => store);

    render(
        <Router kedge={kedge}>
            {{
                ctor: (cl, v) => { pc1.set(cl); pv1.set(v); return (<div></div>); },
                route: "premier",
            }}
            {{
                ctor: (cl, v) => { pc2.set(cl); pv2.set(v); return (<div></div>); },
                route: "deuxieme",
            }}
        </Router>
    );

    expect(pc1.value?.route).toBe("premier");
    expect(pv1.value).toBe(true);
    expect(pc2.value?.route).toBe("deuxieme");
    expect(pv2.value).toBe(false);
    expect(store.searchParams.toString()).toEqual("page=premier");

    let changed = false;
    act(() => {
        changed = pc1.value!.goTo("deuxieme", { bim: "bam" });
    });
    
    expect(changed).toBe(true);
    expect(pv1.value).toBe(false);
    expect(pv2.value).toBe(true);
    expect(store.searchParams.toString()).toEqual("page=deuxieme&bim=bam");
    
    act(() => {
        changed = pc1.value!.goTo("deuxieme", { bim: "zap" });
    });

    expect(changed).toBe(false);
    expect(pv1.value).toBe(false);
    expect(pv2.value).toBe(true);
    expect(store.searchParams.toString()).toEqual("page=deuxieme&bim=bam");
});

function MockPage(props: { ptr: Ptr<object> }): JSX.Element {
    const someObject = useMemo(() => { return {}; }, []);
    props.ptr.set(someObject);
    return (<div></div>);
}

test('Router preserves memoised content inside pages', () => {
    const po1 = new Ptr<object>();
    const po2 = new Ptr<object>();
    const pid = new Ptr<string>();

    const store = new MockURLStore();
    const kedge = new RouterKedge(() => store);

    function ctor1(client: RouterClient): JSX.Element {
        pid.set(client.wrapperId);
        return (<MockPage ptr={po1}/>);
    };

    const { rerender } = render(
        <Router kedge={kedge}>
            {{ ctor: ctor1, route: "premier" }}
            {{ ctor: () => (<MockPage ptr={po2}/>), route: "deuxieme" }}
        </Router>
    );

    expect(po1.value).not.toBe(null);
    expect(po2.value).not.toBe(null);
    expect(pid.value).not.toBe(null);
    const o1 = po1.value!;
    const o2 = po2.value!;
    const wrapperId = pid.value!;
    
    rerender(
        <Router kedge={kedge}>
            {{ ctor: ctor1, route: "premier" }}
            {{ ctor: () => (<MockPage ptr={po2}/>), route: "deuxieme" }}
        </Router>
    );

    expect(po1.value).toBe(o1);
    expect(po2.value).toBe(o2);
    expect(pid.value).toBe(wrapperId);
});