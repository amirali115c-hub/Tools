import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Play / Pause audio preview' },
    { key: 'I', desc: 'Set Trim Start boundary at current playhead position' },
    { key: 'O', desc: 'Set Trim End boundary at current playhead position' },
    { key: 'Ctrl + Z / Cmd + Z', desc: 'Undo last audio edit / trim adjustment' },
    { key: 'Ctrl + Y / Cmd + Y', desc: 'Redo audio edit' },
    { key: 'L', desc: 'Toggle Selection Loop mode' },
    { key: 'Esc', desc: 'Reset selection to full duration' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2 text-white font-bold">
            <Keyboard className="w-5 h-5 text-emerald-400" />
            <span>Keyboard Shortcuts</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
            >
              <span className="text-slate-300">{s.desc}</span>
              <kbd className="px-2 py-1 rounded bg-slate-800 text-emerald-400 border border-slate-700 font-mono text-[11px] font-bold">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 transition"
          >
            Got it, return to Studio
          </button>
        </div>
      </div>
    </div>
  );
};
