'use client';

import { useState, useEffect, useCallback } from 'react';
import { GearItem, ProductMatch } from '@/types';

interface UseGearPortfolioReturn {
  // Gear state
  gear: GearItem[];
  isLoading: boolean;
  gearByCategory: Record<string, GearItem[]>;

  // Add modal state
  showAddModal: boolean;
  setShowAddModal: (show: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: ProductMatch[];
  isSearching: boolean;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedGender: string;
  setSelectedGender: (gender: string) => void;
  addingGear: ProductMatch | null;
  gearNotes: string;
  setGearNotes: (notes: string) => void;

  // Review state
  reviewingGear: GearItem | null;
  reviewRating: number;
  setReviewRating: (rating: number) => void;
  reviewTitle: string;
  setReviewTitle: (title: string) => void;
  reviewText: string;
  setReviewText: (text: string) => void;
  reviewConditions: string;
  setReviewConditions: (conditions: string) => void;
  isSavingReview: boolean;

  // UI state
  expandedItems: Set<string>;
  brokenImages: Set<string>;
  collapsedCategories: Set<string>;
  editingWeightId: string | null;
  editingWeightValue: string;

  // Actions
  handleSearch: () => Promise<void>;
  handleSelectGear: (product: ProductMatch) => void;
  clearAddingGear: () => void;
  handleSaveGear: () => Promise<void>;
  closeAddModal: () => void;
  handleDeleteGear: (id: string) => Promise<void>;
  openReviewModal: (item: GearItem) => void;
  closeReviewModal: () => void;
  handleSaveReview: () => Promise<void>;
  handleSaveWeight: (gearCatalogId: string) => Promise<void>;
  toggleExpanded: (id: string) => void;
  toggleCategory: (category: string) => void;
  markImageBroken: (id: string) => void;
  startWeightEdit: (id: string, currentWeight: string) => void;
  setEditingWeightValue: (value: string) => void;
  cancelWeightEdit: () => void;
}

export function useGearPortfolio(userId: string | undefined, status: string): UseGearPortfolioReturn {
  // Gear state
  const [gear, setGear] = useState<GearItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProductMatch[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [addingGear, setAddingGear] = useState<ProductMatch | null>(null);
  const [gearNotes, setGearNotes] = useState('');

  // Review modal state
  const [reviewingGear, setReviewingGear] = useState<GearItem | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewConditions, setReviewConditions] = useState('');
  const [isSavingReview, setIsSavingReview] = useState(false);

  // UI state
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [editingWeightId, setEditingWeightId] = useState<string | null>(null);
  const [editingWeightValue, setEditingWeightValueState] = useState('');

  // Load user's gear
  useEffect(() => {
    if (userId) {
      loadGear();
    } else if (status !== 'loading') {
      setIsLoading(false);
    }
  }, [userId, status]);

  // Default all categories to collapsed on initial load
  useEffect(() => {
    if (gear.length > 0 && collapsedCategories.size === 0) {
      const allCategories = new Set(gear.map(g => g.category || 'other'));
      setCollapsedCategories(allCategories);
    }
  }, [gear, collapsedCategories.size]);

  const loadGear = async () => {
    try {
      const response = await fetch('/api/gear');
      const data = await response.json();
      setGear(data.gear || []);
    } catch (error) {
      console.error('Failed to load gear:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) return;

    setIsSearching(true);
    try {
      const response = await fetch('/api/search-gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery.trim(),
          online: true,
        }),
      });
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectGear = (product: ProductMatch) => {
    setAddingGear(product);
    setSearchResults([]);
    if (product.category) setSelectedCategory(product.category);
    if (product.gender) setSelectedGender(product.gender);
  };

  const clearAddingGear = useCallback(() => {
    setAddingGear(null);
  }, []);

  const handleSaveGear = async () => {
    if (!addingGear || !selectedCategory) return;

    try {
      const response = await fetch('/api/gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addingGear.name,
          brand: addingGear.brand,
          specs: addingGear.specs,
          category: selectedCategory,
          subcategory: addingGear.subcategory,
          gender: selectedGender,
          imageUrl: addingGear.imageUrl,
          description: addingGear.description,
          productUrl: addingGear.productUrl,
          reviews: addingGear.reviews,
          notes: gearNotes,
        }),
      });

      if (response.ok) {
        await loadGear();
        closeAddModal();
      }
    } catch (error) {
      console.error('Failed to save gear:', error);
    }
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setAddingGear(null);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedCategory('');
    setSelectedGender('');
    setGearNotes('');
  };

  const handleDeleteGear = async (id: string) => {
    if (!confirm('Remove this gear from your portfolio?')) return;

    try {
      await fetch(`/api/gear?id=${id}`, { method: 'DELETE' });
      await loadGear();
    } catch (error) {
      console.error('Failed to delete gear:', error);
    }
  };

  const openReviewModal = (item: GearItem) => {
    setReviewingGear(item);
    setReviewRating(item.userReview?.rating || 0);
    setReviewTitle(item.userReview?.title || '');
    setReviewText(item.userReview?.review || '');
    setReviewConditions(item.userReview?.conditions || '');
  };

  const closeReviewModal = () => {
    setReviewingGear(null);
    setReviewRating(0);
    setReviewTitle('');
    setReviewText('');
    setReviewConditions('');
  };

  const handleSaveReview = async () => {
    if (!reviewingGear || reviewRating === 0) return;

    setIsSavingReview(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gearId: reviewingGear.gearCatalogId,
          rating: reviewRating,
          title: reviewTitle || null,
          review: reviewText || null,
          conditions: reviewConditions || null,
        }),
      });

      if (response.ok) {
        await loadGear();
        closeReviewModal();
      }
    } catch (error) {
      console.error('Failed to save review:', error);
    } finally {
      setIsSavingReview(false);
    }
  };

  const handleSaveWeight = async (gearCatalogId: string) => {
    const weightG = parseInt(editingWeightValue);
    if (isNaN(weightG) || weightG < 0) {
      setEditingWeightId(null);
      return;
    }

    try {
      await fetch('/api/gear/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gearCatalogId, weightG }),
      });
      await loadGear();
    } catch (error) {
      console.error('Failed to save weight:', error);
    } finally {
      setEditingWeightId(null);
      setEditingWeightValueState('');
    }
  };

  const toggleExpanded = useCallback((id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const toggleCategory = useCallback((category: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  }, []);

  const markImageBroken = useCallback((id: string) => {
    setBrokenImages(prev => new Set(prev).add(id));
  }, []);

  const startWeightEdit = useCallback((id: string, currentWeight: string) => {
    setEditingWeightId(id);
    setEditingWeightValueState(currentWeight);
  }, []);

  const cancelWeightEdit = useCallback(() => {
    setEditingWeightId(null);
    setEditingWeightValueState('');
  }, []);

  // Group gear by category
  const gearByCategory = gear.reduce((acc, item) => {
    const cat = item.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, GearItem[]>);

  return {
    // Gear state
    gear,
    isLoading,
    gearByCategory,

    // Add modal state
    showAddModal,
    setShowAddModal,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    selectedCategory,
    setSelectedCategory,
    selectedGender,
    setSelectedGender,
    addingGear,
    gearNotes,
    setGearNotes,

    // Review state
    reviewingGear,
    reviewRating,
    setReviewRating,
    reviewTitle,
    setReviewTitle,
    reviewText,
    setReviewText,
    reviewConditions,
    setReviewConditions,
    isSavingReview,

    // UI state
    expandedItems,
    brokenImages,
    collapsedCategories,
    editingWeightId,
    editingWeightValue,

    // Actions
    handleSearch,
    handleSelectGear,
    clearAddingGear,
    handleSaveGear,
    closeAddModal,
    handleDeleteGear,
    openReviewModal,
    closeReviewModal,
    handleSaveReview,
    handleSaveWeight,
    toggleExpanded,
    toggleCategory,
    markImageBroken,
    startWeightEdit,
    setEditingWeightValue: setEditingWeightValueState,
    cancelWeightEdit,
  };
}
