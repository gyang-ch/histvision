export const getPlantColor = (label: string) => {
  const normalizedLabel = (label || '').toLowerCase();
  if (normalizedLabel === 'plant_herb') {
    // Explicit green-ish color for plant_herb class
    return '34, 197, 94';
  }

  const colors = [
    '20, 184, 166',   // teal (moved up)
    '217, 119, 6',    // goldenrod
    '124, 58, 237',   // violet
    '5, 150, 105',    // emerald
    '225, 29, 72',    // rose
    '79, 70, 229',    // indigo
    '217, 70, 239',   // fuchsia
    '101, 163, 13',   // lime/sage
    '2, 132, 199',    // light blue
    '147, 51, 234',   // purple
    '234, 88, 12',    // orange/terracotta
    '13, 148, 136',   // dark teal
    '190, 18, 60',    // crimson
  ];
  
  if (!label) return colors[0];
  
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    // Modified hash to ensure colors "switch" from previous version
    hash = label.charCodeAt(i) + ((hash << 7) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};
