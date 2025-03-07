// import axios from 'axios';
// import { db } from '../config/firebase'; // Firebase config
// import { collection, addDoc } from 'firebase/firestore';

// const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'YOUR_API_KEY';
// const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// interface GigData {
//   date: string;
//   time: string;
//   venue: string;
//   location: string;
//   artist: string;
//   free: boolean;
//   status: string;
// }

// export const sendChatMessage = async (message: string): Promise<string> => {
//   // Step 1: Call OpenAI to parse gig details
//   const response = await axios.post(
//     OPENAI_API_URL,
//     {
//       model: 'gpt-4',
//       messages: [
//         {
//           role: 'system',
//           content: 'Extract gig details into JSON. Assume 2025, free unless specified. Flag uncertainties.',
//         },
//         { role: 'user', content: `Parse: ${message}` },
//       ],
//       max_tokens: 200,
//     },
//     { headers: { Authorization: `Bearer ${OPENAI_API_KEY}` } }
//   );

//   const gigDataRaw = response.data.choices[0].message.content;
//   const gigData: GigData = JSON.parse(gigDataRaw);

//   // Step 2: Validate venue against Firebase
//   const venuesRef = collection(db, 'venues');
//   const venueQuery = /* Add query to check if venue exists */
//   // Simplified: Assume venue exists for now
//   if (!venueQuery) {
//     return 'Venue not found. Please use a known venue.';
//   }

//   // Step 3: Save to Firebase
//   await addDoc(collection(db, 'gigs'), {
//     ...gigData,
//     createdAt: new Date(),
//   });

//   // Step 4: Return verification
//   return `Did you mean ${gigData.venue}, ${gigData.location} on ${gigData.date} at ${gigData.time}? Reply Y/N in chat.`;
// };