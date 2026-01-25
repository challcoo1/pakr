'use client';

import { useSession, signIn } from 'next-auth/react';
import Header from '@/components/Header';
import { CATEGORY_CONFIG } from '@/lib/constants';
import { getCategoryIcon } from '@/components/CategoryIcons';
import { useGearPortfolio } from '@/hooks/useGearPortfolio';
import GearCard from '@/components/gear/GearCard';
import AddGearModal from '@/components/gear/AddGearModal';
import ReviewModal from '@/components/gear/ReviewModal';

export default function GearPage() {
  const { data: session, status } = useSession();

  const {
    gear,
    isLoading,
    gearByCategory,
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
    expandedItems,
    brokenImages,
    collapsedCategories,
    editingWeightId,
    editingWeightValue,
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
    setEditingWeightValue,
    cancelWeightEdit,
  } = useGearPortfolio(session?.user?.id, status);

  // Not logged in
  if (status !== 'loading' && !session) {
    return (
      <>
        <Header activePage="gear" />
        <div className="main-content">
          <div className="max-w-4xl mx-auto p-4">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold mb-4">Your Gear Portfolio</h1>
              <p className="text-muted mb-6">Sign in to save and manage your gear collection.</p>
              <button onClick={() => signIn('google')} className="btn-primary">Sign in with Google</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header activePage="gear" />

      <div className="main-content">
        <div className="max-w-4xl mx-auto p-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-xl font-bold">Your Gear Portfolio</h1>
              <p className="text-muted text-sm">{gear.length} items</p>
            </div>
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              + Add Gear
            </button>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="text-center py-12 text-muted">Loading your gear...</div>
          )}

          {/* Empty state */}
          {!isLoading && gear.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted mb-4">No gear in your portfolio yet.</p>
              <button onClick={() => setShowAddModal(true)} className="btn-primary">
                Add Your First Item
              </button>
            </div>
          )}

          {/* Gear by category */}
          {!isLoading && gear.length > 0 && (
            <div className="space-y-6">
              {Object.entries(gearByCategory).map(([category, items]) => {
                if (!items || items.length === 0) return null;

                const isCategoryCollapsed = collapsedCategories.has(category);

                return (
                  <div key={category} className="gear-portfolio-section">
                    <button
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className="gear-portfolio-header gear-portfolio-header-toggle"
                    >
                      <span className="flex items-center gap-2">
                        <svg
                          className={`w-3 h-3 transition-transform ${isCategoryCollapsed ? '' : 'rotate-90'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M6 6L14 10L6 14V6Z" />
                        </svg>
                        {getCategoryIcon(category, { size: 16, className: 'text-muted' })}
                        {CATEGORY_CONFIG[category]?.label || category.toUpperCase()}
                      </span>
                      <span className="text-muted text-xs ml-1">({items.length})</span>
                    </button>
                    {!isCategoryCollapsed && (
                      <div className="gear-portfolio-items">
                        {items.map((item) => (
                          <GearCard
                            key={item.id}
                            item={item}
                            isExpanded={expandedItems.has(item.id)}
                            isEditingWeight={editingWeightId === item.id}
                            editingWeightValue={editingWeightValue}
                            brokenImage={brokenImages.has(item.id)}
                            onToggleExpand={() => toggleExpanded(item.id)}
                            onDelete={() => handleDeleteGear(item.id)}
                            onOpenReview={() => openReviewModal(item)}
                            onStartWeightEdit={(val) => startWeightEdit(item.id, val)}
                            onSaveWeight={() => handleSaveWeight(item.gearCatalogId)}
                            onCancelWeightEdit={cancelWeightEdit}
                            onWeightValueChange={setEditingWeightValue}
                            onImageError={() => markImageBroken(item.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Gear Modal */}
      <AddGearModal
        isOpen={showAddModal}
        onClose={closeAddModal}
        onSave={handleSaveGear}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSearch={handleSearch}
        isSearching={isSearching}
        searchResults={searchResults}
        addingGear={addingGear}
        onSelectGear={handleSelectGear}
        onClearSelectedGear={clearAddingGear}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedGender={selectedGender}
        onGenderChange={setSelectedGender}
        gearNotes={gearNotes}
        onNotesChange={setGearNotes}
      />

      {/* Review Modal */}
      <ReviewModal
        gear={reviewingGear}
        rating={reviewRating}
        title={reviewTitle}
        text={reviewText}
        conditions={reviewConditions}
        isSaving={isSavingReview}
        onClose={closeReviewModal}
        onSave={handleSaveReview}
        onRatingChange={setReviewRating}
        onTitleChange={setReviewTitle}
        onTextChange={setReviewText}
        onConditionsChange={setReviewConditions}
      />
    </>
  );
}
