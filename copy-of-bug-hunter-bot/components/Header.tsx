
import React from 'react';

const BugIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mr-3 text-red-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
     <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.75h6m-6 3h6m-6.75-5.25v-.75c0-1.242 1.008-2.25 2.25-2.25h1.5M15.75 4.5h1.5c1.242 0 2.25 1.008 2.25 2.25v.75M9 21v-3.75M15 21v-3.75" />
  </svg>
);


export const Header: React.FC = () => {
  return (
    <header className="bg-slate-800/50 backdrop-blur-md shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-center md:justify-start">
        <BugIcon />
        <h1 
          className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text"
          style={{ textShadow: '0 0 15px rgba(236, 72, 153, 0.4)' }}
        >
          Bug Hunter Bot
        </h1>
      </div>
    </header>
  );
};
