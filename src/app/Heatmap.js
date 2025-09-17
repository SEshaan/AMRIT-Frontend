"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { MapView, WebMercatorViewport } from '@deck.gl/core';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { GeoJsonLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { useDebounce } from 'use-debounce';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
// Data source for Indian states GeoJSON
const INDIA_GEOJSON_URL = 'https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson';

// The zoom level to switch from heatmap to scatterplot
const SCATTERPLOT_VISIBLE_ZOOM = 8;

// Viewport settings
const INITIAL_VIEW_STATE = {
    longitude: 82.75,
    latitude: 23.8,
    zoom: 3.8,
    pitch: 0,
    bearing: 0
};

const StatsDisplay = ({ stats }) => {
  if (!stats) {
    return <div className="text-sm text-muted-foreground p-2">Loading stats...</div>;
  }

  const sortedCategories = useMemo(() => {
    if (!stats.categoryDistribution) return [];
    const categoryOrder = { 'Safe': 1, 'Mid': 2, 'Unsafe': 3 };
    return [...stats.categoryDistribution].sort((a, b) => {
      return (categoryOrder[a._id] || 99) - (categoryOrder[b._id] || 99);
    });
  }, [stats.categoryDistribution]);

  return (
    <div className="space-y-4 text-sm">
      <div>
        <h4 className="font-semibold mb-2">Category Distribution</h4>
        <div className="space-y-1">
          {sortedCategories.map((cat) => (
            <div key={cat._id} className="flex justify-between p-2 bg-muted/50 rounded-md">
              <span className={`font-medium ${cat._id === 'Unsafe' ? 'text-red-500' : 'text-green-600'}`}>{cat._id}</span>
              <span className="font-bold">{cat.count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-2">Metal Statistics</h4>
        <div className="space-y-1">
          {stats.metalStatistics.map((metal) => (
            <div key={metal._id} className="p-2 bg-muted/50 rounded-md">
              <div className="flex justify-between font-medium">
                <span>{metal._id}</span>
                <span>{metal.count.toLocaleString()} points</span>
              </div>
              <div className="text-xs text-muted-foreground flex justify-between mt-1">
                <span>Avg: {metal.avgValue.toFixed(2)}</span>
                <span>Max: {metal.maxValue}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* {stats.yearlyTrends && stats.yearlyTrends.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">Yearly Trends</h4>
          <div className="space-y-1">
            {stats.yearlyTrends.map((trend) => (
              <div key={trend._id} className="p-2 bg-muted/50 rounded-md">
                <div className="flex justify-between font-medium">
                  <span>{trend._id}</span>
                  <span>{trend.count.toLocaleString()} points</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )} */}
    </div>
  );
};

const FilterPanel = ({ filters, onFilterChange, statsData }) => {
  const handleMetalChange = (index, field, value) => {
    const newMetals = [...filters.metals];
    newMetals[index][field] = value;
    onFilterChange('metals', newMetals);
  };

  const addMetalFilter = () => {
    onFilterChange('metals', [...filters.metals, { metal: '', min: '', max: '' }]);
  };

  const removeMetalFilter = (index) => {
    onFilterChange('metals', filters.metals.filter((_, i) => i !== index));
  };

  const handleEnvChange = (index, field, value) => {
    const newEnv = [...filters.env];
    newEnv[index][field] = value;
    onFilterChange('env', newEnv);
  };

  const addEnvFilter = () => {
    onFilterChange('env', [...filters.env, { param: '', min: '', max: '' }]);
  };

  const removeEnvFilter = (index) => {
    onFilterChange('env', filters.env.filter((_, i) => i !== index));
  };

  return (
    <Card className="absolute top-5 left-5 z-10 w-96 max-h-[calc(100vh-40px)] flex flex-col">
      <CardHeader>
        <div className="flex h-16 shrink-0 items-center gap-x-3 -mt-2">
          <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
          <div>
            <h2 className="font-bold text-lg text-primary">AMRIT</h2>
            <p className="text-sm text-muted-foreground">Water Quality Dashboard</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto">
        <Accordion type="multiple" defaultValue={['statistics']} className="w-full">
          <AccordionItem value="statistics">
            <AccordionTrigger>Statistics</AccordionTrigger>
            <AccordionContent><StatsDisplay stats={statsData} /></AccordionContent>
          </AccordionItem>

          {/* <AccordionItem value="time">
            <AccordionTrigger>Time Range</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input 
                  type="number" 
                  placeholder="e.g., 2023" 
                  value={filters.year || ''} 
                  onChange={(e) => onFilterChange('year', e.target.value)}
                />
              </div>
              <div className="space-y-2 mt-4">
                <Label>Date Range</Label>
                <div className="flex items-center space-x-2">
                  <Input 
                    type="date" 
                    value={filters.dateRange[0] || ''} 
                    onChange={(e) => onFilterChange('dateRange', [e.target.value, filters.dateRange[1]])}
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input 
                    type="date" 
                    value={filters.dateRange[1] || ''}
                    onChange={(e) => onFilterChange('dateRange', [filters.dateRange[0], e.target.value])}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="metals">
            <AccordionTrigger>Heavy Metals</AccordionTrigger>
            <AccordionContent className="space-y-3">
              {filters.metals.map((filter, index) => (
                <div key={index} className="p-2 border rounded-md space-y-2">
                  <Select value={filter.metal} onValueChange={(value) => handleMetalChange(index, 'metal', value)}>
                    <SelectTrigger><SelectValue placeholder="Select Metal" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fe">Iron (Fe)</SelectItem>
                      <SelectItem value="As">Arsenic (As)</SelectItem>
                      <SelectItem value="Pb">Lead (Pb)</SelectItem>
                      <SelectItem value="F">Fluoride (F)</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Input type="number" placeholder="Min" value={filter.min} onChange={(e) => handleMetalChange(index, 'min', e.target.value)} />
                    <Input type="number" placeholder="Max" value={filter.max} onChange={(e) => handleMetalChange(index, 'max', e.target.value)} />
                    <Button variant="ghost" size="icon" onClick={() => removeMetalFilter(index)}>&times;</Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addMetalFilter} className="w-full">Add Metal Filter</Button>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="environmental">
            <AccordionTrigger>Environmental Parameters</AccordionTrigger>
            <AccordionContent className="space-y-3">
              {filters.env.map((filter, index) => (
                <div key={index} className="p-2 border rounded-md space-y-2">
                  <Select value={filter.param} onValueChange={(value) => handleEnvChange(index, 'param', value)}>
                    <SelectTrigger><SelectValue placeholder="Select Parameter" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pH">pH</SelectItem>
                      <SelectItem value="EC">Electrical Conductivity (EC)</SelectItem>
                      <SelectItem value="TDS">Total Dissolved Solids (TDS)</SelectItem>
                      <SelectItem value="Total Hardness">Total Hardness</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Input type="number" placeholder="Min" value={filter.min} onChange={(e) => handleEnvChange(index, 'min', e.target.value)} />
                    <Input type="number" placeholder="Max" value={filter.max} onChange={(e) => handleEnvChange(index, 'max', e.target.value)} />
                    <Button variant="ghost" size="icon" onClick={() => removeEnvFilter(index)}>&times;</Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addEnvFilter} className="w-full">Add Env. Filter</Button>
            </AccordionContent>
          </AccordionItem> */}

        </Accordion>
      </CardContent>
    </Card>
  );
};

const Plot_Color_Mappings = {
    hmpi:{
        "unsafe": [255, 0, 0, 200],
        "mid": [255, 255, 0, 200],
        "safe": [0, 128, 0, 200]
    }
}

const HeatmapComponent = ({ onPointSelect, selectedPoint }) => {
    const [indiaData, setIndiaData] = useState(null);
    const [heatmapData, setHeatmapData] = useState([]);
    const [hoverInfo, setHoverInfo] = useState(null);
    const [internalViewState, setInternalViewState] = useState(INITIAL_VIEW_STATE);
    const [isLoading, setIsLoading] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [nextHeatmapData, setNextHeatmapData] = useState(null);
    const [statsData, setStatsData] = useState(null);
    const [filters, setFilters] = useState({
        metals: [],
        env: [],
        year: '',
        dateRange: [null, null],
    });

    const [debouncedFilters] = useDebounce(filters, 500);
    const [debouncedViewState] = useDebounce(internalViewState, 500);


    // Helper function to fetch and update heatmap data
    const retrieveAndUpdateHeatmap = useCallback(async (bounds, aggregate, zoom, currentFilters) => {
        try {
            const params = new URLSearchParams();
            if (bounds) {
                params.set('sw_lng', bounds[0]);
                params.set('sw_lat', bounds[1]);
                params.set('ne_lng', bounds[2]);
                params.set('ne_lat', bounds[3]);
            }
            params.set('aggregate', aggregate.toString());
            if (zoom) {
                params.set('zoom', zoom);
            }

            // Add filters to params
            if (currentFilters.year) {
                params.set('year', currentFilters.year);
            }
            currentFilters.metals.forEach(metalFilter => {
                if (metalFilter.metal && (metalFilter.min || metalFilter.max)) {
                    if (metalFilter.min) params.set(`metals[${metalFilter.metal}][min]`, metalFilter.min);
                    if (metalFilter.max) params.set(`metals[${metalFilter.metal}][max]`, metalFilter.max);
                }
            });
            currentFilters.env.forEach(envFilter => {
                if (envFilter.param && (envFilter.min || envFilter.max)) {
                    if (envFilter.min) params.set(`env[${envFilter.param}][min]`, envFilter.min);
                    if (envFilter.max) params.set(`env[${envFilter.param}][max]`, envFilter.max);
                }
            });
            
            const url = `http://localhost:5000/api/data/heatmap?${params.toString()}`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Network response was not ok for heatmap data');
            }
            const geojsonData = await response.json();
            const features = geojsonData.features || geojsonData.data?.features || [];
            // Filter out features with invalid coordinates
            const validFeatures = (features || []).filter(
                feature => feature.geometry && Array.isArray(feature.geometry.coordinates) && feature.geometry.coordinates.every(c => c !== null)
            );

            return { data: validFeatures, error: null };
        } catch (error) {
            console.error('Error fetching heatmap data:', error);
            return { data: null, error };
        } 
    }, []);

    const retrieveAndUpdateStats = useCallback(async (bounds, currentFilters) => {
        try {
            const params = new URLSearchParams();
            if (bounds) {
                params.set('sw_lng', bounds[0]);
                params.set('sw_lat', bounds[1]);
                params.set('ne_lng', bounds[2]);
                params.set('ne_lat', bounds[3]);
            }

            // Add filters to params
            if (currentFilters.year) {
                params.set('year', currentFilters.year);
            }
            currentFilters.metals.forEach(metalFilter => {
                if (metalFilter.metal && (metalFilter.min || metalFilter.max)) {
                    if (metalFilter.min) params.set(`metals[${metalFilter.metal}][min]`, metalFilter.min);
                    if (metalFilter.max) params.set(`metals[${metalFilter.metal}][max]`, metalFilter.max);
                }
            });
            currentFilters.env.forEach(envFilter => {
                if (envFilter.param && (envFilter.min || envFilter.max)) {
                    if (envFilter.min) params.set(`env[${envFilter.param}][min]`, envFilter.min);
                    if (envFilter.max) params.set(`env[${envFilter.param}][max]`, envFilter.max);
                }
            });
            
            const url = `http://localhost:5000/api/data/stats?${params.toString()}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok for stats data');
            const result = await response.json();
            setStatsData(result.data);
        } catch (error) {
            console.error('Error fetching stats data:', error);
            setStatsData(null);
        }
    }, []);
    useEffect(() => {
        setIsLoading(true);
        // Fetch India map GeoJSON
        fetch(INDIA_GEOJSON_URL)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                setIndiaData(data);
            })
            .catch(error => {
                console.error('Error fetching GeoJSON:', error);
            });
    }, []); // This effect now only fetches the static map data once.

    // Effect to fetch data when the debounced view state changes
    useEffect(() => {
        if (!indiaData) return; // Don't fetch until map outline is ready

        const fetchDataForView = async () => {
            setIsLoading(true);

            const viewport = new WebMercatorViewport(debouncedViewState);
            const bounds = viewport.getBounds();
            const isHeatmapView = debouncedViewState.zoom <= SCATTERPLOT_VISIBLE_ZOOM;

            const previousZoom = internalViewState.zoom;
            const wasHeatmapView = previousZoom <= SCATTERPLOT_VISIBLE_ZOOM;

            if (isHeatmapView !== wasHeatmapView) {
                setIsTransitioning(true);
            }
            
            const result = await retrieveAndUpdateHeatmap(bounds, isHeatmapView, debouncedViewState.zoom, debouncedFilters);
            
            if (result.data) {
                setHeatmapData(result.data);
            }
            // If there was an error, we simply don't update the data, keeping the old data on screen.

            setIsLoading(false);
            setIsTransitioning(false);
        };

        fetchDataForView();
        retrieveAndUpdateStats(new WebMercatorViewport(debouncedViewState).getBounds(), debouncedFilters);
    }, [debouncedViewState, debouncedFilters, retrieveAndUpdateHeatmap, retrieveAndUpdateStats, indiaData]);

    // Filter out aggregated data for the scatterplot
    const scatterplotData = useMemo(() => {
        return internalViewState.zoom > SCATTERPLOT_VISIBLE_ZOOM
            ? heatmapData.filter(d => d.properties.category !== 'Aggregated')
            : [];
    }, [heatmapData, internalViewState.zoom]);

    const handleFilterChange = useCallback((filterName, value) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            [filterName]: value
        }));
    }, []);

    const layers = [
        // Layer for the flat map of India
        new GeoJsonLayer({
            id: 'india-map',
            data: indiaData,
            // Styles
            filled: true,
            getFillColor: [200, 200, 200, 150], // Light grey fill
            stroked: true,
            getLineColor: [100, 100, 100, 255], // Darker grey outline
            lineWidthMinPixels: 1,
        }),
        // Layer for the heatmap
        new HeatmapLayer({
            id: 'heatmapLayer',
            data: heatmapData,
            visible: internalViewState.zoom <= SCATTERPLOT_VISIBLE_ZOOM && !isTransitioning,
            getPosition: d => d.geometry.coordinates,
            getWeight: d => d.properties.value,
            radiusPixels: 60,
            intensity: 1,
            threshold: 0.03,
            pickable: true,
            onClick: (info) => {
                // When clicking a heatmap area, it returns an array of points.
                // We'll select the first point in the array to show its details.
                console.log(info);
                
                const point = info.object?.points?.[0];
                if (point) {
                    // The point from the heatmap is the full GeoJSON feature
                    onPointSelect(point);
                }
            }
        }),
        // Layer for the individual points, visible on zoom
        new ScatterplotLayer({
            id: 'scatterplotLayer',
            data: scatterplotData,
            idAccessor: d => d.properties._id, // Use _id for unique identification
            visible: internalViewState.zoom > SCATTERPLOT_VISIBLE_ZOOM && !isTransitioning,
            getPosition: d => d.geometry.coordinates,
            getFillColor: d => Plot_Color_Mappings['hmpi'][d.properties.category.toLowerCase()] || [0,0,0,200],
            getRadius: d => d.properties.value/5,
            radiusScale: 50,
            radiusMinPixels: 3,
            radiusMaxPixels: 25,
            pickable: true,
            onHover: info => setHoverInfo(info),
            onClick: info => {onPointSelect(info.object); console.log(info);}
        }),
        // Layer for labels, visible on zoom
        new TextLayer({
            id: 'text-layer',
            data: scatterplotData.filter(d => {
                // At zoom level 8, only show labels for non-unsafe points
                if (Math.round(internalViewState.zoom) <= SCATTERPLOT_VISIBLE_ZOOM + 1) {
                    return d.properties.category.toLowerCase() == 'unsafe';
                }
                // For other zoom levels (greater than 8), show all labels
                return true;
            }),
            visible: internalViewState.zoom >= SCATTERPLOT_VISIBLE_ZOOM && !isTransitioning,
            getPosition: d => d.geometry.coordinates,
            getText: d => d.properties.location,
            getSize: 12,
            getAngle: 0,
            getTextAnchor: 'middle',
            getAlignmentBaseline: 'top',
            getPixelOffset: [0, 15],
            getColor: [0, 0, 0, 200],
            backgroundColor: [255, 255, 255, 150],
            backgroundPadding: [4, 4]
        }),
        // Layer to highlight the selected point
        new ScatterplotLayer({
            id: 'selected-point-highlight',
            data: selectedPoint ? [selectedPoint] : [],
            // The selectedPoint can be a GeoJSON feature (with d.geometry)
            // or the detailed object from the API (with d.properties.geometry).
            // We need to handle both structures.
            getPosition: d => d.geometry?.coordinates || d.properties?.geometry?.coordinates,
            getFillColor: [255, 255, 0, 0], // Transparent fill
            getLineColor: [255, 0, 0, 255], // Red outline
            getLineWidth: 16,
            lineWidthMinPixels: 2,
            lineWidthMaxPixels: 4,
            stroked: true,
            filled: false,
            radiusScale: 80,
            getRadius: 1,
        })
    ];

    const getTooltip = ({ object }) => {
        if (!object) {
            return null;
        }
        const { location, value } = object.properties;
        return {
            text: `Location: ${location}\nValue: ${value.toFixed(2)}`,
            style: {
                backgroundColor: 'black',
                color: 'white',
                fontSize: '0.8em',
                padding: '4px 8px',
                borderRadius: '4px'
            }
        };
    };


    console.log(isLoading, indiaData);
    
    return (
        <>
            {(isLoading && !indiaData) && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-20">
                    <div className="flex items-center text-primary">
                        <svg className="animate-spin -ml-1 mr-3 h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-lg">Loading Map...</span>
                    </div>
                </div>
            )}
        <React.Fragment>
            <FilterPanel filters={filters} onFilterChange={handleFilterChange} statsData={statsData} />
            <DeckGL
                viewState={internalViewState}
                onViewStateChange={({ viewState }) => setInternalViewState(viewState)}
                controller={true}
                layers={layers}
                getTooltip={getTooltip}
            >
                <MapView id="map" controller={true} />
            </DeckGL>
            {isLoading && (
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm text-foreground text-sm px-4 py-2 rounded-full flex items-center shadow-lg z-10 animate-pulse">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading Data...</span>
                </div>
            )}
        </React.Fragment>
      </>
    );
};

export default HeatmapComponent;