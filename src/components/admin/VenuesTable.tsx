// /components/admin/VenuesTable.tsx
"use client";

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

interface Venue {
  id: string;
  name: string;
  address?: string;
  location: {
    lat: number;
    lng: number;
  };
  googlePlaceId?: string;
  standardStartTime?: string;
  standardEndTime?: string;
  standardTicketPrice?: number;
  createdAt: string;
  updatedAt: string;
}

export function VenuesTable() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Venue>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async () => {
    const snapshot = await getDocs(collection(db, COLLECTIONS.VENUES));
    const venueData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Venue[];
    setVenues(venueData);
  };

  const startEditing = (venue: Venue) => {
    setEditingId(venue.id);
    setEditData(venue);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEditing = async (id: string) => {
    try {
      const venueRef = doc(db, COLLECTIONS.VENUES, id);
      await updateDoc(venueRef, {
        ...editData,
        updatedAt: new Date().toISOString()
      });
      cancelEditing();
      loadVenues();
    } catch (error) {
      console.error("Error updating venue:", error);
    }
  };

  const deleteVenue = async (id: string) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.VENUES, id));
      setDeleteConfirmId(null);
      loadVenues();
    } catch (error) {
      console.error("Error deleting venue:", error);
    }
  };

  // Filter venues based on the search query.
  const filteredVenues = venues.filter(venue =>
    venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (venue.address && venue.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div>
      <Input
        type="text"
        placeholder="Search venues..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-4"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>End Time</TableHead>
            <TableHead>Ticket Price</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredVenues.map(venue => (
            <TableRow key={venue.id}>
              <TableCell>
                {editingId === venue.id ? (
                  <Input
                    value={editData.name || ''}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                ) : (
                  venue.name
                )}
              </TableCell>
              <TableCell>
                {editingId === venue.id ? (
                  <Input
                    value={editData.address || ''}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, address: e.target.value }))
                    }
                  />
                ) : (
                  venue.address
                )}
              </TableCell>
              <TableCell>
                {editingId === venue.id ? (
                  <Input
                    type="time"
                    value={editData.standardStartTime || ''}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, standardStartTime: e.target.value }))
                    }
                  />
                ) : (
                  venue.standardStartTime || "-"
                )}
              </TableCell>
              <TableCell>
                {editingId === venue.id ? (
                  <Input
                    type="time"
                    value={editData.standardEndTime || ''}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, standardEndTime: e.target.value }))
                    }
                  />
                ) : (
                  venue.standardEndTime || "-"
                )}
              </TableCell>
              <TableCell>
                {editingId === venue.id ? (
                  <Input
                    type="number"
                    value={editData.standardTicketPrice?.toString() || ''}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        standardTicketPrice: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                ) : (
                  venue.standardTicketPrice
                    ? `£${venue.standardTicketPrice.toFixed(2)}`
                    : "-"
                )}
              </TableCell>
              <TableCell className="flex gap-2">
                {editingId === venue.id ? (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => saveEditing(venue.id)}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEditing}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => startEditing(venue)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteConfirmId(venue.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the venue. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirmId && deleteVenue(deleteConfirmId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
