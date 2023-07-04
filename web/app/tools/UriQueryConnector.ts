

export class UriQueryConnector {
    private readonly _windowGenerator: () => Window | null | undefined;
    constructor(windowGenerator: () => Window | null | undefined) {
        this._windowGenerator = windowGenerator;
    }
    
    public injectInUri(...parameters: [string, string | null | undefined][]): void {
        const window = this._windowGenerator();
        if (window && window.location) {
            const searchParams = new URLSearchParams(window.location.search);
            for (const [name, value] of parameters) {
                if (!value) {
                    searchParams.delete(name);
                } else {
                    searchParams.set(name, encodeURIComponent(value));
                }
            }
            let path = window.location.origin;
            if (0 < searchParams.size) {
                path += `?${searchParams.toString()}`;
            }
            window.history.pushState({ path }, '', path);
        }
    }

    public extractFromUri(...setters: [string, (value: string | undefined) => void][]): void {
        const window = this._windowGenerator();
        if (window && window.location) {
            const searchParams = new URLSearchParams(window.location.search);
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