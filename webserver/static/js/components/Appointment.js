const Appointment = ({provider_name, patient_name, time, reason, duration, id}) => `
        <div data-id="${id}" class="appointment b-bottom">
            <h4>${time}, ${duration} minutes</h4>
            <p>Seeing ${provider_name}</p>
            <p>Reason: ${reason}</p>
        </div>
`;
    
export default Appointment;