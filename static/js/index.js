import UserProfile from './components/UserProfile.js';
import Appointment from './components/Appointment.js';
import DataStore from './lib/DataStore.js';
import AppointmentsView from './views/AppointmentsView.js';
import UsersView from './views/UsersView.js';

const store = new DataStore();

export default function renderPage() {
    $(document).ready(function () {

        fetchAllOrSomeRecordsToStore('providers');

        bindViewsToNav();

        initialUserHandlersSetup();

        renderUsersView().then(() => {
            // choose an active user
            const user = store.getRecords('users').values().next().value;
            console.log(user);
            store.mutate('activeUser', () => user);
        });
    });
}

function initialUserHandlersSetup() {
    if (!store.hasStore('users')) store.registerStore('users', new Map());
    if (!store.hasStore('activeUser')) store.registerStore('activeUser', {});

    store.registerHandler('activeUser', (user) => {
        console.log(user);
        $('#banner-data .first-name').text(user['first_name']);
        $('#banner-data .last-name').text(user['last_name']);
        $('#banner-data .birthday').text(user['birthday']);

        const pvid = tryGetProviderIdForUser(user.id);
        const role = pvid === -1 ? "Patient" : store.getRecords('providers').get(pvid).role;

        $('#banner-data .role').text(role);
    });

    store.registerHandler('users', () => {
        renderLambdaFilteredRecords('#provider-list', 'users', UserProfile, (user) => checkIsUserProvider(user));
        renderLambdaFilteredRecords('#patient-list', 'users', UserProfile, (user) => !checkIsUserProvider(user));
        updateSelectedUser(store.getRecords('activeUser'));
    });

    // bind click handlers (order matters--need to register after render handler pushed)
    store.registerHandler('users', (users) => {
        $('.user-profile').each(function () {
            $(this).click( // lambda functions don't preserve 'this'
                () => store.mutate('activeUser',
                    () => store.getRecords('users').get($(this).data('id')))
            )
        });
    });

    // UI signifier for active user
    store.registerHandler('activeUser', user => updateSelectedUser(user));
}

function checkIsUserProvider(user) {
    return tryGetProviderIdForUser(user.id) !== -1;
}

function tryGetProviderIdForUser(userId) {
    try {
        const providerId = Array.from(store.getRecords('providers').values()).filter(p => p.userId === userId)[0].id;
        return providerId;
    } catch (e) {
        console.log(e);
        return -1;
    }
}

function updateSelectedUser(user) {
    $('.user-profile').each(function () {
        if ($(this).data('id') === user['id']) {
            $(this).addClass('active');
        } else {
            $(this).removeClass('active');
        }
    });
}

function bindViewsToNav() {
    $('[data-path="users"]').click(() => {
        renderUsersView();
    });

    $('[data-path="provider-appointments"]').click(() => {
        const user = store.getRecords('activeUser');

        fetchFilteredRecordsToStore('providers', { userId: user.id })
            .then(() => {
                try {
                    const providerId = Array.from(store.getRecords('providers').values()).filter(p => p.userId === user.id)[0].id;
                    renderAppointmentsView({ providerId: providerId });
                } catch {
                    alert("this user isn't a provider");
                }
            })
    });

    $('[data-path="patient-appointments"]').click(() => {
        const user = store.getRecords('activeUser');

        fetchFilteredRecordsToStore('patients', { userId: user.id })
            .then(() => {
                try {
                    const patientId = Array.from(store.getRecords('patients').values()).filter(p => p.userId === user.id)[0].id;
                    renderAppointmentsView({ patientId: patientId });
                } catch {
                    alert("this user isn't a patient");
                }
            })
    });
}

async function fetchFilteredRecordsToStore(recordType = '', params = {}) {
    // expects response to be an array of like objects with at least an id property 
    const response = await fetch('/' + recordType, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!store.hasStore(recordType)) {
        store.registerStore(recordType, new Map());
    }

    const patchedRecords = store.getRecords(recordType);
    data.forEach(record => patchedRecords.set(record.id, record));

    // this leaves old appointments intact; need to make sure render with filter
    store.mutate(recordType, () => patchedRecords);
}

async function fetchAllOrSomeRecordsToStore(recordType, params = null) {
    if (!params) {
        await fetchRecordTypesToStore([recordType]);
    } else {
        await fetchFilteredRecordsToStore(recordType, params);
    }
}

async function fetchAppointmentsToStore(params = {}) {

    // will register the appointments store if it doesn't already exist

    // example params: 
    // { patientId: 1 }
    // { providerId: 1 }
    // { patientId: 1, providerId: 1 }

    await fetchFilteredRecordsToStore('appointments', params);
}

function renderRecords(targetSelector, type, component) {
    const element = $(targetSelector);
    const data = Array.from(store.getRecords(type).values());

    // check element exists
    if (element.length && data.length > 0) {
        element.empty();
        element.append(renderMultiple(component, data));
    }
}

function renderLambdaFilteredRecords(targetSelector, type, component, filterLambda = () => { }) {
    const element = $(targetSelector);

    // check element exists
    if (element.length) {
        // clear children

        const data = Array.from(store.getRecords(type).values())
            .filter(record => {
                return filterLambda(record);
            });

        if (data.length > 0) {
            element.empty();
            element.append(renderMultiple(component, data));
        }
    }
}

function renderFilteredRecords(targetSelector, type, component, filterParams = {}) {
    renderLambdaFilteredRecords(targetSelector, type, component, (record) => {
        for (const [key, value] of Object.entries(filterParams)) {
            if (record[key] !== value) return false;
        }

        return true;
    });
}

// function renderFilteredRecords(targetSelector, type, component, filterParams = {}) {
//     const element = $(targetSelector);

//     // check element exists
//     if (element.length) {
//         // clear children

//         const data = Array.from(store.getRecords(type).values())
//             .filter(record => {
//                 for (const [key, value] of Object.entries(filterParams)) {
//                     if (record[key] !== value) return false;
//                 }

//                 return true;
//             });

//         if (data.length > 0) {
//             element.empty();
//             element.append(renderMultiple(component, data));
//         }
//     }
// }

function renderMultiple(component, data) {
    return data.map(component).join('');
}

// view is of type component function 
async function renderViewWithFetch(targetSelector, view, fetchCall = () => { }) {
    const root = $(targetSelector);
    root.empty();

    if (root.length) {

        // order matters--we want the fetch to trigger a re-render with state
        // *after* the view is attached to the DOM
        root.append(view());

        // if store types were already registered,
        // a re-render will be triggered
        await fetchCall();
    }
}

async function renderAppointmentsView(filterParams = {}) {
    await renderViewWithFetch("#contents", AppointmentsView,
        () => fetchAppointmentsToStore(filterParams));

    renderFilteredRecords('#appointment-list', 'appointments', Appointment, filterParams);
}

async function renderUsersView() {
    await renderViewWithFetch("#contents", UsersView,
        () => fetchAllOrSomeRecordsToStore('users'));
}


// apply a function to a collection of records, per record
// expects json payload of array of uniform objects
async function getProcessedRecordsFromJson(type, callback = (record) => { }) {
    const data = await (await fetch('/' + type, { method: 'GET' })).json();
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

    results.forEach((result) => {
        if (store.hasStore(result.type)) {
            // patch existing store
            store.mutate(result.type, (oldData) => {
                Array.from(result.map.values()).forEach(record => oldData.set(record.id, record));
                console.log(oldData);
                return oldData;
            });
        } else {
            store.registerStore(result.type, result.map);
        }
    });
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