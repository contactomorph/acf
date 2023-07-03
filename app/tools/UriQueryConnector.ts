

export class UriQueryConnector {
    private readonly _windowGenerator: () => Window | null | undefined;
    private _window: Window | null | undefined;
    constructor(windowGenerator: () => Window | null | undefined) {
        this._windowGenerator = windowGenerator;
        this._window = null;
    }
    
    public injectInUri(...parameters: [string, string | null | undefined][]): void {
        this._window ??= this._windowGenerator();
        if (this._window && this._window.location) {
            const searchParams = new URLSearchParams(this._window.location.search);
            for (const [name, value] of parameters) {
                if (!value) {
                    searchParams.delete(name);
                } else {
                    searchParams.set(name, encodeURIComponent(value));
                }
            }
            let path = this._window.location.origin;
            if (0 < searchParams.size) {
                path += `?${searchParams.toString()}`;
            }
            this._window.history.pushState({ path }, '', path);
        }
    }

    public extractFromUri(...setters: [string, (value: string | undefined) => void][]): void {
        this._window ??= this._windowGenerator();
        if (this._window && this._window.location) {
            const searchParams = new URLSearchParams(this._window.location.search);
            for (const [name, setter] of setters) {
                const value = searchParams.get(name);
                if (value === null) {
                    setter(undefined);
                } else {
                    setter(decodeURIComponent(value));
                }
            }
        }
    }
}