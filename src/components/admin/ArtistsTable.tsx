// /components/admin/ArtistsTable.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { collection, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/config/firebase";
import { COLLECTIONS } from "@/lib/constants";
import { Pencil, Trash2, Save, X } from "lucide-react";
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

interface Artist {
  id: string;
  name: string;
  genres?: string[];
  facebookUrl?: string;
  instagramUrl?: string;
  spotifyUrl?: string;
  websiteUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export function ArtistsTable() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Artist>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadArtists();
  }, []);

  const loadArtists = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.ARTISTS));
      const artistData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Artist[];

      // Sort artists by name
      const sortedArtists = artistData.sort((a, b) =>
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      );
      setArtists(sortedArtists);
    } catch (error) {
      console.error("Error loading artists:", error);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (artist: Artist) => {
    setEditingId(artist.id);
    setEditData(artist);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEditing = async (id: string) => {
    setLoading(true);
    try {
      const artistRef = doc(db, COLLECTIONS.ARTISTS, id);
      await updateDoc(artistRef, {
        ...editData,
        updatedAt: new Date().toISOString(),
      });
      cancelEditing();
      loadArtists();
    } catch (error) {
      console.error("Error updating artist:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteArtist = async (id: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, COLLECTIONS.ARTISTS, id));
      setDeleteConfirmId(null);
      loadArtists();
    } catch (error) {
      console.error("Error deleting artist:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter artists based on search query.
  const filteredArtists = artists.filter((artist) =>
    artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (artist.genres &&
      artist.genres.join(", ").toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div>
      <Input
        type="text"
        placeholder="Search artists..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-4"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Genres</TableHead>
            <TableHead>Social Links</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredArtists.map((artist, index) => (
            <TableRow key={artist.id || `artist-${index}`}>
              <TableCell>
                {editingId === artist.id ? (
                  <Input
                    value={editData.name || ""}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                ) : (
                  artist.name
                )}
              </TableCell>
              <TableCell>
                {editingId === artist.id ? (
                  <Input
                    value={editData.genres?.join(", ") || ""}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        genres: e.target.value.split(",").map((g) => g.trim()),
                      }))
                    }
                    placeholder="Comma-separated genres"
                  />
                ) : (
                  artist.genres?.join(", ")
                )}
              </TableCell>
              <TableCell>
                {editingId === artist.id ? (
                  <div className="space-y-2">
                    <Input
                      value={editData.facebookUrl || ""}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          facebookUrl: e.target.value,
                        }))
                      }
                      placeholder="Facebook URL"
                    />
                    <Input
                      value={editData.instagramUrl || ""}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          instagramUrl: e.target.value,
                        }))
                      }
                      placeholder="Instagram URL"
                    />
                    <Input
                      value={editData.spotifyUrl || ""}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          spotifyUrl: e.target.value,
                        }))
                      }
                      placeholder="Spotify URL"
                    />
                    <Input
                      value={editData.websiteUrl || ""}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          websiteUrl: e.target.value,
                        }))
                      }
                      placeholder="Website URL"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    {artist.facebookUrl && <div>FB: {artist.facebookUrl}</div>}
                    {artist.instagramUrl && <div>IG: {artist.instagramUrl}</div>}
                    {artist.spotifyUrl && <div>Spotify: {artist.spotifyUrl}</div>}
                    {artist.websiteUrl && <div>Web: {artist.websiteUrl}</div>}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {editingId === artist.id ? (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => saveEditing(artist.id)}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEditing}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditing(artist)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteConfirmId(artist.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the artist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteConfirmId && deleteArtist(deleteConfirmId)
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
