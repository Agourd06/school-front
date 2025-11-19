import React, { useEffect, useRef } from 'react';

interface InfoPopoverTriggerProps {
  isOpen: boolean;
  disabled?: boolean;
  onToggle: (open: boolean) => void;
  openLabel?: string;
  closeLabel?: string;
  widthClass?: string;
  children: React.ReactNode;
}

export const InfoPopoverTrigger: React.FC<InfoPopoverTriggerProps> = ({
  isOpen,
  disabled,
  onToggle,
  openLabel = 'View info',
  closeLabel = 'Hide info',
  widthClass = 'w-72',
  children,
}) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleClick = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        onToggle(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onToggle]);

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onToggle(!isOpen)}
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold transition-colors ${
          disabled
            ? 'border-gray-200 text-gray-400 cursor-not-allowed'
            : isOpen
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-blue-200 text-blue-600 hover:border-blue-400 hover:text-blue-700'
        }`}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.065 7-9.542 7s-8.268-2.943-9.542-7z"
          />
        </svg>
        {isOpen ? closeLabel : openLabel}
      </button>
      {!disabled && isOpen && (
        <div
          className={`absolute right-0 z-50 mt-2 ${widthClass} rounded-3xl border border-blue-100 bg-white p-5 shadow-2xl ring-1 ring-black/5`}
        >
          <div className="pointer-events-none absolute -top-3 right-10 h-5 w-5 rotate-45 border border-blue-100 bg-white shadow-sm ring-1 ring-black/5" />
          <div className="relative z-10">{children}</div>
        </div>
      )}
    </div>
  );
};

interface DetailCardProps {
  title: string;
  badge?: string;
  items: Array<{ label: string; value?: React.ReactNode }>;
  description?: React.ReactNode;
}

export const DetailCard: React.FC<DetailCardProps> = ({ title, badge, items, description }) => {
  const formattedDescription = React.useMemo(() => {
    if (!description) return null;
    if (typeof description !== 'string') return description;
    return description
      .split('<br>')
      .map((paragraph, idx) => (
        <p key={idx} className="mb-2 last:mb-0">
          {paragraph.replace(/<[^>]*>?/gm, '').trim()}
        </p>
      ));
  }, [description]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-500">Details</p>
        {badge && <span className="rounded-full bg-blue-50 px-3 py-0.5 text-xs font-semibold text-blue-700">{badge}</span>}
      </div>
      <p className="mt-2 text-base font-semibold text-blue-900">{title}</p>
      <dl className="mt-3 space-y-2 text-sm text-blue-900">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-lg bg-blue-50/70 px-3 py-1.5">
            <dt className="text-xs uppercase text-blue-500">{item.label}</dt>
            <dd className="font-medium text-right text-blue-900">{item.value ?? '—'}</dd>
          </div>
        ))}
      </dl>
      {formattedDescription && (
        <div className="mt-4 max-h-48 overflow-y-auto rounded-2xl bg-blue-50/70 px-4 py-3 text-xs text-blue-800 leading-relaxed shadow-inner">
          {formattedDescription}
        </div>
      )}
    </div>
  );
};


