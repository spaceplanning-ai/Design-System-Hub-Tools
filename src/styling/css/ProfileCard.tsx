import './ProfileCard.css'

export function ProfileCard() {
  return (
    <div className="sc-css-card">
      <div className="sc-css-avatar" />
      <p className="sc-css-name">Jane Doe</p>
      <p className="sc-css-role">Designer</p>
      <button type="button" className="sc-css-button">
        Follow
      </button>
    </div>
  )
}
