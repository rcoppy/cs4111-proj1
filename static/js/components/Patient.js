const Patient = ({ id, firstName, lastName, prescriptions }) => `
    <div data-id="${id}" class="b-bottom">
        <h3>${lastName}, ${firstName}</h3>
        <p>Prescriptions: </p>
        <ul> 
            ${ prescriptions.map(rx => "<li>" + rx.name + " " + rx.dosage + " mg, " + rx.doseCount + " doses | prescribed: " + rx.datePrescribed + "</li>").join('')}
        </ul>
    </div>
`;

export default Patient; 

// ${ prescriptions.map(rx => "<li>" + rx.name + " " + rx.dosage + ", " + rx.doseCount + " | " + rx.datePrescribed + "</li>").join('')}
// ecounters join reserves using (aptid) join supervises using (pvid)