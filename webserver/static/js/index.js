import UserProfile from './UserProfile.js';
import DataStore from './lib/DataStore.js';

const store = new DataStore(); 


export default function renderPage() {
    $(document).ready(function () {
        // fetch('/example-json')
        //     .then((response) => response.json())
        //     .then((data) => $('#content').append(renderMultiple(UserProfile, data)));

        // getRecordsFromJson('/users', (r) => console.log(r)); 

        fetchRecordTypesToStore(['users', 'providers', 'patients']).then(console.log(store)); 

    });
}

function renderMultiple(component, data) {
    return data.map(component).join('');
}

// apply a function to a collection of records, per record
// expects json payload of array of uniform objects
async function getProcessedRecordsFromJson(type, callback=(record) => {}) {
    const data = await (await fetch('/' + type)).json(); 
    return data.map(callback); 
}

// assumes fetched records will have an 'id' tag
async function getRecordMapOfType(type) {
    const map = new Map(); 
    await getProcessedRecordsFromJson(type, (record) => map.set(record.id, record)); 
    return { type: type, map: map }; 
}

async function fetchRecordTypesToStore(types) {
    (await Promise.all(types.map(t => getRecordMapOfType(t))))
                            .forEach(result => store.registerStore(result.type, result.map));
}



// Example POST method implementation:
async function postData(url = '', data = {}) {
    // Default options are marked with *
    const response = await fetch(url, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: JSON.stringify(data) // body data type must match "Content-Type" header
    });
    return response.json(); // parses JSON response into native JavaScript objects
}

// postData('https://example.com/answer', { answer: 42 })
//   .then((data) => {
//     console.log(data); // JSON data parsed by `data.json()` call
//   });