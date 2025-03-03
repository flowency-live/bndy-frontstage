// /app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { VenuesTable } from "@/components/admin/VenuesTable";
import { ArtistsTable } from "@/components/admin/ArtistsTable";
import { EventsTable } from "@/components/admin/EventsTable";
import EventImporter from "@/components/admin/EventImporter";

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <Tabs defaultValue="venues">
        <TabsList className="mb-4">
          <TabsTrigger value="venues">Venues</TabsTrigger>
          <TabsTrigger value="artists">Artists</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="importer">Event Importer</TabsTrigger>
        </TabsList>
        
        <TabsContent value="venues">
          <VenuesTable />
        </TabsContent>
        
        <TabsContent value="artists">
          <ArtistsTable />
        </TabsContent>
        
        <TabsContent value="events">
          <EventsTable />
        </TabsContent>

        <TabsContent value="importer">
  <EventImporter />
</TabsContent>

      </Tabs>
    </div>
  );
}
