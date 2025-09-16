"use client";

import React, { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { MapView } from '@deck.gl/core';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { GeoJsonLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';

// Data source for Indian states GeoJSON
const INDIA_GEOJSON_URL = 'https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson';

// The zoom level to switch from heatmap to scatterplot
const SCATTERPLOT_VISIBLE_ZOOM = 6;

// Viewport settings
const INITIAL_VIEW_STATE = {
    longitude: 82.75,
    latitude: 23.8,
    zoom: 3.8,
    pitch: 0,
    bearing: 0
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
    const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);

    // Helper function to fetch and update heatmap data
    const retrieveAndUpdateHeatmap = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/data/heatmap`);
            if (!response.ok) {
                throw new Error('Network response was not ok for heatmap data');
            }
            const geojsonData = await response.json();
            // Filter out features with invalid coordinates
            const validFeatures = geojsonData.features.filter(
                feature => feature.geometry && Array.isArray(feature.geometry.coordinates) && feature.geometry.coordinates.every(c => c !== null)
            );
            setHeatmapData(validFeatures);
        } catch (error) {
            console.error('Error fetching heatmap data:', error);
        }
    };

    useEffect(() => {
        // Fetch India map GeoJSON
        fetch(INDIA_GEOJSON_URL)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => setIndiaData(data))
            .catch(error => console.error('Error fetching GeoJSON:', error));

        // Fetch heatmap data
        retrieveAndUpdateHeatmap();
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
            visible: viewState.zoom <= SCATTERPLOT_VISIBLE_ZOOM,
            getPosition: d => d.geometry.coordinates,
            getWeight: d => d.properties.value,
            radiusPixels: 60,
            intensity: 1,
            threshold: 0.03,
            pickable: true,
            onClick: (info) => {
                // When clicking a heatmap area, it returns an array of points.
                // We'll select the first point in the array to show its details.
                if (info.object && info.object.points && info.object.points.length > 0) {
                    onPointSelect(info.object.points[0]);
                }
            }
        }),
        // Layer for the individual points, visible on zoom
        new ScatterplotLayer({
            id: 'scatterplotLayer',
            data: heatmapData,
            idAccessor: d => d.properties._id, // Use _id for unique identification
            visible: viewState.zoom > SCATTERPLOT_VISIBLE_ZOOM,
            getPosition: d => d.geometry.coordinates,
            getFillColor: d => Plot_Color_Mappings['hmpi'][d.properties.category.toLowerCase()] || [0,0,0,200],
            getRadius: d => d.properties.value/5,
            radiusScale: 50,
            radiusMinPixels: 3,
            radiusMaxPixels: 25,
            pickable: true,
            onHover: info => setHoverInfo(info),
            onClick: info => onPointSelect(info.object)
        }),
        // Layer for labels, visible on zoom
        new TextLayer({
            id: 'text-layer',
            data: heatmapData,
            visible: viewState.zoom > SCATTERPLOT_VISIBLE_ZOOM,
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
            getPosition: d => d.coordinates.coordinates,
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

    return (
        <DeckGL
            viewState={viewState}
            onViewStateChange={({ viewState }) => setViewState(viewState)}
            controller={true}
            layers={layers}
            getTooltip={getTooltip}
        >
            <MapView id="map" width="100%" height="100%" controller={true} />
        </DeckGL>
    );
};

export default HeatmapComponent;