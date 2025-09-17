"use client";

import HeatmapComponent from "@/app/Heatmap";
import InfoSidebar from "@/app/InfoSidebar";
import { useState } from "react";

export default function Home() {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarLoading, setSidebarLoading] = useState(false);

  const handlePointSelect = async (point) => {
    // The point object from deck.gl might have the data nested in `properties`
    const pointData = point;
    

    if (!pointData || !pointData._id) return;

    setSidebarOpen(true);
    setSidebarLoading(true);
    setSelectedPoint(null); // Clear previous details

    try {
      const response = await fetch(`http://127.0.0.1:5000/api/data/heatmap/${pointData._id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch point details');
      }
      const result = await response.json();
      setSelectedPoint(result.data);
    } catch (error) {
      console.error("Error fetching details:", error);
      // Optionally, show an error state in the sidebar
    } finally {
      setSidebarLoading(false);
    }
  };

  return (
    <div className="theme-light font-sans w-full h-screen relative">
      <HeatmapComponent onPointSelect={handlePointSelect} selectedPoint={selectedPoint} />
      <InfoSidebar point={selectedPoint} isLoading={isSidebarLoading} isOpen={isSidebarOpen} onOpenChange={setSidebarOpen}/>
    </div>
  );
}
