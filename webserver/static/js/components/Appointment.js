const Appointment = ({first_name, last_name, birthday, id}) => `
        <div data-id="${id}" class="user-profile b-bottom">
            <h4>${last_name}, ${first_name}</h4>
            <p>DOB: ${birthday}</p>
        </div>
`;
    
export default Appointment;