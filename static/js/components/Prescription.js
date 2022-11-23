const Prescription = ({ id, datePrescribed, name, dosage, doseCount, instructions }) => `
    <div data-id="${id}" class="b-bottom">
        <h3>${name} ${dosage}mg, ${doseCount} doses</h3>
        <p>Prescribed on: ${datePrescribed}</p>
        <p>Instructions: <em>${instructions}</em></p>
    </div>
`;

export default Prescription; 