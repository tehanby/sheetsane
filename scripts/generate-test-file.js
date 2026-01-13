/**
 * Generate a test Excel file with intentional errors for SheetSane testing
 * Run with: node scripts/generate-test-file.js
 */

const XLSX = require('xlsx');
const path = require('path');

// Create a new workbook
const workbook = XLSX.utils.book_new();

// =====================
// Sheet 1: Products (has various issues)
// =====================
const productsData = [
  // Headers - includes duplicates and empty
  ['id', 'Product Name', 'Price', 'SKU', '', 'Price', 'Category'],  // Duplicate 'Price', empty header
  
  // Data rows with issues
  ['1', 'Widget A', 29.99, 'SKU-001', 'Extra data', 15.00, 'Electronics'],
  ['2', 'Widget B', '#VALUE!', 'SKU-002', '', 20.00, 'Electronics'],  // Error value
  ['3', 'Gadget X', 49.99, 'SKU-003', '', '#REF!', 'Home'],           // Error value
  ['1', 'Widget C', 39.99, 'SKU-001', '', 25.00, 'Electronics'],      // Duplicate ID '1' and SKU
  ['5', 'Gadget Y', '#DIV/0!', 'SKU-005', '', 30.00, 'Home'],         // Error value
  ['6', 'Thing Z', 19.99, 'SKU-006', '', 12.00, 'Office'],
  ['7', 'Item W', 'twenty', 'SKU-007', '', 8.00, 'Office'],           // Text in numeric column
  ['8', 'Product Q', 89.99, 'SKU-008', '', '#NAME?', 'Electronics'],  // Error value
  ['3', 'Duplicate', 15.00, 'SKU-003', '', 10.00, 'Home'],            // Duplicate ID '3' and SKU
];

const productsSheet = XLSX.utils.aoa_to_sheet(productsData);
XLSX.utils.book_append_sheet(workbook, productsSheet, 'Products');

// =====================
// Sheet 2: Orders (has date format issues)
// =====================
const ordersData = [
  ['order_id', 'Customer', 'Order Date', 'Amount', 'Status'],
  
  ['ORD-001', 'John Doe', '2024-01-15', 150.00, 'Completed'],
  ['ORD-002', 'Jane Smith', 'January 20, 2024', 275.50, 'Pending'],    // Text date
  ['ORD-003', 'Bob Wilson', '01/25/2024', 89.99, 'Completed'],         // Text date format
  ['ORD-001', 'Alice Brown', '2024-02-01', 199.00, 'Shipped'],         // Duplicate order_id
  ['ORD-005', 'Charlie Davis', 'Feb 5, 2024', 450.00, 'Completed'],    // Text date
  ['ORD-006', 'Eve Johnson', '02-10-2024', 320.00, 'Pending'],         // Text date format
  ['ORD-007', 'Frank Miller', '2024/02/15', 175.00, 'Completed'],      // Text date format
  ['ORD-008', 'Grace Lee', 'February 20th', 225.00, 'Shipped'],        // Text date
  ['ORD-009', 'Henry Brown', '2024-02-25', 99.99, 'Pending'],
  ['ORD-010', 'Ivy Clark', '03/01/2024', 550.00, 'Completed'],         // Text date format
];

const ordersSheet = XLSX.utils.aoa_to_sheet(ordersData);
XLSX.utils.book_append_sheet(workbook, ordersSheet, 'Orders');

// =====================
// Sheet 3: Empty Data Sheet (only headers)
// =====================
const emptyData = [
  ['Column A', 'Column B', 'Column C', 'Column D'],
  // No data rows
];

const emptySheet = XLSX.utils.aoa_to_sheet(emptyData);
XLSX.utils.book_append_sheet(workbook, emptySheet, 'Empty Sheet');

// =====================
// Sheet 4: Missing Header (first row blank)
// =====================
const missingHeaderData = [
  ['', '', '', ''],  // Blank header row
  ['1', 'Data A', 100, 'Active'],
  ['2', 'Data B', 200, 'Inactive'],
  ['3', 'Data C', 300, 'Active'],
];

const missingHeaderSheet = XLSX.utils.aoa_to_sheet(missingHeaderData);
XLSX.utils.book_append_sheet(workbook, missingHeaderSheet, 'No Headers');

// =====================
// Sheet 5: Mixed Types (numeric column with strings)
// =====================
const mixedData = [
  ['ID', 'Name', 'Quantity', 'Unit Price', 'Total'],
  
  ['1', 'Apple', 10, 1.50, 15.00],
  ['2', 'Banana', 'five', 0.75, 3.75],        // Text in numeric column
  ['3', 'Orange', 8, 2.00, 16.00],
  ['4', 'Grape', 'dozen', 3.50, 42.00],       // Text in numeric column
  ['5', 'Mango', 6, 'two fifty', 15.00],      // Text in numeric column
  ['6', 'Kiwi', 12, 1.25, 15.00],
  ['7', 'Pear', 'N/A', 1.75, '#N/A'],         // Text and error
  ['8', 'Plum', 9, 1.00, 9.00],
  ['9', 'Cherry', 'twenty', 0.50, 10.00],     // Text in numeric column
  ['10', 'Lime', 15, 0.60, 9.00],
];

const mixedSheet = XLSX.utils.aoa_to_sheet(mixedData);
XLSX.utils.book_append_sheet(workbook, mixedSheet, 'Inventory');

// =====================
// Hidden Sheet (should trigger warning)
// =====================
const hiddenData = [
  ['Secret ID', 'Hidden Data', 'Confidential'],
  ['H001', 'This is hidden', 'Top Secret'],
  ['H002', 'Nobody can see this', 'Classified'],
];

const hiddenSheet = XLSX.utils.aoa_to_sheet(hiddenData);
XLSX.utils.book_append_sheet(workbook, hiddenSheet, 'Hidden Sheet');

// Mark the sheet as hidden
if (!workbook.Workbook) workbook.Workbook = {};
if (!workbook.Workbook.Sheets) workbook.Workbook.Sheets = [];

// Find the hidden sheet index and mark it hidden
const sheetIndex = workbook.SheetNames.indexOf('Hidden Sheet');
workbook.Workbook.Sheets[sheetIndex] = { Hidden: 1 };

// Write the file
const outputPath = path.join(__dirname, '..', 'test-spreadsheet.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log(`✅ Test file created: ${outputPath}`);
console.log('');
console.log('Expected issues to be detected:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('ERRORS:');
console.log('  • Products sheet: 4 formula errors (#VALUE!, #REF!, #DIV/0!, #NAME?)');
console.log('  • Products sheet: Duplicate IDs (1, 3) if "id" selected as key column');
console.log('  • Products sheet: Duplicate SKUs if "SKU" selected as key column');
console.log('  • No Headers sheet: Missing header row (first row blank)');
console.log('');
console.log('WARNINGS:');
console.log('  • Products sheet: Duplicate column headers ("Price" appears twice)');
console.log('  • Products sheet: Empty column header (column E)');
console.log('  • Orders sheet: 60%+ text-formatted dates');
console.log('  • Orders sheet: Duplicate order_id (ORD-001)');
console.log('  • Empty Sheet: Only header row, no data');
console.log('  • Hidden Sheet: 1 hidden sheet detected');
console.log('  • Inventory sheet: Mixed types in Quantity column');
console.log('  • Inventory sheet: #N/A error in Total column');
console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('Upload this file to SheetSane to test the analysis!');

