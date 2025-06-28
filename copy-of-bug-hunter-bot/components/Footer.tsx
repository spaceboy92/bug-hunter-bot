
import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-800/30 py-6 text-center">
      <p className="text-sm text-slate-400">
        Powered by Gemini API & React. &copy; {new Date().getFullYear()} Bug Hunter Bot.
      </p>
    </footer>
  );
};
