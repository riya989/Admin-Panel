import React, { useEffect } from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcutSections = [
    {
      title: 'Global Navigation',
      items: [
        { keys: [`${modKey}`, 'K'], description: 'Open Command Palette & Global Search' },
        { keys: ['Esc'], description: 'Close any active modal or inspection panel' },
        { keys: ['?'], description: 'Open this keyboard shortcuts reference' },
        { keys: ['R'], description: 'Refresh real-time platform data (when not in input)' },
      ],
    },
    {
      title: 'Direct Tab Switching (1 - 9)',
      items: [
        { keys: ['1'], description: 'Executive Dashboard & Metrics' },
        { keys: ['2'], description: 'KYC & Verification Pipeline' },
        { keys: ['3'], description: 'Platform Shops Directory' },
        { keys: ['4'], description: 'Shop Owners Management' },
        { keys: ['5'], description: 'Customer Directory' },
        { keys: ['6'], description: 'Live Orders Monitoring' },
        { keys: ['7'], description: 'Merchant Reports & Issues' },
        { keys: ['8'], description: 'Analytics & Revenue' },
        { keys: ['9'], description: 'Security Audit Logs' },
      ],
    },
    {
      title: 'List View Actions',
      items: [
        { keys: ['P'], description: 'Export list to branded PDF report with filter summary' },
        { keys: ['E'], description: 'Export filtered list as CSV (in KYC or Shops tab)' },
        { keys: ['T'], description: 'Toggle Table / Card view (in KYC tab)' },
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Keyboard Shortcuts</h2>
              <p className="text-xs text-slate-400">Streamline executive console navigation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {shortcutSections.map((sec) => (
            <div key={sec.title} className="space-y-2.5">
              <h3 className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                {sec.title}
              </h3>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl divide-y divide-slate-800/60">
                {sec.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between px-3.5 py-2.5">
                    <span className="text-slate-300">{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2 py-1 text-[11px] font-mono font-semibold bg-slate-800 text-slate-200 border border-slate-700/80 rounded-md shadow-sm"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-[11px] text-slate-400">
          <span>Press <kbd className="px-1.5 py-0.5 font-mono bg-slate-800 rounded border border-slate-700 text-slate-200">Esc</kbd> anytime to dismiss modals</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
