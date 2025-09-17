"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UploadCloud, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from "sonner"

export default function UploadPage() {
    const [view, setView] = useState('upload'); // 'upload' or 'manual'
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    // Manual form state
    const [manualData, setManualData] = useState({
        latitude: '',
        longitude: '',
        city: '',
        district: '',
        metals: []
    });
    const [currentMetal, setCurrentMetal] = useState({ metal: '', percentage: '' });

    const handleFileValidation = (incomingFiles) => {
        const allowedExtensions = ['.xlsx', '.xls'];
        const validFiles = [];
        const invalidFiles = [];

        Array.from(incomingFiles).forEach(file => {
            const extension = '.' + file.name.split('.').pop().toLowerCase();
            if (allowedExtensions.includes(extension)) {
                validFiles.push(file);
            } else {
                invalidFiles.push(file.name);
            }
        });

        if (invalidFiles.length > 0) {
            alert(`Invalid file type(s): ${invalidFiles.join(', ')}\nAllowed types: .xlsx, .xls`);
        }

        return validFiles;
    };

    const handleFileChange = (e) => {
        if (e.target.files) {
            const newFiles = handleFileValidation(e.target.files);
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const handleDrop = (e) => {
        handleDragEvents(e, false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const newFiles = handleFileValidation(e.dataTransfer.files);
            setFiles(prev => [...prev, ...newFiles]);
            e.dataTransfer.clearData();
        }
    };

    const handleUpload = async () => {
        if (files.length === 0) return;
        setIsUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        files.forEach(file => {
            formData.append('file', file);
        });

        try {
            const response = await fetch('http://localhost:5000/api/data/upload', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'File upload failed');
            }

            toast.success("Upload successful!", {
                description: `${result.processedCount} rows have been processed.`,
            });
            setFiles([]);
        } catch (error) {
            console.error('Upload error:', error);
            toast.error("Upload failed", {
                description: error.message || "An unknown error occurred.",
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleManualInputChange = (e) => {
        const { name, value } = e.target;
        setManualData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddMetal = () => {
        if (currentMetal.metal && currentMetal.percentage) {
            setManualData(prev => ({
                ...prev,
                metals: [...prev.metals, currentMetal]
            }));
            setCurrentMetal({ metal: '', percentage: '' });
        }
    };

    const handleRemoveMetal = (index) => {
        setManualData(prev => ({
            ...prev,
            metals: prev.metals.filter((_, i) => i !== index)
        }));
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        setIsUploading(true);
        try {
            const response = await fetch('http://localhost:5000/api/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(manualData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to submit data');
            }

            toast.success("Data submitted successfully!");
            setManualData({ latitude: '', longitude: '', city: '', district: '', metals: [] });
        } catch (error) {
            console.error('Manual submission error:', error);
            toast.error("Submission failed", {
                description: error.message || "An unknown error occurred.",
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-primary">Upload Data</h1>
                <p className="text-muted-foreground">Upload your .xlsx or .xls files, or add data manually.</p>
            </div>

            {view === 'upload' ? (
                <Card>
                    <CardContent className="space-y-6">
                        <div
                            onDragEnter={(e) => handleDragEvents(e, true)}
                            onDragLeave={(e) => handleDragEvents(e, false)}
                            onDragOver={(e) => handleDragEvents(e, true)}
                            onDrop={handleDrop}
                            className={cn(
                                "flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg transition-colors",
                                isDragging ? "border-primary bg-accent" : "border-border"
                            )}
                        >
                            <UploadCloud className={cn("h-12 w-12", isDragging ? "text-primary" : "text-muted-foreground")} />
                            <p className="mt-4 text-center text-muted-foreground">Drag and drop your files here</p>
                            <p className="text-sm text-muted-foreground">or</p>
                            <Button asChild variant="outline" className="mt-2">
                                <label htmlFor="file-upload">
                                    Choose files
                                    <input id="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} accept=".xlsx,.xls" />
                                </label>
                            </Button>
                        </div>
                        {files.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="font-medium">Selected files:</h4>
                                <ul className="space-y-1 list-disc list-inside">
                                    {files.map((file, i) => <li key={i} className="text-sm">{file.name}</li>)}
                                </ul>
                                <Button onClick={handleUpload} disabled={isUploading}>
                                    {isUploading ? 'Uploading...' : 'Upload'}
                                </Button>
                            </div>
                        )}
                        {isUploading && (
                            <div className="w-full bg-muted rounded-full h-2.5">
                                <div className="bg-primary h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                            </div>
                        )}
                        {/* <div className="text-center">
                            <Button variant="link" onClick={() => setView('manual')}>Add Data Manually</Button>
                        </div> */}
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Manual Data Entry</CardTitle>
                        <CardDescription>Enter details for a single data point.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleManualSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label htmlFor="latitude">Latitude</Label><Input id="latitude" name="latitude" value={manualData.latitude} onChange={handleManualInputChange} placeholder="e.g., 28.6139" /></div>
                                <div className="space-y-2"><Label htmlFor="longitude">Longitude</Label><Input id="longitude" name="longitude" value={manualData.longitude} onChange={handleManualInputChange} placeholder="e.g., 77.2090" /></div>
                                <div className="space-y-2"><Label htmlFor="city">City</Label><Input id="city" name="city" value={manualData.city} onChange={handleManualInputChange} placeholder="e.g., Delhi" /></div>
                                <div className="space-y-2"><Label htmlFor="district">District</Label><Input id="district" name="district" value={manualData.district} onChange={handleManualInputChange} placeholder="e.g., New Delhi" /></div>
                            </div>

                            <div className="space-y-4 p-4 border rounded-lg">
                                <h4 className="font-medium">Metal Pollution Entries</h4>
                                <div className="flex items-end gap-2">
                                    <div className="flex-1 space-y-2"><Label>Select Metal</Label><Select value={currentMetal.metal} onValueChange={(v) => setCurrentMetal(p => ({ ...p, metal: v }))}><SelectTrigger><SelectValue placeholder="Select Metal" /></SelectTrigger><SelectContent><SelectItem value="Fe">Iron (Fe)</SelectItem><SelectItem value="As">Arsenic (As)</SelectItem><SelectItem value="Pb">Lead (Pb)</SelectItem><SelectItem value="F">Fluoride (F)</SelectItem></SelectContent></Select></div>
                                    <div className="flex-1 space-y-2"><Label>Percentage</Label><Input type="number" placeholder="e.g., 0.5" value={currentMetal.percentage} onChange={(e) => setCurrentMetal(p => ({ ...p, percentage: e.target.value }))} /></div>
                                    <Button type="button" onClick={handleAddMetal}>Add Metal</Button>
                                </div>
                                {manualData.metals.length > 0 && (
                                    <div className="space-y-2 pt-4">
                                        {manualData.metals.map((m, i) => (<div key={i} className="flex justify-between items-center p-2 bg-muted rounded-md text-sm"><p>{m.metal}: <span className="font-semibold">{m.percentage}%</span></p><Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveMetal(i)}><Trash2 className="h-4 w-4" /></Button></div>))}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between items-center pt-4">
                                <Button type="submit" disabled={isUploading}>{isUploading ? 'Submitting...' : 'Submit Data'}</Button>
                                <Button variant="link" onClick={() => setView('upload')}>Switch to File Upload</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}