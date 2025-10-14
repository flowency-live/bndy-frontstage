// ⚠️ NEVER USE FIREBASE AGAIN - ALL DATA IS IN DYNAMODB
// This admin table is LEGACY and will be replaced - DO NOT USE or extend
// DO NOT FIX Firebase errors - this is intentionally deprecated
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Venue } from "@/lib/types";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/config/firebase";
import { COLLECTIONS } from "@/lib/constants";
import Link from "next/link";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function VenuesTable() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [selectedVenues, setSelectedVenues] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    if (!db) {
      setLoading(false);
      return;
    }

    const firestore = db;
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(firestore, COLLECTIONS.VENUES));
      const venueData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Venue[];
      setVenues(venueData);
    } catch (error) {
      console.error("Error fetching venues:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter venues based on search term and filter type
  const filteredVenues = venues.filter((venue) => {
    const matchesSearch = 
      searchTerm === "" || 
      venue.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === "missing-facebook") {
      const hasFacebookUrl = venue.socialMediaURLs?.some(sm => 
        sm.platform === "facebook" && sm.url && sm.url.trim() !== ""
      );
      return matchesSearch && !hasFacebookUrl;
    }
    return matchesSearch;
  });

  // Compute duplicate counts by name (case-insensitive)
  const duplicateCounts = filteredVenues.reduce<Record<string, number>>((acc, venue) => {
    const key = (venue.name || "").trim().toLowerCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  // Get the Facebook URL for display
  const getSocialMediaUrl = (venue: Venue, platform: string): string => {
    return venue.socialMediaURLs?.find(sm => sm.platform === platform)?.url || "Not set";
  };

  // Selection handling
  const handleSelect = (id: string) => {
    setSelectedVenues((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedVenues.size === filteredVenues.length) {
      setSelectedVenues(new Set());
    } else {
      setSelectedVenues(new Set(filteredVenues.map((venue) => venue.id)));
    }
  };

  const handleBatchDelete = async () => {
    if (!db) return;

    const firestore = db;
    try {
      await Promise.all(
        [...selectedVenues].map((id) => deleteDoc(doc(firestore, COLLECTIONS.VENUES, id)))
      );
      setSelectedVenues(new Set());
      setConfirmDelete(false);
      fetchVenues();
    } catch (error) {
      console.error("Error deleting venues:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Venues</h2>
        <Link href="/admin/venues/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Venue
          </Button>
        </Link>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search venues..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Venues</SelectItem>
            <SelectItem value="missing-facebook">Missing Facebook URL</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedVenues.size > 0 && (
        <div className="mb-4">
          <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
            Delete Selected ({selectedVenues.size})
          </Button>
        </div>
      )}
      
      <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 250px)" }}>
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead>
                <Checkbox
                  checked={
                    selectedVenues.size === filteredVenues.length &&
                    filteredVenues.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Facebook URL</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading venues...
                </TableCell>
              </TableRow>
            ) : filteredVenues.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No venues found
                </TableCell>
              </TableRow>
            ) : (
              filteredVenues.map((venue, index) => {
                const key = (venue.name || "").trim().toLowerCase();
                const isDuplicate = duplicateCounts[key] > 1;
                return (
                  <TableRow
                    key={venue.id || `venue-${index}`}
                    className={isDuplicate ? "bg-yellow-50 dark:bg-yellow-900/20" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedVenues.has(venue.id)}
                        onCheckedChange={() => handleSelect(venue.id)}
                      />
                    </TableCell>
                    <TableCell>
                      {venue.name} {isDuplicate && <span className="text-xs text-red-600 dark:text-red-400">(Duplicate)</span>}
                    </TableCell>
                    <TableCell>{venue.address || "Not set"}</TableCell>
                    <TableCell>{getSocialMediaUrl(venue, "facebook")}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Link href={`/admin/venues/${venue.id}`} passHref>
                          <Button variant="outline" size="sm" className="hover:bg-primary/10">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setSelectedVenues(new Set([venue.id]));
                            setConfirmDelete(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={() => setConfirmDelete(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedVenues.size} venue(s). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBatchDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}