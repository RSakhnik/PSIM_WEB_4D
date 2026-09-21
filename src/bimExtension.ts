/* eslint-disable */
window.addEventListener('error', function(e) {
    if (e.message && e.message.includes('Extension not registered') && e.message.includes('Web3DExtension')) {
        console.warn('[Web3DExtension] Подавлена ложная ошибка регистрации (расширение догрузится само)');
        e.stopImmediatePropagation();
        e.preventDefault();
        return false;
    }
}, true); 
import { IInitializable, InjectionSource } from "@pilotdev/pilot-web-sdk";
import { Web3DExtension } from "./app/web3d.component.extension";


declare global {
  interface Window {
    __pnr_searchSetService: any;
    __pnr_bimFeatures: any;
  }
}

export class HelperExtension implements IInitializable {
  constructor(_viewer: PilotWeb3D.GuiViewer3D) {
    console.log('PnrToolbarExtension constructor');
  }

  initialize(injectionSource: InjectionSource): void {
   
    const source = injectionSource as any;
    if (source?.bimFeatures) {
      window.__pnr_bimFeatures = source.bimFeatures;
      if (source.bimFeatures.searchSetService) {
        window.__pnr_searchSetService = source.bimFeatures.searchSetService;
      }
    }
  }
}


if ((window as any).PilotWeb3D) {
  (window as any).PilotWeb3D.theExtensionManager.registerExtensionType(
    'PnrToolbarExtension',
    HelperExtension as any
  );
}


let registered = false;
let registerAttempts = 0;
 

function tryRegister() {
  if (registered) return; 

  if ((window as any).PilotWeb3D?.theExtensionManager) {
    try {
      (window as any).PilotWeb3D.theExtensionManager.registerExtensionType(
        Web3DExtension.EXTENSION_NAME,
        Web3DExtension as any
      );
      registered = true;
      console.log("[Web3DExtension] Registered successfully");
    } catch (e) {
      console.error("[Web3DExtension] Registration error:", e);
      scheduleRetry();
    }
  } else {
    console.warn("[Web3DExtension] PilotWeb3D not ready, retrying...");
    scheduleRetry();
  }
}

function scheduleRetry() {
  registerAttempts++;
  

  const delay = Math.min(100 * registerAttempts, 2000);
  setTimeout(tryRegister, delay);
}

tryRegister();