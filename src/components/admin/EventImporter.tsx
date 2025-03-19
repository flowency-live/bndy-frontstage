// "use client";

// import React, { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { createEvent } from "@/lib/services/event-service";
// import { createArtist } from "@/lib/services/artist-service";
// import { searchVenues } from "@/lib/services/venue-service";
// import { NewArtistForm } from "@/components/events/createwizardsteps/ArtistStep/NewArtistForm";
// import { stringSimilarity } from "@/lib/utils/string-similarity";
// import type { Artist, Venue } from "@/lib/types";
// import { collection, getDocs } from "firebase/firestore";
// import { db } from "@/lib/config/firebase";
// import { COLLECTIONS } from "@/lib/constants";

// // Type for an imported event row
// type ImportedEvent = {
//   id: number;
//   date: string;
//   artistName: string;
//   venueName: string;
//   startTime: string;
//   ticketPrice?: string;
//   eventDescription?: string; // CSV field; maps to event "description"
//   eventLink?: string;        // CSV field; maps to event "eventUrl"
//   artistMatch: Artist | null;
//   venueMatch: Venue | null;
//   artistMatchConfidence: string; // "100% match" or "No match"
//   venueMatchConfidence: string;  // "100% match", "High Confidence", or "No match"
//   group: string; // "Full Match", "Artist Only", "Venue Only", or "No Match"
// };

// export default function EventImporter() {
//   const [fileContent, setFileContent] = useState<string | null>(null);
//   const [importedEvents, setImportedEvents] = useState<ImportedEvent[]>([]);
//   const [knownArtists, setKnownArtists] = useState<Artist[]>([]);
//   const [knownVenues, setKnownVenues] = useState<Venue[]>([]);
//   const [selectedRowForArtistCreation, setSelectedRowForArtistCreation] = useState<number | null>(null);
//   const [importStatus, setImportStatus] = useState<string>("");

//   // Load known artists and venues from Firebase using your collections
//   useEffect(() => {
//     async function fetchArtistsAndVenues() {
//       try {
//         const artistSnapshot = await getDocs(collection(db, COLLECTIONS.ARTISTS));
//         const artistData = artistSnapshot.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         })) as Artist[];
//         setKnownArtists(artistData);
//       } catch (error) {
//         console.error("Error fetching artists:", error);
//       }
//       try {
//         const venueSnapshot = await getDocs(collection(db, COLLECTIONS.VENUES));
//         const venueData = venueSnapshot.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         })) as Venue[];
//         setKnownVenues(venueData);
//       } catch (error) {
//         console.error("Error fetching venues:", error);
//       }
//     }
//     fetchArtistsAndVenues();
//   }, []);

//   // Handle file upload and parse CSV
//   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     const reader = new FileReader();
//     reader.onload = (evt) => {
//       const text = evt.target?.result;
//       if (typeof text === "string") {
//         setFileContent(text);
//         parseCSV(text);
//       }
//     };
//     reader.readAsText(file);
//   };

//   // Parse CSV text into an array of ImportedEvent objects.
//   // Expects header row: Date, Artist, Venue, Start Time, Ticket Price, Event Description, Event Link
//   const parseCSV = (text: string) => {
//     const lines = text.split("\n").filter(line => line.trim() !== "");
//     let startIndex = 0;
//     let headers: string[] = [];
//     const headerLine = lines[0].toLowerCase();
//     if (headerLine.includes("date") && headerLine.includes("artist")) {
//       headers = lines[0].split(",").map(h => h.trim());
//       startIndex = 1;
//     } else {
//       // Use default order if header row is missing
//       headers = ["Date", "Artist", "Venue", "Start Time", "Ticket Price", "Event Description", "Event Link"];
//     }

//     const events: ImportedEvent[] = lines.slice(startIndex).map((line, index) => {
//       const cols = line.split(",").map(col => col.trim());
//       return {
//         id: index,
//         date: cols[0] || "",
//         artistName: cols[1] || "",
//         venueName: cols[2] || "",
//         startTime: cols[3] || "",
//         ticketPrice: cols[4] || "",
//         eventDescription: cols[5] || "",
//         eventLink: cols[6] || "",
//         artistMatch: null,
//         venueMatch: null,
//         artistMatchConfidence: "No match",
//         venueMatchConfidence: "No match",
//         group: "No Match",
//       };
//     });
//     runMatching(events);
//   };

//   // Perform matching for each event row based on loaded knownArtists and knownVenues
//   const runMatching = (events: ImportedEvent[]) => {
//     const updatedEvents = events.map(event => {
//       // Artist matching: exact (case-insensitive)
//       const artistFound = knownArtists.find(a => a.name.toLowerCase() === event.artistName.toLowerCase());
//       if (artistFound) {
//         event.artistMatch = artistFound;
//         event.artistMatchConfidence = "100% match";
//       } else {
//         event.artistMatch = null;
//         event.artistMatchConfidence = "No match";
//       }

//       // Venue matching: first try exact match
//       const venueFound = knownVenues.find(v => v.name.toLowerCase() === event.venueName.toLowerCase());
//       if (venueFound) {
//         event.venueMatch = venueFound;
//         event.venueMatchConfidence = "100% match";
//       } else {
//         // Fallback: use string similarity for a high confidence match
//         let bestMatch: Venue | null = null;
//         let bestScore = 0;
//         knownVenues.forEach(v => {
//           const score = stringSimilarity(v.name.toLowerCase(), event.venueName.toLowerCase());
//           if (score > bestScore) {
//             bestScore = score;
//             bestMatch = v;
//           }
//         });
//         if (bestScore >= 0.8 && bestMatch) {
//           event.venueMatch = bestMatch;
//           event.venueMatchConfidence = "High Confidence";
//         } else {
//           event.venueMatch = null;
//           event.venueMatchConfidence = "No match";
//         }
//       }

//       // Determine grouping based on match confidences
//       if (event.artistMatchConfidence === "100% match" && event.venueMatchConfidence === "100% match") {
//         event.group = "Full Match";
//       } else if (event.artistMatchConfidence === "100% match" && event.venueMatchConfidence !== "100% match") {
//         event.group = "Artist Only";
//       } else if (event.venueMatchConfidence === "100% match" && event.artistMatchConfidence !== "100% match") {
//         event.group = "Venue Only";
//       } else {
//         event.group = "No Match";
//       }
//       return event;
//     });
//     setImportedEvents(updatedEvents);
//   };

//   // Bulk import fully matched events using your createEvent service call.
//   const handleBulkImport = async () => {
//     const fullMatchEvents = importedEvents.filter(e => e.group === "Full Match");
//     let successCount = 0;
//     for (const event of fullMatchEvents) {
//       try {
//         // await createEvent({
//         //   date: event.date,
//         //   startTime: event.startTime,
//         //   ticketPrice: event.ticketPrice,
//         //   // Map CSV "Event Description" to event "description"
//         //   description: event.eventDescription,
//         //   // Map CSV "Event Link" to event "eventUrl"
//         //   eventUrl: event.eventLink,
//         //   artistIds: event.artistMatch ? [event.artistMatch.id] : [],
//         //   venueId: event.venueMatch ? event.venueMatch.id : "",
//         // });
//         successCount++;
//       } catch (error) {
//         console.error("Error importing event:", error);
//       }
//     }
//     setImportStatus(`Successfully imported ${successCount} events.`);
//   };

//   // Update an event row after creating a new artist
//   const handleCreateArtist = (rowId: number, newArtist: Artist) => {
//     const updatedEvents = importedEvents.map(event => {
//       if (event.id === rowId) {
//         event.artistMatch = newArtist;
//         event.artistMatchConfidence = "100% match";
//         event.group = event.venueMatchConfidence === "100% match" ? "Full Match" : "Artist Only";
//       }
//       return event;
//     });
//     setImportedEvents(updatedEvents);
//     setSelectedRowForArtistCreation(null);
//   };

//   // Trigger a venue lookup using your searchVenues service call from venue-service
//   const handleLookupVenue = async (rowId: number) => {
//     const event = importedEvents.find(e => e.id === rowId);
//     if (!event) return;
//     try {
//       const results = await searchVenues(event.venueName);
//       if (results && results.length > 0) {
//         const matchedVenue = results[0];
//         const updatedEvents = importedEvents.map(ev => {
//           if (ev.id === rowId) {
//             ev.venueMatch = matchedVenue;
//             ev.venueMatchConfidence = "100% match";
//             ev.group = ev.artistMatchConfidence === "100% match" ? "Full Match" : "Venue Only";
//           }
//           return ev;
//         });
//         setImportedEvents(updatedEvents);
//       }
//     } catch (error) {
//       console.error("Error looking up venue:", error);
//     }
//   };

//   return (
//     <div className="p-4">
//       <h2 className="text-xl font-bold mb-4">Event Importer</h2>
//       <div className="mb-4">
//         <input type="file" accept=".csv" onChange={handleFileUpload} />
//       </div>
//       {importStatus && <p className="mb-4 text-green-600">{importStatus}</p>}
//       {importedEvents.length > 0 && (
//         <div>
//           <table className="w-full border-collapse mb-4">
//             <thead>
//               <tr>
//                 <th className="border p-2">Date</th>
//                 <th className="border p-2">Artist</th>
//                 <th className="border p-2">Artist Match</th>
//                 <th className="border p-2">Venue</th>
//                 <th className="border p-2">Venue Match</th>
//                 <th className="border p-2">Start Time</th>
//                 <th className="border p-2">Ticket Price</th>
//                 <th className="border p-2">Description</th>
//                 <th className="border p-2">Event Link</th>
//                 <th className="border p-2">Group</th>
//                 <th className="border p-2">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {importedEvents.map(event => (
//                 <tr key={event.id}>
//                   <td className="border p-2">{event.date}</td>
//                   <td className="border p-2">{event.artistName}</td>
//                   <td className="border p-2">{event.artistMatchConfidence}</td>
//                   <td className="border p-2">{event.venueName}</td>
//                   <td className="border p-2">{event.venueMatchConfidence}</td>
//                   <td className="border p-2">{event.startTime}</td>
//                   <td className="border p-2">{event.ticketPrice}</td>
//                   <td className="border p-2">{event.eventDescription}</td>
//                   <td className="border p-2">{event.eventLink}</td>
//                   <td className="border p-2">{event.group}</td>
//                   <td className="border p-2">
//                     {event.artistMatchConfidence !== "100% match" && (
//                       <Button size="sm" onClick={() => setSelectedRowForArtistCreation(event.id)}>
//                         Create Artist
//                       </Button>
//                     )}
//                     {event.venueMatchConfidence !== "100% match" && (
//                       <Button size="sm" onClick={() => handleLookupVenue(event.id)}>
//                         Lookup Venue
//                       </Button>
//                     )}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//           <div className="mb-4">
//             <Button onClick={handleBulkImport}>
//               Bulk Import Fully Matched Events
//             </Button>
//           </div>
//         </div>
//       )}
//       {/* Render NewArtistForm inline when a row needs a new artist */}
//       {selectedRowForArtistCreation !== null && (
//         <div className="mt-4">
//           <h3 className="text-lg font-semibold">
//             Create New Artist for Row #{selectedRowForArtistCreation}
//           </h3>
//           <NewArtistForm
//             initialName={
//               importedEvents.find(e => e.id === selectedRowForArtistCreation)?.artistName || ""
//             }
//             onCancel={() => setSelectedRowForArtistCreation(null)}
//             onArtistCreated={(artist) =>
//               handleCreateArtist(selectedRowForArtistCreation, artist)
//             }
//             existingArtists={knownArtists}
//           />
//         </div>
//       )}
//     </div>
//   );
// }
