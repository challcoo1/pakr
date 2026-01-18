'use client';

import type { GearRequirement, UserGearEntry, GearSearchState, ProductMatch } from '@/types';

interface GearBoxProps {
  requirement: GearRequirement;
  entry: UserGearEntry;
  search: GearSearchState;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onRemove: () => void;
  onClear: () => void;
  onRecommend: () => void;
  onSelectProduct: (product: ProductMatch) => void;
  onOnlineSearch: () => void;
}

const getStatusIndicator = (status: string) => {
  switch (status) {
    case 'ideal': return { icon: '●', color: '#2C5530', label: 'Ideal' };
    case 'suitable': return { icon: '●', color: '#2C5530', label: 'Good' };
    case 'adequate': return { icon: '◐', color: '#CC5500', label: 'OK' };
    case 'unsuitable': return { icon: '○', color: '#2B2B2B', label: 'No' };
    default: return { icon: '–', color: '#6B6B6B', label: '' };
  }
};

export default function GearBox({
  requirement,
  entry,
  search,
  onInputChange,
  onSubmit,
  onRemove,
  onClear,
  onRecommend,
  onSelectProduct,
  onOnlineSearch,
}: GearBoxProps) {
  const status = getStatusIndicator(entry.status);

  return (
    <div className="gear-box">
      <div className="gear-box-header">
        <span className="gear-box-bullet">●</span>
        <span className="gear-box-title">{requirement.item.toUpperCase()}</span>
        <button onClick={onRemove} className="gear-box-remove" title="Remove from trip">×</button>
      </div>
      <div className="gear-box-specs">{requirement.specs}</div>
      <div className="gear-box-divider" />

      {entry.status === 'empty' ? (
        <div>
          <div className="gear-box-input-row">
            <input
              type="text"
              value={entry.input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
              placeholder="Search your gear..."
              className="gear-box-input"
            />
            <button
              onClick={onRecommend}
              disabled={search.isSearching || search.isSearchingOnline}
              className="gear-box-recommend"
            >
              {search.isSearching || search.isSearchingOnline ? 'Loading...' : 'Get recommendations →'}
            </button>
          </div>
          <button onClick={onRemove} className="gear-box-action" style={{ marginTop: '0.5rem' }}>
            Remove
          </button>
        </div>
      ) : (
        <div className="gear-box-result">
          <div className="gear-box-result-header">
            <span style={{ color: status.color }}>{status.icon}</span>
            <span className="gear-box-result-name">{entry.input}</span>
          </div>
          {entry.reasons.length > 0 && (
            <div className={`gear-box-result-status ${entry.status}`}>
              {entry.status === 'ideal' && 'IDEAL'}
              {entry.status === 'suitable' && 'SUITABLE'}
              {entry.status === 'adequate' && 'MARGINAL'}
              {entry.status === 'unsuitable' && 'UNSUITABLE'}
              {' - '}{entry.reasons[0]}
            </div>
          )}
          <div className="gear-box-actions">
            <button onClick={onClear} className="gear-box-action">Change</button>
            <button onClick={onRemove} className="gear-box-action">Remove</button>
            <button
              onClick={onRecommend}
              disabled={search.isSearching || search.isSearchingOnline}
              className="gear-box-action-primary"
            >
              {search.isSearching || search.isSearchingOnline ? 'Loading...' : 'Get better options →'}
            </button>
          </div>
        </div>
      )}

      {search.showResults && (
        <SearchResults
          search={search}
          onSelectProduct={onSelectProduct}
          onOnlineSearch={onOnlineSearch}
        />
      )}
    </div>
  );
}

function SearchResults({
  search,
  onSelectProduct,
  onOnlineSearch,
}: {
  search: GearSearchState;
  onSelectProduct: (product: ProductMatch) => void;
  onOnlineSearch: () => void;
}) {
  if (search.isSearching) {
    return (
      <div className="gear-box-dropdown">
        <div className="gear-box-dropdown-item text-muted">Finding recommendations...</div>
      </div>
    );
  }

  if (search.recommendation?.topPick) {
    return (
      <div className="gear-box-dropdown">
        <div className="gear-rec-top">
          <div className="gear-rec-label">⭐ TOP PICK</div>
          <button
            type="button"
            onClick={() => onSelectProduct({
              name: search.recommendation!.topPick!.name,
              brand: search.recommendation!.topPick!.brand,
              specs: search.recommendation!.topPick!.reason,
              source: 'online'
            })}
            className="gear-rec-pick"
          >
            <div className="gear-rec-name">{search.recommendation.topPick.name}</div>
            {search.recommendation.topPick.communityRating && (
              <div className="text-sm star-rating mt-1">
                {'★'.repeat(Math.round(search.recommendation.topPick.communityRating.avgRating))}
                {'☆'.repeat(5 - Math.round(search.recommendation.topPick.communityRating.avgRating))}
                <span className="text-muted ml-1">
                  {search.recommendation.topPick.communityRating.avgRating} from {search.recommendation.topPick.communityRating.reviewCount} users
                </span>
              </div>
            )}
            <div className="gear-rec-reason">{search.recommendation.topPick.reason}</div>
            <div className="gear-rec-select">Select this →</div>
          </button>
        </div>

        {search.recommendation.alternatives.length > 0 && (
          <div className="gear-rec-alts">
            <div className="gear-rec-alt-label">ALSO CONSIDER</div>
            {search.recommendation.alternatives.map((alt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectProduct({
                  name: alt.name,
                  brand: alt.brand,
                  specs: alt.comparison,
                  source: 'online'
                })}
                className="gear-rec-alt"
              >
                <div className="flex-1">
                  <span className="gear-rec-alt-name">{alt.name}</span>
                  {alt.communityRating && (
                    <span className="star-rating text-xs ml-2">
                      {'★'.repeat(Math.round(alt.communityRating.avgRating))}
                      <span className="text-muted ml-1">({alt.communityRating.reviewCount})</span>
                    </span>
                  )}
                </div>
                <span className="gear-rec-alt-diff">{alt.comparison}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (search.results.length > 0) {
    return (
      <div className="gear-box-dropdown">
        {search.results.map((product, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectProduct(product)}
            className="gear-box-dropdown-item"
          >
            <div className="font-medium">{product.name}</div>
            <div className="text-xs text-muted">{product.specs}</div>
          </button>
        ))}
        <button
          type="button"
          onClick={onOnlineSearch}
          disabled={search.isSearchingOnline}
          className="gear-box-dropdown-online"
        >
          {search.isSearchingOnline ? 'Searching...' : 'Search online for more →'}
        </button>
      </div>
    );
  }

  return (
    <div className="gear-box-dropdown">
      <div className="gear-box-dropdown-item text-muted">No matches found</div>
      <button
        type="button"
        onClick={onOnlineSearch}
        disabled={search.isSearchingOnline}
        className="gear-box-dropdown-online"
      >
        {search.isSearchingOnline ? 'Searching...' : 'Search online →'}
      </button>
    </div>
  );
}
