const style = `
    background-color: #f2f2f2;
    font-weight: bold; 
`;

const UserProfile = ({first_name, last_name, birthday}) => `
    <div style="${style}" class="b-bottom">
        <h2>${last_name}, ${first_name}</h2>
        <p>DOB: ${birthday}
    </div>
`;
    
export default UserProfile;