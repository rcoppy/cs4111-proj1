// const style = `
//     background-color: #f2f2f2;
//     font-weight: bold; 
// `;

// usage: style="${style}"
// drawbacks: can't apply complex style rules

const UserProfile = ({firstName, lastName, birthday, id}) => `
        <div data-id="${id}" class="user-profile b-bottom">
            <h4>${lastName}, ${firstName}</h4>
            <p>DOB: ${birthday}</p>
        </div>
`;
    
export default UserProfile;