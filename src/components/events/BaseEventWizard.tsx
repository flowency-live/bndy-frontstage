// src/components/events/BaseEventWizard.tsx
import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from "@/components/ui/use-toast";
import { Form } from "@/components/ui/form";
import { MapPin, Users, Calendar, Clock, Info } from 'lucide-react';
import { formatEventDate, formatTime } from '@/lib/utils/date-utils';
import { VenueStep } from './createwizardsteps/VenueStep';
import { generateRecurringDates } from '@/lib/utils/event-utils';
import { ArtistStep } from './createwizardsteps/ArtistStep';
import { DateStep } from './createwizardsteps/DateStep';
import { TimeStep } from './createwizardsteps/TimeStep';
import { DetailsStep } from './createwizardsteps/DetailsStep';
import { createEvent } from '@/lib/services/event-service';
import { createVenue } from '@/lib/services/venue-service';
import type { Artist, Venue, EventFormData } from '@/lib/types';
import { cn } from "@/lib/utils";

interface BaseEventWizardProps {
    map?: google.maps.Map | null;
    onSuccess: () => void;
    initialArtist?: Artist;
    initialVenue?: Venue;
    skipArtistStep?: boolean;
    skipVenueStep?: boolean;
}

type StepId = 'venue' | 'artists' | 'date' | 'time' | 'details';

export function BaseEventWizard({
    map,
    onSuccess,
    initialArtist,
    initialVenue,
    skipArtistStep = false,
    skipVenueStep = false
}: BaseEventWizardProps) {
    const [currentStep, setCurrentStep] = useState<StepId>(
        skipVenueStep ? (skipArtistStep ? 'date' : 'artists') : 'venue'
    );
    const [loading, setLoading] = useState(false);
    const [completedSteps, setCompletedSteps] = useState<Set<StepId>>(new Set());
    const { toast } = useToast();
    const [multipleArtists, setMultipleArtists] = useState(false);

    // Configure steps based on what we're skipping
    const AVAILABLE_STEPS = useMemo(() => {
        const allSteps = [
            { id: 'venue' as StepId, icon: <MapPin className="w-4 h-4" />, title: 'Where?' },
            { id: 'artists' as StepId, icon: <Users className="w-4 h-4" />, title: 'Who?' },
            { id: 'date' as StepId, icon: <Calendar className="w-4 h-4" />, title: 'When?' },
            { id: 'time' as StepId, icon: <Clock className="w-4 h-4" />, title: 'What time?' },
            { id: 'details' as StepId, icon: <Info className="w-4 h-4" />, title: 'Details' }
        ];

        if (skipVenueStep) {
            allSteps.shift(); // Remove venue step
        }

        if (skipArtistStep) {
            if (skipVenueStep) {
                allSteps.shift(); // Remove artist step (now at index 0 after venue was removed)
            } else {
                allSteps.splice(1, 1); // Remove artist step at index 1
            }
        }

        return allSteps;
    }, [skipVenueStep, skipArtistStep]);

    const form = useForm<EventFormData>({
        defaultValues: {
            artists: initialArtist ? [initialArtist] : [],
            venue: initialVenue || ({} as Venue),
            name: '',
            eventUrl: '',
            ticketUrl: '',
            description: ''
        }
    });

    // Set initial values for form if provided
    React.useEffect(() => {
        if (initialArtist) {
            form.setValue('artists', [initialArtist]);
            setCompletedSteps(prev => new Set([...prev, 'artists']));
        }

        if (initialVenue) {
            form.setValue('venue', initialVenue);
            setCompletedSteps(prev => new Set([...prev, 'venue']));
        }
    }, [initialArtist, initialVenue, form]);

    const handleStepComplete = (stepId: StepId) => {
        setCompletedSteps(prev => new Set([...prev, stepId]));
    };

    const handleStepChange = (stepId: StepId) => {
        const currentIndex = AVAILABLE_STEPS.findIndex(s => s.id === currentStep);
        const newIndex = AVAILABLE_STEPS.findIndex(s => s.id === stepId);

        if (newIndex === currentIndex + 1 || completedSteps.has(stepId)) {
            setCurrentStep(stepId);
        }
    };

    const handleSubmit = async (data: EventFormData) => {
        setLoading(true);
        try {
            // First create venue if it's new
            let venueId = data.venue.id;
            if (!venueId) {
                const newVenue = await createVenue({
                    name: data.venue.name,
                    address: data.venue.address || '',
                    location: data.venue.location,
                    googlePlaceId: data.venue.googlePlaceId,
                    validated: false,
                });
                venueId = newVenue.id;
                data.venue = newVenue;
            }

            if (data.recurring) {
                // Generate all event dates
                const dates = generateRecurringDates(
                    data.date,
                    data.recurring.endDate,
                    data.recurring.frequency
                );

                // Create each event
                await Promise.all(dates.map(async (date) => {
                    const eventData = {
                        ...data,
                        date,
                        venueId,
                        venueName: data.venue.name,
                        artistIds: data.artists.map(a => a.id),
                        location: data.venue.location,
                        status: 'approved' as const, // Admin created events are auto-approved
                        source: 'bndy.live' as const,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };

                    await createEvent(eventData);
                }));
            } else {
                // Create single event
                const eventData = {
                    ...data,
                    venueId,
                    venueName: data.venue.name,
                    artistIds: data.artists.map(a => a.id),
                    location: data.venue.location,
                    status: 'approved' as const, // Admin created events are auto-approved
                    source: 'bndy.live' as const,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                await createEvent(eventData);
            }

            toast({
                title: data.recurring ? "Recurring Events Created!" : "Event Created!",
                description: "Successfully added to the calendar.",
            });

            if (map && data.venue.location) {
                setTimeout(() => {
                    map.panTo(data.venue.location);
                    map.setZoom(15);
                }, 300);
            }

            onSuccess();
        } catch (error) {
            console.error('Error creating event:', error);
            toast({
                title: "Error",
                description: "There was a problem creating your event. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // Dynamic title based on form state
    const title = useMemo(() => {
        const formData = form.getValues();
        const isOpenMic = formData.isOpenMic;
        const venueInfo = formData.venue.name ? `@ ${formData.venue.name}` : '';
        const artistInfo = formData.artists.length > 0 ? formData.artists[0]?.name : '';
        const eventType = isOpenMic ? 'Open Mic' : artistInfo;
        const dateInfo = formData.date ? formatEventDate(new Date(formData.date)) : '';
        const timeInfo = formData.startTime ? formatTime(formData.startTime) : '';

        switch (currentStep) {
            case 'venue':
                return formData.venue.name ? `Event @ ${formData.venue.name}` : "Where's the event?";
            case 'artists':
                if (isOpenMic) {
                    return `Open Mic ${venueInfo}`;
                }
                return artistInfo ? `${artistInfo} ${venueInfo}` : "Who's playing?";
            case 'date':
                if (isOpenMic) {
                    return dateInfo ? `Open Mic ${venueInfo} - ${dateInfo}` : "When's the event?";
                }
                return dateInfo ? `${eventType} ${venueInfo} - ${dateInfo}` : "When's the event?";
            case 'time':
                if (isOpenMic) {
                    return timeInfo ? `Open Mic ${venueInfo} - ${dateInfo} @ ${timeInfo}` : "What time?";
                }
                return timeInfo ? `${eventType} ${venueInfo} - ${dateInfo} @ ${timeInfo}` : "What time?";
            case 'details':
                if (isOpenMic) {
                    return `Open Mic ${venueInfo} - ${dateInfo} @ ${timeInfo}`;
                }
                return `${eventType} ${venueInfo} - ${dateInfo} @ ${timeInfo}`;
            default:
                return "Create New Event";
        }
    }, [
        currentStep,
        form.watch(['venue', 'artists', 'date', 'startTime', 'isOpenMic'])
    ]);

    const handleBack = () => {
        const currentIndex = AVAILABLE_STEPS.findIndex(s => s.id === currentStep);
        if (currentIndex > 0) {
            const prevStep = AVAILABLE_STEPS[currentIndex - 1].id;
            setCurrentStep(prevStep);
        }
    };

    return (
        <div className="space-y-6">
            {/* Progress Indicator */}
            <div className="relative flex items-center justify-between mb-8">
                {AVAILABLE_STEPS.map((step, index) => {
                    const isCompleted = completedSteps.has(step.id);
                    const isCurrent = step.id === currentStep;
                    const isClickable = isCompleted || step.id === currentStep;
                    const currentIndex = AVAILABLE_STEPS.findIndex(s => s.id === currentStep);

                    return (
                        <React.Fragment key={step.id}>
                            <div
                                className={cn(
                                    "flex flex-col items-center",
                                    isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-50",
                                    isCurrent ? "text-[var(--primary)]" :
                                        isCompleted ? "text-[var(--primary)]/70" : "text-muted-foreground"
                                )}
                                onClick={() => isClickable && handleStepChange(step.id)}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                                    isCurrent ? "bg-[var(--primary)] text-white shadow-md" :
                                        isCompleted ? "bg-[var(--primary)]/20 text-[var(--primary)]" : "bg-muted"
                                )}>
                                    {step.icon}
                                </div>
                                <span className="text-xs font-medium mt-2">{step.title}</span>
                            </div>
                            {index < AVAILABLE_STEPS.length - 1 && (
                                <div className={cn(
                                    "flex-1 h-1 mx-2 rounded",
                                    index < currentIndex ? "bg-[var(--primary)]" : "bg-muted"
                                )} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            <div className="text-lg font-semibold mb-6">{title}</div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    {currentStep === 'venue' && (
                        <VenueStep
                            form={form}
                            map={map}
                            onVenueSelect={(venue: Venue) => {
                                form.setValue('venue', venue);

                                // If it's a verified venue with standard times, populate those
                                if (venue.id && venue.standardStartTime) {
                                    form.setValue('startTime', venue.standardStartTime);
                                }
                                if (venue.id && venue.standardEndTime) {
                                    form.setValue('endTime', venue.standardEndTime);
                                }
                                if (venue.id && venue.standardTicketPrice) {
                                    form.setValue('ticketPrice', venue.standardTicketPrice);
                                }

                                handleStepComplete('venue');
                                const nextStep = skipArtistStep ? 'date' : 'artists';
                                handleStepChange(nextStep);
                            }}
                        />
                    )}

                    {currentStep === 'artists' && (
                        <ArtistStep
                            form={form}
                            multipleMode={multipleArtists}
                            onToggleMultipleMode={setMultipleArtists}
                            onArtistSelect={(artist: Artist) => {
                                if (!multipleArtists) {
                                    handleStepComplete('artists');
                                    handleStepChange('date');
                                }
                            }}
                            onNext={() => {
                                handleStepComplete('artists');
                                handleStepChange('date');
                            }}
                            onBack={handleBack}
                        />
                    )}

                    {currentStep === 'date' && (
                        <DateStep
                            form={form}
                            onComplete={() => {
                                handleStepComplete('date');
                                handleStepChange('time');
                            }}
                            onBack={handleBack}
                        />
                    )}

                    {currentStep === 'time' && (
                        <TimeStep
                            form={form}
                            onComplete={() => {
                                handleStepComplete('time');
                                handleStepChange('details');
                            }}
                            onBack={handleBack}
                        />
                    )}

                    {currentStep === 'details' && (
                        <DetailsStep
                            form={form}
                            loading={loading}
                            onSubmit={handleSubmit}
                            onBack={handleBack}
                        />
                    )}
                </form>
            </Form>
        </div>
    );
}