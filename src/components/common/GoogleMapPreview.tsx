import React, { useEffect, useRef, useState } from 'react';
import { MapPin, ExternalLink, AlertCircle } from 'lucide-react';

interface GoogleMapPreviewProps {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  shopName: string;
  address?: string | null;
  className?: string;
  zoom?: number;
}

export const GoogleMapPreview: React.FC<GoogleMapPreviewProps> = ({
  latitude,
  longitude,
  shopName,
  address,
  className = 'h-64 w-full',
  zoom = 15,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const [mapError, setMapError] = useState(false);

  const validCoords =
    latitude !== null &&
    latitude !== undefined &&
    longitude !== null &&
    longitude !== undefined &&
    !isNaN(Number(latitude)) &&
    !isNaN(Number(longitude));

  useEffect(() => {
    if (!validCoords || !mapRef.current || !mapsApiKey) return;

    const handleAuthError = () => {
      setMapError(true);
    };

    window.addEventListener('gmp-quota-exceeded', handleAuthError);

    // Load Google Maps JavaScript API with proper attribution
    const scriptId = 'google-maps-js-sdk';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const initMap = () => {
      try {
        if (!(window as any).google || !(window as any).google.maps) return;
        const center = { lat: Number(latitude), lng: Number(longitude) };
        const map = new (window as any).google.maps.Map(mapRef.current, {
          center,
          zoom,
          mapTypeControl: false,
          streetViewControl: true,
          fullscreenControl: true,
          styles: [
            {
              featureType: 'all',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#7c93a3' }, { lightness: '-10' }],
            },
          ],
        });

        // Internal attribution as required by Google Maps Platform AI Studio guidelines
        if ((map as any).setOptions) {
          (map as any).setOptions({
            internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio'],
          });
        }

        new (window as any).google.maps.Marker({
          position: center,
          map,
          title: shopName,
          animation: (window as any).google.maps.Animation.DROP,
        });
      } catch (e) {
        console.warn('Google Maps initialization warning:', e);
        setMapError(true);
      }
    };

    if (!(window as any).google) {
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsApiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = initMap;
        script.onerror = () => setMapError(true);
        document.head.appendChild(script);
      } else {
        script.addEventListener('load', initMap);
        script.addEventListener('error', () => setMapError(true));
      }
    } else {
      initMap();
    }

    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleAuthError);
    };
  }, [latitude, longitude, mapsApiKey, shopName, validCoords, zoom]);

  if (!validCoords) {
    return (
      <div className={`bg-slate-900 border border-slate-800 rounded-lg flex flex-col items-center justify-center p-6 text-slate-500 ${className}`}>
        <MapPin className="w-8 h-8 text-slate-600 mb-2" />
        <span className="text-sm font-medium text-slate-400">Location coordinates unavailable</span>
        <span className="text-xs text-slate-600 mt-1">{address || 'No address provided'}</span>
      </div>
    );
  }

  const gmapsDirectionsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  if (mapError) {
    return (
      <div className={`relative rounded-lg overflow-hidden border border-slate-800 bg-slate-900 flex flex-col items-center justify-center p-6 ${className}`}>
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-3 text-emerald-400">
          <MapPin className="w-6 h-6" />
        </div>
        <div className="text-center max-w-sm mb-3">
          <span className="font-semibold text-slate-200 text-sm block">{shopName}</span>
          <span className="text-xs text-slate-400 block mt-1">{address || 'Mumbai Region'}</span>
          <span className="text-xs font-mono text-emerald-400 font-semibold block mt-1">
            Lat: {Number(latitude).toFixed(5)}, Lng: {Number(longitude).toFixed(5)}
          </span>
        </div>
        <a
          href={gmapsDirectionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
        >
          <span>Open Full Interactive Map</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden border border-slate-800 shadow-sm bg-slate-900">
      <div ref={mapRef} className={className} />
      <div className="absolute bottom-2 left-2 right-2 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded px-3 py-2 flex items-center justify-between text-xs">
        <div className="truncate mr-2">
          <span className="font-semibold text-slate-200">{shopName}</span>
          <span className="text-slate-400 font-mono tabular-nums ml-2">
            ({Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)})
          </span>
        </div>
        <a
          href={gmapsDirectionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium shrink-0 transition-colors"
        >
          <span>Open in Maps</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
