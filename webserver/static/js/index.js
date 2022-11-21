import UserProfile from './UserProfile.js';
import DataStore from './lib/DataStore.js';

const store = new DataStore();

store.registerStore('activeUser', {}); 
store.registerHandler('activeUser', (user) => {
    console.log(user);
    $('#banner-data .first-name').text(user['first_name']); 
    $('#banner-data .last-name').text(user['last_name']); 
    $('#banner-data .birthday').text(user['birthday']); 
});


export default function renderPage() {
    $(document).ready(function () {
        // fetch('/example-json')
        //     .then((response) => response.json())
        //     .then((data) => $('#content').append(renderMultiple(UserProfile, data)));

        // getRecordsFromJson('/users', (r) => console.log(r)); 



        const renderMappings = new Map();
        renderMappings.set('users', { component: UserProfile, selector: '#content' });

        // const recordTypes = ['users', 'providers', 'patients']; 

        // get relevant records
        const recordTypes = Array.from(renderMappings.keys());

        fetchRecordTypesToStore(recordTypes).then(
            () => {
                recordTypes.forEach(t => store.registerHandler(t,
                    () => renderRecords(
                        renderMappings.get(t).selector,
                        t,
                        renderMappings.get(t).component
                    )));


                // bind click handlers (order matters--need to register after render handler pushed)
                store.registerHandler('users', (users) => {
                    $('.user-profile').each(function() { $(this).click(
                        () => store.mutate('activeUser', 
                            () => store.getRecords('users').get($(this).data('id')))
                    )}); 
                }); 

                // initial page render
                store.forceInvokeHandlers();

                // choose an active user
                const user = store.getRecords('users').values().next().value; 
                store.mutate('activeUser', () => user); 
            }
        );







    });
}

function renderRecords(targetSelector, type, component) {
    const data = Array.from(store.getRecords(type).values());
    $(targetSelector).append(renderMultiple(component, data));
}

function renderMultiple(component, data) {
    return data.map(component).join('');
}

// apply a function to a collection of records, per record
// expects json payload of array of uniform objects
async function getProcessedRecordsFromJson(type, callback = (record) => { }) {
    const data = await (await fetch('/' + type)).json();
    return data.map(callback);
}

// assumes fetched records will have an 'id' tag
async function getRecordMapOfType(type) {
    const map = new Map();
    await getProcessedRecordsFromJson(type, (record) => map.set(record.id, record));
    return { type: type, map: map };
}

// given an array of record types, fetch them 
async function fetchRecordTypesToStore(types = []) {
    const results = await Promise.all(types.map(t => getRecordMapOfType(t)));

    results.forEach((result) => store.registerStore(result.type, result.map));
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