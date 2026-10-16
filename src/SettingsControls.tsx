import type { Quality } from './journey/quality'

export default function SettingsControls({ reduced, setReduced, quality, setQuality }: {
  reduced: boolean; setReduced: (value: boolean) => void
  quality: Quality; setQuality: (value: Quality) => void
}) {
  return <div className="settings-controls">
    <label className="setting-option">
      <input type="checkbox" checked={reduced} onChange={event => setReduced(event.target.checked)} />
      ลดการเคลื่อนไหว
    </label>
    <fieldset className="quality-options">
      <legend>คุณภาพภาพ</legend>
      {([['standard', 'มาตรฐาน'], ['light', 'เบา']] as const).map(([value, label]) => (
        <label key={value} className="setting-option">
          <input type="radio" name="quality" value={value} checked={quality === value}
            onChange={() => setQuality(value)} />
          {label}
        </label>
      ))}
    </fieldset>
  </div>
}
