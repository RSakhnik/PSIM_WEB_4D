// Только минимальный skeleton-класс + немедленная регистрация.
// Никакой бизнес-логики здесь нет — только то, что нужно host'у знать о существовании расширения.
export class Web3DExtension {
    static readonly EXTENSION_NAME = "ProductName321.Web3DExtension";

    private _impl: any = null;
    private _viewerRef: any;

    // Флаги на случай, если хост дёрнет эти методы ДО того, как _impl создан
    private _pendingToolbarCreated = false;
    private _pendingToolbarDestroyed = false;

    constructor(viewer: any) {
        this._viewerRef = viewer;
    }

    getName(): string {
        return Web3DExtension.EXTENSION_NAME;
    }

    async load(): Promise<boolean> {
        const { Web3DExtensionImpl } = await import('./4d');
        this._impl = new Web3DExtensionImpl(this._viewerRef);
        const result = await this._impl.load();

        // Проигрываем события, накопленные, пока impl ещё не был готов
        if (this._pendingToolbarCreated) {
            this._pendingToolbarCreated = false;
            this._impl.onToolbarCreated();
        }
        if (this._pendingToolbarDestroyed) {
            this._pendingToolbarDestroyed = false;
            this._impl.onToolbarDestroyed();
        }

        return result;
    }

    unload(): Promise<boolean> {
        return this._impl ? this._impl.unload() : Promise.resolve(true);
    }

    onToolbarCreated(): void {
        if (this._impl) {
            this._impl.onToolbarCreated();
        } else {
            console.warn('[Web3DExtension] onToolbarCreated пришёл раньше готовности impl — откладываем');
            this._pendingToolbarCreated = true;
        }
    }

    onToolbarDestroyed(): void {
        if (this._impl) {
            this._impl.onToolbarDestroyed();
        } else {
            this._pendingToolbarDestroyed = true;
        }
    }
}

let registered = false;
let registerAttempts = 0;
const MAX_REGISTER_ATTEMPTS = 200;

function tryRegister() {
    if (registered) return;
    if ((window as any).PilotWeb3D?.theExtensionManager) {
        try {
            (window as any).PilotWeb3D.theExtensionManager.registerExtensionType(
                Web3DExtension.EXTENSION_NAME,
                Web3DExtension as any
            );
            registered = true;
            console.log("[Web3DExtension] ✅ Registered successfully (lightweight skeleton)");
        } catch (e) {
            console.error("[Web3DExtension] ❌ Registration error:", e);
            scheduleRetry();
        }
    } else {
        scheduleRetry();
    }
}

function scheduleRetry() {
    registerAttempts++;
    if (registerAttempts > MAX_REGISTER_ATTEMPTS) return;
    requestAnimationFrame(tryRegister);
}

tryRegister();