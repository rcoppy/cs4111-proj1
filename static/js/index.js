import UserProfile from './components/UserProfile.js';
import Appointment from './components/Appointment.js';
import DataStore from './lib/DataStore.js';
import AppointmentsView from './views/AppointmentsView.js';
import UsersView from './views/UsersView.js';
import NavigationView from './views/NavigationView.js';
import EncountersView from './views/EncountersView.js';
import Encounter from './components/Encounter.js';
import MyPatientsView from './views/MyPatientsView.js';
import Patient from './components/Patient.js';

const store = new DataStore();

const providerPaths = new Map();
providerPaths.set("users", "User directory");
providerPaths.set("provider-appointments", "Appointments");
providerPaths.set("my-patients", "My patients");
providerPaths.set("encounters", "Encounters");

const patientPaths = new Map();
patientPaths.set("users", "User directory");
patientPaths.set("patient-appointments", "Appointments");
patientPaths.set("prescriptions", "My prescriptions");

export default function renderPage() {
    $(document).ready(function () {

        fetchAllOrSomeRecordsToStore('providers');

        initialUserHandlersSetup();

        // fetches data for first time
        renderUsersView().then(() => {
            // choose an active user
            const user = store.getRecords('users').values().next().value;
            console.log(user);
            store.mutate('activeUser', () => user);

            // bindViewsToNav();
        });
    });
}

function initialUserHandlersSetup() {
    if (!store.hasStore('users')) store.registerStore('users', new Map());
    if (!store.hasStore('activeUser')) store.registerStore('activeUser', {});

    store.registerHandler('activeUser', (user) => {
        console.log(user);
        $('#banner-data .first-name').text(user['firstName']);
        $('#banner-data .last-name').text(user['lastName']);
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
    store.registerHandler('activeUser', user => {
        updateSelectedUser(user);

        const data = checkIsUserProvider(user) ? providerPaths : patientPaths;
        renderView('#nav-menu', () => NavigationView(data));
        bindViewsToNav();
    });
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

    $('[data-path="encounters"]').click(() => {
        const user = store.getRecords('activeUser');
        const pvid = tryGetProviderIdForUser(user.id);

        renderEncountersView({ providerId: pvid });
    });

    $('[data-path="my-patients"]').click(() => {
        const user = store.getRecords('activeUser');
        const pvid = tryGetProviderIdForUser(user.id);

        renderMyPatientsView({ providerId: pvid });
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

function renderLambdaFilteredMappedRecords(targetSelector, type,
    component,
    filterLambda = (record) => { },
    mapperLambda = (record) => { }) {
    const element = $(targetSelector);

    // check element exists
    if (element.length) {
        // clear children

        // mapping is applied *before* filter
        const data = Array.from(store.getRecords(type).values())
            .map(record => mapperLambda(record))
            .filter(record => filterLambda(record)
            );

        if (data.length > 0) {
            element.empty();
            element.append(renderMultiple(component, data));
        }
    }
}

function renderLambdaFilteredRecords(targetSelector, type, component, filterLambda = () => { }) {
    renderLambdaFilteredMappedRecords(targetSelector, type, component, filterLambda, record => record);
}

function renderFilteredMappedRecords(targetSelector, type, component, filterParams = {}, mapperLambda = record => { }) {
    renderLambdaFilteredMappedRecords(targetSelector, type, component,
        (record) => {
            for (const [key, value] of Object.entries(filterParams)) {
                if (record[key] !== value) return false;
            }

            return true;
        }, mapperLambda);
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
async function renderView(targetSelector, view) {
    const root = $(targetSelector);
    root.empty();

    if (root.length) {

        // order matters--we want the fetch to trigger a re-render with state
        // *after* the view is attached to the DOM
        root.append(view());
    }
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

    await fetchRecordTypesToStore(['providers', 'patients']); 

    renderFilteredMappedRecords('#appointment-list', 'appointments', Appointment, filterParams, 
        appointment => {
            const provider = store.getRecords('providers').get(appointment.providerId);
            const patient = store.getRecords('patients').get(appointment.patientId);

            const pvUser = store.getRecords('users').get(provider.userId); 
            const ptUser = store.getRecords('users').get(patient.userId);

            const names = {
                patientName: `${ptUser.firstName} ${ptUser.lastName}`,
                providerName: `${pvUser.firstName} ${pvUser.lastName}, ${provider.role}`
            }

            return Object.assign({...appointment}, names); 
        });
}

async function renderEncountersView(filterParams = {}) {
    await renderViewWithFetch("#contents", EncountersView,
        () => fetchFilteredRecordsToStore('encounters', filterParams));

    const activeParams = Object.assign({ ...filterParams }, { dischargeDate: null });
    renderFilteredRecords('#active-encounters', 'encounters', Encounter, activeParams);

    renderLambdaFilteredRecords('#past-encounters', 'encounters', Encounter, encounter => {
        for (const [key, value] of Object.entries(filterParams)) {
            if (encounter[key] !== value) return false;
        }

        console.log(encounter);

        return encounter.dischargeDate !== null;
    });
}

async function renderMyPatientsView(filterParams = {}) {
    await renderViewWithFetch("#contents", MyPatientsView,
        () => fetchFilteredRecordsToStore('patients', filterParams));

    await fetchFilteredRecordsToStore('encounters', filterParams);

    const pvid = filterParams.providerId;

    const patientIds = Array.from(store.getRecords('encounters').values())
        .filter(e => e.providerId === pvid)
        .map(encounter => encounter.patientId);

    renderLambdaFilteredMappedRecords('#patients', 'patients', Patient,
        patient => patientIds.includes(patient.id),
        patient => {
            const user = store.getRecords('users').get(patient.userId);
            return Object.assign({ ...patient }, {
                firstName: user.firstName,
                lastName: user.lastName,
                // TODO: prescriptions 
            })
        });
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