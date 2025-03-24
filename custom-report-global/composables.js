const useSorter = data => {
    const sort_key = Vue.ref(null);
    const sort_order = Vue.ref(true);

    const set_key = key => {
        if (key === sort_key.value) {
            sort_order.value = !sort_order.value;
        } else {
            sort_order.value = true;
        }
        sort_key.value = key
    }

    const sorted = Vue.computed(() => {

        const arr = data

        if (sort_key.value == null || !arr.length || !(sort_key.value in arr[0])) {
            return [...arr];
        }

        return [...arr].sort((a, b) => {
            let f;
            if (typeof a[sort_key.value] === 'number') {
                f = a[sort_key.value] - b[sort_key.value];
            } else {
                f = String(a[sort_key.value]).localeCompare(String(b[sort_key.value]));
            }
            if (!sort_order.value) f *= -1;
            return f;
        });
    })

    return {
        set_key, sorted
    }
}

const useSingleSelection = (
    {placeholder, display_key} = {
        placeholder: "",
        display_key: null
    }
) => {
    const selected = Vue.ref(null)

    const is_selected = Vue.computed(() => !!selected.value)

    const selected_text = Vue.computed(() => {
        if (!is_selected.value) return placeholder
        if (!display_key) return selected.value
        return selected.value[display_key] || ""
    })

    const clear = () => selected.value = null
    const select = (v) => selected.value = v

    return {selected, is_selected, selected_text, clear, select}
}

const useModal = () => {
    const is_open = Vue.ref(false)

    const open = () => {
        is_open.value = true
    }
    const close = () => is_open.value = false

    return {is_open, open, close}
}


const useSearch = (search_fn = async() => []) => {

    const search_str = Vue.ref("");
    const searched = Vue.ref([]);

    const fill = (values) => {
        searched.value = values;
    }

    const has_searched = Vue.computed(() => {
        return !!searched.value.length
    })

    const clear = () => {
        searched.value = []
        search_str.value = "";
    }

    const search = async () => {
        const data = await search_fn()

        fill(data)
    }

    return {
        search_str,
        searched,
        fill,
        clear,
        has_searched,
        search
    }
}