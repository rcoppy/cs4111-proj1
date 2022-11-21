const style = `
    background-color: #f2f2f2;
    font-weight: bold; 
`;

const UserProfile = ({firstName, lastName, birthday}) => `
    <div style="${style}" class="b-bottom">
        <h2>${lastName}, ${firstName}</h2>
        <p>DOB: ${birthday}
    </div>
`;
    
export default UserProfile;