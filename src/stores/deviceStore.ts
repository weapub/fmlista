import { create } from 'zustand';

interface DeviceState {
  isTV: boolean;
  checkDevice: () => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  isTV: false,
  checkDevice: () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isSmartTV = /smart-tv|smarttv|googletv|appletv|hbbtv|pov_tv|netcast.tv|webos|tizen|viera|bravia|netcast|r roku|firetv|android tv/i.test(userAgent);
    set({ isTV: isSmartTV });
    
    if (isSmartTV) {
      document.body.classList.add('tv-mode');
    } else {
      document.body.classList.remove('tv-mode');
    }
  },
}));
