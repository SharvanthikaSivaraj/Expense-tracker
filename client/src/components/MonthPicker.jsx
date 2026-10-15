export default function MonthPicker({ month, onChange }) {
  return (
    <label className="month-picker">
      <span>Month</span>
      <input
        type="month"
        value={month}
        onChange={(e) => e.target.value && onChange(e.target.value)}
      />
    </label>
  );
}
