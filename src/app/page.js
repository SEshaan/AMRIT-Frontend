"use client";

import Image from "next/image";
import HeatmapComponent from "./Heatmap";
import InfoSidebar from "./InfoSidebar";
import { useState } from "react";

export default function Home() {
  const [pointDetails, setPointDetails] = useState(null);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isSidebarLoading, setSidebarLoading] = useState(false);

  const handlePointSelect = async (point) => {
    
    if (!point || !point._id) return;
    

    setSidebarOpen(true);
    setSidebarLoading(true);
    setPointDetails(null); // Clear previous details

    try {
      const response = await fetch(`http://127.0.0.1:5000/api/data/heatmap/${point._id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch point details');
      }
      const result = await response.json();
      setPointDetails(result.data);
    } catch (error) {
      console.error("Error fetching details:", error);
      // Optionally, show an error state in the sidebar
    } finally {
      setSidebarLoading(false);
    }
  };

  return (
    <div className="theme-light font-sans min-h-screen w-screen h-screen relative">
      <main className="w-full h-full">
          <HeatmapComponent onPointSelect={handlePointSelect} selectedPoint={pointDetails} />
          <InfoSidebar point={pointDetails} isLoading={isSidebarLoading} isOpen={isSidebarOpen} onOpenChange={setSidebarOpen}/>
      </main>
      
      
    </div>
  );
}
