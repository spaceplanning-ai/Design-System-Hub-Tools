import './ProfileCard.scss'

export function ProfileCard() {
  return (
    <div className="sc-scss-card">
      <div className="sc-scss-avatar" />
      <p className="sc-scss-name">Jane Doe</p>
      <p className="sc-scss-role">Designer</p>
      <button type="button" className="sc-scss-button">
        Follow
      </button>
    </div>
  )
}
