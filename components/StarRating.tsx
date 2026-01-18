'use client';

interface StarRatingProps {
  rating: number;
  onRate?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function StarRating({
  rating,
  onRate,
  readonly = false,
  size = 'md',
}: StarRatingProps) {
  const sizeClass = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
  }[size];

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onRate?.(star)}
          disabled={readonly}
          className={`${sizeClass} ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
        >
          {star <= rating ? '★' : '☆'}
        </button>
      ))}
    </div>
  );
}

export function getRatingLabel(rating: number): string {
  if (rating === 5) return 'Excellent';
  if (rating === 4) return 'Great';
  if (rating === 3) return 'Good';
  if (rating === 2) return 'Fair';
  if (rating === 1) return 'Poor';
  return '';
}
