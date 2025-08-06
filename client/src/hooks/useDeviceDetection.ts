import { useState, useEffect } from 'react';

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  userAgent: string;
}

export const useDeviceDetection = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenWidth: 1920,
    screenHeight: 1080,
    userAgent: ''
  });

  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const userAgent = navigator.userAgent;

      // Détection mobile/tablette par user agent
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const tabletRegex = /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)|Android(?=.*\bTablet\b)/i;
      
      // Détection par taille d'écran
      const isMobileSize = width <= 768;
      const isTabletSize = width > 768 && width <= 1024;
      const isDesktopSize = width > 1024;

      // Combinaison des détections
      const isMobileUA = mobileRegex.test(userAgent) && !tabletRegex.test(userAgent);
      const isTabletUA = tabletRegex.test(userAgent);

      const isMobile = isMobileUA || (isMobileSize && !isTabletUA);
      const isTablet = isTabletUA || (isTabletSize && !isMobileUA);
      const isDesktop = isDesktopSize && !isMobileUA && !isTabletUA;

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        screenWidth: width,
        screenHeight: height,
        userAgent
      });
    };

    // Détection initiale
    detectDevice();

    // Écoute des changements de taille d'écran
    window.addEventListener('resize', detectDevice);
    
    return () => {
      window.removeEventListener('resize', detectDevice);
    };
  }, []);

  return deviceInfo;
};

export default useDeviceDetection;