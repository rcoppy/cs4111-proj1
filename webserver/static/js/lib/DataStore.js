export default class DataStore {
    constructor() {
        this.store = new Map();
    }

    get(key) {
        return this.store.get(key);
    }

    getRecords(type) {
        return this.store.get(type).data; 
    }

    getKeys() {
        return this.store.keys();
    }

    mutate(key, action = (data) => { return data; }) {
        // `action` must return the mutated passed argument. 
        const v = this.store.get(key);

        const newData = action(v.data);

        this.store.set(key, { data: newData, onMutate: v.onMutate });
        v.onMutate.forEach(f => f(newData));
    }

    // onMutate stores function delegates to be invoked on state change
    registerStore(key, data, onMutate = []) {
        this.store.set(key, { data: data, onMutate: onMutate });
    }

    registerHandler(key, handler = (newData) => { }) {
        const v = this.store.get(key);
        v.onMutate.push(handler);
        this.store.set(key, v);
    }

    forceInvokeHandlers() {
        Array.from(this.store.values()).forEach(
            v => v.onMutate.forEach(
                f => f(v.data)));
    }
}