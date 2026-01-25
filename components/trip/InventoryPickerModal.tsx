'use client';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
}

interface InventoryPickerModalProps {
  isOpen: boolean;
  userInventory: InventoryItem[];
  addedGear: InventoryItem[];
  onClose: () => void;
  onSelectGear: (gear: InventoryItem) => void;
}

export default function InventoryPickerModal({
  isOpen,
  userInventory,
  addedGear,
  onClose,
  onSelectGear,
}: InventoryPickerModalProps) {
  if (!isOpen) return null;

  const availableGear = userInventory.filter(g => !addedGear.some(added => added.id === g.id));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4">Add from My Gear</h2>

        {userInventory.length === 0 ? (
          <p className="text-muted text-sm">No gear in your inventory yet.</p>
        ) : (
          <div className="overflow-y-auto flex-1 -mx-2 px-2">
            <div className="space-y-2">
              {availableGear.map(g => (
                <button
                  key={g.id}
                  onClick={() => {
                    onSelectGear(g);
                    onClose();
                  }}
                  className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium">{g.name}</div>
                  <div className="text-xs text-muted">{g.category}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border rounded hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
