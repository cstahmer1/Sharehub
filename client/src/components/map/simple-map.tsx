interface SimpleMapProps {
  lat?: number;
  lng?: number;
  address?: string;
  className?: string;
}

export function SimpleMap({ lat, lng, address, className = "" }: SimpleMapProps) {
  const defaultLat = 41.2565;
  const defaultLng = -95.9345;
  
  const latitude = lat !== null && lat !== undefined ? lat : defaultLat;
  const longitude = lng !== null && lng !== undefined ? lng : defaultLng;
  const zoom = lat !== null && lat !== undefined && lng !== null && lng !== undefined ? 15 : 12;
  
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}&layer=mapnik&marker=${latitude},${longitude}`;
  
  return (
    <div className={`relative ${className}`}>
      <iframe
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        marginHeight={0}
        marginWidth={0}
        src={mapUrl}
        className="rounded-lg"
        title={`Map showing ${address || 'project location'}`}
      />
      {address && (
        <div className="absolute bottom-3 left-3 bg-background/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border">
          <p className="text-sm font-medium">{address}</p>
        </div>
      )}
    </div>
  );
}
