interface GearCardProps {
  name: string;
  manufacturer: string;
  category: string;
  specs?: {
    weight?: { value: number; unit: string };
    waterproofing?: string;
    [key: string]: unknown;
  };
  priority?: 'critical' | 'recommended' | 'optional';
  reasoning?: string;
  requirements?: Record<string, string>;
  owned?: boolean;
}

export function GearCard({
  name,
  manufacturer,
  category,
  specs,
  priority,
  reasoning,
  requirements,
  owned,
}: GearCardProps) {
  return (
    <div className="gear-item">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <span className="font-semibold">{name}</span>
          <span className="text-sm ml-2" style={{ color: 'var(--ink-light)' }}>
            {manufacturer}
          </span>
        </div>
        <div className="flex gap-2 shrink-0">
          {priority === 'critical' && <span className="tag">Required</span>}
          {priority === 'recommended' && <span className="tag-outline">Recommended</span>}
          {owned && (
            <span className="tag" style={{ backgroundColor: 'var(--forest)' }}>Owned</span>
          )}
        </div>
      </div>

      {/* Category */}
      <p className="text-xs mb-2" style={{ color: 'var(--ink-light)' }}>
        {category.replace(/\//g, ' → ')}
      </p>

      {/* Specs inline */}
      {specs && (
        <div className="flex gap-4 text-sm mb-2">
          {specs.weight && (
            <span>{specs.weight.value}{specs.weight.unit}</span>
          )}
          {specs.waterproofing && (
            <span>{specs.waterproofing}</span>
          )}
        </div>
      )}

      {/* Requirements */}
      {requirements && Object.keys(requirements).length > 0 && (
        <div className="text-sm" style={{ color: 'var(--ink-light)' }}>
          {Object.entries(requirements).slice(0, 2).map(([key, value]) => (
            <span key={key} className="mr-4">
              {key.replace(/_/g, ' ')}: <span style={{ color: 'var(--ink)' }}>{value}</span>
            </span>
          ))}
        </div>
      )}

      {/* Reasoning */}
      {reasoning && (
        <p className="text-sm mt-2" style={{ color: 'var(--ink-light)' }}>
          {reasoning}
        </p>
      )}
    </div>
  );
}

interface GearGridProps {
  items: GearCardProps[];
}

export function GearGrid({ items }: GearGridProps) {
  return (
    <div className="border" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
      {items.map((item, index) => (
        <GearCard key={index} {...item} />
      ))}
    </div>
  );
}
