import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // Assuming you have a Badge component

const DataRow = ({ label, value, unit = '' }) => (
  <div className="flex justify-between items-center text-sm py-1">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{value} {unit}</span>
  </div>
);

const RiskBadge = ({ level }) => {
  const levelLower = level?.toLowerCase();
  let variant = 'default';
  if (levelLower === 'unsafe' || levelLower === 'high pollution' || levelLower === 'high') {
    variant = 'destructive';
  } else if (levelLower === 'moderate' || levelLower === 'moderate pollution') {
    variant = 'secondary';
  }
  return <Badge variant={variant}>{level}</Badge>;
};

const InfoSidebar = ({ point, isLoading, isOpen, onOpenChange }) => {
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="p-6 flex justify-center items-center h-full">
          <div className="flex items-center text-muted-foreground">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading details...</span>
          </div>
        </div>
      );
    }

    if (!point) {
      return <div className="p-6 text-center text-muted-foreground">No data available.</div>;
    }

    // The data from the API is the 'point' object itself.
    // The data from a direct click on the map might be nested under 'properties'.
    // We check for `point.properties` and use it, otherwise, we use the point object directly.
    const properties = point.properties ? point.properties : point;

    return (
      <div className="p-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Overall Assessment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Risk Level</span>
              <RiskBadge level={properties.pollutionIndices?.overallAssessment?.riskLevel} />
            </div>
            <div>
              <h4 className="font-semibold mt-2 mb-1">Recommendations:</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {properties.pollutionIndices?.overallAssessment?.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="pollution-indices">
            <AccordionTrigger>Pollution Indices</AccordionTrigger>
            <AccordionContent>
              {Object.entries(properties.pollutionIndices || {}).map(([key, data]) => {
                if (key === 'overallAssessment' || key === 'metalAnalysis') return null;
                return (
                  <DataRow key={key} label={key.replace(/([A-Z])/g, ' $1').toUpperCase()} value={data.value?.toFixed(2) || 'N/A'} />
                );
              })}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="env-params">
            <AccordionTrigger>Environmental Parameters</AccordionTrigger>
            <AccordionContent>
              {Object.entries(properties.environmentalParams || {}).map(([key, data]) => (
                <DataRow key={key} label={key.replace(' (µS/cm at', '')} value={data.value} unit={data.unit} />
              ))}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="metal-analysis">
            <AccordionTrigger>Metal Analysis</AccordionTrigger>
            <AccordionContent>
              <h4 className="font-semibold mb-2">Contamination Factors</h4>
              {Object.entries(properties.pollutionIndices?.metalAnalysis?.contaminationFactors || {}).map(([metal, data]) => (
                <DataRow key={metal} label={metal} value={data.value.toFixed(2)} unit={`(${data.interpretation.category})`} />
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{point?.properties?.location || point?.location?.name || 'Location Details'}</SheetTitle>
          <SheetDescription>
            {point?.location ? `${point.location.district}, ${point.location.state}` : 'Detailed water quality analysis.'}
          </SheetDescription>
        </SheetHeader>
        {renderContent()}
      </SheetContent>
    </Sheet>
  );
};

export default InfoSidebar;

// You might need to add a Badge component if you don't have one.
// Create src/components/ui/badge.jsx if it doesn't exist:
/*
import * as React from "react"
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

function Badge({ className, variant, ...props }) {
  return (<div className={cn(badgeVariants({ variant }), className)} {...props} />)
}

export { Badge, badgeVariants }
*/