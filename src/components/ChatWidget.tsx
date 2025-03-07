// import React, { useState } from 'react';
// import sendChatMessage from '@/components/ChatWidget'
// import tailwindStyles from '/VSProjects/bndylivebeta/tailwind.config'

// const ChatWidget: React.FC = () => {
//   const [message, setMessage] = useState('');
//   const [response, setResponse] = useState('');
//   const [isLoading, setIsLoading] = useState(false);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);
//     try {
//       const reply = await sendChatMessage(message);
//       setResponse(reply);
//     } catch (error) {
//       setResponse('Error processing your request. Try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="fixed bottom-4 right-4 w-80 bg-white shadow-lg rounded-lg p-4 z-50">
//       <h3 className="text-lg font-bold mb-2">Gig Chat</h3>
//       <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
//         <input
//           type="text"
//           value={message}
//           onChange={(e) => setMessage(e.target.value)}
//           placeholder="Enter gig details (e.g., March 10 The Kings Head 8pm)"
//           className="border p-2 rounded"
//           disabled={isLoading}
//         />
//         <button
//           type="submit"
//           className="bg-blue-500 text-white p-2 rounded disabled:bg-gray-400"
//           disabled={isLoading}
//         >
//           {isLoading ? 'Processing...' : 'Send'}
//         </button>
//       </form>
//       {response && <p className="mt-2">{response}</p>}
//     </div>
//   );
// };

// export default ChatWidget;