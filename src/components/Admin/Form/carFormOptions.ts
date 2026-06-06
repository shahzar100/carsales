// Shared select-option lists for the car create (`CarForm`) and edit
// (`EditCarForm`) flows. Both forms render the identical fuel / transmission
// / door / status dropdowns, so the option arrays live here to stop the two
// copies drifting apart.

export const currentYear = new Date().getFullYear();

export const fuelOptions = [
  { value: "Petrol", label: "Petrol" },
  { value: "Diesel", label: "Diesel" },
  { value: "Electric", label: "Electric" },
  { value: "Hybrid", label: "Hybrid" },
];

export const transmissionOptions = [
  { value: "Manual", label: "Manual" },
  { value: "Automatic", label: "Automatic" },
  { value: "CVT", label: "CVT" },
];

export const doorOptions = [
  { value: "2", label: "2 Door" },
  { value: "3", label: "3 Door" },
  { value: "4", label: "4 Door" },
  { value: "5", label: "5 Door" },
];

export const statusOptions = [
  { value: "available", label: "Available" },
  { value: "sold", label: "Sold" },
  { value: "reserved", label: "Reserved" },
];
