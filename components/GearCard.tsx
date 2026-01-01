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
  const priorityLabels = {
    critical: 'Essential',
    recommended: 'Recommended',
    optional: 'Optional',
  };

  return (
    <div className="gear-card fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-lg leading-tight">{name}</h3>
          <p className="text-sm opacity-60">{manufacturer}</p>
        </div>
        {priority && (
          <span className={`catalog-tag priority-${priority}`}>
            {priorityLabels[priority]}
          </span>
        )}
        {owned && (
          <span className="catalog-tag" style={{ backgroundColor: 'var(--forest)', color: 'var(--cream)' }}>
            Owned
          </span>
        )}
      </div>

      {/* Category */}
      <p className="text-xs uppercase tracking-wider opacity-50 mb-3">
        {category.replace(/\//g, ' / ')}
      </p>

      {/* Specs */}
      {specs && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mb-3">
          {specs.weight && (
            <span>
              {specs.weight.value}{specs.weight.unit}
            </span>
          )}
          {specs.waterproofing && (
            <span>{specs.waterproofing}</span>
          )}
        </div>
      )}

      {/* Requirements (for trip analysis) */}
      {requirements && Object.keys(requirements).length > 0 && (
        <div className="mt-3 pt-3 border-t border-opacity-10" style={{ borderColor: 'var(--charcoal)' }}>
          <p className="text-xs uppercase tracking-wider opacity-50 mb-2">Requirements</p>
          <ul className="text-sm space-y-1">
            {Object.entries(requirements).slice(0, 3).map(([key, value]) => (
              <li key={key} className="flex">
                <span className="opacity-50 mr-2">{key.replace(/_/g, ' ')}:</span>
                <span>{value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Reasoning */}
      {reasoning && (
        <p className="mt-3 text-sm opacity-70 italic">
          {reasoning}
        </p>
      )}
    </div>
  );
}

interface GearGridProps {
  items: GearCardProps[];
  columns?: 1 | 2 | 3;
}

export function GearGrid({ items, columns = 2 }: GearGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {items.map((item, index) => (
        <GearCard key={index} {...item} />
      ))}
    </div>
  );
}
