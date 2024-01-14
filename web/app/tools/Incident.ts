export interface Incident<T> {
    subscribe(lambda: (arg: T) => void, token: object | undefined): object;
    subscribeWeakly<O extends WeakKey>(
        obj: O,
        lambda: (this: O, arg: T) => void,
        token: object | undefined
    ): object;
    unsubscribe(token: object): boolean;
}

interface Subscriber<T> {
    call(arg: T) : Error | undefined;
}

class WeakSubscriber<O extends WeakKey, T> implements Subscriber<T> {
    private readonly _ref: WeakRef<O>;
    private readonly _method: (this: O, arg: T) => void;

    constructor(obj: O, method: (this: O, arg: T) => void) {
        this._ref = new WeakRef<O>(obj);
        this._method = method;
    }

    call(arg: T) : Error | undefined {
        const obj = this._ref.deref();
        if (obj) {
            try {
                this._method.call(obj, arg);
            }
            catch(error) {
                return error as Error;
            }
        }
    }
}

class StrongSubscriber<T> implements Subscriber<T> {
    private readonly _method: (arg: T) => void;

    constructor(method: (arg: T) => void) {
        this._method = method;
    }

    call(arg: T) : Error | undefined {
        try {
            this._method(arg);
        }
        catch(error) {
            return error as Error;
        }
    }
}

type SubscriberList<T> = Subscriber<T>[];

class PrivateIncident<T> implements Incident<T> {
    private readonly _subscribers: Map<object, SubscriberList<T>>;
    constructor(subscribers: Map<object, SubscriberList<T>>) {
        this._subscribers = subscribers;
    }

    subscribe(lambda: (arg: T) => void, token: object | undefined): object {
        const subscriber = new StrongSubscriber<T>(lambda);
        return this._subscribe(subscriber, token ?? {});
    }

    subscribeWeakly<O extends WeakKey>(
        obj: O,
        lambda: (this: O, arg: T) => void,
        token: object | undefined
    ): object {
        const subscriber = new WeakSubscriber<O, T>(obj, lambda);
        return this._subscribe(subscriber, token ?? {});
    }

    unsubscribe(token: object): boolean {
        return this._subscribers.delete(token);
    }

    private _subscribe(subscriber: Subscriber<T>, token: object): object {
        const subscriberList = this._subscribers.get(token);
        if (subscriberList) {
            subscriberList.push(subscriber);
        } else {
            this._subscribers.set(token, [subscriber]);
        }
        return token;
    }
}

export class IncidentSource<T> {
    private readonly _incident: PrivateIncident<T>;
    private readonly _subscribers: Map<object, SubscriberList<T>>;
    constructor() {
        this._subscribers = new Map<object, SubscriberList<T>>();
        this._incident = new PrivateIncident<T>(this._subscribers);
    }

    get incident(): Incident<T> { return this._incident; }

    propagate(arg: T): void {
        const errors: Error[] = [];
        for (const [, subscriberList] of this._subscribers.entries()) {
            for (const subscriber of subscriberList) {
                const error = subscriber.call(arg);
                if (error) { errors.push(error); }
            }
        }
        switch(errors.length) {
            case 0: return;
            case 1: throw errors[0];
            default:
                throw new AggregateError(errors);
        }
    }
}