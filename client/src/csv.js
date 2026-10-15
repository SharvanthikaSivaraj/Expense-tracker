// CSV export for the transactions list, built in the browser

// Cells starting with these are read as formulas by spreadsheets, so neutralise them
const FORMULA_START = /^[=+\-@\t\r]/;

export function csvCell(value) {
  if (value === null || value === undefined) return '';
  let text = String(value);
  if (typeof value === 'string' && FORMULA_START.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(header, rows) {
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
}

export function transactionsToCsv(transactions, accountNames = {}) {
  const header = ['Date', 'Type', 'Category', 'Amount', 'Payment method', 'Account', 'Note'];
  const rows = transactions.map((t) => [
    new Date(t.date).toISOString().slice(0, 10),
    t.type,
    t.category,
    t.amount,
    t.paymentMethod,
    accountNames[t.account] || '',
    t.note || '',
  ]);
  return toCsv(header, rows);
}

export function downloadCsv(filename, text) {
  // BOM so Excel reads the rupee sign and other characters as UTF-8
  const blob = new Blob(['﻿', text], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
