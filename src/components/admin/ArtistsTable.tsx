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
import { Artist } from "@/lib/types";
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

export function ArtistsTable() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [selectedArtists, setSelectedArtists] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    if (!db) {
      setLoading(false);
      return;
    }

    const firestore = db;
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(firestore, COLLECTIONS.ARTISTS));
      const artistData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Artist[];
      setArtists(artistData);
    } catch (error) {
      console.error("Error fetching artists:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredArtists = artists.filter((artist) => {
    const matchesSearch = 
      searchTerm === "" || 
      artist.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artist.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === "missing-facebook") {
      const hasFacebookUrl = artist.socialMediaURLs?.some(sm => 
        sm.platform === "facebook" && sm.url && sm.url.trim() !== ""
      );
      return matchesSearch && !hasFacebookUrl;
    }
    return matchesSearch;
  });

  // Compute duplicate counts by name
  const duplicateCounts = filteredArtists.reduce<Record<string, number>>((acc, artist) => {
    const key = (artist.name || "").trim().toLowerCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const getSocialMediaUrl = (artist: Artist, platform: string): string => {
    return artist.socialMediaURLs?.find(sm => sm.platform === platform)?.url || "Not set";
  };

  // Selection handling
  const handleSelect = (id: string) => {
    setSelectedArtists((prev) => {
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
    if (selectedArtists.size === filteredArtists.length) {
      setSelectedArtists(new Set());
    } else {
      setSelectedArtists(new Set(filteredArtists.map((artist) => artist.id)));
    }
  };

  const handleBatchDelete = async () => {
    if (!db) return;

    const firestore = db;
    try {
      await Promise.all(
        [...selectedArtists].map((id) => deleteDoc(doc(firestore, COLLECTIONS.ARTISTS, id)))
      );
      setSelectedArtists(new Set());
      setConfirmDelete(false);
      fetchArtists();
    } catch (error) {
      console.error("Error deleting artists:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Artists</h2>
        <Link href="/admin/artists/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Artist
          </Button>
        </Link>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search artists..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Artists</SelectItem>
            <SelectItem value="missing-facebook">Missing Facebook URL</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedArtists.size > 0 && (
        <div className="mb-4">
          <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
            Delete Selected ({selectedArtists.size})
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
                    selectedArtists.size === filteredArtists.length &&
                    filteredArtists.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Facebook URL</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading artists...
                </TableCell>
              </TableRow>
            ) : filteredArtists.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No artists found
                </TableCell>
              </TableRow>
            ) : (
              filteredArtists.map((artist, index) => {
                const key = (artist.name || "").trim().toLowerCase();
                const isDuplicate = duplicateCounts[key] > 1;
                return (
                  <TableRow
                    key={artist.id || `artist-${index}`}
                    className={isDuplicate ? "bg-yellow-50 dark:bg-yellow-900/20" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedArtists.has(artist.id)}
                        onCheckedChange={() => handleSelect(artist.id)}
                      />
                    </TableCell>
                    <TableCell>
                      {artist.name} {isDuplicate && <span className="text-xs text-red-600 dark:text-red-400">(Duplicate)</span>}
                    </TableCell>
                    <TableCell>{artist.location || "Not set"}</TableCell>
                    <TableCell>{getSocialMediaUrl(artist, "facebook")}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Link href={`/admin/artists/${artist.id}`} passHref>
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
                            setSelectedArtists(new Set([artist.id]));
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
              This will permanently delete {selectedArtists.size} artist(s). This action cannot be undone.
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