const Appointment = ({providerName, patientName, time, reason, duration, id}) => `
        <div data-id="${id}" class="appointment b-bottom">
            <h4>${time}, ${duration} minutes</h4>
            <p>Patient: ${patientName}</p>
            <p>Supervising provider: ${providerName}</p> 
            <p>Reason: ${reason}</p>
        </div>
`;
    
export default Appointment;