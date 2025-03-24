const VTable = {
    props: {
        columns: {
          type: Array,
          required: true
        },
        rows: {
          type: Array,
          required: true
        }
    },

    setup(props) {
        const {set_key, sorted: sorted_rows} = useSorter(Vue.toRef(props, "rows"))

        return {
            set_key,
            sorted_rows
        }
    },

    template: `
        <div class="table_wrapper">
            <table class="table">
                <thead>
                    <tr>
                    <th v-for="column in columns" @click="set_key(column.key)">
                        {{column.value}}
                    </th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-for="row in sorted_rows">
                    <td v-for="column in columns">{{ row[column.key] }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `
}