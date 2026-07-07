/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-empty */
/* eslint-disable */

import {Timeline} from './timeline';
const TOOLBAR_SELECTORS = [
    "app-vertical-tab-panel[data-testid='right-vertical-tab-panel'] .vertical-tab-container"
];

const BUTTON_ID = 'web3d-ext-toolbar-btn';
const PANEL_ID = 'web3d-ext-bottom-panel';

export class Web3DExtensionImpl {
    static readonly EXTENSION_NAME = "ProductName321.Web3DExtension";
    private animationMs: number= 200;
    private _viewer: PilotWeb3D.GuiViewer3D;
    private _button: HTMLButtonElement | null = null;
    private _panel: HTMLElement | null = null;
    private _toolbar: HTMLElement | null = null;
    private _globalClickHandlerBound: ((e: MouseEvent) => void) | null = null;
    private _isInstalled = false;
    private choosenDate: any = null;
    private workSchedule: WorkSchedule[]=[];
    private workSchedule1: WorkSchedule[]=[];
    private workSchedule2: WorkSchedule[]=[];
    private sortedScheduleItems: WorkSchedule[]=[];
    private prevSortedSchedule: WorkSchedule[]=[];
    private ElementIds : PartIds[]=[];
    private ElementIds1 : PartIds[]=[];
    private ElementIds2 : PartIds[]=[];
    private modelTree: ModelTree[]=[];
    private SortedElementIds: PartIds[]=[];
    private YSortedElementIds: PartIds[]=[];
    private GSortedElementIds: PartIds[]=[];
    private prevSorted: PartIds[]=[];
    private status: boolean=false;
    private SortedElementIdsYel: PartIds[]=[];
    private prevSortedYel: PartIds[]=[];
    private viewStart: Date | null = null;
    private viewEnd: Date | null   = null;
    private Interval1 :undefined;
    private Interval2 :undefined;
    private Interval3 :undefined;
    private Interval4 :undefined;
    private Interval5 :undefined;
    constructor(viewer: PilotWeb3D.GuiViewer3D) {
        this._viewer = viewer;
    }
    private modelAParts: string[]=[];
    private _loadInterval: number | null = null;
private _checkInterval: number | null = null;
private _resizeInterval: number | null = null;
private _dataInterval: number | null = null;
private _selectedWorkId: string | null = null;
private _loadRetryCount = 0;
private readonly MAX_LOAD_RETRIES = 5;
    getName(): string {
        return Web3DExtensionImpl.EXTENSION_NAME;
    }

    async load(): Promise<boolean> {
    try {
        (window as any).__viewer = this._viewer;
        console.log('Web3D extension: loading started, попытка', this._loadRetryCount + 1);

        await this.db_connect();
        this._initPilotApi();

        const model = (this._viewer as any)?.model;
        if (model && model.eventDispatcher) {
            model.eventDispatcher.addEventListener('selectionChanged', (e: any) => {
                console.log('selectionChanged event:', e);
                if (e && e.selectedIds) {
                    console.log('Выделенные элементы (формат):', e.selectedIds);
                }
            });
        }

        this._loadRetryCount = 0; 
        return true;

    } catch (error) {
        console.error('Web3D extension loading failed:', error);

        if (this._loadRetryCount < this.MAX_LOAD_RETRIES) {
            this._loadRetryCount++;
            console.warn(`[load] Повтор регистрации через 2 сек (попытка ${this._loadRetryCount}/${this.MAX_LOAD_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return this.load(); // рекурсивный повтор
        }

        console.error('[load] Превышено число попыток регистрации расширения — сдаёмся');
        return false;
    }
}

    unload(): Promise<boolean> {
        this.destroy();
        return Promise.resolve(true);
    }

    onToolbarCreated(): void {
    console.log('Web3D extension: toolbar created');
    if (this.ElementIds.length > 0 && !this._isInstalled) {
        this.waitForUIAndInstall();
    } else {
        if (this._checkInterval) clearInterval(this._checkInterval);
        this._checkInterval = window.setInterval(() => this.checkForInstalling1(), 50);
    }
}
  

    private checkForInstalling(){
        const model = this._viewer.model;
        if (!model){
            this.destroy();
            return;
        }
        this.connectDataWithModel();
        if (this.ElementIds.length>0&&!this._isInstalled){
            this.waitForUIAndInstall();
        }
    }

    private prevModelID: String|undefined;
    private curModelID: String|undefined;
    private checkForInstalling1() {
        const model = (this._viewer as any)?.model;
        if (!model) {
            this.destroy();
            return;
        }

        const visible = model.getVisibleElements() || [];
        const hasVisible = visible.length > 0;

        if (!hasVisible) {
            if (this._button) this._button.style.display = 'none';
            return;
        }

        if (this._button) this._button.style.display = 'inline-flex';

        let res = false;
        const DBIds: string[] = [];
        const part = visible[0];
        if (!part || !this.ElementIds) return;

        const PartId = part.modelPartId;
        this.ElementIds.forEach(id => DBIds.push(id.ModelPartID.toLowerCase()));

        DBIds.forEach(id => {
            if (id.toLowerCase() === PartId) res = true;
        });

        if (res && !this._isInstalled) {
    if (this._checkInterval) clearInterval(this._checkInterval);
    this.waitForUIAndInstall();
    this.readIds();
    if (this.FullSchedule) this.connectDataWithModel();
}
    }

    async waitForUIAndInstall(): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (this.tryInstallToolbarButton()) {
                    clearInterval(checkInterval);
                    console.log('Web3D extension: button installed successfully on toolbar');
                    resolve();
                }
            }, 200);
            setTimeout(() => {
                clearInterval(checkInterval);
                if (!this._isInstalled) {
                    console.warn('Web3D extension: toolbar not found within timeout');
                }
                resolve();
            }, 10000);
        });
    }

    private tryInstallToolbarButton(): boolean {
        if (this._isInstalled) return true;

        this._toolbar = this.findToolbar();
        if (!this._toolbar) return false;

        console.log('Web3D extension: toolbar found', this._toolbar);

        this.injectStyles();
        this.createButton();
        this.createPanel();

        setInterval(()=>{ this.updatePabelSize() }, 10);
        this.attachToolbarListeners();

        this._isInstalled = true;
        return true;
    }

    private updatePabelSize(){
        let leftBannner: Element| null = null;
        leftBannner = document.querySelector('.tab-panel');
        if(leftBannner){
            const rect = leftBannner?.getBoundingClientRect();
            this.leftBorder = rect.width;
            this.panelWidth = document.documentElement.clientWidth-rect?.width;
        }
        if(this._panel){
            this._panel.style.left = `${this.leftBorder}px`;
            this._panel.style.width = `${this.panelWidth}px`;
            const canvas = document.querySelector('#web3d-timeline-canvas') as HTMLCanvasElement;
            if(canvas){
                canvas.style.width=`${this.panelWidth}px`;
            }
        }
    }

    private findToolbar(): HTMLElement | null {
        for (const sel of TOOLBAR_SELECTORS) {
            const el = document.querySelector(sel) as HTMLElement | null;
            if (el) {
                console.log('Web3D extension: found toolbar with selector:', sel);
                return el;
            }
        }
        return null;
    }
    private findRightPanelTabGroup(): { labels: HTMLElement; bodyWrapper: HTMLElement } | null {
    const rightPanel = document.querySelector("app-bim-right-panel[data-testid='right-panel']") as HTMLElement | null;
    if (!rightPanel) return null;

    const tabGroup = rightPanel.querySelector("mat-tab-group") as HTMLElement | null;
    if (!tabGroup) return null;

    const labels = tabGroup.querySelector(".mat-mdc-tab-labels") as HTMLElement | null;
    const bodyWrapper = tabGroup.querySelector(".mat-mdc-tab-body-wrapper") as HTMLElement | null;
    if (!labels || !bodyWrapper) return null;

    return { labels, bodyWrapper };
}
    private createButton(): void {
        if (!this._toolbar) return;
        if (document.getElementById(BUTTON_ID)) {
            this._button = document.getElementById(BUTTON_ID) as HTMLButtonElement;
            return;
        }

        const btn = document.createElement('button');
        btn.id = BUTTON_ID;
        btn.className = 'vertical-tab-item web3d-ext-vertical-tab';
        btn.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    width: 45px;
    height: 45px;
    padding: 8px;
    box-sizing: border-box;
    cursor: pointer;
    border: none;
    outline: none;
   
`;
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('role', 'button');
        btn.setAttribute('data-tooltip', 'График работ');
        btn.tabIndex = 0;

        btn.innerHTML = `
    <mat-icon role="img" class="mat-icon notranslate mat-mdc-tooltip-trigger mat-icon-no-color" style="width:16px; height:16px; font-size:16px; display:inline-flex;" aria-hidden="true">
    <svg width="100%" height="100%" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <text x="12" y="16" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="700" fill="#606262">4D</text>
    </svg>
</mat-icon>
`;

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const expanded = btn.getAttribute('aria-expanded') === 'true';
            if (expanded) {
                this.closePanel();
            } else {
                this.openPanel();
            }
        });

        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                btn.click();
            }
        });

        let tooltipTimeout: number;
        btn.addEventListener('mouseenter', () => {
            tooltipTimeout = window.setTimeout(() => {
                btn.setAttribute('data-tooltip-visible', 'true');
            }, 500);
        });
        btn.addEventListener('mouseleave', () => {
            clearTimeout(tooltipTimeout);
            btn.removeAttribute('data-tooltip-visible');
        });

        this._toolbar.appendChild(btn);
        this._button = btn;
        console.log('Web3D extension: button created with proper toolbar structure');
    }

    private panelWidth:number = document.documentElement.clientWidth;
    private leftBorder: number=0;
    



    private createPanel(): void {
        if (document.getElementById(PANEL_ID)) {
            this._panel = document.getElementById(PANEL_ID) as HTMLElement;
            return;
        }

        const panel = document.createElement('div');
        panel.id = PANEL_ID;
        panel.className = 'web3d-ext-bottom-panel hidden';
        panel.setAttribute('role', 'region');
        panel.setAttribute('aria-hidden', 'true');

        panel.innerHTML = `
        <div class="web3d-ext-resize-handle" style="height:8px; cursor:ns-resize; background:transparent;"></div>
            <div class="web3d-ext-panel-header" width="15">
                <div class="web3d-ext-panel-title">График работ</div>
                <div class="time-window"></div>
                <button class="web3d-ext-close" aria-label="Close">×</button>
            </div>
            <div class="web3d-ext-panel-body">
                <div class="web3d-timeline-container" style="padding:1px;">
                    <canvas style="border: 1px solid black" width="1500" height="57" id="web3d-timeline-canvas"></canvas>
                </div>
                <div class="web3d-timeline-info" style="padding:2px; display:flex; gap:1px;"></div>
            </div>
        `;
const headerDiv = panel.querySelector('.web3d-ext-panel-header') as HTMLElement;
const filter3dContainer = document.createElement('div');
filter3dContainer.className = 'web3d-ext-only3d-container';

const label3d = document.createElement('label');
label3d.htmlFor = 'web3d-only3d-checkbox';
label3d.style.cssText = 'display: flex; align-items: center; gap: 6px; cursor: pointer; margin: 0;';

const cb3d = document.createElement('input');
cb3d.type = 'checkbox';
cb3d.id = 'web3d-only3d-checkbox';
cb3d.checked = this.only3dFilter;
cb3d.style.margin = '0';

label3d.appendChild(cb3d);
label3d.appendChild(document.createTextNode('Только с 3D'));   
filter3dContainer.appendChild(label3d);

cb3d.addEventListener('change', (e) => {
    this.only3dFilter = cb3d.checked;
    if (this._panel) {
        this.renderScheduleItems(this._panel);
    }
});

const filterCriticalContainer = document.createElement('div');
filterCriticalContainer.className = 'web3d-ext-only3d-container';

const labelCritical = document.createElement('label');
labelCritical.htmlFor = 'web3d-critical-path-checkbox';
labelCritical.style.cssText = 'display: flex; align-items: center; gap: 6px; cursor: pointer; margin: 0;';

const cbCritical = document.createElement('input');
cbCritical.type = 'checkbox';
cbCritical.id = 'web3d-critical-path-checkbox';
cbCritical.checked = this.onlyCriticalPathFilter;
cbCritical.style.margin = '0';

labelCritical.appendChild(cbCritical);
labelCritical.appendChild(document.createTextNode('Критический путь'));
filterCriticalContainer.appendChild(labelCritical);

cbCritical.addEventListener('change', () => {
    this.onlyCriticalPathFilter = cbCritical.checked;
    if (this._panel) {
        this.renderScheduleItems(this._panel);
    }
});

// Вставляем оба чекбокса перед кнопкой закрытия
const closeBtn = panel.querySelector('.web3d-ext-close');
if (closeBtn) {
    headerDiv.insertBefore(filter3dContainer, closeBtn);
    headerDiv.insertBefore(filterCriticalContainer, closeBtn);
} else {
    headerDiv.appendChild(filter3dContainer);
    headerDiv.appendChild(filterCriticalContainer);
}
        panel.querySelector('.web3d-ext-close')!.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closePanel();
        });
        panel.querySelector('#diag-btn')?.addEventListener('click', (e)=>{
            this.readIds();
        });

        this.initResize(panel);
        document.body.appendChild(panel);
        panel.addEventListener("transitionend", () => this.initCanvas(panel));

        this._panel = panel;
        if (this._panel) {
            setTimeout(() => this.initCanvas(this._panel!), 30);
        }
        

        try{
            this.prevSortedSchedule=this.itemsToRender;
            this.renderScheduleItems(panel);

            setInterval(()=>{
                if(this.status){
                    if(JSON.stringify(this.prevSortedSchedule)!==JSON.stringify(this.itemsToRender)){
                        this.renderScheduleItems(panel);
                    }
                    this.prevSortedSchedule=this.itemsToRender;
                }
            }, 500);

            setInterval(()=>{
                this.renderTime(panel);
            }, 200);

        }catch(error){
            console.log('рендер расписания не сработал');
        }
    }

    private _canvasInitialized = false;
    private _animationHandle: number | null = null;
    private _lastResizeTs = 0;
    private lastChoosenDate: Date | null = null;
    private lastScheduleSortDate: Date | null = null;
    private lastApplyColorsDate: Date | null = null;
    private lastClearColorsDate: Date | null = null;

    private _dateChangeDebounceTimer: number | null = null;
    private onDateChanged(date: Date) {
    if (this._dateChangeDebounceTimer !== null) {
        clearTimeout(this._dateChangeDebounceTimer);
    }

    this._dateChangeDebounceTimer = window.setTimeout(() => {
        this._dateChangeDebounceTimer = null;

        this.ScheduleSort();

        if (!this.status) return;

        requestAnimationFrame(() => {
            this.renderScheduleItems(this._panel!);
        });

        requestAnimationFrame(() => {
            this.applyColorsAsync();
        });

    }, 80);
}

    private needsRepaint = false;
    private loadingTimeout: any;

    private initCanvas(panel: HTMLElement): void {
        if (this._canvasInitialized) return;

        const canvas = panel.querySelector('#web3d-timeline-canvas') as HTMLCanvasElement;
        if (!canvas) {
            console.error('Canvas element not found!');
            return;
        }

        setTimeout(() => {
            try {
                const timeline = new Timeline(this.viewStart!, this.viewEnd!, canvas);
                requestAnimationFrame(() => {
                    timeline.update();
                });

                timeline.onChange((date) => {
    this.choosenDate = date;

    if (this._panel) {
        this.renderTime(this._panel);
    }

    this.onDateChanged(date);
});

                const model = (this._viewer as any)?.model;
                model.eventDispatcher.addEventListener('modelPartLoadingProgress', () => {
                    clearTimeout(this.loadingTimeout);
                    this.loadingTimeout = setTimeout(() => {
                        this.leafToPartMapCache = null;
                        if(this.status) this.applyColorsAsync();
                    }, 200);
                });
                model.eventDispatcher.addEventListener('modelPartUnloaded', () => {});

            } catch (error) {}

            this._canvasInitialized = true;
        }, 500);
    }

    private isModelFullyLoaded(model: any): boolean {
        const parts = model._modelPartsHolder?._modelParts;
        if (!parts) return false;
        for (const part of parts.values()) {
            if (!part.isLoaded) return false;
        }
        return true;
    }



    private sortState: {
    field: 'WorkID' | 'WBSdesc' | 'StartDate' | 'FinishDate' | 'FactStartDate' | 'FactFinishDate' | null,
    direction: 'asc' | 'desc'
} = { field: null, direction: 'asc' };


private columnFilters: {
    WorkID: Set<string> | null;
    WBSdesc: Set<string> | null;
} = {
    WorkID: null,
    WBSdesc: null
};
private activeFilterColumn: 'WorkID' | 'WBSdesc' | null = null;
private filterPopupElement: HTMLElement | null = null;
private only3dFilter: boolean = false;   
private _outsideClickHandler: ((e: MouseEvent) => void) | null = null;


private getUniqueValuesForColumn(column: 'WorkID' | 'WBSdesc'): string[] {
    const valuesSet = new Set<string>();
    for (const item of this.itemsToRender) {
        let value = column === 'WorkID' ? item.WorkID : item.WBSdesc;
        if (value) valuesSet.add(String(value));
    }
    return Array.from(valuesSet).sort((a, b) => a.localeCompare(b, 'ru'));
}

private formatDateToString(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}


private getFilteredItems(): WorkSchedule[] {
    let items = [...this.itemsToRender];

    if (this.columnFilters.WorkID && this.columnFilters.WorkID.size > 0) {
        items = items.filter(item => this.columnFilters.WorkID!.has(item.WorkID));
    }
    if (this.columnFilters.WBSdesc && this.columnFilters.WBSdesc.size > 0) {
        items = items.filter(item => this.columnFilters.WBSdesc!.has(item.WBSdesc));
    }
    if (this.only3dFilter) {
        items = items.filter(item => this.ElementIds.some(elem => elem.WorkID === item.WorkID));
    }
    if (this.onlyCriticalPathFilter) {
        items = items.filter(item => item.CriticalPath === true);
    }
    return items;
}


private showColumnFilter(column: 'WorkID' | 'WBSdesc', anchorElement: HTMLElement) {
    this.hideFilterPopup();

    const uniqueValues = this.getUniqueValuesForColumn(column);
    const currentFilter = this.columnFilters[column] || new Set<string>();

    const popup = document.createElement('div');
    popup.className = 'excel-filter-popup';
    Object.assign(popup.style, {
        position: 'fixed',
        backgroundColor: '#fff',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        padding: '8px',
        zIndex: '10001',
        minWidth: '220px',
        maxWidth: '300px',
        display: 'flex',
        flexDirection: 'column'
    });

    const header = document.createElement('div');
    header.style.cssText = 'display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; padding-bottom:4px; border-bottom:1px solid #eee; gap:8px;';

    const titleSpan = document.createElement('span');
    titleSpan.style.fontWeight = 'bold';
    titleSpan.textContent = 'Фильтр';
    header.appendChild(titleSpan);

    const searchWrapper = document.createElement('div');
    searchWrapper.style.cssText = 'position:relative; flex:1; max-width:150px;';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Поиск...';
    searchInput.style.cssText = 'width:100%; padding:4px 20px 4px 6px; font-size:11px; border:1px solid #ccc; border-radius:3px; outline:none; box-sizing:border-box;';

    const clearSearchBtn = document.createElement('button');
    clearSearchBtn.textContent = '✖';
    clearSearchBtn.style.cssText = 'position:absolute; right:4px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; font-size:10px; color:#999; padding:0; width:14px; height:14px; display:flex; align-items:center; justify-content:center;';
    clearSearchBtn.title = 'Очистить поиск';

    searchWrapper.appendChild(searchInput);
    searchWrapper.appendChild(clearSearchBtn);
    header.appendChild(searchWrapper);

    const closePopupBtn = document.createElement('button');
    closePopupBtn.textContent = '✖';
    closePopupBtn.style.cssText = 'background:none; border:none; cursor:pointer; font-size:14px; color:#666; padding:0 4px;';
    closePopupBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.hideFilterPopup();
    });
    header.appendChild(closePopupBtn);

    popup.appendChild(header);

    const listContainer = document.createElement('div');
    listContainer.style.cssText = 'max-height:200px; overflow-y:auto; margin-bottom:8px;';
    const checkboxes: HTMLInputElement[] = [];

    const renderCheckboxes = (searchText: string) => {
        while (listContainer.firstChild) listContainer.removeChild(listContainer.firstChild);
        checkboxes.length = 0;

        const lowerSearch = searchText.toLowerCase();
        uniqueValues.forEach(value => {
            if (lowerSearch && !value.toLowerCase().includes(lowerSearch)) return;

            const label = document.createElement('label');
            label.style.cssText = 'display:flex; align-items:center; margin-bottom:4px; font-size:12px; cursor:pointer;';
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.value = value;
            cb.checked = currentFilter.has(value);
            cb.style.marginRight = '6px';
            label.appendChild(cb);
            label.appendChild(document.createTextNode(value));
            listContainer.appendChild(label);
            checkboxes.push(cb);
        });
    };

    renderCheckboxes('');

    searchInput.addEventListener('input', (e) => {
        const searchText = (e.target as HTMLInputElement).value;
        renderCheckboxes(searchText);
    });

    clearSearchBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        searchInput.value = '';
        renderCheckboxes('');
    });

    popup.appendChild(listContainer);

    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex; gap:8px; justify-content:flex-end; border-top:1px solid #eee; padding-top:8px;';

    const selectAllBtn = document.createElement('button');
    selectAllBtn.textContent = 'Выбрать все';
    selectAllBtn.style.cssText = 'padding:4px 8px; font-size:11px; cursor:pointer;';
    selectAllBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        checkboxes.forEach(cb => cb.checked = true);
    });

    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Сбросить';
    clearBtn.style.cssText = 'padding:4px 8px; font-size:11px; cursor:pointer;';
    clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        checkboxes.forEach(cb => cb.checked = false);
    });

    const applyBtn = document.createElement('button');
    applyBtn.textContent = 'Применить';
    applyBtn.style.cssText = 'padding:4px 8px; font-size:11px; background-color:#0066cc; color:#fff; border:none; border-radius:3px; cursor:pointer;';
    applyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const selected = new Set<string>();
        checkboxes.forEach(cb => { if (cb.checked) selected.add(cb.value); });
        this.applyColumnFilter(column, selected);
        this.hideFilterPopup();
    });

    actions.appendChild(selectAllBtn);
    actions.appendChild(clearBtn);
    actions.appendChild(applyBtn);
    popup.appendChild(actions);

    popup.style.visibility = 'hidden';
    document.body.appendChild(popup);
    const actualHeight = popup.offsetHeight;
    const actualWidth = popup.offsetWidth;

    const rect = anchorElement.getBoundingClientRect();
    let top = rect.bottom + window.scrollY + 4;
    let left = rect.left + window.scrollX;

    if (top + actualHeight > window.scrollY + window.innerHeight - 10) {
        top = rect.top + window.scrollY - actualHeight - 4;
    }
    if (left + actualWidth > window.innerWidth - 10) {
        left = window.innerWidth - actualWidth - 10;
    }
    if (left < 10) left = 10;

    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;
    popup.style.visibility = 'visible';

    if (!this._outsideClickHandler) {
        this._outsideClickHandler = (e: MouseEvent) => {
            if (this.filterPopupElement && !this.filterPopupElement.contains(e.target as Node)) {
                this.hideFilterPopup();
            }
        };
        document.addEventListener('click', this._outsideClickHandler);
    }

    this.filterPopupElement = popup;
}

private hideFilterPopup() {
    if (this.filterPopupElement) {
        this.filterPopupElement.remove();
        this.filterPopupElement = null;
    }
    this.activeFilterColumn = null;
    if (this._outsideClickHandler) {
        document.removeEventListener('click', this._outsideClickHandler);
        this._outsideClickHandler = null;
    }
}

private applyColumnFilter(column: 'WorkID' | 'WBSdesc', selectedValues: Set<string>) {
    const allValues = this.getUniqueValuesForColumn(column);
    if (selectedValues.size === 0 || selectedValues.size === allValues.length) {
        // Сбросить фильтр
        this.columnFilters[column] = null;
    } else {
        this.columnFilters[column] = selectedValues;
    }
    if (this._panel) {
        this.renderScheduleItems(this._panel);
    }
}





    private itemsToRender: WorkSchedule[]=[];
    private ScheduleSort(){
        try{
            this.sortedScheduleItems = [];
            this.itemsToRender = [];
            this.workSchedule.forEach(item=>{
                const startDateStr = String(item.StartDate);
                const startDate =new Date(startDateStr);
                const endDateStr = String(item.FinishDate);
                const endDate =new Date(endDateStr);
                if (startDate.getTime()< this.choosenDate.getTime()){
                    this.sortedScheduleItems.push(item);
                    if (this.choosenDate.getTime()<endDate.getTime()){
                        this.itemsToRender.push(item);
                    }
                }
            });

            this.SortedElementIds = [];
            this.YSortedElementIds=[];
            this.GSortedElementIds=[];
            this.ElementIds.forEach(id=>{
                if(this.workSchedule.some(item=>((new Date(String(item.FinishDate))).getTime()<this.choosenDate.getTime())&&((new Date(String(item.StartDate))).getTime()<this.choosenDate.getTime())&&((item.WorkID)==(id.WorkID)))){
                    this.GSortedElementIds.push(id);
                    this.SortedElementIds.push(id);
                }
                if(this.workSchedule.some(item=>((new Date(String(item.FinishDate))).getTime()>this.choosenDate.getTime())&&((new Date(String(item.StartDate))).getTime()<this.choosenDate.getTime())&&((item.WorkID)==(id.WorkID)))){
                    this.YSortedElementIds.push(id);
                    this.SortedElementIds.push(id);
                }
            });

            this.sortedScheduleItems.sort((a,b)=>{
                const dA = a.StartDate? new Date(String(a.StartDate)).getTime() : 0;
                const dB = b.StartDate? new Date(String(b.StartDate)).getTime() : 0;
                return dB-dA;
            });
            this.itemsToRender.sort((a,b)=>{
                const dA = a.StartDate? new Date(String(a.StartDate)).getTime() : 0;
                const dB = b.StartDate? new Date(String(b.StartDate)).getTime() : 0;
                return dB-dA;
            });
        }catch(error){}
    }

    private ChoosenOne: string[] | undefined;

    private renderTime(panel:HTMLElement){
        if(!this.choosenDate) return;
        const window=panel.querySelector('.time-window') as HTMLElement;
        window.innerHTML = '';
        const info=document.createElement('div');
        info.className='time-info';
        info.textContent=`Выбранная дата:`;
        window.appendChild(info);
        const date=document.createElement('div');
        const year = String(this.choosenDate.getFullYear());
        const month = (this.choosenDate.getMonth());
        const month_str=(month+1<10)? `0${month+1}` : `${month+1}`;
        const day = (this.choosenDate.getDate());
        const day_str=(day<10)? `0${day}` : `${day}`;
        date.className='time-info';
        date.textContent=`${day_str}.${month_str}.${year}`;
        window.appendChild(date);
    }

    private renderScheduleItems(panel: HTMLElement) {
    const scheduleBanner = panel.querySelector('.web3d-timeline-info') as HTMLElement;
    scheduleBanner.innerHTML = '';

    const list = document.createElement('div');
    list.className = 'schedule-list';

    const header = document.createElement('div');
    header.className = 'table-header';

    const columns: Array<{ title: string; field: 'WorkID' | 'WBSdesc' | 'StartDate' | 'FactStartDate' | 'FinishDate' | 'FactFinishDate'; filterable: boolean }> = [
    { title: 'ID', field: 'WorkID', filterable: true },
    { title: 'Наименование работ', field: 'WBSdesc', filterable: true },
    { title: 'Начало', field: 'StartDate', filterable: false },
    { title: 'Факт начала', field: 'FactStartDate', filterable: false },
    { title: 'Окончание', field: 'FinishDate', filterable: false },
    { title: 'Факт окончания', field: 'FactFinishDate', filterable: false }
];

    const createHeaderCell = (col: typeof columns[0]) => {
        const container = document.createElement('div');
        container.style.cssText = 'display:flex; align-items:center; justify-content:space-between; cursor:pointer; padding:4px;';

        const titleSpan = document.createElement('span');
titleSpan.style.flex = '1';
titleSpan.style.display = 'flex';
titleSpan.style.alignItems = 'center';
titleSpan.style.justifyContent = 'center';  
titleSpan.style.gap = '6px';                
titleSpan.style.cursor = 'pointer';
titleSpan.addEventListener('click', (e) => {
    e.stopPropagation();
    this.handleSort(col.field);
});

const titleText = document.createTextNode(col.title);
titleSpan.appendChild(titleText);

if (this.sortState.field === col.field) {
    const arrow = document.createElement('span');
    arrow.textContent = this.sortState.direction === 'asc' ? '   ↓' : '   ↑';
    arrow.style.fontSize = '14px';          
    arrow.style.fontWeight = 'bold';
    arrow.style.opacity = '0.7';
    arrow.style.marginLeft = '2px';
    titleSpan.appendChild(arrow);
}
container.appendChild(titleSpan);

        if (col.filterable) {
            const filterIcon = document.createElement('span');
filterIcon.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
        <polygon points="22 3 2 3 10 13 10 21 14 18 14 13 22 3" />
    </svg>
`;
filterIcon.style.cssText = 'margin-left:6px; display:inline-flex; align-items:center; cursor:pointer; opacity:0.6;';
            const filterKey = col.field === 'WorkID' ? 'WorkID' : 'WBSdesc';
            if (this.columnFilters[filterKey] && this.columnFilters[filterKey]!.size > 0) {
                filterIcon.style.opacity = '1';
                filterIcon.style.color = '#0066cc';
                filterIcon.style.fontWeight = 'bold';
            }
            filterIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showColumnFilter(filterKey, filterIcon);
            });
            container.appendChild(filterIcon);
        }
        return container;
    };

    columns.forEach(col => header.appendChild(createHeaderCell(col)));
    scheduleBanner.appendChild(header);

    // Получаем отфильтрованные элементы
    let items = this.getFilteredItems();

    // Сортировка
    if (this.sortState.field) {
        const dir = this.sortState.direction === 'asc' ? 1 : -1;
        items.sort((a, b) => {
            let vA: any, vB: any;
            const field = this.sortState.field!;
            if (field === 'FactStartDate') {
                vA = this.getFactStartDate(a).getTime();
                vB = this.getFactStartDate(b).getTime();
            } 
            else if (field === 'FactFinishDate') {
    vA = this.getFactFinishDate(a).getTime();
    vB = this.getFactFinishDate(b).getTime();
}
else if (field.includes('Date')) {
                vA = new Date(a[field]).getTime();
                vB = new Date(b[field]).getTime();
            } else {
                vA = String(a[field]).toLowerCase();
                vB = String(b[field]).toLowerCase();
            }
            if (vA < vB) return -1 * dir;
            if (vA > vB) return 1 * dir;
            return 0;
        });
    }

   
    items.forEach(item => {
        const isInModel = this.ElementIds.some(elem => elem.WorkID === item.WorkID);
        const status = (!isInModel) ? 'finished' : 'in-progress';
        const row = document.createElement('div');
        row.className = `table-row-${status}`;
        row.addEventListener('click', (e) => {
            e.stopPropagation();
            const model = (this._viewer as any)?.model;
            if (!model) return;

            const workId = item.WorkID;

            if (this._selectedWorkId === workId) {
                if (model.clearSelection) {
                    model.clearSelection();
                }
                this._selectedWorkId = null;
                this.ChoosenOne = undefined;
                this.applyColorsAsync();

                const nav = (this._viewer as any)?._navigation;
                if (nav && this._cameraBeforeZoom) {
                    try {
                        nav.setCameraParameters(this._cameraBeforeZoom);
                    } catch (e) {
                        console.warn('[selectAndZoom] не удалось вернуть камеру:', e);
                    }
                }
                this._cameraBeforeZoom = null;

                if (this._panel) this.renderScheduleItems(this._panel); 
                return;
            }

            this._selectedWorkId = workId;
            this.selectAndZoom(item, model);
            if (this._panel) this.renderScheduleItems(this._panel); 
        });
        const id = document.createElement('div');
        id.className = 'table-item-id';
        id.textContent = item.WorkID;
        row.appendChild(id);

        const name = document.createElement('div');
        name.className = 'table-item-name';
        name.textContent = item.WBSdesc;
        row.appendChild(name);

        const dateA = new Date(item.StartDate);
        const start = document.createElement('div');
        start.className = 'table-item-start';
        start.textContent = this.formatDateToString(dateA);
        row.appendChild(start);

        const factDate = this.getFactStartDate(item);
        const fact = document.createElement('div');
        fact.className = 'table-item-fact';
        fact.textContent = this.formatDateToString(factDate);
        row.appendChild(fact);

        const dateB = new Date(item.FinishDate);
        const end = document.createElement('div');
        end.className = 'table-item-end';
        end.textContent = this.formatDateToString(dateB);
        row.appendChild(end);

        const factFinishDate = this.getFactFinishDate(item);
const factFinish = document.createElement('div');
factFinish.className = 'table-item-fact-finish';
factFinish.textContent = this.formatDateToString(factFinishDate);
row.appendChild(factFinish);

  
        if (this._selectedWorkId === item.WorkID) {
            row.style.backgroundColor = 'rgba(0,0,0,0.08)';
        }

        row.addEventListener('mouseenter', () => {
            if (this._selectedWorkId !== item.WorkID) {
                row.style.backgroundColor = 'rgba(0,0,0,0.08)';
            }
        });
        row.addEventListener('mouseleave', () => {
            if (this._selectedWorkId !== item.WorkID) {
                row.style.backgroundColor = '';
            }
        });
        list.appendChild(row);
    });

    scheduleBanner.appendChild(list);
}


private onlyCriticalPathFilter = false;
private handleSort(column: 'WorkID' | 'WBSdesc' | 'StartDate' | 'FactStartDate' | 'FinishDate'| 'FactFinishDate') {
    let field: 'WorkID' | 'WBSdesc' | 'StartDate' | 'FinishDate' | 'FactStartDate' | 'FactFinishDate'| null = null;
    switch (column) {
        case 'WorkID': field = 'WorkID'; break;
        case 'WBSdesc': field = 'WBSdesc'; break;
        case 'StartDate': field = 'StartDate'; break;
        case 'FactStartDate': field = 'FactStartDate'; break;
        case 'FinishDate': field = 'FinishDate'; break;
        case 'FactFinishDate': field = 'FactFinishDate'; break;
    }
    if (!field) return;
    if (this.sortState.field === field) {
        this.sortState.direction = this.sortState.direction === 'asc' ? 'desc' : 'asc';
    } else {
        this.sortState.field = field;
        this.sortState.direction = 'asc';
    }
    this.renderScheduleItems(this._panel!);
}

    private initResize(panel: HTMLElement): void {
        const resizeHandle = panel.querySelector('.web3d-ext-resize-handle') as HTMLElement;
        if (!resizeHandle) return;

        let isResizing = false;
        let startY = 0;
        let startHeight = 0;

        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            const deltaY = startY - e.clientY;
            const newHeight = Math.max(200, Math.min(window.innerHeight - 100, startHeight + deltaY));
            panel.style.height = `${newHeight}px`;
        };

        const handleMouseUp = () => {
            isResizing = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startY = e.clientY;
            startHeight = parseInt(document.defaultView?.getComputedStyle(panel).height || '320');
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            e.preventDefault();
        });
    }

    private openPanel(): void {
        if (!this._panel || !this._button) return;
        this.status=true;
        this._panel.classList.remove('hidden');
        this._panel.setAttribute('aria-hidden', 'false');
        this._button.setAttribute('aria-expanded', 'true');
        this.ScheduleSort();
        this.applyColorsAsync();
        this.renderScheduleItems(this._panel);
        const closeBtn = this._panel.querySelector('.web3d-ext-close') as HTMLButtonElement;
        if (closeBtn) closeBtn.focus();
    }

    private closePanel(): void {
        if (!this._panel || !this._button) return;
        this._panel.classList.add('hidden');
        this._panel.setAttribute('aria-hidden', 'true');
        this._button.setAttribute('aria-expanded', 'false');

        const model = (this._viewer as any)?.model;
        if (model) {
            this.clearLastPainted(model);
            model.invalidate?.();
        }
        this.status = false;
        this.only3dFilter = false;
const cb = document.getElementById('web3d-only3d-checkbox') as HTMLInputElement;
if (cb) cb.checked = false;
this.onlyCriticalPathFilter = false;
const cbCrit = document.getElementById('web3d-critical-path-checkbox') as HTMLInputElement;
if (cbCrit) cbCrit.checked = false;
this._selectedWorkId = null;
this.ChoosenOne = undefined;
    }

    private attachToolbarListeners(): void {
        if (!this._toolbar) return;

        const toolbarClickHandler = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target) return;
            if (this._button && this._button.contains(target)) return;
            this.closePanel();
        };

        this._toolbar.addEventListener('click', toolbarClickHandler);

        this._globalClickHandlerBound = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target) return;
            if (this._toolbar && this._toolbar.contains(target)) return;

            let node: HTMLElement | null = target;
            while (node && node !== document.body) {
                const role = node.getAttribute('role');
                const className = node.className || '';
                if (role === 'tab' ||
                    node.hasAttribute('data-tab') ||
                    /\btab\b/.test(className) ||
                    /toolbar-button/.test(className) ||
                    /ascn-control/.test(className)) {
                    this.closePanel();
                    return;
                }
                node = node.parentElement;
            }
        };

        document.addEventListener('click', this._globalClickHandlerBound);
    }

    private injectStyles(): void {
        if (document.getElementById('web3d-ext-styles')) return;
        const oldStyles = document.getElementById('web3d-ext-styles');
        if (oldStyles) {
            oldStyles.remove();
        }

        const css = `
.web3d-ext-toolbar-container {
    position: relative;
}
.web3d-ext-toolbar-container:hover::after {
    content: attr(data-tooltip);
    position: absolute;
    top: calc(100% + 10px);
    left: 50%;
    transform: translateX(-50%);
    background-color: #626161;
    color: #fff;
    padding: 4px 8px;
    border-radius: 4px;
    white-space: nowrap;
    font-size: 12px;
    font-family: "Segoe UI", sans-serif;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease;
    z-index: 1000;
}
.web3d-ext-toolbar-container[data-tooltip-visible="true"]::after {
    opacity: 1;
}
.web3d-ext-toolbar-container {
    cursor: pointer;
    transition: background-color ${this.animationMs}ms ease;
}
.web3d-ext-toolbar-container:hover {
    background-color: rgba(0,0,0,0.08);
}
.web3d-ext-toolbar-container:focus {
    outline: 2px solid rgba(0,0,0,0.2);
}
.web3d-ext-toolbar-container {
    border: none;
    background: transparent;
    padding: 0;
    margin: 0;
}
.web3d-ext-bottom-panel {
    font-family: "Segoe UI", Arial, sans-serif;
    position: fixed;
    left: ${this.leftBorder}px;
    width: ${this.panelWidth}px;
    bottom: 0;
    height: 320px;
    max-height: 90vh;
    min-height: 150px;
    background: var(--panel-background, #fff);
    box-shadow: 0 -4px 18px rgba(0,0,0,0.12);
    border-top: 0.3px solid rgba(82, 82, 82, 0.4);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    transition: transform ${this.animationMs}ms ease, opacity ${this.animationMs}ms ease;
}
.web3d-ext-bottom-panel.hidden {
    transform: translateY(100%);
    opacity: 0;
    pointer-events: none;
}
.web3d-ext-bottom-panel:not(.hidden) {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
}
.web3d-ext-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1px 1px;
    border-bottom: 1px solid rgba(0,0,0,0.04);
    flex-shrink: 0;
}
.web3d-ext-panel-title {
    font-weight: 400;
}
.web3d-ext-close {
    background: transparent;
    border: 0;
    font-size: 14px;
    line-height: 1;
    cursor: pointer;
    padding: 6px 8px;
}
.web3d-ext-panel-body {
    width: 100%;
    flex: 1;
    min-height: 0;          
    display: flex;
    flex-direction: column;
    overflow: hidden;
}
.web3d-timeline-container { flex-shrink: 0; padding: 0px; position: relative;}
.web3d-timeline-info {
    width: 100% !important;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding-top: 0;
}
.schedule-list {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
}
.table-header {
    position: sticky;
    top: 0;
    z-index: 10;
    display: grid;
    grid-template-columns: 2fr 3fr 1fr 1fr 1fr 1fr;
    padding: 5px 0;
    width: 100%;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #555;
    background: #f6f7f9;
    border-bottom: 2px solid #dcdfe3;
    border-top: 2px solid #dcdfe3;
}
.table-row-finished,
.table-row-in-progress {
    display: grid;
    grid-template-columns: 2fr 3fr 1fr 1fr 1fr 1fr;
    padding: 3px 0;
    width: 100%;
    text-align: center;
    font-size: 14px;
    border-left: 1px solid #e6e8eb;
    border-right: 1px solid #e6e8eb;
    border-bottom: 1px solid #e6e8eb;
}
.table-row-in-progress {
    font-weight: 600;
    background: #fff8e6;
}
.table-row-finished {
    color: #6b7280;
    font-style: bold;
}
.table-row-finished:hover,
.table-row-in-progress:hover {
    background: #f3f4f6;
    transition: background 0.15s ease;
}
.table-item-name {
    text-align: left;
    padding-left: 8px;
}
.table-header > div {
    text-align: center;
    padding: 4px;
    border-right: 2px solid #ccc;
}
.table-header > div:first-child {
    border-left: 2px solid #ccc;
}
.table-row-finished:hover,
.table-row-in-progress:hover {
    background: rgba(255,255,255,0.08);
    cursor: pointer;
}
.time-window {
    font-family: "Segoe UI", Arial, sans-serif;
    display: grid;
    grid-template-columns: 3fr 1fr;
    width: 400px;
    margin: 2px auto;
    padding: 0;
    text-align: center;
    font-size: 14px;
    background: transparent;
    border: none;
}
.time-info {
    border: 2px solid #e6e8eb;
    font-size: 14px;
    font-weight: 550;
    letter-spacing: 0.04em;
    
    color: #2b2b2b;
    background: #f6f7f9;
    padding: 1px 0;
    text-align: center;
    border-radius: 0;
    box-shadow: none;
    display: flex;
    align-items: center;
    justify-content: center;
}
.filter-popup {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;

    background: #ffffff;
    color: #000000;

    border-bottom: 1px solid #dcdfe3;
    box-shadow: 0 2px 6px rgba(0,0,0,0.1);

    z-index: 20;
    padding: 10px 12px;

    font-family: "Segoe UI", sans-serif;
    font-size: 11px;

    max-height: 140px;
    overflow-y: auto;
}


.filter-item:hover {
    background: #eef1f5;
    border-color: #cfd6dd;
}
.filter-btn {
    margin-left: 10px;
    cursor: pointer;
}
    .filter-popup {
    background: #ffffff;
    border: 1px solid #dcdfe3;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    padding: 10px;
    font-family: "Segoe UI", sans-serif;
    font-size: 11px;
}

.filter-title {
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid #e6e8eb;
    font-size: 13px;
}

.filter-special {
    background: #e8f0fe;
    border: 1px solid #0066cc;
    border-radius: 6px;
    padding: 6px 10px;
    margin-bottom: 10px;
}

.filter-special-item {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 11px;
}

.filter-special-item input {
    width: 14px;
    height: 14px;
    cursor: pointer;
}

.filter-actions {
    display: flex;
    gap: 8px;
    margin-bottom: 10px;
}

.filter-actions button {
    flex: 1;
    padding: 4px 8px;
    font-size: 10px;
    cursor: pointer;
    background: #f0f2f5;
    border: 1px solid #dcdfe3;
    border-radius: 4px;
}

.filter-actions button:hover {
    background: #e4e7eb;
}

.filter-columns {
    display: flex;
    flex-direction: row;
    gap: 15px;
    overflow-y: auto;
    flex: 1;
    padding-right: 6px;
    margin-bottom: 10px;
    max-height: 280px;
}

.filter-column {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 160px;
}

.filter-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 5px;
    border-radius: 3px;
    background: #f8f9fb;
    border: 1px solid #e1e4e8;
    font-size: 10px;
    cursor: pointer;
    white-space: nowrap;
}

.filter-item:hover {
    background: #eef1f5;
}

.filter-item input {
    margin: 0;
    flex-shrink: 0;
    width: 12px;
    height: 12px;
}

.filter-item span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.filter-footer {
    border-top: 1px solid #e6e8eb;
    padding-top: 8px;
    margin-top: 2px;
}

.filter-footer button {
    width: 100%;
    padding: 5px 10px;
    background: #0066cc;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 500;
}

.filter-footer button:hover {
    background: #0052a3;
}
    .filter-popup-global {
    font-family: "Segoe UI", sans-serif;
    font-size: 11px;
}

.filter-drag-handle {
    cursor: move;
    padding: 8px 12px;
    background: #f0f2f5;
    border-bottom: 1px solid #e0e4e8;
    user-select: none;
}

.filter-drag-handle:hover {
    background: #e8eaf0;
}

.filter-content {
    padding: 10px;
    overflow-y: auto;
    max-height: 400px;
}

.filter-special {
    background: #e8f0fe;
    border: 1px solid #0066cc;
    border-radius: 6px;
    padding: 6px 10px;
    margin-bottom: 10px;
}

.filter-special-item {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 11px;
}

.filter-special-item input {
    width: 14px;
    height: 14px;
    cursor: pointer;
}

.filter-actions {
    display: flex;
    gap: 8px;
    margin-bottom: 10px;
}

.filter-actions button {
    flex: 1;
    padding: 4px 8px;
    font-size: 10px;
    cursor: pointer;
    background: #f0f2f5;
    border: 1px solid #dcdfe3;
    border-radius: 4px;
}

.filter-actions button:hover {
    background: #e4e7eb;
}

.filter-columns {
    display: flex;
    flex-direction: row;
    gap: 15px;
    overflow-y: auto;
    flex: 1;
    padding-right: 6px;
    margin-bottom: 10px;
    max-height: 280px;
}

.filter-column {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 160px;
}

.filter-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 5px;
    border-radius: 3px;
    background: #f8f9fb;
    border: 1px solid #e1e4e8;
    font-size: 10px;
    cursor: pointer;
    white-space: nowrap;
}

.filter-item:hover {
    background: #eef1f5;
}

.filter-item input {
    margin: 0;
    flex-shrink: 0;
    width: 12px;
    height: 12px;
}

.filter-item span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.filter-footer {
    border-top: 1px solid #e6e8eb;
    padding-top: 8px;
    margin-top: 2px;
}

.filter-footer button {
    width: 100%;
    padding: 5px 10px;
    background: #0066cc;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 500;
}

.filter-footer button:hover {
    background: #0052a3;
}
    .filter-close-btn {
    float: right;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 18px;
    line-height: 1;
    padding: 0 4px;
    color: #666;
}

.filter-close-btn:hover {
    color: #000;
    background: rgba(0,0,0,0.05);
    border-radius: 4px;
}


.excel-filter-popup {
    font-family: "Segoe UI", sans-serif;
    font-size: 12px;
}
.excel-filter-popup label {
    display: flex;
    align-items: center;
    padding: 2px 4px;
    border-radius: 3px;
    cursor: pointer;
}
.excel-filter-popup label:hover {
    background-color: #f0f2f5;
}
.excel-filter-popup input[type="checkbox"] {
    margin-right: 6px;
}
.excel-filter-popup button {
    transition: background 0.1s ease;
}
.excel-filter-popup button:hover {
    opacity: 0.8;
}
/* Подсветка активной иконки фильтра */
.table-header div span:last-child {
    transition: opacity 0.1s ease;
}
.table-header div span:last-child:hover {
    opacity: 1 !important;
}
    
.web3d-ext-only3d-container {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin: 0 12px 0 auto;  
    background: transparent;
    border: none;
}
.web3d-ext-only3d-container label {
    border: 2px solid #e6e8eb;
    background: #f6f7f9;
    padding: 2px 10px;
    font-family: "Segoe UI", Arial, sans-serif;
    font-size: 12px;
    font-weight: 550;
    letter-spacing: 0.04em;
    color: #2b2b2b;
    border-radius: 0;
    box-shadow: none;
    white-space: nowrap;
}
#web3d-only3d-checkbox {
    width: 14px;
    height: 14px;
    margin: 0 4px 0 0;
    cursor: pointer;
    accent-color: #0066cc;  
}
    /* Стили для поисковой строки в фильтре */
.excel-filter-popup input[type="text"]:focus {
    border-color: #0066cc;
    box-shadow: 0 0 0 2px rgba(0,102,204,0.2);
}
    .web3d-ext-vertical-tab {
    position: relative;
    border: none;
    outline: none;
    background-color: transparent;
}
.web3d-ext-vertical-tab:hover {
    background-color: rgba(0,0,0,0.08);
}
.web3d-ext-vertical-tab:hover::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 1.5px;
    background-color: #86609B;
}
    .web3d-ext-vertical-tab:hover::after {
    content: attr(data-tooltip);
    position: absolute;
    top: calc(100% + 10px);
    left: 10%;
    transform: translateX(-50%);
    background-color: #626161;
    color: #fff;
    padding: 4px 8px;
    border-radius: 4px;
    white-space: nowrap;
    font-size: 12px;
    font-family: "Segoe UI", sans-serif;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease;
    z-index: 1000;
}
.web3d-ext-vertical-tab[data-tooltip-visible="true"]::after {
    opacity: 1;
}
    
        `;
        const style = document.createElement('style');
        style.id = 'web3d-ext-styles';
        style.innerHTML = css;
        document.head.appendChild(style);
    }
    private _modelViewer: any = null;
    private destroy(): void {
        this.closePanel();
        this.ElementIds=[];
        this.workSchedule=[];
        this.viewEnd=null;
        this.viewStart=null;
        this.status=false;

        if (this._button && this._button.parentElement) {
            this._button.parentElement.removeChild(this._button);
        }
        document.getElementById(BUTTON_ID)?.remove();
        this._button = null;

        if (this._panel && this._panel.parentElement) {
            this._panel.parentElement.removeChild(this._panel);
        }
        document.getElementById(PANEL_ID)?.remove();
        this._panel = null;

        const injectedStyles = document.getElementById('web3d-ext-styles');
        if (injectedStyles) {
            injectedStyles.remove();
        }

        if (this._globalClickHandlerBound) {
            document.removeEventListener('click', this._globalClickHandlerBound);
            this._globalClickHandlerBound = null;
        }

        if (this._animationHandle !== null) {
            cancelAnimationFrame(this._animationHandle);
            this._animationHandle = null;
        }

        const model = (this._viewer as any)?.model;
        if(!model) return;

        this._isInstalled = false;
        this._canvasInitialized = false;

        if (this._dataInterval) {
            clearInterval(this._dataInterval);
            this._dataInterval = null;
        }
        if (this._loadInterval) clearInterval(this._loadInterval);
if (this._checkInterval) clearInterval(this._checkInterval);
if (this._resizeInterval) clearInterval(this._resizeInterval);
if (this._dataInterval) clearInterval(this._dataInterval);
    }
    private getFactStartDate(item: WorkSchedule): Date {
    const d = new Date(item.StartDate);
    d.setDate(d.getDate() + 7);
    return d;
}
private getFactFinishDate(item: WorkSchedule): Date {
    const d = new Date(item.FinishDate);
    d.setDate(d.getDate() - 7);  
    return d;
}
    private FullSchedule: SheduleAndParts[]=[];
    private async db_query(){
        const DBs = ['dbRVS505', 'dbGEP'];
        for (let i=0; i<DBs.length; i++){
            try{
               const authResponse = await fetch('https://360pilot.ru/pappi/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user: 'Sultanmuradov_K',
        password: 'PkpSk0406',
                    db_name: DBs[i]
                })
               });
               if (!authResponse.ok) throw new Error(`Ошибка аутентификации: ${authResponse.statusText}`);
               const authData = await authResponse.json();
               if (!authData.success) throw new Error(authData.error || 'Ошибка получения API ключа');

               const apiKey = authData.api_key;
               const SQLquery='SELECT * FROM dbo.WorkSchedule'.replace(/\s+/g, ' ').trim();
               const encodedQery=encodeURIComponent(SQLquery);
               const response = await fetch(`https://360pilot.ru/pappi/query?sql=${encodedQery}&api_key=${apiKey}`);
               if (!response.ok) throw new Error(`Ошибка выполнения SQL запроса: ${response.statusText}`);
               const result1=await response.json();

               const SQLquery2='SELECT * FROM dbo.Work_ModelID'.replace(/\s+/g, ' ').trim();
               const encodedQery2=encodeURIComponent(SQLquery2);
               const response2 = await fetch(`https://360pilot.ru/pappi/query?sql=${encodedQery2}&api_key=${apiKey}`);
               if (!response2.ok) throw new Error(`Ошибка выполнения SQL запроса: ${response2.statusText}`);
               const result2=await response2.json();

               const SQLquery3='SELECT * FROM dbo.KidsModelID'.replace(/\s+/g, ' ').trim();
               const encodedQery3=encodeURIComponent(SQLquery3);
               const response3 = await fetch(`https://360pilot.ru/pappi/query?sql=${encodedQery3}&api_key=${apiKey}`);
               if (!response3.ok) throw new Error(`Ошибка выполнения SQL запроса: ${response3.statusText}`);
               const result3=await response3.json();

               const workSchedule=result1.result as WorkSchedule[];
               workSchedule.forEach(item => {
    item.CriticalPath = Math.random() < 0.5;
});


               const ElementIds=result2.result as PartIds[];
               const Modeltree=result3.result as ModelTree[];
               const Result : SheduleAndParts = {schedule:workSchedule, parts:ElementIds, elements:Modeltree};
               this.FullSchedule.push(Result);
            }
            catch(error){
                console.error('ERRORRRRRR:   ', error);
            }
        }
    }

    
    private async connectDataWithModel(){
        if (!this.FullSchedule || !this._viewer.model) return;

        if (this._dataInterval) {
            clearInterval(this._dataInterval);
            this._dataInterval = null;
        }

        this._dataInterval = window.setInterval(() => {
            const model = (this._viewer as any).model;
            if (!model) return;

            const visible = model.getVisibleElements();
            if (visible.length === 0) return;

            const part = visible[0];
            const partID = String(part.modelPartId).toLowerCase();

            for (let i = 0; i < this.FullSchedule.length; i++) {
                const IDS = this.FullSchedule[i].parts;
                const Schedule = this.FullSchedule[i].schedule;
                const Tree = this.FullSchedule[i].elements;

                if (IDS.some(id => String(id.ModelPartID).toLowerCase() === partID)) {
                    this.workSchedule = Schedule;
                    this.ElementIds = IDS;
                    this.modelTree = Tree;
                    break;
                }
            }

            const dates: number[] = [];
            this.workSchedule.forEach(item => {
                dates.push(new Date(item.StartDate).getTime());
                dates.push(new Date(item.FinishDate).getTime());
            });
            this.viewStart = new Date(Math.min(...dates));
            this.viewEnd = new Date(Math.max(...dates));
            if (!this._isInstalled && this._toolbar) {
                this.waitForUIAndInstall();
            }
        }, 100);
    }

    private async db_connect(){
        await this.db_query();
        this.connectDataWithModel();
    }

    private elementTree: Record<string, string[]>={};
    private readIds() {
        const childrenMap: Record<string, string[]> = {};

        this.modelTree.forEach(item => {
            const parentId = item.ElementID?.toLowerCase();
            const childId = item.KidElementID?.toLowerCase();
            if (!parentId || !childId) return;
            if (!childrenMap[parentId]) childrenMap[parentId] = [];
            if (!childrenMap[parentId].includes(childId)) childrenMap[parentId].push(childId);
        });

        const collectAllChildren = (parentId: string, visited = new Set<string>()): string[] => {
            if (visited.has(parentId)) return [];
            visited.add(parentId);
            const directChildren = childrenMap[parentId] || [];
            const result: string[] = [...directChildren];
            for (const child of directChildren) {
                const descendants = collectAllChildren(child, visited);
                result.push(...descendants);
            }
            return result;
        };

        const result: Record<string, string[]> = {};
        this.ElementIds.forEach(item => {
            const rootId = item.ElementID.toLowerCase();
            const allChildren = collectAllChildren(rootId);
            result[rootId] = [...new Set(allChildren)].sort();
            if (result[rootId].length === 0) result[rootId] = [rootId];
        });

        this.elementTree = result;
    }

    private leafToPartMapCache: Record<string, string> | null = null;
    private lastPainted: Record<string, string[]> = {};

    
    private _coloringInProgress = false;
    private _pendingColorRun = false;

    private applyColorsAsync(): void {
    if (this._coloringInProgress) {
        this._pendingColorRun = true;
        return;
    }
    this._coloringInProgress = true;
    this._pendingColorRun = false;

    const model = (this._viewer as any)?.model;
    if (!model) {
        this._coloringInProgress = false;
        return;
    }


    requestAnimationFrame(() => {
        try {
            this._doApplyColors(model);
        } finally {
            this._coloringInProgress = false;
            if (this._pendingColorRun) {
                this.applyColorsAsync();
            }
        }
    });
}

private _doApplyColors(model: any): void {
    const CHUNK = 1; 

    const setChunked = (ids: string[], r: number, g: number, b: number, a: number, partId: string) => {
        for (let i = 0; i < ids.length; i += CHUNK) {
            try { model.setColor(ids.slice(i, i + CHUNK), r, g, b, a, partId); } catch {}
        }
    };
    const clearChunked = (ids: string[], partId: string) => {
        for (let i = 0; i < ids.length; i += CHUNK) {
            try { model.clearColors(ids.slice(i, i + CHUNK), partId); } catch {}
        }
    };

 
    for (const [partId, ids] of Object.entries(this.lastPainted)) {
        if (!ids?.length) continue;
        setChunked(ids, 200, 200, 200, 0.9, partId);
        clearChunked(ids, partId);                    
    }
    this.lastPainted = {};

    const visibleParts = model.getVisibleElements?.();
    if (!visibleParts?.length) return;

    if (!this.leafToPartMapCache) {
        this.leafToPartMapCache = {};
        for (const part of visibleParts) {
            if (!Array.isArray(part.elementIds)) continue;
            for (const elem of part.elementIds) {
                this.leafToPartMapCache[String(elem).toLowerCase().trim()] = part.modelPartId;
            }
        }
    }

    
    const greens  = new Set(this.GSortedElementIds.map(e => e.ElementID.toLowerCase().trim()));
    const yellows = new Set(this.YSortedElementIds.map(e => e.ElementID.toLowerCase().trim()));
    const chosen  = new Set((this.ChoosenOne ?? []).map((e: string) => e.toLowerCase().trim()));

    
    type Buckets = { greens: string[], yellows: string[], blacks: string[], choosen: string[] };
    const partColors: Record<string, Buckets> = {};

    for (const [parentIdRaw, leaves] of Object.entries(this.elementTree)) {
        const parentId = parentIdRaw.toLowerCase().trim();
        const bucket: keyof Buckets =
            chosen.has(parentId)  ? 'choosen' :
            greens.has(parentId)  ? 'greens'  :
            yellows.has(parentId) ? 'yellows' : 'blacks';

        for (const leaf of leaves) {
            const partId = this.leafToPartMapCache[leaf.toLowerCase().trim()];
            if (!partId) continue;
            if (!partColors[partId]) partColors[partId] = { greens:[], yellows:[], blacks:[], choosen:[] };
            partColors[partId][bucket].push(leaf.toLowerCase().trim());
        }
    }

    for (const [partId, colors] of Object.entries(partColors)) {
        if (!this.lastPainted[partId]) this.lastPainted[partId] = [];

        const paint = (ids: string[], r: number, g: number, b: number, a: number) => {
            if (!ids.length) return;
            setChunked(ids, r, g, b, a, partId);
            this.lastPainted[partId].push(...ids);
        };

        paint(colors.blacks,    0,   0,   0, 0.4);
        paint(colors.greens,    0, 255,   0, 0.6);
        paint(colors.yellows, 255, 255,   0, 0.6);
        paint(colors.choosen, 255,   0,   0, 1.0);
    }
}

private clearLastPainted(model: any) {
    const CHUNK = 2;
    for (const [partId, ids] of Object.entries(this.lastPainted)) {
        if (!ids?.length) continue;
        for (let i = 0; i < ids.length; i += CHUNK) {
            const chunk = ids.slice(i, i + CHUNK);
            try { model.setColor(chunk, 200, 200, 200, 0.9, partId); } catch {}
            try { model.clearColors(chunk, partId); } catch {}
        }
    }
    this.lastPainted = {};
}
private findMethodByKeywords(obj: any, keywords: string[], depth: number = 3): { target: any; method: string } | null {
    if (!obj || depth === 0) return null;
    const visited = new WeakSet();

    const search = (current: any, currentDepth: number): { target: any; method: string } | null => {
        if (!current || typeof current !== 'object' || visited.has(current)) return null;
        visited.add(current);

        // Проверяем собственные методы
        const proto = Object.getPrototypeOf(current);
        const methods = Object.getOwnPropertyNames(current)
            .concat(Object.getOwnPropertyNames(proto || {}))
            .filter(name => typeof current[name] === 'function' && name !== 'constructor');

        for (const method of methods) {
            const lower = method.toLowerCase();
            for (const keyword of keywords) {
                if (lower.includes(keyword)) {
                    return { target: current, method };
                }
            }
        }

        if (currentDepth === 1) return null;

        for (const key of Object.getOwnPropertyNames(current)) {
            try {
                const value = current[key];
                if (value && typeof value === 'object') {
                    const result = search(value, currentDepth - 1);
                    if (result) return result;
                }
            } catch (_) { }
        }
        return null;
    };

    return search(obj, depth);
}

private findSelectMethod(obj: any): { target: any; method: string } | null {
    const keywords = ['select', 'setselection', 'highlight', 'pick'];
    return this.findMethodByKeywords(obj, keywords, 4);
}

private _cameraBeforeZoom: any = null;
private selectAndZoom(item: WorkSchedule, model: any): void {
    const partIdsForWork = this.ElementIds.filter(e => e.WorkID === item.WorkID);
    if (partIdsForWork.length === 0) {
        console.warn('Нет элементов для работы', item.WorkID);
        return;
    }

    const nav = (this._viewer as any)?._navigation;

    if (nav && !this._cameraBeforeZoom) {
        try {
            const params = nav.getCameraParameters();
            if (params) {
                this._cameraBeforeZoom = {
                    position: { ...params.position },
                    eyeDir: { ...params.eyeDir },
                    angle: params.angle,
                    upDir: { ...params.upDir },
                    viewCenter: { ...params.viewCenter }
                };
            }
        } catch (e) {
            console.warn('[selectAndZoom] не удалось сохранить исходную камеру:', e);
        }
    }

    if (partIdsForWork.length === 0) {
        console.warn('Нет элементов для работы', item.WorkID);
        return;
    }

    const groups: { [partId: string]: string[] } = {};
    for (const part of partIdsForWork) {
        const partId = part.ModelPartID.toLowerCase();
        const rootId = part.ElementID.toLowerCase();
        const leaves = (this.elementTree[rootId] && this.elementTree[rootId].length > 0)
            ? this.elementTree[rootId]
            : [rootId];
        if (!groups[partId]) groups[partId] = [];
        for (const leaf of leaves) {
            const leafLower = leaf.toLowerCase();
            if (!groups[partId].includes(leafLower)) groups[partId].push(leafLower);
        }
    }
    const selectionArgs = Object.keys(groups).map(partId => ({
        modelPartId: partId,
        elementIds: groups[partId]
    }));

    this.ChoosenOne = partIdsForWork.map(e => e.ElementID);
    this.applyColorsAsync();

    if (!nav) return;

    const viewerAny = (this._viewer as any);
    let animationWasOn: boolean | undefined = undefined;
    try {
        const settings = viewerAny.settings;
        if (settings && typeof settings.useCameraAnimation === 'boolean') {
            animationWasOn = settings.useCameraAnimation;
            settings.useCameraAnimation = false;
        }
    } catch (_) {}

    let succeeded = false;
    try {
        nav.fitToElements(selectionArgs);
        succeeded = true;
        console.log('[selectAndZoom] fitToElements сработал (анимация выключена/недоступна)');
    } catch (e) {
        console.warn('[selectAndZoom] fitToElements всё ещё падает, переходим на ручной мгновенный зум:', e);
    }

    try {
        if (animationWasOn !== undefined) {
            viewerAny.settings.useCameraAnimation = animationWasOn;
        }
    } catch (_) {}

    if (succeeded) return;

    try {
        const current = nav.getCameraParameters();
        if (!current) return;

        const bbox = this.tryGetBoundingBoxForParts(model, groups);

        let viewCenter = current.viewCenter;
        let sizeForDistance = 3000; 

        if (bbox) {
            viewCenter = {
                x: (bbox.minX + bbox.maxX) / 2,
                y: (bbox.minY + bbox.maxY) / 2,
                z: (bbox.minZ + bbox.maxZ) / 2
            };
            const dx = bbox.maxX - bbox.minX;
            const dy = bbox.maxY - bbox.minY;
            const dz = bbox.maxZ - bbox.minZ;
            sizeForDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        }

        const fov = current.angle || 0.7853981633974483; 
        const MARGIN = 33;
        const distance = Math.max((sizeForDistance / 2) / Math.tan(fov / 2) * MARGIN, 100);

        const ELEVATION = Math.PI / 4; // 45°
        const horizLen = Math.sqrt(current.eyeDir.x ** 2 + current.eyeDir.y ** 2);
        let azimuthX = 1, azimuthY = 0;
        if (horizLen > 1e-6) {
            azimuthX = current.eyeDir.x / horizLen;
            azimuthY = current.eyeDir.y / horizLen;
        }
        const cosEl = Math.cos(ELEVATION);
        const sinEl = Math.sin(ELEVATION);

        const newEyeDir = {
            x: azimuthX * cosEl,
            y: azimuthY * cosEl,
            z: -sinEl 
        };

        const worldUp = { x: 0, y: 0, z: 1 };
        const right = {
            x: newEyeDir.y * worldUp.z - newEyeDir.z * worldUp.y,
            y: newEyeDir.z * worldUp.x - newEyeDir.x * worldUp.z,
            z: newEyeDir.x * worldUp.y - newEyeDir.y * worldUp.x
        };
        const rightLen = Math.sqrt(right.x ** 2 + right.y ** 2 + right.z ** 2) || 1;
        right.x /= rightLen; right.y /= rightLen; right.z /= rightLen;
        const newUpDir = {
            x: right.y * newEyeDir.z - right.z * newEyeDir.y,
            y: right.z * newEyeDir.x - right.x * newEyeDir.z,
            z: right.x * newEyeDir.y - right.y * newEyeDir.x
        };

        const newPosition = {
            x: viewCenter.x - newEyeDir.x * distance,
            y: viewCenter.y - newEyeDir.y * distance,
            z: viewCenter.z - newEyeDir.z * distance
        };

        nav.setCameraParameters({
            position: newPosition,
            eyeDir: newEyeDir,
            angle: current.angle,
            upDir: newUpDir,
            viewCenter: viewCenter
        });
        console.log('[selectAndZoom] зум под 45° выполнен', { viewCenter, distance, sizeForDistance });
    } catch (e) {
        console.warn('[selectAndZoom] план Б тоже не сработал, оставляем камеру как есть:', e);
    }
}

private tryGetBoundingBoxForParts(model: any, groups: { [partId: string]: string[] }): { minX: number; minY: number; minZ: number; maxX: number; maxY: number; maxZ: number } | null {
    let combined: any = null;
    try {
        for (const partId of Object.keys(groups)) {
            const part = model.getModelPart ? model.getModelPart(partId) : null;
            const entityAccess = part?._modelEntityTreeAccess;
            const entities: Map<string, any> | undefined = entityAccess?._entities;
            if (!entities) continue;

            for (const elemId of groups[partId]) {
                const entity = entities.get(elemId);
                const box = entity?.boundingBox || entity?.bbox || entity?.bounds;
                if (!box) continue;

                const minX = box.minX ?? box.min?.x;
                const minY = box.minY ?? box.min?.y;
                const minZ = box.minZ ?? box.min?.z;
                const maxX = box.maxX ?? box.max?.x;
                const maxY = box.maxY ?? box.max?.y;
                const maxZ = box.maxZ ?? box.max?.z;
                if ([minX, minY, minZ, maxX, maxY, maxZ].some(v => typeof v !== 'number')) continue;

                if (!combined) {
                    combined = { minX, minY, minZ, maxX, maxY, maxZ };
                } else {
                    combined.minX = Math.min(combined.minX, minX);
                    combined.minY = Math.min(combined.minY, minY);
                    combined.minZ = Math.min(combined.minZ, minZ);
                    combined.maxX = Math.max(combined.maxX, maxX);
                    combined.maxY = Math.max(combined.maxY, maxY);
                    combined.maxZ = Math.max(combined.maxZ, maxZ);
                }
            }
        }
    } catch (e) {
        console.warn('[tryGetBoundingBoxForParts] ошибка:', e);
        return null;
    }
    return combined;
}
private getBoundingBoxForElements(elementIds: string[], model: any): { minX: number; minY: number; minZ: number; maxX: number; maxY: number; maxZ: number } | null {
    if (!model || !elementIds.length) return null;

    let combined: any = null;

    for (const id of elementIds) {
        try {
            const props = model.getElementProperties(id);
            if (!props || !Array.isArray(props)) {
                console.warn(`[getBoundingBox] Нет свойств для id=${id}`);
                continue;
            }

            console.log(`[getBoundingBox] Свойства для ${id}:`, JSON.stringify(props, null, 2));

            let minX: number | null = null, minY: number | null = null, minZ: number | null = null;
            let maxX: number | null = null, maxY: number | null = null, maxZ: number | null = null;

            for (const group of props) {
                if (!group.properties) continue;
                for (const p of group.properties) {
                    // Проверяем разные варианты имён
                    const name = p.name?.toLowerCase() || '';
                    let val: number | null = null;
                    const v = p.value ?? p;
                    if (typeof v === 'number') val = v;
                    else if (v.double_value !== undefined) val = v.double_value;
                    else if (v.decimal_value !== undefined) val = v.decimal_value;
                    else if (v.int_value !== undefined) val = v.int_value;
                    else if (typeof v.str_value === 'string') {
                        const s = v.str_value.replace(/\s+/g, '').replace(',', '.');
                        const num = parseFloat(s);
                        if (!isNaN(num)) val = num;
                    }
                    if (val === null) continue;

                    if (name.includes('range1x')) minX = val;
                    else if (name.includes('range1y')) minY = val;
                    else if (name.includes('range1z')) minZ = val;
                    else if (name.includes('range2x')) maxX = val;
                    else if (name.includes('range2y')) maxY = val;
                    else if (name.includes('range2z')) maxZ = val;
                    // также проверим без "range"
                    if (name === 'minx' || name === 'min_x') minX = val;
                    if (name === 'maxx' || name === 'max_x') maxX = val;
                    // и т.д.
                }
            }

            if (minX === null || minY === null || minZ === null || maxX === null || maxY === null || maxZ === null) {
                console.warn(`[getBoundingBox] Не все координаты для id=${id}`, { minX, minY, minZ, maxX, maxY, maxZ });
                continue;
            }

            if (!combined) {
                combined = { minX, minY, minZ, maxX, maxY, maxZ };
            } else {
                combined.minX = Math.min(combined.minX, minX);
                combined.minY = Math.min(combined.minY, minY);
                combined.minZ = Math.min(combined.minZ, minZ);
                combined.maxX = Math.max(combined.maxX, maxX);
                combined.maxY = Math.max(combined.maxY, maxY);
                combined.maxZ = Math.max(combined.maxZ, maxZ);
            }
        } catch (e) {
            console.warn(`[getBoundingBox] Ошибка для id=${id}:`, e);
        }
    }

    console.log('[getBoundingBox] Результат:', combined);
    return combined;
}
private _initPilotApi() {
    try {
        const pilot = (window as any).Pilot;
        if (pilot) {
            this._modelViewer = pilot.getService('IModelViewer');
            if (this._modelViewer) {
                console.log('IModelViewer получен через Pilot');
                return;
            }
        }
        // Если не получилось, пробуем привести _viewer
        if (this._viewer && typeof (this._viewer as any).Select === 'function') {
            this._modelViewer = this._viewer as any;
            console.log('IModelViewer получен из _viewer');
        } else {
            console.warn('IModelViewer не найден');
        }
    } catch (e) {
        console.warn('Ошибка получения IModelViewer:', e);
    }
}
}

interface WorkSchedule{
    scName: string;
    subScName: string;
    WorkID: string;
    WBS: string;
    WBSname: string;
    WBSdesc: string;
    StartDate: Date;
    FinishDate: Date;
    discName: string;
    activityKey: string;
    constKey: string;
    CriticalPath: boolean;
}
interface PartIds{
    WorkID: string;
    ElementName: string;
    ElementID: string;
    ModelPartID: string;
    ModelPartName: string;
}
interface ModelTree{
    ModelPartID: string;
    ElementID: string;
    KidElementID: string;
}
interface SheduleAndParts{
    schedule: WorkSchedule[];
    parts: PartIds[];
    elements: ModelTree[];
}
export default Web3DExtensionImpl;
