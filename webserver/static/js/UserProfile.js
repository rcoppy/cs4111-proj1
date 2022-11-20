const UserProfile = ({firstName, lastName, birthday}) => `
    <div class="profile-entry b-bottom">
        <h2>${lastName}, ${firstName}</h2>
        <p>DOB: ${birthday}
    </div>
`;
    
export default UserProfile;