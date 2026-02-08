import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { normalizeCoord, logResultCoords } from "@/lib/map-utils";
import { 
  Maximize2, 
  Minimize2,
  DollarSign,
  ZoomIn,
  ZoomOut,
  Search,
} from "lucide-react";
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon paths
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconRetinaUrl: iconRetina,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapListing {
  id: number;
  title: string;
  lat: string | null;
  lng: string | null;
  priceCents: number;
  categoryId: number | null;
}

interface MapViewProps {
  selectedCategoryId?: number;
  searchQuery?: string;
  minPrice?: number;
  maxPrice?: number;
  onListingSelect?: (listing: MapListing) => void;
  className?: string;
}

// Component to auto-fit bounds to markers
function AutoFitBounds({ listings, defaultCenter }: { listings: MapListing[]; defaultCenter: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    if (listings.length === 0) return;
    
    const validCoords: [number, number][] = [];
    let hasDefaultPin = false;
    
    listings.forEach(listing => {
      const coord = normalizeCoord({ lat: listing.lat, lng: listing.lng });
      if (coord) {
        validCoords.push([coord.lat, coord.lng]);
      } else {
        // Listing with no coordinates will show at default location
        hasDefaultPin = true;
      }
    });
    
    // Include default center if any listing is using it
    if (hasDefaultPin) {
      validCoords.push(defaultCenter);
    }
    
    if (validCoords.length > 0) {
      const bounds = L.latLngBounds(validCoords);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [listings, map, defaultCenter]);
  
  return null;
}

export default function MapView({ selectedCategoryId, searchQuery, minPrice, maxPrice, onListingSelect, className = "" }: MapViewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<MapListing | null>(null);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || "");
  const [localCategoryFilter, setLocalCategoryFilter] = useState<string>(selectedCategoryId?.toString() || "all");
  const [localMinPrice, setLocalMinPrice] = useState(minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);

  // Sync local state with prop changes
  useEffect(() => {
    setLocalSearchQuery(searchQuery || "");
  }, [searchQuery]);

  useEffect(() => {
    setLocalCategoryFilter(selectedCategoryId?.toString() || "all");
  }, [selectedCategoryId]);

  useEffect(() => {
    setLocalMinPrice(minPrice);
  }, [minPrice]);

  useEffect(() => {
    setLocalMaxPrice(maxPrice);
  }, [maxPrice]);

  // Omaha coordinates
  const omahaCenter: [number, number] = [41.2586, -95.9378];
  
  // Fetch listings from API endpoint
  const { data: mapListings = [], isLoading, error: mapError } = useQuery<MapListing[]>({
    queryKey: ["/api/listings/map", localCategoryFilter, localSearchQuery, localMinPrice, localMaxPrice],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (localCategoryFilter && localCategoryFilter !== "all") {
        params.append("category", localCategoryFilter);
      }
      if (localMinPrice !== undefined) {
        params.append("minPrice", localMinPrice.toString());
      }
      if (localMaxPrice !== undefined) {
        params.append("maxPrice", localMaxPrice.toString());
      }
      const response = await fetch(`/api/listings/map?${params}`);
      if (!response.ok) throw new Error("Failed to fetch map listings");
      const data = await response.json();
      console.log("Map API returned listings:", data.length, data);
      logResultCoords(data);
      return data;
    },
  });

  // Filter listings by search query
  const filteredListings = mapListings.filter(listing => {
    if (!localSearchQuery) return true;
    const query = localSearchQuery.toLowerCase();
    return listing.title.toLowerCase().includes(query);
  });

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleListingClick = (listing: MapListing) => {
    setSelectedListing(listing);
    if (onListingSelect) {
      onListingSelect(listing);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Card className={`overflow-hidden ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
        <CardContent className="p-0">
          {/* Search and Filter Controls */}
          <div className="absolute top-4 left-4 right-4 z-[1000] flex gap-2">
            <div className="flex-1 flex gap-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2 flex items-center gap-2 flex-1">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search on map..." 
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  className="border-0 shadow-none focus-visible:ring-0"
                  data-testid="input-map-search"
                />
              </div>
              <Select value={localCategoryFilter} onValueChange={setLocalCategoryFilter}>
                <SelectTrigger className="w-48 bg-white dark:bg-gray-800 shadow-md" data-testid="select-map-category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="1">Home Improvement</SelectItem>
                  <SelectItem value="2">Landscaping</SelectItem>
                  <SelectItem value="3">Cleaning Services</SelectItem>
                  <SelectItem value="4">Moving & Storage</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div 
            className={`relative ${
              isFullscreen ? 'h-[calc(100vh-2rem)]' : 'h-96 lg:h-[600px]'
            }`}
          >
            {/* Leaflet Map */}
            <MapContainer
              center={omahaCenter}
              zoom={12}
              className="h-full w-full"
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Auto-fit bounds when listings change */}
              <AutoFitBounds listings={filteredListings} defaultCenter={omahaCenter} />
              
              {/* Render markers for each listing */}
              {filteredListings.map((listing) => {
                const coord = normalizeCoord({ lat: listing.lat, lng: listing.lng });
                // Use default Omaha coordinates if geocoding failed (consistent with project page)
                const position: [number, number] = coord 
                  ? [coord.lat, coord.lng] 
                  : omahaCenter;
                
                return (
                  <Marker
                    key={listing.id}
                    position={position}
                    eventHandlers={{
                      click: () => handleListingClick(listing),
                    }}
                  >
                    <Popup>
                      <div className="p-2 min-w-[200px]">
                        <h3 className="font-semibold mb-2">{listing.title}</h3>
                        {!coord && (
                          <p className="text-xs text-destructive mb-2">
                            ⚠️ Address not found - showing default location
                          </p>
                        )}
                        <div className="flex items-center gap-1 text-sm text-primary font-bold">
                          <DollarSign className="w-4 h-4" />
                          {(listing.priceCents / 100).toFixed(2)}
                        </div>
                        <Button
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => {
                            window.location.href = `/project/${listing.id}`;
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>

            {/* Map Controls */}
            <div className="absolute top-4 right-4 z-[1000] flex flex-col space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className="bg-background/90 backdrop-blur"
                data-testid="button-toggle-fullscreen"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Status Messages */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-[999]">
                <Card className="p-4">
                  <p className="text-sm">Loading map...</p>
                </Card>
              </div>
            )}
            
            {!isLoading && filteredListings.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[999]">
                <Card className="p-4 bg-background/90 backdrop-blur">
                  <p className="text-sm text-muted-foreground">
                    {mapError ? "Failed to load listings" : "No listings found in this area"}
                  </p>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
