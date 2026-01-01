// components/GearComparison.tsx

'use client';

import { ValidationResult, formatValidationResult } from '@/lib/validate-gear';

export interface GearRequirement {
  item: string;
  category?: string;
  priority?: 'critical' | 'recommended' | 'optional';
  requirements?: Record<string, string>;
  reasoning?: string;
}

export interface UserGearMatch {
  name: string;
  manufacturer?: string;
  validation: ValidationResult;
}

export interface GearComparisonItem {
  requirement: GearRequirement;
  userGear?: UserGearMatch;
}

interface GearComparisonProps {
  items: GearComparisonItem[];
  onAddGear?: (requirement: GearRequirement) => void;
}

export function GearComparison({ items, onAddGear }: GearComparisonProps) {
  const critical = items.filter(i => i.requirement.priority === 'critical');
  const recommended = items.filter(i => i.requirement.priority === 'recommended');
  const optional = items.filter(i => i.requirement.priority === 'optional');

  return (
    <div className="gear-comparison">
      {critical.length > 0 && (
        <div className="gear-section">
          <h3 className="gear-section-title">Required</h3>
          {critical.map((item, i) => (
            <GearComparisonRow key={i} item={item} onAddGear={onAddGear} />
          ))}
        </div>
      )}

      {recommended.length > 0 && (
        <div className="gear-section">
          <h3 className="gear-section-title">Recommended</h3>
          {recommended.map((item, i) => (
            <GearComparisonRow key={i} item={item} onAddGear={onAddGear} />
          ))}
        </div>
      )}

      {optional.length > 0 && (
        <div className="gear-section">
          <h3 className="gear-section-title">Optional</h3>
          {optional.map((item, i) => (
            <GearComparisonRow key={i} item={item} onAddGear={onAddGear} />
          ))}
        </div>
      )}
    </div>
  );
}

interface GearComparisonRowProps {
  item: GearComparisonItem;
  onAddGear?: (requirement: GearRequirement) => void;
}

function GearComparisonRow({ item, onAddGear }: GearComparisonRowProps) {
  const { requirement, userGear } = item;

  return (
    <div className="gear-row">
      {/* Left: Requirement */}
      <div className="gear-requirement">
        <div className="gear-name">{requirement.item}</div>
        {requirement.requirements && (
          <div className="gear-specs">
            {Object.entries(requirement.requirements).slice(0, 2).map(([key, value]) => (
              <span key={key} className="gear-spec">
                {value}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right: User's gear or add button */}
      <div className="gear-match">
        {userGear ? (
          <GearStatus gear={userGear} />
        ) : (
          <button
            className="gear-add-btn"
            onClick={() => onAddGear?.(requirement)}
          >
            + Add gear
          </button>
        )}
      </div>
    </div>
  );
}

interface GearStatusProps {
  gear: UserGearMatch;
}

function GearStatus({ gear }: GearStatusProps) {
  const { indicator, color, label } = formatValidationResult(gear.validation);

  return (
    <div className="gear-status">
      <div className="gear-status-header">
        <span className="status-indicator" style={{ color }}>
          {indicator}
        </span>
        <span className="gear-match-name">
          {gear.manufacturer && <span className="gear-manufacturer">{gear.manufacturer}</span>}
          {gear.name}
        </span>
      </div>
      <div className="gear-status-label" style={{ color }}>
        {label}
      </div>
      {gear.validation.reasons.length > 0 && (
        <div className="gear-status-reasons">
          {gear.validation.reasons.map((reason, i) => (
            <div key={i} className="gear-reason">{reason}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// Simple inline display for chat bubbles
interface GearStatusInlineProps {
  gear: UserGearMatch;
}

export function GearStatusInline({ gear }: GearStatusInlineProps) {
  const { indicator, color, label } = formatValidationResult(gear.validation);

  return (
    <div className="gear-inline">
      <span className="status-indicator" style={{ color }}>{indicator}</span>
      <span className="gear-inline-name">{gear.name}</span>
      <span className="gear-inline-label" style={{ color }}>{label}</span>
      {gear.validation.reasons.length > 0 && (
        <div className="gear-inline-reasons">
          {gear.validation.reasons.slice(0, 2).join(', ')}
        </div>
      )}
    </div>
  );
}
