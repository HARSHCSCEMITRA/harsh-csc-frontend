import React from 'react';
import type { OrderStatusCode, Language } from '../types';
import { createT } from '../utils/i18n';

const STEPS: Array<{ code: OrderStatusCode; icon: string }> = [
  { code: 'verified',     icon: '✅' },
  { code: 'under_review', icon: '🔍' },
  { code: 'processing',   icon: '⚙️' },
  { code: 'paid',         icon: '💳' },
  { code: 'completed',    icon: '🎉' },
];

const STATUS_ORDER: OrderStatusCode[] = ['verified', 'under_review', 'processing', 'paid', 'completed'];

interface StatusTimelineProps {
  currentStatus: OrderStatusCode;
  lang: Language;
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ currentStatus, lang }) => {
  const t = createT(lang);
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {STEPS.map((step, idx) => {
        const isDone = idx < currentIdx;
        const isActive = idx === currentIdx;
        const isPending = idx > currentIdx;

        return (
          <div
            key={step.code}
            style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', paddingBottom: idx < STEPS.length - 1 ? '28px' : '0', position: 'relative' }}
          >
            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div style={{
                position: 'absolute',
                left: '19px',
                top: '40px',
                width: '2px',
                height: 'calc(100% - 12px)',
                background: isDone
                  ? 'linear-gradient(180deg, var(--green), rgba(52,211,153,0.3))'
                  : isActive
                  ? 'linear-gradient(180deg, var(--blue), var(--border))'
                  : 'var(--border)',
                transition: 'background 0.5s ease',
              }} />
            )}

            {/* Icon */}
            <div style={{
              width: '40px', height: '40px',
              flexShrink: 0,
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px',
              border: '2px solid ' + (isDone ? 'var(--green)' : isActive ? 'var(--blue)' : 'var(--border)'),
              background: isDone
                ? 'var(--green-dim)'
                : isActive
                ? 'var(--blue-dim)'
                : 'var(--bg-700)',
              boxShadow: isActive ? '0 0 20px var(--blue-glow)' : isDone ? '0 0 15px rgba(52,211,153,0.2)' : 'none',
              transition: 'all 0.5s ease',
              zIndex: 1,
              filter: isPending ? 'grayscale(1) opacity(0.4)' : 'none',
            }}>
              {isDone ? '✓' : step.icon}
            </div>

            {/* Text */}
            <div style={{ paddingTop: '6px', opacity: isPending ? 0.45 : 1 }}>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontWeight: isActive ? 700 : 600,
                fontSize: '14px',
                color: isDone ? 'var(--green)' : isActive ? 'var(--blue-light)' : 'var(--text-secondary)',
                marginBottom: '3px',
              }}>
                {t(`status.${step.code}`)}
                {isActive && (
                  <span style={{
                    display: 'inline-block',
                    marginLeft: '8px',
                    width: '8px', height: '8px',
                    borderRadius: '50%',
                    background: 'var(--blue)',
                    animation: 'pulse-blue 1.5s ease infinite',
                    verticalAlign: 'middle',
                  }} />
                )}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {t(`status.${step.code}.desc`)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
