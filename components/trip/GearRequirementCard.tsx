'use client';

import { GearRequirement, UserGearEntry, GearSearchState, ProductMatch, Recommendation } from '@/types';

interface GearRequirementCardProps {
  requirement: GearRequirement;
  entry: UserGearEntry;
  search: GearSearchState;
  onGearChange: (value: string) => void;
  onGearSubmit: () => void;
  onRecommend: () => void;
  onRemove: () => void;
  onClear: () => void;
  onSelectProduct: (product: ProductMatch) => void;
  onOnlineSearch: () => void;
}

function getStatusIndicator(status: string) {
  switch (status) {
    case 'ideal': return { icon: '●', color: '#2C5530', label: 'Ideal' };
    case 'suitable': return { icon: '●', color: '#2C5530', label: 'Good' };
    case 'adequate': return { icon: '◐', color: '#CC5500', label: 'OK' };
    case 'unsuitable': return { icon: '○', color: '#2B2B2B', label: 'No' };
    default: return { icon: '–', color: '#6B6B6B', label: '' };
  }
}

export default function GearRequirementCard({
  requirement,
  entry,
  search,
  onGearChange,
  onGearSubmit,
  onRecommend,
  onRemove,
  onClear,
  onSelectProduct,
  onOnlineSearch,
}: GearRequirementCardProps) {
  const status = getStatusIndicator(entry.status);

  return (
    <div className="gear-box">
      {/* Header */}
      <div className="gear-box-header">
        <span className="gear-box-bullet">●</span>
        <span className="gear-box-title">{requirement.item.toUpperCase()}</span>
        <button
          onClick={onRemove}
          className="gear-box-remove"
          title="Remove from trip"
        >
          ×
        </button>
      </div>
      <div className="gear-box-specs">{requirement.specs}</div>

      <div className="gear-box-divider" />

      {/* Empty/typing state - show search input */}
      {entry.status === 'empty' && (
        <div>
          <div className="gear-box-input-row">
            <input
              type="text"
              value={entry.input}
              onChange={(e) => onGearChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onGearSubmit()}
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
          <button
            onClick={onRemove}
            className="gear-box-action"
            style={{ marginTop: '0.5rem' }}
          >
            Remove
          </button>
        </div>
      )}

      {/* Validated state - show result */}
      {entry.status !== 'empty' && (
        <div className="gear-box-result">
          <div className="gear-box-result-header">
            <span style={{ color: status.color }}>{status.icon}</span>
            <span className="gear-box-result-name">{entry.input}</span>
          </div>
          {entry.reasons.length > 0 && (
            <div className={`gear-box-result-status ${entry.status}`}>
              {entry.matchLevel === 'excellent' && 'Excellent match'}
              {entry.matchLevel === 'good' && 'Good match'}
              {entry.matchLevel === 'adequate' && 'Adequate'}
              {entry.matchLevel === 'poor' && 'Consider alternatives'}
              {!entry.matchLevel && entry.status === 'ideal' && 'IDEAL'}
              {!entry.matchLevel && entry.status === 'suitable' && 'SUITABLE'}
              {!entry.matchLevel && entry.status === 'adequate' && 'MARGINAL'}
              {!entry.matchLevel && entry.status === 'unsuitable' && 'UNSUITABLE'}
              {' — '}{entry.reasons[0]}
            </div>
          )}
          <div className="gear-box-actions">
            <button onClick={onClear} className="gear-box-action">
              Change
            </button>
            <button onClick={onRemove} className="gear-box-action">
              Remove
            </button>
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

      {/* Search results / Recommendations */}
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

interface SearchResultsProps {
  search: GearSearchState;
  onSelectProduct: (product: ProductMatch) => void;
  onOnlineSearch: () => void;
}

function SearchResults({ search, onSelectProduct, onOnlineSearch }: SearchResultsProps) {
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
        <RecommendationDisplay
          recommendation={search.recommendation}
          onSelectProduct={onSelectProduct}
        />
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

interface RecommendationDisplayProps {
  recommendation: Recommendation;
  onSelectProduct: (product: ProductMatch) => void;
}

function RecommendationDisplay({ recommendation, onSelectProduct }: RecommendationDisplayProps) {
  const topPick = recommendation.topPick!;

  return (
    <>
      {/* Top Pick */}
      <div className="gear-rec-top">
        <div className="gear-rec-label">TOP PICK</div>
        <button
          type="button"
          onClick={() => onSelectProduct({
            name: topPick.name,
            brand: topPick.brand,
            specs: topPick.reason,
            source: 'online'
          })}
          className="gear-rec-pick"
        >
          <div className="gear-rec-name">{topPick.name}</div>
          {topPick.communityRating && (
            <div className="text-sm star-rating mt-1">
              {'★'.repeat(Math.round(topPick.communityRating.avgRating))}
              {'☆'.repeat(5 - Math.round(topPick.communityRating.avgRating))}
              <span className="text-muted ml-1">
                {topPick.communityRating.avgRating} from {topPick.communityRating.reviewCount} {topPick.communityRating.reviewCount === 1 ? 'user' : 'users'}
              </span>
            </div>
          )}
          <div className="gear-rec-reason">{topPick.reason}</div>
          <div className="gear-rec-select">Select this →</div>
        </button>
      </div>

      {/* Alternatives */}
      {recommendation.alternatives.length > 0 && (
        <div className="gear-rec-alts">
          <div className="gear-rec-alt-label">ALSO CONSIDER</div>
          {recommendation.alternatives.map((alt, idx) => (
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
    </>
  );
}
