import styled from 'styled-components'

const Card = styled.div`
  width: 280px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 20px;
`

const Avatar = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #6366f1;
`

const Name = styled.p`
  font-weight: bold;
  font-size: 16px;
  margin: 12px 0 4px;
`

const Role = styled.p`
  color: #6b7280;
  font-size: 13px;
  margin: 0 0 16px;
`

const FollowButton = styled.button`
  background: #6366f1;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
`

export function ProfileCard() {
  return (
    <Card>
      <Avatar />
      <Name>Jane Doe</Name>
      <Role>Designer</Role>
      <FollowButton type="button">Follow</FollowButton>
    </Card>
  )
}
