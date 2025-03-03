// /components/admin/EventsTable.tsx
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/config/firebase";
import { COLLECTIONS } from "@/lib/constants";
import { formatEventDate, formatTime } from "@/lib/utils/date-utils";
import { getArtistById } from "@/lib/services/artist-service";
import { getVenueById } from "@/lib/services/venue-service";
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

interface Event {
  id: string;
  name?: string;
  date: string;
  startTime: string;
  ticketPrice?: number;
  artistIds: string[];
  venueId: string;
  // any additional fields...
}

interface EventWithDetails extends Event {
  artistName: string;
  venueName: string;
}

export function EventsTable() {
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.EVENTS));
      const eventData = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const event = { id: docSnap.id, ...docSnap.data() } as Event;
          const artist = await getArtistById(event.artistIds[0]);
          const venue = await getVenueById(event.venueId);
          return {
            ...event,
            artistName: artist ? artist.name : "Unknown Artist",
            venueName: venue ? venue.name : "Unknown Venue",
          } as EventWithDetails;
        })
      );
      setEvents(eventData);
    } catch (error) {
      console.error("Error loading events:", error);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedEvents((prev) => {
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
    if (selectedEvents.size === filteredEvents.length) {
      setSelectedEvents(new Set());
    } else {
      setSelectedEvents(new Set(filteredEvents.map((e) => e.id)));
    }
  };

  const handleBatchDelete = async () => {
    try {
      await Promise.all(
        [...selectedEvents].map((id) => deleteDoc(doc(db, COLLECTIONS.EVENTS, id)))
      );
      setSelectedEvents(new Set());
      setConfirmDelete(false);
      loadEvents();
    } catch (error) {
      console.error("Error deleting events:", error);
    }
  };

  // Filter events based on search query (searching event name, artist name, or venue name)
  const filteredEvents = events.filter(
    (event) =>
      (event.name && event.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      event.artistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venueName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <Input
        type="text"
        placeholder="Search events..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-4"
      />
      <div className="flex justify-between mb-4">
        <h2 className="text-lg font-semibold">Events</h2>
        <Button
          variant="destructive"
          disabled={selectedEvents.size === 0}
          onClick={() => setConfirmDelete(true)}
        >
          Delete Selected ({selectedEvents.size})
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox
                checked={
                  selectedEvents.size === filteredEvents.length &&
                  filteredEvents.length > 0
                }
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Artist</TableHead>
            <TableHead>Venue</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Ticket Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredEvents.map((event, index) => (
            <TableRow key={event.id || `event-${index}`}>
              <TableCell>
                <Checkbox
                  checked={selectedEvents.has(event.id)}
                  onCheckedChange={() => handleSelect(event.id)}
                />
              </TableCell>
              <TableCell>{event.name}</TableCell>
              <TableCell>{event.artistName}</TableCell>
              <TableCell>{event.venueName}</TableCell>
              <TableCell>{formatEventDate(new Date(event.date))}</TableCell>
              <TableCell>
                {event.startTime ? formatTime(event.startTime) : "-"}
              </TableCell>
              <TableCell>
                £{event.ticketPrice ? Number(event.ticketPrice).toFixed(2) : "0.00"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={confirmDelete} onOpenChange={() => setConfirmDelete(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedEvents.size} event(s). This action cannot be undone.
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
