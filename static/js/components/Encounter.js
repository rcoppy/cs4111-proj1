const Encounter = ({ id, dischargeDate, admissionDate, reason, visitType }) => `
    <div data-id="${id}" class="b-bottom">
        <h3>${visitType}: ${reason}</h3>
        <p>Admitted on ${admissionDate}</p> 
        ${ dischargeDate ? "<p>Discharged on " + dischargeDate + "</p>" : "<p>Active</p>"}
    </div>
`;

export default Encounter; 


// ecounters join reserves using (aptid) join supervises using (pvid)