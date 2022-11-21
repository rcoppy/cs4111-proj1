const style = `
    background-color: #f2f2f2;
    font-weight: bold; 
`;

const UserProfile = ({first_name, last_name, birthday, id}) => `
        <div data-id="${id}" style="${style}" class="user-profile b-bottom">
            <h2>${last_name}, ${first_name}</h2>
            <p>DOB: ${birthday}</p>
        </div>
`;
    
export default UserProfile;