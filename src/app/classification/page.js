"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Loader2, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const getBadgeVariant = (classification) => {
  switch (classification) {
    case 'Unsafe':
    case 'High Pollution': 
      return 'destructive';
    case 'Mid':
    case 'Moderate Pollution': 
      return 'secondary'; // This will be a shade of grey
    case 'Safe':
    case 'Low Pollution': 
      return 'default'; // This will now be the primary theme color
    default: return 'outline';
  }
};

const initialFilters = {
  page: 1,
  limit: 15,
  location: '',
  state: '',
  category: '',
  minHMPI: '',
  maxHMPI: '',
  year: '',
  metal: '',
  sortBy: 'createdAt',
  sortOrder: 'desc'
};

export default function ClassificationPage() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState(initialFilters);

  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  const handleFilterChange = (key, value) => {
    // Reset page to 1 when any filter other than 'page' changes
    setFilters(prev => ({ ...prev, [key]: value, ...(key !== 'page' && { page: 1 }) }));
  };

  // Debounce filter changes to avoid excessive API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);
    return () => clearTimeout(handler);
  }, [filters]);

  const handleClearFilters = () => {
    setFilters(initialFilters);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams(Object.fromEntries(Object.entries(debouncedFilters).filter(([, v]) => v !== '')));
        const response = await fetch(`http://localhost:5000/api/data?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const result = await response.json();
        setData(result.data);
        setPagination(result.pagination);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [debouncedFilters]);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary">Classification</h1>
        <p className="text-muted-foreground">View and analyze classified water quality data.</p>
      </div>

      {/* <Alert className="bg-primary/10 border-primary/20 text-primary">
        <Info className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          You can only view and comment on this file.
          <Button size="sm">Start editing</Button>
        </AlertDescription>
      </Alert> */}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filters & Sorting</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" placeholder="e.g., Delhi" value={filters.location} onChange={(e) => handleFilterChange('location', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input id="state" placeholder="e.g., Delhi" value={filters.state} onChange={(e) => handleFilterChange('state', e.target.value)} />
          </div>
          <div className="space-y-2 lg:col-span-1">
            <Label htmlFor="category">Category</Label>
            <Select value={filters.category} onValueChange={(v) => handleFilterChange('category', v)}>
              <SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent><SelectItem value="Safe">Safe</SelectItem><SelectItem value="Mid">Mid</SelectItem><SelectItem value="Unsafe">Unsafe</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sortBy">Sort By</Label>
            <Select value={filters.sortBy} onValueChange={(v) => handleFilterChange('sortBy', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="createdAt">Date Created</SelectItem><SelectItem value="location.name">Location Name</SelectItem><SelectItem value="pollutionIndices.hmpi.value">HMPI Value</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sortOrder">Order</Label>
            <Select value={filters.sortOrder} onValueChange={(v) => handleFilterChange('sortOrder', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="asc">Ascending</SelectItem><SelectItem value="desc">Descending</SelectItem></SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="ghost" onClick={handleClearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Location</TableHead>
                <TableHead>Latitude</TableHead>
                <TableHead>Longitude</TableHead>
                <TableHead>HMPI Value</TableHead>
                <TableHead>Classification</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-destructive">
                    Error: {error}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow key={row._id}>
                    <TableCell className="font-medium pl-6">{row.location?.name}</TableCell>
                    <TableCell>{row.coordinates?.coordinates[1]}</TableCell>
                    <TableCell>{row.coordinates?.coordinates[0]}</TableCell>
                    <TableCell>{row.pollutionIndices.hmpi.value.toFixed(2)}</TableCell>
                    <TableCell><Badge variant={getBadgeVariant(row.pollutionIndices.hmpi.category)}>{row.pollutionIndices.hmpi.category}</Badge></TableCell>
                  </TableRow>
                ))
              ) }
            </TableBody>
          </Table>
        </CardContent>
        {pagination && (
          <CardFooter className="flex items-center justify-between pt-6">
            <div className="text-sm text-muted-foreground">
              Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalRecords} records)
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleFilterChange('page', filters.page - 1)} disabled={!pagination.hasPreviousPage}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleFilterChange('page', filters.page + 1)} disabled={!pagination.hasNextPage}>
                Next
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
